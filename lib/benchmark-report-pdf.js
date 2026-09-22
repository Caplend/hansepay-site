'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  HansePay Benchmark Report PDF — a public, citable reference document per
//  payment corridor. Deliberately NOT gated behind email (unlike the
//  calculator's personal breakdown PDF): the point is maximum shareability,
//  with every page footer linking back to the source page so citations
//  convert rather than dead-end in a downloaded file.
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
const GOLD = '#C9A961';

const PAGE_W = 595.28;
const ML = 60, MR = 60;
const CW = PAGE_W - ML - MR;

const F = { regular: 'Inter', medium: 'Inter-Medium', semibold: 'Inter-SemiBold', bold: 'Inter-Bold', playfair: 'PlayfairDisplay' };

function registerFonts(pdf) {
  pdf.registerFont(F.regular, path.join(FONTS, 'Inter-Regular.ttf'));
  pdf.registerFont(F.medium, path.join(FONTS, 'Inter-Medium.ttf'));
  pdf.registerFont(F.semibold, path.join(FONTS, 'Inter-SemiBold.ttf'));
  pdf.registerFont(F.bold, path.join(FONTS, 'Inter-Bold.ttf'));
  pdf.registerFont(F.playfair, path.join(FONTS, 'PlayfairDisplay.ttf'));
}

function addFooter(pdf, pageUrl) {
  const y = 790;
  pdf.font(F.regular).fontSize(8.5).fillColor(MUTED);
  pdf.text(`HansePay · Atrya Technologies SIA · ${pageUrl}`, ML, y, { width: CW, align: 'center' });
}

/** report = one entry from BENCHMARK_REPORTS */
function generateBenchmarkReportPdf(report, res) {
  const pdf = new PDFDocument({
    size: 'A4',
    margins: { top: 70, bottom: 70, left: ML, right: MR },
    info: {
      Title: `HansePay Benchmark Report — Zahlungskorridor ${report.country}`,
      Author: 'HansePay | Atrya Technologies SIA',
      Subject: `Kosten und Konditionen grenzüberschreitender Zahlungen: Deutschland–${report.country}`,
    },
  });

  registerFonts(pdf);
  const pageUrl = `hansepay.de/zahlungen/${report.slug}/`;
  const today = new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="hansepay-benchmark-report-${report.slug}.pdf"`);
  pdf.pipe(res);

  // ── Cover ──
  try { pdf.image(LOGO, ML, 70, { height: 32 }); } catch (e) {}
  pdf.font(F.medium).fontSize(10).fillColor(BLUE).text('BENCHMARK REPORT', ML, 130);
  pdf.font(F.playfair).fontSize(30).fillColor(NAVY).text(`Zahlungskorridor Deutschland–${report.country}`, ML, 152, { width: CW });
  pdf.font(F.regular).fontSize(11).fillColor(MUTED).text(
    `Kosten, Laufzeit und Konditionen grenzüberschreitender Zahlungen — Stand ${today}.`,
    ML, pdf.y + 10, { width: CW }
  );

  // Stat row
  let sy = pdf.y + 30;
  const statW = CW / 3;
  report.stats.forEach((s, i) => {
    const x = ML + i * statW;
    pdf.font(F.bold).fontSize(16).fillColor(NAVY).text(s[0], x, sy, { width: statW - 12 });
    pdf.font(F.regular).fontSize(9).fillColor(MUTED).text(s[1], x, pdf.y + 2, { width: statW - 12 });
  });

  sy = Math.max(sy + 60, pdf.y + 20);
  pdf.moveTo(ML, sy).lineTo(ML + CW, sy).strokeColor(BORDER).lineWidth(0.75).stroke();

  // ── Findings ──
  let y = sy + 24;
  pdf.font(F.semibold).fontSize(13).fillColor(NAVY).text('Wichtigste Erkenntnisse', ML, y);
  y = pdf.y + 12;
  report.findings.forEach((finding, i) => {
    pdf.font(F.bold).fontSize(10).fillColor(BLUE).text(`${i + 1}`, ML, y, { width: 20 });
    pdf.font(F.regular).fontSize(10.5).fillColor(INK).text(finding, ML + 24, y, { width: CW - 24, lineGap: 2 });
    y = pdf.y + 14;
  });

  // ── Cost structure box ──
  y += 8;
  pdf.roundedRect(ML, y, CW, 96, 8).fillColor(BG_BOX).fill();
  pdf.font(F.semibold).fontSize(11).fillColor(NAVY).text('Typische Kostenstruktur', ML + 20, y + 16);
  pdf.font(F.regular).fontSize(9.5).fillColor(INK);
  const col1 = ML + 20, col2 = ML + CW / 2 + 10;
  pdf.text(`Wechselkurs-Aufschlag: ${report.costRange}`, col1, y + 40, { width: CW / 2 - 30 });
  pdf.text(`Grundgebühr: 5–50 € je Zahlung`, col1, y + 58, { width: CW / 2 - 30 });
  pdf.text(`Referenz-Jahresvolumen: ${report.avgVolume}`, col2, y + 40, { width: CW / 2 - 30 });
  pdf.text(`Angenommener Aufschlag: ${report.avgMarkup}`, col2, y + 58, { width: CW / 2 - 30 });

  y += 96 + 24;

  // ── Sources ──
  pdf.font(F.semibold).fontSize(11).fillColor(NAVY).text('Quellen', ML, y);
  y = pdf.y + 8;
  report.sources.forEach(src => {
    pdf.font(F.regular).fontSize(9).fillColor(MUTED).text(`· ${src}`, ML, y, { width: CW });
    y = pdf.y + 4;
  });

  // ── CTA ──
  y += 20;
  pdf.roundedRect(ML, y, CW, 64, 8).fillColor(NAVY).fill();
  pdf.font(F.semibold).fontSize(11).fillColor('#FFFFFF').text(
    `Vollständige Analyse und Ersparnisrechner: ${pageUrl}`,
    ML + 20, y + 24, { width: CW - 40 }
  );

  // ── Disclaimer ──
  y += 64 + 20;
  pdf.font(F.regular).fontSize(8).fillColor(MUTED).text(
    'Dieser Bericht fasst öffentlich verfügbare Marktdaten und HansePay-Analysen zusammen. Er stellt kein verbindliches Angebot dar ' +
    'und ersetzt keine individuelle Beratung. HansePay ist eine Marke der Atrya Technologies SIA, beaufsichtigt durch die Latvijas Banka, ' +
    'tätig in Deutschland über EU-Passporting.',
    ML, y, { width: CW, lineGap: 2 }
  );

  addFooter(pdf, pageUrl);
  pdf.end();
}

module.exports = { generateBenchmarkReportPdf };
