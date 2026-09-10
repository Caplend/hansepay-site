'use strict';
const { pool } = require('../db');

function rowToDraft(row) {
  return {
    id: row.id,
    segment: row.segment,
    corridor: row.corridor,
    tone: row.tone,
    ctaGoal: row.cta_goal,
    notes: row.notes,
    content: row.content,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at ? row.created_at.toISOString() : null,
    updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
  };
}

async function list({ status } = {}) {
  const clauses = [];
  const params = {};
  if (status) { clauses.push('status = :status'); params.status = status; }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(`SELECT * FROM content_drafts ${where} ORDER BY updated_at DESC`, params);
  return rows.map(rowToDraft);
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM content_drafts WHERE id = :id', { id });
  return rows[0] ? rowToDraft(rows[0]) : null;
}

async function create(draft) {
  await pool.query(
    `INSERT INTO content_drafts (id, segment, corridor, tone, cta_goal, notes, content, status, created_by, created_at, updated_at)
     VALUES (:id, :segment, :corridor, :tone, :ctaGoal, :notes, :content, :status, :createdBy, :createdAt, :updatedAt)`,
    {
      id: draft.id, segment: draft.segment ?? '', corridor: draft.corridor ?? null, tone: draft.tone ?? null,
      ctaGoal: draft.ctaGoal ?? null, notes: draft.notes ?? null, content: JSON.stringify(draft.content || {}),
      status: draft.status || 'draft', createdBy: draft.createdBy ?? null,
      createdAt: new Date(draft.createdAt), updatedAt: new Date(draft.updatedAt),
    }
  );
  return findById(draft.id);
}

async function update(id, draft) {
  await pool.query(
    `UPDATE content_drafts SET segment=:segment, corridor=:corridor, tone=:tone, cta_goal=:ctaGoal,
       notes=:notes, content=:content, status=:status, updated_at=:updatedAt
     WHERE id = :id`,
    {
      id, segment: draft.segment ?? '', corridor: draft.corridor ?? null, tone: draft.tone ?? null,
      ctaGoal: draft.ctaGoal ?? null, notes: draft.notes ?? null, content: JSON.stringify(draft.content || {}),
      status: draft.status || 'draft', updatedAt: new Date(draft.updatedAt),
    }
  );
  return findById(id);
}

async function remove(id) {
  const [result] = await pool.query('DELETE FROM content_drafts WHERE id = :id', { id });
  return result.affectedRows > 0;
}

module.exports = { list, findById, create, update, remove };
