'use strict';
// Phase 1: currencies, legal_documents, page_seo.
// Usage: MYSQL_URL="$MYSQL_PUBLIC_URL" node scripts/migrate-phase1.js <extracted-data-dir>
//
// Idempotent-refusal: aborts if any target table already has rows, so it's
// always safe to re-run against the same frozen extraction after fixing a bug.

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// mysql2 formats JS Date objects correctly for DATETIME columns; raw
// ISO-with-'Z' strings are not valid MySQL datetime literals.
function toDate(iso) { return iso ? new Date(iso) : null; }

function readJson(dataDir, name, fallback) {
  const fp = path.join(dataDir, name);
  if (!fs.existsSync(fp)) { console.warn(`[migrate] ${name} not found, using fallback`); return fallback; }
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

async function main() {
  const dataDir = process.argv[2];
  if (!dataDir) { console.error('Usage: node migrate-phase1.js <extracted-data-dir>'); process.exit(1); }

  const conn = await mysql.createConnection({ uri: process.env.MYSQL_URL, namedPlaceholders: true });
  try {
    await conn.beginTransaction();

    for (const t of ['currencies', 'legal_documents', 'page_seo']) {
      const [[{ c }]] = await conn.query(`SELECT COUNT(*) AS c FROM ${t}`);
      if (c > 0) throw new Error(`Refusing to migrate: table ${t} already has ${c} row(s).`);
    }

    // ── currencies ──────────────────────────────────────────────────────────
    const currencies = readJson(dataDir, 'currencies.json', []);
    for (const cur of currencies) {
      await conn.query(
        `INSERT INTO currencies (code, name, symbol, country, flat_fee, var_fee)
         VALUES (:code, :name, :symbol, :country, :flatFee, :varFee)`,
        { code: cur.code, name: cur.name, symbol: cur.symbol ?? null, country: cur.country ?? null,
          flatFee: cur.flatFee ?? 0, varFee: cur.varFee ?? 0 }
      );
    }
    console.log(`[migrate] currencies: ${currencies.length} rows`);

    // ── legal_documents ─────────────────────────────────────────────────────
    const legal = readJson(dataDir, 'legal.json', []);
    for (const doc of legal) {
      await conn.query(
        `INSERT INTO legal_documents (slug, title, badge, body, effective_line, updated_at, updated_by)
         VALUES (:slug, :title, :badge, :body, :effectiveLine, :updatedAt, :updatedBy)`,
        { slug: doc.slug, title: doc.title || '', badge: doc.badge ?? null, body: doc.body ?? null,
          effectiveLine: doc.effectiveLine ?? null, updatedAt: toDate(doc.updatedAt), updatedBy: doc.updatedBy ?? null }
      );
    }
    console.log(`[migrate] legal_documents: ${legal.length} rows`);

    // ── page_seo (object map keyed by slug, not an array) ──────────────────
    const seo = readJson(dataDir, 'seo.json', {});
    const seoEntries = Object.entries(seo);
    for (const [slug, v] of seoEntries) {
      await conn.query(
        `INSERT INTO page_seo (slug, title, meta_title, description, meta_description, keywords, og_image, updated_at)
         VALUES (:slug, :title, :metaTitle, :description, :metaDescription, :keywords, :ogImage, :updatedAt)`,
        { slug, title: v.title ?? null, metaTitle: v.metaTitle ?? null, description: v.description ?? null,
          metaDescription: v.metaDescription ?? null, keywords: v.keywords ? JSON.stringify(v.keywords) : null,
          ogImage: v.ogImage ?? null, updatedAt: toDate(v.updatedAt) }
      );
    }
    console.log(`[migrate] page_seo: ${seoEntries.length} rows`);

    await conn.commit();
    console.log('[migrate] Phase 1 COMPLETE — committed.');
  } catch (err) {
    await conn.rollback();
    console.error('[migrate] FAILED — rolled back, MySQL unchanged:', err.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
