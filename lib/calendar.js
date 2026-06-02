'use strict';

/**
 * HansePay Booking — Google Calendar helper
 *
 * Supports two auth modes (tried in order):
 *
 * 1. OAuth2 refresh-token mode  ← preferred; bypasses Workspace org policy
 *    Required env vars:
 *      GOOGLE_CLIENT_ID          OAuth 2.0 client ID (Web application)
 *      GOOGLE_CLIENT_SECRET      OAuth 2.0 client secret
 *      GOOGLE_REFRESH_TOKEN      Long-lived refresh token obtained via /api/booking/auth
 *      CALENDAR_OWNER_EMAIL      The Google account that authorised the OAuth token
 *
 * 2. Service-account mode  ← falls back if OAuth vars not set
 *    Required env vars:
 *      GOOGLE_SERVICE_ACCOUNT_EMAIL
 *      GOOGLE_PRIVATE_KEY
 *      CALENDAR_OWNER_EMAIL
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

const TZ         = () => process.env.BOOKING_TIMEZONE           || 'Europe/Berlin';
const DAY_START  = () => parseInt(process.env.BOOKING_HOURS_START   || '9',  10);
const DAY_END    = () => parseInt(process.env.BOOKING_HOURS_END     || '17', 10);
const DAYS_AHEAD = () => parseInt(process.env.BOOKING_DAYS_AHEAD    || '30', 10);
const MIN_NOTICE = () => parseInt(process.env.BOOKING_MIN_NOTICE_HOURS || '2', 10);

// ─── Auth mode detection ──────────────────────────────────────────────────────

function isOAuthConfigured() {
  return !!(
    google &&
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN &&
    process.env.CALENDAR_OWNER_EMAIL
  );
}

function isServiceAccountConfigured() {
  return !!(
    google &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY &&
    process.env.CALENDAR_OWNER_EMAIL
  );
}

function isConfigured() {
  return isOAuthConfigured() || isServiceAccountConfigured();
}

// ─── Auth client factories ────────────────────────────────────────────────────

function getOAuthClient() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return client;
}

function getServiceAccountAuth() {
  const key = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  return new google.auth.JWT({
    email:  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key,
    scopes: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
    ],
  });
}

function getAuth() {
  if (!google) return null;
  if (isOAuthConfigured())       return getOAuthClient();
  if (isServiceAccountConfigured()) return getServiceAccountAuth();
  return null;
}

// ─── OAuth helper exported for server.js ─────────────────────────────────────

/**
 * Returns a one-time authorisation URL.
 * redirectUri must be the full URL the Google Cloud Console has whitelisted,
 * e.g. https://your-railway-app.railway.app/api/booking/auth/callback
 */
function getOAuthUrl(redirectUri) {
  if (!google) throw new Error('googleapis not installed');
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  );
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt:      'consent',   // forces refresh_token to be returned even if already authorised
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/gmail.send', // branded confirmation emails
    ],
  });
}

/**
 * Exchanges a one-time code (from the OAuth callback) for tokens.
 * Returns { refresh_token, access_token, expiry_date }.
 */
async function exchangeCodeForTokens(code, redirectUri) {
  if (!google) throw new Error('googleapis not installed');
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  );
  const { tokens } = await client.getToken(code);
  return tokens;
}

// ─── Timezone helper ─────────────────────────────────────────────────────────

function getTzOffsetHours(date, tz) {
  const noonUTC = new Date(date);
  noonUTC.setUTCHours(12, 0, 0, 0);
  const localHour = parseInt(
    new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false })
      .format(noonUTC),
    10
  );
  return localHour - 12;
}

function localToUTC(dateStr, h, m, tzOffset) {
  const utcH = h - tzOffset;
  const hh   = String(((utcH % 24) + 24) % 24).padStart(2, '0');
  const mm   = String(m).padStart(2, '0');
  return new Date(`${dateStr}T${hh}:${mm}:00Z`);
}

// ─── getAvailableSlots ────────────────────────────────────────────────────────

async function getAvailableSlots(dateStr) {
  const tz     = TZ();
  const start  = DAY_START();
  const end    = DAY_END();

  const refDate  = new Date(dateStr + 'T12:00:00Z');
  const tzOffset = getTzOffsetHours(refDate, tz);

  const queryStart = localToUTC(dateStr, start, 0, tzOffset);
  const queryEnd   = localToUTC(dateStr, end,   0, tzOffset);

  if (!isConfigured()) {
    return generateSlots(dateStr, start, end, tzOffset, []);
  }

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

  return generateSlots(dateStr, start, end, tzOffset, busy);
}

function generateSlots(dateStr, start, end, tzOffset, busy) {
  const minNotice = MIN_NOTICE();
  const now       = new Date();
  const minStart  = new Date(now.getTime() + minNotice * 60 * 60 * 1000);

  const slots = [];
  for (let h = start; h < end; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h * 60 + m + 30 > end * 60) continue;

      const slotStart      = localToUTC(dateStr, h, m, tzOffset);
      const slotEndCorrect = new Date(slotStart.getTime() + 30 * 60 * 1000);

      if (slotStart < minStart) continue;

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

async function createBookingEvent(slot, lead) {
  if (!isConfigured()) {
    return {
      id:          'mock_' + Date.now(),
      htmlLink:    '#',
      hangoutLink: null,
      summary:     `HansePay Discovery Call · ${lead.firstName} ${lead.company}`,
    };
  }

  const auth     = getAuth();
  const calendar = google.calendar({ version: 'v3', auth });
  const owner    = process.env.CALENDAR_OWNER_EMAIL;
  const tz       = TZ();

  // Format slot time for display
  const slotDate = new Date(slot.startISO);
  const dateLabel = slotDate.toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: TZ(),
  });
  const timeLabel = slot.label || slotDate.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', timeZone: TZ(),
  });

  // Client-facing description ONLY. Internal lead-qualification data
  // (industry, FX volume, company size, notes) is NOT placed here because the
  // calendar description is shared with the prospect. That data lives in the
  // CRM/admin dashboard for the sales team.
  const lines = [
    `Hi ${lead.firstName},`,
    '',
    `Looking forward to speaking with you on ${dateLabel} at ${timeLabel} (Berlin time).`,
    '',
    'In this 30-minute call we\'ll learn about your FX needs and show you how HansePay can help your business save on international payments.',
    '',
    'A Google Meet link is attached to this invite — just click "Join" when it\'s time.',
    '',
    'If anything comes up, feel free to reach out at hello@hansepay.com.',
    '',
    'Best,',
    'The HansePay Team',
  ];

  // Attach internal lead detail as a PRIVATE extended property — retrievable
  // via the API for the sales team, never shown to attendees in the invite.
  const privateProps = {};
  ['company', 'role', 'industry', 'fxVolume', 'companySize', 'notes'].forEach(k => {
    if (lead[k]) privateProps[k] = String(lead[k]).slice(0, 1024);
  });

  const event = {
    summary:     `HansePay Discovery Call · ${lead.firstName}${lead.company ? ' · ' + lead.company : ''}`,
    description: lines.join('\n'),
    extendedProperties: { private: privateProps },
    start: { dateTime: slot.startISO, timeZone: tz },
    end:   { dateTime: slot.endISO,   timeZone: tz },
    attendees: [
      { email: owner,                        responseStatus: 'accepted' },
      { email: 'phil.carstensen@caplend.de', responseStatus: 'accepted' },
      { email: lead.email, displayName: `${lead.firstName} ${lead.lastName}` },
    ],
    conferenceData: {
      createRequest: {
        requestId:             `hp-${Date.now()}`,
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
    calendarId:            owner,
    requestBody:           event,
    conferenceDataVersion: 1,
    // 'none' = Google sends NO invitation emails. The prospect receives a
    // single branded HansePay confirmation (with Meet link + add-to-calendar)
    // instead of Google's generic invite. The event still lands on the
    // organiser's calendar and the Meet link is generated.
    sendUpdates:           process.env.BOOKING_SEND_GOOGLE_INVITE === 'true' ? 'all' : 'none',
  });

  return result.data;
}

// ─── getBookingConfig ─────────────────────────────────────────────────────────

function getBookingConfig() {
  return {
    configured:    isConfigured(),
    oauthMode:     isOAuthConfigured(),
    timezone:      TZ(),
    daysAhead:     DAYS_AHEAD(),
    hoursStart:    DAY_START(),
    hoursEnd:      DAY_END(),
    slotMinutes:   30,
  };
}

module.exports = {
  isConfigured,
  isOAuthConfigured,
  isServiceAccountConfigured,
  getOAuthUrl,
  exchangeCodeForTokens,
  getAvailableSlots,
  createBookingEvent,
  getBookingConfig,
};
