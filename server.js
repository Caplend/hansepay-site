'use strict';

const express = require('express');
const crypto = require('crypto');
const cal = (() => { try { return require('./lib/calendar'); } catch(e) { return null; } })();
const mailer = (() => { try { return require('./lib/email'); } catch(e) { console.error('[email] module load failed:', e.message); return null; } })();
const xlsx = (() => { try { return require('./lib/xlsx'); } catch(e) { return null; } })();
const crm = (() => { try { return require('./lib/crm'); } catch(e) { return null; } })();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 4200;
const JWT_SECRET = 'hansepay-cms-secret-2024';
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
['users', 'posts', 'settings', 'seo', 'bookings', 'analytics', 'customers', 'activities'].forEach(name => {
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

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Coming Soon gate ─────────────────────────────────────────────────────────
// Set PREVIEW_TOKEN env var in Railway (e.g. "hansepay2026").
// Visiting /?preview=TOKEN grants a 30-day cookie to browse the full site.
// Toggle comingSoonMode in Admin → Settings to go live instantly.
app.use((req, res, next) => {
  // Skip: API, admin panel, static assets, uploads, and legal pages
  const skipPrefixes = ['/api/', '/hansepay/admin/', '/admin/', '/uploads/', '/assets/'];
  const skipExact = ['/imprint.html', '/cookie-policy.html', '/coming-soon.html',
                     '/booking.html', '/hansepay/booking.html',
                     '/hansepay/imprint.html', '/hansepay/cookie-policy.html',
                     '/onboarding.html', '/hansepay/onboarding.html',
                     '/rebook.html', '/hansepay/rebook.html'];
  if (skipPrefixes.some(p => req.path.startsWith(p))) return next();
  if (skipExact.includes(req.path)) return next();

  const settings = readData('settings.json');
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

// Static files — files live at repo root in hansepay-deploy
app.use(express.static(__dirname));
// Also serve under /hansepay/ prefix for compatibility with landing page links
app.use('/hansepay', express.static(__dirname));
// Serve uploads
app.use('/uploads', express.static(UPLOADS_DIR));

// ─── Data helpers ───────────────────────────────────────────────────────────

function readData(filename) {
  const fp = path.join(DATA_DIR, filename);
  const arrayFiles = ['users.json', 'analytics.json', 'bookings.json', 'customers.json', 'activities.json'];
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

// ─── CRM helpers ──────────────────────────────────────────────────────────────

function logActivity({ customerId, type, title, body, by }) {
  const activities = readData('activities.json');
  const list = Array.isArray(activities) ? activities : [];
  const entry = {
    id:         'act_' + uuidv4().replace(/-/g, '').substring(0, 10),
    customerId,
    type:       type || 'note',
    title:      title || '',
    body:       body || '',
    by:         by || 'system',
    at:         new Date().toISOString(),
  };
  list.push(entry);
  writeData('activities.json', list);
  return entry;
}

function activitiesFor(customerId) {
  const activities = readData('activities.json');
  return (Array.isArray(activities) ? activities : [])
    .filter(a => a.customerId === customerId)
    .sort((a, b) => new Date(b.at) - new Date(a.at));
}

// Create or update a customer from an inbound lead (e.g. a booking).
function upsertCustomerFromLead(lead, opts) {
  opts = opts || {};
  const customers = readData('customers.json');
  const list = Array.isArray(customers) ? customers : [];
  const email = (lead.email || '').toLowerCase().trim();
  const now = new Date().toISOString();

  let cust = email ? list.find(c => (c.email || '').toLowerCase() === email) : null;
  let isNew = false;

  if (!cust) {
    isNew = true;
    cust = {
      id:        'cust_' + uuidv4().replace(/-/g, '').substring(0, 10),
      firstName: lead.firstName || '',
      lastName:  lead.lastName || '',
      email:     lead.email || '',
      phone:     lead.phone || '',
      website:   lead.website || '',
      company:   lead.company || '',
      industry:  lead.industry || '',
      companySize: lead.companySize || '',
      country:   lead.country || '',
      city:      lead.city || '',
      fxVolume:  lead.fxVolume || '',
      currencyPairs: lead.currencyPairs || '',
      stage:     'lead',
      status:    'prospect',
      owner:     '',
      source:    opts.source || 'booking',
      tags:      [],
      notes:     lead.notes || '',
      bookingIds: [],
      lastContactAt:  now,
      nextFollowUpAt: null,
      lang:      lead.lang || 'de',
      createdAt: now,
      updatedAt: now,
    };
    list.push(cust);
  } else {
    // Fill blanks from the new lead, keep existing CRM edits
    ['firstName', 'lastName', 'company', 'phone', 'website', 'industry', 'companySize', 'country', 'city', 'fxVolume'].forEach(k => {
      if (!cust[k] && lead[k]) cust[k] = lead[k];
    });
    cust.lastContactAt = now;
    cust.updatedAt = now;
    if (cust.status === 'churned') cust.status = 'active'; // re-engaged
  }

  if (opts.bookingId) {
    cust.bookingIds = cust.bookingIds || [];
    if (!cust.bookingIds.includes(opts.bookingId)) cust.bookingIds.push(opts.bookingId);
  }

  writeData('customers.json', list);

  logActivity({
    customerId: cust.id,
    type:       'booking',
    title:      isNew ? 'New lead from booking' : 'Repeat booking',
    body:       opts.slot ? `Discovery call booked for ${opts.slot.label || opts.slot.startISO}` : 'Discovery call booked',
    by:         'system',
  });

  return cust;
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
    uptime: process.uptime(),
  });
});

// ─── Auth routes ─────────────────────────────────────────────────────────────

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const users = readData('users.json');
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = bcrypt.compareSync(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const users = readData('users.json');
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { passwordHash, claudeApiKey, ...userSafe } = user;
  // Tell the frontend whether a key is saved without exposing it
  userSafe.hasClaudeKey = !!claudeApiKey;
  res.json(userSafe);
});

// PUT /api/users/profile — let any authenticated user update their own profile
app.put('/api/users/profile', authenticateToken, (req, res) => {
  const users = readData('users.json');
  const idx = users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });

  const profileFields = ['name', 'role', 'bio', 'avatarUrl', 'linkedin', 'aiModel', 'aiSystemPrompt'];
  profileFields.forEach(k => {
    if (req.body[k] !== undefined) users[idx][k] = req.body[k];
  });
  // Only overwrite API key if a non-empty value was sent
  if (req.body.claudeApiKey && req.body.claudeApiKey.trim()) {
    users[idx].claudeApiKey = req.body.claudeApiKey.trim();
  }

  writeData('users.json', users);
  const { passwordHash, claudeApiKey, ...userSafe } = users[idx];
  userSafe.hasClaudeKey = !!users[idx].claudeApiKey;
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

app.get('/api/posts', (req, res) => {
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
    const posts = readData('posts.json');
    return res.json(posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  }

  const posts = readData('posts.json');
  const published = posts
    .filter(p => p.status === 'published' && p.showInListing !== false)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(published);
});

app.get('/api/posts/:slug', (req, res) => {
  const posts = readData('posts.json');
  const idx = posts.findIndex(p => p.slug === req.params.slug || p.id === req.params.slug);
  if (idx === -1) return res.status(404).json({ error: 'Post not found' });

  // Increment view count (support both 'viewCount' and 'views' field names)
  if ('viewCount' in posts[idx]) {
    posts[idx].viewCount = (posts[idx].viewCount || 0) + 1;
  } else {
    posts[idx].views = (posts[idx].views || 0) + 1;
  }
  writeData('posts.json', posts);

  res.json(posts[idx]);
});

app.post('/api/posts', authenticateToken, (req, res) => {
  const { title, slug, excerpt, content, category, tags, status, featuredImage } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });

  const users = readData('users.json');
  const author = users.find(u => u.id === req.user.id);

  const posts = readData('posts.json');
  const { featured, readTime, showInListing,
          authorRole, authorBio, authorAvatar, authorLinkedin, publishedAt } = req.body;
  const newPost = {
    id: 'post_' + uuidv4().replace(/-/g, '').substring(0, 8),
    title,
    slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    excerpt: excerpt || '',
    content: content || '',
    category: category || 'Uncategorised',
    tags: tags || [],
    status: status || 'draft',
    featured: !!featured,
    showInListing: showInListing !== false,
    featuredImage: featuredImage || null,
    readTime: readTime || null,
    authorId: req.user.id,
    author: req.body.author || (author ? author.name : req.user.name),
    authorRole: authorRole || (author ? author.role : '') || '',
    authorBio: authorBio || (author ? author.bio : '') || '',
    authorAvatar: authorAvatar || (author ? author.avatarUrl : '') || '',
    authorLinkedin: authorLinkedin || (author ? author.linkedin : '') || '',
    publishedAt: publishedAt || new Date().toISOString(),
    viewCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  posts.push(newPost);
  writeData('posts.json', posts);
  res.status(201).json(newPost);
});

app.put('/api/posts/:id', authenticateToken, (req, res) => {
  const posts = readData('posts.json');
  const idx = posts.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Post not found' });

  const allowed = [
    'title', 'slug', 'excerpt', 'content', 'category', 'tags', 'status',
    'featuredImage', 'featured', 'showInListing', 'readTime',
    'author', 'authorRole', 'authorBio', 'authorAvatar', 'authorLinkedin', 'publishedAt',
  ];
  allowed.forEach(k => {
    if (req.body[k] !== undefined) posts[idx][k] = req.body[k];
  });
  posts[idx].updatedAt = new Date().toISOString();

  writeData('posts.json', posts);
  res.json(posts[idx]);
});

app.delete('/api/posts/:id', authenticateToken, requireAdmin, (req, res) => {
  let posts = readData('posts.json');
  const idx = posts.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Post not found' });
  posts.splice(idx, 1);
  writeData('posts.json', posts);
  res.json({ success: true });
});

// ─── Users routes ─────────────────────────────────────────────────────────────

app.get('/api/users', authenticateToken, requireAdmin, (req, res) => {
  const users = readData('users.json');
  res.json(users.map(({ passwordHash, ...u }) => u));
});

app.post('/api/users', authenticateToken, requireAdmin, (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });

  const users = readData('users.json');
  if (users.find(u => u.email === email)) return res.status(409).json({ error: 'Email already in use' });

  const newUser = {
    id: 'usr_' + uuidv4().replace(/-/g, '').substring(0, 8),
    name,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role: role || 'editor',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeData('users.json', users);
  const { passwordHash, ...userSafe } = newUser;
  res.status(201).json(userSafe);
});

app.put('/api/users/:id', authenticateToken, requireAdmin, (req, res) => {
  const users = readData('users.json');
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });

  const allowed = ['name', 'email', 'role'];
  allowed.forEach(k => {
    if (req.body[k] !== undefined) users[idx][k] = req.body[k];
  });
  if (req.body.password) {
    users[idx].passwordHash = bcrypt.hashSync(req.body.password, 10);
  }

  writeData('users.json', users);
  const { passwordHash, ...userSafe } = users[idx];
  res.json(userSafe);
});

app.put('/api/users/:id/password', authenticateToken, requireAdmin, (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const users = readData('users.json');
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  users[idx].passwordHash = bcrypt.hashSync(password, 10);
  writeData('users.json', users);
  res.json({ success: true });
});

app.delete('/api/users/:id', authenticateToken, requireAdmin, (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  let users = readData('users.json');
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  users.splice(idx, 1);
  writeData('users.json', users);
  res.json({ success: true });
});

// ─── AI content generation ───────────────────────────────────────────────────

app.post('/api/ai/generate-post', authenticateToken, async (req, res) => {
  const users = readData('users.json');
  const user  = users.find(u => u.id === req.user.id);
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

app.get('/api/analytics/summary', authenticateToken, (req, res) => {
  const analytics  = readData('analytics.json');
  const posts      = readData('posts.json');
  const users      = readData('users.json');
  const bookings   = readData('bookings.json');

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

app.get('/api/bookings', authenticateToken, (req, res) => {
  const bookings = readData('bookings.json');
  const list = Array.isArray(bookings) ? bookings : [];
  res.json(list.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.patch('/api/bookings/:id', authenticateToken, (req, res) => {
  const bookings = readData('bookings.json');
  if (!Array.isArray(bookings)) return res.status(404).json({ error: 'Booking not found' });
  const idx = bookings.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Booking not found' });
  ['status', 'notes'].forEach(k => {
    if (req.body[k] !== undefined) bookings[idx][k] = req.body[k];
  });
  bookings[idx].updatedAt = new Date().toISOString();
  writeData('bookings.json', bookings);
  res.json(bookings[idx]);
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
  const to = (req.body && req.body.to) || req.user.email;
  const lang = (req.body && req.body.lang) || 'en';
  const start = new Date(Date.now() + 3 * 86400000); start.setHours(11, 0, 0, 0);
  const sample = mailer.renderBookingEmail({
    slot: { startISO: start.toISOString(), endISO: new Date(start.getTime() + 1800000).toISOString(), label: '11:00 – 11:30' },
    meetLink: 'https://meet.google.com/test-link-demo',
    lead: { firstName: (req.user.name || 'there').split(' ')[0], email: to, company: 'Sample Co', industry: 'Manufacturing', fxVolume: '€250k–€1M', lang },
  });
  sample.to = to;
  const result = await mailer.sendMail(sample);
  res.json(Object.assign({ to }, result));
});

// ─── CRM: Customers ─────────────────────────────────────────────────────────

// Enrich a customer with health/value using its activities
function enrichCustomer(c) {
  if (!crm) return c;
  return crm.enrich(c, activitiesFor(c.id));
}

app.get('/api/customers', authenticateToken, (req, res) => {
  const customers = readData('customers.json');
  let list = (Array.isArray(customers) ? customers : []).map(enrichCustomer);

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

app.get('/api/customers/export', authenticateToken, (req, res) => {
  const customers = readData('customers.json');
  const list = Array.isArray(customers) ? customers : [];
  if (!crm) return res.status(503).json({ error: 'CRM module unavailable' });
  const aoa = crm.toExportRows(list, enrichCustomer);
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

app.get('/api/customers/:id', authenticateToken, (req, res) => {
  const customers = readData('customers.json');
  const c = (Array.isArray(customers) ? customers : []).find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Customer not found' });
  const enriched = enrichCustomer(c);
  enriched.activities = activitiesFor(c.id);
  const allBookings = readData('bookings.json');
  enriched.bookings = (Array.isArray(allBookings) ? allBookings : []).filter(b => (c.bookingIds || []).includes(b.id));
  res.json(enriched);
});

const CUSTOMER_FIELDS = ['firstName', 'lastName', 'email', 'phone', 'website', 'company',
  'industry', 'companySize', 'country', 'city', 'fxVolume', 'currencyPairs',
  'stage', 'status', 'owner', 'source', 'tags', 'notes', 'estValueEur',
  'lastContactAt', 'nextFollowUpAt', 'lang'];

app.post('/api/customers', authenticateToken, (req, res) => {
  const customers = readData('customers.json');
  const list = Array.isArray(customers) ? customers : [];
  if (!req.body.company && !req.body.email && !req.body.firstName) {
    return res.status(400).json({ error: 'At least a company, name or email is required' });
  }
  const now = new Date().toISOString();
  const cust = {
    id: 'cust_' + uuidv4().replace(/-/g, '').substring(0, 10),
    stage: 'lead', status: 'prospect', source: 'manual', tags: [], bookingIds: [],
    owner: req.user.name || '', lastContactAt: now, nextFollowUpAt: null,
    createdAt: now, updatedAt: now,
  };
  CUSTOMER_FIELDS.forEach(k => { if (req.body[k] !== undefined) cust[k] = req.body[k]; });
  list.push(cust);
  writeData('customers.json', list);
  logActivity({ customerId: cust.id, type: 'note', title: 'Customer created', by: req.user.name });
  res.status(201).json(enrichCustomer(cust));
});

app.put('/api/customers/:id', authenticateToken, (req, res) => {
  const customers = readData('customers.json');
  const list = Array.isArray(customers) ? customers : [];
  const idx = list.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Customer not found' });

  const prevStage = list[idx].stage;
  const prevStatus = list[idx].status;
  CUSTOMER_FIELDS.forEach(k => { if (req.body[k] !== undefined) list[idx][k] = req.body[k]; });
  list[idx].updatedAt = new Date().toISOString();
  writeData('customers.json', list);

  if (req.body.stage && req.body.stage !== prevStage) {
    logActivity({ customerId: list[idx].id, type: 'stage_change',
      title: `Stage: ${crm ? (crm.STAGE_LABELS[prevStage] || prevStage) : prevStage} → ${crm ? (crm.STAGE_LABELS[req.body.stage] || req.body.stage) : req.body.stage}`,
      by: req.user.name });
  }
  if (req.body.status && req.body.status !== prevStatus) {
    logActivity({ customerId: list[idx].id, type: 'stage_change',
      title: `Status: ${prevStatus} → ${req.body.status}`, by: req.user.name });
  }
  res.json(enrichCustomer(list[idx]));
});

app.delete('/api/customers/:id', authenticateToken, requireAdmin, (req, res) => {
  const customers = readData('customers.json');
  const list = Array.isArray(customers) ? customers : [];
  const idx = list.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Customer not found' });
  list.splice(idx, 1);
  writeData('customers.json', list);
  // Drop associated activities
  const activities = readData('activities.json');
  writeData('activities.json', (Array.isArray(activities) ? activities : []).filter(a => a.customerId !== req.params.id));
  res.json({ success: true });
});

// Add an activity / interaction; contact-type activities advance lastContactAt
app.post('/api/customers/:id/activities', authenticateToken, (req, res) => {
  const customers = readData('customers.json');
  const list = Array.isArray(customers) ? customers : [];
  const idx = list.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Customer not found' });

  const { type, title, body } = req.body;
  const entry = logActivity({ customerId: req.params.id, type, title, body, by: req.user.name });

  if (['call', 'email', 'meeting', 'note'].includes(type)) {
    list[idx].lastContactAt = new Date().toISOString();
    list[idx].updatedAt = new Date().toISOString();
    writeData('customers.json', list);
  }
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
  const users  = readData('users.json');
  const user   = users.find(u => u.id === req.user.id);
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
  const users  = readData('users.json');
  const user   = users.find(u => u.id === req.user.id);
  const apiKey = user?.claudeApiKey || process.env.CLAUDE_API_KEY;
  if (!apiKey) return res.status(400).json({ error: 'No Claude API key configured. Add your key in Settings → AI Integration.' });

  const customers = readData('customers.json');
  const idx = customers.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Customer not found' });

  const c = customers[idx];
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

    // Store on customer record
    customers[idx].aiResearch    = brief;
    customers[idx].researchedAt  = new Date().toISOString();
    customers[idx].updatedAt     = new Date().toISOString();
    writeData('customers.json', customers);

    // Log as activity
    logActivity({
      customerId: c.id,
      type: 'note',
      title: 'AI research completed',
      body: `Relevance score: ${brief.relevanceScore}/5. ${brief.fxAngle || ''}`,
      by: req.user.name || 'system',
    });

    res.json({ success: true, research: brief });
  } catch (err) {
    console.error('[research] error:', err.message);
    res.status(500).json({ error: 'Research failed: ' + err.message });
  }
});

// ─── Sales: pipeline + summary ────────────────────────────────────────────────

app.get('/api/sales/summary', authenticateToken, (req, res) => {
  const customers = (readData('customers.json') || []).map(enrichCustomer);
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

app.get('/api/marketing/summary', authenticateToken, (req, res) => {
  const analytics = readData('analytics.json') || [];
  const posts = readData('posts.json') || [];
  const seo = readData('seo.json') || {};
  const customers = readData('customers.json') || [];
  const bookings = readData('bookings.json') || [];

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

app.get('/api/seo', (req, res) => {
  res.json(readData('seo.json'));
});

app.get('/api/seo/:slug', (req, res) => {
  const seo = readData('seo.json');
  res.json(seo[req.params.slug] || {});
});

app.put('/api/seo/:slug', authenticateToken, requireAdmin, (req, res) => {
  const seo = readData('seo.json');
  seo[req.params.slug] = Object.assign({}, seo[req.params.slug] || {}, req.body, {
    updatedAt: new Date().toISOString(),
  });
  writeData('seo.json', seo);
  res.json(seo[req.params.slug]);
});

// ─── Sitemap ──────────────────────────────────────────────────────────────────

app.get('/sitemap.xml', (req, res) => {
  const seo   = readData('seo.json');
  const posts = readData('posts.json');
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

app.get('/api/settings', authenticateToken, (req, res) => {
  res.json(readData('settings.json'));
});

app.put('/api/settings', authenticateToken, requireAdmin, (req, res) => {
  const current = readData('settings.json');
  const updated = Object.assign({}, current, req.body);
  writeData('settings.json', updated);
  res.json(updated);
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

    // Persist to bookings CRM
    try {
      const bookings = readData('bookings.json');
      const list = Array.isArray(bookings) ? bookings : [];
      // Auto-assign to first active rep by priority
      const settings = readData('settings.json');
      const reps = Array.isArray(settings.salesReps) ? settings.salesReps : [];
      const assignedRep = reps.find(r => r.active !== false) || null;
      list.push({
        id:           bookingId,
        createdAt:    new Date().toISOString(),
        slot,
        lead,
        status:       'new',
        notes:        '',
        meetLink:     event.hangoutLink || null,
        eventId:      event.id,
        rebookToken,
        assignedTo:   assignedRep ? { id: assignedRep.id, name: assignedRep.name, color: assignedRep.color || '#1E4E80' } : null,
      });
      writeData('bookings.json', list);
    } catch (e) {
      console.error('[booking] CRM save error:', e.message);
    }

    // Upsert a customer profile + log the booking as an activity
    try {
      upsertCustomerFromLead(lead, { bookingId, slot, source: 'booking' });
    } catch (e) {
      console.error('[booking] customer upsert error:', e.message);
    }

    // Send the branded confirmation email (fire-and-forget)
    if (mailer) {
      try {
        const mail = mailer.renderBookingEmail({
          slot, lead,
          meetLink:    event.hangoutLink || null,
          calendarUrl: event.htmlLink    || null,
          rebookUrl:   `${host}/rebook.html?token=${rebookToken}`,
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
app.get('/api/booking/rebook/:token', (req, res) => {
  const bookings = readData('bookings.json');
  const list = Array.isArray(bookings) ? bookings : [];
  const b = list.find(b => b.rebookToken === req.params.token);
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

  const bookings = readData('bookings.json');
  const list = Array.isArray(bookings) ? bookings : [];
  const idx = list.findIndex(b => b.rebookToken === req.params.token);
  if (idx === -1) return res.status(404).json({ error: 'Booking not found.' });

  const old = list[idx];
  const lead = old.lead;

  try {
    // Cancel old calendar event (silent fail if not configured)
    if (cal && old.eventId && !old.eventId.startsWith('mock_') && old.eventId !== 'unconfigured') {
      try { await cal.cancelBookingEvent(old.eventId); } catch (e) { console.error('[rebook] cancel old event:', e.message); }
    }

    // Create new event
    const event = cal ? await cal.createBookingEvent(slot, lead) : { id: 'rebook_' + uuidv4().slice(0,8), htmlLink: '#', hangoutLink: null };

    list[idx] = Object.assign({}, old, {
      slot,
      status:      'new',
      meetLink:    event.hangoutLink || null,
      eventId:     event.id,
      rebooked:    true,
      rebookedAt:  new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
    });
    writeData('bookings.json', list);

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

// ─── Bookings: calendar feed + assignment ─────────────────────────────────────

// GET /api/bookings/calendar?start=ISO&end=ISO — for admin calendar view
app.get('/api/bookings/calendar', authenticateToken, (req, res) => {
  const bookings = readData('bookings.json');
  const list = Array.isArray(bookings) ? bookings : [];
  const { start, end } = req.query;
  const from = start ? new Date(start) : null;
  const to   = end   ? new Date(end)   : null;
  const filtered = list.filter(b => {
    if (!b.slot?.startISO) return false;
    const d = new Date(b.slot.startISO);
    if (from && d < from) return false;
    if (to   && d > to)   return false;
    return true;
  }).map(b => ({
    id: b.id, status: b.status, meetLink: b.meetLink,
    slot: b.slot, notes: b.notes || '',
    assignedTo: b.assignedTo || null, rebooked: b.rebooked || false,
    lead: { firstName: b.lead?.firstName, lastName: b.lead?.lastName, email: b.lead?.email, company: b.lead?.company, industry: b.lead?.industry, fxVolume: b.lead?.fxVolume },
    createdAt: b.createdAt,
  }));
  res.json(filtered);
});

// PATCH /api/bookings/:id/assign — assign booking to a rep
app.patch('/api/bookings/:id/assign', authenticateToken, (req, res) => {
  const bookings = readData('bookings.json');
  const list = Array.isArray(bookings) ? bookings : [];
  const idx = list.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Booking not found' });
  list[idx].assignedTo = req.body.rep || null; // { id, name, color } or null
  list[idx].updatedAt  = new Date().toISOString();
  writeData('bookings.json', list);
  res.json(list[idx]);
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`HansePay CMS server running at http://localhost:${PORT}`);
  console.log(`Admin dashboard: http://localhost:${PORT}/hansepay/admin/`);
  console.log(`Blog: http://localhost:${PORT}/hansepay/blog.html`);
});
