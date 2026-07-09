'use strict';

/**
 * HansePay Booking — Google Calendar helper
 *
 * Two auth scopes, tried in this order per call:
 *
 * 1. Per-rep OAuth  ← preferred; each sales rep connects their own calendar
 *    via GET /api/booking/auth?rep=<id>. The resulting refresh token +
 *    connected email are stored on that rep's record (sales_reps JSON array
 *    in app_settings), never in env vars. Pass the rep object — as returned
 *    by settingsRepo.get() — into getAvailableSlots/createBookingEvent to
 *    use it.
 *
 * 2. Global fallback ← used when a rep has no calendar connected yet, or no
 *    rep is known at all. Same two sub-modes as before:
 *      OAuth2 refresh-token mode:
 *        GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN / CALENDAR_OWNER_EMAIL
 *      Service-account mode:
 *        GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY / CALENDAR_OWNER_EMAIL
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

const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.send',    // branded confirmation emails sent as the rep
  'https://www.googleapis.com/auth/userinfo.email', // so we know which account just connected
];

// ─── Auth mode detection ──────────────────────────────────────────────────────

function isRepConfigured(rep) {
  return !!(google && rep && rep.refreshToken && rep.calendarId);
}

function isGlobalOAuthConfigured() {
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

function isGlobalConfigured() {
  return isGlobalOAuthConfigured() || isServiceAccountConfigured();
}

/** True if this booking flow has SOME calendar to write to — the rep's own, or the fallback. */
function isConfiguredFor(rep) {
  return isRepConfigured(rep) || isGlobalConfigured();
}

// Kept for callers that genuinely mean "is the global/shared calendar set up"
// (e.g. deciding whether to show the manual /api/booking/auth re-auth link).
function isConfigured() {
  return isGlobalConfigured();
}

// ─── Auth client factories ────────────────────────────────────────────────────

function getRepOAuthClient(rep) {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  client.setCredentials({ refresh_token: rep.refreshToken });
  return client;
}

function getGlobalOAuthClient() {
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

/** Resolves the right auth client for this rep, falling back to the shared calendar. */
function getAuth(rep) {
  if (!google) return null;
  if (isRepConfigured(rep))          return getRepOAuthClient(rep);
  if (isGlobalOAuthConfigured())     return getGlobalOAuthClient();
  if (isServiceAccountConfigured())  return getServiceAccountAuth();
  return null;
}

/** Resolves the calendar id to read/write — the rep's own connected account, or the shared owner. */
function getCalendarOwner(rep) {
  if (isRepConfigured(rep)) return rep.calendarId;
  return process.env.CALENDAR_OWNER_EMAIL;
}

// ─── OAuth helpers exported for server.js ────────────────────────────────────

/**
 * Returns a one-time authorisation URL.
 * redirectUri must be the full URL the Google Cloud Console has whitelisted,
 * e.g. https://your-railway-app.railway.app/api/booking/auth/callback
 * state, when provided (a sales rep id), round-trips through Google so the
 * callback knows which rep just connected their calendar.
 */
function getOAuthUrl(redirectUri, state) {
  if (!google) throw new Error('googleapis not installed');
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  );
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt:      'consent',   // forces refresh_token to be returned even if already authorised
    scope:       OAUTH_SCOPES,
    state:       state || undefined,
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

/** Looks up which Google account just authorised, so we can auto-fill calendarId. */
async function getConnectedEmail(accessToken) {
  if (!google || !accessToken) return null;
  try {
    const client = new google.auth.OAuth2();
    client.setCredentials({ access_token: accessToken });
    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const { data } = await oauth2.userinfo.get();
    return data.email || null;
  } catch (e) {
    return null;
  }
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

async function getAvailableSlots(dateStr, rep, durationMinutes) {
  const duration = durationMinutes || 30;
  const tz     = TZ();
  const start  = DAY_START();
  const end    = DAY_END();

  const refDate  = new Date(dateStr + 'T12:00:00Z');
  const tzOffset = getTzOffsetHours(refDate, tz);

  const queryStart = localToUTC(dateStr, start, 0, tzOffset);
  const queryEnd   = localToUTC(dateStr, end,   0, tzOffset);

  if (!isConfiguredFor(rep)) {
    return generateSlots(dateStr, start, end, tzOffset, [], duration);
  }

  const auth     = getAuth(rep);
  const calendar = google.calendar({ version: 'v3', auth });
  const owner    = getCalendarOwner(rep);

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

  return generateSlots(dateStr, start, end, tzOffset, busy, duration);
}

// durationMinutes only changes how long each offered slot IS — the grid of
// possible start times stays fixed at every 30 minutes, same as before.
function generateSlots(dateStr, start, end, tzOffset, busy, durationMinutes) {
  const duration  = durationMinutes || 30;
  const minNotice = MIN_NOTICE();
  const now       = new Date();
  const minStart  = new Date(now.getTime() + minNotice * 60 * 60 * 1000);

  const slots = [];
  for (let h = start; h < end; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h * 60 + m + duration > end * 60) continue;

      const slotStart      = localToUTC(dateStr, h, m, tzOffset);
      const slotEndCorrect = new Date(slotStart.getTime() + duration * 60 * 1000);

      if (slotStart < minStart) continue;

      const isBusy = busy.some(b => slotStart < b.end && slotEndCorrect > b.start);
      if (isBusy) continue;

      const endH = Math.floor((h * 60 + m + duration) / 60);
      const endM = (m + duration) % 60;

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

async function createBookingEvent(slot, lead, rep, bookingType) {
  if (!isConfiguredFor(rep)) {
    return {
      id:          'mock_' + Date.now(),
      htmlLink:    '#',
      hangoutLink: null,
      summary:     `${bookingType ? bookingType.label : 'HansePay Discovery Call'} · ${lead.firstName} ${lead.company || ''}`.trim(),
    };
  }

  const auth     = getAuth(rep);
  const calendar = google.calendar({ version: 'v3', auth });
  const owner    = getCalendarOwner(rep);
  const tz       = TZ();
  const repMode  = isRepConfigured(rep);

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
  const lines = bookingType
    ? [
        `Hi ${lead.firstName},`,
        '',
        `Looking forward to speaking with you on ${dateLabel} at ${timeLabel} (Berlin time).`,
        '',
        bookingType.description || `A ${bookingType.duration}-minute call.`,
        '',
        'A Google Meet link is attached to this invite — just click "Join" when it\'s time.',
        '',
        'Best,',
        rep && rep.name ? rep.name : 'The HansePay Team',
      ]
    : [
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
        repMode ? (rep.name || 'The HansePay Team') : 'The HansePay Team',
      ];

  // Attach internal lead detail as a PRIVATE extended property — retrievable
  // via the API for the sales team, never shown to attendees in the invite.
  const privateProps = {};
  ['company', 'role', 'industry', 'fxVolume', 'companySize', 'notes'].forEach(k => {
    if (lead[k]) privateProps[k] = String(lead[k]).slice(0, 1024);
  });

  // Per-rep mode: the event lives on the rep's own calendar, so they're
  // already the organiser — no need to also hardcode a co-attendee the way
  // the single-shared-calendar fallback below does.
  const attendees = repMode
    ? [
        { email: owner, responseStatus: 'accepted' },
        { email: lead.email, displayName: `${lead.firstName} ${lead.lastName}` },
      ]
    : [
        { email: owner,                        responseStatus: 'accepted' },
        { email: 'phil.carstensen@caplend.de', responseStatus: 'accepted' },
        { email: lead.email, displayName: `${lead.firstName} ${lead.lastName}` },
      ];

  const event = {
    summary:     `${bookingType ? bookingType.label : 'HansePay Discovery Call'} · ${lead.firstName}${lead.company ? ' · ' + lead.company : ''}`,
    description: lines.join('\n'),
    extendedProperties: { private: privateProps },
    start: { dateTime: slot.startISO, timeZone: tz },
    end:   { dateTime: slot.endISO,   timeZone: tz },
    attendees,
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

function getBookingConfig(rep, bookingType) {
  return {
    configured:    isConfiguredFor(rep),
    oauthMode:     isRepConfigured(rep) || isGlobalOAuthConfigured(),
    timezone:      TZ(),
    daysAhead:     DAYS_AHEAD(),
    hoursStart:    DAY_START(),
    hoursEnd:      DAY_END(),
    slotMinutes:   bookingType ? bookingType.duration : 30,
  };
}

// ─── cancelBookingEvent ───────────────────────────────────────────────────────

async function cancelBookingEvent(eventId, rep) {
  if (!eventId || eventId === 'unconfigured' || eventId.startsWith('mock_')) return { cancelled: false, reason: 'mock' };
  if (!isConfiguredFor(rep)) return { cancelled: false, reason: 'not_configured' };

  const auth     = getAuth(rep);
  const calendar = google.calendar({ version: 'v3', auth });
  const owner    = getCalendarOwner(rep);

  await calendar.events.delete({
    calendarId: owner,
    eventId:    eventId,
    sendUpdates: 'none', // we send our own email
  });
  return { cancelled: true };
}

module.exports = {
  isConfigured,
  isConfiguredFor,
  isRepConfigured,
  isOAuthConfigured: isGlobalOAuthConfigured,
  isServiceAccountConfigured,
  getOAuthUrl,
  exchangeCodeForTokens,
  getConnectedEmail,
  getAvailableSlots,
  createBookingEvent,
  cancelBookingEvent,
  getBookingConfig,
};
