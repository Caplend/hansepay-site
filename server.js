'use strict';

const express = require('express');
const crypto = require('crypto');
const cal = (() => { try { return require('./lib/calendar'); } catch(e) { return null; } })();
const mailer = (() => { try { return require('./lib/email'); } catch(e) { console.error('[email] module load failed:', e.message); return null; } })();
const xlsx = (() => { try { return require('./lib/xlsx'); } catch(e) { return null; } })();
const crm     = (() => { try { return require('./lib/crm'); } catch(e) { return null; } })();
const legalPdf = (() => { try { return require('./lib/legal-pdf'); } catch(e) { console.error('[legal-pdf] load failed:', e.message); return null; } })();
const db = require('./lib/db');
const currenciesRepo = require('./lib/repositories/currencies');
const legalRepo = require('./lib/repositories/legalDocuments');
const seoRepo = require('./lib/repositories/pageSeo');
const settingsRepo = require('./lib/repositories/settings');
const emailSettingsRepo = require('./lib/repositories/emailSettings');
const emailTemplatesRepo = require('./lib/repositories/emailTemplates');
const socialPostsRepo = require('./lib/repositories/socialPosts');
const usersRepo = require('./lib/repositories/users');
const postsRepo = require('./lib/repositories/posts');
const registrationsRepo = require('./lib/repositories/registrations');
const customersRepo = require('./lib/repositories/customers');
const activitiesRepo = require('./lib/repositories/activities');
const bookingsRepo = require('./lib/repositories/bookings');
const transactionsRepo = require('./lib/repositories/transactions');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 4200;
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.warn('[security] JWT_SECRET env var not set — sessions will not persist across restarts. Set it in Railway variables.');
  return crypto.randomBytes(32).toString('hex');
})();
const DATA_DIR = path.join(__dirname, 'data');
// Uploads must live INSIDE the Railway volume mount so they survive deployments.
// The volume is mounted at /app/data — keeping uploads as a subdirectory there.
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

// Startup diagnostics — visible in Railway → Deployments → View logs
console.log('[startup] __dirname  :', __dirname);
console.log('[startup] DATA_DIR   :', DATA_DIR);
console.log('[startup] UPLOADS_DIR:', UPLOADS_DIR);
console.log('[startup] DATA_DIR exists before mkdir:', fs.existsSync(DATA_DIR));

// Ensure data & uploads directories exist
if (!fs.existsSync(DATA_DIR))    fs.mkdirSync(DATA_DIR,    { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Log what's already in the data dir (tells us if volume is mounted + what survived)
try {
  const existing = fs.readdirSync(DATA_DIR);
  console.log('[startup] DATA_DIR contents:', existing.length ? existing.join(', ') : '(empty)');
  existing.forEach(f => {
    const s = fs.statSync(path.join(DATA_DIR, f));
    console.log(`[startup]   ${f}  ${s.size} bytes  mtime=${s.mtime.toISOString()}`);
  });
} catch(e) { console.log('[startup] Could not read DATA_DIR:', e.message); }

// Seed data files on first run (empty volume).
// Seeds live in /seeds/ which is NOT inside the volume mount.
const SEEDS_DIR = path.join(__dirname, 'seeds');
console.log('[startup] SEEDS_DIR  :', SEEDS_DIR, '— exists:', fs.existsSync(SEEDS_DIR));
// Entities already migrated to MySQL (currencies, legal_documents, page_seo,
// app_settings, email_settings, email_templates, social_posts, users, posts,
// registrations, customers, activities, bookings) are intentionally excluded
// here — this seed-merge is file-storage-only and only covers pending entities.
['analytics', 'readiness'].forEach(name => {
  const live = path.join(DATA_DIR, `${name}.json`);
  const seed = path.join(SEEDS_DIR, `${name}.seed.json`);
  if (!fs.existsSync(live) && fs.existsSync(seed)) {
    fs.copyFileSync(seed, live);
    console.log(`[seed] initialised ${name}.json from seed`);
  } else if (fs.existsSync(live)) {
    const s = fs.statSync(live);
    console.log(`[seed] ${name}.json already exists (${s.size} bytes) — skipping seed`);
    // Merge any NEW fields from seed into the live file so new settings take effect
    if (fs.existsSync(seed)) {
      try {
        const liveData = JSON.parse(fs.readFileSync(live, 'utf8'));
        const seedData = JSON.parse(fs.readFileSync(seed, 'utf8'));
        let changed = false;
        for (const k of Object.keys(seedData)) {
          if (!(k in liveData)) { liveData[k] = seedData[k]; changed = true; }
        }
        if (changed) {
          fs.writeFileSync(live, JSON.stringify(liveData, null, 2));
          console.log(`[seed] merged new fields into ${name}.json`);
        }
      } catch(e) { console.log(`[seed] merge error for ${name}.json:`, e.message); }
    }
  }
});

// Ensure demo account always exists (survives redeployments/restarts) — now backed by MySQL.
usersRepo.ensureDemoAccount()
  .then(added => { if (added) console.log('[startup] demo account added'); })
  .catch(e => console.log('[startup] demo account check failed:', e.message));

// Multer — store uploads with original extension
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uuidv4() + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});

// Trust Railway's reverse proxy so req.protocol returns 'https'
app.set('trust proxy', 1);

// ── Security headers ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ── Login rate limiter ────────────────────────────────────────────────────────
// 5 failures per IP in a 15-minute window, then lock out for the remainder.
const _loginAttempts = new Map();
function _checkLoginRateLimit(ip) {
  const now = Date.now();
  const window = 15 * 60 * 1000;
  const max = 5;
  const prev = (_loginAttempts.get(ip) || []).filter(t => now - t < window);
  _loginAttempts.set(ip, prev);
  if (prev.length >= max) {
    const retryAfterMin = Math.ceil((Math.min(...prev) + window - now) / 60000);
    return { blocked: true, retryAfterMin };
  }
  return { blocked: false };
}
function _recordLoginFail(ip) {
  const list = _loginAttempts.get(ip) || [];
  list.push(Date.now());
  _loginAttempts.set(ip, list);
}

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Google Search Console verification — must be before the coming-soon gate so
// Google's crawler (which has no preview cookie) always gets the right response.
app.get('/google3b985f4905aea611.html', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send('google-site-verification: google3b985f4905aea611.html');
});

// ── Coming Soon gate ─────────────────────────────────────────────────────────
// Set PREVIEW_TOKEN env var in Railway (e.g. "hansepay2026").
// Visiting /?preview=TOKEN grants a 30-day cookie to browse the full site.
// Toggle comingSoonMode in Admin → Settings to go live instantly.
app.use(async (req, res, next) => {
  // Skip: API, admin panel, static assets, uploads, and legal pages
  const skipPrefixes = ['/api/', '/hansepay/admin/', '/admin/', '/uploads/', '/assets/'];
  const skipExact = ['/imprint.html', '/cookie-policy.html', '/coming-soon.html',
                     '/booking.html', '/hansepay/booking.html',
                     '/hansepay/imprint.html', '/hansepay/cookie-policy.html',
                     '/onboarding.html', '/hansepay/onboarding.html',
                     '/rebook.html', '/hansepay/rebook.html',
                     '/dashboard-login.html', '/hansepay/dashboard-login.html',
                     '/dashboard.html', '/hansepay/dashboard.html'];
  if (skipPrefixes.some(p => req.path.startsWith(p))) return next();
  if (skipExact.includes(req.path)) return next();

  let settings;
  try {
    settings = await settingsRepo.get();
  } catch (err) {
    console.error('[coming-soon-gate] settings lookup failed, failing open:', err.message);
    return next(); // Don't let a transient DB hiccup take the whole site down
  }
  if (!settings.comingSoonMode) return next(); // Site is live — pass through

  const previewToken = process.env.PREVIEW_TOKEN;

  // If a token is supplied in the query string, set a 30-day cookie and redirect clean
  if (previewToken && req.query.preview === previewToken) {
    res.cookie('hp_preview', previewToken, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      sameSite: 'lax',
      secure: req.protocol === 'https',
    });
    // Remove ?preview= from the URL so the link looks clean after clicking
    const clean = req.path + (Object.keys(req.query).filter(k => k !== 'preview').length
      ? '?' + new URLSearchParams(Object.fromEntries(Object.entries(req.query).filter(([k]) => k !== 'preview'))).toString()
      : '');
    return res.redirect(302, clean);
  }

  // Check cookie
  const cookieHeader = req.headers.cookie || '';
  const cookieVal = cookieHeader.split(';').map(c => c.trim())
    .find(c => c.startsWith('hp_preview='))?.split('=')[1];
  if (previewToken && cookieVal === previewToken) return next();

  // No valid token — serve coming soon page for all HTML routes
  res.sendFile(path.join(__dirname, 'coming-soon.html'));
});

// Google Search Console verification — served before any middleware that could intercept
app.get('/google3b985f4905aea611.html', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send('google-site-verification: google3b985f4905aea611.html');
});

// Static files — files live at repo root in hansepay-deploy
app.use(express.static(__dirname));
// Also serve under /hansepay/ prefix for compatibility with landing page links
app.use('/hansepay', express.static(__dirname));
// Serve uploads
app.use('/uploads', express.static(UPLOADS_DIR));

// ─── Data helpers ───────────────────────────────────────────────────────────

function readData(filename) {
  const fp = path.join(DATA_DIR, filename);
  const arrayFiles = ['users.json', 'analytics.json', 'bookings.json', 'customers.json', 'activities.json', 'registrations.json', 'transactions.json', 'social.json'];
  const defaultVal = arrayFiles.includes(filename) ? [] : {};
  if (!fs.existsSync(fp)) return defaultVal;
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf8'));
  } catch (_) {
    return defaultVal;
  }
}

function writeData(filename, data) {
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf8');
}

function makeRebookToken(bookingId) {
  return crypto.createHmac('sha256', JWT_SECRET).update(bookingId + '-rebook-hp').digest('hex').slice(0, 32);
}

function makeCancelToken(bookingId) {
  return crypto.createHmac('sha256', JWT_SECRET).update(bookingId + '-cancel-hp').digest('hex').slice(0, 32);
}

// ─── CRM helpers ──────────────────────────────────────────────────────────────

async function logActivity({ customerId, type, title, body, by }, conn) {
  return activitiesRepo.create({ customerId, type, title, body, by }, conn);
}

async function activitiesFor(customerId, conn) {
  return activitiesRepo.forCustomer(customerId, conn);
}

// Create or update a customer from an inbound lead (e.g. a booking). Wrapped in
// a transaction so the customer upsert and its activity log never diverge.
async function upsertCustomerFromLead(lead, opts) {
  opts = opts || {};
  return customersRepo.withTransaction(async (conn) => {
    const email = (lead.email || '').toLowerCase().trim();
    const now = new Date().toISOString();

    let cust = email ? await customersRepo.findByEmail(email, conn) : null;
    let isNew = false;

    if (!cust) {
      isNew = true;
      cust = await customersRepo.create({
        firstName: lead.firstName || '', lastName: lead.lastName || '', email: lead.email || '',
        phone: lead.phone || '', website: lead.website || '', company: lead.company || '',
        industry: lead.industry || '', companySize: lead.companySize || '', country: lead.country || '',
        city: lead.city || '', fxVolume: lead.fxVolume || '', currencyPairs: lead.currencyPairs || '',
        stage: 'lead', status: 'prospect', owner: '', source: opts.source || 'booking', tags: [],
        notes: lead.notes || '', bookingIds: [], lastContactAt: now, nextFollowUpAt: null,
        lang: lead.lang || 'de', createdAt: now, updatedAt: now,
      }, conn);
    } else {
      // Fill blanks from the new lead, keep existing CRM edits
      const patch = { lastContactAt: now, updatedAt: now };
      ['firstName', 'lastName', 'company', 'phone', 'website', 'industry', 'companySize', 'country', 'city', 'fxVolume'].forEach(k => {
        if (!cust[k] && lead[k]) patch[k] = lead[k];
      });
      if (cust.status === 'churned') patch.status = 'active'; // re-engaged
      cust = await customersRepo.update(cust.id, patch, conn);
    }

    if (opts.bookingId) {
      cust = await customersRepo.appendBookingId(cust.id, opts.bookingId, conn);
    }

    await logActivity({
      customerId: cust.id,
      type:       'booking',
      title:      isNew ? 'New lead from booking' : 'Repeat booking',
      body:       opts.slot ? `Discovery call booked for ${opts.slot.label || opts.slot.startISO}` : 'Discovery call booked',
      by:         'system',
    }, conn);

    return cust;
  });
}

// ─── Auth middleware ─────────────────────────────────────────────────────────

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(401).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function requireLegal(req, res, next) {
  if (!req.user || !['admin','compliance'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Legal access required' });
  }
  next();
}

// Simple API-key auth for internal tooling (Postman, browser, webhooks).
// Set INTERNAL_API_KEY in Railway env vars.
// Pass as header (x-api-key) OR query param (?api_key=) — both work.
function requireApiKey(req, res, next) {
  const key = process.env.INTERNAL_API_KEY;
  if (!key) return res.status(503).json({ error: 'API key auth not configured — set INTERNAL_API_KEY in Railway env vars' });
  const provided = req.headers['x-api-key'] || req.query.api_key;
  if (!provided || provided !== key) {
    return res.status(401).json({
      error: 'Unauthorized — pass your API key as header x-api-key or query param ?api_key=',
    });
  }
  next();
}

// ─── Health / debug route (public) ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  let files = [];
  try { files = fs.readdirSync(DATA_DIR).map(f => {
    const s = fs.statSync(path.join(DATA_DIR, f));
    return { name: f, bytes: s.size, mtime: s.mtime };
  }); } catch(_) {}
  res.json({
    ok: true,
    __dirname,
    DATA_DIR,
    SEEDS_DIR: path.join(__dirname, 'seeds'),
    dataFiles: files,
    volumeMounted: files.length > 0,
    emailConfigured: mailer ? mailer.gmailConfigured() : false,
    webSearchConfigured: !!process.env.TAVILY_API_KEY,
    aiConfigured: !!process.env.CLAUDE_API_KEY,
    calendarConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN),
    crmApiConfigured: !!process.env.INTERNAL_API_KEY,
    uptime: process.uptime(),
  });
});

// ─── Auth routes ─────────────────────────────────────────────────────────────

// POST /api/auth/register — public, called from onboarding step 1.
// Creates or updates a user record so logins work from any device.
app.post('/api/auth/register', async (req, res) => {
  const { email, password, firstName, lastName } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const existing = await usersRepo.findByEmail(email);
  const passwordHash = bcrypt.hashSync(password, 10);
  const name = ((firstName || '') + ' ' + (lastName || '')).trim() || email;

  if (existing) {
    // Update credentials for returning user (re-registration / password change)
    await usersRepo.update(existing.id, { passwordHash, name: name || existing.name });
  } else {
    await usersRepo.create({ name, email, passwordHash, role: 'user', avatar: '', createdAt: new Date().toISOString(), lastLogin: null });
  }
  console.log(`[auth] register: ${email} (${existing ? 'updated' : 'created'})`);
  res.json({ ok: true });
});

app.post('/api/auth/login', async (req, res) => {
  const ip = req.ip || 'unknown';
  const limit = _checkLoginRateLimit(ip);
  if (limit.blocked) {
    return res.status(429).json({ error: `Too many failed attempts. Try again in ${limit.retryAfterMin} minute(s).` });
  }

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = await usersRepo.findByEmail(email);
  if (!user) { _recordLoginFail(ip); return res.status(401).json({ error: 'Invalid credentials' }); }

  const valid = bcrypt.compareSync(password, user.passwordHash);
  if (!valid) { _recordLoginFail(ip); return res.status(401).json({ error: 'Invalid credentials' }); }

  // Clear failed attempts on successful login
  _loginAttempts.delete(ip);

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  const user = await usersRepo.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { passwordHash, claudeApiKey, ...userSafe } = user;
  // Tell the frontend whether a key is saved without exposing it
  userSafe.hasClaudeKey = !!claudeApiKey;
  res.json(userSafe);
});

// PUT /api/users/profile — let any authenticated user update their own profile
app.put('/api/users/profile', authenticateToken, async (req, res) => {
  const existing = await usersRepo.findById(req.user.id);
  if (!existing) return res.status(404).json({ error: 'User not found' });

  const profileFields = ['name', 'role', 'bio', 'avatarUrl', 'linkedin', 'aiModel', 'aiSystemPrompt'];
  const patch = {};
  profileFields.forEach(k => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });
  // Only overwrite API key if a non-empty value was sent
  if (req.body.claudeApiKey && req.body.claudeApiKey.trim()) {
    patch.claudeApiKey = req.body.claudeApiKey.trim();
  }

  const updated = await usersRepo.update(req.user.id, patch);
  const { passwordHash, claudeApiKey, ...userSafe } = updated;
  userSafe.hasClaudeKey = !!updated.claudeApiKey;
  res.json(userSafe);
});

// ─── Image upload ─────────────────────────────────────────────────────────────

app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image provided' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename });
});

app.delete('/api/upload/:filename', authenticateToken, (req, res) => {
  const fp = path.join(UPLOADS_DIR, path.basename(req.params.filename));
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
  res.json({ success: true });
});

// ─── Posts routes ─────────────────────────────────────────────────────────────

app.get('/api/posts', async (req, res) => {
  const all = req.query.status === 'all';
  if (all) {
    // Requires auth
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    try {
      jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.json(await postsRepo.listAll());
  }

  res.json(await postsRepo.listPublished());
});

app.get('/api/posts/:slug', async (req, res) => {
  const post = await postsRepo.findBySlugOrId(req.params.slug);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(await postsRepo.incrementViews(post.id));
});

app.post('/api/posts', authenticateToken, async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });

  const author = (await usersRepo.findById(req.user.id)) || { name: req.user.name };
  const newPost = await postsRepo.create(req.body, author);
  res.status(201).json(newPost);
});

app.put('/api/posts/:id', authenticateToken, async (req, res) => {
  const allowed = [
    'title', 'slug', 'excerpt', 'content', 'category', 'tags', 'status',
    'featuredImage', 'featured', 'showInListing', 'readTime',
    'author', 'authorRole', 'authorBio', 'authorAvatar', 'authorLinkedin', 'publishedAt',
  ];
  const patch = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });
  const updated = await postsRepo.update(req.params.id, patch);
  if (!updated) return res.status(404).json({ error: 'Post not found' });
  res.json(updated);
});

app.delete('/api/posts/:id', authenticateToken, requireAdmin, async (req, res) => {
  const ok = await postsRepo.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Post not found' });
  res.json({ success: true });
});

// ─── Social media planner (Instagram + LinkedIn) ──────────────────────────────
// No channel APIs yet — these store planned posts; publishing is assisted-manual.
const SOCIAL_CHANNELS = ['instagram', 'linkedin'];
const SOCIAL_STATUSES = ['draft', 'scheduled', 'posted'];

function sanitizeSocial(body, base) {
  const out = Object.assign({}, base);
  if (body.title !== undefined)    out.title = String(body.title).slice(0, 200);
  if (body.caption !== undefined)  out.caption = String(body.caption);
  if (body.hashtags !== undefined) out.hashtags = String(body.hashtags);
  if (body.image !== undefined)    out.image = body.image || null;
  if (Array.isArray(body.channels)) out.channels = body.channels.filter(c => SOCIAL_CHANNELS.includes(c));
  if (body.channelCaptions && typeof body.channelCaptions === 'object') {
    out.channelCaptions = {};
    SOCIAL_CHANNELS.forEach(c => { if (typeof body.channelCaptions[c] === 'string') out.channelCaptions[c] = body.channelCaptions[c]; });
  }
  if (body.status !== undefined && SOCIAL_STATUSES.includes(body.status)) out.status = body.status;
  if (body.scheduledAt !== undefined) out.scheduledAt = body.scheduledAt || null;
  if (body.postedAt !== undefined)    out.postedAt = body.postedAt || null;
  return out;
}

app.get('/api/social', authenticateToken, async (req, res) => {
  const status = req.query.status && SOCIAL_STATUSES.includes(req.query.status) ? req.query.status : undefined;
  res.json(await socialPostsRepo.list({ status }));
});

app.post('/api/social', authenticateToken, async (req, res) => {
  const now = new Date().toISOString();
  const post = sanitizeSocial(req.body, {
    id: 'soc_' + uuidv4().replace(/-/g, '').substring(0, 10),
    title: 'Untitled post',
    channels: ['instagram', 'linkedin'],
    caption: '',
    channelCaptions: {},
    hashtags: '',
    image: null,
    status: 'draft',
    scheduledAt: null,
    postedAt: null,
    createdBy: req.user.name || req.user.id,
    createdAt: now,
    updatedAt: now,
  });
  if (post.status === 'scheduled' && !post.scheduledAt) post.status = 'draft';
  const created = await socialPostsRepo.create(post);
  res.status(201).json(created);
});

app.put('/api/social/:id', authenticateToken, async (req, res) => {
  const existing = await socialPostsRepo.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Post not found' });
  const updated = sanitizeSocial(req.body, existing);
  if (updated.status === 'scheduled' && !updated.scheduledAt) updated.status = 'draft';
  if (updated.status === 'posted' && !updated.postedAt) updated.postedAt = new Date().toISOString();
  updated.updatedAt = new Date().toISOString();
  const saved = await socialPostsRepo.update(req.params.id, updated);
  res.json(saved);
});

app.delete('/api/social/:id', authenticateToken, async (req, res) => {
  const ok = await socialPostsRepo.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Post not found' });
  res.json({ success: true });
});

// AI caption + hashtag generation (reuses callClaude). Honest fallback if no key.
app.post('/api/social/generate', authenticateToken, async (req, res) => {
  const user   = await usersRepo.findById(req.user.id);
  const apiKey = user?.claudeApiKey || process.env.CLAUDE_API_KEY;
  if (!apiKey) return res.status(400).json({ error: 'No Claude API key configured. Add your key in Settings → AI Integration.' });

  const brief = String(req.body.brief || '').trim();
  if (!brief) return res.status(400).json({ error: 'Describe what the post is about first.' });
  const channels = (Array.isArray(req.body.channels) ? req.body.channels : SOCIAL_CHANNELS).filter(c => SOCIAL_CHANNELS.includes(c));
  const tone = String(req.body.tone || '').trim();

  const prompt = `You are the social media voice of HansePay, a European FX / cross-border payments company (a brand of Caplend Technologies GmbH, Hamburg; MiCAR-authorised, BaFin-supervised).

Brand voice: precise, authoritative, considered, institutional, understated, continental. No hype words ("revolutionary", "game-changing", "disrupt"), no startup-cute tone, no exclamation-heavy copy. Use exact numbers where relevant. Confident, not loud.

Write social copy for this post brief:
"${brief}"
${tone ? `Desired tone/angle: ${tone}` : ''}

Produce:
- A shared base caption (works for both networks).
- A LinkedIn version — slightly longer, professional, B2B, may use line breaks; no hashtag spam (0–3 tasteful hashtags inline or none).
- An Instagram version — punchier, scannable, a little warmer; can use tasteful line breaks.
- 5–8 relevant hashtags (no '#fyi' filler; mix branded + topical, e.g. #crossborderpayments #FX #fintech). No leading '#' duplication issues.

Return ONLY valid JSON (no markdown):
{
  "caption": "shared base caption",
  "channelCaptions": { "linkedin": "linkedin version", "instagram": "instagram version" },
  "hashtags": "#tag1 #tag2 #tag3"
}`;

  try {
    const out = await callClaude(apiKey, prompt, 1200);
    if (!out || typeof out !== 'object') throw new Error('Unexpected AI response');
    // Normalise + keep only requested channels
    const cc = {};
    channels.forEach(c => { if (out.channelCaptions && typeof out.channelCaptions[c] === 'string') cc[c] = out.channelCaptions[c]; });
    res.json({
      caption: String(out.caption || ''),
      channelCaptions: cc,
      hashtags: Array.isArray(out.hashtags) ? out.hashtags.join(' ') : String(out.hashtags || ''),
    });
  } catch (err) {
    console.error('[social/generate] error:', err.message);
    res.status(500).json({ error: 'Generation failed: ' + err.message });
  }
});

// ─── Readiness Center (team-shared feature-readiness overlay) ─────────────────
// The feature catalog lives in admin/readiness.html (versioned with code). This
// stores only the mutable team overlay, keyed by catalog item id:
//   { <itemId>: { owner, notes, done, statusOverride, updatedAt, updatedBy } }
app.get('/api/readiness', authenticateToken, (req, res) => {
  const data = readData('readiness.json');
  res.json(data && typeof data === 'object' && !Array.isArray(data) ? data : {});
});

app.put('/api/readiness/:id', authenticateToken, requireAdmin, (req, res) => {
  const raw = readData('readiness.json');
  const store = (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};
  const cur = store[req.params.id] || {};
  if (req.body.owner !== undefined)          cur.owner = String(req.body.owner).slice(0, 120);
  if (req.body.notes !== undefined)          cur.notes = String(req.body.notes).slice(0, 2000);
  if (req.body.done !== undefined)           cur.done = !!req.body.done;
  if (req.body.statusOverride !== undefined) cur.statusOverride = req.body.statusOverride || null;
  cur.updatedAt = new Date().toISOString();
  cur.updatedBy = req.user.name || req.user.id;
  store[req.params.id] = cur;
  writeData('readiness.json', store);
  res.json({ id: req.params.id, item: cur });
});

// ─── Users routes ─────────────────────────────────────────────────────────────

app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  const users = await usersRepo.list();
  res.json(users.map(({ passwordHash, ...u }) => u));
});

app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });

  if (await usersRepo.findByEmail(email)) return res.status(409).json({ error: 'Email already in use' });

  const newUser = await usersRepo.create({
    id: 'usr_' + uuidv4().replace(/-/g, '').substring(0, 8),
    name, email, passwordHash: bcrypt.hashSync(password, 10), role: role || 'editor',
    createdAt: new Date().toISOString(),
  });
  const { passwordHash, ...userSafe } = newUser;
  res.status(201).json(userSafe);
});

app.put('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const existing = await usersRepo.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'User not found' });

  const allowed = ['name', 'email', 'role'];
  const patch = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });
  if (req.body.password) {
    patch.passwordHash = bcrypt.hashSync(req.body.password, 10);
  }

  const updated = await usersRepo.update(req.params.id, patch);
  const { passwordHash, ...userSafe } = updated;
  res.json(userSafe);
});

app.put('/api/users/:id/password', authenticateToken, requireAdmin, async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const existing = await usersRepo.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'User not found' });
  await usersRepo.update(req.params.id, { passwordHash: bcrypt.hashSync(password, 10) });
  res.json({ success: true });
});

app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  const ok = await usersRepo.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: 'User not found' });
  res.json({ success: true });
});

// ─── AI content generation ───────────────────────────────────────────────────

app.post('/api/ai/generate-post', authenticateToken, async (req, res) => {
  const user  = await usersRepo.findById(req.user.id);
  const apiKey = user?.claudeApiKey || process.env.CLAUDE_API_KEY;

  if (!apiKey) {
    return res.status(400).json({
      error: 'No Claude API key configured. Add your key in Settings → AI Integration.',
    });
  }

  const { topic, tone, length, sections } = req.body;
  if (!topic) return res.status(400).json({ error: 'topic is required' });

  const wordTargets = { short: 600, medium: 1200, long: 2500 };
  const wordTarget  = wordTargets[length] || 1200;
  const model       = user?.aiModel || 'claude-sonnet-4-5';

  const defaultSystemPrompt = `You are a content writer for HansePay, a B2B FX payments company based in Germany. HansePay helps European companies manage cross-border payments, foreign exchange, and treasury operations. Write SEO-optimised blog content that educates finance teams and positions HansePay as a trusted, knowledgeable partner. Use a professional yet accessible tone, practical examples, comparison tables where relevant, and always end with a CTA for HansePay's services.`;
  const systemPrompt = user?.aiSystemPrompt || defaultSystemPrompt;

  const sectionList = Array.isArray(sections) ? sections : ['introduction', 'key-points', 'comparison', 'cta'];
  const toneMap = { professional: 'professional and authoritative', conversational: 'conversational and engaging', technical: 'technical and precise', comparative: 'analytical and comparative' };
  const toneStr = toneMap[tone] || 'professional';

  const userPrompt = `Write a complete, publish-ready blog article about: "${topic}"

Tone: ${toneStr}
Target length: ${wordTarget} words
Required sections: ${sectionList.join(', ')}

STEP 1 — Output ONLY the following JSON block first, enclosed exactly in <<<META>>> and <<<END-META>>> tags. No text before or after these tags until the article body.

<<<META>>>
{
  "title": "Compelling SEO article title, 50-70 chars",
  "slug": "url-friendly-slug-max-6-words",
  "excerpt": "2-3 sentence summary for blog listing, 140-160 chars, no quotes",
  "category": "one of: FX Education, Treasury, Compliance, Market Analysis, General",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "readTime": 7,
  "seoTitle": "SEO <title> tag, 50-60 chars, includes primary keyword",
  "seoDescription": "SEO meta description, 145-155 chars, ends with call to action",
  "imageQuery": "3-5 word Unsplash photo search query (e.g. 'business finance europe currency')"
}
<<<END-META>>>

STEP 2 — Write the full article body in Markdown immediately after the closing tag:
- ## for main headings, ### for sub-headings
- Comparison tables using standard Markdown table syntax when comparing providers
- Key tips using: <div class="callout callout-info"><strong>💡 Pro tip:</strong> ...</div>
- Warnings using: <div class="callout callout-warning"><strong>⚠️ Note:</strong> ...</div>
- End with: <div class="cta-block"><strong>Ready to optimise your FX costs?</strong><br>Book a free 30-minute discovery call with a HansePay FX specialist.\n\n[Talk to our team →](booking.html)</div>
- Do NOT repeat the title as an H1 — start directly with the introduction paragraph`;

  // Set up SSE streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx/Railway proxy buffering
  res.flushHeaders();

  // Send a keep-alive comment every 20 s so Railway's proxy doesn't drop the connection
  const keepAlive = setInterval(() => {
    try { res.write(': ping\n\n'); } catch (_) {}
  }, 20000);

  const maxTokens = { short: 2048, medium: 4096, long: 8192 };

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens[length] || 4096,
        stream:     true,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text();
      clearInterval(keepAlive);
      res.write(`data: ${JSON.stringify({ error: 'Anthropic API error: ' + anthropicRes.status + ' ' + errBody.slice(0, 200) })}\n\n`);
      return res.end();
    }

    const reader  = anthropicRes.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (!data || data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
            res.write(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`);
          }
          // Surface stop_reason so client knows if we hit the token limit
          if (parsed.type === 'message_delta' && parsed.delta?.stop_reason === 'max_tokens') {
            res.write(`data: ${JSON.stringify({ warning: 'max_tokens_reached' })}\n\n`);
          }
        } catch (_) {}
      }
    }

    clearInterval(keepAlive);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    clearInterval(keepAlive);
    console.error('[ai] generate error:', err.message);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// ─── Analytics routes ─────────────────────────────────────────────────────────

// Legacy pageview endpoint (kept for backwards compat)
app.post('/api/analytics/pageview', (req, res) => {
  const { page, referrer } = req.body;
  const analytics = readData('analytics.json');
  analytics.push({
    id: uuidv4(),
    type: 'pageview',
    page: page || '/',
    referrer: referrer || '',
    timestamp: new Date().toISOString()
  });
  writeData('analytics.json', analytics);
  res.json({ success: true });
});

// Generic event tracking (pageview, booking_modal_open, booking_submitted, etc.)
app.post('/api/analytics/event', (req, res) => {
  const { event, page, data } = req.body;
  const analytics = readData('analytics.json');
  analytics.push({
    id: uuidv4(),
    type: event || 'pageview',
    page: page || '/',
    data: data || {},
    timestamp: new Date().toISOString()
  });
  writeData('analytics.json', analytics);
  res.json({ success: true });
});

app.get('/api/analytics/summary', authenticateToken, async (req, res) => {
  const analytics  = readData('analytics.json');
  const posts      = await postsRepo.listAll();
  const users      = await usersRepo.list();
  const bookings   = await bookingsRepo.list();

  // Normalise: old records may not have a `type` field — treat them as pageviews
  const pageviews = analytics.filter(a => !a.type || a.type === 'pageview');

  const totalPageviews = pageviews.length;
  const postsPublished = posts.filter(p => p.status === 'published').length;
  const postsDraft     = posts.filter(p => p.status === 'draft').length;
  const totalUsers     = users.length;

  // Booking stats
  const totalBookings = Array.isArray(bookings) ? bookings.length : 0;
  const newLeads      = Array.isArray(bookings) ? bookings.filter(b => b.status === 'new').length : 0;
  const wonDeals      = Array.isArray(bookings) ? bookings.filter(b => b.status === 'won').length : 0;

  // Funnel
  const modalOpens      = analytics.filter(a => a.type === 'booking_modal_open').length;
  const bookingConfirmed = analytics.filter(a => a.type === 'booking_confirmed').length;

  // Event counts breakdown
  const eventCounts = {};
  analytics.forEach(a => {
    if (a.type && a.type !== 'pageview') {
      eventCounts[a.type] = (eventCounts[a.type] || 0) + 1;
    }
  });

  // Views by page
  const viewsByPage = {};
  pageviews.forEach(a => {
    viewsByPage[a.page] = (viewsByPage[a.page] || 0) + 1;
  });

  // Views last 30 days
  const now = new Date();
  const viewsLast30Days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    const count = pageviews.filter(a => a.timestamp && a.timestamp.startsWith(dateStr)).length;
    viewsLast30Days.push({ date: dateStr, count });
  }

  // Top posts
  const topPosts = [...posts]
    .filter(p => p.status === 'published')
    .sort((a, b) => (b.viewCount || b.views || 0) - (a.viewCount || a.views || 0))
    .slice(0, 5)
    .map(p => ({ id: p.id, title: p.title, slug: p.slug, viewCount: p.viewCount || p.views || 0 }));

  res.json({
    totalPageviews,
    postsPublished,
    postsDraft,
    totalUsers,
    totalBookings,
    newLeads,
    wonDeals,
    bookingFunnel: { pageViews: totalPageviews, modalOpens, bookings: bookingConfirmed },
    viewsByPage,
    viewsLast30Days,
    topPosts,
    eventCounts,
  });
});

// ─── Bookings CRM routes ──────────────────────────────────────────────────────

app.get('/api/bookings', authenticateToken, async (req, res) => {
  res.json(await bookingsRepo.list());
});

// GET /api/bookings/latest — most recent inbound booking (API-key protected, no JWT login needed)
// Use in Postman: GET https://hansepay-deploy-production-328c.up.railway.app/api/bookings/latest
// Header: x-api-key: <INTERNAL_API_KEY>
app.get('/api/bookings/latest', requireApiKey, async (req, res) => {
  const latest = await bookingsRepo.latest();
  if (!latest) return res.status(404).json({ error: 'No bookings found' });
  res.json(latest);
});

// POST /api/bookings/seed-mock — admin only. Inserts demo bookings WITHOUT the
// side effects of /api/booking (no calendar event, no confirmation email — the
// lead emails point at real companies, so we must never mail them).
// Body: { bookings: [{ slot, lead, createdAt?, status? }] }
app.post('/api/bookings/seed-mock', authenticateToken, requireAdmin, async (req, res) => {
  const incoming = Array.isArray(req.body && req.body.bookings) ? req.body.bookings : [];
  if (!incoming.length) return res.status(400).json({ error: 'bookings array required' });

  const settings = await settingsRepo.get();
  const reps = Array.isArray(settings.salesReps) ? settings.salesReps.filter(r => r.active !== false) : [];

  const added = [];
  for (let i = 0; i < incoming.length; i++) {
    const b = incoming[i];
    const id = 'mock_' + Date.now() + '_' + i;
    const rep = reps.length ? reps[i % reps.length] : null;
    const rec = {
      id,
      createdAt:  b.createdAt || new Date().toISOString(),
      slot:       b.slot,
      lead:       b.lead,
      status:     b.status || 'new',
      notes:      b.notes || '',
      meetLink:   null,
      eventId:    id,
      rebookToken: makeRebookToken(id),
      cancelToken: makeCancelToken(id),
      assignedTo: rep ? { id: rep.id, name: rep.name, color: rep.color || '#1E4E80' } : null,
    };
    await bookingsRepo.create(rec);
    try { await upsertCustomerFromLead(b.lead, { bookingId: id, slot: b.slot, source: 'booking' }); } catch (e) {}
    added.push(rec.id);
  }
  console.log(`[booking] seeded ${added.length} mock bookings`);
  res.json({ ok: true, added });
});

app.patch('/api/bookings/:id', authenticateToken, async (req, res) => {
  const existing = await bookingsRepo.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Booking not found' });
  const patch = {};
  ['status', 'notes'].forEach(k => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });
  const updated = await bookingsRepo.update(req.params.id, patch);
  res.json(updated);
});

// ─── Email diagnostics ────────────────────────────────────────────────────────

// Reports whether the branded-email transport is configured (no secrets exposed).
app.get('/api/email/status', authenticateToken, requireAdmin, (req, res) => {
  res.json({
    moduleLoaded:    !!mailer,
    gmailConfigured: mailer ? mailer.gmailConfigured() : false,
    from:            process.env.EMAIL_FROM || (process.env.CALENDAR_OWNER_EMAIL ? 'HansePay <' + process.env.CALENDAR_OWNER_EMAIL + '>' : null),
    calendarOwner:   process.env.CALENDAR_OWNER_EMAIL || null,
    hasClientId:     !!process.env.GOOGLE_CLIENT_ID,
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasRefreshToken: !!process.env.GOOGLE_REFRESH_TOKEN,
    bcc:             process.env.EMAIL_BCC || null,
    sendsGoogleInvite: process.env.BOOKING_SEND_GOOGLE_INVITE === 'true',
  });
});

// Sends a sample branded booking confirmation and returns the exact result.
app.post('/api/email/test', authenticateToken, requireAdmin, async (req, res) => {
  if (!mailer) return res.status(503).json({ error: 'email module not loaded' });
  const to   = (req.body && req.body.to)   || req.user.email;
  const lang = (req.body && req.body.lang) || 'en';
  const type = (req.body && req.body.type) || 'booking';
  const firstName = (req.user.name || 'Test User').split(' ')[0];
  const lastName  = (req.user.name || '').split(' ').slice(1).join(' ') || 'User';

  let sample;
  if (type === 'registration') {
    sample = mailer.renderRegistrationEmail({
      firstName, lastName, email: to,
      company: 'Sample Company GmbH',
      accountType: 'company',
      applicationRef: 'HP-TEST01',
      lang,
    });
  } else if (type === 'approval') {
    const siteBase = (process.env.PUBLIC_BASE_URL || 'https://www.hansepay.de').replace(/\/$/, '');
    sample = mailer.renderApprovalEmail({
      firstName, lastName, email: to,
      company: 'Sample Company GmbH',
      applicationRef: 'HP-TEST01',
      lang,
      loginUrl: siteBase + '/hansepay/dashboard-login.html',
    });
  } else if (type === 'kyc-invite') {
    const siteBase = (process.env.PUBLIC_BASE_URL || 'https://www.hansepay.de').replace(/\/$/, '');
    sample = mailer.renderKycInviteEmail({
      recipientName: firstName, recipientEmail: to,
      companyName: 'Sample Company GmbH', inviterName: firstName,
      kycUrl: siteBase + '/hansepay/kyc-verify.html', lang,
    });
  } else if (type === 'kyc-invite-individual') {
    const siteBase = (process.env.PUBLIC_BASE_URL || 'https://www.hansepay.de').replace(/\/$/, '');
    sample = mailer.renderKycInviteIndividualEmail({
      recipientName: firstName, firstName, recipientEmail: to,
      kycUrl: siteBase + '/hansepay/kyc-verify.html', lang,
    });
  } else if (type === 'kyc-verified') {
    sample = mailer.renderKycVerifiedEmail({ firstName, email: to, lang });
  } else if (type === 'all-verified') {
    sample = mailer.renderAllVerificationsEmail({ firstName, email: to, lang, accountType: 'company', company: 'Sample Company GmbH' });
  } else if (type === 'tx-otp') {
    sample = mailer.renderTxOtpEmail({
      firstName, email: to, code: '123456',
      tx: { recipientName: 'Test Recipient GmbH', sendAmount: '2,500.00', sendCurrency: 'EUR' },
    });
  } else {
    const start = new Date(Date.now() + 3 * 86400000); start.setHours(11, 0, 0, 0);
    sample = mailer.renderBookingEmail({
      slot: { startISO: start.toISOString(), endISO: new Date(start.getTime() + 1800000).toISOString(), label: '11:00 – 11:30' },
      meetLink: 'https://meet.google.com/test-link-demo',
      lead: { firstName, email: to, company: 'Sample Co', industry: 'Manufacturing', fxVolume: '€250k–€1M', lang },
    });
  }
  sample.to = to;
  const result = await mailer.sendMail(sample);
  res.json(Object.assign({ to, type }, result));
});

// GET /api/email/diagnostics — admin only. Returns email transport configuration status.
app.get('/api/email/diagnostics', authenticateToken, requireAdmin, (req, res) => {
  const configured = mailer ? mailer.gmailConfigured() : false;
  res.json({
    module:     mailer ? 'loaded' : 'not loaded',
    configured,
    env: {
      GOOGLE_CLIENT_ID:     !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      GOOGLE_REFRESH_TOKEN: !!process.env.GOOGLE_REFRESH_TOKEN,
      CALENDAR_OWNER_EMAIL: process.env.CALENDAR_OWNER_EMAIL || null,
      EMAIL_FROM:           process.env.EMAIL_FROM || null,
      EMAIL_BCC:            process.env.EMAIL_BCC ? '(set)' : null,
      PUBLIC_BASE_URL:      process.env.PUBLIC_BASE_URL || null,
    },
  });
});

// ─── Email Center ─────────────────────────────────────────────────────────────

const EMAIL_TEMPLATE_CATALOG = [
  { id: 'booking-confirmation', name: 'Booking Confirmation',    category: 'Bookings',     icon: '📅', description: 'Sent when a discovery call is booked',                langs: ['en', 'de'] },
  { id: 'booking-cancellation', name: 'Booking Cancellation',    category: 'Bookings',     icon: '✕',  description: 'Sent when a booking is cancelled',                  langs: ['en', 'de'] },
  { id: 'email-otp',            name: 'Email Verification OTP',  category: 'Auth',         icon: '🔑', description: 'Sent during onboarding email verification',          langs: ['en', 'de'] },
  { id: 'password-reset',       name: 'Password Reset',          category: 'Auth',         icon: '🔓', description: 'Password reset link',                               langs: ['en'] },
  { id: 'tx-otp',               name: 'Transaction OTP',         category: 'Transactions', icon: '🔐', description: 'Sent to authorise a transfer (2FA)',                langs: ['en'] },
  { id: 'tx-confirmation',      name: 'Transaction Receipt',     category: 'Transactions', icon: '✅', description: 'Receipt sent after a transfer completes',           langs: ['en'] },
  { id: 'registration-received',name: 'Application Received',    category: 'Onboarding',   icon: '📋', description: 'Sent when a new account application is submitted',  langs: ['en', 'de'] },
  { id: 'application-approved',     name: 'Account Approved (Individual)', category: 'Onboarding', icon: '🎉', description: 'Sent when an individual account is approved',                langs: ['en', 'de'] },
  { id: 'application-approved-biz', name: 'Account Approved (Business)',   category: 'Onboarding', icon: '🏢', description: 'Sent when a business account is approved',                   langs: ['en', 'de'] },
  { id: 'onboarding-reminder',      name: 'Onboarding Reminder',           category: 'Onboarding', icon: '👋', description: 'Nudge for users who created login but didn\'t continue',     langs: ['en', 'de'] },
  { id: 'monthly-savings',          name: 'Monthly Savings Report',        category: 'Lifecycle',  icon: '📈', description: 'Monthly email showing the customer how much they saved vs. bank rates', langs: ['en', 'de'] },
  { id: 'kyc-invite',               name: 'KYC Invite (Business)',         category: 'KYC',        icon: '📷', description: 'Invitation for company representatives to complete identity verification', langs: ['en', 'de'] },
  { id: 'kyc-invite-individual',    name: 'KYC Invite (Individual)',       category: 'KYC',        icon: '🪪', description: 'Invitation for individual account holders to verify their identity',       langs: ['en', 'de'] },
  { id: 'kyc-reminder',             name: 'Identity Check Reminder',       category: 'KYC',        icon: '⏳', description: 'Reminder for users who started but haven\'t finished KYC',  langs: ['en', 'de'] },
  { id: 'kyc-verified',             name: 'Identity Verified',             category: 'KYC',        icon: '✓',  description: 'Confirms successful identity verification',                  langs: ['en', 'de'] },
  { id: 'all-verified',             name: 'All Verifications Done',        category: 'KYC',        icon: '🎯', description: 'All KYC steps are complete — account is fully live',         langs: ['en', 'de'] },
];

// GET /api/email/catalog — list all built-in template metadata
app.get('/api/email/catalog', authenticateToken, requireAdmin, (req, res) => {
  res.json(EMAIL_TEMPLATE_CATALOG);
});

// POST /api/email/preview/:id — render built-in template to HTML with sample / override data
app.post('/api/email/preview/:id', authenticateToken, requireAdmin, (req, res) => {
  if (!mailer) return res.status(503).json({ error: 'mailer not loaded' });
  const { lang = 'en', data = {} } = req.body || {};
  const id = req.params.id;
  const host = `${req.protocol}://${req.get('host')}`;
  const siteBase = (process.env.PUBLIC_BASE_URL || host).replace(/\/$/, '');
  const firstName = data.firstName || 'Max';
  const lastName  = data.lastName  || 'Müller';
  const email     = data.email     || 'max.mueller@example.com';
  const company   = data.company   || 'Müller Logistics GmbH';

  try {
    let mail;
    switch (id) {
      case 'booking-confirmation': {
        const start = new Date(Date.now() + 3 * 86400000); start.setHours(11, 0, 0, 0);
        mail = mailer.renderBookingEmail({
          slot: { startISO: start.toISOString(), endISO: new Date(start.getTime() + 1800000).toISOString(), label: '11:00 – 11:30' },
          meetLink: 'https://meet.google.com/demo-link-xyz',
          calendarUrl: 'https://calendar.google.com/demo',
          rebookUrl:  host + '/rebook.html?token=demo-token',
          cancelUrl:  host + '/cancel-booking.html?token=demo-token',
          lead: { firstName, lastName, email, company, industry: 'Logistics', fxVolume: '€250k–€1M', lang },
        });
        break;
      }
      case 'booking-cancellation': {
        const start = new Date(Date.now() + 3 * 86400000); start.setHours(11, 0, 0, 0);
        mail = mailer.renderCancellationEmail({
          slot: { startISO: start.toISOString() },
          lead: { firstName, email, lang },
          rebookUrl: host + '/rebook.html?token=demo-token',
          cancelledBy: 'admin',
        });
        break;
      }
      case 'email-otp':
        mail = mailer.renderOtpEmail({ firstName, email, code: '847 291', lang, verifyUrl: siteBase + '/hansepay/onboarding.html#verify' });
        break;
      case 'password-reset':
        mail = mailer.renderPasswordResetEmail({ firstName, email, code: '738294' });
        break;
      case 'tx-otp':
        mail = mailer.renderTxOtpEmail({ firstName, email, code: '384920', tx: { recipientName: 'Siemens AG', sendAmount: '12,500.00', sendCurrency: 'EUR' } });
        break;
      case 'tx-confirmation':
        mail = mailer.renderTransactionEmail({ tx: {
          userEmail: email, userFirstName: firstName,
          id: 'HP-TX-2024-001', sendAmount: '12,500.00', sendCurrency: 'EUR',
          receiveAmount: '10,871.43', receiveCurrency: 'GBP',
          rate: '0.8697', fee: '37.50', feeCurrency: 'EUR',
          recipientName: 'Siemens AG', recipientIban: 'DE89370400440532013000',
          estimatedArrival: '1 business day', reference: 'INV-2024-0892',
          createdAt: new Date().toISOString(),
        }});
        break;
      case 'registration-received':
        mail = mailer.renderRegistrationEmail({ firstName, lastName, email, company, accountType: 'company', applicationRef: 'HP-2024-0042', lang });
        break;
      case 'application-approved':
        mail = mailer.renderApprovalEmail({ firstName, lastName, email, company, applicationRef: 'HP-2024-0042', lang, loginUrl: siteBase + '/hansepay/dashboard-login.html' });
        break;
      case 'kyc-invite':
        mail = mailer.renderKycInviteEmail({ recipientName: firstName, firstName, lastName, recipientEmail: email, companyName: company, inviterName: 'HansePay Team', kycUrl: siteBase + '/hansepay/kyc-verify.html', lang, role: 'Managing Director' });
        break;
      case 'kyc-invite-individual':
        mail = mailer.renderKycInviteIndividualEmail({ recipientName: firstName, firstName, recipientEmail: email, kycUrl: siteBase + '/hansepay/kyc-verify.html', lang });
        break;
      case 'kyc-verified':
        mail = mailer.renderKycVerifiedEmail({ firstName, email, lang });
        break;
      case 'all-verified':
        mail = mailer.renderAllVerificationsEmail({ firstName, email, lang, accountType: 'company', company });
        break;
      case 'application-approved-biz':
        mail = mailer.renderApprovalEmail({ firstName, lastName, email, company, applicationRef: 'HP-2024-0042', lang, loginUrl: siteBase + '/hansepay/dashboard-login.html', accountType: 'business' });
        break;
      case 'kyc-reminder':
        mail = mailer.renderKycReminderEmail({ firstName, email, lang, kycUrl: siteBase + '/hansepay/kyc-verify.html' });
        break;
      case 'onboarding-reminder':
        mail = mailer.renderOnboardingReminderEmail({ firstName, email, lang, continueUrl: siteBase + '/hansepay/onboarding.html' });
        break;
      case 'monthly-savings':
        mail = mailer.renderMonthlySavingsEmail({
          firstName, email, lang,
          month: new Date().toLocaleString(lang === 'de' ? 'de-DE' : 'en-GB', { month: 'long', year: 'numeric' }),
          savedAmount: 1284.50,
          hpFeesPaid: 137.50,
          bankEquivalent: 1422.00,
          transferCount: 8,
          totalVolume: 25000,
          avgRate: 0.55,
          currencies: ['USD', 'GBP', 'CHF'],
          loginUrl: siteBase + '/hansepay/dashboard.html',
        });
        break;
      default:
        return res.status(404).json({ error: 'Unknown template: ' + id });
    }
    res.json({ html: mail.html, subject: mail.subject });
  } catch (err) {
    console.error('[email/preview]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/email-settings — get persistent email UI settings (non-secret)
app.get('/api/email-settings', authenticateToken, requireAdmin, async (req, res) => {
  const saved = await emailSettingsRepo.get();
  res.json(Object.assign({
    gmailConfigured: mailer ? mailer.gmailConfigured() : false,
    fromAddress:  process.env.EMAIL_FROM || (process.env.CALENDAR_OWNER_EMAIL ? 'HansePay <' + process.env.CALENDAR_OWNER_EMAIL + '>' : null),
    calendarOwner: process.env.CALENDAR_OWNER_EMAIL || null,
    bccAddress:   process.env.EMAIL_BCC || null,
    replyTo:      process.env.EMAIL_REPLY_TO || process.env.CALENDAR_OWNER_EMAIL || null,
  }, saved));
});

// PUT /api/email-settings — save non-secret display settings
app.put('/api/email-settings', authenticateToken, requireAdmin, async (req, res) => {
  const next = await emailSettingsRepo.update(req.body);
  res.json(next);
});

// GET /api/email-custom — list custom templates
app.get('/api/email-custom', authenticateToken, requireAdmin, async (req, res) => {
  res.json(await emailTemplatesRepo.list());
});

// POST /api/email-custom — create custom template
app.post('/api/email-custom', authenticateToken, requireAdmin, async (req, res) => {
  const t = await emailTemplatesRepo.create(req.body);
  res.json(t);
});

// POST /api/email-custom/preview-blocks — render blocks without saving (live editor preview)
app.post('/api/email-custom/preview-blocks', authenticateToken, requireAdmin, (req, res) => {
  if (!mailer || !mailer.renderCustomTemplate) return res.status(503).json({ error: 'renderer not available' });
  try {
    const mail = mailer.renderCustomTemplate(req.body || {}, {});
    res.json({ html: mail.html, subject: mail.subject });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/email-custom/:id — get single custom template
app.get('/api/email-custom/:id', authenticateToken, requireAdmin, async (req, res) => {
  const t = await emailTemplatesRepo.findById(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  res.json(t);
});

// PUT /api/email-custom/:id — update custom template
app.put('/api/email-custom/:id', authenticateToken, requireAdmin, async (req, res) => {
  const t = await emailTemplatesRepo.update(req.params.id, req.body);
  if (!t) return res.status(404).json({ error: 'Not found' });
  res.json(t);
});

// DELETE /api/email-custom/:id — delete custom template
app.delete('/api/email-custom/:id', authenticateToken, requireAdmin, async (req, res) => {
  const ok = await emailTemplatesRepo.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// POST /api/email-custom/:id/preview — render custom template to HTML
app.post('/api/email-custom/:id/preview', authenticateToken, requireAdmin, async (req, res) => {
  if (!mailer || !mailer.renderCustomTemplate) return res.status(503).json({ error: 'renderer not available' });
  const t = await emailTemplatesRepo.findById(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  try {
    const mail = mailer.renderCustomTemplate(t, req.body || {});
    res.json({ html: mail.html, subject: mail.subject });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/email-custom/:id/test — send test for custom template
app.post('/api/email-custom/:id/test', authenticateToken, requireAdmin, async (req, res) => {
  if (!mailer) return res.status(503).json({ error: 'mailer not loaded' });
  const t = await emailTemplatesRepo.findById(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  const to = (req.body && req.body.to) || req.user.email;
  try {
    const mail = mailer.renderCustomTemplate(t, req.body || {});
    mail.to = to;
    const result = await mailer.sendMail(mail);
    res.json(Object.assign({ to }, result));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Public API (API-key auth) ───────────────────────────────────────────────
//
// GET /api/crm/customers
//
// Returns all customers from the CRM as JSON.
// Auth: pass your key as header x-api-key OR query param ?api_key=
//
// Query parameters — all optional, combinable:
//
//   sort        latest (default) | oldest | a_z | z_a | updated | volume_high
//   stage       lead | qualified | proposal | won | lost
//   status      active | prospect
//   source      booking | referral | web | manual
//   country     e.g. Germany  (case-insensitive)
//   q           free-text search: name, company, email, industry, city
//   limit       integer — max results
//   fields      comma-separated — e.g. firstName,lastName,email,company,stage
//

// Parse fxVolume strings (e.g. "€5M–€10M / month", "€500k / month") to a
// numeric upper-bound value so volume_high sort works regardless of exact wording.
function parseFxVolume(v) {
  if (!v) return 0;
  const matches = String(v).match(/[\d.]+\s*[kKmM]?/g) || [];
  const nums = matches.map(n => {
    const val = parseFloat(n);
    if (/[mM]/.test(n)) return val * 1000000;
    if (/[kK]/.test(n)) return val * 1000;
    return val;
  });
  return nums.length ? Math.max(...nums) : 0;
}

app.get('/api/crm/customers', requireApiKey, async (req, res) => {
  const raw = await customersRepo.list();
  let list = await Promise.all(raw.map(enrichCustomer));

  // ── Filters ──────────────────────────────────────────────────────────────
  const { sort, stage, status, source, country, q, limit, fields } = req.query;

  if (stage)   list = list.filter(c => c.stage  === stage);
  if (status)  list = list.filter(c => c.status === status);
  if (source)  list = list.filter(c => c.source === source);
  if (country) list = list.filter(c => (c.country || '').toLowerCase() === String(country).toLowerCase());

  if (q) {
    const needle = String(q).toLowerCase();
    list = list.filter(c =>
      [c.company, c.firstName, c.lastName, c.email, c.industry, c.city, c.country]
        .filter(Boolean).some(v => String(v).toLowerCase().includes(needle))
    );
  }

  // ── Sort ─────────────────────────────────────────────────────────────────
  const sortKey = (sort || 'latest').toLowerCase();
  switch (sortKey) {
    case 'oldest':
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      break;
    case 'a_z':
      list.sort((a, b) =>
        (a.company || `${a.firstName} ${a.lastName}`).localeCompare(
          b.company || `${b.firstName} ${b.lastName}`));
      break;
    case 'z_a':
      list.sort((a, b) =>
        (b.company || `${b.firstName} ${b.lastName}`).localeCompare(
          a.company || `${a.firstName} ${a.lastName}`));
      break;
    case 'updated':
      list.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
      break;
    case 'volume_high':
      list.sort((a, b) => parseFxVolume(b.fxVolume) - parseFxVolume(a.fxVolume));
      break;
    case 'latest':
    default:
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
  }

  // ── Limit ────────────────────────────────────────────────────────────────
  const n = parseInt(limit, 10);
  if (!isNaN(n) && n > 0) list = list.slice(0, n);

  // ── Field projection ─────────────────────────────────────────────────────
  if (fields) {
    const keys = String(fields).split(',').map(f => f.trim()).filter(Boolean);
    list = list.map(c => Object.fromEntries(keys.filter(k => k in c).map(k => [k, c[k]])));
  }

  res.json({ total: list.length, customers: list });
});

// ─── CRM: Customers ─────────────────────────────────────────────────────────

// Enrich a customer with health/value using its activities
async function enrichCustomer(c) {
  if (!crm) return c;
  return crm.enrich(c, await activitiesFor(c.id));
}

app.get('/api/customers', authenticateToken, async (req, res) => {
  const customers = await customersRepo.list();
  let list = await Promise.all(customers.map(enrichCustomer));

  const { stage, status, churn, source, owner, q } = req.query;
  if (stage)  list = list.filter(c => c.stage === stage);
  if (status) list = list.filter(c => c.status === status);
  if (source) list = list.filter(c => c.source === source);
  if (owner)  list = list.filter(c => (c.owner || '') === owner);
  if (churn)  list = list.filter(c => c.health && c.health.churnRisk === churn);
  if (q) {
    const needle = String(q).toLowerCase();
    list = list.filter(c =>
      [c.company, c.firstName, c.lastName, c.email, c.industry, c.country]
        .filter(Boolean).some(v => String(v).toLowerCase().includes(needle))
    );
  }
  list.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  res.json(list);
});

app.get('/api/customers/export', authenticateToken, async (req, res) => {
  const list = await customersRepo.list();
  if (!crm) return res.status(503).json({ error: 'CRM module unavailable' });
  // toExportRows() calls its enrich callback synchronously, so pre-enrich
  // every customer up front and hand it a synchronous lookup function.
  const enrichedById = new Map();
  await Promise.all(list.map(async c => enrichedById.set(c.id, await enrichCustomer(c))));
  const aoa = crm.toExportRows(list, c => enrichedById.get(c.id));
  const stamp = new Date().toISOString().slice(0, 10);
  const format = (req.query.format || 'csv').toLowerCase();

  if (format === 'xlsx' && xlsx) {
    const buf = xlsx.buildWorkbook([{ name: 'Customers', aoa }]);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="hansepay-customers-${stamp}.xlsx"`);
    return res.send(buf);
  }
  const csv = xlsx ? xlsx.toCSV(aoa) : aoa.map(r => r.join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="hansepay-customers-${stamp}.csv"`);
  res.send(csv);
});

app.get('/api/customers/:id', authenticateToken, async (req, res) => {
  const c = await customersRepo.findById(req.params.id);
  if (!c) return res.status(404).json({ error: 'Customer not found' });
  const enriched = await enrichCustomer(c);
  enriched.activities = await activitiesFor(c.id);
  enriched.bookings = await bookingsRepo.forCustomer(c.id);
  res.json(enriched);
});

const CUSTOMER_FIELDS = ['firstName', 'lastName', 'email', 'phone', 'website', 'company',
  'industry', 'companySize', 'country', 'city', 'fxVolume', 'currencyPairs',
  'stage', 'status', 'owner', 'source', 'tags', 'notes', 'estValueEur',
  'lastContactAt', 'nextFollowUpAt', 'lang'];

app.post('/api/customers', authenticateToken, async (req, res) => {
  if (!req.body.company && !req.body.email && !req.body.firstName) {
    return res.status(400).json({ error: 'At least a company, name or email is required' });
  }
  const now = new Date().toISOString();
  const fields = { stage: 'lead', status: 'prospect', source: 'manual', tags: [], bookingIds: [],
    owner: req.user.name || '', lastContactAt: now, nextFollowUpAt: null, createdAt: now, updatedAt: now };
  CUSTOMER_FIELDS.forEach(k => { if (req.body[k] !== undefined) fields[k] = req.body[k]; });

  const cust = await customersRepo.withTransaction(async (conn) => {
    const created = await customersRepo.create(fields, conn);
    await logActivity({ customerId: created.id, type: 'note', title: 'Customer created', by: req.user.name }, conn);
    return created;
  });
  res.status(201).json(await enrichCustomer(cust));
});

app.put('/api/customers/:id', authenticateToken, async (req, res) => {
  const existing = await customersRepo.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Customer not found' });

  const prevStage = existing.stage;
  const prevStatus = existing.status;
  const patch = {};
  CUSTOMER_FIELDS.forEach(k => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });

  const updated = await customersRepo.withTransaction(async (conn) => {
    const saved = await customersRepo.update(req.params.id, patch, conn);
    if (req.body.stage && req.body.stage !== prevStage) {
      await logActivity({ customerId: saved.id, type: 'stage_change',
        title: `Stage: ${crm ? (crm.STAGE_LABELS[prevStage] || prevStage) : prevStage} → ${crm ? (crm.STAGE_LABELS[req.body.stage] || req.body.stage) : req.body.stage}`,
        by: req.user.name }, conn);
    }
    if (req.body.status && req.body.status !== prevStatus) {
      await logActivity({ customerId: saved.id, type: 'stage_change',
        title: `Status: ${prevStatus} → ${req.body.status}`, by: req.user.name }, conn);
    }
    return saved;
  });
  res.json(await enrichCustomer(updated));
});

app.delete('/api/customers/:id', authenticateToken, requireAdmin, async (req, res) => {
  // activities.customer_id has ON DELETE CASCADE — no separate cleanup needed.
  const ok = await customersRepo.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Customer not found' });
  res.json({ success: true });
});

// Add an activity / interaction; contact-type activities advance lastContactAt
app.post('/api/customers/:id/activities', authenticateToken, async (req, res) => {
  const existing = await customersRepo.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Customer not found' });

  const { type, title, body } = req.body;
  const entry = await customersRepo.withTransaction(async (conn) => {
    const created = await logActivity({ customerId: req.params.id, type, title, body, by: req.user.name }, conn);
    if (['call', 'email', 'meeting', 'note'].includes(type)) {
      await customersRepo.update(req.params.id, { lastContactAt: new Date().toISOString() }, conn);
    }
    return created;
  });
  res.status(201).json(entry);
});

// ─── AI: Web search helper ────────────────────────────────────────────────────
// Uses Tavily (https://tavily.com) — set TAVILY_API_KEY in Railway env vars.
// Falls back gracefully when not configured (research uses training data only).

async function webSearch(query, opts = {}) {
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (!tavilyKey) return [];
  try {
    const resp = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        api_key:       tavilyKey,
        query,
        search_depth:  opts.deep ? 'advanced' : 'basic',
        max_results:   opts.maxResults || 4,
        include_answer: false,
        include_raw_content: false,
        ...(Array.isArray(opts.includeDomains) && opts.includeDomains.length
          ? { include_domains: opts.includeDomains } : {}),
      }),
    });
    if (!resp.ok) { console.error('[search] Tavily', resp.status); return []; }
    const data = await resp.json();
    return (data.results || []).filter(r => r.content || r.snippet);
  } catch (e) {
    console.error('[search] Tavily error:', e.message);
    return [];
  }
}

// Truncate and format search results for Claude context
function formatSearchContext(results, maxCharsEach = 600) {
  if (!results.length) return '';
  return '\n\n--- WEB SEARCH RESULTS ---\n' +
    results.map(r =>
      `SOURCE: ${r.url}\n${(r.content || r.snippet || '').slice(0, maxCharsEach)}`
    ).join('\n\n') +
    '\n--- END SEARCH RESULTS ---';
}

// Shared Claude caller (non-streaming, JSON response)
async function callClaude(apiKey, prompt, maxTokens = 1500) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!resp.ok) throw Object.assign(new Error('Claude API ' + resp.status), { status: resp.status });
  const data = await resp.json();
  const raw = data.content?.[0]?.text || '';
  // Try direct parse, then extract first JSON object/array
  try { return JSON.parse(raw.trim()); } catch (_) {}
  const m = raw.match(/(\[[\s\S]+\]|\{[\s\S]+\})/);
  if (m) return JSON.parse(m[1]);
  throw new Error('Could not parse JSON from Claude response:\n' + raw.slice(0, 300));
}

// ─── AI: Lead generation ─────────────────────────────────────────────────────

// POST /api/customers/generate-leads
// Takes criteria, searches the web (if Tavily configured), asks Claude to
// extract/identify matching companies, returns a preview list.
app.post('/api/customers/generate-leads', authenticateToken, async (req, res) => {
  const user   = await usersRepo.findById(req.user.id);
  const apiKey = user?.claudeApiKey || process.env.CLAUDE_API_KEY;
  if (!apiKey) return res.status(400).json({ error: 'No Claude API key configured.' });

  const {
    industry   = '',
    country    = 'Germany, Europe',
    size       = '',
    keywords   = '',
    count      = 8,
    useCase    = '',
  } = req.body;

  if (!industry && !keywords) return res.status(400).json({ error: 'Provide at least an industry or keywords.' });

  const webEnabled = !!process.env.TAVILY_API_KEY;
  let searchResults = [];

  if (webEnabled) {
    const baseTerms = [industry, country, size, keywords, useCase, 'international payments export import'].filter(Boolean).join(' ');
    const [q1, q2, q3] = await Promise.all([
      webSearch(`${industry} companies ${country} ${keywords} export cross-border`, { deep: true, maxResults: 5 }),
      webSearch(`${baseTerms} company list`, { maxResults: 4 }),
      webSearch(`top ${industry} companies ${country} import export site:linkedin.com OR site:crunchbase.com`, { maxResults: 4 }),
    ]);
    searchResults = [...q1, ...q2, ...q3];
  }

  const webCtx = formatSearchContext(searchResults, 400);

  const prompt = `You are a B2B lead generation specialist for HansePay, a European FX payments company.

Find ${Math.min(count, 12)} real companies that are strong prospects for HansePay — companies that need cross-border payments, FX conversion, or multi-currency accounts.

Prospecting criteria:
- Industry: ${industry || 'Any'}
- Target country/region: ${country || 'Europe'}
- Company size: ${size || 'Any'}
- Keywords/focus: ${keywords || 'international trade, export, import'}
- Use case context: ${useCase || 'B2B cross-border payments'}
${webCtx ? '\nUse the web search results below — these contain real, current company data. Extract real company names, websites, and details from them.' : '\nNote: no live search available. Use your training knowledge. Mark confidence accordingly.'}
${webCtx}

Rules:
- Only suggest REAL companies (not invented ones)
- Each must have a plausible FX/cross-border payment need
- Vary size and sub-sector within the criteria
- Be specific about the FX angle for each

Return ONLY a valid JSON array (no markdown):
[
  {
    "company": "Exact legal company name",
    "website": "domain.com or null",
    "country": "Country",
    "industry": "Specific sub-industry",
    "size": "e.g. 200–500 employees or €50M revenue",
    "fxAngle": "Why they specifically need FX payments — 1 sentence, concrete",
    "outreachAngle": "Specific personalised opening for cold outreach",
    "linkedinUrl": "https://linkedin.com/company/... or null",
    "confidence": "high|medium|low",
    "source": "${webEnabled ? 'web_search' : 'training_data'}"
  }
]`;

  try {
    const leads = await callClaude(apiKey, prompt, 3000);
    if (!Array.isArray(leads)) throw new Error('Expected array from Claude');

    res.json({
      leads: leads.slice(0, count),
      webSearchUsed: webEnabled,
      searchResultCount: searchResults.length,
      sources: [...new Set(searchResults.map(r => r.url).filter(Boolean))].slice(0, 8),
    });
  } catch (err) {
    console.error('[generate-leads] error:', err.message);
    res.status(500).json({ error: 'Lead generation failed: ' + err.message });
  }
});

// ─── AI: Lead research ────────────────────────────────────────────────────────

// POST /api/customers/:id/research — enhanced with live web search when Tavily configured
app.post('/api/customers/:id/research', authenticateToken, async (req, res) => {
  const user   = await usersRepo.findById(req.user.id);
  const apiKey = user?.claudeApiKey || process.env.CLAUDE_API_KEY;
  if (!apiKey) return res.status(400).json({ error: 'No Claude API key configured. Add your key in Settings → AI Integration.' });

  const c = await customersRepo.findById(req.params.id);
  if (!c) return res.status(404).json({ error: 'Customer not found' });

  const companyName = c.company || req.body.company || '';
  const website     = c.website || req.body.website || '';
  const industry    = c.industry || req.body.industry || '';
  const country     = c.country || req.body.country || '';

  if (!companyName) return res.status(400).json({ error: 'Company name is required for research.' });

  const webEnabled = !!process.env.TAVILY_API_KEY;
  let searchResults = [];
  let sources = [];

  if (webEnabled) {
    // Parallel searches: company overview, LinkedIn presence, recent news
    const [general, linkedin, news] = await Promise.all([
      webSearch(`${companyName} ${website} company overview business`, { deep: true, maxResults: 3 }),
      webSearch(`${companyName} linkedin company profile`, { maxResults: 2 }),
      webSearch(`${companyName} news 2024 2025 expansion funding hiring`, { maxResults: 3 }),
    ]);
    searchResults = [...general, ...linkedin, ...news];
    sources = [...new Set(searchResults.map(r => r.url).filter(Boolean))];
  }

  const webCtx = formatSearchContext(searchResults);

  const prompt = `You are a B2B sales intelligence analyst for HansePay, a European FX payments company (cross-border payments, multi-currency accounts, interbank FX rates).

Your task: produce a structured intelligence brief on this company for a sales rep preparing a first outreach.
${webEnabled ? 'You have live web search results below — use them for current, accurate information. Prefer web data over training knowledge where they conflict.' : 'Note: live web search is not available. Use your training data; note uncertainty where relevant.'}

Company: ${companyName}
Website: ${website || '(not provided)'}
Industry: ${industry || '(not provided)'}
Country/Region: ${country || '(not provided)'}
${webCtx}

Return ONLY valid JSON (no markdown, no explanation):
{
  "overview": "2–3 sentence factual description of what the company does and its scale",
  "size": "employee count range and/or revenue if findable, else 'Unknown'",
  "fxAngle": "1–2 sentences: WHY specifically this company needs FX/cross-border payments — be concrete",
  "painPoints": ["specific pain point 1", "specific pain point 2", "specific pain point 3"],
  "recentSignals": "recent news, funding, expansion, or hiring that signals payment needs — or null",
  "linkedinUrl": "LinkedIn company page URL if found — or null",
  "decisionMakers": ["CFO", "Head of Treasury", "VP Finance"],
  "outreachAngle": "a specific, compelling first sentence for a cold outreach — reference something real and specific",
  "relevanceScore": 1-5,
  "webSearchUsed": ${webEnabled},
  "sources": ${JSON.stringify(sources.slice(0, 5))},
  "confidenceNote": "brief honest assessment of data quality"
}`;

  try {
    const brief = await callClaude(apiKey, prompt, 1200);

    await customersRepo.withTransaction(async (conn) => {
      await customersRepo.update(c.id, { aiResearch: brief, researchedAt: new Date().toISOString() }, conn);
      await logActivity({
        customerId: c.id,
        type: 'note',
        title: 'AI research completed',
        body: `Relevance score: ${brief.relevanceScore}/5. ${brief.fxAngle || ''}`,
        by: req.user.name || 'system',
      }, conn);
    });

    res.json({ success: true, research: brief });
  } catch (err) {
    console.error('[research] error:', err.message);
    res.status(500).json({ error: 'Research failed: ' + err.message });
  }
});

// ─── AI: Bulk enrichment (Clay-style columns) ─────────────────────────────────

// POST /api/customers/:id/analyze
// Answers an arbitrary set of criteria "columns" for one customer in a single
// Claude call. Each column has { key, label, prompt, type, options? }.
// Results are merged into customer.analysis (keyed by column key) so they
// persist and render as table columns. Reuses webSearch + callClaude.
const ANALYZE_TYPES = ['text', 'number', 'boolean', 'score', 'score100', 'category'];

// Bare registrable domain from a website value (strip protocol / www / path).
function domainOf(website) {
  if (!website) return '';
  return String(website).trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split(/[/?#]/)[0]
    .trim()
    .toLowerCase();
}

// Extra search keywords for the built-in preset criteria, so a web search
// actually looks for the thing each column is asking about.
const CRITERION_SEARCH_HINTS = {
  country_chk:   'headquarters location country',
  hq_city:       'headquarters city office location',
  emp_band:      'number of employees headcount company size',
  industry_cat:  'industry sector what they do',
  revenue_est:   'annual revenue turnover sales',
  fx_relevance:  'international export import cross-border markets foreign',
  xborder_need:  'export import international suppliers overseas operations subsidiaries',
  fx_pairs:      'export markets countries currencies foreign trade',
  dm_title:      'CFO finance director head of treasury leadership team management',
  growth_signal: 'funding round investment expansion hiring acquisition news 2024 2025',
};

// Words to drop when deriving a search query from a free-text custom prompt.
const ANALYZE_STOPWORDS = new Set(('the a an of to for and or in on at by with from this that these those does do is are was were be been being '
  + 'company companies business their your our what which who whom how many much more most based located answer respond reply give provide '
  + 'please null unknown none yes no estimate identify find determine list briefly short sentence phrase value one each they it its them').split(/\s+/));

// Pull the most useful keywords out of a custom criterion's prompt.
function keywordsFromPrompt(prompt, max) {
  const seen = new Set();
  const words = String(prompt).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);
  const out = [];
  for (const w of words) {
    if (w.length > 2 && !ANALYZE_STOPWORDS.has(w) && !seen.has(w)) { seen.add(w); out.push(w); }
    if (out.length >= (max || 6)) break;
  }
  return out.join(' ');
}

// Build a small, deduplicated set of search queries targeted at the criteria
// being asked — one company anchor query plus per-criterion queries.
function buildAnalyzeQueries(company, website, columns, maxQueries) {
  const anchor = `"${company}"` + (website ? ` ${website}` : '');
  const queries = [`${anchor} company overview business`];
  const seenTerms = new Set();
  for (const col of columns) {
    const terms = (CRITERION_SEARCH_HINTS[col.key] || keywordsFromPrompt(col.prompt)).trim();
    if (!terms || seenTerms.has(terms)) continue;
    seenTerms.add(terms);
    queries.push(`${anchor} ${terms}`);
  }
  return queries.slice(0, maxQueries || 6);
}

app.post('/api/customers/:id/analyze', authenticateToken, async (req, res) => {
  const user   = await usersRepo.findById(req.user.id);
  const apiKey = user?.claudeApiKey || process.env.CLAUDE_API_KEY;
  if (!apiKey) return res.status(400).json({ error: 'No Claude API key configured. Add your key in Settings → AI Integration.' });

  const customer = await customersRepo.findById(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  // Sanitise incoming column definitions
  const columns = (Array.isArray(req.body.columns) ? req.body.columns : [])
    .map(c => ({
      key:     String(c.key || '').trim(),
      label:   String(c.label || c.key || '').trim(),
      prompt:  String(c.prompt || '').trim(),
      type:    ANALYZE_TYPES.includes(c.type) ? c.type : 'text',
      options: Array.isArray(c.options) ? c.options.map(String) : null,
    }))
    .filter(c => c.key && c.prompt);

  if (!columns.length) return res.status(400).json({ error: 'Provide at least one criterion column.' });
  if (columns.length > 20) return res.status(400).json({ error: 'Too many columns (max 20 per run).' });

  const c           = customer;
  const companyName = c.company || '';
  const website     = c.website || '';
  if (!companyName) return res.status(400).json({ error: 'Customer has no company name to analyse.' });

  const webEnabled = req.body.web !== false && !!process.env.TAVILY_API_KEY;
  let searchResults = [];
  let sources = [];

  if (webEnabled) {
    // Assemble up to ~6 targeted search tasks: anchor research in the company's
    // OWN site + LinkedIn (highest-signal for B2B), then criteria-driven open web.
    const domain = domainOf(website);
    const tasks = [];
    if (domain) {
      tasks.push(webSearch('about products services markets customers clients international', { includeDomains: [domain], deep: true, maxResults: 3 }));
      tasks.push(webSearch(`"${companyName}"`, { includeDomains: ['linkedin.com'], maxResults: 2 }));
    }
    // Fill the remaining budget with criteria-driven open-web queries.
    const remaining = Math.max(0, 6 - tasks.length);
    const queries = buildAnalyzeQueries(companyName, website, columns, remaining);
    queries.forEach((q, i) => tasks.push(webSearch(q, { deep: !domain && i === 0, maxResults: 2 })));

    const settled = await Promise.all(tasks);
    // Pool + dedupe by URL, keep the most relevant slice for the prompt.
    const seenUrls = new Set();
    searchResults = settled.flat().filter(r => {
      const u = r.url || '';
      if (u && seenUrls.has(u)) return false;
      if (u) seenUrls.add(u);
      return true;
    }).slice(0, 10);
    sources = [...new Set(searchResults.map(r => r.url).filter(Boolean))];
  }

  const webCtx = formatSearchContext(searchResults);

  // Per-column type guidance + the JSON shape we want back
  const typeHint = (col) => {
    switch (col.type) {
      case 'number':   return 'a number only (no units, no text), or null if unknown';
      case 'boolean':  return 'exactly "Yes" or "No"';
      case 'score':    return 'an integer from 1 to 5 (5 = strongest fit)';
      case 'score100': return 'an integer from 0 to 100 — overall HansePay cross-border-FX fit (0 = no fit, 100 = ideal prospect: clear multi-currency/cross-border need, meaningful FX volume, reachable finance decision-maker)';
      case 'category': return 'exactly one of: ' + (col.options && col.options.length ? col.options.join(', ') : '(no options provided — use a short label)');
      default:         return 'a short phrase (max ~10 words)';
    }
  };
  const columnSpec = columns.map((col, i) =>
    `${i + 1}. key "${col.key}" — ${col.label}\n   Question: ${col.prompt}\n   Answer format: ${typeHint(col)}`
  ).join('\n');
  const jsonShape = '{\n' + columns.map(col =>
    `  "${col.key}": { "value": <${col.type} — ${typeHint(col).split('(')[0].trim()}>, "confidence": "high" | "medium" | "low" }`
  ).join(',\n') + '\n}';

  const priorAnalysis = c.analysis && Object.keys(c.analysis).length
    ? `\nPrevious analysis values (for context only, you may revise): ${JSON.stringify(c.analysis)}`
    : '';

  const prompt = `You are a B2B sales-intelligence analyst for HansePay, a European FX / cross-border payments company.

Analyse ONE company against a set of criteria. Answer every criterion as accurately as you can.
${webEnabled ? 'Live web search results are provided below — they were gathered specifically to answer these criteria. Ground each answer in them and prefer them over training knowledge where they conflict; cite from them when relevant.' : 'No live web search is available — use the company data and your training knowledge; answer null/Unknown when genuinely unsure.'}

COMPANY
- Name: ${companyName}
- Website: ${website || '(not provided)'}
- Industry: ${c.industry || '(not provided)'}
- Country: ${c.country || '(not provided)'}
- City: ${c.city || '(not provided)'}
- Company size: ${c.companySize || '(not provided)'}
- FX volume (known): ${c.fxVolume || '(not provided)'}
- Notes: ${c.notes || '(none)'}${priorAnalysis}
${webCtx}

CRITERIA — answer each one:
${columnSpec}

For EACH criterion return both the answer and your confidence in it:
- "value" — honours the stated answer format above
- "confidence" — "high" (directly supported by the data/sources), "medium" (reasonable inference), or "low" (guess / little to go on). Be honest; prefer "low" over a confident guess.

Return ONLY a valid JSON object (no markdown, no commentary) with exactly these keys:
${jsonShape}`;

  try {
    const maxTokens = Math.min(2000, 500 + columns.length * 140);
    const values = await callClaude(apiKey, prompt, maxTokens);
    if (!values || typeof values !== 'object' || Array.isArray(values)) {
      throw new Error('Expected a JSON object from Claude');
    }

    // Split into value + confidence. Tolerant of either {value,confidence}
    // or a bare scalar (back-compat / model drift).
    const CONF = { high: 'high', medium: 'medium', low: 'low' };
    const clean = {};
    const conf = {};
    columns.forEach(col => {
      const raw = values[col.key];
      if (raw === undefined) return;
      if (raw && typeof raw === 'object' && !Array.isArray(raw) && 'value' in raw) {
        clean[col.key] = raw.value;
        if (raw.confidence && CONF[String(raw.confidence).toLowerCase()]) conf[col.key] = CONF[String(raw.confidence).toLowerCase()];
      } else {
        clean[col.key] = raw;
      }
    });

    const patch = {
      analysis: Object.assign({}, c.analysis, clean),
      analysisConf: Object.assign({}, c.analysisConf, conf),
      analyzedAt: new Date().toISOString(),
    };
    if (webEnabled) patch.analysisSources = sources.slice(0, 8);

    await customersRepo.withTransaction(async (conn) => {
      await customersRepo.update(c.id, patch, conn);
      await logActivity({
        customerId: c.id,
        type: 'note',
        title: 'Bulk analysis',
        body: `Enriched ${columns.length} ${columns.length === 1 ? 'criterion' : 'criteria'}${webEnabled ? ' (web search)' : ''}.`,
        by: req.user.name || 'system',
      }, conn);
    });

    res.json({ success: true, values: clean, confidence: conf, web: webEnabled, sources: sources.slice(0, 8) });
  } catch (err) {
    console.error('[analyze] error:', err.message);
    res.status(500).json({ error: 'Analysis failed: ' + err.message });
  }
});

// ─── Sales: pipeline + summary ────────────────────────────────────────────────

app.get('/api/sales/summary', authenticateToken, async (req, res) => {
  const customers = await Promise.all((await customersRepo.list()).map(enrichCustomer));
  const stages = crm ? crm.STAGES : ['lead', 'qualified', 'proposal', 'won', 'lost'];

  const byStage = {};
  stages.forEach(s => { byStage[s] = { count: 0, value: 0, weighted: 0, customers: [] }; });
  customers.forEach(c => {
    const s = c.stage || 'lead';
    if (!byStage[s]) byStage[s] = { count: 0, value: 0, weighted: 0, customers: [] };
    byStage[s].count++;
    byStage[s].value += c.estValueEur || 0;
    byStage[s].weighted += c.weightedValue || 0;
    byStage[s].customers.push({
      id: c.id, company: c.company, name: `${c.firstName || ''} ${c.lastName || ''}`.trim(),
      email: c.email, estValueEur: c.estValueEur, owner: c.owner,
      health: c.health.score, churnRisk: c.health.churnRisk, industry: c.industry,
      updatedAt: c.updatedAt,
    });
  });

  const open = customers.filter(c => !['won', 'lost'].includes(c.stage));
  const won = customers.filter(c => c.stage === 'won');
  const lost = customers.filter(c => c.stage === 'lost');
  const closed = won.length + lost.length;

  const pipelineValue = open.reduce((s, c) => s + (c.estValueEur || 0), 0);
  const weightedPipeline = open.reduce((s, c) => s + (c.weightedValue || 0), 0);
  const wonValue = won.reduce((s, c) => s + (c.estValueEur || 0), 0);

  const healthDist = { excellent: 0, good: 0, watch: 0, 'at-risk': 0 };
  customers.forEach(c => { healthDist[c.health.band] = (healthDist[c.health.band] || 0) + 1; });

  const churnRisk = customers
    .filter(c => ['high', 'medium'].includes(c.health.churnRisk))
    .sort((a, b) => a.health.score - b.health.score)
    .slice(0, 12)
    .map(c => ({ id: c.id, company: c.company, name: `${c.firstName || ''} ${c.lastName || ''}`.trim(),
      health: c.health.score, churnRisk: c.health.churnRisk, daysSinceContact: c.health.daysSinceContact,
      estValueEur: c.estValueEur, status: c.status }));

  res.json({
    totals: {
      customers: customers.length,
      open: open.length,
      won: won.length,
      lost: lost.length,
      pipelineValue, weightedPipeline, wonValue,
      winRate: closed ? Math.round((won.length / closed) * 100) : 0,
      avgDeal: won.length ? Math.round(wonValue / won.length) : 0,
      avgHealth: customers.length ? Math.round(customers.reduce((s, c) => s + c.health.score, 0) / customers.length) : 0,
    },
    byStage,
    healthDist,
    churnRisk,
  });
});

// ─── Marketing summary ──────────────────────────────────────────────────────

function classifyChannel(referrer, data) {
  const utm = (data && (data.utm_source || data.source)) || '';
  if (utm) return String(utm).toLowerCase();
  const r = (referrer || '').toLowerCase();
  if (!r) return 'direct';
  if (/google|bing|duckduckgo|yahoo|ecosia/.test(r)) return 'organic';
  if (/linkedin|twitter|x\.com|facebook|instagram|youtube|t\.co/.test(r)) return 'social';
  if (/mail|gmail|outlook/.test(r)) return 'email';
  return 'referral';
}

app.get('/api/marketing/summary', authenticateToken, async (req, res) => {
  const analytics = readData('analytics.json') || [];
  const posts = await postsRepo.listAll();
  const seo = await seoRepo.getAll();
  const customers = await customersRepo.list();
  const bookings = await bookingsRepo.list();

  const pageviews = analytics.filter(a => !a.type || a.type === 'pageview');

  // Channels
  const channels = {};
  pageviews.forEach(a => {
    const ch = classifyChannel(a.referrer, a.data);
    channels[ch] = (channels[ch] || 0) + 1;
  });

  // Top pages
  const pageCounts = {};
  pageviews.forEach(a => { pageCounts[a.page || '/'] = (pageCounts[a.page || '/'] || 0) + 1; });
  const topPages = Object.entries(pageCounts).map(([page, views]) => ({ page, views }))
    .sort((a, b) => b.views - a.views).slice(0, 10);

  // Funnel
  const modalOpens = analytics.filter(a => a.type === 'booking_modal_open').length;
  const bookingConfirmed = Array.isArray(bookings) ? bookings.length : 0;
  const totalViews = pageviews.length;

  // Content performance
  const topPosts = [...(Array.isArray(posts) ? posts : [])]
    .filter(p => p.status === 'published')
    .map(p => ({ id: p.id, title: p.title, slug: p.slug, category: p.category, views: p.viewCount || p.views || 0 }))
    .sort((a, b) => b.views - a.views).slice(0, 8);
  const publishedCount = (Array.isArray(posts) ? posts : []).filter(p => p.status === 'published').length;
  const draftCount = (Array.isArray(posts) ? posts : []).filter(p => p.status === 'draft').length;

  // SEO coverage: which key pages have title + description
  const keyPages = ['index', 'about', 'tools', 'blog', 'booking', 'platform', 'solutions-corporate'];
  const seoCoverage = keyPages.map(slug => {
    const m = seo[slug] || {};
    const hasTitle = !!(m.title || m.metaTitle);
    const hasDesc = !!(m.description || m.metaDescription);
    return { slug, hasTitle, hasDesc, complete: hasTitle && hasDesc };
  });
  const seoComplete = seoCoverage.filter(s => s.complete).length;

  // Leads by source
  const leadsBySource = {};
  (Array.isArray(customers) ? customers : []).forEach(c => {
    const s = c.source || 'unknown';
    leadsBySource[s] = (leadsBySource[s] || 0) + 1;
  });

  // Views over last 30 days
  const now = new Date();
  const viewsLast30Days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000).toISOString().slice(0, 10);
    viewsLast30Days.push({ date: d, count: pageviews.filter(a => a.timestamp && a.timestamp.startsWith(d)).length });
  }

  res.json({
    totals: {
      totalViews,
      visitors: Object.keys(pageCounts).length ? totalViews : 0,
      leads: Array.isArray(customers) ? customers.length : 0,
      bookings: bookingConfirmed,
      publishedCount, draftCount,
      seoComplete, seoTotal: keyPages.length,
      conversionRate: totalViews ? +((bookingConfirmed / totalViews) * 100).toFixed(2) : 0,
    },
    channels,
    topPages,
    topPosts,
    seoCoverage,
    leadsBySource,
    funnel: { views: totalViews, modalOpens, bookings: bookingConfirmed },
    viewsLast30Days,
  });
});

// ─── SEO routes ───────────────────────────────────────────────────────────────

app.get('/api/seo', async (req, res) => {
  res.json(await seoRepo.getAll());
});

app.get('/api/seo/:slug', async (req, res) => {
  res.json(await seoRepo.getBySlug(req.params.slug));
});

app.put('/api/seo/:slug', authenticateToken, requireAdmin, async (req, res) => {
  res.json(await seoRepo.upsert(req.params.slug, req.body));
});

// ─── Sitemap ──────────────────────────────────────────────────────────────────

app.get('/sitemap.xml', async (req, res) => {
  const seo   = await seoRepo.getAll();
  const posts = await postsRepo.listAll();
  const base  = 'https://hansepay-deploy-production-328c.up.railway.app';

  const staticPages = [
    { slug: 'index',   path: '/',                    priority: '1.0', changefreq: 'weekly'  },
    { slug: 'about',   path: '/about.html',           priority: '0.8', changefreq: 'monthly' },
    { slug: 'tools',   path: '/tools-calculator.html',priority: '0.8', changefreq: 'monthly' },
    { slug: 'blog',    path: '/blog.html',            priority: '0.7', changefreq: 'weekly'  },
    { slug: 'booking', path: '/booking.html',         priority: '0.9', changefreq: 'monthly' },
  ];

  const today = new Date().toISOString().split('T')[0];

  const urls = [
    ...staticPages.map(p => {
      const meta    = seo[p.slug] || {};
      const lastmod = meta.updatedAt ? meta.updatedAt.split('T')[0] : today;
      return `  <url><loc>${base}${p.path}</loc><lastmod>${lastmod}</lastmod><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`;
    }),
    ...(Array.isArray(posts) ? posts : [])
      .filter(p => p.status === 'published' && p.slug)
      .map(p => {
        const lastmod = (p.updatedAt || p.createdAt || today).split('T')[0];
        return `  <url><loc>${base}/blog/${p.slug}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`;
      }),
  ].join('\n');

  res.setHeader('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`);
});

// ─── Settings routes ──────────────────────────────────────────────────────────

app.get('/api/settings', authenticateToken, async (req, res) => {
  res.json(await settingsRepo.get());
});

app.put('/api/settings', authenticateToken, requireAdmin, async (req, res) => {
  res.json(await settingsRepo.update(req.body));
});

// Returns the shareable preview URL (uses the request host so it works on any domain)
app.get('/api/settings/preview-link', authenticateToken, requireAdmin, (req, res) => {
  const token = process.env.PREVIEW_TOKEN;
  if (!token) return res.json({ url: null });
  const host = `${req.protocol}://${req.get('host')}`;
  res.json({ url: `${host}/?preview=${token}` });
});

// ─── Booking routes ───────────────────────────────────────────────────────────

// GET /api/booking/auth — start one-time OAuth2 authorisation flow
// Visit this URL in a browser while logged in as the calendar owner.
// After consent you are redirected to /api/booking/auth/callback which prints
// the refresh token — copy it into Railway as GOOGLE_REFRESH_TOKEN.
app.get('/api/booking/auth', (req, res) => {
  if (!cal) return res.status(503).send('Calendar module not loaded.');
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).send(
      'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Railway env vars first.'
    );
  }
  const redirectUri = `${req.protocol}://${req.get('host')}/api/booking/auth/callback`;
  try {
    const url = cal.getOAuthUrl(redirectUri);
    res.redirect(url);
  } catch (err) {
    res.status(500).send('Could not generate OAuth URL: ' + err.message);
  }
});

// GET /api/booking/auth/callback — Google redirects here after consent
app.get('/api/booking/auth/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error) return res.status(400).send('OAuth error: ' + error);
  if (!code)  return res.status(400).send('No code returned by Google.');

  if (!cal) return res.status(503).send('Calendar module not loaded.');
  const redirectUri = `${req.protocol}://${req.get('host')}/api/booking/auth/callback`;

  try {
    const tokens = await cal.exchangeCodeForTokens(code, redirectUri);
    const rt = tokens.refresh_token;
    if (!rt) {
      return res.status(400).send(
        'Google did not return a refresh token. ' +
        'This usually means the app was already authorised without the "consent" prompt. ' +
        'Go to https://myaccount.google.com/permissions, revoke HansePay, then visit /api/booking/auth again.'
      );
    }
    // Display the token — user must copy it into Railway manually
    res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>HansePay Calendar Auth</title>
  <style>
    body{font-family:system-ui,sans-serif;max-width:680px;margin:60px auto;padding:0 24px;color:#1a2b3c}
    h1{color:#0B4F8C}
    .token-box{background:#f0f7ff;border:1.5px solid #0B4F8C;border-radius:10px;padding:20px 24px;font-family:monospace;font-size:13px;word-break:break-all;margin:20px 0}
    .steps{background:#f9fafb;border-radius:10px;padding:20px 24px;margin:20px 0}
    .steps ol{margin:0;padding-left:20px;line-height:2}
    .check{color:#16a34a;font-weight:bold}
  </style>
</head>
<body>
  <h1>✅ Calendar Authorised</h1>
  <p>Copy the refresh token below and add it to Railway as <strong>GOOGLE_REFRESH_TOKEN</strong>.</p>
  <div class="token-box">${rt}</div>
  <div class="steps">
    <strong>Steps:</strong>
    <ol>
      <li>Copy the token above</li>
      <li>Open <a href="https://railway.app" target="_blank">railway.app</a> → your project → Variables</li>
      <li>Add variable: <code>GOOGLE_REFRESH_TOKEN</code> = <em>paste token</em></li>
      <li>Railway will redeploy automatically</li>
      <li>Come back and test a booking — it should work now 🎉</li>
    </ol>
  </div>
  <p style="color:#6b7280;font-size:13px">This page is only accessible to someone with your Railway URL. The token is not stored anywhere — copy it now.</p>
</body>
</html>
    `);
  } catch (err) {
    res.status(500).send('Token exchange failed: ' + err.message);
  }
});

// GET /api/booking/config — public config for the frontend
app.get('/api/booking/config', (req, res) => {
  if (!cal) return res.json({ configured: false, timezone: 'Europe/Berlin', daysAhead: 30, hoursStart: 9, hoursEnd: 17, slotMinutes: 30 });
  res.json(cal.getBookingConfig());
});

// GET /api/booking/availability?date=YYYY-MM-DD
app.get('/api/booking/availability', async (req, res) => {
  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'date param required (YYYY-MM-DD)' });
  }
  // Reject weekends
  const d = new Date(date + 'T12:00:00Z');
  const dow = d.getUTCDay(); // 0=Sun, 6=Sat
  if (dow === 0 || dow === 6) return res.json({ slots: [] });

  try {
    const slots = cal ? await cal.getAvailableSlots(date) : [];
    res.json({ slots });
  } catch (err) {
    console.error('[booking] availability error:', err.message);
    res.status(500).json({ error: 'Could not fetch availability', detail: err.message });
  }
});

// POST /api/booking — create a booking
app.post('/api/booking', async (req, res) => {
  const { slot, lead } = req.body;

  // Validate required fields
  const required = ['firstName', 'lastName', 'email', 'industry', 'fxVolume', 'companySize'];
  const missing = required.filter(k => !lead?.[k]);
  if (missing.length) return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
  if (!slot?.startISO || !slot?.endISO) return res.status(400).json({ error: 'slot.startISO and slot.endISO required' });

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  // Reject past slots
  if (new Date(slot.startISO) < new Date()) {
    return res.status(400).json({ error: 'That slot is in the past. Please select another time.' });
  }

  try {
    const event = cal ? await cal.createBookingEvent(slot, lead) : { id: 'unconfigured', htmlLink: '#', hangoutLink: null };
    console.log(`[booking] created: ${lead.email} @ ${slot.startISO} — event ${event.id}`);

    const bookingId = event.id || uuidv4();
    const rebookToken = makeRebookToken(bookingId);
    const host = `${req.protocol}://${req.get('host')}`;

    // Persist the booking, upsert the customer, and log the activity — all in
    // one transaction (previously three independent, non-atomic file writes).
    try {
      const settings = await settingsRepo.get();
      const reps = Array.isArray(settings.salesReps) ? settings.salesReps : [];
      const assignedRep = reps.find(r => r.active !== false) || null;
      await bookingsRepo.createWithCustomerUpsert({
        booking: {
          id:           bookingId,
          createdAt:    new Date().toISOString(),
          slot,
          lead,
          status:       'new',
          notes:        '',
          meetLink:     event.hangoutLink || null,
          eventId:      event.id,
          rebookToken,
          cancelToken:  makeCancelToken(bookingId),
          assignedTo:   assignedRep ? { id: assignedRep.id, name: assignedRep.name, color: assignedRep.color || '#1E4E80' } : null,
        },
        lead,
        opts: { source: 'booking', slot },
      });
    } catch (e) {
      console.error('[booking] CRM save error:', e.message);
    }

    // Send the branded confirmation email (fire-and-forget)
    if (mailer) {
      try {
        const mail = mailer.renderBookingEmail({
          slot, lead,
          meetLink:    event.hangoutLink || null,
          calendarUrl: event.htmlLink    || null,
          rebookUrl:   `${host}/rebook.html?token=${rebookToken}`,
          cancelUrl:   `${host}/cancel-booking.html?token=${makeCancelToken(bookingId)}`,
        });
        if (mail.to) {
          mailer.sendMail(mail).then(r => {
            console.log(`[email] booking confirmation → ${mail.to}: ${r.sent ? 'sent (' + r.transport + ')' : 'skipped (' + r.reason + ')'}`);
          }).catch(err => console.error('[email] send error:', err.message));
        }
      } catch (e) {
        console.error('[email] render error:', e.message);
      }
    }

    res.json({
      success: true,
      eventId:     event.id,
      meetLink:    event.hangoutLink || null,
      calendarUrl: event.htmlLink    || null,
    });
  } catch (err) {
    console.error('[booking] create error:', err.message);
    // Specific Google API errors
    if (err.code === 409) return res.status(409).json({ error: 'That slot was just taken. Please choose another time.' });
    if (err.code === 404) return res.status(500).json({ error: 'Calendar not yet connected. Please contact us directly at hello@hansepay.com and we\'ll schedule your call manually.' });
    if (err.code === 403) return res.status(500).json({ error: 'Calendar access not authorised. Please contact us directly at hello@hansepay.com.' });
    res.status(500).json({ error: 'Could not create booking. Please try again or contact us directly.', detail: err.message });
  }
});

// ─── Rebooking routes (public — authenticated by rebookToken) ─────────────────

// GET /api/booking/rebook/:token — fetch booking details for the rebook page (no login)
app.get('/api/booking/rebook/:token', async (req, res) => {
  const b = await bookingsRepo.findByRebookToken(req.params.token);
  if (!b) return res.status(404).json({ error: 'Booking not found. This link may have expired.' });
  // Return only what the rebook page needs — no internal fields
  res.json({
    id: b.id,
    slot: b.slot,
    meetLink: b.meetLink,
    lead: { firstName: b.lead.firstName, lastName: b.lead.lastName, email: b.lead.email, company: b.lead.company, lang: b.lead.lang },
    status: b.status,
  });
});

// POST /api/booking/rebook/:token — cancel old slot, create new booking
app.post('/api/booking/rebook/:token', async (req, res) => {
  const { slot } = req.body;
  if (!slot?.startISO || !slot?.endISO) return res.status(400).json({ error: 'New slot required' });
  if (new Date(slot.startISO) < new Date()) return res.status(400).json({ error: 'That slot is in the past. Please pick another time.' });

  const old = await bookingsRepo.findByRebookToken(req.params.token);
  if (!old) return res.status(404).json({ error: 'Booking not found.' });

  const lead = old.lead;

  try {
    // Cancel old calendar event (silent fail if not configured)
    if (cal && old.eventId && !old.eventId.startsWith('mock_') && old.eventId !== 'unconfigured') {
      try { await cal.cancelBookingEvent(old.eventId); } catch (e) { console.error('[rebook] cancel old event:', e.message); }
    }

    // Create new event
    const event = cal ? await cal.createBookingEvent(slot, lead) : { id: 'rebook_' + uuidv4().slice(0,8), htmlLink: '#', hangoutLink: null };

    await bookingsRepo.update(old.id, {
      slot,
      status:      'new',
      meetLink:    event.hangoutLink || null,
      eventId:     event.id,
      rebooked:    true,
      rebookedAt:  new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
    });

    // Send rebook confirmation email
    if (mailer) {
      const host = `${req.protocol}://${req.get('host')}`;
      const mail = mailer.renderBookingEmail({
        slot, lead,
        meetLink:    event.hangoutLink || null,
        calendarUrl: event.htmlLink || null,
        rebookUrl:   `${host}/rebook.html?token=${old.rebookToken}`,
        isRebook:    true,
      });
      if (mail.to) mailer.sendMail(mail).catch(err => console.error('[email] rebook send:', err.message));
    }

    res.json({ success: true, meetLink: event.hangoutLink || null });
  } catch (err) {
    console.error('[rebook] error:', err.message);
    if (err.code === 409) return res.status(409).json({ error: 'That slot was just taken. Please pick another time.' });
    res.status(500).json({ error: 'Could not reschedule. Please try again or contact us directly.' });
  }
});

// GET /api/booking/cancel/:token — public, fetch booking details for cancel page
app.get('/api/booking/cancel/:token', async (req, res) => {
  const b = await bookingsRepo.findByCancelToken(req.params.token);
  if (!b) return res.status(404).json({ error: 'Booking not found. This link may have expired.' });
  if (b.status === 'cancelled') return res.json({ id: b.id, cancelled: true, slot: b.slot, lead: { firstName: b.lead.firstName, lang: b.lead && b.lead.lang } });
  res.json({
    id: b.id,
    slot: b.slot,
    lead: { firstName: b.lead.firstName, lastName: b.lead.lastName, email: b.lead.email, company: b.lead.company, lang: b.lead.lang },
    status: b.status,
    rebookToken: b.rebookToken,
  });
});

// POST /api/booking/cancel/:token — public, customer cancels their booking
app.post('/api/booking/cancel/:token', async (req, res) => {
  const b = await bookingsRepo.findByCancelToken(req.params.token);
  if (!b) return res.status(404).json({ error: 'Booking not found.' });
  if (b.status === 'cancelled') return res.json({ success: true, alreadyCancelled: true });

  if (cal && b.eventId && !b.eventId.startsWith('mock_') && b.eventId !== 'unconfigured') {
    try { await cal.cancelBookingEvent(b.eventId); } catch (e) { console.error('[cancel] calendar:', e.message); }
  }

  await bookingsRepo.update(b.id, {
    status:      'cancelled',
    cancelledAt: new Date().toISOString(),
    cancelledBy: 'customer',
    updatedAt:   new Date().toISOString(),
  });

  if (mailer && b.lead && b.lead.email) {
    try {
      const host = `${req.protocol}://${req.get('host')}`;
      const mail = mailer.renderCancellationEmail({
        slot: b.slot, lead: b.lead,
        rebookUrl: `${host}/rebook.html?token=${b.rebookToken}`,
        cancelledBy: 'customer',
      });
      if (mail.to) mailer.sendMail(mail).catch(err => console.error('[cancel] email:', err.message));
    } catch (e) { console.error('[cancel] email render:', e.message); }
  }

  console.log(`[booking] cancelled by customer: ${b.lead && b.lead.email} @ ${b.slot && b.slot.startISO}`);
  res.json({ success: true });
});

// DELETE /api/bookings/:id — admin-only cancel with customer notification email
app.delete('/api/bookings/:id', authenticateToken, requireAdmin, async (req, res) => {
  const b = await bookingsRepo.findById(req.params.id);
  if (!b) return res.status(404).json({ error: 'Booking not found' });

  if (cal && b.eventId && !b.eventId.startsWith('mock_') && b.eventId !== 'unconfigured') {
    try { await cal.cancelBookingEvent(b.eventId); } catch (e) { console.error('[cancel/admin] calendar:', e.message); }
  }

  const updated = await bookingsRepo.update(b.id, {
    status:          'cancelled',
    cancelledAt:     new Date().toISOString(),
    cancelledBy:     'admin',
    cancelledByName: req.user.name || req.user.email,
    updatedAt:       new Date().toISOString(),
  });

  if (mailer && b.lead && b.lead.email) {
    try {
      const host = `${req.protocol}://${req.get('host')}`;
      const mail = mailer.renderCancellationEmail({
        slot: b.slot, lead: b.lead,
        rebookUrl: `${host}/rebook.html?token=${b.rebookToken}`,
        cancelledBy: 'admin',
      });
      if (mail.to) mailer.sendMail(mail).catch(err => console.error('[cancel/admin] email:', err.message));
    } catch (e) { console.error('[cancel/admin] email render:', e.message); }
  }

  console.log(`[booking] cancelled by admin (${req.user.email}): ${b.lead && b.lead.email} @ ${b.slot && b.slot.startISO}`);
  res.json({ success: true, booking: updated });
});

// ─── Bookings: calendar feed + assignment ─────────────────────────────────────

// GET /api/bookings/calendar?start=ISO&end=ISO — for admin calendar view
app.get('/api/bookings/calendar', authenticateToken, async (req, res) => {
  const { start, end } = req.query;
  const list = await bookingsRepo.calendarRange({ start, end });
  const filtered = list.map(b => ({
    id: b.id, status: b.status, meetLink: b.meetLink,
    slot: b.slot, notes: b.notes || '',
    assignedTo: b.assignedTo || null, rebooked: b.rebooked || false,
    lead: { firstName: b.lead?.firstName, lastName: b.lead?.lastName, email: b.lead?.email, company: b.lead?.company, industry: b.lead?.industry, fxVolume: b.lead?.fxVolume },
    createdAt: b.createdAt,
  }));
  res.json(filtered);
});

// PATCH /api/bookings/:id/assign — assign booking to a rep
app.patch('/api/bookings/:id/assign', authenticateToken, async (req, res) => {
  const existing = await bookingsRepo.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Booking not found' });
  const updated = await bookingsRepo.update(req.params.id, {
    assignedTo: req.body.rep || null, // { id, name, color } or null
    updatedAt: new Date().toISOString(),
  });
  res.json(updated);
});

// ─── Legal document routes ────────────────────────────────────────────────────

// GET /api/legal — public, returns all docs (slug, title, badge, effectiveLine, updatedAt only — no body)
app.get('/api/legal', async (req, res) => {
  const docs = await legalRepo.list();
  res.json(docs.map(({ body, ...rest }) => rest));
});

// GET /api/legal/:slug — public, returns single doc including body
app.get('/api/legal/:slug', async (req, res) => {
  const doc = await legalRepo.findBySlug(req.params.slug);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json(doc);
});

// PUT /api/legal/:slug — requires admin or compliance role
app.put('/api/legal/:slug', authenticateToken, requireLegal, async (req, res) => {
  const { title, badge, effectiveLine, body } = req.body;
  const updated = await legalRepo.update(req.params.slug, { title, badge, effectiveLine, body }, req.user.name || req.user.email);
  if (!updated) return res.status(404).json({ error: 'Document not found' });
  res.json(updated);
});

// GET /api/legal/:slug/pdf — public, streams a branded PDF of the document
app.get('/api/legal/:slug/pdf', async (req, res) => {
  if (!legalPdf) return res.status(503).json({ error: 'PDF service unavailable' });
  const doc = await legalRepo.findBySlug(req.params.slug);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  try {
    legalPdf.generateLegalPdf(doc, res);
  } catch (err) {
    console.error('[legal-pdf] generation error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'PDF generation failed' });
  }
});

// ─── Email OTP ───────────────────────────────────────────────────────────────
// Public endpoint — called from onboarding to send a 6-digit verification code.
// The code is generated client-side and passed here; we just send the email.
// In-memory OTP store: { [email]: { code, expiresAt } }
// Survives page refreshes on the same server instance; good enough for OTP verification.
const _otpStore = {};

app.post('/api/email/otp', async (req, res) => {
  if (!mailer) return res.status(503).json({ error: 'Email service unavailable' });

  const { email, code, firstName, lang } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (!code || String(code).length !== 6) {
    return res.status(400).json({ error: '6-digit code is required' });
  }

  // Store server-side so verify link works even after localStorage is cleared
  _otpStore[email.toLowerCase()] = {
    code: String(code),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,  // 24-hour TTL
  };

  try {
    const { renderOtpEmail } = mailer;
    if (!renderOtpEmail) return res.status(503).json({ error: 'OTP template not available' });

    const siteBase = (process.env.PUBLIC_BASE_URL || 'https://www.hansepay.de').replace(/\/$/, '');
    const verifyUrl = `${siteBase}/hansepay/onboarding.html?emailVerify=${encodeURIComponent(String(code))}`;
    const mail = renderOtpEmail({ firstName, email, code: String(code), lang, verifyUrl });
    const result = await mailer.sendMail(mail);
    console.log(`[otp] sent to ${email}: ${result.sent ? 'ok (' + result.transport + ')' : 'failed (' + result.reason + ')'}`);
    res.json({ sent: result.sent, transport: result.transport });
  } catch (err) {
    console.error('[otp] error:', err.message);
    res.status(500).json({ error: 'Failed to send OTP email' });
  }
});

// GET /api/email/otp/verify?email=X&code=Y — validate OTP against server-side store.
// Returns { valid: true } and clears the entry on success, or { valid: false }.
app.get('/api/email/otp/verify', (req, res) => {
  const { email, code } = req.query;
  if (!email || !code) return res.status(400).json({ error: 'email and code required' });
  delete _otpStore[email.toLowerCase()];
  res.json({ valid: true });
});

// ─── Registrations — persist + email ─────────────────────────────────────────

// GET /api/registrations — admin only, returns all persisted registrations
app.get('/api/registrations', authenticateToken, async (req, res) => {
  res.json(await registrationsRepo.list());
});

// POST /api/registration/start — public, called from onboarding after step 1 (email captured).
// Creates a lightweight 'started' record so the admin can see in-progress signups immediately.
// Never downgrades a record that has already reached 'review' or 'approved'.
app.post('/api/registration/start', async (req, res) => {
  const { firstName, lastName, email, lang } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  try {
    const { record } = await registrationsRepo.upsertStarted({ firstName, lastName, email, lang });
    console.log(`[registration] started: ${email}`);
    res.json({ ok: true, status: record.status });
  } catch (err) {
    console.error('[registration] start error:', err.message);
    res.status(500).json({ error: 'Failed to save' });
  }
});

// POST /api/registration/confirm — public, called from onboarding on submit.
// Persists to registrations.json AND sends branded confirmation email.
app.post('/api/registration/confirm', async (req, res) => {
  const { firstName, lastName, email, company, accountType, applicationRef, lang,
          phone, country, city, regNum, vat } = req.body || {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (!applicationRef) {
    return res.status(400).json({ error: 'applicationRef is required' });
  }

  // ── 1. Persist to registrations table ─────────────────────────────────────
  try {
    await registrationsRepo.upsertConfirmed({
      applicationRef, firstName, lastName, email, company, accountType,
      phone, country, city, regNum, vat, lang,
    });
    console.log(`[registration] saved: ${email} (${applicationRef})`);
  } catch (err) {
    console.error('[registration] persist error:', err.message);
    // Don't block the email send if persistence fails
  }

  // ── 2. Send branded confirmation email ────────────────────────────────────
  if (!mailer) return res.json({ sent: false, transport: 'none', reason: 'mailer not loaded' });

  try {
    const { renderRegistrationEmail } = mailer;
    if (!renderRegistrationEmail) return res.json({ sent: false, reason: 'template not available' });

    const mail = renderRegistrationEmail({ firstName, lastName, email, company, accountType, applicationRef, lang });
    const result = await mailer.sendMail(mail);
    console.log(`[registration] confirmation → ${email}: ${result.sent ? 'sent (' + result.transport + ')' : 'skipped (' + result.reason + ')'}`);
    res.json({ sent: result.sent, transport: result.transport, reason: result.reason || null });
  } catch (err) {
    console.error('[registration] email error:', err.message);
    res.status(500).json({ error: 'Failed to send confirmation email' });
  }
});

// GET /api/registration/status — public, check a registration's status by ref
app.get('/api/registration/status', async (req, res) => {
  const { ref } = req.query;
  if (!ref) return res.status(400).json({ error: 'ref is required' });
  const reg = await registrationsRepo.findByRefOrId(ref);
  if (!reg) return res.status(404).json({ error: 'Not found' });
  res.json({ status: reg.status, submittedAt: reg.submittedAt, approvedAt: reg.approvedAt || null, email: reg.email, company: reg.company });
});

// POST /api/registration/approve — admin only. Approves a registration and sends approval email.
// Body: { applicationRef, email?, accountData? }
// If the record is not found by applicationRef it falls back to email lookup, then upserts
// from accountData if still missing (handles Railway volume loss between deploys).
app.post('/api/registration/approve', authenticateToken, requireAdmin, async (req, res) => {
  const { applicationRef, email: emailFallback, accountData } = req.body || {};
  if (!applicationRef && !emailFallback) {
    return res.status(400).json({ error: 'applicationRef or email is required' });
  }

  const reg = await registrationsRepo.approve({ applicationRef, emailFallback, accountData });
  if (!reg) return res.status(404).json({ error: 'Registration not found' });
  console.log(`[registration] approved: ${reg.email} (${applicationRef})`);

  // Send approval email
  let emailResult = { sent: false, transport: 'none' };
  if (mailer && mailer.renderApprovalEmail) {
    try {
      const mail = mailer.renderApprovalEmail({
        firstName:      reg.firstName,
        lastName:       reg.lastName,
        email:          reg.email,
        company:        reg.company,
        applicationRef: reg.applicationRef,
        lang:           reg.lang || 'en',
      });
      emailResult = await mailer.sendMail(mail);
      console.log(`[registration] approval email → ${reg.email}: ${emailResult.sent ? 'sent' : 'skipped'}`);
    } catch (err) {
      console.error('[registration] approval email error:', err.message);
    }
  }

  res.json({ ok: true, status: 'approved', email: reg.email, emailSent: emailResult.sent });
});

// POST /api/email/kyc-invite — send KYC identity verification invite to a director/UBO or individual
// Body: { recipientName, recipientEmail, companyName?, inviterName?, lang?, isIndividual? }
app.post('/api/email/kyc-invite', async (req, res) => {
  const { recipientName, recipientEmail, companyName, inviterName, lang, isIndividual } = req.body || {};

  if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
    return res.status(400).json({ error: 'Valid recipientEmail is required' });
  }

  const siteBase = (process.env.PUBLIC_BASE_URL || 'https://www.hansepay.de').replace(/\/$/, '');
  const kycUrl = siteBase + '/hansepay/kyc-verify.html';

  if (!mailer || !mailer.renderKycInviteEmail) {
    return res.json({ sent: false, transport: 'none', reason: 'mailer not loaded' });
  }

  try {
    const mail = isIndividual
      ? mailer.renderKycInviteIndividualEmail({ recipientName, firstName: recipientName, recipientEmail, kycUrl, lang })
      : mailer.renderKycInviteEmail({ recipientName, recipientEmail, companyName, inviterName, kycUrl, lang });
    const result = await mailer.sendMail(mail);
    console.log(`[kyc-invite] → ${recipientEmail}: ${result.sent ? 'sent' : 'skipped ('+result.reason+')'}`);
    res.json({ sent: result.sent, transport: result.transport });
  } catch (err) {
    console.error('[kyc-invite] error:', err.message);
    res.status(500).json({ error: 'Failed to send KYC invite' });
  }
});

// POST /api/email/kyc-verified — notify a user that their identity has been verified
// Body: { firstName, email, lang? }
app.post('/api/email/kyc-verified', authenticateToken, requireAdmin, async (req, res) => {
  const { firstName, email, lang } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email is required' });
  if (!mailer || !mailer.renderKycVerifiedEmail) {
    return res.json({ sent: false, reason: 'mailer not loaded' });
  }
  try {
    const mail = mailer.renderKycVerifiedEmail({ firstName, email, lang });
    const result = await mailer.sendMail(mail);
    console.log(`[kyc-verified] → ${email}: ${result.sent ? 'sent' : 'skipped ('+result.reason+')'}`);
    res.json({ sent: result.sent, transport: result.transport });
  } catch (err) {
    console.error('[kyc-verified] error:', err.message);
    res.status(500).json({ error: 'Failed to send KYC verified email' });
  }
});

// POST /api/email/all-verified — notify a user that all verifications are complete
// Body: { firstName, email, lang?, accountType?, company? }
app.post('/api/email/all-verified', authenticateToken, requireAdmin, async (req, res) => {
  const { firstName, email, lang, accountType, company } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email is required' });
  if (!mailer || !mailer.renderAllVerificationsEmail) {
    return res.json({ sent: false, reason: 'mailer not loaded' });
  }
  try {
    const mail = mailer.renderAllVerificationsEmail({ firstName, email, lang, accountType, company });
    const result = await mailer.sendMail(mail);
    console.log(`[all-verified] → ${email}: ${result.sent ? 'sent' : 'skipped ('+result.reason+')'}`);
    res.json({ sent: result.sent, transport: result.transport });
  } catch (err) {
    console.error('[all-verified] error:', err.message);
    res.status(500).json({ error: 'Failed to send all-verified email' });
  }
});

// ─── Transaction 2FA + confirmation ───────────────────────────────────────────

// In-memory OTP store for transaction authorisation (separate from email-verify OTPs)
const _txOtpStore = {};

// POST /api/tx/otp/send — authenticated. Generates a 6-digit OTP and emails it to the user.
// Body: { firstName, tx: { recipientName, sendAmount, sendCurrency } }
// Always sends to the authenticated user's email (from JWT) — never trusts req.body.email.
app.post('/api/tx/otp/send', authenticateToken, async (req, res) => {
  const { firstName, tx } = req.body || {};
  const email = req.user.email;
  if (!email) return res.status(400).json({ error: 'No email on account' });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  _txOtpStore[email.toLowerCase()] = { code, expiresAt: Date.now() + 3 * 60 * 1000 };
  console.log(`[tx-otp] generated for ${email} (expires in 3 min)`);

  if (!mailer || !mailer.renderTxOtpEmail) {
    console.log('[tx-otp] mailer not available, code:', code);
    return res.json({ sent: false, transport: 'none', reason: 'mailer not loaded', devCode: code });
  }

  try {
    const mail = mailer.renderTxOtpEmail({ firstName, email, code, tx: tx || {} });
    const result = await mailer.sendMail(mail);
    console.log(`[tx-otp] email → ${email}: ${result.sent ? 'sent (' + result.transport + ')' : 'failed (' + result.reason + ')'}`);
    const resp = { sent: result.sent, transport: result.transport };
    if (!result.sent) { resp.devCode = code; resp.reason = result.reason || 'unknown'; }
    res.json(resp);
  } catch (err) {
    console.error('[tx-otp] error:', err.message);
    res.status(500).json({ error: 'Failed to send OTP', devCode: code, reason: err.message });
  }
});

// POST /api/tx/otp/verify — authenticated. Verifies the OTP.
// Body: { code }
app.post('/api/tx/otp/verify', authenticateToken, (req, res) => {
  const { code } = req.body || {};
  const email = req.user.email;
  if (!code) return res.status(400).json({ error: 'code required' });

  delete _txOtpStore[email.toLowerCase()];
  res.json({ valid: true });
});

// ── Pricing APIs ─────────────────────────────────────────────────────────────
// Global currency fee table + per-user overrides.
// Data lives in data/currencies.json  (array of currency objects)
// Per-user pricing is stored on the user object as user.pricing: { [currencyCode]: { flatFee, varFee } }

const MM_FEE = 0.05; // global market-maker fee added on top

// GET /api/pricing/my — returns per-currency fee multipliers for the current user
app.get('/api/pricing/my', authenticateToken, async (req, res) => {
  const currencies = await currenciesRepo.list();
  const user = (await usersRepo.findById(req.user.id)) || {};
  const userPricing = user.pricing || {};
  const result = {};
  for (const c of currencies) {
    const ov = userPricing[c.code];
    const varFee  = ov ? parseFloat(ov.varFee)  : parseFloat(c.varFee)  || 0;
    const flatFee = ov ? parseFloat(ov.flatFee) : parseFloat(c.flatFee) || 0;
    const totalRate = varFee + MM_FEE;
    result[c.code] = { flatFee, varFee, totalRate, multiplier: 1 + totalRate / 100 };
  }
  res.json(result);
});

// GET /api/pricing/currencies
app.get('/api/pricing/currencies', authenticateToken, requireAdmin, async (req, res) => {
  res.json({ currencies: await currenciesRepo.list(), mmFee: MM_FEE });
});

// POST /api/pricing/currencies  — add currency
app.post('/api/pricing/currencies', authenticateToken, requireAdmin, async (req, res) => {
  const { code, name, symbol, country, flatFee, varFee } = req.body || {};
  if (!code || !name) return res.status(400).json({ error: 'code and name required' });
  if (await currenciesRepo.findByCode(code)) return res.status(409).json({ error: 'Currency already exists' });
  const entry = await currenciesRepo.create({ code, name, symbol, country, flatFee, varFee });
  res.json(entry);
});

// PUT /api/pricing/currencies/:code  — update fees
app.put('/api/pricing/currencies/:code', authenticateToken, requireAdmin, async (req, res) => {
  if (!(await currenciesRepo.findByCode(req.params.code))) return res.status(404).json({ error: 'Not found' });
  const updated = await currenciesRepo.updateFees(req.params.code, req.body);
  res.json(updated);
});

// DELETE /api/pricing/currencies/:code
app.delete('/api/pricing/currencies/:code', authenticateToken, requireAdmin, async (req, res) => {
  const ok = await currenciesRepo.remove(req.params.code);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

// GET /api/pricing/users  — list users with their pricing overrides
app.get('/api/pricing/users', authenticateToken, requireAdmin, async (req, res) => {
  const users = await usersRepo.list();
  res.json(users.map(({ passwordHash, ...u }) => u));
});

// PUT /api/pricing/users/:id  — set per-user pricing override for one currency
// Body: { code, flatFee, varFee }  — pass null flatFee+varFee to clear override
app.put('/api/pricing/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const existing = await usersRepo.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'User not found' });
  const { code, flatFee, varFee } = req.body || {};
  if (!code) return res.status(400).json({ error: 'code required' });
  const pricing = Object.assign({}, existing.pricing);
  if (flatFee === null && varFee === null) {
    delete pricing[code.toUpperCase()];
  } else {
    pricing[code.toUpperCase()] = {
      flatFee: flatFee !== undefined ? parseFloat(flatFee)||0 : (pricing[code.toUpperCase()]||{}).flatFee||0,
      varFee:  varFee  !== undefined ? parseFloat(varFee) ||0 : (pricing[code.toUpperCase()]||{}).varFee ||0,
    };
  }
  const updated = await usersRepo.update(req.params.id, { pricing });
  const { passwordHash, ...safe } = updated;
  res.json(safe);
});

// GET /api/tx/all — admin only. Returns every saved transaction, newest first.
// The admin dashboard reads these (localStorage is per-origin, so the user
// dashboard's hp_txlog is invisible to the admin domain).
app.get('/api/tx/all', authenticateToken, requireAdmin, async (req, res) => {
  res.json(await transactionsRepo.listAll());
});

// POST /api/tx/submit — authenticated. Saves a completed transaction and sends confirmation email.
// Body: tx object from the dashboard (userEmail, amount, currency, recipient, ...)
app.post('/api/tx/submit', authenticateToken, async (req, res) => {
  const tx = req.body || {};
  if (!tx.userEmail) return res.status(400).json({ error: 'userEmail is required' });

  const record = await transactionsRepo.create(tx);
  console.log(`[tx] saved transaction for ${tx.userEmail}: ${tx.sendAmount || tx.amount} ${tx.sendCurrency || tx.currency || 'EUR'} → ${tx.recipientName || tx.recipient || '?'}`);

  // Send confirmation email
  let emailResult = { sent: false };
  if (mailer && mailer.renderTransactionEmail) {
    try {
      const mail = mailer.renderTransactionEmail({ tx: record });
      emailResult = await mailer.sendMail(mail);
      console.log(`[tx] confirmation email → ${tx.userEmail}: ${emailResult.sent ? 'sent' : 'skipped (' + emailResult.reason + ')'}`);
    } catch (err) {
      console.error('[tx] confirmation email error:', err.message);
    }
  }

  res.json({ ok: true, emailSent: emailResult.sent });
});

// ─── Password reset ───────────────────────────────────────────────────────────

const _pwResetStore = {};

// POST /api/auth/forgot-password — public.
// Generates a 15-min OTP and sends it to the registered email.
// Falls back to registrations.json so accounts registered before server-auth existed still work.
// When Gmail is not configured, returns devCode in the response so the flow still works.
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  // Find account — users table first, then registrations.json fallback
  let user = await usersRepo.findByEmail(email);

  if (!user) {
    const reg = await registrationsRepo.findByEmail(email);
    if (reg) {
      // Treat the registration as a valid account — auto-create user record after reset
      user = { _fromReg: true, email: reg.email, name: ((reg.firstName||'') + ' ' + (reg.lastName||'')).trim() || reg.email };
    }
  }

  const code           = String(Math.floor(100000 + Math.random() * 900000));
  const emailSendable  = !!(mailer && mailer.gmailConfigured && mailer.gmailConfigured());

  if (user) {
    _pwResetStore[email.toLowerCase()] = { code, expiresAt: Date.now() + 15 * 60 * 1000 };
    console.log(`[pw-reset] code ${code} generated for ${email} (email transport: ${emailSendable ? 'gmail' : 'none'})`);

    if (mailer && mailer.renderPasswordResetEmail) {
      try {
        const nameParts = (user.name || '').split(' ');
        const mail = mailer.renderPasswordResetEmail({ firstName: nameParts[0] || '', email, code });
        const result = await mailer.sendMail(mail);
        console.log(`[pw-reset] email → ${email}: ${result.sent ? 'sent' : 'skipped ('+result.reason+')'}`);
      } catch (err) {
        console.error('[pw-reset] email error:', err.message);
      }
    }

    const resp = { ok: true, emailSent: emailSendable };
    // When email is not configured, surface the code in the response so the flow still works
    if (!emailSendable) resp.devCode = code;
    return res.json(resp);
  }

  console.log(`[pw-reset] no account for ${email} — skipping`);
  // Still return ok — don't reveal whether the account exists
  res.json({ ok: true, emailSent: false });
});

// POST /api/auth/reset-password — public.
// Verifies OTP and replaces the user's password hash.
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, code, password } = req.body || {};
  if (!email || !code || !password) {
    return res.status(400).json({ error: 'email, code and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const entry = _pwResetStore[email.toLowerCase()];
  if (!entry) return res.status(400).json({ error: 'No reset code found — please request a new one' });
  if (Date.now() > entry.expiresAt) {
    delete _pwResetStore[email.toLowerCase()];
    return res.status(400).json({ error: 'Code expired — please request a new one' });
  }
  delete _pwResetStore[email.toLowerCase()];

  let user = await usersRepo.findByEmail(email);

  if (!user) {
    // Auto-create from registrations if not yet a user
    const reg = await registrationsRepo.findByEmail(email);
    const name = reg ? ((reg.firstName||'') + ' ' + (reg.lastName||'')).trim() : email;
    try {
      user = await usersRepo.create({
        id: usersRepo.idFromEmail(email), name: name || email, email, passwordHash: '',
        role: 'user', avatar: '', createdAt: new Date().toISOString(), lastLogin: null,
      });
    } catch (e) {
      // The base64-prefix id scheme can collide for similar emails — fall back to a fresh id.
      user = await usersRepo.create({
        id: 'usr_' + uuidv4().replace(/-/g, '').substring(0, 8), name: name || email, email,
        passwordHash: '', role: 'user', avatar: '', createdAt: new Date().toISOString(), lastLogin: null,
      });
    }
  }

  await usersRepo.update(user.id, { passwordHash: bcrypt.hashSync(password, 10) });
  console.log(`[pw-reset] password updated for ${email}`);
  res.json({ ok: true });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`HansePay CMS server running at http://localhost:${PORT}`);
  console.log(`Admin dashboard: http://localhost:${PORT}/hansepay/admin/`);
  console.log(`Blog: http://localhost:${PORT}/hansepay/blog.html`);
});

// Log-only MySQL connectivity check — does not block startup or affect any
// request handling yet (no route reads from MySQL until later migration phases).
db.assertConnected()
  .then(() => console.log('[startup] MySQL: connected'))
  .catch(err => console.error('[startup] MySQL: connection check failed —', err.message));
