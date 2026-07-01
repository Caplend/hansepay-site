'use strict';
const { pool } = require('../db');
const { v4: uuidv4 } = require('uuid');

function rowToEvent(row) {
  return {
    id: row.id,
    type: row.type,
    page: row.page,
    referrer: row.referrer,
    data: row.data || undefined,
    timestamp: row.ts ? row.ts.toISOString() : null,
  };
}

/** Full list, matching the old readData() shape — callers do their own JS aggregation. */
async function listAll() {
  const [rows] = await pool.query('SELECT * FROM analytics_events ORDER BY ts ASC');
  return rows.map(rowToEvent);
}

async function create({ type, page, referrer, data }) {
  const event = { id: uuidv4(), type: type || 'pageview', page: page || '/', referrer: referrer || null,
    data: data || null, ts: new Date() };
  await pool.query(
    'INSERT INTO analytics_events (id, type, page, referrer, data, ts) VALUES (:id, :type, :page, :referrer, :data, :ts)',
    { ...event, data: event.data ? JSON.stringify(event.data) : null }
  );
  return rowToEvent(event);
}

module.exports = { listAll, create };
