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
  bangladesch: {
    country: 'Bangladesch', currency: 'BDT', slug: 'bangladesch',
    stats: [['Akkreditiv', 'als dominierendes Zahlungsinstrument'], ['2–5 Tage', 'Laufzeit klassischer Überweisungen'], ['Mehrstufig', 'typische Korrespondenzbankwege']],
    costRange: '0,5–5 %', avgVolume: '600.000 €', avgMarkup: '3,5 %',
    findings: [
      'Ein Großteil der Zahlungen im Bekleidungseinkauf aus Bangladesch läuft über Akkreditive — sinnvoll bei neuen Lieferanten, teuer bei eingespielten Beziehungen.',
      'Zahlungen laufen typischerweise über eine oder zwei Zwischenbanken, häufig in London oder Singapur, mit je 10 bis 30 Euro zusätzlichen Kosten.',
      'Bei kleinen Rechnungsbeträgen kann die Gebührenlast zweistellige Prozentsätze des Betrags erreichen.',
    ],
    sources: ['Exiap, SWIFT-Gebührenvergleich 2026'],
  },
  thailand: {
    country: 'Thailand', currency: 'THB', slug: 'thailand',
    stats: [['2 Kurse', 'bei Zahlung in USD'], ['1–2 Tage', 'realistische Gutschrift'], ['THB', 'Betriebswährung des Lieferanten']],
    costRange: '0,5–5 %', avgVolume: '700.000 €', avgMarkup: '2,8 %',
    findings: [
      'Thailändische Lieferanten fakturieren häufig in US-Dollar, arbeiten aber in Baht — die Lücke zwischen beiden Währungen kostet auf beiden Seiten.',
      'Ein Vergleichsangebot in THB neben dem USD-Angebot zeigt die genaueste Messung der Währungskosten ohne Bankdaten.',
      'Verzögerungen entstehen fast immer aus abweichenden Empfängernamen oder fehlendem Rechnungsbezug im Verwendungszweck.',
    ],
    sources: ['HansePay-Analyse auf Basis öffentlicher Marktdaten'],
  },
  indonesien: {
    country: 'Indonesien', currency: 'IDR', slug: 'indonesien',
    stats: [['Belegpflicht', 'der Empfängerbank'], ['2–5 Tage', 'typische SWIFT-Laufzeit'], ['IDR', 'Umrechnung meist vor Ort']],
    costRange: '0,5–5 %', avgVolume: '500.000 €', avgMarkup: '3,3 %',
    findings: [
      'Indonesische Banken ordnen eingehende Auslandszahlungen einem wirtschaftlichen Zweck zu — fehlt der Bezug, bleibt das Geld in der Klärung.',
      'Bei kleinen Zahlungen (Anzahlungen, Musterlieferungen) kann die Gebührenlast über fünf Prozent erreichen, bevor der Wechselkurs überhaupt einbezogen wird.',
      'Der Verwendungszweck ist in diesem Korridor Teil der Lieferkette, nicht nur ein Formularfeld.',
    ],
    sources: ['Exiap, SWIFT-Gebührenvergleich 2026'],
  },
  japan: {
    country: 'Japan', currency: 'JPY', slug: 'japan',
    stats: [['Top 3', 'meistgehandelte Währungen weltweit'], ['Minimal', 'Beschaffungsrisiko'], ['1–2 Tage', 'übliche Gutschrift']],
    costRange: '0,5–5 %', avgVolume: '1.100.000 €', avgMarkup: '2,0 %',
    findings: [
      'Der Yen gehört zu den meistgehandelten Währungen der Welt mit minimalen Spannen im Interbankenmarkt — Firmenkunden-Aufschläge lassen sich damit selten mit Beschaffungskosten begründen.',
      'Bei Präzisionsgütern mit langen Vorlaufzeiten trifft eine Kursbewegung zwischen Bestellung und Zahlung direkt die Marge eines bereits verkauften Produkts.',
      'Den Kurs bei Bestellung festzuschreiben ist hier Teil der Angebotskalkulation, kein separates Finanzthema.',
    ],
    sources: ['HansePay-Analyse auf Basis öffentlicher Marktdaten'],
  },
  suedkorea: {
    country: 'Südkorea', currency: 'KRW', slug: 'suedkorea',
    stats: [['USD', 'häufigste Rechnungswährung'], ['Onshore', 'Umrechnung in Won'], ['1–3 Tage', 'übliche Gutschrift']],
    costRange: '0,5–5 %', avgVolume: '1.400.000 €', avgMarkup: '2,4 %',
    findings: [
      'Der Koreanische Won wird außerhalb des Landes nur begrenzt gehandelt — die Umrechnung übernimmt meist die Bank des Lieferanten, unsichtbar für den Käufer.',
      'Bei Fakturierung in US-Dollar entstehen zwei Umrechnungsstufen: Euro–Dollar (verhandelbar) und Dollar–Won (nicht sichtbar).',
      'Bei Konzernstrukturen ist der Bezug zwischen Rechnungssteller und Kontoinhaber der häufigste Klärungspunkt der Empfängerbank.',
    ],
    sources: ['HansePay-Analyse auf Basis öffentlicher Marktdaten'],
  },
  marokko: {
    country: 'Marokko', currency: 'MAD', slug: 'marokko',
    stats: [['19,8 Mio.', 'Touristen 2025 (+14 %)'], ['Nicht frei', 'konvertierbarer Dirham'], ['1–3 Tage', 'übliche Gutschrift']],
    costRange: '0,5–5 %', avgVolume: '900.000 €', avgMarkup: '3,2 %',
    findings: [
      'Der marokkanische Devisenverkehr wird vom Office des Changes geregelt; laufende Zahlungen für Waren und Dienstleistungen sind liberalisiert, aber dokumentationspflichtig.',
      'Der Dirham ist keine frei konvertierbare Währung — die Umrechnung findet im Wesentlichen im Land statt.',
      'Der Engpass liegt fast immer beim Nachweis auf der Empfängerseite, selten bei der absendenden Bank.',
    ],
    sources: ['Tourismusministerium Marokko, Januar 2026', 'Devisenrecht Marokko (Office des Changes)'],
  },
  tunesien: {
    country: 'Tunesien', currency: 'TND', slug: 'tunesien',
    stats: [['Nicht konv.', 'Dinar nicht konvertierbar'], ['Autorisiert', 'Banken als einziger Weg'], ['Belegpflicht', 'für jede Gutschrift']],
    costRange: '0,5–5 %', avgVolume: '700.000 €', avgMarkup: '3,4 %',
    findings: [
      'Der Tunesische Dinar wird außerhalb des Landes nicht gehandelt und darf nicht ausgeführt werden — die Umrechnung findet ausschließlich im Land über autorisierte Banken statt.',
      'Verträge sollten festlegen, welcher Betrag geschuldet ist (Euro oder Dinar-Gegenwert), um Streit über nicht vereinbarte Kursdifferenzen zu vermeiden.',
      'Häufigste Gründe für hängende Zahlungen: abweichender Empfängername, fehlender Rechnungsbezug, oder Zahlung passt nicht zur angemeldeten Geschäftstätigkeit.',
    ],
    sources: ['HansePay-Analyse auf Basis öffentlicher Marktdaten'],
  },
};

module.exports = { BENCHMARK_REPORTS };
