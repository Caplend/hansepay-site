'use strict';
// Phase 4: registrations.
// Usage: MYSQL_URL="$MYSQL_PUBLIC_URL" node scripts/migrate-phase4.js <extracted-data-dir>

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
  if (!dataDir) { console.error('Usage: node migrate-phase4.js <extracted-data-dir>'); process.exit(1); }

  const conn = await mysql.createConnection({ uri: process.env.MYSQL_URL, namedPlaceholders: true });
  try {
    await conn.beginTransaction();

    const [[{ c }]] = await conn.query(`SELECT COUNT(*) AS c FROM registrations`);
    if (c > 0) throw new Error(`Refusing to migrate: table registrations already has ${c} row(s).`);

    const regs = readJson(dataDir, 'registrations.json', []);
    for (const r of regs) {
      await conn.query(
        `INSERT INTO registrations (id, email, first_name, last_name, status, application_ref, started_at,
           company, account_type, phone, country, city, reg_num, vat, submitted_at, lang, approved_at, restored_by_admin)
         VALUES (:id, :email, :firstName, :lastName, :status, :applicationRef, :startedAt,
           :company, :accountType, :phone, :country, :city, :regNum, :vat, :submittedAt, :lang, :approvedAt, :restoredByAdmin)`,
        {
          id: r.id, email: r.email, firstName: r.firstName || '', lastName: r.lastName || '',
          status: r.status || 'started', applicationRef: r.applicationRef ?? null, startedAt: toDate(r.startedAt),
          company: r.company || '', accountType: r.accountType || 'business', phone: r.phone || '',
          country: r.country || '', city: r.city || '', regNum: r.regNum || '', vat: r.vat || '',
          submittedAt: toDate(r.submittedAt), lang: r.lang || 'en', approvedAt: toDate(r.approvedAt),
          restoredByAdmin: r._restoredByAdmin ? 1 : 0,
        }
      );
    }
    console.log(`[migrate] registrations: ${regs.length} rows`);

    await conn.commit();
    console.log('[migrate] Phase 4 COMPLETE — committed.');
  } catch (err) {
    await conn.rollback();
    console.error('[migrate] FAILED — rolled back, MySQL unchanged:', err.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
