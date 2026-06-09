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
  off:   '#F6F9FC',   // cool blue-tint off-white (brand spec); never use #F5F1EA warm cream
  line:  '#e6ebf0',
};

// Public base URL for email assets (logo). Overridable in Railway.
const PUBLIC_BASE = (process.env.PUBLIC_BASE_URL || 'https://hansepay-deploy-production-328c.up.railway.app').replace(/\/$/, '');
// White logo mark on transparent background. Apple Mail renders it white against
// the dark header naturally. Keep this simple — wrapping or baking backgrounds
// creates visible boxes and distortion.
const LOGO_WHITE_MARK = PUBLIC_BASE + '/assets/hansepay-mark-white.png';
// Brand wordmark font stack — matches the site (Libre Baskerville, weight 400)
const SERIF = "'Libre Baskerville',Georgia,'Times New Roman',serif";

// Logo for email dark headers/footers.
// Uses CSS background-image instead of <img> — Apple Mail's dark-mode inversion
// algorithm targets <img> elements; CSS background-image is left alone.
function logoPill(size) {
  size = size || 36;
  return `<div style="display:inline-block;width:${size}px;height:${size}px;min-width:${size}px;min-height:${size}px;background:url(${LOGO_WHITE_MARK}) center/contain no-repeat;font-size:0;line-height:0;" role="img" aria-label="HansePay logo"></div>`;
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
  const supportEmail = process.env.EMAIL_REPLY_TO || process.env.CALENDAR_OWNER_EMAIL || 'hello@hansepay.de';

  const detailRows = [
    [lang === 'de' ? 'Name' : 'Name',       `${reg.firstName || ''} ${reg.lastName || ''}`.trim()],
    [lang === 'de' ? 'E-Mail' : 'Email',    reg.email || ''],
    [lang === 'de' ? 'Unternehmen' : 'Company', reg.company || '—'],
    [lang === 'de' ? 'Kontotyp' : 'Account type', reg.accountType === 'personal' ? (lang === 'de' ? 'Privatperson' : 'Individual') : (lang === 'de' ? 'Unternehmen' : 'Business')],
  ].filter(r => r[1]);

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

  <!-- Accent rule -->
  <tr><td style="height:3px;background:${BRAND.blue};background:linear-gradient(90deg,${BRAND.blue2},${BRAND.n200});line-height:3px;font-size:0;">&nbsp;</td></tr>

  <!-- Body -->
  <tr><td style="padding:36px 36px 8px;">
    <p style="margin:0 0 16px;font-size:16px;color:${BRAND.ink};">${esc(t.hi(name))}</p>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:${BRAND.ink2};">${esc(t.intro)}</p>

    <!-- Ref card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7fafd;border:1px solid ${BRAND.line};border-radius:12px;margin:0 0 28px;">
      <tr><td style="padding:20px 24px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${BRAND.ink3};margin-bottom:6px;">${esc(t.refLabel)}</div>
        <div style="font-size:22px;font-weight:700;color:${BRAND.navy};letter-spacing:.04em;">${ref}</div>
      </td></tr>
    </table>

    <!-- What happens next -->
    <h2 style="margin:0 0 12px;font-size:15px;font-weight:700;color:${BRAND.navy};">${esc(t.nextTitle)}</h2>
    <table role="presentation" width="100%" style="margin:0 0 28px;">
      ${t.next.map((item, i) => `<tr>
        <td valign="top" style="width:28px;padding:4px 0;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:${BRAND.blue};color:#fff;font-size:11px;font-weight:700;">${i + 1}</span>
        </td>
        <td style="font-size:14px;line-height:1.55;color:${BRAND.ink2};padding:4px 0;">${esc(item)}</td>
      </tr>`).join('')}
    </table>

    <!-- Details table -->
    <table role="presentation" width="100%" style="border-top:1px solid ${BRAND.line};margin:0 0 24px;padding-top:20px;font-size:14px;">
      ${detailRows.map(r => `<tr>
        <td style="padding:6px 0;color:${BRAND.ink3};width:42%;">${esc(r[0])}</td>
        <td style="padding:6px 0;color:${BRAND.ink};font-weight:500;">${esc(r[1])}</td>
      </tr>`).join('')}
    </table>

    <p style="margin:0 0 24px;font-size:13.5px;line-height:1.6;color:${BRAND.ink3};">${esc(t.questions)} <a href="mailto:${esc(supportEmail)}" style="color:${BRAND.blue2};text-decoration:none;">${esc(supportEmail)}</a></p>

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
    <table role="presentation"><tr>
      <td valign="middle" style="padding-right:10px;">${logoPill(34)}</td>
      <td valign="middle" color="#ffffff" class="hp-hdr-txt" style="font-family:${SERIF};font-size:20px;font-weight:400;color:#ffffff;letter-spacing:.01em;">HansePay</td>
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
  const t = APPROVAL_COPY[l];
  const ref  = esc(applicationRef || '—');
  const name = esc(firstName || (l === 'de' ? 'dort' : 'there'));
  const co   = esc(company || `${firstName || ''} ${lastName || ''}`.trim() || email);
  const supportEmail = process.env.EMAIL_REPLY_TO || process.env.CALENDAR_OWNER_EMAIL || 'hello@hansepay.de';
  const siteBase = (process.env.PUBLIC_BASE_URL || 'https://www.hansepay.de').replace(/\/$/, '');
  const url = loginUrl || (siteBase + '/hansepay/dashboard-login.html');

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
  <tr><td style="height:3px;background:${BRAND.blue};background:linear-gradient(90deg,${BRAND.blue2},${BRAND.n200});line-height:3px;font-size:0;">&nbsp;</td></tr>

  <!-- Body -->
  <tr><td style="padding:36px 36px 8px;">
    <p style="margin:0 0 16px;font-size:16px;color:${BRAND.ink};">${esc(t.hi(name))}</p>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:${BRAND.ink2};">${esc(t.intro)}</p>

    <!-- Ref card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;margin:0 0 28px;">
      <tr><td style="padding:20px 24px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#16a34a;margin-bottom:6px;">${esc(t.refLabel)}</div>
        <div style="font-size:22px;font-weight:700;color:${BRAND.navy};letter-spacing:.04em;">${ref}</div>
      </td></tr>
    </table>

    <!-- CTA Button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;"><tr><td align="center">
      <a href="${esc(url)}" style="display:inline-block;background:${BRAND.navy};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:100px;">${esc(t.loginBtn)}</a>
    </td></tr></table>

    <!-- Next steps -->
    <h2 style="margin:0 0 12px;font-size:15px;font-weight:700;color:${BRAND.navy};">${esc(t.nextTitle)}</h2>
    <table role="presentation" width="100%" style="margin:0 0 28px;">
      ${t.next.map((item, i) => `<tr>
        <td valign="top" style="width:28px;padding:4px 0;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#16a34a;color:#fff;font-size:11px;font-weight:700;">${i + 1}</span>
        </td>
        <td style="font-size:14px;line-height:1.55;color:${BRAND.ink2};padding:4px 0;">${esc(item)}</td>
      </tr>`).join('')}
    </table>

    <p style="margin:0 0 24px;font-size:13.5px;line-height:1.6;color:${BRAND.ink3};">${esc(t.questions)} <a href="mailto:${esc(supportEmail)}" style="color:${BRAND.blue2};text-decoration:none;">${esc(supportEmail)}</a></p>

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

module.exports = { sendMail, renderBookingEmail, renderRegistrationEmail, renderOtpEmail, renderApprovalEmail, renderKycInviteEmail, gmailConfigured };
