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
  off:   '#f5f1ea',   // warm cream — matches booking confirmation reference
  line:  '#e6ebf0',
};

// Public base URL for email assets (logo). Overridable in Railway.
const PUBLIC_BASE = (process.env.PUBLIC_BASE_URL || 'https://hansepay-deploy-production-328c.up.railway.app').replace(/\/$/, '');
// White mark on transparent background — renders correctly on the dark header/footer.
const LOGO_URL = PUBLIC_BASE + '/assets/hansepay-mark-uploaded-white.png';
// Brand wordmark font stack — matches the site (Libre Baskerville, weight 400)
const SERIF = "'Libre Baskerville',Georgia,'Times New Roman',serif";

// Plain <img> tag for the white logo — matches the reference booking confirmation email exactly.
function logoPill(size) {
  size = size || 30;
  return `<img src="${LOGO_URL}" width="${size}" height="${size}" alt="HansePay" style="display:block;width:${size}px;height:${size}px;object-fit:contain;" border="0">`;
}

// Shared <head> block for all email templates.
// The @media (prefers-color-scheme: dark) block re-asserts white text so Apple
// Mail dark mode cannot override header/footer wordmark colour.
// Logo is a CSS background-image (not <img>) so it is immune to Apple Mail's
// dark-mode inversion algorithm regardless of this block.
function emailHead(lang, title) {
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${esc(title)}</title>
<style>
  @media (prefers-color-scheme: dark) {
    .hp-header { background: #0B1929 !important; }
    .hp-footer { background: #0B1929 !important; }
    .hp-hdr-txt, .hp-ftr-txt { color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; }
  }
</style>`;
}

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
    subject:     (d, r) => r ? `Your HansePay call has been rescheduled — ${d}` : `Your HansePay call is confirmed — ${d}`,
    preheader:   (r) => r ? 'Your call has been rescheduled. Here are your new details.' : 'Your discovery call is booked. Here are the details.',
    badge:       (r) => r ? 'Rescheduled' : 'Booking confirmed',
    hi:          (n) => `Hi ${n},`,
    intro:       (r) => r
      ? 'Your HansePay discovery call has been rescheduled. Here are your updated details — the new Google Meet link is attached.'
      : 'Thanks for booking a call with HansePay. Your 30-minute discovery call is confirmed — we\'re looking forward to learning about your FX needs.',
    when: 'When', duration: '30 minutes', where: 'Where',
    meet:        'Google Meet — link below and in your calendar invite',
    joinBtn:     'Join the Google Meet',
    addCal:      'Add to calendar',
    calNote:     'Add the call to your calendar so you don\'t miss it — the Google Meet link is included.',
    expectTitle: 'What to expect',
    expect: [
      'A relaxed, no-pressure conversation — not a hard sell.',
      'A few questions about your current cross-border payment flows.',
      'A clear view of where HansePay could save you time and money.',
    ],
    prepTitle:   'To make the most of it',
    prep:        'Have a rough idea of your monthly FX volume and the currency pairs you use most. That\'s all — we\'ll handle the rest.',
    reschedule:  'Need a different time?',
    rebookBtn:   'Reschedule this call →',
    rescheduleText: 'Or reply to this email and we\'ll sort it manually.',
    signoff:     'See you soon,',
    team:        'The HansePay Team',
    footerTagline: 'EU-regulated cross-border payments · Hamburg',
    detailsTitle: 'Your details',
  },
  de: {
    subject:     (d, r) => r ? `Ihr HansePay-Termin wurde verschoben — ${d}` : `Ihr HansePay-Termin ist bestätigt — ${d}`,
    preheader:   (r) => r ? 'Ihr Termin wurde verschoben. Hier die neuen Details.' : 'Ihr Kennenlerngespräch ist gebucht. Hier die Details.',
    badge:       (r) => r ? 'Umgebucht' : 'Termin bestätigt',
    hi:          (n) => `Hallo ${n},`,
    intro:       (r) => r
      ? 'Ihr HansePay-Kennenlerngespräch wurde erfolgreich verschoben. Hier sind Ihre neuen Termindetails — ein neuer Google-Meet-Link ist beigefügt.'
      : 'Vielen Dank für Ihre Buchung bei HansePay. Ihr 30-minütiges Kennenlerngespräch ist bestätigt — wir freuen uns darauf, mehr über Ihre FX-Anforderungen zu erfahren.',
    when: 'Wann', duration: '30 Minuten', where: 'Wo',
    meet:        'Google Meet — Link unten und in Ihrer Kalendereinladung',
    joinBtn:     'Google Meet beitreten',
    addCal:      'Zum Kalender hinzufügen',
    calNote:     'Fügen Sie den Termin Ihrem Kalender hinzu, damit Sie ihn nicht verpassen — der Google-Meet-Link ist enthalten.',
    expectTitle: 'Was Sie erwartet',
    expect: [
      'Ein entspanntes Gespräch auf Augenhöhe — kein Verkaufsdruck.',
      'Ein paar Fragen zu Ihren aktuellen grenzüberschreitenden Zahlungsabläufen.',
      'Ein klares Bild, wo HansePay Ihnen Zeit und Geld sparen kann.',
    ],
    prepTitle:   'Damit es sich lohnt',
    prep:        'Halten Sie eine grobe Vorstellung Ihres monatlichen FX-Volumens und der wichtigsten Währungspaare bereit. Mehr braucht es nicht — um den Rest kümmern wir uns.',
    reschedule:  'Anderen Termin benötigt?',
    rebookBtn:   'Termin verschieben →',
    rescheduleText: 'Oder antworten Sie auf diese E-Mail und wir regeln es manuell.',
    signoff:     'Bis bald,',
    team:        'Ihr HansePay-Team',
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
  const isRebook = !!booking.isRebook;
  const when = formatWhen(booking.slot.startISO, lang);
  const name = esc(lead.firstName || (lang === 'de' ? 'dort' : 'there'));
  const meetLink = booking.meetLink || booking.calendarUrl || null;
  const addCalUrl = gcalLink(booking);
  const rebookUrl = booking.rebookUrl || null;
  const tzLabel = lang === 'de' ? '(Hamburger Zeit)' : '(Berlin time)';

  const detailRows = [
    [lang === 'de' ? 'Name' : 'Name', `${lead.firstName || ''} ${lead.lastName || ''}`.trim()],
    ['E-Mail', lead.email || ''],
    [lang === 'de' ? 'Unternehmen' : 'Company', lead.company || '—'],
    [lang === 'de' ? 'Branche' : 'Industry', lead.industry || '—'],
    [lang === 'de' ? 'Monatl. FX-Volumen' : 'Monthly FX volume', lead.fxVolume || '—'],
  ].filter(r => r[1]);

  const html = `<!DOCTYPE html>
<html lang="${lang}"><head>${emailHead(lang, esc(t.subject(when.datePart, isRebook)))}</head>
<body style="margin:0;padding:0;background:${BRAND.off};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.ink};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(t.preheader(isRebook))}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.off};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 28px rgba(11,25,41,.10);">

  <!-- Header — gradient -->
  <tr><td bgcolor="#0B1929" class="hp-header" style="background:#0B1929;background:linear-gradient(135deg,#060D1A 0%,#0F2540 55%,#163659 100%);padding:28px 36px;">
    <table role="presentation" width="100%"><tr>
      <td valign="middle">
        <table role="presentation"><tr>
          <td valign="middle" style="padding-right:10px;">${logoPill(36)}</td>
          <td valign="middle" color="#ffffff" class="hp-hdr-txt" style="font-family:${SERIF};font-size:22px;font-weight:400;color:#ffffff;letter-spacing:.01em;">HansePay</td>
        </tr></table>
      </td>
      <td align="right" valign="middle"><span style="display:inline-block;background:rgba(141,189,230,.18);color:${BRAND.n200};font-size:10px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;padding:6px 13px;border-radius:100px;">${esc(t.badge(isRebook))}</span></td>
    </tr></table>
  </td></tr>

  <!-- Accent rule — gradient -->
  <tr><td style="height:3px;background:${BRAND.blue};background:linear-gradient(90deg,${BRAND.blue2},${BRAND.n200});line-height:3px;font-size:0;">&nbsp;</td></tr>

  <!-- Body -->
  <tr><td style="padding:36px 36px 8px;">
    <p style="margin:0 0 16px;font-size:16px;color:${BRAND.ink};">${esc(t.hi(name))}</p>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:${BRAND.ink2};">${esc(t.intro(isRebook))}</p>

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

    <p style="margin:0 0 20px;font-size:13px;line-height:1.6;color:${BRAND.ink3};text-align:center;">${esc(t.calNote)}</p>

    ${rebookUrl ? `<!-- Reschedule link -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;"><tr><td align="center">
      <p style="margin:0 0 7px;font-size:12px;color:${BRAND.ink3};">${esc(t.reschedule)}</p>
      <a href="${esc(rebookUrl)}" style="font-family:${SERIF};font-style:italic;font-size:14px;color:${BRAND.blue};text-decoration:none;border-bottom:1px solid rgba(46,107,173,.35);padding-bottom:1px;">${esc(t.rebookBtn)}</a>
    </td></tr></table>` : ''}

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

    <p style="margin:0 0 22px;font-size:13px;line-height:1.6;color:${BRAND.ink3};">${esc(t.rescheduleText)}</p>

    <p style="margin:0 0 2px;font-size:15px;color:${BRAND.ink2};">${esc(t.signoff)}</p>
    <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:${BRAND.navy};">${esc(t.team)}</p>
  </td></tr>

  <!-- Footer -->
  <tr><td bgcolor="#0B1929" class="hp-footer" style="background:${BRAND.navy};padding:24px 36px;">
    <table role="presentation" width="100%"><tr>
      <td valign="middle"><table role="presentation"><tr>
        <td valign="middle" style="padding-right:8px;">${logoPill(28)}</td>
        <td valign="middle" color="#ffffff" style="font-family:${SERIF};font-size:16px;font-weight:400;color:#ffffff;" class="hp-ftr-txt">HansePay</td>
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
    subject: t.subject(when.datePart, isRebook),
    html,
    text: htmlToText(html),
  };
}

// ─── Registration confirmation template ──────────────────────────────────────

const REG_COPY = {
  en: {
    subject:   (ref) => `Application received — ${ref}`,
    preheader: 'Your HansePay application is under review. We\'ll be in touch shortly.',
    badge:     'Application received',
    hi:        (n) => `Hi ${n},`,
    intro:     'Thank you for applying to HansePay. We\'ve received your application and our compliance team will review it shortly. You\'ll hear back from us within 1–2 business days.',
    refLabel:  'Application reference',
    nextTitle: 'What happens next',
    next: [
      'Our compliance team will review your documents and details.',
      'We may reach out by email if we need anything additional.',
      'Once approved, you\'ll receive your login credentials and can start using the platform.',
    ],
    questions: 'Questions? Reply to this email or reach us at',
    signoff:   'Best regards,',
    team:      'The HansePay Team',
    footerTagline: 'EU-regulated cross-border payments · Hamburg',
  },
  de: {
    subject:   (ref) => `Antrag eingegangen — ${ref}`,
    preheader: 'Ihr HansePay-Antrag wird geprüft. Wir melden uns in Kürze.',
    badge:     'Antrag eingegangen',
    hi:        (n) => `Hallo ${n},`,
    intro:     'Vielen Dank für Ihren Antrag bei HansePay. Wir haben Ihre Unterlagen erhalten und unser Compliance-Team wird diese in Kürze prüfen. Sie erhalten innerhalb von 1–2 Werktagen eine Rückmeldung.',
    refLabel:  'Antragsnummer',
    nextTitle: 'Wie geht es weiter',
    next: [
      'Unser Compliance-Team prüft Ihre Dokumente und Angaben.',
      'Wir melden uns per E-Mail, falls wir noch Informationen benötigen.',
      'Nach Freigabe erhalten Sie Ihre Zugangsdaten und können die Plattform nutzen.',
    ],
    questions: 'Fragen? Antworten Sie auf diese E-Mail oder schreiben Sie uns an',
    signoff:   'Mit freundlichen Grüßen,',
    team:      'Ihr HansePay-Team',
    footerTagline: 'EU-regulierte grenzüberschreitende Zahlungen · Hamburg',
  },
};

/**
 * Build the registration confirmation email.
 * reg = { firstName, lastName, email, company, accountType, applicationRef, lang }
 * Returns { to, subject, html, text }
 */
function renderRegistrationEmail(reg) {
  const lang = (reg.lang === 'de') ? 'de' : 'en';
  const t = REG_COPY[lang];
  const ref  = esc(reg.applicationRef || '—');
  const name = esc(reg.firstName || (lang === 'de' ? 'dort' : 'there'));
  const isDE = lang === 'de';
  const supportEmail = process.env.EMAIL_REPLY_TO || process.env.CALENDAR_OWNER_EMAIL || 'hello@hansepay.de';

  const detailRows = [
    [isDE ? 'Name' : 'Name',            `${reg.firstName || ''} ${reg.lastName || ''}`.trim()],
    [isDE ? 'E-Mail' : 'Email',         reg.email || ''],
    [isDE ? 'Unternehmen' : 'Company',  reg.company || '—'],
    [isDE ? 'Kontotyp' : 'Account type', reg.accountType === 'individual' ? (isDE ? 'Privatperson' : 'Individual') : (isDE ? 'Unternehmen' : 'Business')],
  ].filter(r => r[1]);

  // Timeline steps — title + short descriptor, first is active (current stage)
  const steps = isDE ? [
    { title: 'Compliance-Prüfung',    desc: 'Unser Team prüft Ihre Dokumente und Angaben.', active: true },
    { title: 'Eventuelle Rückfragen', desc: 'Wir melden uns, falls wir noch etwas benötigen.' },
    { title: 'Kontoaktivierung',      desc: 'Sie erhalten Ihre Zugangsdaten nach Freigabe.' },
  ] : [
    { title: 'Compliance review',          desc: 'Our team reviews your documents and details.', active: true },
    { title: 'Additional info if needed',  desc: 'We\'ll reach out by email if we need anything extra.' },
    { title: 'Account activated',          desc: 'You\'ll receive your login credentials once approved.' },
  ];

  const nowBadge = `<span style="display:inline-block;background:rgba(30,78,128,.12);color:${BRAND.blue};font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:2px 8px;border-radius:100px;vertical-align:middle;margin-left:7px;">${isDE ? 'Jetzt' : 'Now'}</span>`;
  const underReview = isDE ? 'In Prüfung' : 'Under review';

  const timelineRows = steps.map((step, i) => {
    const isLast = i === steps.length - 1;
    const circleBg = step.active ? BRAND.blue : '#e2e8f0';
    const circleColor = step.active ? '#ffffff' : BRAND.ink3;
    const connectorBg = step.active ? BRAND.blue2 : '#e2e8f0';
    return `
    <tr>
      <td valign="top" width="36" style="padding-right:4px;">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td width="28" height="28" bgcolor="${circleBg}" style="background:${circleBg};border-radius:14px;text-align:center;vertical-align:middle;font-size:12px;font-weight:700;color:${circleColor};line-height:28px;">${i + 1}</td>
          </tr>
          ${!isLast ? `<tr><td align="center" style="padding:2px 0;"><table role="presentation" cellpadding="0" cellspacing="0" style="width:2px;margin:0 auto;"><tr><td height="22" bgcolor="${connectorBg}" style="background:${connectorBg};font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>` : ''}
        </table>
      </td>
      <td valign="top" style="padding:2px 0 ${isLast ? '0' : '16'}px 10px;">
        <div style="font-size:14px;font-weight:600;color:${step.active ? BRAND.navy : BRAND.ink2};">${esc(step.title)}${step.active ? nowBadge : ''}</div>
        <div style="font-size:12.5px;color:${BRAND.ink3};line-height:1.5;margin-top:3px;">${esc(step.desc)}</div>
      </td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="${lang}"><head>${emailHead(lang, esc(t.subject(ref)))}</head>
<body style="margin:0;padding:0;background:${BRAND.off};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.ink};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(t.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.off};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 28px rgba(11,25,41,.10);">

  <!-- Header -->
  <tr><td bgcolor="#0B1929" class="hp-header" style="background:#0B1929;background:linear-gradient(135deg,#060D1A 0%,#0F2540 55%,#163659 100%);padding:28px 36px;">
    <table role="presentation" width="100%"><tr>
      <td valign="middle">
        <table role="presentation"><tr>
          <td valign="middle" style="padding-right:10px;">${logoPill(36)}</td>
          <td valign="middle" color="#ffffff" class="hp-hdr-txt" style="font-family:${SERIF};font-size:22px;font-weight:400;color:#ffffff;letter-spacing:.01em;">HansePay</td>
        </tr></table>
      </td>
      <td align="right" valign="middle"><span style="display:inline-block;background:rgba(141,189,230,.18);color:${BRAND.n200};font-size:10px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;padding:6px 13px;border-radius:100px;">${esc(t.badge)}</span></td>
    </tr></table>
  </td></tr>
  <tr><td style="height:3px;background:${BRAND.blue};background:linear-gradient(90deg,${BRAND.blue2},${BRAND.n200});line-height:3px;font-size:0;">&nbsp;</td></tr>

  <!-- Confirmation hero strip -->
  <tr><td bgcolor="#f0f7ff" style="background:#f0f7ff;padding:30px 36px 26px;text-align:center;border-bottom:1px solid #dbeafe;">
    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 14px;">
      <tr>
        <td width="50" height="50" bgcolor="${BRAND.blue}" style="background:${BRAND.blue};border-radius:25px;text-align:center;vertical-align:middle;font-size:24px;font-weight:700;color:#fff;line-height:50px;">&#10003;</td>
      </tr>
    </table>
    <div style="font-size:20px;font-weight:700;color:${BRAND.navy};letter-spacing:-.01em;margin-bottom:10px;">${isDE ? 'Antrag eingegangen' : 'Application received'}</div>
    <table role="presentation" cellpadding="0" cellspacing="0" align="center">
      <tr>
        <td bgcolor="#dbeafe" style="background:#dbeafe;border-radius:100px;padding:5px 15px;">
          <span style="font-size:13px;font-weight:700;color:${BRAND.blue};letter-spacing:.05em;">${ref}</span>
        </td>
        <td style="padding-left:10px;font-size:13px;color:${BRAND.ink3};vertical-align:middle;">&middot;&nbsp;${esc(underReview)}</td>
      </tr>
    </table>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:32px 36px 8px;">
    <p style="margin:0 0 12px;font-size:16px;color:${BRAND.ink};">${esc(t.hi(name))}</p>
    <p style="margin:0 0 28px;font-size:14.5px;line-height:1.65;color:${BRAND.ink2};">${esc(t.intro)}</p>

    <!-- Timeline -->
    <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${BRAND.ink3};margin-bottom:16px;">${esc(t.nextTitle)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      ${timelineRows}
    </table>

    <!-- Details card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7fafd;border-radius:12px;margin:0 0 26px;">
      <tr><td style="padding:18px 22px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${BRAND.ink3};margin-bottom:12px;">${isDE ? 'Ihre Angaben' : 'Your application'}</div>
        <table role="presentation" width="100%" style="font-size:13.5px;">
          ${detailRows.map((r, i) => `<tr>
            <td style="padding:6px 0;color:${BRAND.ink3};width:42%;${i > 0 ? 'border-top:1px solid ' + BRAND.line + ';' : ''}">${esc(r[0])}</td>
            <td style="padding:6px 0;color:${BRAND.ink};font-weight:500;${i > 0 ? 'border-top:1px solid ' + BRAND.line + ';' : ''}">${esc(r[1])}</td>
          </tr>`).join('')}
        </table>
      </td></tr>
    </table>

    <p style="margin:0 0 24px;font-size:13.5px;line-height:1.6;color:${BRAND.ink3};">${esc(t.questions)} <a href="mailto:${esc(supportEmail)}" style="color:${BRAND.blue2};text-decoration:none;">${esc(supportEmail)}</a></p>

    <p style="margin:0 0 2px;font-size:15px;color:${BRAND.ink2};">${esc(t.signoff)}</p>
    <p style="margin:0 0 36px;font-size:15px;font-weight:700;color:${BRAND.navy};">${esc(t.team)}</p>
  </td></tr>

  <!-- Footer -->
  <tr><td bgcolor="#0B1929" class="hp-footer" style="background:${BRAND.navy};padding:24px 36px;">
    <table role="presentation" width="100%"><tr>
      <td valign="middle"><table role="presentation"><tr>
        <td valign="middle" style="padding-right:8px;">${logoPill(28)}</td>
        <td valign="middle" color="#ffffff" style="font-family:${SERIF};font-size:16px;font-weight:400;color:#ffffff;" class="hp-ftr-txt">HansePay</td>
      </tr></table></td>
      <td align="right" valign="middle" style="font-size:12px;color:rgba(255,255,255,.45);">${esc(t.footerTagline)}</td>
    </tr></table>
    <p style="margin:14px 0 0;font-size:11px;color:rgba(255,255,255,.35);line-height:1.5;">© ${new Date().getFullYear()} HansePay GmbH · Hamburg, Germany<br>hansepay.de</p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;

  return {
    to:      reg.email,
    subject: t.subject(ref),
    html,
    text: htmlToText(html),
  };
}

// ─── Email verification OTP template ─────────────────────────────────────────

/**
 * renderOtpEmail({ firstName, email, code, lang })
 * Returns { to, subject, html, text }
 */
function renderOtpEmail({ firstName, email, code, lang, verifyUrl }) {
  const isDE = lang === 'de';
  const name = esc(firstName || (isDE ? 'dort' : 'there'));
  const codeStr = esc(String(code));
  const supportEmail = process.env.EMAIL_REPLY_TO || process.env.CALENDAR_OWNER_EMAIL || 'hello@hansepay.de';

  const subject   = isDE ? 'Ihr HansePay Bestätigungscode' : 'Your HansePay verification code';
  const preheader = isDE ? `Ihr Bestätigungscode lautet: ${code}` : `Your verification code is: ${code}`;
  const hi        = isDE ? `Hallo ${name},` : `Hi ${name},`;
  const intro     = isDE
    ? 'Klicken Sie auf den Button, um Ihre E-Mail-Adresse sofort zu bestätigen — oder geben Sie den 6-stelligen Code manuell ein.'
    : 'Click the button to verify your email instantly — or enter the 6-digit code manually.';
  const btnLabel  = isDE ? 'E-Mail-Adresse bestätigen →' : 'Verify email address →';
  const orLabel   = isDE ? 'Oder geben Sie diesen Code ein:' : 'Or enter this code manually:';
  const label     = isDE ? 'Ihr Bestätigungscode' : 'Your verification code';
  const ignore    = isDE
    ? 'Falls Sie diesen Code nicht angefordert haben, können Sie diese E-Mail ignorieren.'
    : 'If you didn\'t request this code, you can safely ignore this email.';
  const questions = isDE ? 'Fragen? Schreiben Sie uns an' : 'Questions? Reach us at';
  const signoff   = isDE ? 'Mit freundlichen Grüßen,' : 'Best,';
  const team      = isDE ? 'Ihr HansePay-Team' : 'The HansePay Team';
  const footer    = isDE ? 'EU-regulierte grenzüberschreitende Zahlungen · Hamburg' : 'EU-regulated cross-border payments · Hamburg';

  const html = `<!DOCTYPE html>
<html lang="${isDE ? 'de' : 'en'}"><head>${emailHead(isDE ? 'de' : 'en', esc(subject))}</head>
<body style="margin:0;padding:0;background:${BRAND.off};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.ink};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.off};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 28px rgba(11,25,41,.10);">

  <!-- Header -->
  <tr><td bgcolor="#0B1929" class="hp-header" style="background:#0B1929;background:linear-gradient(135deg,#060D1A 0%,#0F2540 55%,#163659 100%);padding:24px 32px;">
    <table role="presentation" width="100%"><tr>
      <td valign="middle">
        <table role="presentation"><tr>
          <td valign="middle" style="padding-right:10px;">${logoPill(34)}</td>
          <td valign="middle" color="#ffffff" class="hp-hdr-txt" style="font-family:${SERIF};font-size:20px;font-weight:400;color:#ffffff;letter-spacing:.01em;">HansePay</td>
        </tr></table>
      </td>
      <td align="right" valign="middle"><span style="display:inline-block;background:rgba(141,189,230,.18);color:${BRAND.n200};font-size:10px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;padding:6px 13px;border-radius:100px;">${isDE ? 'E-Mail bestätigen' : 'Verify email'}</span></td>
    </tr></table>
  </td></tr>
  <tr><td style="height:3px;background:linear-gradient(90deg,${BRAND.blue2},${BRAND.n200});line-height:3px;font-size:0;">&nbsp;</td></tr>

  <!-- Body -->
  <tr><td style="padding:36px 32px 28px;">
    <p style="margin:0 0 18px;font-size:16px;color:${BRAND.ink};">${esc(hi)}</p>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:${BRAND.ink2};">${esc(intro)}</p>

    <!-- Verify button -->
    ${verifyUrl ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr><td align="center">
      <a href="${esc(verifyUrl)}" style="display:inline-block;background:${BRAND.navy};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:100px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${esc(btnLabel)}</a>
    </td></tr></table>
    <p style="margin:0 0 20px;font-size:13px;color:${BRAND.ink3};text-align:center;">${esc(orLabel)}</p>` : ''}

    <!-- Code card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" style="background:#f7fafd;border:1px solid ${BRAND.line};border-radius:14px;padding:24px 40px;text-align:center;">
        <tr><td style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${BRAND.ink3};padding-bottom:10px;">${esc(label)}</td></tr>
        <tr><td>
          <div style="font-size:42px;font-weight:800;letter-spacing:12px;color:${BRAND.navy};font-family:${SERIF};line-height:1;">${codeStr}</div>
        </td></tr>
      </table>
    </td></tr></table>

    <p style="margin:0 0 20px;font-size:13px;line-height:1.55;color:${BRAND.ink3};text-align:center;">${esc(ignore)}</p>
    <p style="margin:0 0 24px;font-size:13.5px;line-height:1.6;color:${BRAND.ink3};">${esc(questions)} <a href="mailto:${esc(supportEmail)}" style="color:${BRAND.blue2};text-decoration:none;">${esc(supportEmail)}</a></p>

    <p style="margin:0 0 2px;font-size:15px;color:${BRAND.ink2};">${esc(signoff)}</p>
    <p style="margin:0;font-size:15px;font-weight:700;color:${BRAND.navy};">${esc(team)}</p>
  </td></tr>

  <!-- Footer -->
  <tr><td bgcolor="#0B1929" class="hp-footer" style="background:${BRAND.navy};padding:20px 32px;">
    <table role="presentation" width="100%"><tr>
      <td valign="middle"><table role="presentation"><tr>
        <td valign="middle" style="padding-right:8px;">${logoPill(26)}</td>
        <td valign="middle" color="#ffffff" style="font-family:${SERIF};font-size:15px;font-weight:400;color:#ffffff;" class="hp-ftr-txt">HansePay</td>
      </tr></table></td>
      <td align="right" valign="middle" style="font-size:11px;color:rgba(255,255,255,.45);">${esc(footer)}</td>
    </tr></table>
    <p style="margin:12px 0 0;font-size:11px;color:rgba(255,255,255,.35);line-height:1.5;">© ${new Date().getFullYear()} HansePay GmbH · Hamburg, Germany</p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;

  return { to: email, subject, html, text: htmlToText(html) };
}

// ─── Application approval email ──────────────────────────────────────────────

const APPROVAL_COPY = {
  en: {
    subject:   (company) => `Your HansePay account has been approved — ${company}`,
    preheader: 'Your application has been reviewed and approved. Welcome to HansePay.',
    badge:     'Account approved',
    hi:        (n) => `Hi ${n},`,
    intro:     'Great news! Your HansePay application has been reviewed by our compliance team and your account has been approved. You can now start using the platform.',
    nextTitle: 'Next steps',
    next: [
      'Log in to your HansePay account using the link below.',
      'Complete your account setup and add your preferred payment methods.',
      'Start sending and receiving cross-border payments.',
    ],
    loginBtn:  'Access your account →',
    questions: 'Questions? Reply to this email or reach us at',
    signoff:   'Welcome aboard,',
    team:      'The HansePay Team',
    footerTagline: 'EU-regulated cross-border payments · Hamburg',
    refLabel:  'Application reference',
  },
  de: {
    subject:   (company) => `Ihr HansePay-Konto wurde genehmigt — ${company}`,
    preheader: 'Ihr Antrag wurde geprüft und genehmigt. Willkommen bei HansePay.',
    badge:     'Konto genehmigt',
    hi:        (n) => `Hallo ${n},`,
    intro:     'Gute Neuigkeiten! Ihr HansePay-Antrag wurde von unserem Compliance-Team geprüft und Ihr Konto wurde genehmigt. Sie können die Plattform jetzt nutzen.',
    nextTitle: 'Nächste Schritte',
    next: [
      'Melden Sie sich über den unten stehenden Link bei Ihrem HansePay-Konto an.',
      'Schließen Sie die Kontoeinrichtung ab und fügen Sie Ihre bevorzugten Zahlungsmethoden hinzu.',
      'Beginnen Sie mit dem Senden und Empfangen von grenzüberschreitenden Zahlungen.',
    ],
    loginBtn:  'Zum Konto →',
    questions: 'Fragen? Antworten Sie auf diese E-Mail oder schreiben Sie uns an',
    signoff:   'Herzlich willkommen,',
    team:      'Ihr HansePay-Team',
    footerTagline: 'EU-regulierte grenzüberschreitende Zahlungen · Hamburg',
    refLabel:  'Antragsnummer',
  },
};

/**
 * renderApprovalEmail({ firstName, lastName, email, company, applicationRef, lang, loginUrl })
 * Returns { to, subject, html, text }
 */
function renderApprovalEmail({ firstName, lastName, email, company, applicationRef, lang, loginUrl }) {
  const l = (lang === 'de') ? 'de' : 'en';
  const isDE = l === 'de';
  const t = APPROVAL_COPY[l];
  const ref  = esc(applicationRef || '—');
  const name = esc(firstName || (isDE ? 'dort' : 'there'));
  const co   = esc(company || `${firstName || ''} ${lastName || ''}`.trim() || email);
  const supportEmail = process.env.EMAIL_REPLY_TO || process.env.CALENDAR_OWNER_EMAIL || 'hello@hansepay.de';
  const siteBase = (process.env.PUBLIC_BASE_URL || 'https://www.hansepay.de').replace(/\/$/, '');
  const url = loginUrl || (siteBase + '/hansepay/dashboard-login.html');

  const steps = isDE ? [
    { title: 'Anmelden',                desc: 'Melden Sie sich mit dem untenstehenden Link an.' },
    { title: 'Konto einrichten',        desc: 'Fügen Sie Ihre bevorzugten Zahlungsmethoden hinzu.' },
    { title: 'Zahlungen starten',       desc: 'Senden und empfangen Sie grenzüberschreitende Zahlungen.' },
  ] : [
    { title: 'Log in to your account', desc: 'Use the button above to access your new account.' },
    { title: 'Complete your setup',    desc: 'Add your preferred payment methods and team members.' },
    { title: 'Start making payments',  desc: 'Send and receive cross-border payments right away.' },
  ];

  const timelineRows = steps.map((step, i) => {
    const isLast = i === steps.length - 1;
    return `
    <tr>
      <td valign="top" width="36" style="padding-right:4px;">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td width="28" height="28" bgcolor="#16a34a" style="background:#16a34a;border-radius:14px;text-align:center;vertical-align:middle;font-size:12px;font-weight:700;color:#ffffff;line-height:28px;">${i + 1}</td>
          </tr>
          ${!isLast ? `<tr><td align="center" style="padding:2px 0;"><table role="presentation" cellpadding="0" cellspacing="0" style="width:2px;margin:0 auto;"><tr><td height="22" bgcolor="#bbf7d0" style="background:#bbf7d0;font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>` : ''}
        </table>
      </td>
      <td valign="top" style="padding:2px 0 ${isLast ? '0' : '16'}px 10px;">
        <div style="font-size:14px;font-weight:600;color:${BRAND.navy};">${esc(step.title)}</div>
        <div style="font-size:12.5px;color:${BRAND.ink3};line-height:1.5;margin-top:3px;">${esc(step.desc)}</div>
      </td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="${l}"><head>${emailHead(l, esc(t.subject(co)))}</head>
<body style="margin:0;padding:0;background:${BRAND.off};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.ink};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(t.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.off};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 28px rgba(11,25,41,.10);">

  <!-- Header -->
  <tr><td bgcolor="#0B1929" class="hp-header" style="background:#0B1929;background:linear-gradient(135deg,#060D1A 0%,#0F2540 55%,#163659 100%);padding:28px 36px;">
    <table role="presentation" width="100%"><tr>
      <td valign="middle">
        <table role="presentation"><tr>
          <td valign="middle" style="padding-right:10px;">${logoPill(36)}</td>
          <td valign="middle" color="#ffffff" class="hp-hdr-txt" style="font-family:${SERIF};font-size:22px;font-weight:400;color:#ffffff;letter-spacing:.01em;">HansePay</td>
        </tr></table>
      </td>
      <td align="right" valign="middle"><span style="display:inline-block;background:rgba(34,197,94,.20);color:#4ade80;font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;padding:6px 13px;border-radius:100px;">${esc(t.badge)}</span></td>
    </tr></table>
  </td></tr>
  <tr><td style="height:3px;background:#16a34a;background:linear-gradient(90deg,#16a34a,#4ade80);line-height:3px;font-size:0;">&nbsp;</td></tr>

  <!-- Approval hero strip -->
  <tr><td bgcolor="#f0fdf4" style="background:#f0fdf4;padding:30px 36px 26px;text-align:center;border-bottom:1px solid #bbf7d0;">
    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 14px;">
      <tr>
        <td width="50" height="50" bgcolor="#16a34a" style="background:#16a34a;border-radius:25px;text-align:center;vertical-align:middle;font-size:24px;font-weight:700;color:#fff;line-height:50px;">&#10003;</td>
      </tr>
    </table>
    <div style="font-size:20px;font-weight:700;color:#14532d;letter-spacing:-.01em;margin-bottom:8px;">${isDE ? 'Konto genehmigt' : 'You\'re approved'}</div>
    <div style="font-size:14px;color:#166534;margin-bottom:12px;">${co}</div>
    <table role="presentation" cellpadding="0" cellspacing="0" align="center">
      <tr>
        <td bgcolor="#bbf7d0" style="background:#bbf7d0;border-radius:100px;padding:5px 15px;">
          <span style="font-size:13px;font-weight:700;color:#166534;letter-spacing:.05em;">${ref}</span>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:32px 36px 8px;">
    <p style="margin:0 0 12px;font-size:16px;color:${BRAND.ink};">${esc(t.hi(name))}</p>
    <p style="margin:0 0 28px;font-size:14.5px;line-height:1.65;color:${BRAND.ink2};">${esc(t.intro)}</p>

    <!-- CTA Button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;"><tr><td align="center">
      <a href="${esc(url)}" style="display:inline-block;background:#16a34a;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:15px 36px;border-radius:100px;">${esc(t.loginBtn)}</a>
    </td></tr></table>

    <!-- Next steps timeline -->
    <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${BRAND.ink3};margin-bottom:16px;">${esc(t.nextTitle)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      ${timelineRows}
    </table>

    <p style="margin:0 0 24px;font-size:13.5px;line-height:1.6;color:${BRAND.ink3};">${esc(t.questions)} <a href="mailto:${esc(supportEmail)}" style="color:${BRAND.blue2};text-decoration:none;">${esc(supportEmail)}</a></p>

    <p style="margin:0 0 2px;font-size:15px;color:${BRAND.ink2};">${esc(t.signoff)}</p>
    <p style="margin:0 0 36px;font-size:15px;font-weight:700;color:${BRAND.navy};">${esc(t.team)}</p>
  </td></tr>

  <!-- Footer -->
  <tr><td bgcolor="#0B1929" class="hp-footer" style="background:${BRAND.navy};padding:24px 36px;">
    <table role="presentation" width="100%"><tr>
      <td valign="middle"><table role="presentation"><tr>
        <td valign="middle" style="padding-right:8px;">${logoPill(28)}</td>
        <td valign="middle" color="#ffffff" style="font-family:${SERIF};font-size:16px;font-weight:400;color:#ffffff;" class="hp-ftr-txt">HansePay</td>
      </tr></table></td>
      <td align="right" valign="middle" style="font-size:12px;color:rgba(255,255,255,.45);">${esc(t.footerTagline)}</td>
    </tr></table>
    <p style="margin:14px 0 0;font-size:11px;color:rgba(255,255,255,.35);line-height:1.5;">© ${new Date().getFullYear()} HansePay GmbH · Hamburg, Germany<br>hansepay.de</p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;

  return { to: email, subject: t.subject(co), html, text: htmlToText(html) };
}

// ─── KYC identity verification invite email ───────────────────────────────────

/**
 * renderKycInviteEmail({ recipientName, recipientEmail, companyName, inviterName, kycUrl, lang })
 * Returns { to, subject, html, text }
 */
function renderKycInviteEmail({ recipientName, recipientEmail, companyName, inviterName, kycUrl, lang }) {
  const l = (lang === 'de') ? 'de' : 'en';
  const name = esc(recipientName || (l === 'de' ? 'dort' : 'there'));
  const co   = esc(companyName || 'your company');
  const inv  = esc(inviterName || 'The HansePay Team');
  const url  = kycUrl || '#';
  const supportEmail = process.env.EMAIL_REPLY_TO || process.env.CALENDAR_OWNER_EMAIL || 'hello@hansepay.de';

  const subject   = l === 'de'
    ? `Identitätsverifizierung erforderlich — ${companyName || 'HansePay'}`
    : `Identity verification required — ${companyName || 'HansePay'}`;
  const preheader = l === 'de'
    ? `${inviterName || 'HansePay'} hat Sie zur Identitätsverifizierung eingeladen.`
    : `${inviterName || 'HansePay'} has invited you to complete identity verification.`;
  const hi        = l === 'de' ? `Hallo ${name},` : `Hi ${name},`;
  const intro     = l === 'de'
    ? `${inv} hat Sie eingeladen, die Identitätsverifizierung für <b>${co}</b> abzuschließen. Dies ist ein regulatorisch erforderlicher Schritt, um Ihr Konto zu aktivieren.`
    : `${inv} has invited you to complete identity verification for <b>${co}</b>. This is a required regulatory step to activate your account.`;
  const whatTitle = l === 'de' ? 'Was passiert als nächstes' : 'What to expect';
  const steps = l === 'de'
    ? ['Klicken Sie unten auf den Button, um den gesicherten Verifizierungsprozess zu starten.', 'Halten Sie Ihren Personalausweis oder Reisepass bereit.', 'Der Prozess dauert in der Regel 3–5 Minuten.']
    : ['Click the button below to start the secure verification process.', 'Have your government-issued ID or passport ready.', 'The process typically takes 3–5 minutes.'];
  const btnLabel  = l === 'de' ? 'Identität verifizieren →' : 'Verify identity →';
  const note      = l === 'de'
    ? 'Dieser Link ist sicher und wird von unserem KYC-Partner Signicat bereitgestellt. Er ist für Sie persönlich — bitte nicht weitergeben.'
    : 'This link is secure and powered by our KYC partner Signicat. It is personal to you — please do not share it.';
  const questions = l === 'de' ? 'Fragen? Schreiben Sie uns an' : 'Questions? Reach us at';
  const signoff   = l === 'de' ? 'Mit freundlichen Grüßen,' : 'Best regards,';
  const team      = l === 'de' ? 'Das HansePay-Team' : 'The HansePay Team';
  const footer    = l === 'de' ? 'EU-regulierte grenzüberschreitende Zahlungen · Hamburg' : 'EU-regulated cross-border payments · Hamburg';

  const html = `<!DOCTYPE html>
<html lang="${l}"><head>${emailHead(l, esc(subject))}</head>
<body style="margin:0;padding:0;background:${BRAND.off};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.ink};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.off};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 28px rgba(11,25,41,.10);">

  <!-- Header -->
  <tr><td bgcolor="#0B1929" class="hp-header" style="background:#0B1929;background:linear-gradient(135deg,#060D1A 0%,#0F2540 55%,#163659 100%);padding:24px 32px;">
    <table role="presentation" width="100%"><tr>
      <td valign="middle"><table role="presentation"><tr>
        <td valign="middle" style="padding-right:10px;">${logoPill(34)}</td>
        <td valign="middle" color="#ffffff" class="hp-hdr-txt" style="font-family:${SERIF};font-size:20px;font-weight:400;color:#ffffff;letter-spacing:.01em;">HansePay</td>
      </tr></table></td>
      <td align="right" valign="middle"><span style="display:inline-block;background:rgba(141,189,230,.18);color:${BRAND.n200};font-size:10px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;padding:6px 13px;border-radius:100px;">${l === 'de' ? 'KYC-Verifizierung' : 'KYC Verification'}</span></td>
    </tr></table>
  </td></tr>
  <tr><td style="height:3px;background:linear-gradient(90deg,${BRAND.blue2},${BRAND.n200});line-height:3px;font-size:0;">&nbsp;</td></tr>

  <!-- Body -->
  <tr><td style="padding:36px 32px 28px;">
    <p style="margin:0 0 18px;font-size:16px;color:${BRAND.ink};">${esc(hi)}</p>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:${BRAND.ink2};">${intro}</p>

    <!-- CTA Button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;"><tr><td align="center">
      <a href="${esc(url)}" style="display:inline-block;background:${BRAND.navy};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:100px;">${esc(btnLabel)}</a>
    </td></tr></table>

    <!-- What to expect -->
    <h2 style="margin:0 0 12px;font-size:15px;font-weight:700;color:${BRAND.navy};">${esc(whatTitle)}</h2>
    <table role="presentation" width="100%" style="margin:0 0 24px;">
      ${steps.map((item, i) => `<tr>
        <td valign="top" style="width:28px;padding:4px 0;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:${BRAND.blue};color:#fff;font-size:11px;font-weight:700;">${i + 1}</span>
        </td>
        <td style="font-size:14px;line-height:1.55;color:${BRAND.ink2};padding:4px 0;">${esc(item)}</td>
      </tr>`).join('')}
    </table>

    <!-- Note box -->
    <table role="presentation" width="100%" style="background:#f1f7fc;border-left:3px solid ${BRAND.blue2};border-radius:6px;margin:0 0 24px;">
      <tr><td style="padding:14px 18px;font-size:13px;line-height:1.6;color:${BRAND.ink2};">${esc(note)}</td></tr>
    </table>

    <p style="margin:0 0 24px;font-size:13.5px;line-height:1.6;color:${BRAND.ink3};">${esc(questions)} <a href="mailto:${esc(supportEmail)}" style="color:${BRAND.blue2};text-decoration:none;">${esc(supportEmail)}</a></p>

    <p style="margin:0 0 2px;font-size:15px;color:${BRAND.ink2};">${esc(signoff)}</p>
    <p style="margin:0;font-size:15px;font-weight:700;color:${BRAND.navy};">${esc(team)}</p>
  </td></tr>

  <!-- Footer -->
  <tr><td bgcolor="#0B1929" class="hp-footer" style="background:${BRAND.navy};padding:20px 32px;">
    <table role="presentation" width="100%"><tr>
      <td valign="middle"><table role="presentation"><tr>
        <td valign="middle" style="padding-right:8px;">${logoPill(26)}</td>
        <td valign="middle" color="#ffffff" style="font-family:${SERIF};font-size:15px;font-weight:400;color:#ffffff;" class="hp-ftr-txt">HansePay</td>
      </tr></table></td>
      <td align="right" valign="middle" style="font-size:11px;color:rgba(255,255,255,.45);">${esc(footer)}</td>
    </tr></table>
    <p style="margin:12px 0 0;font-size:11px;color:rgba(255,255,255,.35);line-height:1.5;">© ${new Date().getFullYear()} HansePay GmbH · Hamburg, Germany</p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;

  return { to: recipientEmail, subject, html, text: htmlToText(html) };
}

// ─── Transaction authorisation OTP ───────────────────────────────────────────

/**
 * renderTxOtpEmail({ firstName, email, code, tx: { recipientName, sendAmount, sendCurrency } })
 * Returns { to, subject, html, text }
 */
function renderTxOtpEmail({ firstName, email, code, tx }) {
  tx = tx || {};
  const name     = esc(firstName || 'there');
  const codeStr  = esc(String(code));
  const amt      = tx.sendAmount  ? `${tx.sendCurrency || ''}${tx.sendAmount}` : (tx.amount ? `€${tx.amount}` : '');
  const recip    = esc(tx.recipientName || tx.recipient || 'recipient');
  const amtStr   = esc(amt);
  const subject  = 'HansePay — Confirm your transfer';
  const preheader = `Your transfer authorisation code: ${code}`;
  const supportEmail = process.env.EMAIL_REPLY_TO || process.env.CALENDAR_OWNER_EMAIL || 'hello@hansepay.de';

  const html = `<!DOCTYPE html>
<html lang="en"><head>${emailHead('en', esc(subject))}</head>
<body style="margin:0;padding:0;background:${BRAND.off};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.ink};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.off};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 28px rgba(11,25,41,.10);">

  <!-- Header -->
  <tr><td bgcolor="#0B1929" style="background:#0B1929;background:linear-gradient(135deg,#060D1A 0%,#0F2540 55%,#163659 100%);padding:24px 32px;">
    <table role="presentation" width="100%"><tr>
      <td valign="middle">
        <table role="presentation"><tr>
          <td valign="middle" style="padding-right:10px;">${logoPill(34)}</td>
          <td valign="middle" style="font-family:${SERIF};font-size:20px;font-weight:400;color:#ffffff;letter-spacing:.01em;">HansePay</td>
        </tr></table>
      </td>
      <td align="right" valign="middle"><span style="display:inline-block;background:rgba(141,189,230,.18);color:${BRAND.n200};font-size:10px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;padding:6px 13px;border-radius:100px;">Authorise transfer</span></td>
    </tr></table>
  </td></tr>
  <tr><td style="height:3px;background:linear-gradient(90deg,${BRAND.blue2},${BRAND.n200});line-height:3px;font-size:0;">&nbsp;</td></tr>

  <!-- Hero strip -->
  <tr><td bgcolor="#f0f7ff" style="background:#f0f7ff;border-bottom:1px solid #dbeafe;padding:24px 32px;">
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#1E4E80;">Transfer authorisation</p>
    <p style="margin:0;font-size:22px;font-weight:600;color:#0B1929;line-height:1.25;">
      ${amtStr ? `${amtStr} to ${recip}` : `Transfer to ${recip}`}
    </p>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:32px 32px 24px;">
    <p style="margin:0 0 16px;font-size:16px;color:${BRAND.ink};">Hi ${name},</p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${BRAND.ink2};">
      We received a request to send the transfer above from your HansePay account. Enter the code below to confirm — it expires in 10 minutes.
    </p>

    <!-- Code card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" style="background:#f7fafd;border:1px solid ${BRAND.line};border-radius:14px;padding:24px 40px;text-align:center;">
        <tr><td style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${BRAND.ink3};padding-bottom:10px;">Authorisation code</td></tr>
        <tr><td><div style="font-size:42px;font-weight:800;letter-spacing:12px;color:${BRAND.navy};font-family:${SERIF};line-height:1;">${codeStr}</div></td></tr>
      </table>
    </td></tr></table>

    <p style="margin:0 0 20px;font-size:13px;line-height:1.55;color:${BRAND.ink3};text-align:center;">If you did not initiate this transfer, contact us immediately at <a href="mailto:${esc(supportEmail)}" style="color:${BRAND.blue2};text-decoration:none;">${esc(supportEmail)}</a></p>

    <p style="margin:0 0 2px;font-size:15px;color:${BRAND.ink2};">Best,</p>
    <p style="margin:0;font-size:15px;font-weight:700;color:${BRAND.navy};">The HansePay Team</p>
  </td></tr>

  <!-- Footer -->
  <tr><td bgcolor="#0B1929" style="background:#0B1929;padding:20px 32px;">
    <table role="presentation" width="100%"><tr>
      <td valign="middle">
        <table role="presentation"><tr>
          <td valign="middle" style="padding-right:8px;">${logoPill(22)}</td>
          <td valign="middle" style="font-family:${SERIF};font-size:14px;color:rgba(255,255,255,.6);">HansePay</td>
        </tr></table>
      </td>
      <td align="right" valign="middle" style="font-size:11px;color:rgba(255,255,255,.45);">EU-regulated cross-border payments · Hamburg</td>
    </tr></table>
    <p style="margin:12px 0 0;font-size:11px;color:rgba(255,255,255,.35);line-height:1.5;">© ${new Date().getFullYear()} HansePay GmbH · Hamburg, Germany</p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;

  return { to: email, subject, html, text: htmlToText(html) };
}

// ─── Transaction confirmation email ──────────────────────────────────────────

/**
 * renderTransactionEmail({ tx })
 * Sends a branded "Your transfer is on its way" confirmation to tx.userEmail.
 */
function renderTransactionEmail({ tx }) {
  tx = tx || {};
  const to        = tx.userEmail;
  const firstName = esc(tx.firstName || '');
  const hi        = firstName ? `Hi ${firstName},` : 'Hi there,';
  const recip     = esc(tx.recipientName || tx.recipient || 'your recipient');
  const sendAmt   = tx.sendAmount  ? esc(String(tx.sendAmount))  : (tx.amount ? esc(String(tx.amount)) : '—');
  const sendCur   = esc(tx.sendCurrency  || tx.currency || 'EUR');
  const recvAmt   = tx.receiveAmount ? esc(String(tx.receiveAmount)) : null;
  const recvCur   = esc(tx.receiveCurrency || '');
  const ref       = esc(tx.reference || tx.id || '');
  const subject   = `HansePay — Your transfer to ${tx.recipientName || tx.recipient || 'recipient'} is confirmed`;
  const preheader = `${sendCur}${sendAmt} is on its way to ${tx.recipientName || tx.recipient || 'your recipient'}`;
  const supportEmail = process.env.EMAIL_REPLY_TO || process.env.CALENDAR_OWNER_EMAIL || 'hello@hansepay.de';
  const now       = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' });

  const detailRows = [
    ['Transfer to',  recip],
    ['Amount sent',  `${sendCur} ${sendAmt}`],
    recvAmt ? ['Amount received', `${recvCur} ${recvAmt}`] : null,
    ['Date', esc(tx.date || now)],
    ref ? ['Reference', ref] : null,
  ].filter(Boolean);

  const detailHtml = detailRows.map(([label, value]) => `
  <tr>
    <td style="padding:10px 0;font-size:13px;font-weight:600;color:${BRAND.ink3};border-bottom:1px solid ${BRAND.line};width:45%;">${esc(label)}</td>
    <td style="padding:10px 0;font-size:13px;color:${BRAND.ink};border-bottom:1px solid ${BRAND.line};font-weight:500;">${value}</td>
  </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en"><head>${emailHead('en', esc(subject))}</head>
<body style="margin:0;padding:0;background:${BRAND.off};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.ink};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.off};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 28px rgba(11,25,41,.10);">

  <!-- Header -->
  <tr><td bgcolor="#0B1929" style="background:#0B1929;background:linear-gradient(135deg,#060D1A 0%,#0F2540 55%,#163659 100%);padding:24px 32px;">
    <table role="presentation" width="100%"><tr>
      <td valign="middle">
        <table role="presentation"><tr>
          <td valign="middle" style="padding-right:10px;">${logoPill(34)}</td>
          <td valign="middle" style="font-family:${SERIF};font-size:20px;font-weight:400;color:#ffffff;letter-spacing:.01em;">HansePay</td>
        </tr></table>
      </td>
      <td align="right" valign="middle"><span style="display:inline-block;background:rgba(46,107,173,.35);color:${BRAND.n200};font-size:10px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;padding:6px 13px;border-radius:100px;">Transfer confirmed</span></td>
    </tr></table>
  </td></tr>
  <tr><td style="height:3px;background:linear-gradient(90deg,#16a34a,#4ade80);line-height:3px;font-size:0;">&nbsp;</td></tr>

  <!-- Hero strip -->
  <tr><td bgcolor="#f0fdf4" style="background:#f0fdf4;border-bottom:1px solid #bbf7d0;padding:28px 32px;text-align:center;">
    <!-- Checkmark -->
    <div style="width:52px;height:52px;background:#16a34a;border-radius:50%;margin:0 auto 16px;text-align:center;line-height:52px;">
      <span style="color:#fff;font-size:26px;line-height:52px;">✓</span>
    </div>
    <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#166534;line-height:1.2;">Transfer confirmed</p>
    <p style="margin:0;font-size:14px;color:#15803d;">${sendCur} ${sendAmt} is on its way to ${recip}</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:32px 32px 24px;">
    <p style="margin:0 0 24px;font-size:16px;color:${BRAND.ink};">${hi}</p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${BRAND.ink2};">Your transfer has been authorised and is being processed. Funds typically arrive within 1 — 2 business days.</p>

    <!-- Detail card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7fafd;border:1px solid ${BRAND.line};border-radius:12px;padding:4px 20px;margin:0 0 28px;">
      <tr><td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${detailHtml}
        </table>
      </td></tr>
    </table>

    <p style="margin:0 0 20px;font-size:13px;line-height:1.55;color:${BRAND.ink3};">Questions about this transfer? Contact us at <a href="mailto:${esc(supportEmail)}" style="color:${BRAND.blue2};text-decoration:none;">${esc(supportEmail)}</a></p>

    <p style="margin:0 0 2px;font-size:15px;color:${BRAND.ink2};">Best,</p>
    <p style="margin:0;font-size:15px;font-weight:700;color:${BRAND.navy};">The HansePay Team</p>
  </td></tr>

  <!-- Footer -->
  <tr><td bgcolor="#0B1929" style="background:#0B1929;padding:20px 32px;">
    <table role="presentation" width="100%"><tr>
      <td valign="middle">
        <table role="presentation"><tr>
          <td valign="middle" style="padding-right:8px;">${logoPill(22)}</td>
          <td valign="middle" style="font-family:${SERIF};font-size:14px;color:rgba(255,255,255,.6);">HansePay</td>
        </tr></table>
      </td>
      <td align="right" valign="middle" style="font-size:11px;color:rgba(255,255,255,.45);">EU-regulated cross-border payments · Hamburg</td>
    </tr></table>
    <p style="margin:12px 0 0;font-size:11px;color:rgba(255,255,255,.35);line-height:1.5;">© ${new Date().getFullYear()} HansePay GmbH · Hamburg, Germany</p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;

  return { to, subject, html, text: htmlToText(html) };
}

// ─── Password reset OTP email ─────────────────────────────────────────────────

/**
 * renderPasswordResetEmail({ firstName, email, code })
 * Returns { to, subject, html, text }
 */
function renderPasswordResetEmail({ firstName, email, code }) {
  const name     = esc(firstName || 'there');
  const codeStr  = esc(String(code));
  const subject  = 'Reset your HansePay password';
  const preheader = `Your password reset code: ${code}. Valid for 15 minutes.`;
  const supportEmail = process.env.EMAIL_REPLY_TO || process.env.CALENDAR_OWNER_EMAIL || 'hello@hansepay.de';

  const html = `<!DOCTYPE html>
<html lang="en"><head>${emailHead('en', esc(subject))}</head>
<body style="margin:0;padding:0;background:${BRAND.off};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.ink};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.off};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 28px rgba(11,25,41,.10);">

  <!-- Header -->
  <tr><td bgcolor="#0B1929" class="hp-header" style="background:#0B1929;background:linear-gradient(135deg,#060D1A 0%,#0F2540 55%,#163659 100%);padding:24px 32px;">
    <table role="presentation" width="100%"><tr>
      <td valign="middle">
        <table role="presentation"><tr>
          <td valign="middle" style="padding-right:10px;">${logoPill(34)}</td>
          <td valign="middle" color="#ffffff" class="hp-hdr-txt" style="font-family:${SERIF};font-size:20px;font-weight:400;color:#ffffff;letter-spacing:.01em;">HansePay</td>
        </tr></table>
      </td>
      <td align="right" valign="middle"><span style="display:inline-block;background:rgba(141,189,230,.18);color:${BRAND.n200};font-size:10px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;padding:6px 13px;border-radius:100px;">Password reset</span></td>
    </tr></table>
  </td></tr>
  <tr><td style="height:3px;background:linear-gradient(90deg,${BRAND.blue2},${BRAND.n200});line-height:3px;font-size:0;">&nbsp;</td></tr>

  <!-- Hero strip -->
  <tr><td bgcolor="#f0f7ff" style="background:#f0f7ff;border-bottom:1px solid #dbeafe;padding:28px 32px;text-align:center;">
    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 14px;">
      <tr><td width="48" height="48" bgcolor="${BRAND.blue}" style="background:${BRAND.blue};border-radius:24px;text-align:center;vertical-align:middle;line-height:48px;font-size:22px;color:#fff;">&#128274;</td></tr>
    </table>
    <div style="font-size:20px;font-weight:700;color:${BRAND.navy};letter-spacing:-.01em;margin-bottom:6px;">Reset your password</div>
    <div style="font-size:13.5px;color:${BRAND.ink3};">Use the code below — it expires in 15 minutes</div>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:32px 32px 24px;">
    <p style="margin:0 0 16px;font-size:16px;color:${BRAND.ink};">Hi ${name},</p>
    <p style="margin:0 0 26px;font-size:15px;line-height:1.6;color:${BRAND.ink2};">
      We received a request to reset the password for your HansePay account. Enter the code below in the reset form to choose a new password.
    </p>

    <!-- Code card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 26px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" style="background:#f7fafd;border:1px solid ${BRAND.line};border-radius:14px;padding:24px 40px;text-align:center;">
        <tr><td style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${BRAND.ink3};padding-bottom:10px;">Your reset code</td></tr>
        <tr><td><div style="font-size:42px;font-weight:800;letter-spacing:12px;color:${BRAND.navy};font-family:${SERIF};line-height:1;">${codeStr}</div></td></tr>
        <tr><td style="padding-top:10px;font-size:12px;color:${BRAND.ink3};">Valid for 15 minutes</td></tr>
      </table>
    </td></tr></table>

    <table role="presentation" width="100%" style="background:#fffbeb;border-left:3px solid #f59e0b;border-radius:6px;margin:0 0 24px;">
      <tr><td style="padding:14px 18px;font-size:13px;line-height:1.6;color:#92400e;">If you didn't request a password reset, you can safely ignore this email. Your password won't change.</td></tr>
    </table>

    <p style="margin:0 0 24px;font-size:13.5px;line-height:1.6;color:${BRAND.ink3};">Questions? Reach us at <a href="mailto:${esc(supportEmail)}" style="color:${BRAND.blue2};text-decoration:none;">${esc(supportEmail)}</a></p>

    <p style="margin:0 0 2px;font-size:15px;color:${BRAND.ink2};">Best,</p>
    <p style="margin:0;font-size:15px;font-weight:700;color:${BRAND.navy};">The HansePay Team</p>
  </td></tr>

  <!-- Footer -->
  <tr><td bgcolor="#0B1929" class="hp-footer" style="background:${BRAND.navy};padding:20px 32px;">
    <table role="presentation" width="100%"><tr>
      <td valign="middle"><table role="presentation"><tr>
        <td valign="middle" style="padding-right:8px;">${logoPill(26)}</td>
        <td valign="middle" color="#ffffff" style="font-family:${SERIF};font-size:15px;font-weight:400;color:#ffffff;" class="hp-ftr-txt">HansePay</td>
      </tr></table></td>
      <td align="right" valign="middle" style="font-size:11px;color:rgba(255,255,255,.45);">EU-regulated cross-border payments · Hamburg</td>
    </tr></table>
    <p style="margin:12px 0 0;font-size:11px;color:rgba(255,255,255,.35);line-height:1.5;">© ${new Date().getFullYear()} HansePay GmbH · Hamburg, Germany</p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;

  return { to: email, subject, html, text: htmlToText(html) };
}

module.exports = { sendMail, renderBookingEmail, renderRegistrationEmail, renderOtpEmail, renderApprovalEmail, renderKycInviteEmail, renderTxOtpEmail, renderTransactionEmail, renderPasswordResetEmail, gmailConfigured };
