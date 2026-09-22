'use strict';
const { pool } = require('../db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

function rowToEntry(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    company: row.company,
    lang: row.lang,
    source: row.source,
    position: row.position,
    referralCode: row.referral_code,
    referredBy: row.referred_by,
    referralCredits: row.referral_credits,
    landingPage: row.landing_page,
    utmSource: row.utm_source,
    utmMedium: row.utm_medium,
    utmCampaign: row.utm_campaign,
    calculatorResult: row.calculator_result || undefined,
    companyVerified: !!row.company_verified,
    confirmToken: row.confirm_token,
    confirmedAt: row.confirmed_at ? row.confirmed_at.toISOString() : null,
    createdAt: row.created_at ? row.created_at.toISOString() : null,
    notifiedAt: row.notified_at ? row.notified_at.toISOString() : null,
    // Effective, displayed position — referrals pull you 25 spots forward
    // each, floor of 1. Recomputed on read so we never need to shift rows.
    displayPosition: row.position != null ? Math.max(1, row.position - (row.referral_credits || 0) * 25) : null,
  };
}

async function list() {
  const [rows] = await pool.query('SELECT * FROM waitlist ORDER BY created_at DESC');
  return rows.map(rowToEntry);
}

async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM waitlist WHERE LOWER(email) = LOWER(:email)', { email });
  return rows[0] ? rowToEntry(rows[0]) : null;
}

async function findByReferralCode(code) {
  const [rows] = await pool.query('SELECT * FROM waitlist WHERE referral_code = :code', { code });
  return rows[0] ? rowToEntry(rows[0]) : null;
}

async function findByConfirmToken(token) {
  const [rows] = await pool.query('SELECT * FROM waitlist WHERE confirm_token = :token', { token });
  return rows[0] ? rowToEntry(rows[0]) : null;
}

async function generateUniqueReferralCode() {
  for (let i = 0; i < 20; i++) {
    const code = crypto.randomBytes(4).toString('hex').slice(0, 6);
    const existing = await findByReferralCode(code);
    if (!existing) return code;
  }
  throw new Error('Could not generate a unique referral code');
}

/** Idempotent on email — resubmitting returns the existing entry unchanged
 * (position/referral code stay stable) rather than creating a duplicate. */
async function upsert({ email, name, company, lang, source, referredBy, landingPage, utmSource, utmMedium, utmCampaign, calculatorResult, companyVerified }) {
  const cleanEmail = email.toLowerCase().trim();
  const existing = await findByEmail(cleanEmail);
  if (existing) return existing;

  const id = 'wl_' + uuidv4().replace(/-/g, '').substring(0, 10);
  const now = new Date();
  const referralCode = await generateUniqueReferralCode();
  const confirmToken = crypto.randomBytes(24).toString('hex');

  const [[{ nextPos }]] = await pool.query('SELECT COALESCE(MAX(position), 0) + 1 AS nextPos FROM waitlist');

  await pool.query(
    `INSERT INTO waitlist (id, email, name, company, lang, source, position, referral_code, referred_by,
       landing_page, utm_source, utm_medium, utm_campaign, calculator_result, company_verified,
       confirm_token, created_at)
     VALUES (:id, :email, :name, :company, :lang, :source, :position, :referralCode, :referredBy,
       :landingPage, :utmSource, :utmMedium, :utmCampaign, :calculatorResult, :companyVerified,
       :confirmToken, :createdAt)`,
    {
      id, email: cleanEmail, name: name || null, company: company || null, lang: lang || 'en',
      source: source || 'coming-soon', position: nextPos, referralCode, referredBy: referredBy || null,
      landingPage: landingPage || null, utmSource: utmSource || null, utmMedium: utmMedium || null,
      utmCampaign: utmCampaign || null, calculatorResult: calculatorResult ? JSON.stringify(calculatorResult) : null,
      companyVerified: companyVerified === false ? 0 : 1, confirmToken, createdAt: now,
    }
  );
  return findByEmail(cleanEmail);
}

/** Confirms double opt-in, and — if this signup was referred — credits the
 * referrer 25 spots forward. Returns { entry, referrerCredited }. */
async function confirmByToken(token) {
  const entry = await findByConfirmToken(token);
  if (!entry) return null;
  if (entry.confirmedAt) return { entry, referrerCredited: false }; // already confirmed, no double-credit

  await pool.query('UPDATE waitlist SET confirmed_at = :now WHERE id = :id', { now: new Date(), id: entry.id });

  let referrerCredited = false;
  if (entry.referredBy) {
    const [result] = await pool.query(
      'UPDATE waitlist SET referral_credits = referral_credits + 1 WHERE referral_code = :code',
      { code: entry.referredBy }
    );
    referrerCredited = result.affectedRows > 0;
  }
  const updated = await findByEmail(entry.email);
  return { entry: updated, referrerCredited };
}

async function markNotified(ids) {
  if (!ids.length) return 0;
  const [result] = await pool.query(
    `UPDATE waitlist SET notified_at = NOW() WHERE id IN (${ids.map(() => '?').join(',')})`,
    ids
  );
  return result.affectedRows;
}

/** Per-landing-page rollup: signups and referral rate for that page. */
async function summaryByLandingPage() {
  const [rows] = await pool.query(
    `SELECT landing_page,
       COUNT(*) AS signups,
       SUM(CASE WHEN referred_by IS NOT NULL THEN 1 ELSE 0 END) AS via_referral,
       SUM(referral_credits) AS total_referral_credits
     FROM waitlist
     WHERE landing_page IS NOT NULL
     GROUP BY landing_page
     ORDER BY signups DESC`
  );
  return rows.map(r => ({
    landingPage: r.landing_page,
    signups: r.signups,
    viaReferral: r.via_referral,
    referralRate: r.signups ? Math.round((r.via_referral / r.signups) * 100) : 0,
    totalReferralCredits: r.total_referral_credits || 0,
  }));
}

module.exports = { list, findByEmail, findByReferralCode, findByConfirmToken, upsert, confirmByToken, markNotified, summaryByLandingPage };
