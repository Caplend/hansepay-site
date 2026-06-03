'use strict';

/**
 * HansePay CRM — pure business logic (no I/O).
 * Health scoring, churn risk, volume parsing, pipeline shaping, export rows.
 */

const STAGES = ['lead', 'qualified', 'proposal', 'won', 'lost'];
const STAGE_LABELS = {
  lead: 'Lead', qualified: 'Qualified', proposal: 'Proposal', won: 'Won', lost: 'Lost',
};
// Probability of closing per stage — used for weighted pipeline value
const STAGE_PROBABILITY = { lead: 0.1, qualified: 0.3, proposal: 0.6, won: 1, lost: 0 };

const STATUSES = ['prospect', 'active', 'churned'];

function daysBetween(a, b) {
  if (!a) return Infinity;
  return Math.floor((b.getTime() - new Date(a).getTime()) / 86400000);
}

/**
 * Parse a fxVolume bucket / freeform string into an estimated monthly EUR figure.
 * Picks the midpoint of a detected range; "10M+" style → the floor × 1.5.
 */
function parseMonthlyVolume(v) {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  const s = String(v).toLowerCase().replace(/[, ]/g, '');
  const nums = [];
  const re = /(\d+(?:\.\d+)?)([km]?)/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    let n = parseFloat(m[1]);
    if (m[2] === 'k') n *= 1e3;
    else if (m[2] === 'm') n *= 1e6;
    nums.push(n);
  }
  if (!nums.length) return 0;
  if (nums.length === 1) {
    // open-ended bucket like "10M+" or "<50k"
    if (s.includes('+') || s.includes('>')) return nums[0] * 1.5;
    if (s.includes('<')) return nums[0] * 0.5;
    return nums[0];
  }
  return (nums[0] + nums[1]) / 2;
}

/** Estimated annual revenue opportunity (simple model: ~0.5% margin on annual flow). */
function estAnnualValue(monthlyVolumeEur) {
  return Math.round((monthlyVolumeEur || 0) * 12 * 0.005);
}

/**
 * Health score 0–100 and churn risk.
 * Inputs: customer object + its activities array + optional bookings count.
 */
function computeHealth(customer, activities, now) {
  now = now || new Date();
  const acts = activities || [];
  const reasons = [];
  let score = 50;

  // Recency of last contact
  const last = customer.lastContactAt || customer.updatedAt || customer.createdAt;
  const dLast = daysBetween(last, now);
  if (dLast <= 7)       { score += 22; reasons.push('Contacted within the last week'); }
  else if (dLast <= 30) { score += 10; reasons.push('Contacted within the last month'); }
  else if (dLast <= 60) { score -= 5;  reasons.push('No contact in over a month'); }
  else if (dLast <= 90) { score -= 18; reasons.push('No contact in over 60 days'); }
  else                  { score -= 30; reasons.push('No contact in over 90 days'); }

  // Engagement
  const engagement = acts.length + (customer.bookingIds ? customer.bookingIds.length * 2 : 0);
  if (engagement >= 6)      { score += 16; reasons.push('Highly engaged'); }
  else if (engagement >= 3) { score += 9; }
  else if (engagement <= 1) { score -= 8; reasons.push('Low engagement'); }

  // Stage
  if (customer.stage === 'won')        { score += 14; }
  else if (customer.stage === 'proposal') { score += 8; }
  else if (customer.stage === 'lost')  { score -= 25; reasons.push('Deal marked lost'); }

  // Status
  if (customer.status === 'churned')   { score -= 30; reasons.push('Marked as churned'); }
  else if (customer.status === 'active') { score += 6; }

  // Volume (bigger accounts are worth nurturing — slight positive)
  const vol = parseMonthlyVolume(customer.fxVolume);
  if (vol >= 1e6) { score += 6; }

  // Overdue follow-up
  if (customer.nextFollowUpAt && new Date(customer.nextFollowUpAt) < now) {
    score -= 12; reasons.push('Follow-up overdue');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let band = 'good';
  if (score < 40) band = 'at-risk';
  else if (score < 65) band = 'watch';
  else if (score >= 80) band = 'excellent';

  // Churn risk applies mainly to active/won relationships
  let churnRisk = 'low';
  const relevant = customer.status === 'active' || customer.stage === 'won';
  if (relevant) {
    if (dLast > 90 || score < 40) churnRisk = 'high';
    else if (dLast > 45 || score < 65) churnRisk = 'medium';
  } else if (customer.status === 'churned') {
    churnRisk = 'churned';
  }

  return { score, band, churnRisk, daysSinceContact: dLast === Infinity ? null : dLast, reasons };
}

/** Attach computed fields to a customer (non-destructive copy). */
function enrich(customer, activities, now) {
  const health = computeHealth(customer, activities, now);
  const monthlyVolumeEur = parseMonthlyVolume(customer.fxVolume);
  return Object.assign({}, customer, {
    health,
    monthlyVolumeEur,
    estValueEur: customer.estValueEur || estAnnualValue(monthlyVolumeEur),
    stageLabel: STAGE_LABELS[customer.stage] || customer.stage,
    weightedValue: Math.round((customer.estValueEur || estAnnualValue(monthlyVolumeEur)) * (STAGE_PROBABILITY[customer.stage] || 0)),
  });
}

/** Build the export grid (array-of-arrays, header first). */
function toExportRows(customers, enrichFn) {
  const headers = [
    'Company', 'First Name', 'Last Name', 'Email', 'Phone', 'Website',
    'Industry', 'Company Size', 'Country', 'City',
    'Monthly FX Volume', 'Est. Monthly EUR', 'Est. Annual Value EUR',
    'Stage', 'Status', 'Owner', 'Source', 'Health Score', 'Churn Risk',
    'Tags', 'Last Contact', 'Next Follow-up', 'Created', 'Notes',
  ];
  const rows = customers.map(c => {
    const e = enrichFn ? enrichFn(c) : enrich(c, []);
    return [
      c.company || '', c.firstName || '', c.lastName || '', c.email || '', c.phone || '', c.website || '',
      c.industry || '', c.companySize || '', c.country || '', c.city || '',
      c.fxVolume || '', e.monthlyVolumeEur || 0, e.estValueEur || 0,
      STAGE_LABELS[c.stage] || c.stage || '', c.status || '', c.owner || '', c.source || '',
      e.health.score, e.health.churnRisk,
      Array.isArray(c.tags) ? c.tags.join(', ') : (c.tags || ''),
      c.lastContactAt ? new Date(c.lastContactAt).toISOString().slice(0, 10) : '',
      c.nextFollowUpAt ? new Date(c.nextFollowUpAt).toISOString().slice(0, 10) : '',
      c.createdAt ? new Date(c.createdAt).toISOString().slice(0, 10) : '',
      c.notes || '',
    ];
  });
  return [headers, ...rows];
}

module.exports = {
  STAGES, STAGE_LABELS, STAGE_PROBABILITY, STATUSES,
  parseMonthlyVolume, estAnnualValue, computeHealth, enrich, toExportRows,
};
