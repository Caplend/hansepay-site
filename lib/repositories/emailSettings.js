'use strict';
const { pool } = require('../db');

function rowToSettings(row) {
  if (!row) return {};
  const out = {};
  if (row.footer_tagline != null) out.footerTagline = row.footer_tagline;
  if (row.from_display_name != null) out.fromDisplayName = row.from_display_name;
  if (row.default_lang != null) out.defaultLang = row.default_lang;
  if (row.updated_at) out.updatedAt = row.updated_at.toISOString();
  return out;
}

/** Returns only the saved (persisted) fields — env-derived fields are merged by the caller. */
async function get() {
  const [rows] = await pool.query('SELECT * FROM email_settings WHERE id = 1');
  return rowToSettings(rows[0]);
}

async function update(patch) {
  const allowed = ['footerTagline', 'fromDisplayName', 'defaultLang'];
  const current = await get();
  const merged = Object.assign({}, current);
  allowed.forEach(k => { if (patch[k] !== undefined) merged[k] = patch[k]; });
  await pool.query(
    `INSERT INTO email_settings (id, footer_tagline, from_display_name, default_lang, updated_at)
     VALUES (1, :footerTagline, :fromDisplayName, :defaultLang, :updatedAt)
     ON DUPLICATE KEY UPDATE footer_tagline=:footerTagline, from_display_name=:fromDisplayName,
       default_lang=:defaultLang, updated_at=:updatedAt`,
    {
      footerTagline: merged.footerTagline ?? null, fromDisplayName: merged.fromDisplayName ?? null,
      defaultLang: merged.defaultLang ?? null, updatedAt: new Date(),
    }
  );
  return get();
}

module.exports = { get, update };
