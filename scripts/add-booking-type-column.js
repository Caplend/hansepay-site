'use strict';
// One-off: adds bookings.booking_type (nullable JSON snapshot of the personal
// booking-type config at booking time — same pattern as the existing
// assigned_to column). Idempotent via information_schema check since MySQL's
// ADD COLUMN IF NOT EXISTS support varies by version.
// Usage: MYSQL_URL="$MYSQL_PUBLIC_URL" node scripts/add-booking-type-column.js

const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({ uri: process.env.MYSQL_URL, namedPlaceholders: true });
  try {
    const [rows] = await conn.query(
      `SELECT COUNT(*) AS c FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = 'bookings' AND column_name = 'booking_type'`
    );
    if (rows[0].c > 0) {
      console.log('[migrate] bookings.booking_type already exists — nothing to do.');
      return;
    }
    await conn.query('ALTER TABLE bookings ADD COLUMN booking_type JSON NULL AFTER assigned_to');
    console.log('[migrate] bookings.booking_type added.');
  } finally {
    await conn.end();
  }
}

main().catch(err => { console.error('[migrate] FAILED:', err.message); process.exitCode = 1; });
