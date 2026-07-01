'use strict';
// Phase 5: customers, activities.
// Usage: MYSQL_URL="$MYSQL_PUBLIC_URL" node scripts/migrate-phase5.js <extracted-data-dir>

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

function toDate(iso) { return iso ? new Date(iso) : null; }
function toJson(v) { return v != null ? JSON.stringify(v) : null; }

function readJson(dataDir, name, fallback) {
  const fp = path.join(dataDir, name);
  if (!fs.existsSync(fp)) { console.warn(`[migrate] ${name} not found, using fallback`); return fallback; }
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

async function main() {
  const dataDir = process.argv[2];
  if (!dataDir) { console.error('Usage: node migrate-phase5.js <extracted-data-dir>'); process.exit(1); }

  const conn = await mysql.createConnection({ uri: process.env.MYSQL_URL, namedPlaceholders: true });
  try {
    await conn.beginTransaction();

    for (const t of ['customers', 'activities']) {
      const [[{ c }]] = await conn.query(`SELECT COUNT(*) AS c FROM ${t}`);
      if (c > 0) throw new Error(`Refusing to migrate: table ${t} already has ${c} row(s).`);
    }

    // ── customers ────────────────────────────────────────────────────────────
    const customers = readJson(dataDir, 'customers.json', []);
    let withAiData = 0;
    for (const c of customers) {
      if (c.aiResearch || c.analysis) withAiData++;
      await conn.query(
        `INSERT INTO customers (id, first_name, last_name, email, phone, website, company, industry,
           company_size, country, city, fx_volume, currency_pairs, stage, status, owner, source, tags,
           notes, est_value_eur, booking_ids, last_contact_at, next_follow_up_at, lang,
           ai_research, researched_at, analysis, analysis_conf, analysis_sources, analyzed_at,
           created_at, updated_at)
         VALUES (:id, :firstName, :lastName, :email, :phone, :website, :company, :industry, :companySize,
           :country, :city, :fxVolume, :currencyPairs, :stage, :status, :owner, :source, :tags, :notes,
           :estValueEur, :bookingIds, :lastContactAt, :nextFollowUpAt, :lang,
           :aiResearch, :researchedAt, :analysis, :analysisConf, :analysisSources, :analyzedAt,
           :createdAt, :updatedAt)`,
        {
          id: c.id, firstName: c.firstName || '', lastName: c.lastName || '', email: c.email || '',
          phone: c.phone || '', website: c.website || '', company: c.company || '', industry: c.industry || '',
          companySize: c.companySize || '', country: c.country || '', city: c.city || '',
          fxVolume: c.fxVolume || '', currencyPairs: c.currencyPairs || '', stage: c.stage || 'lead',
          status: c.status || 'prospect', owner: c.owner || '', source: c.source || 'manual',
          tags: toJson(c.tags || []), notes: c.notes || '', estValueEur: c.estValueEur || 0,
          bookingIds: toJson(c.bookingIds || []), lastContactAt: toDate(c.lastContactAt),
          nextFollowUpAt: toDate(c.nextFollowUpAt), lang: c.lang || 'de',
          aiResearch: toJson(c.aiResearch), researchedAt: toDate(c.researchedAt),
          analysis: toJson(c.analysis), analysisConf: toJson(c.analysisConf),
          analysisSources: toJson(c.analysisSources), analyzedAt: toDate(c.analyzedAt),
          createdAt: toDate(c.createdAt) || new Date(), updatedAt: toDate(c.updatedAt) || new Date(),
        }
      );
    }
    console.log(`[migrate] customers: ${customers.length} rows (${withAiData} with AI research/analysis data)`);

    // ── activities (FK -> customers.id; verified zero orphans beforehand) ────
    const activities = readJson(dataDir, 'activities.json', []);
    for (const a of activities) {
      await conn.query(
        `INSERT INTO activities (id, customer_id, type, title, body, by_name, at)
         VALUES (:id, :customerId, :type, :title, :body, :by, :at)`,
        {
          id: a.id, customerId: a.customerId, type: a.type || 'note', title: a.title || '',
          body: a.body || '', by: a.by || 'system', at: toDate(a.at) || new Date(),
        }
      );
    }
    console.log(`[migrate] activities: ${activities.length} rows`);

    await conn.commit();
    console.log('[migrate] Phase 5 COMPLETE — committed.');
  } catch (err) {
    await conn.rollback();
    console.error('[migrate] FAILED — rolled back, MySQL unchanged:', err.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
