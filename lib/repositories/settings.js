'use strict';
const { pool } = require('../db');

// The coming-soon gate reads this on every single page request, so a short
// in-process TTL cache avoids adding a DB round trip to every page load.
// Invalidated immediately on write so an admin's own save reflects instantly.
const TTL_MS = 5000;
let _cache = null;
let _cacheAt = 0;

function rowToSettings(row) {
  return {
    siteName: row.site_name,
    siteUrl: row.site_url,
    blogTitle: row.blog_title,
    blogDescription: row.blog_description,
    contactEmail: row.contact_email,
    defaultAuthor: row.default_author,
    postsPerPage: row.posts_per_page,
    comingSoonMode: !!row.coming_soon_mode,
    maintenanceMode: !!row.maintenance_mode,
    googleAnalyticsId: row.google_analytics_id,
    salesReps: row.sales_reps || [],
  };
}

async function _fetch() {
  const [rows] = await pool.query('SELECT * FROM app_settings WHERE id = 1');
  if (!rows[0]) {
    // First boot on a fresh DB — insert the singleton row with defaults.
    await pool.query('INSERT INTO app_settings (id) VALUES (1)');
    const [fresh] = await pool.query('SELECT * FROM app_settings WHERE id = 1');
    return rowToSettings(fresh[0]);
  }
  return rowToSettings(rows[0]);
}

async function get() {
  if (_cache && Date.now() - _cacheAt < TTL_MS) return _cache;
  _cache = await _fetch();
  _cacheAt = Date.now();
  return _cache;
}

/** Merge-update, mirroring the old Object.assign(current, patch) full-object PUT. */
async function update(patch) {
  const current = await _fetch(); // always read fresh, not the cache, before merging
  const merged = Object.assign({}, current, patch);
  await pool.query(
    `UPDATE app_settings SET site_name=:siteName, site_url=:siteUrl, blog_title=:blogTitle,
       blog_description=:blogDescription, contact_email=:contactEmail, default_author=:defaultAuthor,
       posts_per_page=:postsPerPage, coming_soon_mode=:comingSoonMode, maintenance_mode=:maintenanceMode,
       google_analytics_id=:googleAnalyticsId, sales_reps=:salesReps
     WHERE id = 1`,
    {
      siteName: merged.siteName ?? '', siteUrl: merged.siteUrl ?? '', blogTitle: merged.blogTitle ?? '',
      blogDescription: merged.blogDescription ?? null, contactEmail: merged.contactEmail ?? '',
      defaultAuthor: merged.defaultAuthor ?? '', postsPerPage: merged.postsPerPage ?? 9,
      comingSoonMode: merged.comingSoonMode ? 1 : 0, maintenanceMode: merged.maintenanceMode ? 1 : 0,
      googleAnalyticsId: merged.googleAnalyticsId ?? null,
      salesReps: merged.salesReps ? JSON.stringify(merged.salesReps) : null,
    }
  );
  _cache = null; // invalidate so the next get() re-reads
  return get();
}

module.exports = { get, update };
