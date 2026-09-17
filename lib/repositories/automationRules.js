'use strict';
const { pool } = require('../db');
const { v4: uuidv4 } = require('uuid');

function rowToRule(row) {
  return {
    id: row.id,
    name: row.name,
    enabled: !!row.enabled,
    triggerType: row.trigger_type,
    stage: row.stage,
    staleDays: row.stale_days,
    actionType: row.action_type,
    actionTaskTitle: row.action_task_title,
    actionMessage: row.action_message,
    createdBy: row.created_by,
    createdAt: row.created_at ? row.created_at.toISOString() : null,
    updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
  };
}

async function list() {
  const [rows] = await pool.query('SELECT * FROM automation_rules ORDER BY created_at DESC');
  return rows.map(rowToRule);
}

async function listEnabled() {
  const [rows] = await pool.query('SELECT * FROM automation_rules WHERE enabled = 1');
  return rows.map(rowToRule);
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM automation_rules WHERE id = :id', { id });
  return rows[0] ? rowToRule(rows[0]) : null;
}

async function create(fields, createdBy) {
  const id = 'rule_' + uuidv4().replace(/-/g, '').substring(0, 10);
  const now = new Date();
  await pool.query(
    `INSERT INTO automation_rules (id, name, enabled, trigger_type, stage, stale_days, action_type,
       action_task_title, action_message, created_by, created_at, updated_at)
     VALUES (:id, :name, :enabled, :triggerType, :stage, :staleDays, :actionType,
       :actionTaskTitle, :actionMessage, :createdBy, :createdAt, :updatedAt)`,
    {
      id, name: fields.name || '', enabled: fields.enabled === false ? 0 : 1,
      triggerType: fields.triggerType, stage: fields.stage,
      staleDays: fields.triggerType === 'stage_stale' ? (fields.staleDays || 7) : null,
      actionType: fields.actionType,
      actionTaskTitle: fields.actionType === 'create_task' ? (fields.actionTaskTitle || '') : null,
      actionMessage: fields.actionType === 'notify' ? (fields.actionMessage || '') : null,
      createdBy: createdBy || null, createdAt: now, updatedAt: now,
    }
  );
  return findById(id);
}

async function update(id, fields, updatedBy) {
  const existing = await findById(id);
  if (!existing) return null;
  const sets = ['updated_at = :updatedAt'];
  const params = { id, updatedAt: new Date() };
  if (fields.name !== undefined) { sets.push('name = :name'); params.name = fields.name; }
  if (fields.enabled !== undefined) { sets.push('enabled = :enabled'); params.enabled = fields.enabled ? 1 : 0; }
  if (fields.triggerType !== undefined) { sets.push('trigger_type = :triggerType'); params.triggerType = fields.triggerType; }
  if (fields.stage !== undefined) { sets.push('stage = :stage'); params.stage = fields.stage; }
  if (fields.staleDays !== undefined) { sets.push('stale_days = :staleDays'); params.staleDays = fields.staleDays; }
  if (fields.actionType !== undefined) { sets.push('action_type = :actionType'); params.actionType = fields.actionType; }
  if (fields.actionTaskTitle !== undefined) { sets.push('action_task_title = :actionTaskTitle'); params.actionTaskTitle = fields.actionTaskTitle; }
  if (fields.actionMessage !== undefined) { sets.push('action_message = :actionMessage'); params.actionMessage = fields.actionMessage; }
  await pool.query(`UPDATE automation_rules SET ${sets.join(', ')} WHERE id = :id`, params);
  return findById(id);
}

async function remove(id) {
  await pool.query('DELETE FROM automation_rules WHERE id = :id', { id });
}

// ── Run log (dedupe) ──────────────────────────────────────────────────────

/** Has this rule already fired for this customer within the last `withinDays` days? */
async function hasRecentRun(ruleId, customerId, withinDays) {
  const [rows] = await pool.query(
    `SELECT id FROM automation_rule_runs
     WHERE rule_id = :ruleId AND customer_id = :customerId
       AND ran_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
     LIMIT 1`,
    { ruleId, customerId, days: withinDays }
  );
  return rows.length > 0;
}

async function logRun(ruleId, customerId) {
  const id = 'run_' + uuidv4().replace(/-/g, '').substring(0, 10);
  await pool.query(
    'INSERT INTO automation_rule_runs (id, rule_id, customer_id, ran_at) VALUES (:id, :ruleId, :customerId, :ranAt)',
    { id, ruleId, customerId, ranAt: new Date() }
  );
}

module.exports = { list, listEnabled, findById, create, update, remove, hasRecentRun, logRun };
