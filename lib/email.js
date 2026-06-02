'use strict';

/**
 * HansePay — transactional email
 *
 * Sends branded HTML email. Two transports, tried in order:
 *
 *   1. Gmail API  — reuses the SAME Google OAuth client already used for the
 *      booking calendar (GOOGLE_CLIENT_ID / SECRET / REFRESH_TOKEN).
 *      Requires the refresh token to include the gmail.send scope — re-run
 *      /api/booking/auth once after deploying this (the scope is now requested).
 *      Sends "from" CALENDAR_OWNER_EMAIL (or EMAIL_FROM).
 *
 *   2. None — if Gmail isn't configured the message is logged and skipped,
 *      so a booking never fails just because email isn't wired up yet.
 *
 * Optional env:
 *   EMAIL_FROM         display + address, e.g. "HansePay <hello@hansepay.de>"
 *   EMAIL_REPLY_TO     reply-to address (default: CALENDAR_OWNER_EMAIL)
 *   EMAIL_BCC          internal copy address (e.g. sales inbox)
 */

let google;
try { ({ google } = require('googleapis')); } catch (_) { google = null; }

const BRAND = {
  navy:  '#0B1929',
  navy2: '#163659',
  blue:  '#1E4E80',
  blue2: '#2E6BAD',
  n200:  '#8DBDE6',
  ink:   '#1a2b3c',
  ink2:  '#3D5A73',
  ink3:  '#7A9AB0',
  off:   '#F5F1EA',
  line:  '#e6ebf0',
};

// Public base URL for email assets (logo). Overridable in Railway.
const PUBLIC_BASE = (process.env.PUBLIC_BASE_URL || 'https://hansepay-deploy-production-328c.up.railway.app').replace(/\/$/, '');
const LOGO_WHITE = PUBLIC_BASE + '/assets/hansepay-mark-uploaded-white.png';
// Brand wordmark font stack — matches the site (Libre Baskerville, weight 400)
const SERIF = "'Libre Baskerville',Georgia,'Times New Roman',serif";

function gmailConfigured() {
  return !!(google &&
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN &&
    (process.env.CALENDAR_OWNER_EMAIL || process.env.EMAIL_FROM));
}

function fromAddress() {
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
  const owner = process.env.CALENDAR_OWNER_EMAIL || 'hello@hansepay.de';
  return `HansePay <${owner}>`;
}

// ─── MIME builder ────────────────────────────────────────────────────────────
function buildMime({ to, from, replyTo, bcc, subject, html, text }) {
  const boundary = 'hp_' + Buffer.from(subject + to).toString('hex').slice(0, 16);
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    replyTo ? `Reply-To: ${replyTo}` : null,
    bcc ? `Bcc: ${bcc}` : null,
    `Subject: =?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ].filter(Boolean);

  const body = [
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(text || '', 'utf8').toString('base64'),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(html || '', 'utf8').toString('base64'),
    `--${boundary}--`,
    '',
  ];

  return headers.join('\r\n') + '\r\n\r\n' + body.join('\r\n');
}

// ─── Gmail send ──────────────────────────────────────────────────────────────
async function sendViaGmail(msg) {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  const gmail = google.gmail({ version: 'v1', auth: client });

  const raw = Buffer.from(buildMime(msg), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });
  return res.data;
}

/**
 * sendMail({ to, subject, html, text }) -> { sent:Boolean, transport, id?, reason? }
 * Never throws — returns a status object so callers can fire-and-forget.
 */
async function sendMail({ to, subject, html, text, replyTo }) {
  const msg = {
    to,
    from: fromAddress(),
    replyTo: replyTo || process.env.EMAIL_REPLY_TO || process.env.CALENDAR_OWNER_EMAIL || null,
    bcc: process.env.EMAIL_BCC || null,
    subject,
    html,
    text: text || htmlToText(html),
  };

  if (gmailConfigured()) {
    try {
      const data = await sendViaGmail(msg);
      return { sent: true, transport: 'gmail', id: data.id };
    } catch (err) {
      console.error('[email] Gmail send failed:', err.message);
      return { sent: false, transport: 'gmail', reason: err.message };
    }
  }

  console.log(`[email] (not configured) would send "${subject}" to ${to}`);
  return { sent: false, transport: 'none', reason: 'email transport not configured' };
}

function htmlToText(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|h[1-6]|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&euro;/g, '€')
    .replace(/\n{3,}/g, '\n\n').trim();
}

// ─── Booking confirmation template ───────────────────────────────────────────
const COPY = {
  en: {
    subject: (d) => `Your HansePay call is confirmed — ${d}`,
    preheader: 'Your discovery call is booked. Here are the details.',
    badge: 'Booking confirmed',
    hi: (n) => `Hi ${n},`,
    intro: 'Thanks for booking a call with HansePay. Your 30-minute discovery call is confirmed — we\'re looking forward to learning about your FX needs and showing you how we can help your business save on cross-border payments.',
    when: 'When',
    duration: '30 minutes',
    where: 'Where',
    meet: 'Google Meet — link below and in your calendar invite',
    joinBtn: 'Join the Google Meet',
    addCal: 'Add to calendar',
    calNote: 'Add the call to your calendar so you don\'t miss it — the Google Meet link is included.',
    expectTitle: 'What to expect',
    expect: [
      'A relaxed, no-pressure conversation — not a hard sell.',
      'A few questions about your current cross-border payment flows.',
      'A clear view of where HansePay could save you time and money.',
    ],
    prepTitle: 'To make the most of it',
    prep: 'Have a rough idea of your monthly FX volume and the currency pairs you use most. That\'s all — we\'ll handle the rest.',
    reschedule: 'Need to reschedule? Just reply to this email and we\'ll find a new time.',
    signoff: 'See you soon,',
    team: 'The HansePay Team',
    footerTagline: 'EU-regulated cross-border payments · Hamburg',
    detailsTitle: 'Your details',
  },
  de: {
    subject: (d) => `Ihr HansePay-Termin ist bestätigt — ${d}`,
    preheader: 'Ihr Kennenlerngespräch ist gebucht. Hier die Details.',
    badge: 'Termin bestätigt',
    hi: (n) => `Hallo ${n},`,
    intro: 'Vielen Dank für Ihre Buchung bei HansePay. Ihr 30-minütiges Kennenlerngespräch ist bestätigt — wir freuen uns darauf, Ihre FX-Anforderungen kennenzulernen und Ihnen zu zeigen, wie Sie bei internationalen Zahlungen sparen können.',
    when: 'Wann',
    duration: '30 Minuten',
    where: 'Wo',
    meet: 'Google Meet — Link unten und in Ihrer Kalendereinladung',
    joinBtn: 'Google Meet beitreten',
    addCal: 'Zum Kalender hinzufügen',
    calNote: 'Fügen Sie den Termin Ihrem Kalender hinzu, damit Sie ihn nicht verpassen — der Google-Meet-Link ist enthalten.',
    expectTitle: 'Was Sie erwartet',
    expect: [
      'Ein entspanntes Gespräch auf Augenhöhe — kein Verkaufsdruck.',
      'Ein paar Fragen zu Ihren aktuellen grenzüberschreitenden Zahlungsabläufen.',
      'Ein klares Bild, wo HansePay Ihnen Zeit und Geld sparen kann.',
    ],
    prepTitle: 'Damit es sich lohnt',
    prep: 'Halten Sie eine grobe Vorstellung Ihres monatlichen FX-Volumens und der wichtigsten Währungspaare bereit. Mehr braucht es nicht — um den Rest kümmern wir uns.',
    reschedule: 'Termin verschieben? Antworten Sie einfach auf diese E-Mail und wir finden eine neue Zeit.',
    signoff: 'Bis bald,',
    team: 'Ihr HansePay-Team',
    footerTagline: 'EU-regulierte grenzüberschreitende Zahlungen · Hamburg',
    detailsTitle: 'Ihre Angaben',
  },
};

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function gcalLink(booking) {
  try {
    var fmt = function (iso) { return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };
    var start = fmt(booking.slot.startISO);
    var end = fmt(booking.slot.endISO || booking.slot.startISO);
    var loc = booking.meetLink || 'Google Meet';
    var details = booking.meetLink ? ('Join Google Meet: ' + booking.meetLink) : 'HansePay discovery call';
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent('HansePay Discovery Call') +
      '&dates=' + start + '/' + end +
      '&details=' + encodeURIComponent(details) +
      '&location=' + encodeURIComponent(loc);
  } catch (e) { return null; }
}

function formatWhen(startISO, lang) {
  const d = new Date(startISO);
  const locale = lang === 'de' ? 'de-DE' : 'en-GB';
  const datePart = d.toLocaleDateString(locale, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Berlin',
  });
  const timePart = d.toLocaleTimeString(locale, {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin',
  });
  return { datePart, timePart, full: `${datePart} · ${timePart}` };
}

/**
 * Build the booking confirmation email.
 * booking = { slot:{startISO,endISO,label}, lead:{firstName,lastName,email,company,...,lang}, meetLink, calendarUrl }
 * Returns { subject, html, text, to }
 */
function renderBookingEmail(booking) {
  const lead = booking.lead || {};
  const lang = (lead.lang === 'de') ? 'de' : 'en';
  const t = COPY[lang];
  const when = formatWhen(booking.slot.startISO, lang);
  const name = esc(lead.firstName || (lang === 'de' ? 'dort' : 'there'));
  const meetLink = booking.meetLink || booking.calendarUrl || null;
  const addCalUrl = gcalLink(booking);
  const tzLabel = lang === 'de' ? '(Hamburger Zeit)' : '(Berlin time)';

  const detailRows = [
    [lang === 'de' ? 'Name' : 'Name', `${lead.firstName || ''} ${lead.lastName || ''}`.trim()],
    ['E-Mail', lead.email || ''],
    [lang === 'de' ? 'Unternehmen' : 'Company', lead.company || '—'],
    [lang === 'de' ? 'Branche' : 'Industry', lead.industry || '—'],
    [lang === 'de' ? 'Monatl. FX-Volumen' : 'Monthly FX volume', lead.fxVolume || '—'],
  ].filter(r => r[1]);

  const html = `<!DOCTYPE html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting"><title>${esc(t.subject(when.datePart))}</title></head>
<body style="margin:0;padding:0;background:${BRAND.off};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.ink};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(t.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.off};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 28px rgba(11,25,41,.10);">

  <!-- Header -->
  <tr><td style="background:${BRAND.navy};padding:28px 36px;">
    <table role="presentation" width="100%"><tr>
      <td valign="middle">
        <table role="presentation"><tr>
          <td valign="middle" style="padding-right:10px;"><img src="${LOGO_WHITE}" width="30" height="30" alt="HansePay" style="display:block;width:30px;height:30px;object-fit:contain;"></td>
          <td valign="middle" style="font-family:${SERIF};font-size:22px;font-weight:400;color:#ffffff;letter-spacing:.01em;">HansePay</td>
        </tr></table>
      </td>
      <td align="right" valign="middle"><span style="display:inline-block;background:rgba(141,189,230,.16);color:${BRAND.n200};font-size:10px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;padding:6px 13px;border-radius:100px;">${esc(t.badge)}</span></td>
    </tr></table>
  </td></tr>

  <!-- Accent rule -->
  <tr><td style="height:3px;background:${BRAND.blue2};line-height:3px;font-size:0;">&nbsp;</td></tr>

  <!-- Body -->
  <tr><td style="padding:36px 36px 8px;">
    <p style="margin:0 0 14px;font-size:16px;color:${BRAND.ink};">${esc(t.hi(name))}</p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${BRAND.ink2};">${esc(t.intro)}</p>

    <!-- Appointment card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7fafd;border:1px solid ${BRAND.line};border-radius:12px;margin:0 0 24px;">
      <tr><td style="padding:22px 24px;">
        <table role="presentation" width="100%">
          <tr>
            <td style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${BRAND.ink3};padding-bottom:4px;">${esc(t.when)}</td>
          </tr>
          <tr><td style="font-size:18px;font-weight:700;color:${BRAND.navy};padding-bottom:2px;">${esc(when.datePart)}</td></tr>
          <tr><td style="font-size:15px;color:${BRAND.blue};padding-bottom:16px;">${esc(when.timePart)} ${esc(tzLabel)} · ${esc(t.duration)}</td></tr>
          <tr><td style="border-top:1px solid ${BRAND.line};padding-top:14px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${BRAND.ink3};padding-bottom:4px;">${esc(t.where)}</td></tr>
          <tr><td style="font-size:14px;color:${BRAND.ink2};">${esc(t.meet)}</td></tr>
        </table>
      </td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;"><tr><td align="center">
      ${meetLink ? `<a href="${esc(meetLink)}" style="display:inline-block;background:${BRAND.blue};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 30px;border-radius:100px;margin:0 5px 8px;">${esc(t.joinBtn)} →</a>` : ''}
      ${addCalUrl ? `<a href="${esc(addCalUrl)}" style="display:inline-block;background:#ffffff;color:${BRAND.blue};font-size:15px;font-weight:600;text-decoration:none;padding:13px 28px;border-radius:100px;border:1.5px solid ${BRAND.blue};margin:0 5px 8px;">${esc(t.addCal)}</a>` : ''}
    </td></tr></table>

    <p style="margin:0 0 28px;font-size:13px;line-height:1.6;color:${BRAND.ink3};text-align:center;">${esc(t.calNote)}</p>

    <!-- What to expect -->
    <h2 style="margin:0 0 12px;font-size:15px;font-weight:700;color:${BRAND.navy};">${esc(t.expectTitle)}</h2>
    <table role="presentation" width="100%" style="margin:0 0 24px;">
      ${t.expect.map(item => `<tr>
        <td valign="top" style="width:22px;padding:3px 0;color:${BRAND.blue2};font-size:15px;">●</td>
        <td style="font-size:14px;line-height:1.55;color:${BRAND.ink2};padding:3px 0;">${esc(item)}</td>
      </tr>`).join('')}
    </table>

    <!-- Prep -->
    <table role="presentation" width="100%" style="background:#f1f7fc;border-left:3px solid ${BRAND.blue2};border-radius:6px;margin:0 0 24px;">
      <tr><td style="padding:16px 18px;">
        <div style="font-size:13px;font-weight:700;color:${BRAND.navy};margin-bottom:5px;">${esc(t.prepTitle)}</div>
        <div style="font-size:14px;line-height:1.55;color:${BRAND.ink2};">${esc(t.prep)}</div>
      </td></tr>
    </table>

    <!-- Details -->
    <h2 style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:${BRAND.ink3};">${esc(t.detailsTitle)}</h2>
    <table role="presentation" width="100%" style="margin:0 0 22px;font-size:14px;">
      ${detailRows.map(r => `<tr>
        <td style="padding:6px 0;color:${BRAND.ink3};width:42%;">${esc(r[0])}</td>
        <td style="padding:6px 0;color:${BRAND.ink};font-weight:500;">${esc(r[1])}</td>
      </tr>`).join('')}
    </table>

    <p style="margin:0 0 22px;font-size:13px;line-height:1.6;color:${BRAND.ink3};">${esc(t.reschedule)}</p>

    <p style="margin:0 0 2px;font-size:15px;color:${BRAND.ink2};">${esc(t.signoff)}</p>
    <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:${BRAND.navy};">${esc(t.team)}</p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:${BRAND.navy};padding:24px 36px;">
    <table role="presentation" width="100%"><tr>
      <td valign="middle"><table role="presentation"><tr>
        <td valign="middle" style="padding-right:8px;"><img src="${LOGO_WHITE}" width="22" height="22" alt="" style="display:block;width:22px;height:22px;object-fit:contain;"></td>
        <td valign="middle" style="font-family:${SERIF};font-size:16px;font-weight:400;color:#ffffff;">HansePay</td>
      </tr></table></td>
      <td align="right" valign="middle" style="font-size:12px;color:rgba(255,255,255,.45);">${esc(t.footerTagline)}</td>
    </tr></table>
    <p style="margin:14px 0 0;font-size:11px;color:rgba(255,255,255,.35);line-height:1.5;">© ${new Date().getFullYear()} HansePay GmbH · Hamburg, Germany<br>hansepay.de</p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;

  return {
    to: lead.email,
    subject: t.subject(when.datePart),
    html,
    text: htmlToText(html),
  };
}

module.exports = { sendMail, renderBookingEmail, gmailConfigured };
