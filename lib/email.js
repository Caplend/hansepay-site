'use strict';

/**
 * HansePay — transactional email
 *
 * Two transports, tried in order:
 *   1. Gmail API  — GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN
 *   2. None       — logs and skips, so the app never crashes on missing config
 *
 * Optional env:
 *   EMAIL_FROM         "HansePay <hello@hansepay.de>"
 *   EMAIL_REPLY_TO     reply-to address
 *   EMAIL_BCC          internal copy
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
  off:   '#F0F2F4',   // cool grey background
  line:  '#E8ECF0',
};

const PUBLIC_BASE = (process.env.PUBLIC_BASE_URL || 'https://hansepay-deploy-production-328c.up.railway.app').replace(/\/$/, '');
const LOGO_URL    = PUBLIC_BASE + '/assets/hansepay-mark-uploaded-white.png';
const SERIF = "Georgia,'Times New Roman',serif";
const SANS  = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO  = "Inter,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function logoPill(size) {
  size = size || 30;
  return `<img src="${LOGO_URL}" width="${size}" height="${size}" alt="HansePay" style="display:block;width:${size}px;height:${size}px;object-fit:contain;" border="0">`;
}

function emailHead(lang, title) {
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${esc(title)}</title>
<style>
  @media (prefers-color-scheme: dark) {
    .hp-header { background: #0B1929 !important; }
    .hp-hdr-txt { color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; }
  }
</style>`;
}

// ── Shared layout helpers (used by every template) ───────────────────────

// Solid navy header — centered logo + wordmark + subtitle text.
// No gradient, no badge bubble, no accent line.
function emailHdr(subtitle) {
  return `
  <tr><td bgcolor="#0B1929" class="hp-header" style="background:#0B1929;padding:30px 40px 26px;text-align:center;">
    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
      <tr>
        <td valign="middle" style="padding-right:9px;">${logoPill(30)}</td>
        <td valign="middle" class="hp-hdr-txt" style="font-family:${SERIF};font-size:20px;font-weight:400;color:#ffffff;letter-spacing:.01em;">HansePay</td>
      </tr>
    </table>
    <div style="margin-top:11px;font-size:10px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.42);">${subtitle}</div>
  </td></tr>`;
}

// Minimal footer — light border-top + copyright line, no dark block.
function emailFtr(tagline) {
  return `
  <tr><td style="padding:20px 40px 24px;text-align:center;border-top:1px solid ${BRAND.line};">
    <p style="margin:0;font-size:11.5px;color:#9BA8B4;">${esc(tagline)}</p>
    <p style="margin:5px 0 0;font-size:11px;color:#B8C4CE;">© ${new Date().getFullYear()} HansePay GmbH &middot; Hamburg, Germany</p>
  </td></tr>`;
}

// Icon circle: 64 × 64 px with a light tinted background.
function heroIcon(char, bg) {
  bg = bg || '#EBF2FA';
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 22px;">
    <tr><td width="64" height="64" bgcolor="${bg}" style="background:${bg};border-radius:32px;text-align:center;vertical-align:middle;font-size:26px;line-height:64px;">${char}</td></tr>
  </table>`;
}

// Georgia heading: "Main phrase <em italic blue>accent</em>"
function heroH(main, accent, accentColor) {
  accentColor = accentColor || BRAND.blue2;
  return `<div style="font-family:${SERIF};font-size:30px;font-weight:400;color:${BRAND.navy};line-height:1.25;margin:0 0 18px;text-align:center;">${esc(main)}&nbsp;<em style="color:${accentColor};font-style:italic;">${esc(accent)}</em></div>`;
}

// OTP / code card — Inter font, NOT serif.
function codeCard(code, label) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 28px;">
    <tr><td align="center" style="background:#F7F9FC;border:1.5px solid ${BRAND.line};border-radius:14px;padding:22px 44px;">
      <div style="font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${BRAND.ink3};margin-bottom:11px;">${esc(label)}</div>
      <div style="font-family:${MONO};font-size:40px;font-weight:700;letter-spacing:10px;color:${BRAND.navy};line-height:1;">${esc(String(code))}</div>
    </td></tr>
  </table>`;
}

// Primary CTA button.
function ctaBtn(label, url) {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;"><tr><td align="center">
    <a href="${esc(url)}" style="display:inline-block;background:${BRAND.navy};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:100px;font-family:${SANS};">${esc(label)}</a>
  </td></tr></table>`;
}

// Key-value info card.
function infoCard(rows) {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F9FC;border:1px solid ${BRAND.line};border-radius:12px;margin:0 0 26px;">
    <tr><td style="padding:16px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13.5px;">
        ${rows.map((r, i) => `<tr>
          <td style="padding:7px 0;color:${BRAND.ink3};width:44%;${i > 0 ? 'border-top:1px solid ' + BRAND.line + ';' : ''}">${esc(r[0])}</td>
          <td style="padding:7px 0;color:${BRAND.ink};font-weight:500;${i > 0 ? 'border-top:1px solid ' + BRAND.line + ';' : ''}">${esc(r[1])}</td>
        </tr>`).join('')}
      </table>
    </td></tr>
  </table>`;
}

// Numbered step list.
function stepList(items, activeIdx) {
  activeIdx = activeIdx == null ? -1 : activeIdx;
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 26px;">
    ${items.map((item, i) => {
      const done   = i < (activeIdx < 0 ? 0 : activeIdx);
      const active = i === activeIdx;
      const last   = i === items.length - 1;
      const cirBg  = (done || active) ? BRAND.blue : '#E2E8F0';
      const cirCol = (done || active) ? '#fff' : BRAND.ink3;
      const conBg  = done ? BRAND.blue2 : '#E2E8F0';
      const label  = typeof item === 'string' ? item : item.label;
      const desc   = typeof item === 'object' ? item.desc : null;
      return `<tr>
        <td valign="top" width="36" style="padding-right:4px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr><td width="28" height="28" bgcolor="${cirBg}" style="background:${cirBg};border-radius:14px;text-align:center;vertical-align:middle;font-size:${done?'14':'12'}px;font-weight:700;color:${cirCol};line-height:28px;">${done ? '&#10003;' : (i + 1)}</td></tr>
            ${!last ? `<tr><td align="center" style="padding:2px 0;"><table role="presentation" cellpadding="0" cellspacing="0" style="width:2px;margin:0 auto;"><tr><td height="20" bgcolor="${conBg}" style="background:${conBg};font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>` : ''}
          </table>
        </td>
        <td valign="top" style="padding:2px 0 ${last?'0':'14'}px 10px;">
          <div style="font-size:14px;font-weight:${active?'700':'500'};color:${active?BRAND.navy:(done?BRAND.ink2:BRAND.ink3)};">${esc(label)}</div>
          ${desc ? `<div style="font-size:12.5px;color:${BRAND.ink3};line-height:1.5;margin-top:2px;">${esc(desc)}</div>` : ''}
        </td>
      </tr>`;
    }).join('')}
  </table>`;
}

// Support / questions footer line inside body.
function supportLine(text, email) {
  return `<p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:${BRAND.ink3};text-align:center;">${esc(text)} <a href="mailto:${esc(email)}" style="color:${BRAND.blue2};text-decoration:none;">${esc(email)}</a></p>`;
}

function signoff(sig, team) {
  return `<p style="margin:0 0 2px;font-size:15px;color:${BRAND.ink2};">${esc(sig)}</p>
<p style="margin:0 0 32px;font-size:15px;font-weight:700;color:${BRAND.navy};">${esc(team)}</p>`;
}

// ── Gmail infra ───────────────────────────────────────────────────────────

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
  const res = await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
  return res.data;
}

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

// ─── Booking confirmation ─────────────────────────────────────────────────

const COPY = {
  en: {
    subject:     (d, r) => r ? `Your HansePay call has been rescheduled — ${d}` : `Your HansePay call is confirmed — ${d}`,
    preheader:   (r) => r ? 'Your call has been rescheduled. Here are your new details.' : 'Your discovery call is booked. Here are the details.',
    hdrSub:      (r) => r ? 'Call rescheduled' : 'Call confirmed',
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
    hdrSub:      (r) => r ? 'Termin verschoben' : 'Termin bestätigt',
    hi:          (n) => `Hallo ${n},`,
    intro:       (r) => r
      ? 'Ihr HansePay-Kennenlerngespräch wurde erfolgreich verschoben. Hier sind Ihre neuen Termindetails — ein neuer Google-Meet-Link ist beigefügt.'
      : 'Vielen Dank für Ihre Buchung bei HansePay. Ihr 30-minütiges Kennenlerngespräch ist bestätigt — wir freuen uns darauf, mehr über Ihre FX-Anforderungen zu erfahren.',
    when: 'Wann', duration: '30 Minuten', where: 'Wo',
    meet:        'Google Meet — Link unten und in Ihrer Kalendereinladung',
    joinBtn:     'Google Meet beitreten',
    addCal:      'Zum Kalender hinzufügen',
    calNote:     'Fügen Sie den Termin Ihrem Kalender hinzu — der Google-Meet-Link ist enthalten.',
    expectTitle: 'Was Sie erwartet',
    expect: [
      'Ein entspanntes Gespräch auf Augenhöhe — kein Verkaufsdruck.',
      'Ein paar Fragen zu Ihren aktuellen grenzüberschreitenden Zahlungsabläufen.',
      'Ein klares Bild, wo HansePay Ihnen Zeit und Geld sparen kann.',
    ],
    prepTitle:   'Damit es sich lohnt',
    prep:        'Halten Sie eine grobe Vorstellung Ihres monatlichen FX-Volumens und der wichtigsten Währungspaare bereit.',
    reschedule:  'Anderen Termin benötigt?',
    rebookBtn:   'Termin verschieben →',
    rescheduleText: 'Oder antworten Sie auf diese E-Mail.',
    signoff:     'Bis bald,',
    team:        'Ihr HansePay-Team',
    footerTagline: 'EU-regulierte grenzüberschreitende Zahlungen · Hamburg',
    detailsTitle: 'Ihre Angaben',
  },
};

function gcalLink(booking) {
  try {
    const fmt = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const start = fmt(booking.slot.startISO);
    const end   = fmt(booking.slot.endISO || booking.slot.startISO);
    const loc   = booking.meetLink || 'Google Meet';
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent('HansePay Discovery Call') +
      '&dates=' + start + '/' + end +
      '&details=' + encodeURIComponent(booking.meetLink ? 'Join Google Meet: ' + booking.meetLink : 'HansePay discovery call') +
      '&location=' + encodeURIComponent(loc);
  } catch (e) { return null; }
}

function formatWhen(startISO, lang) {
  const d = new Date(startISO);
  const locale = lang === 'de' ? 'de-DE' : 'en-GB';
  const datePart = d.toLocaleDateString(locale, { weekday:'long', day:'numeric', month:'long', year:'numeric', timeZone:'Europe/Berlin' });
  const timePart = d.toLocaleTimeString(locale, { hour:'2-digit', minute:'2-digit', timeZone:'Europe/Berlin' });
  return { datePart, timePart, full: `${datePart} · ${timePart}` };
}

function renderBookingEmail(booking) {
  const lead     = booking.lead || {};
  const lang     = (lead.lang === 'de') ? 'de' : 'en';
  const t        = COPY[lang];
  const isRebook = !!booking.isRebook;
  const when     = formatWhen(booking.slot.startISO, lang);
  const name     = esc(lead.firstName || (lang === 'de' ? 'dort' : 'there'));
  const meetLink = booking.meetLink || booking.calendarUrl || null;
  const addCalUrl = gcalLink(booking);
  const rebookUrl = booking.rebookUrl || null;
  const tzLabel   = lang === 'de' ? '(Hamburger Zeit)' : '(Berlin time)';
  const supportEmail = process.env.EMAIL_REPLY_TO || process.env.CALENDAR_OWNER_EMAIL || 'hello@hansepay.de';

  const detailRows = [
    [lang === 'de' ? 'Name' : 'Name',         `${lead.firstName || ''} ${lead.lastName || ''}`.trim()],
    ['E-Mail',                                  lead.email || ''],
    [lang === 'de' ? 'Unternehmen' : 'Company', lead.company || '—'],
    [lang === 'de' ? 'Branche' : 'Industry',    lead.industry || '—'],
    [lang === 'de' ? 'Monatl. FX-Volumen' : 'Monthly FX volume', lead.fxVolume || '—'],
  ].filter(r => r[1]);

  const mainWord = isRebook ? (lang === 'de' ? 'verschoben' : 'rescheduled') : (lang === 'de' ? 'bestätigt' : 'confirmed');
  const mainBase = isRebook ? (lang === 'de' ? 'Ihr Termin wurde' : 'Your call') : (lang === 'de' ? 'Termin' : 'Call');

  const html = `<!DOCTYPE html>
<html lang="${lang}"><head>${emailHead(lang, esc(t.subject(when.datePart, isRebook)))}</head>
<body style="margin:0;padding:0;background:${BRAND.off};font-family:${SANS};color:${BRAND.ink};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(t.preheader(isRebook))}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.off};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(11,25,41,.08);">

  ${emailHdr(esc(t.hdrSub(isRebook)))}

  <!-- Body -->
  <tr><td style="padding:36px 40px 28px;">
    ${heroIcon('&#128197;', '#EBF2FA')}
    ${heroH(isRebook ? (lang === 'de' ? 'Termin' : 'Call') : (lang === 'de' ? 'Termin' : 'Call'), mainWord)}
    <p style="margin:0 0 8px;font-size:16px;color:${BRAND.ink};">${esc(t.hi(name))}</p>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:${BRAND.ink2};">${esc(t.intro(isRebook))}</p>

    <!-- Appointment card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F9FC;border:1px solid ${BRAND.line};border-radius:12px;margin:0 0 22px;">
      <tr><td style="padding:22px 24px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${BRAND.ink3};margin-bottom:4px;">${esc(t.when)}</div>
        <div style="font-size:18px;font-weight:700;color:${BRAND.navy};margin-bottom:2px;">${esc(when.datePart)}</div>
        <div style="font-size:15px;color:${BRAND.blue2};margin-bottom:16px;">${esc(when.timePart)} ${esc(tzLabel)} · ${esc(t.duration)}</div>
        <div style="border-top:1px solid ${BRAND.line};padding-top:14px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${BRAND.ink3};margin-bottom:4px;">${esc(t.where)}</div>
        <div style="font-size:14px;color:${BRAND.ink2};">${esc(t.meet)}</div>
      </td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;"><tr><td align="center">
      ${meetLink ? `<a href="${esc(meetLink)}" style="display:inline-block;background:${BRAND.navy};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:13px 28px;border-radius:100px;margin:0 4px 8px;">${esc(t.joinBtn)} →</a>` : ''}
      ${addCalUrl ? `<a href="${esc(addCalUrl)}" style="display:inline-block;background:#ffffff;color:${BRAND.blue};font-size:15px;font-weight:600;text-decoration:none;padding:12px 26px;border-radius:100px;border:1.5px solid ${BRAND.line};margin:0 4px 8px;">${esc(t.addCal)}</a>` : ''}
    </td></tr></table>
    <p style="margin:0 0 22px;font-size:13px;line-height:1.6;color:${BRAND.ink3};text-align:center;">${esc(t.calNote)}</p>

    ${rebookUrl ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 26px;"><tr><td align="center">
      <p style="margin:0 0 6px;font-size:12px;color:${BRAND.ink3};">${esc(t.reschedule)}</p>
      <a href="${esc(rebookUrl)}" style="font-family:${SERIF};font-style:italic;font-size:14px;color:${BRAND.blue};text-decoration:none;border-bottom:1px solid rgba(46,107,173,.35);padding-bottom:1px;">${esc(t.rebookBtn)}</a>
    </td></tr></table>` : ''}

    <h2 style="margin:0 0 12px;font-size:15px;font-weight:700;color:${BRAND.navy};">${esc(t.expectTitle)}</h2>
    <table role="presentation" width="100%" style="margin:0 0 22px;">
      ${t.expect.map(item => `<tr>
        <td valign="top" style="width:22px;padding:3px 0;color:${BRAND.blue2};font-size:15px;">●</td>
        <td style="font-size:14px;line-height:1.55;color:${BRAND.ink2};padding:3px 0;">${esc(item)}</td>
      </tr>`).join('')}
    </table>

    <table role="presentation" width="100%" style="background:#F7F9FC;border-left:3px solid ${BRAND.blue2};border-radius:6px;margin:0 0 24px;">
      <tr><td style="padding:14px 18px;">
        <div style="font-size:13px;font-weight:700;color:${BRAND.navy};margin-bottom:4px;">${esc(t.prepTitle)}</div>
        <div style="font-size:14px;line-height:1.55;color:${BRAND.ink2};">${esc(t.prep)}</div>
      </td></tr>
    </table>

    <div style="font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${BRAND.ink3};margin-bottom:10px;">${esc(t.detailsTitle)}</div>
    ${infoCard(detailRows)}

    <p style="margin:0 0 22px;font-size:13px;line-height:1.6;color:${BRAND.ink3};">${esc(t.rescheduleText)}</p>
    ${signoff(t.signoff, t.team)}
  </td></tr>

  ${emailFtr(t.footerTagline)}

</table>
</td></tr></table>
</body></html>`;

  return { to: lead.email, subject: t.subject(when.datePart, isRebook), html, text: htmlToText(html) };
}

// ─── Registration confirmation ────────────────────────────────────────────

const REG_COPY = {
  en: {
    subject:   (ref) => `Application received — ${ref}`,
    preheader: 'Your HansePay application is under review. We\'ll be in touch shortly.',
    hdrSub:    'Application received',
    hi:        (n) => `Hi ${n},`,
    intro:     'Thank you for applying to HansePay. We\'ve received your application and our compliance team will review it shortly. You\'ll hear back from us within 1–2 business days.',
    refLabel:  'Application reference',
    nextTitle: 'What happens next',
    steps: [
      { label: 'Compliance review',         desc: 'Our team reviews your documents and details.' },
      { label: 'Additional info if needed', desc: 'We\'ll reach out if we need anything extra.' },
      { label: 'Account activated',         desc: 'You\'ll receive your login credentials once approved.' },
    ],
    questions: 'Questions? Reply to this email or reach us at',
    signoff:   'Best regards,',
    team:      'The HansePay Team',
    footer:    'EU-regulated cross-border payments · Hamburg',
    appLabel:  'Your application',
    now:       'Now',
  },
  de: {
    subject:   (ref) => `Antrag eingegangen — ${ref}`,
    preheader: 'Ihr HansePay-Antrag wird geprüft. Wir melden uns in Kürze.',
    hdrSub:    'Antrag eingegangen',
    hi:        (n) => `Hallo ${n},`,
    intro:     'Vielen Dank für Ihren Antrag bei HansePay. Wir haben Ihre Unterlagen erhalten und unser Compliance-Team wird diese in Kürze prüfen. Sie erhalten innerhalb von 1–2 Werktagen eine Rückmeldung.',
    refLabel:  'Antragsnummer',
    nextTitle: 'Wie geht es weiter',
    steps: [
      { label: 'Compliance-Prüfung',    desc: 'Unser Team prüft Ihre Dokumente und Angaben.' },
      { label: 'Eventuelle Rückfragen', desc: 'Wir melden uns, falls wir noch etwas benötigen.' },
      { label: 'Kontoaktivierung',      desc: 'Sie erhalten Ihre Zugangsdaten nach Freigabe.' },
    ],
    questions: 'Fragen? Antworten Sie auf diese E-Mail oder schreiben Sie uns an',
    signoff:   'Mit freundlichen Grüßen,',
    team:      'Ihr HansePay-Team',
    footer:    'EU-regulierte grenzüberschreitende Zahlungen · Hamburg',
    appLabel:  'Ihre Angaben',
    now:       'Jetzt',
  },
};

function renderRegistrationEmail(reg) {
  const lang = (reg.lang === 'de') ? 'de' : 'en';
  const t    = REG_COPY[lang];
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

  const html = `<!DOCTYPE html>
<html lang="${lang}"><head>${emailHead(lang, esc(t.subject(ref)))}</head>
<body style="margin:0;padding:0;background:${BRAND.off};font-family:${SANS};color:${BRAND.ink};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(t.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.off};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(11,25,41,.08);">

  ${emailHdr(esc(t.hdrSub))}

  <tr><td style="padding:36px 40px 28px;">
    ${heroIcon('&#10003;', '#EBF2FA')}
    ${heroH(isDE ? 'Antrag' : 'Application', isDE ? 'eingegangen' : 'received')}
    <p style="margin:0 0 8px;font-size:16px;color:${BRAND.ink};">${esc(t.hi(name))}</p>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:${BRAND.ink2};">${esc(t.intro)}</p>

    <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${BRAND.ink3};margin-bottom:14px;">${esc(t.nextTitle)}</div>
    ${stepList(t.steps, 0)}

    ${infoCard(detailRows)}

    ${supportLine(t.questions, supportEmail)}
    ${signoff(t.signoff, t.team)}
  </td></tr>

  ${emailFtr(t.footer)}

</table>
</td></tr></table>
</body></html>`;

  return { to: reg.email, subject: t.subject(ref), html, text: htmlToText(html) };
}

// ─── Email verification OTP ───────────────────────────────────────────────

function renderOtpEmail({ firstName, email, code, lang, verifyUrl }) {
  const isDE = lang === 'de';
  const name = esc(firstName || (isDE ? 'dort' : 'there'));
  const supportEmail = process.env.EMAIL_REPLY_TO || process.env.CALENDAR_OWNER_EMAIL || 'hello@hansepay.de';

  const subject   = isDE ? 'Ihr HansePay Bestätigungscode' : 'Your HansePay verification code';
  const preheader = isDE ? `Ihr Bestätigungscode lautet: ${code}` : `Your verification code is: ${code}`;
  const footer    = isDE ? 'EU-regulierte grenzüberschreitende Zahlungen · Hamburg' : 'EU-regulated cross-border payments · Hamburg';

  const html = `<!DOCTYPE html>
<html lang="${isDE?'de':'en'}"><head>${emailHead(isDE?'de':'en', esc(subject))}</head>
<body style="margin:0;padding:0;background:${BRAND.off};font-family:${SANS};color:${BRAND.ink};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.off};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(11,25,41,.08);">

  ${emailHdr(isDE ? 'E-Mail-Verifizierung' : 'Email verification')}

  <tr><td style="padding:36px 40px 28px;">
    ${heroIcon('&#9993;', '#EBF2FA')}
    ${heroH(isDE ? 'Ihre E-Mail' : 'Verify your', isDE ? 'bestätigen' : 'email')}
    <p style="margin:0 0 8px;font-size:16px;color:${BRAND.ink};">${isDE ? `Hallo ${name},` : `Hi ${name},`}</p>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:${BRAND.ink2};">${isDE
      ? 'Klicken Sie auf den Button, um Ihre E-Mail-Adresse sofort zu bestätigen — oder geben Sie den 6-stelligen Code manuell ein.'
      : 'Click the button to verify your email instantly — or enter the 6-digit code manually.'}</p>

    ${verifyUrl ? ctaBtn(isDE ? 'E-Mail-Adresse bestätigen →' : 'Verify email address →', verifyUrl) : ''}
    ${verifyUrl ? `<p style="margin:-18px 0 22px;font-size:13px;color:${BRAND.ink3};text-align:center;">${isDE ? 'Oder geben Sie diesen Code ein:' : 'Or enter this code manually:'}</p>` : ''}

    ${codeCard(code, isDE ? 'Ihr Bestätigungscode' : 'Your verification code')}

    <p style="margin:0 0 20px;font-size:13px;line-height:1.55;color:${BRAND.ink3};text-align:center;">${isDE
      ? 'Falls Sie diesen Code nicht angefordert haben, können Sie diese E-Mail ignorieren.'
      : 'If you didn\'t request this code, you can safely ignore this email.'}</p>

    ${supportLine(isDE ? 'Fragen? Schreiben Sie uns an' : 'Questions? Reach us at', supportEmail)}
    ${signoff(isDE ? 'Mit freundlichen Grüßen,' : 'Best,', isDE ? 'Ihr HansePay-Team' : 'The HansePay Team')}
  </td></tr>

  ${emailFtr(footer)}

</table>
</td></tr></table>
</body></html>`;

  return { to: email, subject, html, text: htmlToText(html) };
}

// ─── Application approval / account activated ─────────────────────────────

const APPROVAL_COPY = {
  en: {
    subject:   (company) => `Your HansePay account has been approved — ${company}`,
    preheader: 'Your application has been reviewed and approved. Welcome to HansePay.',
    hdrSub:    'Account approved',
    hi:        (n) => `Hi ${n},`,
    intro:     'Great news! Your HansePay application has been reviewed by our compliance team and your account has been approved. You can now log in and start using the platform.',
    loginBtn:  'Access your account →',
    nextTitle: 'Next steps',
    steps: [
      { label: 'Log in to your account', desc: 'Use the button above to access your new account.' },
      { label: 'Complete your setup',    desc: 'Add payment methods and invite team members.' },
      { label: 'Start making payments',  desc: 'Send and receive cross-border payments right away.' },
    ],
    questions: 'Questions? Reply to this email or reach us at',
    signoff:   'Welcome aboard,',
    team:      'The HansePay Team',
    footer:    'EU-regulated cross-border payments · Hamburg',
    refLabel:  'Reference',
  },
  de: {
    subject:   (company) => `Ihr HansePay-Konto wurde genehmigt — ${company}`,
    preheader: 'Ihr Antrag wurde geprüft und genehmigt. Willkommen bei HansePay.',
    hdrSub:    'Konto genehmigt',
    hi:        (n) => `Hallo ${n},`,
    intro:     'Gute Neuigkeiten! Ihr HansePay-Antrag wurde von unserem Compliance-Team geprüft und Ihr Konto wurde genehmigt. Sie können die Plattform jetzt nutzen.',
    loginBtn:  'Zum Konto →',
    nextTitle: 'Nächste Schritte',
    steps: [
      { label: 'Anmelden',           desc: 'Melden Sie sich über den Link oben an.' },
      { label: 'Konto einrichten',   desc: 'Fügen Sie Zahlungsmethoden und Teammitglieder hinzu.' },
      { label: 'Zahlungen starten',  desc: 'Senden und empfangen Sie grenzüberschreitende Zahlungen.' },
    ],
    questions: 'Fragen? Antworten Sie auf diese E-Mail oder schreiben Sie uns an',
    signoff:   'Herzlich willkommen,',
    team:      'Ihr HansePay-Team',
    footer:    'EU-regulierte grenzüberschreitende Zahlungen · Hamburg',
    refLabel:  'Referenznummer',
  },
};

function renderApprovalEmail({ firstName, lastName, email, company, applicationRef, lang, loginUrl }) {
  const l    = (lang === 'de') ? 'de' : 'en';
  const isDE = l === 'de';
  const t    = APPROVAL_COPY[l];
  const ref  = esc(applicationRef || '—');
  const name = esc(firstName || (isDE ? 'dort' : 'there'));
  const co   = esc(company || `${firstName || ''} ${lastName || ''}`.trim() || email);
  const supportEmail = process.env.EMAIL_REPLY_TO || process.env.CALENDAR_OWNER_EMAIL || 'hello@hansepay.de';
  const siteBase = (process.env.PUBLIC_BASE_URL || 'https://www.hansepay.de').replace(/\/$/, '');
  const url  = loginUrl || (siteBase + '/hansepay/dashboard-login.html');

  const html = `<!DOCTYPE html>
<html lang="${l}"><head>${emailHead(l, esc(t.subject(co)))}</head>
<body style="margin:0;padding:0;background:${BRAND.off};font-family:${SANS};color:${BRAND.ink};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(t.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.off};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(11,25,41,.08);">

  ${emailHdr(esc(t.hdrSub))}

  <tr><td style="padding:36px 40px 28px;">
    ${heroIcon('&#10003;', '#EBF2FA')}
    ${heroH(isDE ? 'Konto' : 'Account', isDE ? 'genehmigt' : 'approved')}
    <p style="margin:0 0 8px;font-size:16px;color:${BRAND.ink};">${esc(t.hi(name))}</p>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:${BRAND.ink2};">${esc(t.intro)}</p>

    ${ctaBtn(t.loginBtn, url)}

    <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${BRAND.ink3};margin-bottom:14px;">${esc(t.nextTitle)}</div>
    ${stepList(t.steps)}

    ${supportLine(t.questions, supportEmail)}
    ${signoff(t.signoff, t.team)}
  </td></tr>

  ${emailFtr(t.footer)}

</table>
</td></tr></table>
</body></html>`;

  return { to: email, subject: t.subject(co), html, text: htmlToText(html) };
}

// ─── KYC identity verification invite ────────────────────────────────────

function renderKycInviteEmail({ recipientName, recipientEmail, companyName, inviterName, kycUrl, lang, isIndividual }) {
  const l   = (lang === 'de') ? 'de' : 'en';
  const ind = !!isIndividual;
  const name = esc(recipientName || (l === 'de' ? 'dort' : 'there'));
  const co   = esc(companyName || 'your company');
  const inv  = esc(inviterName || 'The HansePay Team');
  const url  = kycUrl || '#';
  const isDE = l === 'de';
  const supportEmail = process.env.EMAIL_REPLY_TO || process.env.CALENDAR_OWNER_EMAIL || 'hello@hansepay.de';

  const subject = isDE
    ? `Identitätsverifizierung erforderlich — ${ind ? 'HansePay' : (companyName || 'HansePay')}`
    : `Identity verification required — ${ind ? 'HansePay' : (companyName || 'HansePay')}`;
  const preheader = ind
    ? (isDE ? 'Bitte schließen Sie Ihre Identitätsverifizierung ab, um Ihr Konto zu aktivieren.'
            : 'Please complete your identity verification to activate your account.')
    : (isDE ? `${inviterName || 'HansePay'} hat Sie zur Identitätsverifizierung eingeladen.`
            : `${inviterName || 'HansePay'} has invited you to complete identity verification.`);
  const hdrSub = ind ? (isDE ? 'ID-Verifizierung' : 'ID verification') : (isDE ? 'KYC-Verifizierung' : 'KYC verification');
  const intro  = ind
    ? (isDE
        ? 'Um Ihren HansePay-Antrag abzuschließen, müssen wir Ihre Identität verifizieren. Dies ist ein gesetzlich vorgeschriebener Schritt, der nur wenige Minuten in Anspruch nimmt.'
        : 'To complete your HansePay application, we need to verify your identity. This is a legally required step that only takes a few minutes.')
    : (isDE
        ? `${inv} hat Sie eingeladen, die Identitätsverifizierung für <b>${co}</b> abzuschließen. Dies ist ein regulatorisch erforderlicher Schritt zur Kontoaktivierung.`
        : `${inv} has invited you to complete identity verification for <b>${co}</b>. This is a required regulatory step to activate your account.`);
  const steps = isDE
    ? ['Klicken Sie unten auf den Button, um den gesicherten Verifizierungsprozess zu starten.', 'Halten Sie Ihren Personalausweis oder Reisepass bereit.', 'Der Prozess dauert in der Regel 3–5 Minuten.']
    : ['Click the button below to start the secure verification process.', 'Have your government-issued ID or passport ready.', 'The process typically takes 3–5 minutes.'];
  const note = isDE
    ? 'Dieser Link ist sicher und wird von unserem KYC-Partner Signicat bereitgestellt. Er ist für Sie persönlich — bitte nicht weitergeben.'
    : 'This link is secure and powered by our KYC partner Signicat. It is personal to you — please do not share it.';
  const footer = isDE ? 'EU-regulierte grenzüberschreitende Zahlungen · Hamburg' : 'EU-regulated cross-border payments · Hamburg';

  const html = `<!DOCTYPE html>
<html lang="${l}"><head>${emailHead(l, esc(subject))}</head>
<body style="margin:0;padding:0;background:${BRAND.off};font-family:${SANS};color:${BRAND.ink};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.off};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(11,25,41,.08);">

  ${emailHdr(esc(hdrSub))}

  <tr><td style="padding:36px 40px 28px;">
    ${heroIcon('&#127987;&#65039;', '#EBF2FA')}
    ${heroH(isDE ? 'Identität' : 'Verify your', isDE ? 'verifizieren' : 'identity')}
    <p style="margin:0 0 8px;font-size:16px;color:${BRAND.ink};">${isDE ? `Hallo ${name},` : `Hi ${name},`}</p>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:${BRAND.ink2};">${intro}</p>

    ${ctaBtn(isDE ? 'Identität verifizieren →' : 'Verify identity →', url)}

    <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${BRAND.ink3};margin-bottom:14px;">${isDE ? 'Was passiert als nächstes' : 'What to expect'}</div>
    ${stepList(steps)}

    <table role="presentation" width="100%" style="background:#F7F9FC;border-left:3px solid ${BRAND.blue2};border-radius:6px;margin:0 0 26px;">
      <tr><td style="padding:13px 18px;font-size:13px;line-height:1.6;color:${BRAND.ink2};">${esc(note)}</td></tr>
    </table>

    ${supportLine(isDE ? 'Fragen? Schreiben Sie uns an' : 'Questions? Reach us at', supportEmail)}
    ${signoff(isDE ? 'Mit freundlichen Grüßen,' : 'Best regards,', isDE ? 'Das HansePay-Team' : 'The HansePay Team')}
  </td></tr>

  ${emailFtr(footer)}

</table>
</td></tr></table>
</body></html>`;

  return { to: recipientEmail, subject, html, text: htmlToText(html) };
}

// ─── KYC identity verified ────────────────────────────────────────────────

function renderKycVerifiedEmail({ firstName, email, lang }) {
  const l    = (lang === 'de') ? 'de' : 'en';
  const isDE = l === 'de';
  const name = esc(firstName || (isDE ? 'dort' : 'there'));
  const supportEmail = process.env.EMAIL_REPLY_TO || process.env.CALENDAR_OWNER_EMAIL || 'hello@hansepay.de';

  const subject   = isDE ? 'Ihre Identität wurde verifiziert — HansePay' : 'Your identity has been verified — HansePay';
  const preheader = isDE ? 'Ihre Identitätsprüfung war erfolgreich.' : 'Your identity check was successful. Your application continues.';
  const footer    = isDE ? 'EU-regulierte grenzüberschreitende Zahlungen · Hamburg' : 'EU-regulated cross-border payments · Hamburg';

  const steps = isDE ? [
    { label: 'E-Mail bestätigt' },
    { label: 'Identität verifiziert' },
    { label: 'Compliance-Prüfung' },
    { label: 'Konto aktiviert' },
  ] : [
    { label: 'Email verified' },
    { label: 'Identity verified' },
    { label: 'Compliance review' },
    { label: 'Account activated' },
  ];

  const html = `<!DOCTYPE html>
<html lang="${l}"><head>${emailHead(l, esc(subject))}</head>
<body style="margin:0;padding:0;background:${BRAND.off};font-family:${SANS};color:${BRAND.ink};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.off};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(11,25,41,.08);">

  ${emailHdr(isDE ? 'Identität verifiziert' : 'Identity verified')}

  <tr><td style="padding:36px 40px 28px;">
    ${heroIcon('&#10003;', '#E8F4EE')}
    ${heroH(isDE ? 'KYC-Verifizierung' : 'KYC verification', isDE ? 'abgeschlossen' : 'complete')}
    <p style="margin:0 0 8px;font-size:16px;color:${BRAND.ink};">${isDE ? `Hallo ${name},` : `Hi ${name},`}</p>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:${BRAND.ink2};">${isDE
      ? 'Ihre Identitätsdokumente wurden erfolgreich geprüft und verifiziert. Ihr Antrag befindet sich nun in der Compliance-Prüfungsphase — wir melden uns in Kürze.'
      : 'Great news — your identity verification has been successfully completed. Your account is now under final review and will be ready shortly. We\'ll be in touch as soon as everything is set up.'}</p>

    <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${BRAND.ink3};margin-bottom:14px;">${isDE ? 'Ihr Fortschritt' : 'Your progress'}</div>
    ${stepList(steps, 2)}

    ${supportLine(isDE ? 'Fragen? Schreiben Sie uns an' : 'Have questions? Our support team is here to help at', supportEmail)}
    ${signoff(isDE ? 'Mit freundlichen Grüßen,' : 'Best regards,', isDE ? 'Das HansePay-Team' : 'The HansePay Team')}
  </td></tr>

  ${emailFtr(footer)}

</table>
</td></tr></table>
</body></html>`;

  return { to: email, subject, html, text: htmlToText(html) };
}

// ─── All verifications complete ───────────────────────────────────────────

function renderAllVerificationsEmail({ firstName, email, lang, accountType, company }) {
  const l    = (lang === 'de') ? 'de' : 'en';
  const isDE = l === 'de';
  const isBiz = accountType === 'business' || accountType === 'company';
  const name = esc(firstName || (isDE ? 'dort' : 'there'));
  const supportEmail = process.env.EMAIL_REPLY_TO || process.env.CALENDAR_OWNER_EMAIL || 'hello@hansepay.de';

  const subject   = isDE ? 'Alle Prüfungen abgeschlossen — fast geschafft!' : 'All checks complete — almost there!';
  const preheader = isDE ? 'Alle Prüfungen sind abgeschlossen. Ihr Konto wird in Kürze aktiviert.' : 'All checks are done. Your account will be activated shortly.';
  const footer    = isDE ? 'EU-regulierte grenzüberschreitende Zahlungen · Hamburg' : 'EU-regulated cross-border payments · Hamburg';

  const checks = isDE
    ? ['E-Mail-Adresse bestätigt', 'Identität verifiziert', isBiz ? 'Unternehmensdokumente geprüft' : 'Dokumente geprüft']
    : ['Email address confirmed', 'Identity verified', isBiz ? 'Company documents reviewed' : 'Documents reviewed'];

  const html = `<!DOCTYPE html>
<html lang="${l}"><head>${emailHead(l, esc(subject))}</head>
<body style="margin:0;padding:0;background:${BRAND.off};font-family:${SANS};color:${BRAND.ink};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.off};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(11,25,41,.08);">

  ${emailHdr(isDE ? 'Prüfungen abgeschlossen' : 'Checks complete')}

  <tr><td style="padding:36px 40px 28px;">
    ${heroIcon('&#10003;&#10003;', '#E8F4EE')}
    ${heroH(isDE ? 'Alle Prüfungen' : 'All checks', isDE ? 'bestätigt' : 'confirmed')}
    <p style="margin:0 0 8px;font-size:16px;color:${BRAND.ink};">${isDE ? `Hallo ${name},` : `Hi ${name},`}</p>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:${BRAND.ink2};">${isDE
      ? 'Alle erforderlichen Prüfungen für Ihr HansePay-Konto sind abgeschlossen. Unser Team bereitet die Aktivierung Ihres Kontos vor — Sie erhalten in Kürze eine letzte Bestätigungs-E-Mail.'
      : 'All required checks for your HansePay account are complete. Our team is preparing your account activation — you\'ll receive a final confirmation email shortly.'}</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F9FC;border:1px solid ${BRAND.line};border-radius:12px;margin:0 0 26px;">
      <tr><td style="padding:16px 22px 10px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${BRAND.ink3};margin-bottom:12px;">${isDE ? 'Abgeschlossene Prüfungen' : 'Completed checks'}</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${checks.map(c => `<tr>
            <td valign="top" width="28" style="padding:5px 10px 5px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                <td width="22" height="22" bgcolor="${BRAND.blue}" style="background:${BRAND.blue};border-radius:11px;text-align:center;line-height:22px;font-size:12px;font-weight:700;color:#fff;">&#10003;</td>
              </tr></table>
            </td>
            <td style="font-size:14px;color:${BRAND.ink2};padding:5px 0;">${esc(c)}</td>
          </tr>`).join('')}
        </table>
      </td></tr>
    </table>

    ${supportLine(isDE ? 'Fragen? Schreiben Sie uns an' : 'Questions? Reach us at', supportEmail)}
    ${signoff(isDE ? 'Mit freundlichen Grüßen,' : 'Best regards,', isDE ? 'Das HansePay-Team' : 'The HansePay Team')}
  </td></tr>

  ${emailFtr(footer)}

</table>
</td></tr></table>
</body></html>`;

  return { to: email, subject, html, text: htmlToText(html) };
}

// ─── Transaction authorisation OTP ───────────────────────────────────────

function renderTxOtpEmail({ firstName, email, code, tx }) {
  tx = tx || {};
  const name    = esc(firstName || 'there');
  const amt     = tx.sendAmount ? `${tx.sendCurrency || 'EUR'} ${tx.sendAmount}`
                : tx.amount     ? `€${tx.amount}`
                : tx.amt        ? `${tx.receiveCurrency || tx.currency || ''} ${tx.amt}`.trim()
                : '';
  const recip   = esc(tx.recipientName || tx.recipient || 'recipient');
  const subject = 'HansePay — Confirm your transfer';
  const preheader = `Your transfer authorisation code: ${code}`;
  const supportEmail = process.env.EMAIL_REPLY_TO || process.env.CALENDAR_OWNER_EMAIL || 'hello@hansepay.de';

  const html = `<!DOCTYPE html>
<html lang="en"><head>${emailHead('en', esc(subject))}</head>
<body style="margin:0;padding:0;background:${BRAND.off};font-family:${SANS};color:${BRAND.ink};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.off};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(11,25,41,.08);">

  ${emailHdr('Authorise transfer')}

  <tr><td style="padding:36px 40px 28px;">
    ${heroIcon('&#8594;', '#EBF2FA')}
    ${heroH('Confirm your', 'transfer')}
    <p style="margin:0 0 8px;font-size:16px;color:${BRAND.ink};">Hi ${name},</p>
    ${amt ? `<p style="margin:0 0 8px;font-size:18px;font-weight:700;color:${BRAND.navy};text-align:center;">${esc(amt)}</p>` : ''}
    <p style="margin:0 0 6px;font-size:14px;color:${BRAND.ink3};text-align:center;">to ${recip}</p>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:${BRAND.ink2};">We received a request to authorise this transfer. Enter the code below to confirm — it expires in 10 minutes.</p>

    ${codeCard(code, 'Authorisation code')}

    <p style="margin:0 0 20px;font-size:13px;line-height:1.55;color:${BRAND.ink3};text-align:center;">If you did not initiate this transfer, contact us immediately at <a href="mailto:${esc(supportEmail)}" style="color:${BRAND.blue2};text-decoration:none;">${esc(supportEmail)}</a></p>
    ${signoff('Best,', 'The HansePay Team')}
  </td></tr>

  ${emailFtr('EU-regulated cross-border payments · Hamburg')}

</table>
</td></tr></table>
</body></html>`;

  return { to: email, subject, html, text: htmlToText(html) };
}

// ─── Transaction confirmation ─────────────────────────────────────────────

function renderTransactionEmail({ tx }) {
  tx = tx || {};
  const to        = tx.userEmail;
  const firstName = esc(tx.firstName || '');
  const hi        = firstName ? `Hi ${firstName},` : 'Hi there,';
  const recip     = esc(tx.recipientName || tx.recipient || 'your recipient');
  const hasSend   = !!(tx.sendAmount || tx.amount);
  const sendAmt   = tx.sendAmount ? esc(String(tx.sendAmount)) : tx.amount ? esc(String(tx.amount)) : (tx.amt ? esc(String(tx.amt)) : '—');
  const sendCur   = hasSend ? esc(tx.sendCurrency || 'EUR') : esc(tx.receiveCurrency || tx.currency || 'EUR');
  const recvAmt   = tx.receiveAmount ? esc(String(tx.receiveAmount)) : (!hasSend ? null : (tx.amt ? esc(String(tx.amt)) : null));
  const recvCur   = esc(tx.receiveCurrency || tx.currency || '');
  const ref       = esc(tx.reference || tx.id || '');
  const subject   = `HansePay — Your transfer to ${tx.recipientName || tx.recipient || 'recipient'} is confirmed`;
  const preheader = `${sendCur}${sendAmt} is on its way to ${tx.recipientName || tx.recipient || 'your recipient'}`;
  const supportEmail = process.env.EMAIL_REPLY_TO || process.env.CALENDAR_OWNER_EMAIL || 'hello@hansepay.de';
  const now       = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' });

  const rows = [
    ['Transfer to',   recip],
    ['Amount sent',   `${sendCur} ${sendAmt}`],
    recvAmt ? ['Amount received', `${recvCur} ${recvAmt}`] : null,
    ['Date',          esc(tx.date || now)],
    ref ? ['Reference', ref] : null,
  ].filter(Boolean);

  const html = `<!DOCTYPE html>
<html lang="en"><head>${emailHead('en', esc(subject))}</head>
<body style="margin:0;padding:0;background:${BRAND.off};font-family:${SANS};color:${BRAND.ink};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.off};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(11,25,41,.08);">

  ${emailHdr('Transfer confirmed')}

  <tr><td style="padding:36px 40px 28px;">
    ${heroIcon('&#10003;', '#E8F4EE')}
    ${heroH('Transfer', 'confirmed')}
    <p style="margin:0 0 24px;font-size:16px;color:${BRAND.ink};">${hi}</p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:${BRAND.ink2};">Your transfer has been authorised and is being processed. Funds typically arrive within 1–2 business days.</p>

    ${infoCard(rows)}

    <p style="margin:0 0 20px;font-size:13px;line-height:1.55;color:${BRAND.ink3};text-align:center;">Questions about this transfer? Contact us at <a href="mailto:${esc(supportEmail)}" style="color:${BRAND.blue2};text-decoration:none;">${esc(supportEmail)}</a></p>
    ${signoff('Best,', 'The HansePay Team')}
  </td></tr>

  ${emailFtr('EU-regulated cross-border payments · Hamburg')}

</table>
</td></tr></table>
</body></html>`;

  return { to, subject, html, text: htmlToText(html) };
}

// ─── Password reset ───────────────────────────────────────────────────────

function renderPasswordResetEmail({ firstName, email, code }) {
  const name = esc(firstName || 'there');
  const subject  = 'Reset your HansePay password';
  const preheader = `Your password reset code: ${code}. Valid for 15 minutes.`;
  const supportEmail = process.env.EMAIL_REPLY_TO || process.env.CALENDAR_OWNER_EMAIL || 'hello@hansepay.de';

  const html = `<!DOCTYPE html>
<html lang="en"><head>${emailHead('en', esc(subject))}</head>
<body style="margin:0;padding:0;background:${BRAND.off};font-family:${SANS};color:${BRAND.ink};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.off};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(11,25,41,.08);">

  ${emailHdr('Password reset')}

  <tr><td style="padding:36px 40px 28px;">
    ${heroIcon('&#128274;', '#EBF2FA')}
    ${heroH('Reset your', 'password')}
    <p style="margin:0 0 8px;font-size:16px;color:${BRAND.ink};">Hi ${name},</p>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:${BRAND.ink2};">We received a request to reset the password for your HansePay account. Enter the code below in the reset form to choose a new password.</p>

    ${codeCard(code, 'Your reset code')}
    <p style="margin:-12px 0 22px;font-size:12px;color:${BRAND.ink3};text-align:center;">Valid for 15 minutes</p>

    <table role="presentation" width="100%" style="background:#FFFBEB;border-left:3px solid #F59E0B;border-radius:6px;margin:0 0 24px;">
      <tr><td style="padding:13px 18px;font-size:13px;line-height:1.6;color:#92400E;">If you didn't request a password reset, you can safely ignore this email. Your password won't change.</td></tr>
    </table>

    ${supportLine("Questions? Reach us at", supportEmail)}
    ${signoff('Best,', 'The HansePay Team')}
  </td></tr>

  ${emailFtr('EU-regulated cross-border payments · Hamburg')}

</table>
</td></tr></table>
</body></html>`;

  return { to: email, subject, html, text: htmlToText(html) };
}

module.exports = {
  sendMail,
  renderBookingEmail,
  renderRegistrationEmail,
  renderOtpEmail,
  renderApprovalEmail,
  renderKycInviteEmail,
  renderKycVerifiedEmail,
  renderAllVerificationsEmail,
  renderTxOtpEmail,
  renderTransactionEmail,
  renderPasswordResetEmail,
  gmailConfigured,
};
