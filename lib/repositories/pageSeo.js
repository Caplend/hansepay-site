'use strict';
const { pool } = require('../db');

function rowToSeo(row) {
  return {
    title: row.title,
    metaTitle: row.meta_title,
    description: row.description,
    metaDescription: row.meta_description,
    keywords: row.keywords, // mysql2 auto-parses JSON columns
    ogImage: row.og_image,
    updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
  };
}

/** Returns the whole SEO config as a slug-keyed object, matching the old seo.json shape. */
async function getAll() {
  const [rows] = await pool.query('SELECT * FROM page_seo');
  const out = {};
  for (const row of rows) out[row.slug] = rowToSeo(row);
  return out;
}

async function getBySlug(slug) {
  const [rows] = await pool.query('SELECT * FROM page_seo WHERE slug = :slug', { slug });
  return rows[0] ? rowToSeo(rows[0]) : {};
}

/** Merge-upsert, mirroring the old Object.assign(existing, patch, {updatedAt}) behavior. */
async function upsert(slug, patch) {
  const existing = await getBySlug(slug);
  const merged = Object.assign({}, existing, patch, { updatedAt: new Date().toISOString() });
  await pool.query(
    `INSERT INTO page_seo (slug, title, meta_title, description, meta_description, keywords, og_image, updated_at)
     VALUES (:slug, :title, :metaTitle, :description, :metaDescription, :keywords, :ogImage, :updatedAt)
     ON DUPLICATE KEY UPDATE title=:title, meta_title=:metaTitle, description=:description,
       meta_description=:metaDescription, keywords=:keywords, og_image=:ogImage, updated_at=:updatedAt`,
    {
      slug, title: merged.title ?? null, metaTitle: merged.metaTitle ?? null,
      description: merged.description ?? null, metaDescription: merged.metaDescription ?? null,
      keywords: merged.keywords ? JSON.stringify(merged.keywords) : null,
      ogImage: merged.ogImage ?? null, updatedAt: new Date(merged.updatedAt),
    }
  );
  return getBySlug(slug);
}

module.exports = { getAll, getBySlug, upsert };
