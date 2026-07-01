'use strict';
const { pool } = require('../db');

function rowToTemplate(row) {
  return {
    id: row.id,
    subject: row.subject,
    blocks: row.blocks || [],
    footerTagline: row.footer_tagline,
    createdAt: row.created_at ? row.created_at.toISOString() : null,
    updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
  };
}

async function list() {
  const [rows] = await pool.query('SELECT * FROM email_templates ORDER BY created_at DESC');
  return rows.map(rowToTemplate);
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM email_templates WHERE id = :id', { id });
  return rows[0] ? rowToTemplate(rows[0]) : null;
}

async function create(body) {
  const id = 'custom-' + Date.now();
  const now = new Date();
  const t = Object.assign({ blocks: [], footerTagline: 'EU-regulated cross-border payments · Hamburg' }, body, { id });
  await pool.query(
    `INSERT INTO email_templates (id, subject, blocks, footer_tagline, created_at, updated_at)
     VALUES (:id, :subject, :blocks, :footerTagline, :createdAt, :updatedAt)`,
    { id, subject: t.subject ?? null, blocks: JSON.stringify(t.blocks || []),
      footerTagline: t.footerTagline ?? null, createdAt: now, updatedAt: now }
  );
  return findById(id);
}

async function update(id, patch) {
  const existing = await findById(id);
  if (!existing) return null;
  const merged = Object.assign({}, existing, patch, { id });
  await pool.query(
    `UPDATE email_templates SET subject=:subject, blocks=:blocks, footer_tagline=:footerTagline, updated_at=:updatedAt
     WHERE id = :id`,
    { id, subject: merged.subject ?? null, blocks: JSON.stringify(merged.blocks || []),
      footerTagline: merged.footerTagline ?? null, updatedAt: new Date() }
  );
  return findById(id);
}

async function remove(id) {
  const [result] = await pool.query('DELETE FROM email_templates WHERE id = :id', { id });
  return result.affectedRows > 0;
}

module.exports = { list, findById, create, update, remove };
