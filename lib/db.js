'use strict';

const mysql = require('mysql2/promise');

// Railway injects MYSQL_URL when hansepay-deploy references ${{MySQL.MYSQL_URL}}
// (wired via `railway variables --service hansepay-deploy --set`). Falls back to
// discrete vars for local dev, e.g. `railway run --service MySQL -- node server.js`.
const pool = process.env.MYSQL_URL
  ? mysql.createPool({
      uri: process.env.MYSQL_URL,
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true,
    })
  : mysql.createPool({
      host: process.env.MYSQLHOST,
      port: process.env.MYSQLPORT || 3306,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true,
    });

async function assertConnected() {
  const conn = await pool.getConnection();
  try {
    await conn.query('SELECT 1');
  } finally {
    conn.release();
  }
}

/** Run `fn(conn)` inside a transaction; commits on success, rolls back on throw. */
async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { pool, assertConnected, withTransaction };
