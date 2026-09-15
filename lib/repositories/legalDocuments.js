'use strict';
const { pool } = require('../db');

function rowToDoc(row) {
  return {
    slug: row.slug,
    title: row.title,
    badge: row.badge,
    body: row.body,
    effectiveLine: row.effective_line,
    titleDe: row.title_de,
    badgeDe: row.badge_de,
    bodyDe: row.body_de,
    effectiveLineDe: row.effective_line_de,
    deIsDraft: row.de_is_draft === undefined ? true : !!row.de_is_draft,
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
async function update(slug, { title, badge, effectiveLine, body, titleDe, badgeDe, effectiveLineDe, bodyDe, deIsDraft }, updatedBy) {
  const existing = await findBySlug(slug);
  if (!existing) return null;
  const sets = ['updated_at = :updatedAt', 'updated_by = :updatedBy'];
  const params = { slug, updatedAt: new Date(), updatedBy };
  if (title !== undefined) { sets.push('title = :title'); params.title = title; }
  if (badge !== undefined) { sets.push('badge = :badge'); params.badge = badge; }
  if (effectiveLine !== undefined) { sets.push('effective_line = :effectiveLine'); params.effectiveLine = effectiveLine; }
  if (body !== undefined) { sets.push('body = :body'); params.body = body; }
  if (titleDe !== undefined) { sets.push('title_de = :titleDe'); params.titleDe = titleDe; }
  if (badgeDe !== undefined) { sets.push('badge_de = :badgeDe'); params.badgeDe = badgeDe; }
  if (effectiveLineDe !== undefined) { sets.push('effective_line_de = :effectiveLineDe'); params.effectiveLineDe = effectiveLineDe; }
  if (bodyDe !== undefined) { sets.push('body_de = :bodyDe'); params.bodyDe = bodyDe; }
  if (deIsDraft !== undefined) { sets.push('de_is_draft = :deIsDraft'); params.deIsDraft = deIsDraft ? 1 : 0; }
  await pool.query(`UPDATE legal_documents SET ${sets.join(', ')} WHERE slug = :slug`, params);
  return findBySlug(slug);
}

// Seeds a German translation only if one doesn't already exist (never
// overwrites a manually-entered/reviewed translation). Used at startup to
// backfill AI-drafted translations — always flagged de_is_draft = 1.
async function seedGermanIfMissing(slug, { titleDe, badgeDe, effectiveLineDe, bodyDe }) {
  const doc = await findBySlug(slug);
  if (!doc) return false; // slug doesn't exist yet — nothing to attach a translation to
  if (doc.bodyDe && doc.bodyDe.trim()) return false; // already has a German body — don't touch it
  await pool.query(
    `UPDATE legal_documents SET title_de = :titleDe, badge_de = :badgeDe, effective_line_de = :effectiveLineDe, body_de = :bodyDe, de_is_draft = 1 WHERE slug = :slug`,
    { slug, titleDe, badgeDe, effectiveLineDe, bodyDe }
  );
  return true;
}

module.exports = { list, findBySlug, update, seedGermanIfMissing };
