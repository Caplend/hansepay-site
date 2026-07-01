'use strict';
// Phase 7: transactions.
// Usage: MYSQL_URL="$MYSQL_PUBLIC_URL" node scripts/migrate-phase7.js <extracted-data-dir>
//
// No named financial columns — the source data has inconsistent field naming
// (amt vs amount, sendAmount/receiveAmount vs dir/direction) and the app only
// ever round-trips the whole object, so the entire original record is stored
// in `extra` verbatim. Inserted in original array order so the new surrogate
// AUTO_INCREMENT id preserves the same append order (id DESC == old .reverse()).

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

function readJson(dataDir, name, fallback) {
  const fp = path.join(dataDir, name);
  if (!fs.existsSync(fp)) { console.warn(`[migrate] ${name} not found, using fallback`); return fallback; }
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

async function main() {
  const dataDir = process.argv[2];
  if (!dataDir) { console.error('Usage: node migrate-phase7.js <extracted-data-dir>'); process.exit(1); }

  const conn = await mysql.createConnection({ uri: process.env.MYSQL_URL, namedPlaceholders: true });
  try {
    await conn.beginTransaction();

    const [[{ c }]] = await conn.query(`SELECT COUNT(*) AS c FROM transactions`);
    if (c > 0) throw new Error(`Refusing to migrate: table transactions already has ${c} row(s).`);

    const txs = readJson(dataDir, 'transactions.json', []);
    let missingEmail = 0;
    for (const tx of txs) {
      if (!tx.userEmail) missingEmail++;
      await conn.query(
        'INSERT INTO transactions (user_email, saved_at, extra) VALUES (:userEmail, :savedAt, :extra)',
        {
          userEmail: tx.userEmail || '',
          savedAt: tx.savedAt ? new Date(tx.savedAt) : new Date(),
          extra: JSON.stringify(tx),
        }
      );
    }
    console.log(`[migrate] transactions: ${txs.length} rows (${missingEmail} missing userEmail)`);

    await conn.commit();
    console.log('[migrate] Phase 7 COMPLETE — committed.');
  } catch (err) {
    await conn.rollback();
    console.error('[migrate] FAILED — rolled back, MySQL unchanged:', err.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
