'use strict';

const express = require('express');
const cal = (() => { try { return require('./lib/calendar'); } catch(e) { return null; } })();
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
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure data & uploads directories exist
if (!fs.existsSync(DATA_DIR))    fs.mkdirSync(DATA_DIR,    { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Seed data files from *.seed.json if the live file doesn't exist yet.
// This runs on every cold start — if a Railway Volume is mounted at /app/data
// the live file survives deploys; on a fresh volume the seed is copied in once.
['users', 'posts', 'settings', 'seo', 'bookings', 'analytics'].forEach(name => {
  const live = path.join(DATA_DIR, `${name}.json`);
  const seed = path.join(DATA_DIR, `${name}.seed.json`);
  if (!fs.existsSync(live) && fs.existsSync(seed)) {
    fs.copyFileSync(seed, live);
    console.log(`[seed] initialised ${name}.json from seed`);
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

// Static files — files live at repo root in hansepay-deploy
app.use(express.static(__dirname));
// Also serve under /hansepay/ prefix for compatibility with landing page links
app.use('/hansepay', express.static(__dirname));
// Serve uploads
app.use('/uploads', express.static(UPLOADS_DIR));

// ─── Data helpers ───────────────────────────────────────────────────────────

function readData(filename) {
  const fp = path.join(DATA_DIR, filename);
  if (!fs.existsSync(fp)) return filename.endsWith('analytics.json') ? [] : {};
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

function writeData(filename, data) {
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf8');
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

  const profileFields = ['name', 'role', 'bio', 'avatarUrl', 'aiModel', 'aiSystemPrompt'];
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
          authorRole, authorBio, authorAvatar, publishedAt } = req.body;
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
    'author', 'authorRole', 'authorBio', 'authorAvatar', 'publishedAt',
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

    // Persist to bookings CRM
    try {
      const bookings = readData('bookings.json');
      const list = Array.isArray(bookings) ? bookings : [];
      list.push({
        id:        event.id || uuidv4(),
        createdAt: new Date().toISOString(),
        slot,
        lead,
        status:    'new',
        notes:     '',
        meetLink:  event.hangoutLink || null,
        eventId:   event.id,
      });
      writeData('bookings.json', list);
    } catch (e) {
      console.error('[booking] CRM save error:', e.message);
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

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`HansePay CMS server running at http://localhost:${PORT}`);
  console.log(`Admin dashboard: http://localhost:${PORT}/hansepay/admin/`);
  console.log(`Blog: http://localhost:${PORT}/hansepay/blog.html`);
});
