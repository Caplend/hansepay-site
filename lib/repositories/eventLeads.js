'use strict';
const { pool, withTransaction } = require('../db');
const { v4: uuidv4 } = require('uuid');

function rowToImport(row) {
  return {
    id: row.id,
    eventName: row.event_name,
    importedBy: row.imported_by,
    totalRows: row.total_rows,
    scoredRows: row.scored_rows,
    tierACount: row.tier_a_count,
    tierBCount: row.tier_b_count,
    excludedCount: row.excluded_count,
    createdAt: row.created_at ? row.created_at.toISOString() : null,
  };
}

function rowToLead(row) {
  return {
    id: row.id,
    eventImportId: row.event_import_id,
    firstName: row.first_name,
    lastName: row.last_name,
    company: row.company,
    title: row.title,
    oneLiner: row.one_liner,
    website: row.website,
    hq: row.hq,
    headcount: row.headcount,
    linkedin: row.linkedin,
    linkedinSearchUrl: row.linkedin_search_url,
    icpScore: row.icp_score,
    icpTier: row.icp_tier,
    icpReasoning: row.icp_reasoning,
    draftMessage: row.draft_message,
    status: row.status,
    statusAt: row.status_at ? row.status_at.toISOString() : null,
    notes: row.notes,
    createdCustomerId: row.created_customer_id,
    createdAt: row.created_at ? row.created_at.toISOString() : null,
  };
}

async function listImports() {
  const [rows] = await pool.query('SELECT * FROM event_imports ORDER BY created_at DESC');
  return rows.map(rowToImport);
}

async function findImportById(id) {
  const [rows] = await pool.query('SELECT * FROM event_imports WHERE id = :id', { id });
  return rows[0] ? rowToImport(rows[0]) : null;
}

/** leads: array of { firstName, lastName, company, title, oneLiner, website, hq,
 *  headcount, linkedin, linkedinSearchUrl, icpScore, icpTier, icpReasoning, draftMessage } */
async function createImportWithLeads({ eventName, importedBy, leads }) {
  const importId = 'evt_' + uuidv4().replace(/-/g, '').substring(0, 10);
  const now = new Date();
  const tierACount = leads.filter(l => l.icpTier === 'A').length;
  const tierBCount = leads.filter(l => l.icpTier === 'B').length;
  const excludedCount = leads.filter(l => l.icpScore === -1).length;
  const scoredRows = leads.filter(l => l.icpScore > 0).length;

  await withTransaction(async (conn) => {
    await conn.query(
      `INSERT INTO event_imports (id, event_name, imported_by, total_rows, scored_rows, tier_a_count, tier_b_count, excluded_count, created_at)
       VALUES (:id, :eventName, :importedBy, :totalRows, :scoredRows, :tierACount, :tierBCount, :excludedCount, :createdAt)`,
      { id: importId, eventName, importedBy: importedBy || null, totalRows: leads.length, scoredRows, tierACount, tierBCount, excludedCount, createdAt: now }
    );

    // Only persist leads with an actual ICP signal (score > 0) — the other
    // ~90% (no signal / excluded) don't need a row each; keep the table lean.
    const relevant = leads.filter(l => l.icpScore > 0);
    for (const l of relevant) {
      await conn.query(
        `INSERT INTO event_leads (id, event_import_id, first_name, last_name, company, title, one_liner,
           website, hq, headcount, linkedin, linkedin_search_url, icp_score, icp_tier, icp_reasoning,
           draft_message, status, created_at)
         VALUES (:id, :eventImportId, :firstName, :lastName, :company, :title, :oneLiner,
           :website, :hq, :headcount, :linkedin, :linkedinSearchUrl, :icpScore, :icpTier, :icpReasoning,
           :draftMessage, 'pending', :createdAt)`,
        {
          id: 'evl_' + uuidv4().replace(/-/g, '').substring(0, 10), eventImportId: importId,
          firstName: l.firstName || null, lastName: l.lastName || null, company: l.company || null,
          title: l.title || null, oneLiner: l.oneLiner || null, website: l.website || null,
          hq: l.hq || null, headcount: l.headcount || null, linkedin: l.linkedin || null,
          linkedinSearchUrl: l.linkedinSearchUrl || null, icpScore: l.icpScore, icpTier: l.icpTier || null,
          icpReasoning: l.icpReasoning || null, draftMessage: l.draftMessage || null, createdAt: now,
        }
      );
    }
  });

  return findImportById(importId);
}

async function listLeadsForImport(importId, { status } = {}) {
  const params = { importId };
  let where = 'WHERE event_import_id = :importId';
  if (status) { where += ' AND status = :status'; params.status = status; }
  const [rows] = await pool.query(`SELECT * FROM event_leads ${where} ORDER BY icp_score DESC`, params);
  return rows.map(rowToLead);
}

async function findLeadById(id) {
  const [rows] = await pool.query('SELECT * FROM event_leads WHERE id = :id', { id });
  return rows[0] ? rowToLead(rows[0]) : null;
}

async function updateLeadStatus(id, status, customerId) {
  await pool.query(
    'UPDATE event_leads SET status = :status, status_at = :statusAt, created_customer_id = COALESCE(:customerId, created_customer_id) WHERE id = :id',
    { id, status, statusAt: status === 'pending' ? null : new Date(), customerId: customerId || null }
  );
  return findLeadById(id);
}

async function updateLeadNotes(id, notes) {
  await pool.query('UPDATE event_leads SET notes = :notes WHERE id = :id', { id, notes: notes || null });
  return findLeadById(id);
}

async function deleteImport(id) {
  await pool.query('DELETE FROM event_imports WHERE id = :id', { id }); // cascades to event_leads
}

module.exports = { listImports, findImportById, createImportWithLeads, listLeadsForImport, findLeadById, updateLeadStatus, updateLeadNotes, deleteImport };
