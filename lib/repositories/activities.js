'use strict';
const { pool } = require('../db');
const { v4: uuidv4 } = require('uuid');

function rowToActivity(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    type: row.type,
    title: row.title,
    body: row.body,
    by: row.by_name,
    at: row.at ? row.at.toISOString() : null,
  };
}

async function forCustomer(customerId, conn) {
  const [rows] = await (conn || pool).query(
    'SELECT * FROM activities WHERE customer_id = :customerId ORDER BY at DESC', { customerId }
  );
  return rows.map(rowToActivity);
}

/** Mirrors logActivity(). Accepts an optional `conn` to participate in a caller's transaction. */
async function create({ customerId, type, title, body, by }, conn) {
  const entry = {
    id: 'act_' + uuidv4().replace(/-/g, '').substring(0, 10),
    customerId, type: type || 'note', title: title || '', body: body || '', by: by || 'system',
    at: new Date(),
  };
  await (conn || pool).query(
    `INSERT INTO activities (id, customer_id, type, title, body, by_name, at)
     VALUES (:id, :customerId, :type, :title, :body, :by, :at)`,
    entry
  );
  return rowToActivity({ ...entry, by_name: entry.by, at: entry.at });
}

module.exports = { forCustomer, create };
