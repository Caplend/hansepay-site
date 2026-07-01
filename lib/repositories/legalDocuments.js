'use strict';
const { pool } = require('../db');

function rowToDoc(row) {
  return {
    slug: row.slug,
    title: row.title,
    badge: row.badge,
    body: row.body,
    effectiveLine: row.effective_line,
    updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
    updatedBy: row.updated_by,
  };
}

async function list() {
  const [rows] = await pool.query('SELECT * FROM legal_documents');
  return rows.map(rowToDoc);
}

async function findBySlug(slug) {
  const [rows] = await pool.query('SELECT * FROM legal_documents WHERE slug = :slug', { slug });
  return rows[0] ? rowToDoc(rows[0]) : null;
}

/** Partial update — only the provided fields are changed. Returns the updated doc, or null if slug not found. */
async function update(slug, { title, badge, effectiveLine, body }, updatedBy) {
  const existing = await findBySlug(slug);
  if (!existing) return null;
  const sets = ['updated_at = :updatedAt', 'updated_by = :updatedBy'];
  const params = { slug, updatedAt: new Date(), updatedBy };
  if (title !== undefined) { sets.push('title = :title'); params.title = title; }
  if (badge !== undefined) { sets.push('badge = :badge'); params.badge = badge; }
  if (effectiveLine !== undefined) { sets.push('effective_line = :effectiveLine'); params.effectiveLine = effectiveLine; }
  if (body !== undefined) { sets.push('body = :body'); params.body = body; }
  await pool.query(`UPDATE legal_documents SET ${sets.join(', ')} WHERE slug = :slug`, params);
  return findBySlug(slug);
}

module.exports = { list, findBySlug, update };
