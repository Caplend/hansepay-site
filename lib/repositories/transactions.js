'use strict';
const { pool } = require('../db');

// The stored `extra` JSON blob already contains the complete flat original
// object (userEmail, savedAt, and every other pass-through field), matching
// the old file's shape exactly — no need to merge columns back in.
function rowToTransaction(row) {
  return row.extra;
}

/** Newest first, matching the old `.slice().reverse()` (array push order). */
async function listAll() {
  const [rows] = await pool.query('SELECT * FROM transactions ORDER BY id DESC');
  return rows.map(rowToTransaction);
}

async function create(tx) {
  const record = { ...tx, savedAt: new Date().toISOString() };
  await pool.query(
    'INSERT INTO transactions (user_email, saved_at, extra) VALUES (:userEmail, :savedAt, :extra)',
    { userEmail: tx.userEmail, savedAt: new Date(record.savedAt), extra: JSON.stringify(record) }
  );
  return record;
}

module.exports = { listAll, create };
