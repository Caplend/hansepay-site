'use strict';
const { pool } = require('../db');

function rowToReg(row) {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    status: row.status,
    applicationRef: row.application_ref,
    startedAt: row.started_at ? row.started_at.toISOString() : null,
    company: row.company,
    accountType: row.account_type,
    phone: row.phone,
    country: row.country,
    city: row.city,
    regNum: row.reg_num,
    vat: row.vat,
    submittedAt: row.submitted_at ? row.submitted_at.toISOString() : null,
    lang: row.lang,
    approvedAt: row.approved_at ? row.approved_at.toISOString() : null,
    _restoredByAdmin: !!row.restored_by_admin,
  };
}

async function list() {
  const [rows] = await pool.query('SELECT * FROM registrations ORDER BY started_at ASC');
  return rows.map(rowToReg);
}

async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM registrations WHERE email = :email', { email });
  return rows[0] ? rowToReg(rows[0]) : null;
}

async function findByRefOrId(ref) {
  const [rows] = await pool.query('SELECT * FROM registrations WHERE application_ref = :ref OR id = :ref LIMIT 1', { ref });
  return rows[0] ? rowToReg(rows[0]) : null;
}

async function _upsert(reg) {
  await pool.query(
    `INSERT INTO registrations (id, email, first_name, last_name, status, application_ref, started_at,
       company, account_type, phone, country, city, reg_num, vat, submitted_at, lang, approved_at, restored_by_admin)
     VALUES (:id, :email, :firstName, :lastName, :status, :applicationRef, :startedAt,
       :company, :accountType, :phone, :country, :city, :regNum, :vat, :submittedAt, :lang, :approvedAt, :restoredByAdmin)
     ON DUPLICATE KEY UPDATE email=:email, first_name=:firstName, last_name=:lastName, status=:status,
       application_ref=:applicationRef, started_at=:startedAt, company=:company, account_type=:accountType,
       phone=:phone, country=:country, city=:city, reg_num=:regNum, vat=:vat, submitted_at=:submittedAt,
       lang=:lang, approved_at=:approvedAt, restored_by_admin=:restoredByAdmin`,
    {
      id: reg.id, email: reg.email, firstName: reg.firstName || '', lastName: reg.lastName || '',
      status: reg.status, applicationRef: reg.applicationRef ?? null,
      startedAt: reg.startedAt ? new Date(reg.startedAt) : null, company: reg.company || '',
      accountType: reg.accountType || 'business', phone: reg.phone || '', country: reg.country || '',
      city: reg.city || '', regNum: reg.regNum || '', vat: reg.vat || '',
      submittedAt: reg.submittedAt ? new Date(reg.submittedAt) : null, lang: reg.lang || 'en',
      approvedAt: reg.approvedAt ? new Date(reg.approvedAt) : null, restoredByAdmin: reg._restoredByAdmin ? 1 : 0,
    }
  );
  return findByRefOrId(reg.id);
}

/** Mirrors POST /api/registration/start — never downgrades review/approved. */
async function upsertStarted({ firstName, lastName, email, lang }) {
  const existing = await findByEmail(email);
  if (existing && ['review', 'approved'].includes(existing.status)) return { record: existing, unchanged: true };
  const record = Object.assign({}, existing, {
    id: existing ? existing.id : ('start-' + Buffer.from(email).toString('base64').replace(/[^a-z0-9]/gi, '').slice(0, 10)),
    firstName: firstName || (existing && existing.firstName) || '',
    lastName: lastName || (existing && existing.lastName) || '',
    email, status: 'started',
    startedAt: existing ? (existing.startedAt || new Date().toISOString()) : new Date().toISOString(),
    lang: lang || 'en',
  });
  return { record: await _upsert(record), unchanged: false };
}

/**
 * Mirrors POST /api/registration/confirm — looks up the existing record by
 * EMAIL (which may hold a different id, e.g. a 'start-...' id from an earlier
 * /start call), then replaces it under the new applicationRef id. If the id
 * is changing, the old row is deleted first so no orphaned duplicate remains.
 */
async function upsertConfirmed(fields) {
  const existing = await findByEmail(fields.email);
  const record = Object.assign({ id: fields.applicationRef, status: 'review', submittedAt: new Date().toISOString() }, fields);
  if (existing && existing.id !== record.id) {
    await pool.query('DELETE FROM registrations WHERE id = :id', { id: existing.id });
  }
  return _upsert(record);
}

/** Approve by ref/email, or upsert-then-approve from accountData if not found at all. */
async function approve({ applicationRef, emailFallback, accountData }) {
  let reg = applicationRef ? await findByRefOrId(applicationRef) : null;
  if (!reg && emailFallback) reg = await findByEmail(emailFallback);

  if (!reg) {
    const data = accountData || {};
    const email = data.email || emailFallback;
    if (!email) return null;
    const ref = applicationRef || data.applicationRef || ('admin-' + Buffer.from(email).toString('base64').slice(0, 10));
    reg = await _upsert({
      id: ref, applicationRef: ref, firstName: data.firstName || '', lastName: data.lastName || '',
      email, company: data.company || '', accountType: data.accountType || 'individual',
      country: data.country || '', city: data.city || '', status: 'review',
      submittedAt: new Date().toISOString(), lang: 'en', _restoredByAdmin: true,
    });
    console.log(`[registration] upserted missing record for ${email} during admin approve`);
  }

  reg.status = 'approved';
  reg.approvedAt = new Date().toISOString();
  return _upsert(reg);
}

module.exports = { list, findByEmail, findByRefOrId, upsertStarted, upsertConfirmed, approve };
