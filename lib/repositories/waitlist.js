'use strict';
const { pool } = require('../db');
const { v4: uuidv4 } = require('uuid');

function rowToEntry(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    lang: row.lang,
    source: row.source,
    createdAt: row.created_at ? row.created_at.toISOString() : null,
    notifiedAt: row.notified_at ? row.notified_at.toISOString() : null,
  };
}

async function list() {
  const [rows] = await pool.query('SELECT * FROM waitlist ORDER BY created_at DESC');
  return rows.map(rowToEntry);
}

async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM waitlist WHERE LOWER(email) = LOWER(:email)', { email });
  return rows[0] ? rowToEntry(rows[0]) : null;
}

/** Idempotent — resubmitting the same email updates the name (if newly provided) rather than erroring. */
async function upsert({ email, name, lang, source }) {
  const id = 'wl_' + uuidv4().replace(/-/g, '').substring(0, 10);
  const now = new Date();
  await pool.query(
    `INSERT INTO waitlist (id, email, name, lang, source, created_at)
     VALUES (:id, :email, :name, :lang, :source, :createdAt)
     ON DUPLICATE KEY UPDATE name = COALESCE(NULLIF(:name2, ''), name)`,
    {
      id, email: email.toLowerCase().trim(), name: name || null, lang: lang || 'en',
      source: source || 'coming-soon', createdAt: now, name2: name || '',
    }
  );
  return findByEmail(email);
}

async function markNotified(ids) {
  if (!ids.length) return 0;
  const [result] = await pool.query(
    `UPDATE waitlist SET notified_at = NOW() WHERE id IN (${ids.map(() => '?').join(',')})`,
    ids
  );
  return result.affectedRows;
}

module.exports = { list, findByEmail, upsert, markNotified };
