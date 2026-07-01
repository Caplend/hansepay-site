'use strict';
const { pool, withTransaction } = require('../db');
const crypto = require('crypto');
const customersRepo = require('./customers');
const activitiesRepo = require('./activities');

function makeRebookToken(bookingId, jwtSecret) {
  return crypto.createHmac('sha256', jwtSecret).update(bookingId + '-rebook-hp').digest('hex').slice(0, 32);
}
function makeCancelToken(bookingId, jwtSecret) {
  return crypto.createHmac('sha256', jwtSecret).update(bookingId + '-cancel-hp').digest('hex').slice(0, 32);
}

function rowToBooking(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    createdAt: row.created_at ? row.created_at.toISOString() : null,
    slot: row.slot,
    lead: row.lead,
    status: row.status,
    notes: row.notes,
    meetLink: row.meet_link,
    eventId: row.event_id,
    rebookToken: row.rebook_token,
    cancelToken: row.cancel_token,
    assignedTo: row.assigned_to,
    rebooked: !!row.rebooked,
    rebookedAt: row.rebooked_at ? row.rebooked_at.toISOString() : null,
    updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
    cancelledAt: row.cancelled_at ? row.cancelled_at.toISOString() : null,
    cancelledBy: row.cancelled_by,
    cancelledByName: row.cancelled_by_name,
  };
}

async function list(conn) {
  const [rows] = await (conn || pool).query('SELECT * FROM bookings ORDER BY created_at DESC');
  return rows.map(rowToBooking);
}

async function forCustomer(customerId) {
  const [rows] = await pool.query('SELECT * FROM bookings WHERE customer_id = :customerId ORDER BY created_at DESC', { customerId });
  return rows.map(rowToBooking);
}

async function latest() {
  const [rows] = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC LIMIT 1');
  return rows[0] ? rowToBooking(rows[0]) : null;
}

async function findById(id, conn) {
  const [rows] = await (conn || pool).query('SELECT * FROM bookings WHERE id = :id', { id });
  return rows[0] ? rowToBooking(rows[0]) : null;
}

async function findByRebookToken(token) {
  const [rows] = await pool.query('SELECT * FROM bookings WHERE rebook_token = :token', { token });
  return rows[0] ? rowToBooking(rows[0]) : null;
}

async function findByCancelToken(token) {
  const [rows] = await pool.query('SELECT * FROM bookings WHERE cancel_token = :token', { token });
  return rows[0] ? rowToBooking(rows[0]) : null;
}

async function calendarRange({ start, end }) {
  const clauses = [];
  const params = {};
  if (start) { clauses.push('slot_start >= :start'); params.start = new Date(start); }
  if (end) { clauses.push('slot_start <= :end'); params.end = new Date(end); }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(`SELECT * FROM bookings ${where} ORDER BY slot_start ASC`, params);
  return rows.map(rowToBooking);
}

/** Simple insert — used by seed-mock, which has no calendar/customer side effects of its own. */
async function create(b, conn) {
  await (conn || pool).query(
    `INSERT INTO bookings (id, customer_id, created_at, slot, \`lead\`, status, notes, meet_link,
       event_id, rebook_token, cancel_token, assigned_to, rebooked, rebooked_at, updated_at,
       cancelled_at, cancelled_by, cancelled_by_name)
     VALUES (:id, :customerId, :createdAt, CAST(:slot AS JSON), CAST(:lead AS JSON), :status, :notes,
       :meetLink, :eventId, :rebookToken, :cancelToken, CAST(:assignedTo AS JSON), :rebooked, :rebookedAt,
       :updatedAt, :cancelledAt, :cancelledBy, :cancelledByName)`,
    {
      id: b.id, customerId: b.customerId ?? null, createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
      slot: JSON.stringify(b.slot || {}), lead: JSON.stringify(b.lead || {}), status: b.status || 'new',
      notes: b.notes || '', meetLink: b.meetLink ?? null, eventId: b.eventId ?? null,
      rebookToken: b.rebookToken ?? null, cancelToken: b.cancelToken ?? null,
      assignedTo: b.assignedTo ? JSON.stringify(b.assignedTo) : null, rebooked: b.rebooked ? 1 : 0,
      rebookedAt: b.rebookedAt ? new Date(b.rebookedAt) : null, updatedAt: b.updatedAt ? new Date(b.updatedAt) : new Date(),
      cancelledAt: b.cancelledAt ? new Date(b.cancelledAt) : null, cancelledBy: b.cancelledBy ?? null,
      cancelledByName: b.cancelledByName ?? null,
    }
  );
  return findById(b.id, conn);
}

/**
 * Real booking creation: insert the booking, then upsert the customer from the
 * lead and log a 'booking' activity — all in one transaction, addressing the
 * previously non-atomic 3-step write (bookings.json, customers.json, activities.json).
 */
async function createWithCustomerUpsert({ booking, lead, opts }) {
  return withTransaction(async (conn) => {
    await create(booking, conn);

    const email = (lead.email || '').toLowerCase().trim();
    let cust = email ? await customersRepo.findByEmail(email, conn) : null;
    let isNew = false;
    const now = new Date().toISOString();

    if (!cust) {
      isNew = true;
      cust = await customersRepo.create({
        firstName: lead.firstName || '', lastName: lead.lastName || '', email: lead.email || '',
        phone: lead.phone || '', website: lead.website || '', company: lead.company || '',
        industry: lead.industry || '', companySize: lead.companySize || '', country: lead.country || '',
        city: lead.city || '', fxVolume: lead.fxVolume || '', currencyPairs: lead.currencyPairs || '',
        stage: 'lead', status: 'prospect', owner: '', source: opts.source || 'booking', tags: [],
        notes: lead.notes || '', bookingIds: [booking.id], lastContactAt: now, nextFollowUpAt: null,
        lang: lead.lang || 'de', createdAt: now, updatedAt: now,
      }, conn);
    } else {
      const patch = { lastContactAt: now, updatedAt: now };
      ['firstName', 'lastName', 'company', 'phone', 'website', 'industry', 'companySize', 'country', 'city', 'fxVolume'].forEach(k => {
        if (!cust[k] && lead[k]) patch[k] = lead[k];
      });
      if (cust.status === 'churned') patch.status = 'active';
      cust = await customersRepo.update(cust.id, patch, conn);
      cust = await customersRepo.appendBookingId(cust.id, booking.id, conn);
    }

    await conn.query('UPDATE bookings SET customer_id = :cid WHERE id = :bid', { cid: cust.id, bid: booking.id });

    await activitiesRepo.create({
      customerId: cust.id, type: 'booking',
      title: isNew ? 'New lead from booking' : 'Repeat booking',
      body: opts.slot ? `Discovery call booked for ${opts.slot.label || opts.slot.startISO}` : 'Discovery call booked',
      by: 'system',
    }, conn);

    return { booking: await findById(booking.id, conn), customer: cust };
  });
}

async function update(id, patch, conn) {
  const existing = await findById(id, conn);
  if (!existing) return null;
  const merged = Object.assign({}, existing, patch);
  await (conn || pool).query(
    `UPDATE bookings SET customer_id=:customerId, slot=CAST(:slot AS JSON), \`lead\`=CAST(:lead AS JSON),
       status=:status, notes=:notes, meet_link=:meetLink, event_id=:eventId, rebook_token=:rebookToken,
       cancel_token=:cancelToken, assigned_to=CAST(:assignedTo AS JSON), rebooked=:rebooked,
       rebooked_at=:rebookedAt, updated_at=:updatedAt, cancelled_at=:cancelledAt,
       cancelled_by=:cancelledBy, cancelled_by_name=:cancelledByName
     WHERE id = :id`,
    {
      id, customerId: merged.customerId ?? null, slot: JSON.stringify(merged.slot || {}),
      lead: JSON.stringify(merged.lead || {}), status: merged.status, notes: merged.notes || '',
      meetLink: merged.meetLink ?? null, eventId: merged.eventId ?? null, rebookToken: merged.rebookToken ?? null,
      cancelToken: merged.cancelToken ?? null, assignedTo: merged.assignedTo ? JSON.stringify(merged.assignedTo) : null,
      rebooked: merged.rebooked ? 1 : 0, rebookedAt: merged.rebookedAt ? new Date(merged.rebookedAt) : null,
      updatedAt: merged.updatedAt ? new Date(merged.updatedAt) : new Date(),
      cancelledAt: merged.cancelledAt ? new Date(merged.cancelledAt) : null,
      cancelledBy: merged.cancelledBy ?? null, cancelledByName: merged.cancelledByName ?? null,
    }
  );
  return findById(id, conn);
}

module.exports = {
  list, latest, findById, findByRebookToken, findByCancelToken, calendarRange, forCustomer,
  create, createWithCustomerUpsert, update, makeRebookToken, makeCancelToken, withTransaction,
};
