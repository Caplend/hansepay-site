'use strict';
const { pool } = require('../db');

function rowToNotification(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link,
    read: !!row.read_at,
    readAt: row.read_at ? row.read_at.toISOString() : null,
    createdAt: row.created_at ? row.created_at.toISOString() : null,
  };
}

async function list({ unreadOnly, limit } = {}) {
  const clauses = [];
  if (unreadOnly) clauses.push('read_at IS NULL');
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const lim = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
  const [rows] = await pool.query(`SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT ${lim}`);
  return rows.map(rowToNotification);
}

async function unreadCount() {
  const [rows] = await pool.query('SELECT COUNT(*) AS c FROM notifications WHERE read_at IS NULL');
  return rows[0] ? rows[0].c : 0;
}

async function create(n) {
  await pool.query(
    `INSERT INTO notifications (id, type, title, body, link, read_at, created_at)
     VALUES (:id, :type, :title, :body, :link, :readAt, :createdAt)`,
    {
      id: n.id, type: n.type || 'info', title: n.title ?? '', body: n.body ?? null,
      link: n.link ?? null, readAt: n.readAt ? new Date(n.readAt) : null, createdAt: new Date(n.createdAt),
    }
  );
  const [rows] = await pool.query('SELECT * FROM notifications WHERE id = :id', { id: n.id });
  return rows[0] ? rowToNotification(rows[0]) : null;
}

async function markRead(id) {
  const [result] = await pool.query('UPDATE notifications SET read_at = :now WHERE id = :id AND read_at IS NULL', { id, now: new Date() });
  return result.affectedRows > 0;
}

async function markAllRead() {
  const [result] = await pool.query('UPDATE notifications SET read_at = :now WHERE read_at IS NULL', { now: new Date() });
  return result.affectedRows;
}

module.exports = { list, unreadCount, create, markRead, markAllRead };
