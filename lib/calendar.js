'use strict';

/**
 * HansePay Booking — Google Calendar helper
 *
 * Uses a Google Workspace service account with domain-wide delegation
 * to read the calendar owner's free/busy schedule and create events.
 *
 * Required env vars:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL  e.g. hansepay-booking@my-project.iam.gserviceaccount.com
 *   GOOGLE_PRIVATE_KEY            The private key from the service account JSON (raw PEM string).
 *                                 In Railway: paste the full key including "-----BEGIN..." lines.
 *                                 Newlines as literal \n in the env var are handled automatically.
 *   CALENDAR_OWNER_EMAIL          The Google Workspace user whose calendar to read/write.
 *                                 e.g. alex@hansepay.com
 *
 * Optional env vars (with sensible defaults):
 *   BOOKING_TIMEZONE              default: Europe/Berlin
 *   BOOKING_HOURS_START           default: 9   (09:00 local time)
 *   BOOKING_HOURS_END             default: 17  (17:00 local time — last slot starts 16:30)
 *   BOOKING_DAYS_AHEAD            default: 30  (how far ahead users can book)
 *   BOOKING_MIN_NOTICE_HOURS      default: 2   (minimum hours notice before a slot)
 */

let google;
try {
  ({ google } = require('googleapis'));
} catch (e) {
  google = null; // googleapis not installed — mock mode
}

// ─── Config ──────────────────────────────────────────────────────────────────

const TZ         = () => process.env.BOOKING_TIMEZONE        || 'Europe/Berlin';
const DAY_START  = () => parseInt(process.env.BOOKING_HOURS_START   || '9',  10);
const DAY_END    = () => parseInt(process.env.BOOKING_HOURS_END     || '17', 10);
const DAYS_AHEAD = () => parseInt(process.env.BOOKING_DAYS_AHEAD    || '30', 10);
const MIN_NOTICE = () => parseInt(process.env.BOOKING_MIN_NOTICE_HOURS || '2', 10);

function isConfigured() {
  return !!(
    google &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY &&
    process.env.CALENDAR_OWNER_EMAIL
  );
}

function getAuth() {
  if (!isConfigured()) return null;
  const key = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  return new google.auth.JWT({
    email:   process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key,
    scopes: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
    ],
    subject: process.env.CALENDAR_OWNER_EMAIL,
  });
}

// ─── Timezone helper ─────────────────────────────────────────────────────────
// Returns how many hours ahead of UTC the given timezone is at the given date.
// Works for any IANA timezone via Intl — no external library needed.
function getTzOffsetHours(date, tz) {
  const noonUTC = new Date(date);
  noonUTC.setUTCHours(12, 0, 0, 0);
  const localHour = parseInt(
    new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false })
      .format(noonUTC),
    10
  );
  // localHour is what "12 UTC" looks like in the target timezone
  return localHour - 12; // e.g. CEST → 14 - 12 = +2
}

// Convert a local "HH:MM" time on a given dateStr to a UTC Date object
function localToUTC(dateStr, h, m, tzOffset) {
  // UTC = local - offset
  const utcH = h - tzOffset;
  // Build ISO string; utcH could be < 0 in extreme west zones but Berlin is always +1/+2
  const hh = String(((utcH % 24) + 24) % 24).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return new Date(`${dateStr}T${hh}:${mm}:00Z`);
}

// ─── getAvailableSlots ────────────────────────────────────────────────────────
/**
 * Returns an array of available 30-minute slots for `dateStr` (YYYY-MM-DD).
 * Each slot: { label: "09:00 – 09:30", startISO: "...", endISO: "..." }
 *
 * When not configured, returns a set of mock slots (useful for UI testing).
 */
async function getAvailableSlots(dateStr) {
  const tz      = TZ();
  const start   = DAY_START();
  const end     = DAY_END();

  const refDate = new Date(dateStr + 'T12:00:00Z');
  const tzOffset = getTzOffsetHours(refDate, tz);

  // Working day window in UTC (add ±1h buffer)
  const queryStart = localToUTC(dateStr, start,   0, tzOffset);
  const queryEnd   = localToUTC(dateStr, end,     0, tzOffset);

  // --- MOCK MODE (no credentials configured) ---
  if (!isConfigured()) {
    return generateMockSlots(dateStr, start, end, tzOffset, []);
  }

  // --- LIVE MODE ---
  const auth     = getAuth();
  const calendar = google.calendar({ version: 'v3', auth });
  const owner    = process.env.CALENDAR_OWNER_EMAIL;

  const fbRes = await calendar.freebusy.query({
    requestBody: {
      timeMin:  queryStart.toISOString(),
      timeMax:  queryEnd.toISOString(),
      timeZone: tz,
      items:    [{ id: owner }],
    },
  });

  const busy = (fbRes.data.calendars[owner]?.busy || []).map(b => ({
    start: new Date(b.start),
    end:   new Date(b.end),
  }));

  return generateMockSlots(dateStr, start, end, tzOffset, busy);
}

function generateMockSlots(dateStr, start, end, tzOffset, busy) {
  const tz        = TZ();
  const minNotice = MIN_NOTICE();
  const now       = new Date();
  const minStart  = new Date(now.getTime() + minNotice * 60 * 60 * 1000);

  const slots = [];
  for (let h = start; h < end; h++) {
    for (let m = 0; m < 60; m += 30) {
      // Last slot must end by DAY_END
      if (h * 60 + m + 30 > end * 60) continue;

      const slotStart = localToUTC(dateStr, h, m,    tzOffset);
      const slotEnd   = localToUTC(dateStr, h, m + 30 > 59 ? 0 : m + 30, m + 30 > 59 ? tzOffset - 1 : tzOffset);
      // Simpler end calculation:
      const slotEndCorrect = new Date(slotStart.getTime() + 30 * 60 * 1000);

      // Skip past / too-soon slots
      if (slotStart < minStart) continue;

      // Skip busy slots
      const isBusy = busy.some(b => slotStart < b.end && slotEndCorrect > b.start);
      if (isBusy) continue;

      const endH = Math.floor((h * 60 + m + 30) / 60);
      const endM = (m + 30) % 60;

      slots.push({
        label:    `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')} – ${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}`,
        startISO: slotStart.toISOString(),
        endISO:   slotEndCorrect.toISOString(),
      });
    }
  }
  return slots;
}

// ─── createBookingEvent ───────────────────────────────────────────────────────
/**
 * Creates a Google Calendar event for the booking.
 * Returns the created event object (including hangoutLink if Meet was added).
 *
 * lead: { firstName, lastName, email, company, role, industry, fxVolume, companySize, notes }
 * slot: { startISO, endISO, label }
 */
async function createBookingEvent(slot, lead) {
  if (!isConfigured()) {
    // Mock: just return a fake event so the UI can show success
    return {
      id: 'mock_' + Date.now(),
      htmlLink: '#',
      hangoutLink: null,
      summary: `HansePay Discovery Call · ${lead.firstName} ${lead.company}`,
    };
  }

  const auth     = getAuth();
  const calendar = google.calendar({ version: 'v3', auth });
  const owner    = process.env.CALENDAR_OWNER_EMAIL;
  const tz       = TZ();

  const lines = [
    '📋 Lead Details',
    '',
    `Name:             ${lead.firstName} ${lead.lastName}`,
    `Email:            ${lead.email}`,
    `Company:          ${lead.company || '—'}`,
    `Role:             ${lead.role || '—'}`,
    `Industry:         ${lead.industry || '—'}`,
    `Monthly FX Volume:${lead.fxVolume || '—'}`,
    `Company Size:     ${lead.companySize || '—'}`,
  ];
  if (lead.notes) {
    lines.push('', `Notes:`, lead.notes);
  }
  lines.push('', '—', 'Booked via hansepay.com/booking.html');

  const event = {
    summary:     `HansePay Discovery Call · ${lead.firstName}${lead.company ? ' · ' + lead.company : ''}`,
    description: lines.join('\n'),
    start: { dateTime: slot.startISO, timeZone: tz },
    end:   { dateTime: slot.endISO,   timeZone: tz },
    attendees: [
      { email: owner,      responseStatus: 'accepted' },
      { email: lead.email, displayName: `${lead.firstName} ${lead.lastName}` },
    ],
    conferenceData: {
      createRequest: {
        requestId:            `hp-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 15 },
      ],
    },
  };

  const result = await calendar.events.insert({
    calendarId:           owner,
    requestBody:          event,
    conferenceDataVersion: 1,   // enables Google Meet auto-generation
    sendUpdates:          'all', // sends email invites to all attendees
  });

  return result.data;
}

// ─── getBookingConfig ─────────────────────────────────────────────────────────
/** Returns public config for the frontend (no secrets). */
function getBookingConfig() {
  return {
    configured:  isConfigured(),
    timezone:    TZ(),
    daysAhead:   DAYS_AHEAD(),
    hoursStart:  DAY_START(),
    hoursEnd:    DAY_END(),
    slotMinutes: 30,
  };
}

module.exports = { isConfigured, getAvailableSlots, createBookingEvent, getBookingConfig };
