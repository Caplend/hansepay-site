'use strict';
const { pool } = require('../db');
const { v4: uuidv4 } = require('uuid');

function rowToUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    avatar: row.avatar,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    linkedin: row.linkedin,
    aiModel: row.ai_model,
    aiSystemPrompt: row.ai_system_prompt,
    claudeApiKey: row.claude_api_key,
    pricing: row.pricing || undefined,
    createdAt: row.created_at ? row.created_at.toISOString() : null,
    lastLogin: row.last_login ? row.last_login.toISOString() : null,
    updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
  };
}

async function list() {
  const [rows] = await pool.query('SELECT * FROM users ORDER BY created_at ASC');
  return rows.map(rowToUser);
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = :id', { id });
  return rows[0] ? rowToUser(rows[0]) : null;
}

async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = :email', { email });
  return rows[0] ? rowToUser(rows[0]) : null;
}

function idFromEmail(email) {
  return 'usr_' + Buffer.from(email).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
}

async function create(user) {
  const id = user.id || idFromEmail(user.email);
  await pool.query(
    `INSERT INTO users (id, name, email, password_hash, role, avatar, bio, avatar_url, linkedin,
       ai_model, ai_system_prompt, claude_api_key, pricing, created_at, last_login, updated_at)
     VALUES (:id, :name, :email, :passwordHash, :role, :avatar, :bio, :avatarUrl, :linkedin,
       :aiModel, :aiSystemPrompt, :claudeApiKey, :pricing, :createdAt, :lastLogin, :updatedAt)`,
    {
      id, name: user.name || '', email: user.email, passwordHash: user.passwordHash || '',
      role: user.role || 'user', avatar: user.avatar || '', bio: user.bio ?? null,
      avatarUrl: user.avatarUrl ?? null, linkedin: user.linkedin ?? null, aiModel: user.aiModel ?? null,
      aiSystemPrompt: user.aiSystemPrompt ?? null, claudeApiKey: user.claudeApiKey ?? null,
      pricing: user.pricing ? JSON.stringify(user.pricing) : null,
      createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
      lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
      updatedAt: user.updatedAt ? new Date(user.updatedAt) : null,
    }
  );
  return findById(id);
}

/** Partial update — only provided fields change. */
async function update(id, patch) {
  const existing = await findById(id);
  if (!existing) return null;
  const merged = Object.assign({}, existing, patch);
  await pool.query(
    `UPDATE users SET name=:name, email=:email, password_hash=:passwordHash, role=:role, avatar=:avatar,
       bio=:bio, avatar_url=:avatarUrl, linkedin=:linkedin, ai_model=:aiModel,
       ai_system_prompt=:aiSystemPrompt, claude_api_key=:claudeApiKey, pricing=:pricing,
       last_login=:lastLogin, updated_at=:updatedAt
     WHERE id = :id`,
    {
      id, name: merged.name || '', email: merged.email, passwordHash: merged.passwordHash || '',
      role: merged.role || 'user', avatar: merged.avatar || '', bio: merged.bio ?? null,
      avatarUrl: merged.avatarUrl ?? null, linkedin: merged.linkedin ?? null, aiModel: merged.aiModel ?? null,
      aiSystemPrompt: merged.aiSystemPrompt ?? null, claudeApiKey: merged.claudeApiKey ?? null,
      pricing: merged.pricing ? JSON.stringify(merged.pricing) : null,
      lastLogin: merged.lastLogin ? new Date(merged.lastLogin) : null,
      updatedAt: new Date(),
    }
  );
  return findById(id);
}

async function remove(id) {
  const [result] = await pool.query('DELETE FROM users WHERE id = :id', { id });
  return result.affectedRows > 0;
}

/** Runs on every boot — mirrors the old ensureDemoAccount() file-based logic. */
async function ensureDemoAccount() {
  const existing = await findByEmail('demo@hansepay.de');
  if (existing) return false;
  await create({
    id: 'usr_demo_001',
    name: 'Demo User',
    email: 'demo@hansepay.de',
    passwordHash: '$2a$10$KZzf2V84/s1gPtXnPHaEj.g7m.SaDMwwlydSEC3FS28jAqGlNyGuW',
    role: 'user',
    avatar: '',
    createdAt: new Date().toISOString(),
    lastLogin: null,
  });
  return true;
}

module.exports = { list, findById, findByEmail, create, update, remove, idFromEmail, ensureDemoAccount };
