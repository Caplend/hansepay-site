'use strict';

const PDFDocument = require('pdfkit');
const fs          = require('fs');
const path        = require('path');

// ── Brand tokens ─────────────────────────────────────────────────────────────
const C = {
  navy:   '#0D2A4C',
  blue:   '#1D72B8',
  ink:    '#1A1F36',
  ink2:   '#4A5568',
  muted:  '#94A3B8',
  border: '#CBD5E1',
  bgBox:  '#EEF4FA',
  stripe: '#F8FAFC',
  white:  '#FFFFFF',
};

const ASSETS = path.join(__dirname, '..', 'assets');
const LOGO_W = path.join(ASSETS, 'hansepay-mark-uploaded-white.png');

const HDR_H  = 54;   // header bar height (pt)
const FTR_H  = 38;   // footer bar height (pt)
const ML     = 58;   // margin left
const MR     = 58;   // margin right
const PAGE_W = 595.28; // A4 width
const CW     = PAGE_W - ML - MR;  // content width ≈ 479 pt

// ── HTML → block AST ─────────────────────────────────────────────────────────

function decode(s) {
  return s
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&[a-z]+;/g, '');
}

function stripTags(html) {
  return decode(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

// Returns [{text, bold?, italic?, link?}]
function parseInline(html) {
  const segs = [];
  let rem = html.replace(/<br\s*\/?>/gi, '\n');
  while (rem.length) {
    let m;
    // Bold
    m = rem.match(/^<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/i);
    if (m) {
      const t = decode(m[1].replace(/<[^>]+>/g, ''));
      if (t.trim()) segs.push({ text: t, bold: true });
      rem = rem.slice(m[0].length); continue;
    }
    // Italic
    m = rem.match(/^<(?:em|i)[^>]*>([\s\S]*?)<\/(?:em|i)>/i);
    if (m) {
      const t = decode(m[1].replace(/<[^>]+>/g, ''));
      if (t.trim()) segs.push({ text: t, italic: true });
      rem = rem.slice(m[0].length); continue;
    }
    // Link → render text only
    m = rem.match(/^<a[^>]*>([\s\S]*?)<\/a>/i);
    if (m) {
      const t = decode(m[1].replace(/<[^>]+>/g, ''));
      if (t.trim()) segs.push({ text: t, link: true });
      rem = rem.slice(m[0].length); continue;
    }
    // Skip any other tag
    m = rem.match(/^<[^>]+>/);
    if (m) { rem = rem.slice(m[0].length); continue; }
    // Plain text
    m = rem.match(/^[^<]+/);
    if (m) {
      const t = decode(m[0]).replace(/\s+/g, ' ');
      if (t.trim()) segs.push({ text: t });
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
    const cellRe = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
    let cm;
    while ((cm = cellRe.exec(rm[1])) !== null) cols.push(stripTags(cm[1]));
    if (cols.length) rows.push(cols);
  }
  return rows;
}

function parseHtml(html) {
  const blocks = [];
  let rem = (html || '').replace(/\r\n?/g, '\n').trim();
  while (rem.length) {
    let m;
    // H2
    m = rem.match(/^<h2[^>]*>([\s\S]*?)<\/h2>/i);
    if (m) { blocks.push({ t: 'h2', text: stripTags(m[1]) }); rem = rem.slice(m[0].length).trim(); continue; }
    // H3
    m = rem.match(/^<h3[^>]*>([\s\S]*?)<\/h3>/i);
    if (m) { blocks.push({ t: 'h3', text: stripTags(m[1]) }); rem = rem.slice(m[0].length).trim(); continue; }
    // info-box div (must come before generic div)
    m = rem.match(/^<div[^>]*class="[^"]*info-box[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (m) { blocks.push({ t: 'info', text: stripTags(m[1]) }); rem = rem.slice(m[0].length).trim(); continue; }
    // P
    m = rem.match(/^<p[^>]*>([\s\S]*?)<\/p>/i);
    if (m) {
      const segs = parseInline(m[1]);
      if (segs.length) blocks.push({ t: 'p', segs });
      rem = rem.slice(m[0].length).trim(); continue;
    }
    // UL
    m = rem.match(/^<ul[^>]*>([\s\S]*?)<\/ul>/i);
    if (m) {
      const items = parseListItems(m[1]);
      if (items.length) blocks.push({ t: 'ul', items });
      rem = rem.slice(m[0].length).trim(); continue;
    }
    // OL
    m = rem.match(/^<ol[^>]*>([\s\S]*?)<\/ol>/i);
    if (m) {
      const items = parseListItems(m[1]);
      if (items.length) blocks.push({ t: 'ol', items });
      rem = rem.slice(m[0].length).trim(); continue;
    }
    // TABLE
    m = rem.match(/^<table[^>]*>([\s\S]*?)<\/table>/i);
    if (m) {
      const rows = parseTableRows(m[1]);
      if (rows.length) blocks.push({ t: 'table', rows });
      rem = rem.slice(m[0].length).trim(); continue;
    }
    // Skip block-level containers
    m = rem.match(/^<\/?(div|section|main|article|aside|header|footer|nav|figure|blockquote)[^>]*>/i);
    if (m) { rem = rem.slice(m[0].length).trim(); continue; }
    // Skip any other tag
    m = rem.match(/^<[^>]+>/);
    if (m) { rem = rem.slice(m[0].length).trim(); continue; }
    // Bare text
    m = rem.match(/^[^<]+/);
    if (m) {
      const t = decode(m[0].trim());
      if (t) blocks.push({ t: 'text', text: t });
      rem = rem.slice(m[0].length).trim(); continue;
    }
    break;
  }
  return blocks;
}

// ── PDFKit helpers ────────────────────────────────────────────────────────────

// Render inline segments with mixed bold/italic starting at (x, y)
function rSegs(pdf, segs, x, y, width, color) {
  if (!segs || !segs.length) return;
  segs.forEach((s, i) => {
    const last = (i === segs.length - 1);
    pdf.font(s.bold ? 'Helvetica-Bold' : (s.italic ? 'Helvetica-Oblique' : 'Helvetica'));
    pdf.fillColor(s.link ? C.blue : color);
    const opts = { continued: !last, width, lineGap: 3 };
    if (i === 0) pdf.text(s.text, x, y, opts);
    else         pdf.text(s.text, opts);
  });
}

// ── Per-page chrome (called in the stamp pass) ────────────────────────────────

function stampHeader(pdf, doc) {
  const w = pdf.page.width;
  pdf.save();

  // Navy bar
  pdf.rect(0, 0, w, HDR_H).fill(C.navy);

  // Logo
  if (fs.existsSync(LOGO_W)) {
    try { pdf.image(LOGO_W, 18, 12, { height: 30 }); } catch (_) {}
  }

  // Wordmark
  pdf.font('Helvetica-Bold').fontSize(15).fillColor(C.white)
     .text('HansePay', 56, 19.5, { lineBreak: false });

  // Badge label (right-aligned, faint)
  if (doc.badge) {
    pdf.font('Helvetica').fontSize(8)
       .fillColor('#AACCEE')
       .text(doc.badge.toUpperCase(), w - MR - 180, 21, { width: 180, align: 'right', lineBreak: false });
  }

  pdf.restore();
}

function stampFooter(pdf, doc, pageNum, total) {
  const w  = pdf.page.width;
  const h  = pdf.page.height;
  const fy = h - FTR_H;
  const year = new Date().getFullYear();

  pdf.save();

  // Divider line
  pdf.moveTo(ML, fy + 9).lineTo(w - MR, fy + 9)
     .strokeColor(C.border).lineWidth(0.5).stroke();

  // Copyright (left)
  pdf.font('Helvetica').fontSize(8).fillColor(C.muted)
     .text(
       `© ${year} Atrya Technologies SIA (trading as HansePay)  ·  Stadtdeich 2–4, 20097 Hamburg, Germany`,
       ML, fy + 18,
       { width: CW * 0.68, lineBreak: false }
     );

  // Page N of N (right)
  pdf.text(
    `Page ${pageNum} of ${total}`,
    ML, fy + 18,
    { width: CW, align: 'right', lineBreak: false }
  );

  pdf.restore();
}

// ── First-page document header ─────────────────────────────────────────────

function renderDocTitle(pdf, doc) {
  // Badge pill
  if (doc.badge) {
    const ty0 = pdf.y;
    const bW  = pdf.font('Helvetica-Bold').fontSize(9.5).widthOfString(doc.badge) + 24;
    pdf.save();
    pdf.roundedRect(ML, ty0, bW, 22, 11).fill(C.blue);
    pdf.restore();
    pdf.font('Helvetica-Bold').fontSize(9.5).fillColor(C.white)
       .text(doc.badge, ML + 12, ty0 + 6.5, { lineBreak: false, width: bW - 24 });
    pdf.y = ty0 + 30;
  }

  // Title
  pdf.font('Helvetica-Bold').fontSize(22).fillColor(C.navy)
     .text(doc.title, ML, pdf.y, { width: CW });

  // Effective / date line
  if (doc.effectiveLine) {
    pdf.moveDown(0.3);
    pdf.font('Helvetica').fontSize(10).fillColor(C.ink2)
       .text(doc.effectiveLine, ML, pdf.y, { width: CW });
  }

  // Separator
  pdf.moveDown(0.8);
  const ly = pdf.y;
  pdf.save();
  pdf.moveTo(ML, ly).lineTo(ML + CW, ly).strokeColor(C.blue).lineWidth(1.5).stroke();
  pdf.restore();
  pdf.y = ly + 16;
}

// ── Body block renderer ───────────────────────────────────────────────────────

function renderBlocks(pdf, blocks) {
  for (const b of blocks) {

    switch (b.t) {

      case 'h2': {
        pdf.moveDown(0.8);
        pdf.font('Helvetica-Bold').fontSize(13).fillColor(C.navy)
           .text(b.text, ML, pdf.y, { width: CW });
        const uy = pdf.y + 2;
        pdf.save();
        pdf.moveTo(ML, uy).lineTo(ML + CW * 0.20, uy)
           .strokeColor(C.blue).lineWidth(1.2).stroke();
        pdf.restore();
        pdf.y = uy + 7;
        break;
      }

      case 'h3': {
        pdf.moveDown(0.55);
        pdf.font('Helvetica-Bold').fontSize(11).fillColor(C.ink)
           .text(b.text, ML, pdf.y, { width: CW });
        pdf.moveDown(0.2);
        break;
      }

      case 'p': {
        const y0 = pdf.y;
        pdf.fontSize(10);
        rSegs(pdf, b.segs, ML, y0, CW, C.ink);
        pdf.moveDown(0.5);
        break;
      }

      case 'text': {
        pdf.font('Helvetica').fontSize(10).fillColor(C.ink)
           .text(b.text, ML, pdf.y, { width: CW });
        pdf.moveDown(0.35);
        break;
      }

      case 'ul': {
        for (const segs of b.items) {
          const iy = pdf.y;
          // Bullet circle
          pdf.save();
          pdf.circle(ML + 5.5, iy + 5.5, 2.5).fill(C.blue);
          pdf.restore();
          pdf.fontSize(10);
          rSegs(pdf, segs, ML + 17, iy, CW - 17, C.ink);
          pdf.moveDown(0.25);
        }
        pdf.moveDown(0.2);
        break;
      }

      case 'ol': {
        b.items.forEach((segs, idx) => {
          const iy = pdf.y;
          pdf.font('Helvetica-Bold').fontSize(10).fillColor(C.blue)
             .text(`${idx + 1}.`, ML, iy, { width: 16, lineBreak: false });
          pdf.fontSize(10);
          rSegs(pdf, segs, ML + 19, iy, CW - 19, C.ink);
          pdf.moveDown(0.25);
        });
        pdf.moveDown(0.2);
        break;
      }

      case 'info': {
        pdf.moveDown(0.4);
        const iy  = pdf.y;
        const tH  = pdf.font('Helvetica').fontSize(10)
                       .heightOfString(b.text, { width: CW - 34 });
        const bxH = tH + 26;
        // Check page space; if not enough, advance (PDFKit auto-pages for text,
        // but we need to ensure space for the explicit-y box)
        const avail = pdf.page.height - pdf.page.margins.bottom - iy;
        if (avail < bxH + 16) { pdf.addPage(); pdf.y = pdf.page.margins.top; }
        const by = pdf.y;
        pdf.save();
        pdf.roundedRect(ML, by, CW, bxH, 5).fill(C.bgBox);
        pdf.rect(ML, by, 3, bxH).fill(C.blue);
        pdf.restore();
        pdf.font('Helvetica').fontSize(10).fillColor(C.ink)
           .text(b.text, ML + 17, by + 13, { width: CW - 34 });
        pdf.y = by + bxH + 10;
        pdf.moveDown(0.3);
        break;
      }

      case 'table': {
        if (!b.rows.length) break;
        pdf.moveDown(0.4);
        const ncols  = b.rows[0].length;
        const colW   = CW / ncols;
        const rowH   = 22;
        const tblH   = b.rows.length * rowH;
        const avail2 = pdf.page.height - pdf.page.margins.bottom - pdf.y;
        if (avail2 < tblH + 16) { pdf.addPage(); pdf.y = pdf.page.margins.top; }
        let ty = pdf.y;
        const startY = ty;
        for (let r = 0; r < b.rows.length; r++) {
          const isHd = (r === 0);
          pdf.save();
          if (isHd) {
            pdf.rect(ML, ty, CW, rowH).fill(C.navy);
          } else if (r % 2 === 0) {
            pdf.rect(ML, ty, CW, rowH).fill(C.stripe);
          }
          pdf.restore();
          b.rows[r].forEach((cell, c) => {
            pdf.font(isHd ? 'Helvetica-Bold' : 'Helvetica')
               .fontSize(9)
               .fillColor(isHd ? C.white : C.ink)
               .text(cell, ML + c * colW + 8, ty + 6.5, { width: colW - 16, lineBreak: false });
          });
          ty += rowH;
        }
        pdf.save();
        pdf.rect(ML, startY, CW, tblH).strokeColor(C.border).lineWidth(0.5).stroke();
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
    size:    'A4',
    margins: {
      top:    HDR_H + 20,    // content starts 20pt below header bar
      bottom: FTR_H + 22,    // content ends 22pt above footer bar
      left:   ML,
      right:  MR,
    },
    bufferPages: true,
    info: {
      Title:        doc.title || 'HansePay Legal Document',
      Author:       'HansePay | Atrya Technologies SIA',
      Subject:      doc.badge  || 'Legal',
      Creator:      'HansePay Legal Centre',
    },
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition',
    `attachment; filename="hansepay-${doc.slug || 'legal'}.pdf"`);
  pdf.pipe(res);

  // ── Render body content (PDFKit auto-pages on overflow) ─────────────────
  renderDocTitle(pdf, doc);
  renderBlocks(pdf, parseHtml(doc.body || ''));

  // ── Stamp header + footer on every page in the buffer ───────────────────
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
