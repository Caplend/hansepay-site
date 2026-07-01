'use strict';
const { pool } = require('../db');
const { v4: uuidv4 } = require('uuid');

function rowToPost(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    category: row.category,
    tags: row.tags || [],
    status: row.status,
    featured: !!row.featured,
    featuredImage: row.featured_image,
    readTime: row.read_time,
    authorId: row.author_id,
    // Frontend historically reads both `author` (blog.html) and `authorName` (blog-post.html) —
    // keep both populated from the single author_name column so neither call site regresses.
    author: row.author_name,
    authorName: row.author_name,
    authorRole: row.author_role,
    authorBio: row.author_bio,
    authorAvatar: row.author_avatar,
    authorLinkedin: row.author_linkedin,
    createdAt: row.created_at ? row.created_at.toISOString() : null,
    publishedAt: row.published_at ? row.published_at.toISOString() : null,
    updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
    views: row.views,
    showInListing: !!row.show_in_listing,
  };
}

async function listAll() {
  const [rows] = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
  return rows.map(rowToPost);
}

async function listPublished() {
  const [rows] = await pool.query(
    `SELECT * FROM posts WHERE status = 'published' AND show_in_listing = 1 ORDER BY created_at DESC`
  );
  return rows.map(rowToPost);
}

async function findBySlugOrId(slugOrId) {
  const [rows] = await pool.query('SELECT * FROM posts WHERE slug = :s OR id = :s LIMIT 1', { s: slugOrId });
  return rows[0] ? rowToPost(rows[0]) : null;
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM posts WHERE id = :id', { id });
  return rows[0] ? rowToPost(rows[0]) : null;
}

async function incrementViews(id) {
  await pool.query('UPDATE posts SET views = views + 1 WHERE id = :id', { id });
  return findById(id);
}

async function create(body, author) {
  const id = 'post_' + uuidv4().replace(/-/g, '').substring(0, 8);
  const now = new Date();
  const post = {
    id,
    title: body.title,
    slug: body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    excerpt: body.excerpt || '',
    content: body.content || '',
    category: body.category || 'Uncategorised',
    tags: body.tags || [],
    status: body.status || 'draft',
    featured: !!body.featured,
    showInListing: body.showInListing !== false,
    featuredImage: body.featuredImage || null,
    readTime: body.readTime || null,
    authorId: author ? author.id : null,
    authorName: body.author || (author ? author.name : null),
    authorRole: body.authorRole || (author ? author.role : '') || '',
    authorBio: body.authorBio || (author ? author.bio : '') || '',
    authorAvatar: body.authorAvatar || (author ? author.avatarUrl : '') || '',
    authorLinkedin: body.authorLinkedin || (author ? author.linkedin : '') || '',
    publishedAt: body.publishedAt || now.toISOString(),
  };
  await pool.query(
    `INSERT INTO posts (id, slug, title, excerpt, content, category, tags, status, featured,
       featured_image, read_time, author_id, author_name, author_role, author_bio, author_avatar,
       author_linkedin, created_at, published_at, updated_at, views, show_in_listing)
     VALUES (:id, :slug, :title, :excerpt, :content, :category, :tags, :status, :featured,
       :featuredImage, :readTime, :authorId, :authorName, :authorRole, :authorBio, :authorAvatar,
       :authorLinkedin, :createdAt, :publishedAt, :updatedAt, 0, :showInListing)`,
    {
      id, slug: post.slug, title: post.title, excerpt: post.excerpt, content: post.content,
      category: post.category, tags: JSON.stringify(post.tags), status: post.status,
      featured: post.featured ? 1 : 0, featuredImage: post.featuredImage, readTime: post.readTime ? String(post.readTime) : null,
      authorId: post.authorId, authorName: post.authorName, authorRole: post.authorRole,
      authorBio: post.authorBio, authorAvatar: post.authorAvatar, authorLinkedin: post.authorLinkedin,
      createdAt: now, publishedAt: new Date(post.publishedAt), updatedAt: now,
      showInListing: post.showInListing ? 1 : 0,
    }
  );
  return findById(id);
}

async function update(id, patch) {
  const existing = await findById(id);
  if (!existing) return null;
  const merged = Object.assign({}, existing, patch);
  // `author` in the patch means authorName in the DB (see rowToPost's dual-field mapping).
  const authorName = patch.author !== undefined ? patch.author : (patch.authorName !== undefined ? patch.authorName : existing.authorName);
  await pool.query(
    `UPDATE posts SET title=:title, slug=:slug, excerpt=:excerpt, content=:content, category=:category,
       tags=:tags, status=:status, featured_image=:featuredImage, featured=:featured,
       show_in_listing=:showInListing, read_time=:readTime, author_name=:authorName,
       author_role=:authorRole, author_bio=:authorBio, author_avatar=:authorAvatar,
       author_linkedin=:authorLinkedin, published_at=:publishedAt, updated_at=:updatedAt
     WHERE id = :id`,
    {
      id, title: merged.title, slug: merged.slug, excerpt: merged.excerpt, content: merged.content,
      category: merged.category, tags: JSON.stringify(merged.tags || []), status: merged.status,
      featuredImage: merged.featuredImage, featured: merged.featured ? 1 : 0,
      showInListing: merged.showInListing !== false ? 1 : 0, readTime: merged.readTime ? String(merged.readTime) : null,
      authorName, authorRole: merged.authorRole, authorBio: merged.authorBio,
      authorAvatar: merged.authorAvatar, authorLinkedin: merged.authorLinkedin,
      publishedAt: merged.publishedAt ? new Date(merged.publishedAt) : null, updatedAt: new Date(),
    }
  );
  return findById(id);
}

async function remove(id) {
  const [result] = await pool.query('DELETE FROM posts WHERE id = :id', { id });
  return result.affectedRows > 0;
}

module.exports = { listAll, listPublished, findBySlugOrId, findById, incrementViews, create, update, remove };
