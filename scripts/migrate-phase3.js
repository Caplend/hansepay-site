'use strict';
// Phase 3: users, posts.
// Usage: MYSQL_URL="$MYSQL_PUBLIC_URL" node scripts/migrate-phase3.js <extracted-data-dir>
//
// NOTE: the source users.json has known id collisions (the old
// 'usr_' + base64(email).slice(0,10) scheme truncates similar emails to the
// same prefix — e.g. multiple "phil.carstensen+test..." addresses). Every
// record's actual data (email, passwordHash, timestamps) is preserved; only
// duplicate-id occurrences after the first get a freshly generated id so the
// PRIMARY KEY constraint holds. Verified beforehand that no post.authorId
// references any of the colliding ids, so this is safe.

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

function toDate(iso) { return iso ? new Date(iso) : null; }

function readJson(dataDir, name, fallback) {
  const fp = path.join(dataDir, name);
  if (!fs.existsSync(fp)) { console.warn(`[migrate] ${name} not found, using fallback`); return fallback; }
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

async function main() {
  const dataDir = process.argv[2];
  if (!dataDir) { console.error('Usage: node migrate-phase3.js <extracted-data-dir>'); process.exit(1); }

  const conn = await mysql.createConnection({ uri: process.env.MYSQL_URL, namedPlaceholders: true });
  try {
    await conn.beginTransaction();

    for (const t of ['users', 'posts']) {
      const [[{ c }]] = await conn.query(`SELECT COUNT(*) AS c FROM ${t}`);
      if (c > 0) throw new Error(`Refusing to migrate: table ${t} already has ${c} row(s).`);
    }

    // ── users ──────────────────────────────────────────────────────────────
    const users = readJson(dataDir, 'users.json', []);
    const seenIds = new Set();
    let regenerated = 0;
    for (const u of users) {
      let id = u.id;
      if (seenIds.has(id)) {
        const newId = 'usr_' + uuidv4().replace(/-/g, '').substring(0, 8);
        console.warn(`[migrate] id collision: ${id} (email=${u.email}) -> regenerated as ${newId}`);
        id = newId;
        regenerated++;
      }
      seenIds.add(id);
      await conn.query(
        `INSERT INTO users (id, name, email, password_hash, role, avatar, bio, avatar_url, linkedin,
           ai_model, ai_system_prompt, claude_api_key, pricing, created_at, last_login, updated_at)
         VALUES (:id, :name, :email, :passwordHash, :role, :avatar, :bio, :avatarUrl, :linkedin,
           :aiModel, :aiSystemPrompt, :claudeApiKey, :pricing, :createdAt, :lastLogin, :updatedAt)`,
        {
          id, name: u.name || '', email: u.email, passwordHash: u.passwordHash || '', role: u.role || 'user',
          avatar: u.avatar || '', bio: u.bio ?? null, avatarUrl: u.avatarUrl ?? null, linkedin: u.linkedin ?? null,
          aiModel: u.aiModel ?? null, aiSystemPrompt: u.aiSystemPrompt ?? null, claudeApiKey: u.claudeApiKey ?? null,
          pricing: u.pricing ? JSON.stringify(u.pricing) : null,
          createdAt: toDate(u.createdAt) || new Date(), lastLogin: toDate(u.lastLogin), updatedAt: toDate(u.updatedAt),
        }
      );
    }
    console.log(`[migrate] users: ${users.length} rows (${regenerated} id collisions regenerated)`);

    // ── posts (author_id FK -> users.id; unaffected since no colliding id was referenced) ──
    const posts = readJson(dataDir, 'posts.json', []);
    for (const p of posts) {
      const views = p.views ?? p.viewCount ?? 0;
      const authorName = p.author ?? p.authorName ?? null;
      await conn.query(
        `INSERT INTO posts (id, slug, title, excerpt, content, category, tags, status, featured,
           featured_image, read_time, author_id, author_name, author_role, author_bio, author_avatar,
           author_linkedin, created_at, published_at, updated_at, views, show_in_listing)
         VALUES (:id, :slug, :title, :excerpt, :content, :category, :tags, :status, :featured,
           :featuredImage, :readTime, :authorId, :authorName, :authorRole, :authorBio, :authorAvatar,
           :authorLinkedin, :createdAt, :publishedAt, :updatedAt, :views, :showInListing)`,
        {
          id: p.id, slug: p.slug, title: p.title, excerpt: p.excerpt ?? null, content: p.content ?? null,
          category: p.category || 'Uncategorised', tags: JSON.stringify(p.tags || []), status: p.status || 'draft',
          featured: p.featured ? 1 : 0, featuredImage: p.featuredImage ?? null,
          readTime: p.readTime != null ? String(p.readTime) : null, authorId: p.authorId ?? null,
          authorName, authorRole: p.authorRole ?? null, authorBio: p.authorBio ?? null,
          authorAvatar: p.authorAvatar ?? null, authorLinkedin: p.authorLinkedin ?? null,
          createdAt: toDate(p.createdAt) || new Date(), publishedAt: toDate(p.publishedAt),
          updatedAt: toDate(p.updatedAt), views, showInListing: p.showInListing !== false ? 1 : 0,
        }
      );
    }
    console.log(`[migrate] posts: ${posts.length} rows`);

    await conn.commit();
    console.log('[migrate] Phase 3 COMPLETE — committed.');
  } catch (err) {
    await conn.rollback();
    console.error('[migrate] FAILED — rolled back, MySQL unchanged:', err.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
