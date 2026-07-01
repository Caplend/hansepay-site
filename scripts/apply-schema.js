'use strict';
// One-off: applies db/schema.sql against MYSQL_URL. Idempotent (CREATE TABLE IF NOT EXISTS).
// Usage: railway run --service MySQL -- node scripts/apply-schema.js   (uses MYSQL_URL, internal-only)
//    or: MYSQL_URL="$MYSQL_PUBLIC_URL" node scripts/apply-schema.js    (from a local machine)

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
  const conn = await mysql.createConnection({ uri: process.env.MYSQL_URL, multipleStatements: true });
  try {
    await conn.query(sql);
    console.log('[schema] applied successfully');
    const [tables] = await conn.query('SHOW TABLES');
    console.log('[schema] tables now present:', tables.map(t => Object.values(t)[0]).join(', '));
  } finally {
    await conn.end();
  }
}

main().catch(err => { console.error('[schema] FAILED:', err.message); process.exit(1); });
