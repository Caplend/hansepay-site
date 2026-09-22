'use strict';
const { pool } = require('../db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

function rowToLead(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    email: row.email,
    currency: row.currency,
    country: row.country,
    volume: Number(row.volume),
    count: row.payment_count,
    markup: Number(row.markup),
    currentCost: Number(row.current_cost),
    hansepayCost: Number(row.hansepay_cost),
    saving: Number(row.saving),
    tier: row.tier,
    companyVerified: !!row.company_verified,
    landingPage: row.landing_page,
    cluster: row.cluster,
    utmSource: row.utm_source,
    utmMedium: row.utm_medium,
    utmCampaign: row.utm_campaign,
    ref: row.ref,
    confirmToken: row.confirm_token,
    confirmedAt: row.confirmed_at ? row.confirmed_at.toISOString() : null,
    pdfSentAt: row.pdf_sent_at ? row.pdf_sent_at.toISOString() : null,
    createdAt: row.created_at ? row.created_at.toISOString() : null,
  };
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM calculator_leads WHERE id = :id', { id });
  return rows[0] ? rowToLead(rows[0]) : null;
}

async function findByConfirmToken(token) {
  const [rows] = await pool.query('SELECT * FROM calculator_leads WHERE confirm_token = :token', { token });
  return rows[0] ? rowToLead(rows[0]) : null;
}

async function create(fields) {
  const id = 'cl_' + uuidv4().replace(/-/g, '').substring(0, 10);
  const confirmToken = crypto.randomBytes(24).toString('hex');
  const now = new Date();
  await pool.query(
    `INSERT INTO calculator_leads (id, customer_id, email, currency, country, volume, payment_count, markup,
       current_cost, hansepay_cost, saving, tier, company_verified, landing_page, cluster,
       utm_source, utm_medium, utm_campaign, ref, confirm_token, created_at)
     VALUES (:id, :customerId, :email, :currency, :country, :volume, :count, :markup,
       :currentCost, :hansepayCost, :saving, :tier, :companyVerified, :landingPage, :cluster,
       :utmSource, :utmMedium, :utmCampaign, :ref, :confirmToken, :createdAt)`,
    {
      id, customerId: fields.customerId || null, email: fields.email, currency: fields.currency || null,
      country: fields.country || null, volume: fields.volume, count: fields.count, markup: fields.markup,
      currentCost: fields.currentCost, hansepayCost: fields.hansepayCost, saving: fields.saving,
      tier: fields.tier, companyVerified: fields.companyVerified === false ? 0 : 1,
      landingPage: fields.landingPage || null, cluster: fields.cluster || null,
      utmSource: fields.utmSource || null, utmMedium: fields.utmMedium || null, utmCampaign: fields.utmCampaign || null,
      ref: fields.ref || null, confirmToken, createdAt: now,
    }
  );
  return findById(id);
}

async function confirmByToken(token) {
  const lead = await findByConfirmToken(token);
  if (!lead) return null;
  if (!lead.confirmedAt) {
    await pool.query('UPDATE calculator_leads SET confirmed_at = :now WHERE id = :id', { now: new Date(), id: lead.id });
  }
  return findById(lead.id);
}

async function markPdfSent(id) {
  await pool.query('UPDATE calculator_leads SET pdf_sent_at = :now WHERE id = :id', { now: new Date(), id });
}

/** Per-landing-page rollup for the growth dashboard: submissions, confirm
 * rate (= requested the full PDF breakdown), and average saving potential
 * (a quality signal per the ops doc — if it drops, the wrong companies are
 * arriving). */
async function summaryByLandingPage() {
  const [rows] = await pool.query(
    `SELECT landing_page,
       COUNT(*) AS submissions,
       SUM(CASE WHEN confirmed_at IS NOT NULL THEN 1 ELSE 0 END) AS confirmed,
       AVG(saving) AS avg_saving,
       SUM(CASE WHEN tier = 'founder-outbound' THEN 1 ELSE 0 END) AS founder_outbound_count
     FROM calculator_leads
     WHERE landing_page IS NOT NULL
     GROUP BY landing_page
     ORDER BY submissions DESC`
  );
  return rows.map(r => ({
    landingPage: r.landing_page,
    submissions: r.submissions,
    confirmed: r.confirmed,
    confirmRate: r.submissions ? Math.round((r.confirmed / r.submissions) * 100) : 0,
    avgSaving: r.avg_saving ? Math.round(r.avg_saving) : 0,
    founderOutboundCount: r.founder_outbound_count,
  }));
}

module.exports = { findById, findByConfirmToken, create, confirmByToken, markPdfSent, summaryByLandingPage };
