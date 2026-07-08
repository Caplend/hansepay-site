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

/**
 * Sales reps go through the client as a full read-modify-write blob (the
 * settings UI has no per-rep PATCH). calendarId/connectedAt ARE echoed back
 * to the client (so the "Connect calendar" badge can render) but refreshToken
 * never is — and none of the three should ever be settable by a client-
 * originated save, even accidentally with a stale/null value from a page that
 * was open before someone connected their calendar. This unconditionally
 * pins all three to the server's current values on every generic update() —
 * the ONLY way to actually change them is setRepCalendar() below, called
 * exclusively from the OAuth callback.
 */
function mergeReps(existingReps, incomingReps) {
  if (!Array.isArray(incomingReps)) return incomingReps;
  const byId = new Map((existingReps || []).map(r => [r.id, r]));
  return incomingReps.map(rep => {
    const prev = byId.get(rep.id);
    return {
      ...rep,
      refreshToken: prev ? prev.refreshToken : undefined,
      calendarId:   prev ? prev.calendarId   : undefined,
      connectedAt:  prev ? prev.connectedAt  : undefined,
    };
  });
}

/** Merge-update, mirroring the old Object.assign(current, patch) full-object PUT. */
async function update(patch) {
  const current = await _fetch(); // always read fresh, not the cache, before merging
  if (patch.salesReps) patch = { ...patch, salesReps: mergeReps(current.salesReps, patch.salesReps) };
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

/**
 * The ONLY path allowed to write refreshToken/calendarId/connectedAt — called
 * exclusively by GET /api/booking/auth/callback right after a rep completes
 * Google's OAuth consent. Deliberately bypasses update()/mergeReps() (which
 * exist specifically to make these three fields un-writable from a generic
 * client-originated settings save).
 */
async function setRepCalendar(repId, { refreshToken, calendarId, connectedAt }) {
  const current = await _fetch();
  const reps = Array.isArray(current.salesReps) ? current.salesReps : [];
  if (!reps.some(r => r.id === repId)) return null;
  const updatedReps = reps.map(r => (r.id === repId ? { ...r, refreshToken, calendarId, connectedAt } : r));
  await pool.query('UPDATE app_settings SET sales_reps=:salesReps WHERE id = 1', {
    salesReps: JSON.stringify(updatedReps),
  });
  _cache = null;
  return get();
}

module.exports = { get, update, setRepCalendar };
