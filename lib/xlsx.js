'use strict';

/**
 * HansePay — zero-dependency exporters (CSV + real .xlsx)
 *
 * No npm packages required. The .xlsx writer builds a minimal OOXML
 * spreadsheet packaged as a ZIP archive using the STORE (no compression)
 * method, so we only need a CRC32 implementation and Buffer concatenation.
 * Excel, Numbers, LibreOffice and Google Sheets all open the result natively.
 *
 * Public API:
 *   toCSV(rows, headers?)            -> string
 *   buildWorkbook([{name, aoa}])     -> Buffer   (aoa = array-of-arrays, row 0 = header)
 */

// ─── CRC32 ─────────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// ─── ZIP (STORE) ─────────────────────────────────────────────────────────────
function zip(files) {
  // files: [{ name, data:Buffer }]
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const f of files) {
    const nameBuf = Buffer.from(f.name, 'utf8');
    const data = f.data;
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);   // local file header signature
    local.writeUInt16LE(20, 4);            // version needed
    local.writeUInt16LE(0x0800, 6);        // flags (bit 11 = UTF-8 names)
    local.writeUInt16LE(0, 8);             // compression: 0 = store
    local.writeUInt16LE(0, 10);            // mod time
    local.writeUInt16LE(0x21, 12);         // mod date (1980-01-01)
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);  // compressed size
    local.writeUInt32LE(data.length, 22);  // uncompressed size
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);            // extra length
    localParts.push(local, nameBuf, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);  // central dir signature
    central.writeUInt16LE(20, 4);          // version made by
    central.writeUInt16LE(20, 6);          // version needed
    central.writeUInt16LE(0x0800, 8);      // flags
    central.writeUInt16LE(0, 10);          // compression
    central.writeUInt16LE(0, 12);          // mod time
    central.writeUInt16LE(0x21, 14);       // mod date
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);          // extra length
    central.writeUInt16LE(0, 32);          // comment length
    central.writeUInt16LE(0, 34);          // disk number start
    central.writeUInt16LE(0, 36);          // internal attrs
    central.writeUInt32LE(0, 38);          // external attrs
    central.writeUInt32LE(offset, 42);     // local header offset
    centralParts.push(central, nameBuf);

    offset += local.length + nameBuf.length + data.length;
  }

  const centralBuf = Buffer.concat(centralParts);
  const localBuf = Buffer.concat(localParts);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);                 // disk number
  eocd.writeUInt16LE(0, 6);                 // disk with central dir
  eocd.writeUInt16LE(files.length, 8);      // entries on this disk
  eocd.writeUInt16LE(files.length, 10);     // total entries
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(localBuf.length, 16);  // central dir offset
  eocd.writeUInt16LE(0, 20);                // comment length

  return Buffer.concat([localBuf, centralBuf, eocd]);
}

// ─── XML helpers ─────────────────────────────────────────────────────────────
function xmlEscape(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;")
    // strip XML-illegal control chars (keep \t \n \r)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

function colName(idx) {
  let s = '';
  idx++;
  while (idx > 0) {
    const m = (idx - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    idx = Math.floor((idx - 1) / 26);
  }
  return s;
}

function isNumeric(v) {
  return typeof v === 'number' && isFinite(v);
}

function sheetXml(aoa) {
  const rows = [];
  for (let r = 0; r < aoa.length; r++) {
    const cells = [];
    const row = aoa[r] || [];
    for (let c = 0; c < row.length; c++) {
      const ref = colName(c) + (r + 1);
      const v = row[c];
      const styleAttr = r === 0 ? ' s="1"' : '';
      if (isNumeric(v)) {
        cells.push(`<c r="${ref}"${styleAttr}><v>${v}</v></c>`);
      } else {
        cells.push(`<c r="${ref}"${styleAttr} t="inlineStr"><is><t xml:space="preserve">${xmlEscape(v)}</t></is></c>`);
      }
    }
    rows.push(`<row r="${r + 1}">${cells.join('')}</row>`);
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>${rows.join('')}</sheetData></worksheet>`;
}

/**
 * sheets: [{ name:String, aoa:[[...row0],[...row1]] }]
 * Returns a Buffer containing a valid .xlsx file.
 */
function buildWorkbook(sheets) {
  if (!Array.isArray(sheets) || !sheets.length) sheets = [{ name: 'Sheet1', aoa: [[]] }];

  const safeName = (n, i) => (n || `Sheet${i + 1}`).replace(/[\\/?*\[\]:]/g, ' ').slice(0, 31) || `Sheet${i + 1}`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('\n')}
</Types>`;

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${sheets.map((s, i) => `<sheet name="${xmlEscape(safeName(s.name, i))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets>
</workbook>`;

  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('\n')}
<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  // Two fonts: 0 = normal, 1 = bold (used by header style s="1")
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0B1929"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs>
</styleSheet>`;

  const files = [
    { name: '[Content_Types].xml', data: Buffer.from(contentTypes, 'utf8') },
    { name: '_rels/.rels', data: Buffer.from(rootRels, 'utf8') },
    { name: 'xl/workbook.xml', data: Buffer.from(workbook, 'utf8') },
    { name: 'xl/_rels/workbook.xml.rels', data: Buffer.from(workbookRels, 'utf8') },
    { name: 'xl/styles.xml', data: Buffer.from(styles, 'utf8') },
    ...sheets.map((s, i) => ({
      name: `xl/worksheets/sheet${i + 1}.xml`,
      data: Buffer.from(sheetXml(s.aoa || [[]]), 'utf8'),
    })),
  ];

  return zip(files);
}

// ─── CSV ─────────────────────────────────────────────────────────────────────
function csvCell(v) {
  if (v == null) return '';
  const s = String(v);
  if (/[",\n\r;]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

/** rows: array-of-arrays (row 0 may be the header). Returns CSV string with BOM. */
function toCSV(aoa) {
  const body = (aoa || []).map(row => (row || []).map(csvCell).join(',')).join('\r\n');
  return '﻿' + body; // BOM so Excel reads UTF-8 correctly
}

module.exports = { buildWorkbook, toCSV };
