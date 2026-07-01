'use strict';
// Phase 2: app_settings, email_settings, email_templates, social_posts.
// Usage: MYSQL_URL="$MYSQL_PUBLIC_URL" node scripts/migrate-phase2.js <extracted-data-dir>

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

function toDate(iso) { return iso ? new Date(iso) : null; }

function readJson(dataDir, name, fallback) {
  const fp = path.join(dataDir, name);
  if (!fs.existsSync(fp)) { console.warn(`[migrate] ${name} not found, using fallback`); return fallback; }
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

async function main() {
  const dataDir = process.argv[2];
  if (!dataDir) { console.error('Usage: node migrate-phase2.js <extracted-data-dir>'); process.exit(1); }

  const conn = await mysql.createConnection({ uri: process.env.MYSQL_URL, namedPlaceholders: true });
  try {
    await conn.beginTransaction();

    for (const t of ['app_settings', 'email_settings', 'email_templates', 'social_posts']) {
      const [[{ c }]] = await conn.query(`SELECT COUNT(*) AS c FROM ${t}`);
      if (c > 0) throw new Error(`Refusing to migrate: table ${t} already has ${c} row(s).`);
    }

    // ── app_settings (singleton) ────────────────────────────────────────────
    const s = readJson(dataDir, 'settings.json', {});
    await conn.query(
      `INSERT INTO app_settings (id, site_name, site_url, blog_title, blog_description, contact_email,
         default_author, posts_per_page, coming_soon_mode, maintenance_mode, google_analytics_id, sales_reps)
       VALUES (1, :siteName, :siteUrl, :blogTitle, :blogDescription, :contactEmail, :defaultAuthor,
         :postsPerPage, :comingSoonMode, :maintenanceMode, :googleAnalyticsId, :salesReps)`,
      {
        siteName: s.siteName ?? '', siteUrl: s.siteUrl ?? '', blogTitle: s.blogTitle ?? '',
        blogDescription: s.blogDescription ?? null, contactEmail: s.contactEmail ?? '',
        defaultAuthor: s.defaultAuthor ?? '', postsPerPage: s.postsPerPage ?? 9,
        comingSoonMode: s.comingSoonMode ? 1 : 0, maintenanceMode: s.maintenanceMode ? 1 : 0,
        googleAnalyticsId: s.googleAnalyticsId ?? null,
        salesReps: s.salesReps ? JSON.stringify(s.salesReps) : null,
      }
    );
    console.log('[migrate] app_settings: 1 row (comingSoonMode=' + !!s.comingSoonMode + ', ' + (s.salesReps || []).length + ' sales reps)');

    // ── email_settings (singleton, file may not exist yet) ─────────────────
    const es = readJson(dataDir, 'email-settings.json', {});
    await conn.query(
      `INSERT INTO email_settings (id, footer_tagline, from_display_name, default_lang, updated_at)
       VALUES (1, :footerTagline, :fromDisplayName, :defaultLang, :updatedAt)`,
      { footerTagline: es.footerTagline ?? null, fromDisplayName: es.fromDisplayName ?? null,
        defaultLang: es.defaultLang ?? null, updatedAt: toDate(es.updatedAt) }
    );
    console.log('[migrate] email_settings: 1 row');

    // ── email_templates (file may not exist yet) ────────────────────────────
    const templates = readJson(dataDir, 'custom-templates.json', []);
    for (const t of templates) {
      await conn.query(
        `INSERT INTO email_templates (id, subject, blocks, footer_tagline, created_at, updated_at)
         VALUES (:id, :subject, :blocks, :footerTagline, :createdAt, :updatedAt)`,
        { id: t.id, subject: t.subject ?? null, blocks: JSON.stringify(t.blocks || []),
          footerTagline: t.footerTagline ?? null, createdAt: toDate(t.createdAt) || new Date(), updatedAt: toDate(t.updatedAt) }
      );
    }
    console.log(`[migrate] email_templates: ${templates.length} rows`);

    // ── social_posts ─────────────────────────────────────────────────────────
    const social = readJson(dataDir, 'social.json', []);
    for (const p of social) {
      await conn.query(
        `INSERT INTO social_posts (id, title, caption, hashtags, image, channels, channel_captions,
           status, scheduled_at, posted_at, created_by, created_at, updated_at)
         VALUES (:id, :title, :caption, :hashtags, :image, :channels, :channelCaptions,
           :status, :scheduledAt, :postedAt, :createdBy, :createdAt, :updatedAt)`,
        {
          id: p.id, title: p.title ?? '', caption: p.caption ?? '', hashtags: p.hashtags ?? '',
          image: p.image ?? null, channels: JSON.stringify(p.channels || []),
          channelCaptions: JSON.stringify(p.channelCaptions || {}), status: p.status || 'draft',
          scheduledAt: toDate(p.scheduledAt), postedAt: toDate(p.postedAt), createdBy: p.createdBy ?? null,
          createdAt: toDate(p.createdAt) || new Date(), updatedAt: toDate(p.updatedAt),
        }
      );
    }
    console.log(`[migrate] social_posts: ${social.length} rows`);

    await conn.commit();
    console.log('[migrate] Phase 2 COMPLETE — committed.');
  } catch (err) {
    await conn.rollback();
    console.error('[migrate] FAILED — rolled back, MySQL unchanged:', err.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
