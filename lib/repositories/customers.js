'use strict';
const { pool, withTransaction } = require('../db');
const { v4: uuidv4 } = require('uuid');

function rowToCustomer(row) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    website: row.website,
    company: row.company,
    industry: row.industry,
    companySize: row.company_size,
    country: row.country,
    city: row.city,
    fxVolume: row.fx_volume,
    currencyPairs: row.currency_pairs,
    stage: row.stage,
    status: row.status,
    owner: row.owner,
    source: row.source,
    tags: row.tags || [],
    notes: row.notes,
    estValueEur: Number(row.est_value_eur),
    bookingIds: row.booking_ids || [],
    lastContactAt: row.last_contact_at ? row.last_contact_at.toISOString() : null,
    nextFollowUpAt: row.next_follow_up_at ? row.next_follow_up_at.toISOString() : null,
    lang: row.lang,
    aiResearch: row.ai_research || undefined,
    researchedAt: row.researched_at ? row.researched_at.toISOString() : undefined,
    analysis: row.analysis || undefined,
    analysisConf: row.analysis_conf || undefined,
    analysisSources: row.analysis_sources || undefined,
    analyzedAt: row.analyzed_at ? row.analyzed_at.toISOString() : undefined,
    createdAt: row.created_at ? row.created_at.toISOString() : null,
    updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
  };
}

const FIELD_MAP = {
  firstName: 'first_name', lastName: 'last_name', email: 'email', phone: 'phone', website: 'website',
  company: 'company', industry: 'industry', companySize: 'company_size', country: 'country', city: 'city',
  fxVolume: 'fx_volume', currencyPairs: 'currency_pairs', stage: 'stage', status: 'status', owner: 'owner',
  source: 'source', notes: 'notes', estValueEur: 'est_value_eur', lastContactAt: 'last_contact_at',
  nextFollowUpAt: 'next_follow_up_at', lang: 'lang',
};
const JSON_FIELDS = { tags: 'tags', bookingIds: 'booking_ids', aiResearch: 'ai_research', analysis: 'analysis',
  analysisConf: 'analysis_conf', analysisSources: 'analysis_sources' };
const DATE_FIELDS = { lastContactAt: true, nextFollowUpAt: true };

async function list({ stage, status, source, owner, country, q, sort, limit, conn } = {}) {
  const runner = conn || pool;
  const clauses = [];
  const params = {};
  if (stage) { clauses.push('stage = :stage'); params.stage = stage; }
  if (status) { clauses.push('status = :status'); params.status = status; }
  if (source) { clauses.push('source = :source'); params.source = source; }
  if (owner) { clauses.push('owner = :owner'); params.owner = owner; }
  if (country) { clauses.push('LOWER(country) = LOWER(:country)'); params.country = country; }
  if (q) {
    clauses.push(`(LOWER(company) LIKE :q OR LOWER(first_name) LIKE :q OR LOWER(last_name) LIKE :q
      OR LOWER(email) LIKE :q OR LOWER(industry) LIKE :q OR LOWER(city) LIKE :q OR LOWER(country) LIKE :q)`);
    params.q = `%${String(q).toLowerCase()}%`;
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  let orderBy = 'created_at DESC';
  switch ((sort || '').toLowerCase()) {
    case 'oldest': orderBy = 'created_at ASC'; break;
    case 'a_z': orderBy = "COALESCE(NULLIF(company,''), CONCAT(first_name,' ',last_name)) ASC"; break;
    case 'z_a': orderBy = "COALESCE(NULLIF(company,''), CONCAT(first_name,' ',last_name)) DESC"; break;
    case 'updated': orderBy = 'COALESCE(updated_at, created_at) DESC'; break;
    case 'latest': orderBy = 'created_at DESC'; break;
    // volume_high is handled in JS (fxVolume is a freeform string parsed by lib/crm.js)
  }

  let sql = `SELECT * FROM customers ${where} ORDER BY ${orderBy}`;
  if (limit && Number.isInteger(Number(limit)) && Number(limit) > 0) sql += ` LIMIT ${Number(limit)}`;
  const [rows] = await runner.query(sql, params);
  return rows.map(rowToCustomer);
}

async function findById(id, conn) {
  const [rows] = await (conn || pool).query('SELECT * FROM customers WHERE id = :id', { id });
  return rows[0] ? rowToCustomer(rows[0]) : null;
}

async function findByEmail(email, conn) {
  const [rows] = await (conn || pool).query('SELECT * FROM customers WHERE LOWER(email) = LOWER(:email) LIMIT 1', { email });
  return rows[0] ? rowToCustomer(rows[0]) : null;
}

function buildSetClause(patch) {
  const sets = [];
  const params = {};
  for (const [key, col] of Object.entries(FIELD_MAP)) {
    if (patch[key] === undefined) continue;
    sets.push(`${col} = :${key}`);
    params[key] = patch[key];
  }
  for (const [key, col] of Object.entries(JSON_FIELDS)) {
    if (patch[key] === undefined) continue;
    sets.push(`${col} = :${key}`);
    params[key] = patch[key] != null ? JSON.stringify(patch[key]) : null;
  }
  for (const key of Object.keys(DATE_FIELDS)) {
    if (params[key] !== undefined) params[key] = params[key] ? new Date(params[key]) : null;
  }
  return { sets, params };
}

/** Insert a brand-new customer. `fields` uses the camelCase API shape. */
async function create(fields, conn) {
  const id = fields.id || ('cust_' + uuidv4().replace(/-/g, '').substring(0, 10));
  const now = new Date();
  const runner = conn || pool;
  await runner.query(
    `INSERT INTO customers (id, first_name, last_name, email, phone, website, company, industry,
       company_size, country, city, fx_volume, currency_pairs, stage, status, owner, source, tags,
       notes, est_value_eur, booking_ids, last_contact_at, next_follow_up_at, lang, created_at, updated_at)
     VALUES (:id, :firstName, :lastName, :email, :phone, :website, :company, :industry, :companySize,
       :country, :city, :fxVolume, :currencyPairs, :stage, :status, :owner, :source, :tags, :notes,
       :estValueEur, :bookingIds, :lastContactAt, :nextFollowUpAt, :lang, :createdAt, :updatedAt)`,
    {
      id, firstName: fields.firstName || '', lastName: fields.lastName || '', email: fields.email || '',
      phone: fields.phone || '', website: fields.website || '', company: fields.company || '',
      industry: fields.industry || '', companySize: fields.companySize || '', country: fields.country || '',
      city: fields.city || '', fxVolume: fields.fxVolume || '', currencyPairs: fields.currencyPairs || '',
      stage: fields.stage || 'lead', status: fields.status || 'prospect', owner: fields.owner || '',
      source: fields.source || 'manual', tags: JSON.stringify(fields.tags || []), notes: fields.notes || '',
      estValueEur: fields.estValueEur || 0, bookingIds: JSON.stringify(fields.bookingIds || []),
      lastContactAt: fields.lastContactAt ? new Date(fields.lastContactAt) : null,
      nextFollowUpAt: fields.nextFollowUpAt ? new Date(fields.nextFollowUpAt) : null,
      lang: fields.lang || 'de', createdAt: fields.createdAt ? new Date(fields.createdAt) : now,
      updatedAt: fields.updatedAt ? new Date(fields.updatedAt) : now,
    }
  );
  return findById(id, conn);
}

/** Partial update by whitelisted camelCase field names. */
async function update(id, patch, conn) {
  const runner = conn || pool;
  const { sets, params } = buildSetClause(patch);
  sets.push('updated_at = :updatedAt');
  params.updatedAt = patch.updatedAt ? new Date(patch.updatedAt) : new Date();
  params.id = id;
  await runner.query(`UPDATE customers SET ${sets.join(', ')} WHERE id = :id`, params);
  return findById(id, conn);
}

async function remove(id) {
  // activities.customer_id has ON DELETE CASCADE — cleans up automatically.
  const [result] = await pool.query('DELETE FROM customers WHERE id = :id', { id });
  return result.affectedRows > 0;
}

async function appendBookingId(id, bookingId, conn) {
  const c = await findById(id, conn);
  if (!c) return null;
  const ids = Array.isArray(c.bookingIds) ? c.bookingIds : [];
  if (!ids.includes(bookingId)) ids.push(bookingId);
  return update(id, { bookingIds: ids }, conn);
}

module.exports = { list, findById, findByEmail, create, update, remove, appendBookingId, withTransaction };
