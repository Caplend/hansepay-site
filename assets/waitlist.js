/* ════════════════════════════════════════════════════════════════
   HansePay Landing Pages — Waitlist Widget
   <div id="hp-waitlist" data-landing-page="wissen/whats-a-corridor"></div>
   <script src="/assets/waitlist.js"></script>
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function track(event, data) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: event }, data || {}));
  }
  function getParam(name) { return new URLSearchParams(location.search).get(name) || ''; }

  function initWaitlist(mount) {
    var landingPage = mount.dataset.landingPage || location.pathname.replace(/^\//, '');
    var refCode = getParam('ref');

    mount.innerHTML =
      '<div class="wl-widget">' +
        '<div id="hpw-form">' +
          '<div class="calc-field"><label>E-Mail</label><input type="email" id="hpw-email" placeholder="ihre@firma.de"></div>' +
          '<div class="calc-field"><label>Unternehmen (optional)</label><input type="text" id="hpw-company" placeholder="Firmenname"></div>' +
          '<button class="btn btn-primary calc-submit" id="hpw-submit">Auf die Warteliste</button>' +
          '<div id="hpw-status" style="font-size:12.5px;margin-top:8px"></div>' +
        '</div>' +
        '<div class="wl-position" id="hpw-position">' +
          '<div class="wl-position-num" id="hpw-num">—</div>' +
          '<div class="calc-result-sub">Ihr Platz auf der Warteliste</div>' +
          '<div class="wl-referral" id="hpw-referral"></div>' +
        '</div>' +
      '</div>';

    qs('#hpw-submit', mount).addEventListener('click', function () {
      var email = qs('#hpw-email', mount).value.trim();
      var company = qs('#hpw-company', mount).value.trim();
      var status = qs('#hpw-status', mount);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        status.textContent = 'Bitte eine gültige E-Mail-Adresse eingeben.';
        status.style.color = '#dc2626';
        return;
      }
      var btn = qs('#hpw-submit', mount);
      btn.disabled = true;
      track('waitlist_submit', { landing_page: landingPage });

      fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email, company: company,
          landing_page: landingPage, ref: refCode || undefined,
          utm_source: getParam('utm_source'), utm_medium: getParam('utm_medium'), utm_campaign: getParam('utm_campaign'),
        }),
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (res) {
          if (res.ok && res.data.position) {
            qs('#hpw-form', mount).style.display = 'none';
            var posEl = qs('#hpw-position', mount);
            posEl.classList.add('show');
            qs('#hpw-num', mount).textContent = '#' + res.data.position;
            var shareUrl = location.origin + location.pathname + '?ref=' + res.data.referral_code;
            qs('#hpw-referral', mount).innerHTML =
              'Jede Empfehlung, die sich bestätigt, bringt Sie 25 Plätze nach vorn.<br>' +
              'Ihr Link: <code id="hpw-share-link">' + shareUrl + '</code> ' +
              '<button class="linklike" id="hpw-copy" style="font-size:12.5px;margin-left:6px">Kopieren</button>';
            qs('#hpw-copy', mount).addEventListener('click', function () {
              navigator.clipboard.writeText(shareUrl).then(function () {
                track('referral_copy', { landing_page: landingPage });
                var c = qs('#hpw-copy', mount);
                var orig = c.textContent; c.textContent = 'Kopiert ✓';
                setTimeout(function () { c.textContent = orig; }, 2000);
              });
            });
            track('waitlist_signup', { landing_page: landingPage, position: res.data.position });
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

  document.querySelectorAll('#hp-waitlist, .hp-waitlist').forEach(initWaitlist);
})();
