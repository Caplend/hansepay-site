'use strict';
const { pool } = require('../db');
const { v4: uuidv4 } = require('uuid');

function rowToEvent(row) {
  return {
    id: row.id,
    type: row.type,
    page: row.page,
    referrer: row.referrer,
    referrerDomain: row.referrer_domain,
    country: row.country,
    countryName: row.country_name,
    city: row.city,
    utmSource: row.utm_source,
    utmMedium: row.utm_medium,
    utmCampaign: row.utm_campaign,
    data: row.data || undefined,
    timestamp: row.ts ? row.ts.toISOString() : null,
  };
}

/** Full list, matching the old readData() shape — callers do their own JS aggregation. */
async function listAll() {
  const [rows] = await pool.query('SELECT * FROM analytics_events ORDER BY ts ASC');
  return rows.map(rowToEvent);
}

async function create({ type, page, referrer, referrerDomain, country, countryName, city, utmSource, utmMedium, utmCampaign, data }) {
  const event = {
    id: uuidv4(), type: type || 'pageview', page: page || '/', referrer: referrer || null,
    referrerDomain: referrerDomain || null, country: country || null, countryName: countryName || null,
    city: city || null, utmSource: utmSource || null, utmMedium: utmMedium || null, utmCampaign: utmCampaign || null,
    data: data || null, ts: new Date(),
  };
  await pool.query(
    `INSERT INTO analytics_events (id, type, page, referrer, referrer_domain, country, country_name, city,
       utm_source, utm_medium, utm_campaign, data, ts)
     VALUES (:id, :type, :page, :referrer, :referrerDomain, :country, :countryName, :city,
       :utmSource, :utmMedium, :utmCampaign, :data, :ts)`,
    { ...event, data: event.data ? JSON.stringify(event.data) : null }
  );
  return rowToEvent(event);
}

module.exports = { listAll, create };
