/* HansePay — GDPR cookie consent + Google Analytics gate
 *
 * Google Analytics (GA4) is NOT loaded until the visitor explicitly consents.
 * This satisfies GDPR / TTDSG (Germany): no non-essential cookies or third-party
 * scripts before opt-in. Consent is stored in a first-party cookie (hp_consent)
 * for 6 months. Visitors can change their choice any time via HPConsent.reopen().
 */
(function () {
  'use strict';

  var GA_ID = 'G-5C26KG2J62';
  var COOKIE = 'hp_consent';       // values: 'granted' | 'denied'
  var MAX_AGE = 60 * 60 * 24 * 182; // ~6 months

  // ── helpers ──
  function getCookie(name) {
    return (document.cookie.split(';').map(function (c) { return c.trim(); })
      .find(function (c) { return c.indexOf(name + '=') === 0; }) || '').split('=')[1] || '';
  }
  function setCookie(name, val) {
    var secure = location.protocol === 'https:' ? ';Secure' : '';
    document.cookie = name + '=' + val + ';Max-Age=' + MAX_AGE + ';Path=/;SameSite=Lax' + secure;
  }
  function lang() {
    var l = 'de';
    try { l = localStorage.getItem('hp_lang') || (window.HP && window.HP.lang) || 'de'; } catch (e) {}
    return l === 'en' ? 'en' : 'de';
  }

  var T = {
    de: {
      title: 'Wir verwenden Cookies',
      body: 'Wir nutzen essenzielle Cookies für den Betrieb der Website und – mit Ihrer Einwilligung – Google Analytics, um die Nutzung zu verstehen und unser Angebot zu verbessern.',
      accept: 'Alle akzeptieren',
      decline: 'Nur essenzielle',
      more: 'Cookie-Richtlinie',
      manage: 'Cookie-Einstellungen',
    },
    en: {
      title: 'We use cookies',
      body: 'We use essential cookies to run the site and — with your consent — Google Analytics to understand usage and improve our service.',
      accept: 'Accept all',
      decline: 'Essential only',
      more: 'Cookie policy',
      manage: 'Cookie settings',
    },
  };

  // ── Google Analytics (loaded only on consent) ──
  function loadGA() {
    if (window.__hpGA) return;
    window.__hpGA = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('config', GA_ID, { anonymize_ip: true });
  }

  // ── Banner UI ──
  var bannerEl = null;
  function buildBanner() {
    var t = T[lang()];
    if (bannerEl) bannerEl.remove();
    var wrap = document.createElement('div');
    wrap.id = 'hp-consent';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-label', t.title);
    wrap.innerHTML =
      '<style>' +
      '#hp-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:99999;max-width:520px;margin:0 auto;' +
      'background:#fff;border:1px solid rgba(11,25,41,.1);border-radius:16px;box-shadow:0 12px 40px rgba(6,13,26,.22);' +
      'padding:22px 24px;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;' +
      'animation:hpcUp .3s cubic-bezier(.4,0,.2,1)}' +
      '@keyframes hpcUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}' +
      '#hp-consent h4{margin:0 0 7px;font-size:15px;font-weight:700;color:#0B1929}' +
      '#hp-consent p{margin:0 0 16px;font-size:13px;line-height:1.55;color:#3D5A73}' +
      '#hp-consent a.hpc-link{color:#1E4E80;text-decoration:underline}' +
      '#hp-consent .hpc-btns{display:flex;gap:10px;flex-wrap:wrap}' +
      '#hp-consent button{flex:1;min-width:130px;padding:11px 18px;border-radius:100px;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;border:1.5px solid transparent}' +
      '#hp-consent .hpc-accept{background:#1E4E80;color:#fff}' +
      '#hp-consent .hpc-accept:hover{background:#163659}' +
      '#hp-consent .hpc-decline{background:#fff;color:#3D5A73;border-color:rgba(11,25,41,.16)}' +
      '#hp-consent .hpc-decline:hover{border-color:rgba(11,25,41,.32)}' +
      '@media(max-width:560px){#hp-consent button{flex:1 1 100%}}' +
      '</style>' +
      '<h4>' + t.title + '</h4>' +
      '<p>' + t.body + ' <a class="hpc-link" href="/cookie-policy.html">' + t.more + '</a></p>' +
      '<div class="hpc-btns">' +
      '<button class="hpc-decline" type="button">' + t.decline + '</button>' +
      '<button class="hpc-accept" type="button">' + t.accept + '</button>' +
      '</div>';
    document.body.appendChild(wrap);
    bannerEl = wrap;
    wrap.querySelector('.hpc-accept').addEventListener('click', function () { choose('granted'); });
    wrap.querySelector('.hpc-decline').addEventListener('click', function () { choose('denied'); });
  }

  function choose(val) {
    setCookie(COOKIE, val);
    if (bannerEl) { bannerEl.remove(); bannerEl = null; }
    if (val === 'granted') loadGA();
  }

  // Re-render banner text if the language changes while it's open
  window.addEventListener('hp:langchange', function () { if (bannerEl) buildBanner(); });

  // Public API (e.g. a "Manage cookies" link in the footer / cookie policy)
  window.HPConsent = {
    reopen: function () { buildBanner(); },
    revoke: function () { setCookie(COOKIE, 'denied'); location.reload(); },
    status: function () { return getCookie(COOKIE) || 'unset'; },
    label: function () { return T[lang()].manage; },
  };

  // ── Boot ──
  function init() {
    // Never show inside an iframe (e.g. the booking modal) — the top page owns consent.
    try { if (window.self !== window.top) return; } catch (e) { return; }
    var c = getCookie(COOKIE);
    if (c === 'granted') { loadGA(); return; }
    if (c === 'denied') { return; }
    buildBanner();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
