/* ════════════════════════════════════════════════════════════════
   HansePay Landing Pages — Savings Calculator
   One shared script for every corridor / currency / industry page.
   Each page just needs:
     <div id="hp-calc"
          data-currency="INR" data-country="Indien"
          data-markup="0.028"        (the "other provider" markup this
                                       page assumes — corridor-specific)
          data-cluster="korridor" data-landing-page="zahlungen/indien">
     </div>
     <script src="/assets/calculator.js"></script>

   ⚠️ HANSEPAY_MARKUP below is a PLACEHOLDER (0.004 = 0.4%) per the
   spec — replace with the real condition before go-live, or every
   page will show a number sales can't actually honour.

   ⚠️ This value must match HANSEPAY_MARKUP in hansepay-site/server.js
   (this copy drives the instant on-page result; the server copy is
   what actually gets stored, routed, and put in the PDF) — update
   BOTH repos or the on-page number and the emailed PDF will disagree.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var HANSEPAY_MARKUP = 0.004;   // ⚠️ placeholder — see note above
  var BASE_FEE_PER_PAYMENT = 25; // €, midpoint of the 5–50€ range
  var CORR_BANK_FEE_PER_PAYMENT = 40; // €, 2 correspondent banks × 10–30€

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function fmtEUR(n) {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  }
  // Accepts German-formatted input ("1.200.000", "1.200.000,50", or plain
  // "1200000") and returns a JS number. Strips thousands separators (.),
  // then turns the decimal comma into a period for parseFloat.
  function parseDeNumber(str) {
    if (!str) return NaN;
    var cleaned = String(str).trim().replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned);
  }
  // Live thousands-separator formatting as the user types, German style.
  // Only touches the integer part — a typed comma + digits (decimals) is
  // left alone so the user can keep typing fractional cents naturally.
  function liveFormatDeNumber(input) {
    input.addEventListener('input', function () {
      var caretFromEnd = input.value.length - input.selectionStart;
      var raw = input.value.replace(/[^0-9,]/g, '');
      var parts = raw.split(',');
      var intPart = parts[0].replace(/^0+(?=\d)/, '');
      var formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      input.value = parts.length > 1 ? formattedInt + ',' + parts[1] : formattedInt;
      var pos = Math.max(0, input.value.length - caretFromEnd);
      input.setSelectionRange(pos, pos);
    });
  }
  function track(event, data) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: event }, data || {}));
  }
  function getParam(name) {
    return new URLSearchParams(location.search).get(name) || '';
  }

  function initCalculator(mount) {
    var currency   = mount.dataset.currency || '';
    var country    = mount.dataset.country || '';
    var markup     = parseFloat(mount.dataset.markup) || 0.03;
    var cluster    = mount.dataset.cluster || '';
    var landingPage = mount.dataset.landingPage || location.pathname.replace(/^\//, '');

    mount.innerHTML =
      '<div class="calc-widget">' +
        '<div class="calc-head">' +
          '<div class="calc-head-title">Ersparnis berechnen</div>' +
          '<div class="calc-head-sub">' + (country ? 'Für Zahlungen nach ' + country : 'Für Ihre grenzüberschreitenden Zahlungen') + '</div>' +
        '</div>' +
        '<div class="calc-body">' +
          '<div class="calc-row">' +
            '<div class="calc-field"><label>Jahresvolumen (EUR)</label><input type="text" id="hpc-volume" placeholder="z. B. 1.200.000" inputmode="decimal"></div>' +
            '<div class="calc-field"><label>Zahlungen pro Jahr</label><input type="text" id="hpc-count" placeholder="z. B. 48" inputmode="numeric"></div>' +
          '</div>' +
          '<button class="btn btn-primary calc-submit" id="hpc-submit">Jetzt berechnen</button>' +
        '</div>' +
        '<div class="calc-result" id="hpc-result">' +
          '<div class="calc-result-headline">Ihre geschätzte jährliche Ersparnis</div>' +
          '<div class="calc-result-amount" id="hpc-saving">—</div>' +
          '<div class="calc-result-sub">im Vergleich zu Ihrer aktuellen Bank, hochgerechnet auf ein Jahr</div>' +
          '<div class="calc-breakdown" id="hpc-breakdown"></div>' +
          '<div class="calc-gate" id="hpc-gate">' +
            '<div class="calc-gate-title">Vollständige Aufschlüsselung als PDF erhalten</div>' +
            '<div class="calc-gate-row">' +
              '<input type="email" id="hpc-email" placeholder="ihre@firma.de" required>' +
              '<button class="btn btn-primary" id="hpc-gate-submit">Senden</button>' +
            '</div>' +
            '<div id="hpc-gate-status" style="font-size:12.5px;margin-top:8px"></div>' +
          '</div>' +
          '<div class="calc-disclaimer">Diese Berechnung ist eine Schätzung auf Basis marktüblicher Aufschläge und Bankgebühren, kein verbindliches Angebot. Ihre tatsächliche Ersparnis hängt von Ihrem individuellen Zahlungsverkehr ab.</div>' +
        '</div>' +
      '</div>';

    liveFormatDeNumber(qs('#hpc-volume', mount));

    var lastResult = null;

    function calculate() {
      var volume = parseDeNumber(qs('#hpc-volume', mount).value) || 0;
      var count  = parseInt(qs('#hpc-count', mount).value.replace(/\D/g, ''), 10) || 0;
      if (volume <= 0 || count <= 0) return;

      var fxMarkupCost   = volume * markup;
      var baseFees       = BASE_FEE_PER_PAYMENT * count;
      var corrBankFees   = CORR_BANK_FEE_PER_PAYMENT * count;
      var currentCost    = fxMarkupCost + baseFees + corrBankFees;
      var hansepayCost   = volume * HANSEPAY_MARKUP;
      var saving         = Math.max(0, currentCost - hansepayCost);

      lastResult = {
        currency: currency, country: country, volume: volume, count: count,
        markup: markup, current_cost: Math.round(currentCost),
        hansepay_cost: Math.round(hansepayCost), saving: Math.round(saving),
      };

      qs('#hpc-saving', mount).textContent = fmtEUR(saving);
      qs('#hpc-breakdown', mount).innerHTML =
        '<div class="calc-breakdown-row"><span>Wechselkurs-Aufschlag Ihrer Bank</span><span>' + fmtEUR(fxMarkupCost) + '</span></div>' +
        '<div class="calc-breakdown-row"><span>Grundgebühren (' + count + '× 25 €)</span><span>' + fmtEUR(baseFees) + '</span></div>' +
        '<div class="calc-breakdown-row"><span>Fremdspesen Korrespondenzbanken (' + count + '× 40 €)</span><span>' + fmtEUR(corrBankFees) + '</span></div>' +
        '<div class="calc-breakdown-row total"><span>Aktuelle Kosten gesamt</span><span>' + fmtEUR(currentCost) + '</span></div>' +
        '<div class="calc-breakdown-row total" style="color:var(--success)"><span>Mit HansePay</span><span>' + fmtEUR(hansepayCost) + '</span></div>';

      qs('#hpc-result', mount).classList.add('show');
      track('calc_result', { currency: currency, country: country, saving: lastResult.saving });
      qs('#hpc-result', mount).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    qs('#hpc-submit', mount).addEventListener('click', function () {
      track('calc_submit', { currency: currency, country: country, cluster: cluster });
      calculate();
    });

    qs('#hpc-gate-submit', mount).addEventListener('click', function () {
      if (!lastResult) return;
      var email = qs('#hpc-email', mount).value.trim();
      var status = qs('#hpc-gate-status', mount);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        status.textContent = 'Bitte eine gültige E-Mail-Adresse eingeben.';
        status.style.color = '#dc2626';
        return;
      }
      var btn = qs('#hpc-gate-submit', mount);
      btn.disabled = true;
      track('calc_gate_submit', { currency: currency, country: country });

      fetch('/api/lead/calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          result: lastResult,
          attribution: {
            utm_source: getParam('utm_source'), utm_medium: getParam('utm_medium'),
            utm_campaign: getParam('utm_campaign'), ref: getParam('ref'),
            landing_page: landingPage, cluster: cluster,
          },
        }),
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (res) {
          if (res.ok && res.data.ok) {
            status.textContent = 'Fast geschafft — bitte bestätigen Sie Ihre E-Mail-Adresse, wir senden Ihnen dann die vollständige Aufschlüsselung als PDF.';
            status.style.color = 'var(--success)';
            qs('#hpc-gate', mount).style.opacity = '.6';
            track('calc_lead', { currency: currency, country: country, saving: lastResult.saving });
          } else {
            status.textContent = (res.data && res.data.error) || 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.';
            status.style.color = '#dc2626';
            btn.disabled = false;
          }
        })
        .catch(function () {
          status.textContent = 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.';
          status.style.color = '#dc2626';
          btn.disabled = false;
        });
    });
  }

  document.querySelectorAll('#hp-calc, .hp-calc').forEach(initCalculator);
})();
