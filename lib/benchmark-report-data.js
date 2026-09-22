'use strict';

// Benchmark report content per corridor — the same approved, sourced content
// that lives on the landing pages (zahlungen/<slug>/), repackaged as a
// citable reference document. This is deliberately NOT email-gated: the
// goal is maximum shareability so journalists/researchers cite and link
// back to the page, not a locked PDF.
const BENCHMARK_REPORTS = {
  indien: {
    country: 'Indien', currency: 'INR', slug: 'indien',
    stats: [['35,4 Mrd. USD', 'deutsch-indischer Warenhandel 2025'], ['+12,5 %', 'Wachstum deutscher Importe'], ['2–5 Werktage', 'übliche SWIFT-Laufzeit']],
    costRange: '0,5–5 %', avgVolume: '1.200.000 €', avgMarkup: '2,8 %',
    findings: [
      'Die Indische Rupie ist keine frei handelbare Währung. Zahlungen aus Deutschland werden praktisch immer im Land konvertiert, mindestens eine Korrespondenzbank ist beteiligt.',
      'Grundgebühren liegen zwischen 5 und 50 Euro je nach Bank und Kontomodell, zuzüglich 10 bis 30 Euro je zwischengeschalteter Korrespondenzbank.',
      'Indische Empfängerbanken ordnen jeder eingehenden Auslandszahlung einen wirtschaftlichen Zweck zu — unklare Verwendungszwecke sind die häufigste Ursache für verzögerte Gutschriften.',
    ],
    sources: ['GTAI, Außenhandel Indien–Deutschland 2025', 'Exiap, SWIFT-Gebührenvergleich 2026'],
  },
  china: {
    country: 'China', currency: 'CNY', slug: 'china',
    stats: [['251,8 Mrd. €', 'Außenhandel 2025'], ['170,6 Mrd. €', 'deutsche Importe (+8,8 %)'], ['2 Umrechnungen', 'bei Zahlung in USD']],
    costRange: '0,5–5 %', avgVolume: '3.000.000 €', avgMarkup: '2,5 %',
    findings: [
      'China war 2025 mit 251,8 Milliarden Euro Außenhandelsumsatz erneut Deutschlands wichtigster Handelspartner.',
      'Zahlungen in US-Dollar durchlaufen zwei Umrechnungsstufen (EUR→USD, USD→CNY) — bei Zahlung in CNY entfällt eine Stufe, üblicherweise 2–3 % günstiger.',
      'Der Renminbi wird in zwei Märkten gehandelt (onshore CNY, offshore CNH) mit unterschiedlichen, aber nah beieinanderliegenden Kursen.',
    ],
    sources: ['Statistisches Bundesamt, Pressemitteilung Nr. 056, Februar 2026'],
  },
  vietnam: {
    country: 'Vietnam', currency: 'VND', slug: 'vietnam',
    stats: [['0,5–5 %', 'Spanne möglicher Kursaufschläge'], ['2–5 Werktage', 'Laufzeit über Korrespondenzbanken'], ['USD', 'häufigste Rechnungswährung']],
    costRange: '0,5–5 %', avgVolume: '800.000 €', avgMarkup: '3,2 %',
    findings: [
      'Vietnam ist der wichtigste China-plus-eins-Standort für deutsche Importeure, gilt bei vielen Banken aber noch als „Exotenkorridor" mit entsprechend hohen Aufschlägen.',
      'Zahlungen laufen häufig über zwei Korrespondenzbanken, da viele deutsche Banken keine direkte Verbindung unterhalten — je 10 bis 30 Euro zusätzlich.',
      'Vietnamesische Exporteure fakturieren überwiegend in US-Dollar aus Gewohnheit, nicht aus Vorschrift; Fakturierung in Landeswährung ist verhandelbar.',
    ],
    sources: ['Exiap, SWIFT-Überweisung — Kosten, Dauer und Gebühren im Vergleich 2026'],
  },
  tuerkei: {
    country: 'Türkei', currency: 'TRY', slug: 'tuerkei',
    stats: [['60 Tage', 'typisches Zahlungsziel'], ['5–50 €', 'Grundgebühr je Überweisung'], ['TRY', 'hohe Kursbewegung im Zahlungsziel']],
    costRange: '0,5–5 %', avgVolume: '900.000 €', avgMarkup: '3,0 %',
    findings: [
      'Die Türkei ist der nächstgelegene Beschaffungsmarkt außerhalb der EU für deutsche Textil-, Automotive- und Lebensmittelimporteure.',
      'Bei 60 Tagen Zahlungsziel in Lira entsteht faktisch eine offene Währungsposition — ohne bewusste Entscheidung über Fakturierungswährung oder Kursfixierung ein unkontrolliertes Risiko.',
      'Bei 900.000 Euro Jahresvolumen bedeutet die Differenz zwischen 1 % und 3 % Kursaufschlag 18.000 Euro im Jahr.',
    ],
    sources: ['Exiap, SWIFT-Gebührenvergleich 2026'],
  },
  vae: {
    country: 'Vereinigte Arabische Emirate', currency: 'AED', slug: 'vae',
    stats: [['3,6725 AED', 'je USD (feste Kopplung)'], ['0 %', 'Wechselkursrisiko AED/USD'], ['volle Marge', 'was Banken trotzdem häufig berechnen']],
    costRange: '0,5–5 %', avgVolume: '1.500.000 €', avgMarkup: '2,2 %',
    findings: [
      'Der Dirham ist seit Jahrzehnten fest an den US-Dollar gekoppelt — Banken tragen praktisch kein Kursrisiko, berechnen aber denselben Aufschlag wie bei frei schwankenden Währungen.',
      'Die Marge lässt sich ohne Marktdaten selbst nachrechnen: EUR-Betrag über den öffentlichen EUR/USD-Kurs umrechnen, dann mit 3,6725 in Dirham — die Differenz zum gutgeschriebenen Betrag ist die Marge.',
      'Zahlungen an Freizonen-Gesellschaften lösen häufig Compliance-Rückfragen aus, insbesondere wenn Rechnungssteller und Warenlieferant nicht identisch sind.',
    ],
    sources: ['Öffentliche Wechselkursdaten, Latvijas Banka / EZB Referenzkurse'],
  },
};

module.exports = { BENCHMARK_REPORTS };
