'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4200;
const JWT_SECRET = 'hansepay-cms-secret-2024';
const DATA_DIR = path.join(__dirname, 'data');

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Static files
app.use('/hansepay', express.static(path.join(__dirname, 'hansepay')));
app.use(express.static(__dirname));

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
  const { passwordHash, ...userSafe } = user;
  res.json(userSafe);
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
    .filter(p => p.status === 'published')
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
  const newPost = {
    id: 'post_' + uuidv4().replace(/-/g, '').substring(0, 8),
    title,
    slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    excerpt: excerpt || '',
    content: content || '',
    category: category || 'Uncategorised',
    tags: tags || [],
    status: status || 'draft',
    featuredImage: featuredImage || null,
    authorId: req.user.id,
    authorName: author ? author.name : req.user.name,
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

  const allowed = ['title', 'slug', 'excerpt', 'content', 'category', 'tags', 'status', 'featuredImage'];
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

// ─── Analytics routes ─────────────────────────────────────────────────────────

app.post('/api/analytics/pageview', (req, res) => {
  const { page, referrer } = req.body;
  const analytics = readData('analytics.json');
  analytics.push({
    id: uuidv4(),
    page: page || '/',
    referrer: referrer || '',
    timestamp: new Date().toISOString()
  });
  writeData('analytics.json', analytics);
  res.json({ success: true });
});

app.get('/api/analytics/summary', authenticateToken, (req, res) => {
  const analytics = readData('analytics.json');
  const posts = readData('posts.json');
  const users = readData('users.json');

  const totalPageviews = analytics.length;
  const postsPublished = posts.filter(p => p.status === 'published').length;
  const postsDraft = posts.filter(p => p.status === 'draft').length;
  const totalUsers = users.length;

  // Views by page
  const viewsByPage = {};
  analytics.forEach(a => {
    viewsByPage[a.page] = (viewsByPage[a.page] || 0) + 1;
  });

  // Views last 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const viewsLast30Days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    const count = analytics.filter(a => a.timestamp && a.timestamp.startsWith(dateStr)).length;
    viewsLast30Days.push({ date: dateStr, count });
  }

  // Top posts (support both 'viewCount' and 'views' field names)
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
    viewsByPage,
    viewsLast30Days,
    topPosts
  });
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

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`HansePay CMS server running at http://localhost:${PORT}`);
  console.log(`Admin dashboard: http://localhost:${PORT}/hansepay/admin/`);
  console.log(`Blog: http://localhost:${PORT}/hansepay/blog.html`);
});
