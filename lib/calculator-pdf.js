'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  HansePay Calculator PDF generator — the full savings breakdown, gated
//  behind an email address on the landing pages. Same font/colour system as
//  lib/legal-pdf.js so it feels like the same brand, but a bespoke layout
//  (this isn't a legal document, it's a one-page result sheet).
// ─────────────────────────────────────────────────────────────────────────────

const PDFDocument = require('pdfkit');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets');
const FONTS = path.join(ASSETS, 'fonts');
const LOGO = path.join(ASSETS, 'hansepay-mark-uploaded.png');

const NAVY = '#0D2A4C';
const BLUE = '#1D72B8';
const INK = '#1E293B';
const MUTED = '#64748B';
const BORDER = '#E2E8F0';
const BG_BOX = '#F0F7FF';
const GREEN = '#16A34A';
const WHITE = '#FFFFFF';

const PAGE_W = 595.28;
const ML = 60, MR = 60;
const CW = PAGE_W - ML - MR;

const F = { regular: 'Inter', medium: 'Inter-Medium', semibold: 'Inter-SemiBold', bold: 'Inter-Bold', serif: 'LibreBaskerville', playfair: 'PlayfairDisplay' };

function registerFonts(pdf) {
  pdf.registerFont(F.regular, path.join(FONTS, 'Inter-Regular.ttf'));
  pdf.registerFont(F.medium, path.join(FONTS, 'Inter-Medium.ttf'));
  pdf.registerFont(F.semibold, path.join(FONTS, 'Inter-SemiBold.ttf'));
  pdf.registerFont(F.bold, path.join(FONTS, 'Inter-Bold.ttf'));
  pdf.registerFont(F.serif, path.join(FONTS, 'LibreBaskerville.ttf'));
  pdf.registerFont(F.playfair, path.join(FONTS, 'PlayfairDisplay.ttf'));
}

function fmtEUR(n) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);
}

function breakdownRow(pdf, y, label, value, opts) {
  opts = opts || {};
  pdf.font(opts.bold ? F.semibold : F.regular).fontSize(11).fillColor(opts.color || INK);
  pdf.text(label, ML, y, { width: CW * 0.62 });
  pdf.font(opts.bold ? F.semibold : F.regular).fontSize(11).fillColor(opts.color || INK);
  pdf.text(value, ML + CW * 0.62, y, { width: CW * 0.38, align: 'right' });
  return y + 22;
}

/** lead = a calculator_leads row (camelCase); result fields are on lead directly. */
function generateCalculatorPdf(lead, res) {
  const pdf = new PDFDocument({
    size: 'A4',
    margins: { top: 70, bottom: 60, left: ML, right: MR },
    info: { Title: 'HansePay — Ihre Ersparnis-Analyse', Author: 'HansePay | Atrya Technologies SIA', Creator: 'HansePay' },
  });

  registerFonts(pdf);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="hansepay-ersparnis-analyse.pdf"');
  pdf.pipe(res);

  // ── Header ──
  try { pdf.image(LOGO, ML, 44, { height: 22 }); } catch (e) { /* logo optional */ }
  pdf.font(F.medium).fontSize(9).fillColor(MUTED).text('ERSPARNIS-ANALYSE', ML, 78, { width: CW });

  // ── Title ──
  pdf.font(F.playfair).fontSize(26).fillColor(NAVY);
  pdf.text('Ihre grenzüberschreitenden Zahlungen — die Zahlen.', ML, 116, { width: CW });

  const country = lead.country ? ` nach ${lead.country}` : '';
  pdf.font(F.regular).fontSize(11).fillColor(MUTED);
  pdf.text(`Berechnet auf Basis Ihrer Angaben für Zahlungen${country} (${lead.currency || 'FX'}).`, ML, pdf.y + 8, { width: CW });

  // ── Headline saving box ──
  const boxY = pdf.y + 24;
  pdf.roundedRect(ML, boxY, CW, 92, 10).fillColor(BG_BOX).fill();
  pdf.font(F.regular).fontSize(10).fillColor(MUTED).text('Geschätzte jährliche Ersparnis mit HansePay', ML + 24, boxY + 18);
  pdf.font(F.playfair).fontSize(36).fillColor(GREEN).text(fmtEUR(lead.saving), ML + 24, boxY + 34);

  // ── Breakdown ──
  let y = boxY + 92 + 36;
  pdf.font(F.semibold).fontSize(13).fillColor(NAVY).text('Aufschlüsselung', ML, y);
  y += 26;

  y = breakdownRow(pdf, y, `Jahresvolumen`, fmtEUR(lead.volume));
  y = breakdownRow(pdf, y, `Zahlungen pro Jahr`, String(lead.paymentCount || lead.count || 0));
  y += 6;
  pdf.moveTo(ML, y).lineTo(ML + CW, y).strokeColor(BORDER).lineWidth(0.75).stroke();
  y += 16;

  y = breakdownRow(pdf, y, 'Wechselkurs-Aufschlag Ihrer Bank', fmtEUR((lead.volume || 0) * (lead.markup || 0)));
  y = breakdownRow(pdf, y, `Grundgebühren (${lead.paymentCount || lead.count || 0}× 25 €)`, fmtEUR(25 * (lead.paymentCount || lead.count || 0)));
  y = breakdownRow(pdf, y, `Fremdspesen Korrespondenzbanken (${lead.paymentCount || lead.count || 0}× 40 €)`, fmtEUR(40 * (lead.paymentCount || lead.count || 0)));
  y += 6;
  pdf.moveTo(ML, y).lineTo(ML + CW, y).strokeColor(BORDER).lineWidth(0.75).stroke();
  y += 16;

  y = breakdownRow(pdf, y, 'Aktuelle Kosten (geschätzt)', fmtEUR(lead.currentCost), { bold: true });
  y = breakdownRow(pdf, y, 'Kosten mit HansePay (geschätzt)', fmtEUR(lead.hansepayCost), { bold: true, color: GREEN });

  y += 20;
  pdf.moveTo(ML, y).lineTo(ML + CW, y).strokeColor(NAVY).lineWidth(1.25).stroke();
  y += 16;
  pdf.font(F.bold).fontSize(14).fillColor(NAVY).text('Jährliche Ersparnis', ML, y, { width: CW * 0.62 });
  pdf.font(F.bold).fontSize(14).fillColor(GREEN).text(fmtEUR(lead.saving), ML + CW * 0.62, y, { width: CW * 0.38, align: 'right' });
  y += 40;

  // ── Disclaimer ──
  pdf.font(F.regular).fontSize(9).fillColor(MUTED);
  pdf.text(
    'Diese Berechnung ist eine Schätzung auf Basis marktüblicher Aufschläge und Bankgebühren zum Zeitpunkt der Berechnung. ' +
    'Sie stellt kein verbindliches Angebot dar. Ihre tatsächliche Ersparnis hängt von Ihrem individuellen Zahlungsverkehr ab. ' +
    'HansePay ist eine Marke der Atrya Technologies SIA, beaufsichtigt durch die Latvijas Banka.',
    ML, y, { width: CW, lineGap: 2 }
  );

  // ── Footer ──
  pdf.font(F.regular).fontSize(8.5).fillColor(MUTED)
    .text('HansePay · Atrya Technologies SIA · hansepay.de', ML, 780, { width: CW, align: 'center' });

  pdf.end();
}

module.exports = { generateCalculatorPdf };
