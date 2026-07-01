'use strict';
// Phase 6: bookings.
// Usage: MYSQL_URL="$MYSQL_PUBLIC_URL" JWT_SECRET="..." node scripts/migrate-phase6.js <extracted-data-dir>
//
// NOTE on cancel_token backfill: GET/POST /api/booking/cancel/:token falls back
// to `makeCancelToken(b.id)` when a booking has no stored cancelToken (0/23 in
// the source data have one). We backfill the deterministic HMAC value for every
// booking here so the column is always populated and indexed lookups work —
// this materializes a value the old code already computed on the fly, not new
// data. Requires the same JWT_SECRET as production (used as the HMAC key).

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const crypto = require('crypto');

function toDate(iso) { return iso ? new Date(iso) : null; }
function makeCancelToken(bookingId, jwtSecret) {
  return crypto.createHmac('sha256', jwtSecret).update(bookingId + '-cancel-hp').digest('hex').slice(0, 32);
}

function readJson(dataDir, name, fallback) {
  const fp = path.join(dataDir, name);
  if (!fs.existsSync(fp)) { console.warn(`[migrate] ${name} not found, using fallback`); return fallback; }
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

async function main() {
  const dataDir = process.argv[2];
  if (!dataDir) { console.error('Usage: node migrate-phase6.js <extracted-data-dir>'); process.exit(1); }
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) { console.error('JWT_SECRET env var is required (same value as production) to backfill cancel_token.'); process.exit(1); }

  const conn = await mysql.createConnection({ uri: process.env.MYSQL_URL, namedPlaceholders: true });
  try {
    await conn.beginTransaction();

    const [[{ c }]] = await conn.query(`SELECT COUNT(*) AS c FROM bookings`);
    if (c > 0) throw new Error(`Refusing to migrate: table bookings already has ${c} row(s).`);

    const bookings = readJson(dataDir, 'bookings.json', []);
    const customers = readJson(dataDir, 'customers.json', []);
    const customerByEmail = new Map(customers.map(cu => [(cu.email || '').toLowerCase(), cu.id]));

    let linked = 0, tokensBackfilled = 0;
    for (const b of bookings) {
      const custId = customerByEmail.get((b.lead?.email || '').toLowerCase()) || null;
      if (custId) linked++;
      const cancelToken = b.cancelToken || makeCancelToken(b.id, jwtSecret);
      if (!b.cancelToken) tokensBackfilled++;

      await conn.query(
        `INSERT INTO bookings (id, customer_id, created_at, slot, \`lead\`, status, notes, meet_link,
           event_id, rebook_token, cancel_token, assigned_to, rebooked, rebooked_at, updated_at,
           cancelled_at, cancelled_by, cancelled_by_name)
         VALUES (:id, :customerId, :createdAt, CAST(:slot AS JSON), CAST(:lead AS JSON), :status, :notes,
           :meetLink, :eventId, :rebookToken, :cancelToken, CAST(:assignedTo AS JSON), :rebooked, :rebookedAt,
           :updatedAt, :cancelledAt, :cancelledBy, :cancelledByName)`,
        {
          id: b.id, customerId: custId, createdAt: toDate(b.createdAt) || new Date(),
          slot: JSON.stringify(b.slot || {}), lead: JSON.stringify(b.lead || {}), status: b.status || 'new',
          notes: b.notes || '', meetLink: b.meetLink ?? null, eventId: b.eventId ?? null,
          rebookToken: b.rebookToken ?? null, cancelToken, assignedTo: b.assignedTo ? JSON.stringify(b.assignedTo) : null,
          rebooked: b.rebooked ? 1 : 0, rebookedAt: toDate(b.rebookedAt), updatedAt: toDate(b.updatedAt) || new Date(),
          cancelledAt: toDate(b.cancelledAt), cancelledBy: b.cancelledBy ?? null, cancelledByName: b.cancelledByName ?? null,
        }
      );
    }
    console.log(`[migrate] bookings: ${bookings.length} rows (${linked} linked to a customer, ${tokensBackfilled} cancel_token backfilled)`);

    await conn.commit();
    console.log('[migrate] Phase 6 COMPLETE — committed.');
  } catch (err) {
    await conn.rollback();
    console.error('[migrate] FAILED — rolled back, MySQL unchanged:', err.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
