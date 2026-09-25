'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  ICP-Fit scoring for event attendee lists (conferences, trade shows).
//  Based on: Dokument 0 — Angebotsdefinition & ICP-Filter (Notion, Growth/
//  Sales/Scripts). Ported from the one-off Python script used for the first
//  run (Bits & Pretzels 2026) so future event imports reuse the same logic.
//
//  Keyword lists live here as code, not admin-editable — if the criteria need
//  tuning (new Tier A industry, adjusted blocklist), that's a code change
//  here, not a settings-page edit. Flag it in conversation and it's a quick
//  update.
// ─────────────────────────────────────────────────────────────────────────────

const HARD_BLOCKS = [
  /\blaw firm\b/, /\banwalt\w*\b/, /\bnotar\w*\b/, /\bsteuerberater\b/, /\btax advisor\b/,
  /\bstiftung\b/, /\bcharity\b/, /\bcharities\b/, /\bngo\b/, /\bnonprofit\b/, /\bnon-profit\b/,
  /\btobacco\b/, /\btabak\b/, /\bweapons?\b/, /\bwaffen\b/, /\bgambling\b/, /\bglücksspiel\b/,
  /\bgastronom\w*\b/, /\brestaurant\b/, /\bjewelry\b/, /\bjewellery\b/, /\bschmuck\b/, /\bedelmetalle?\b/,
  /\bimmobilien\b/, /\breal estate\b/, /\btreuhänder\b/,
];
const SOFT_BLOCKS = [
  /\bbank\b/, /\bbanking\b/, /\bpharma\w*\b/, /\bhealthcare\b/, /\bmedical device\b/, /\bhospital\b/,
  /\bconstruction\b/, /\bbaugewerbe\b/, /\bwealth management\b/, /\basset management\b/, /\bgesundheitswesen\b/,
];
const SOFTWARE_VENDOR_HINT = /\bplatform\b|\bsoftware\b|\bsaas\b|\bapi\b|\btechnology\b|\bautomat\w*\b|\bcompliance\b/;

const INVESTOR_TITLE_RE = /\binvestor\b|\binvestment (officer|manager|analyst|associate)\b|\bventure (partner|capital)\b|\bvc\b|\blimited partner\b|\bprincipal\b.{0,20}\bcapital\b/;

const TIER_A_PATTERNS = {
  'Textil/Bekleidung': /\btextile?s?\b|\bapparel\b|\bfashion\b|\bclothing\b|\bbekleidung\b|\bkonfektion\b|\bfootwear\b|\bshoes\b|\bgarment\w*\b/,
  'Solar/Energiekomponenten': /\bsolar\b|\bphotovoltaic\b|\bpv\b|\benergy component\w*\b|\benergiekomponent\w*\b|\bbattery (storage|component)\w*\b|\bbatteries\b|\bwind (turbine|component)\w*\b/,
  'E-Commerce (Eigenhändler)': /\be-?commerce\b|\bonline (shop|store|retailer)\b|\bown inventory\b|\bd2c\b|\bdirect-to-consumer\b|\bconsumer goods\b|\bfmcg\b/,
};
const MARKETPLACE_RE = /\bmarketplace\b|\bthird-party payment\b|\bhold client funds\b|\bpayment (processor|orchestrat\w*|gateway)\b|\bembedded finance\b|\bpsp\b/;

const TIER_B_INDUSTRY = /\bmachinery\b|\bmaschinenbau\b|\bmanufactur\w*\b|\bzulieferer\b|\bcomponents?\b|\bfertigung\b|\bhardware\b(?!.{0,15}\bsecurity\b)|\belectronics?\b|\belektronik\b|\bfurniture\b|\bmöbel\b|\bfood\b|\bbeverage\w*\b|\blebensmittel\b|\bcoffee\b|\bkaffee\b|\bspices?\b|\bcosmetics?\b|\bautomotive part\w*\b|\bfahrzeugteil\w*\b|\btoys?\b|\bspielzeug\b|\bconsumer electronics\b|\bdistributor\b|\bdistribution\b|\bgroßhändler\b|\bwholesale\w*\b|\braw material\w*\b|\brohstoff\w*\b|\bcommodit(y|ies)\b|\bmetal\w*\b|\bmining\b|\btextile machin\w*\b|\bindustrial equipment\b/;

const CROSSBORDER_OPS = /\bimport\b|\bexport\b|\bsourcing\b|\bprocurement\b|\bsupply chain\b|\blieferkette\b|\bbeschaffung\b|\bfreight\b|\blogistics\b|\bwholesale\b|\bgroßhandel\b|\bglobal supplier\b|\bshipping\b|\bcustoms\b|\bcross-border\b|\bcross border\b|\binternational (trade|procurement|sourcing|supplier|supply)\b|\b3pl\b|\bfreight forward\w*\b|\bcontainer\b|\bwarehous\w*\b|\bfulfillment\b|\btrading company\b|\btrading house\b/g;

const TIER_C_PATTERNS = {
  'Automobil-Import': /\bautomobile? import\b|\bused car\b|\bgebrauchtwagen\b|\bcar (trading|dealer|import)\b/,
};

const TARGET_COUNTRIES = /\busa\b|\bunited states\b|\bbrazil\b|\bbrasilien\b|\bargentina\b|\bargentinien\b|\bindia\b|\bindien\b|\bsouth korea\b|\bsüdkorea\b|\bjapan\b|\bbangladesh\b|\bchina\b|\bmorocco\b|\bmarokko\b|\bvietnam\b|\bthailand\b|\bindonesia\b|\btunisia\b|\btunesien\b|\bturkey\b|\btürkei\b/g;

function combinedText(row) {
  return [row.title, row.company, row.oneLiner, row.pitch, row.notes]
    .filter(Boolean).join(' ').toLowerCase();
}

function isInvestorRole(ticketType, title) {
  const tt = (ticketType || '').toLowerCase();
  const t = (title || '').toLowerCase();
  if (tt.includes('investor') || tt.includes('limited partner')) return true;
  return INVESTOR_TITLE_RE.test(t);
}

function isBlocklisted(text) {
  if (HARD_BLOCKS.some(re => re.test(text))) return true;
  for (const re of SOFT_BLOCKS) {
    if (re.test(text) && !SOFTWARE_VENDOR_HINT.test(text)) return true;
  }
  return false;
}

/** row = { title, company, oneLiner, pitch, notes, ticketType } */
function scoreAttendee(row) {
  if (isInvestorRole(row.ticketType, row.title)) {
    return { score: -1, tier: null, reasoning: 'Investor/VC-Rolle — kein operatives Geschäft mit eigenem Zahlungsverkehr' };
  }
  const text = combinedText(row);
  if (isBlocklisted(text)) {
    return { score: -1, tier: null, reasoning: 'Sperrliste (Abschnitt 5)' };
  }

  let score = 0, tier = null;
  const reasons = [];

  for (const [label, pattern] of Object.entries(TIER_A_PATTERNS)) {
    if (pattern.test(text)) {
      if (label.includes('E-Commerce') && MARKETPLACE_RE.test(text)) {
        reasons.push(`${label}: MARKETPLACE-Signal — ausgeschlossen laut Doc, nicht gewertet`);
        continue;
      }
      score += 40; tier = 'A';
      reasons.push(`Tier A: ${label}`);
    }
  }

  if (tier !== 'A' && TIER_B_INDUSTRY.test(text)) {
    score += 25; tier = 'B';
    reasons.push('Tier B: Branche passt (Maschinenbau/Elektronik/Möbel/Lebensmittel/Rohstoffe/etc.)');
  }

  for (const [label, pattern] of Object.entries(TIER_C_PATTERNS)) {
    if (pattern.test(text)) {
      score += 10; tier = 'C';
      reasons.push(`Tier C (Sanktionsprüfung nötig, noch keine Kaltakquise): ${label}`);
    }
  }

  const tradeHits = (text.match(CROSSBORDER_OPS) || []).length;
  if (tradeHits) {
    score += Math.min(tradeHits * 15, 30);
    reasons.push(`Cross-border/physical-trade Signale (${tradeHits}x)`);
  }

  const countryHits = [...new Set(text.match(TARGET_COUNTRIES) || [])];
  if (countryHits.length) {
    score += 10;
    reasons.push(`Zielland erwähnt: ${countryHits.join(', ')}`);
  }

  if (score === 0) return { score: 0, tier: null, reasoning: 'Kein ICP-Signal erkannt' };
  return { score, tier, reasoning: reasons.join('; ') };
}

function draftMessage(row) {
  const first = row.firstName || '';
  const company = row.company || '';
  const oneLiner = row.oneLiner || '';
  const hook = oneLiner
    ? `${oneLiner.length < 110 ? oneLiner : oneLiner.slice(0, 107) + '...'}`.replace(/\.$/, '') + ' klingt nach einem Geschäft mit echtem grenzüberschreitendem Wareneinkauf oder -verkauf —'
    : 'Ihr Profil klang nach einem Geschäft mit echtem grenzüberschreitendem Zahlungsverkehr —';
  return `Hi ${first}, schön, dass wir uns über den Weg gelaufen sind. ${hook} Wir bauen bei HansePay gerade eine Auswertung, die zeigt, was Unternehmen wie ${company} bei Auslandszahlungen tatsächlich an Wechselkurs-Aufschlag verlieren — meist deutlich mehr, als auf der Kontoführungsgebühr steht. Dauert bei Ihnen 10 Minuten, kostet nichts, keine Verpflichtung. Interesse an einem kurzen Austausch?`;
}

module.exports = { scoreAttendee, draftMessage };
