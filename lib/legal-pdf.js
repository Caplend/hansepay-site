'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  HansePay Legal PDF generator
//  Brand fonts: Libre Baskerville (wordmark + titles) — matches the website
//               Playfair Display (section titles)
//               Inter (body, labels, footer)
// ─────────────────────────────────────────────────────────────────────────────

const PDFDocument = require('pdfkit');
const fs          = require('fs');
const path        = require('path');

// ── Paths ─────────────────────────────────────────────────────────────────────
const ASSETS = path.join(__dirname, '..', 'assets');
const FONTS  = path.join(ASSETS,  'fonts');
const LOGO   = path.join(ASSETS,  'hansepay-mark-uploaded.png');   // dark version

// ── Design tokens ─────────────────────────────────────────────────────────────
const NAVY   = '#0D2A4C';
const BLUE   = '#1D72B8';
const INK    = '#1E293B';
const MUTED  = '#64748B';
const SUBTLE = '#94A3B8';
const BORDER = '#E2E8F0';
const BG_BOX = '#F0F7FF';
const STRIPE = '#F8FAFC';
const WHITE  = '#FFFFFF';

// ── Layout ───────────────────────────────────────────────────────────────────
const PAGE_W   = 595.28;   // A4 points
const PAGE_H   = 841.89;
const ML       = 60;       // left margin
const MR       = 60;       // right margin
const CW       = PAGE_W - ML - MR;   // ≈ 475 pt content width
const HDR_ZONE = 46;       // header chrome height
const FTR_ZONE = 38;       // footer chrome height
const CONTENT_TOP    = HDR_ZONE + 18;   // top margin for body text
const CONTENT_BOTTOM = FTR_ZONE + 20;   // bottom margin for body text

// ── Font helpers ──────────────────────────────────────────────────────────────
const FONT_NAMES = {
  // Body / UI — Inter (full extended Latin)
  regular:   'Inter',
  medium:    'Inter-Medium',
  semibold:  'Inter-SemiBold',
  bold:      'Inter-Bold',
  // Brand / display — matches hansepay.com
  serif:     'LibreBaskerville',       // HansePay wordmark, doc titles
  playfair:  'PlayfairDisplay',        // section titles (H2)
};

function registerFonts(pdf) {
  pdf.registerFont(FONT_NAMES.regular,  path.join(FONTS, 'Inter-Regular.ttf'));
  pdf.registerFont(FONT_NAMES.medium,   path.join(FONTS, 'Inter-Medium.ttf'));
  pdf.registerFont(FONT_NAMES.semibold, path.join(FONTS, 'Inter-SemiBold.ttf'));
  pdf.registerFont(FONT_NAMES.bold,     path.join(FONTS, 'Inter-Bold.ttf'));
  pdf.registerFont(FONT_NAMES.serif,    path.join(FONTS, 'LibreBaskerville.ttf'));
  pdf.registerFont(FONT_NAMES.playfair, path.join(FONTS, 'PlayfairDisplay.ttf'));
}

// ── HTML → AST ────────────────────────────────────────────────────────────────

function decode(s) {
  return (s || '')
    .replace(/&amp;/g,    '&')
    .replace(/&lt;/g,     '<')
    .replace(/&gt;/g,     '>')
    .replace(/&nbsp;/g,   ' ')
    .replace(/&middot;/g, '·')
    .replace(/&ndash;/g,  '–')
    .replace(/&mdash;/g,  '—')
    .replace(/&laquo;/g,  '«')
    .replace(/&raquo;/g,  '»')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&[a-z]+;/g, '');
}

function stripTags(html) {
  return decode(html.replace(/<[^>]+>/g, ' ').replace(/[ \t]+/g, ' ').trim());
}

// Parse inline HTML → [{text, bold?, italic?, link?}]
// Preserves \n from <br> conversions (does NOT collapse with spaces)
function parseInline(html) {
  const segs = [];
  // Use a sentinel so \n from <br> doesn't get whitespace-collapsed
  let rem = html.replace(/<br\s*\/?>/gi, '\x02');

  while (rem.length) {
    let m;

    m = rem.match(/^<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/i);
    if (m) {
      const inner = parseInline(m[1].replace(/\x02/g, '\n'));
      inner.forEach(s => segs.push({ ...s, bold: true }));
      rem = rem.slice(m[0].length); continue;
    }

    m = rem.match(/^<(?:em|i)[^>]*>([\s\S]*?)<\/(?:em|i)>/i);
    if (m) {
      const t = stripTags(m[1]).replace(/\x02/g, '\n');
      if (t.trim()) segs.push({ text: t, italic: true });
      rem = rem.slice(m[0].length); continue;
    }

    m = rem.match(/^<a[^>]*>([\s\S]*?)<\/a>/i);
    if (m) {
      const t = stripTags(m[1]).replace(/\x02/g, '\n');
      if (t.trim()) segs.push({ text: t, link: true });
      rem = rem.slice(m[0].length); continue;
    }

    m = rem.match(/^<[^>]+>/);
    if (m) { rem = rem.slice(m[0].length); continue; }

    m = rem.match(/^[^<]+/);
    if (m) {
      const t = decode(m[0])
        .replace(/\x02/g, '\n')
        .replace(/[ \t\r]+/g, ' ')      // collapse horizontal space only
        .replace(/\n[ \t]+/g, '\n')     // trim indent after newline
        .replace(/[ \t]+\n/g, '\n')     // trim trailing space before newline
        .replace(/\n{2,}/g, '\n');      // collapse double-\n from <br>\n sequences
      if (t.replace(/\s/g, '').length) segs.push({ text: t });
      rem = rem.slice(m[0].length); continue;
    }
    break;
  }
  return segs;
}

function parseListItems(html) {
  const items = [];
  const re = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let m;
  while ((m = re.exec(html)) !== null) items.push(parseInline(m[1]));
  return items;
}

function parseTableRows(html) {
  const rows = [];
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rm;
  while ((rm = rowRe.exec(html)) !== null) {
    const cols = [];
    const cRe  = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
    let cm;
    while ((cm = cRe.exec(rm[1])) !== null) cols.push(stripTags(cm[1]));
    if (cols.length) rows.push(cols);
  }
  return rows;
}

function parseHtml(html) {
  const blocks = [];
  let rem = (html || '').replace(/\r\n?/g, '\n').trim();
  while (rem.length) {
    let m;

    m = rem.match(/^<h2[^>]*>([\s\S]*?)<\/h2>/i);
    if (m) { blocks.push({ t: 'h2', text: stripTags(m[1]) }); rem = rem.slice(m[0].length).trim(); continue; }

    m = rem.match(/^<h3[^>]*>([\s\S]*?)<\/h3>/i);
    if (m) { blocks.push({ t: 'h3', text: stripTags(m[1]) }); rem = rem.slice(m[0].length).trim(); continue; }

    // info-box div (before generic div)
    m = rem.match(/^<div[^>]*class="[^"]*info-box[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (m) { blocks.push({ t: 'info', text: stripTags(m[1]) }); rem = rem.slice(m[0].length).trim(); continue; }

    m = rem.match(/^<p[^>]*>([\s\S]*?)<\/p>/i);
    if (m) {
      const segs = parseInline(m[1]);
      if (segs.length) blocks.push({ t: 'p', segs });
      rem = rem.slice(m[0].length).trim(); continue;
    }

    m = rem.match(/^<ul[^>]*>([\s\S]*?)<\/ul>/i);
    if (m) {
      const items = parseListItems(m[1]);
      if (items.length) blocks.push({ t: 'ul', items });
      rem = rem.slice(m[0].length).trim(); continue;
    }

    m = rem.match(/^<ol[^>]*>([\s\S]*?)<\/ol>/i);
    if (m) {
      const items = parseListItems(m[1]);
      if (items.length) blocks.push({ t: 'ol', items });
      rem = rem.slice(m[0].length).trim(); continue;
    }

    m = rem.match(/^<table[^>]*>([\s\S]*?)<\/table>/i);
    if (m) {
      const rows = parseTableRows(m[1]);
      if (rows.length) blocks.push({ t: 'table', rows });
      rem = rem.slice(m[0].length).trim(); continue;
    }

    // Skip structural tags
    m = rem.match(/^<\/?(div|section|main|article|aside|header|footer|nav|figure|blockquote|span)[^>]*>/i);
    if (m) { rem = rem.slice(m[0].length).trim(); continue; }

    m = rem.match(/^<[^>]+>/);
    if (m) { rem = rem.slice(m[0].length).trim(); continue; }

    m = rem.match(/^[^<]+/);
    if (m) { const t = decode(m[0].trim()); if (t) blocks.push({ t: 'text', text: t }); rem = rem.slice(m[0].length).trim(); continue; }
    break;
  }
  return blocks;
}

// ── Inline segment renderer ────────────────────────────────────────────────────
// PDFKit's continued:true is completely broken when \n appears mid-chain —
// text renders in wrong order with wrong indentation. Fix: split all segs
// at \n boundaries first, then render each visual line independently.
function rSegs(pdf, segs, x, y, width, color) {
  if (!segs || !segs.length) return;

  // Step 1: flatten all segments into logical lines at \n boundaries
  const lines = [[]];
  for (const seg of segs) {
    const parts = (seg.text || '').split('\n');
    if (parts[0]) lines[lines.length - 1].push({ ...seg, text: parts[0] });
    for (let i = 1; i < parts.length; i++) {
      lines.push([]);
      if (parts[i]) lines[lines.length - 1].push({ ...seg, text: parts[i] });
    }
  }

  // Step 2: render each line — continued:true only within a single line
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const lineY = (li === 0) ? y : pdf.y;

    if (!line.length) {
      // blank line — advance one line height
      pdf.font(FONT_NAMES.regular).fontSize(9.5);
      pdf.y = lineY + pdf.currentLineHeight(true);
      continue;
    }

    for (let si = 0; si < line.length; si++) {
      const seg = line[si];
      const isLast = (si === line.length - 1);
      pdf.font(seg.bold ? FONT_NAMES.semibold : FONT_NAMES.regular)
         .fillColor(seg.link ? BLUE : color);
      const opts = { continued: !isLast, width, lineGap: 3 };
      if (si === 0) pdf.text(seg.text, x, lineY, opts);
      else          pdf.text(seg.text, opts);
    }
  }

  pdf.font(FONT_NAMES.regular).fillColor(INK);
}

// ── Page chrome ────────────────────────────────────────────────────────────────

function stampHeader(pdf, doc) {
  const w = pdf.page.width;
  pdf.save();

  // 2 pt navy top bar
  pdf.rect(0, 0, w, 2).fill(NAVY);

  // Logo mark (dark version, small) — at y=12
  if (fs.existsSync(LOGO)) {
    try { pdf.image(LOGO, ML, 12, { height: 20 }); } catch (_) {}
  }

  // Wordmark "HansePay" — Libre Baskerville (matches hansepay.com topbar)
  pdf.font(FONT_NAMES.serif).fontSize(14).fillColor(NAVY)
     .text('HansePay', ML + 26, 14.5, { lineBreak: false });

  // Document type label — right-aligned, small caps style, muted
  if (doc.badge) {
    pdf.font(FONT_NAMES.medium).fontSize(7.5).fillColor(SUBTLE)
       .text(doc.badge.toUpperCase(), ML, 17, { width: CW, align: 'right', lineBreak: false, characterSpacing: 0.5 });
  }

  // Thin rule beneath header zone
  pdf.moveTo(ML, HDR_ZONE - 1).lineTo(w - MR, HDR_ZONE - 1)
     .strokeColor(BORDER).lineWidth(0.5).stroke();

  pdf.restore();
}

function stampFooter(pdf, doc, pageNum, total) {
  const w  = pdf.page.width;
  const h  = pdf.page.height;
  const fy = h - FTR_ZONE;
  const yr = new Date().getFullYear();

  pdf.save();

  // Thin rule above footer zone
  pdf.moveTo(ML, fy + 6).lineTo(w - MR, fy + 6)
     .strokeColor(BORDER).lineWidth(0.5).stroke();

  pdf.font(FONT_NAMES.regular).fontSize(7.5).fillColor(SUBTLE);

  // Left: copyright
  pdf.text(
    `© ${yr} Atrya Technologies SIA (trading as HansePay)  ·  Stadtdeich 2–4, 20097 Hamburg`,
    ML, fy + 15,
    { width: CW * 0.65, lineBreak: false }
  );

  // Right: page number
  pdf.text(
    `Page ${pageNum} of ${total}`,
    ML, fy + 15,
    { width: CW, align: 'right', lineBreak: false }
  );

  pdf.restore();
}

// ── First-page title block ─────────────────────────────────────────────────────

function renderDocTitle(pdf, doc) {
  // Badge label — Inter Medium, uppercase, letter-spaced, blue
  if (doc.badge) {
    pdf.font(FONT_NAMES.medium).fontSize(8).fillColor(BLUE)
       .text(doc.badge.toUpperCase(), ML, pdf.y, {
         width: CW, characterSpacing: 0.8, lineBreak: false,
       });
    pdf.y += 20;
  }

  // Large title — Libre Baskerville (matches site's doc-title serif treatment)
  pdf.font(FONT_NAMES.serif).fontSize(28).fillColor(NAVY)
     .text(doc.title, ML, pdf.y, { width: CW, lineGap: 4 });

  // Effective / date line — Inter Regular, muted
  if (doc.effectiveLine) {
    pdf.moveDown(0.35);
    pdf.font(FONT_NAMES.regular).fontSize(9.5).fillColor(MUTED)
       .text(doc.effectiveLine, ML, pdf.y, { width: CW });
  }

  // Separator line
  pdf.moveDown(1.1);
  const ly = pdf.y;
  pdf.save();
  pdf.moveTo(ML, ly).lineTo(ML + CW, ly).strokeColor(BORDER).lineWidth(0.5).stroke();
  pdf.restore();
  pdf.y = ly + 20;
}

// ── Ensure enough vertical space, add page if needed ─────────────────────────
function ensureSpace(pdf, neededPts) {
  const avail = pdf.page.height - CONTENT_BOTTOM - pdf.y;
  if (avail < neededPts) {
    pdf.addPage();
    pdf.y = CONTENT_TOP;
  }
}

// ── Body block renderer ────────────────────────────────────────────────────────

function renderBlocks(pdf, blocks) {
  for (const b of blocks) {
    switch (b.t) {

      // ── H2 ──────────────────────────────────────────────────────────────────
      case 'h2': {
        ensureSpace(pdf, 48);
        pdf.moveDown(1.0);
        // Playfair Display for section headings — elevated brand feel
        pdf.font(FONT_NAMES.playfair).fontSize(13).fillColor(NAVY)
           .text(b.text, ML, pdf.y, { width: CW });
        const ry = pdf.y + 4;
        pdf.save();
        pdf.moveTo(ML, ry).lineTo(ML + CW, ry).strokeColor(BORDER).lineWidth(0.5).stroke();
        pdf.restore();
        pdf.y = ry + 10;
        break;
      }

      // ── H3 ──────────────────────────────────────────────────────────────────
      case 'h3': {
        ensureSpace(pdf, 34);
        pdf.moveDown(0.5);
        pdf.font(FONT_NAMES.semibold).fontSize(9.5).fillColor(INK)
           .text(b.text, ML, pdf.y, { width: CW });
        pdf.moveDown(0.2);
        break;
      }

      // ── Paragraph ───────────────────────────────────────────────────────────
      case 'p': {
        ensureSpace(pdf, 22);
        pdf.fontSize(9.5);
        rSegs(pdf, b.segs, ML, pdf.y, CW, INK);
        pdf.moveDown(0.45);
        break;
      }

      // ── Plain text ───────────────────────────────────────────────────────────
      case 'text': {
        ensureSpace(pdf, 18);
        pdf.font(FONT_NAMES.regular).fontSize(9.5).fillColor(INK)
           .text(b.text, ML, pdf.y, { width: CW, lineGap: 4 });
        pdf.moveDown(0.35);
        break;
      }

      // ── Unordered list ───────────────────────────────────────────────────────
      case 'ul': {
        for (const segs of b.items) {
          ensureSpace(pdf, 18);
          const iy = pdf.y;
          // Muted bullet
          pdf.save();
          pdf.circle(ML + 5, iy + 5.5, 2).fill(SUBTLE);
          pdf.restore();
          pdf.fontSize(9.5);
          rSegs(pdf, segs, ML + 16, iy, CW - 16, INK);
          pdf.moveDown(0.28);
        }
        pdf.moveDown(0.2);
        break;
      }

      // ── Ordered list ─────────────────────────────────────────────────────────
      case 'ol': {
        b.items.forEach((segs, idx) => {
          ensureSpace(pdf, 18);
          const iy = pdf.y;
          pdf.font(FONT_NAMES.semibold).fontSize(9.5).fillColor(NAVY)
             .text(`${idx + 1}.`, ML, iy, { width: 18, lineBreak: false });
          pdf.fontSize(9.5);
          rSegs(pdf, segs, ML + 20, iy, CW - 20, INK);
          pdf.moveDown(0.28);
        });
        pdf.moveDown(0.2);
        break;
      }

      // ── Info / callout box ────────────────────────────────────────────────────
      case 'info': {
        pdf.moveDown(0.4);
        const textH = pdf.font(FONT_NAMES.regular).fontSize(9.5)
                         .heightOfString(b.text, { width: CW - 32, lineGap: 4 });
        const boxH  = textH + 28;
        ensureSpace(pdf, boxH + 12);
        const by = pdf.y;
        pdf.save();
        pdf.roundedRect(ML, by, CW, boxH, 4).fill(BG_BOX);
        pdf.rect(ML, by, 2.5, boxH).fill(BLUE);
        pdf.restore();
        pdf.font(FONT_NAMES.regular).fontSize(9.5).fillColor(INK)
           .text(b.text, ML + 16, by + 14, { width: CW - 32, lineGap: 4 });
        pdf.y = by + boxH + 10;
        pdf.moveDown(0.3);
        break;
      }

      // ── Table ─────────────────────────────────────────────────────────────────
      case 'table': {
        if (!b.rows.length) break;
        const ncols  = b.rows[0].length;
        const colW   = CW / ncols;
        const rowH   = 22;
        const totalH = b.rows.length * rowH;
        pdf.moveDown(0.4);
        ensureSpace(pdf, totalH + 20);
        let ty = pdf.y;
        const startY = ty;

        for (let r = 0; r < b.rows.length; r++) {
          const isHd = (r === 0);
          // Background
          pdf.save();
          if (isHd) {
            pdf.rect(ML, ty, CW, rowH).fill(STRIPE);
          }
          // Bottom border for each row
          pdf.moveTo(ML, ty + rowH).lineTo(ML + CW, ty + rowH)
             .strokeColor(BORDER).lineWidth(0.3).stroke();
          pdf.restore();
          // Cell text
          b.rows[r].forEach((cell, c) => {
            pdf.font(isHd ? FONT_NAMES.semibold : FONT_NAMES.regular)
               .fontSize(9)
               .fillColor(isHd ? NAVY : INK)
               .text(cell, ML + c * colW + 10, ty + 6.5, { width: colW - 20, lineBreak: false });
          });
          ty += rowH;
        }
        // Outer border
        pdf.save();
        pdf.rect(ML, startY, CW, totalH).strokeColor(BORDER).lineWidth(0.5).stroke();
        pdf.restore();
        pdf.y = ty + 10;
        pdf.moveDown(0.3);
        break;
      }
    }
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

function generateLegalPdf(doc, res) {
  const pdf = new PDFDocument({
    size:        'A4',
    margins: {
      top:    CONTENT_TOP,
      bottom: CONTENT_BOTTOM,
      left:   ML,
      right:  MR,
    },
    bufferPages: true,
    info: {
      Title:   doc.title || 'HansePay Legal Document',
      Author:  'HansePay | Atrya Technologies SIA',
      Subject: doc.badge  || 'Legal',
      Creator: 'HansePay Legal Centre',
    },
  });

  registerFonts(pdf);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition',
    `attachment; filename="hansepay-${doc.slug || 'legal'}.pdf"`);
  pdf.pipe(res);

  // ── Content pass ──────────────────────────────────────────────────────────
  pdf.font(FONT_NAMES.regular).fillColor(INK);
  renderDocTitle(pdf, doc);
  renderBlocks(pdf, parseHtml(doc.body || ''));

  // ── Stamp chrome on every buffered page ────────────────────────────────────
  const range = pdf.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    pdf.switchToPage(range.start + i);
    stampHeader(pdf, doc);
    stampFooter(pdf, doc, i + 1, range.count);
  }

  pdf.flushPages();
  pdf.end();
}

module.exports = { generateLegalPdf };
