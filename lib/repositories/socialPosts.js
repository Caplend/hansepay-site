'use strict';
const { pool } = require('../db');

function rowToPost(row) {
  return {
    id: row.id,
    title: row.title,
    caption: row.caption,
    hashtags: row.hashtags,
    image: row.image,
    channels: row.channels || [],
    channelCaptions: row.channel_captions || {},
    status: row.status,
    scheduledAt: row.scheduled_at ? row.scheduled_at.toISOString() : null,
    postedAt: row.posted_at ? row.posted_at.toISOString() : null,
    createdBy: row.created_by,
    createdAt: row.created_at ? row.created_at.toISOString() : null,
    updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
  };
}

async function list({ status } = {}) {
  const clauses = [];
  const params = {};
  if (status) { clauses.push('status = :status'); params.status = status; }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(`SELECT * FROM social_posts ${where} ORDER BY updated_at DESC`, params);
  return rows.map(rowToPost);
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM social_posts WHERE id = :id', { id });
  return rows[0] ? rowToPost(rows[0]) : null;
}

async function create(post) {
  await pool.query(
    `INSERT INTO social_posts (id, title, caption, hashtags, image, channels, channel_captions,
       status, scheduled_at, posted_at, created_by, created_at, updated_at)
     VALUES (:id, :title, :caption, :hashtags, :image, :channels, :channelCaptions,
       :status, :scheduledAt, :postedAt, :createdBy, :createdAt, :updatedAt)`,
    {
      id: post.id, title: post.title ?? '', caption: post.caption ?? '', hashtags: post.hashtags ?? '',
      image: post.image ?? null, channels: JSON.stringify(post.channels || []),
      channelCaptions: JSON.stringify(post.channelCaptions || {}), status: post.status || 'draft',
      scheduledAt: post.scheduledAt ? new Date(post.scheduledAt) : null,
      postedAt: post.postedAt ? new Date(post.postedAt) : null,
      createdBy: post.createdBy ?? null, createdAt: new Date(post.createdAt), updatedAt: new Date(post.updatedAt),
    }
  );
  return findById(post.id);
}

async function update(id, post) {
  await pool.query(
    `UPDATE social_posts SET title=:title, caption=:caption, hashtags=:hashtags, image=:image,
       channels=:channels, channel_captions=:channelCaptions, status=:status,
       scheduled_at=:scheduledAt, posted_at=:postedAt, updated_at=:updatedAt
     WHERE id = :id`,
    {
      id, title: post.title ?? '', caption: post.caption ?? '', hashtags: post.hashtags ?? '',
      image: post.image ?? null, channels: JSON.stringify(post.channels || []),
      channelCaptions: JSON.stringify(post.channelCaptions || {}), status: post.status || 'draft',
      scheduledAt: post.scheduledAt ? new Date(post.scheduledAt) : null,
      postedAt: post.postedAt ? new Date(post.postedAt) : null, updatedAt: new Date(post.updatedAt),
    }
  );
  return findById(id);
}

async function remove(id) {
  const [result] = await pool.query('DELETE FROM social_posts WHERE id = :id', { id });
  return result.affectedRows > 0;
}

module.exports = { list, findById, create, update, remove };
