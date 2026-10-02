/* HansePay — GDPR cookie consent + Google Analytics gate
 *
 * Google Analytics (GA4) is NOT loaded until the visitor explicitly consents.
 * Google Signals is switched off (no cross-device / ads personalization
 * signal sharing). Consent choice is recorded as a small JSON object (banner
 * version, timestamp, which category was granted) in a first-party cookie
 * (hp_consent) for 6 months, matching Cookie Policy § 7.3. Withdrawing
 * consent deletes the _ga / _ga_<id> cookies immediately and tells gtag to
 * stop sending hits. Other scripts (e.g. the first-party page-view counter
 * in nav.js) should call HPConsent.hasAnalyticsConsent() before tracking,
 * and listen for the 'hp:consentchange' event to react to live changes.
 */
(function () {
  'use strict';

  var GA_ID = 'G-5C26KG2J62';
  var GA_COOKIE_PREFIX = '_ga'; // covers _ga and _ga_<container-id>
  var COOKIE = 'hp_consent';
  var MAX_AGE = 60 * 60 * 24 * 182; // ~6 months
  var BANNER_VERSION = '2.0';      // bump when the banner text/options change materially

  // ── cookie helpers ──
  function getCookie(name) {
    return (document.cookie.split(';').map(function (c) { return c.trim(); })
      .find(function (c) { return c.indexOf(name + '=') === 0; }) || '').split('=').slice(1).join('=') || '';
  }
  function setCookie(name, val, maxAge) {
    var secure = location.protocol === 'https:' ? ';Secure' : '';
    document.cookie = name + '=' + encodeURIComponent(val) + ';Max-Age=' + (maxAge != null ? maxAge : MAX_AGE) + ';Path=/;SameSite=Lax' + secure;
  }
  function deleteCookie(name) {
    document.cookie = name + '=;Max-Age=0;Path=/;SameSite=Lax';
    // Cookies set by gtag.js are sometimes scoped to the registrable domain
    // with a leading dot — clear that variant too so _ga/_ga_* are fully gone.
    document.cookie = name + '=;Max-Age=0;Path=/;Domain=' + location.hostname + ';SameSite=Lax';
  }
  function deleteGACookies() {
    document.cookie.split(';').forEach(function (c) {
      var name = c.trim().split('=')[0];
      if (name.indexOf(GA_COOKIE_PREFIX) === 0) deleteCookie(name);
    });
  }

  function readChoice() {
    var raw = getCookie(COOKIE);
    if (!raw) return null;
    try { return JSON.parse(decodeURIComponent(raw)); } catch (e) { return null; }
  }
  function writeChoice(analytics, method) {
    var record = { analytics: !!analytics, version: BANNER_VERSION, method: method, timestamp: new Date().toISOString() };
    setCookie(COOKIE, JSON.stringify(record));
    return record;
  }

  function lang() {
    var l = 'de';
    try { l = localStorage.getItem('hp_lang') || (window.HP && window.HP.lang) || 'de'; } catch (e) {}
    return l === 'en' ? 'en' : 'de';
  }

  var T = {
    de: {
      title: 'Wir verwenden Cookies',
      body: 'Wir nutzen essenzielle Cookies für den Betrieb der Website und — mit Ihrer Einwilligung — Analyse-Cookies, um die Nutzung zu verstehen und unser Angebot zu verbessern.',
      accept: 'Alle akzeptieren',
      rejectAll: 'Alle ablehnen',
      manage: 'Einstellungen verwalten',
      save: 'Einstellungen speichern',
      back: 'Zurück',
      more: 'Cookie-Richtlinie',
      catEssentialTitle: 'Unbedingt erforderlich',
      catEssentialDesc: 'Werden für den Betrieb der Website und Ihres Kontos benötigt. Können nicht deaktiviert werden.',
      catAnalyticsTitle: 'Analyse',
      catAnalyticsDesc: 'Hilft uns zu verstehen, wie Besucher die Website nutzen. Nur mit Ihrer Einwilligung aktiv.',
      always: 'Immer aktiv',
      settingsLinkLabel: 'Cookie-Einstellungen',
    },
    en: {
      title: 'We use cookies',
      body: 'We use essential cookies to run the site and — with your consent — analytics cookies to understand usage and improve our service.',
      accept: 'Accept all',
      rejectAll: 'Reject all',
      manage: 'Manage settings',
      save: 'Save settings',
      back: 'Back',
      more: 'Cookie policy',
      catEssentialTitle: 'Strictly necessary',
      catEssentialDesc: 'Needed to run the website and keep your account secure. Cannot be switched off.',
      catAnalyticsTitle: 'Analytics',
      catAnalyticsDesc: 'Helps us understand how visitors use the site. Only active with your consent.',
      always: 'Always active',
      settingsLinkLabel: 'Cookie settings',
    },
  };

  // ── Google Analytics (loaded only on consent; Signals off) ──
  function loadGA() {
    if (window.__hpGA) {
      // Already loaded earlier in this session — just flip consent back on.
      if (window.gtag) window.gtag('consent', 'update', { analytics_storage: 'granted' });
      window['ga-disable-' + GA_ID] = false;
      return;
    }
    window.__hpGA = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('config', GA_ID, { anonymize_ip: true, allow_google_signals: false });
  }
  function disableGA() {
    window['ga-disable-' + GA_ID] = true; // tells gtag.js to stop sending hits, if already loaded
    if (window.gtag) window.gtag('consent', 'update', { analytics_storage: 'denied' });
    deleteGACookies();
  }

  // ── Banner UI ──
  var bannerEl = null;
  var view = 'main'; // 'main' | 'settings'
  var pendingAnalytics = false; // toggle state while the settings view is open

  function render() {
    var t = T[lang()];
    if (bannerEl) bannerEl.remove();
    var wrap = document.createElement('div');
    wrap.id = 'hp-consent';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-label', t.title);

    var styles =
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
      '#hp-consent button{flex:1;min-width:130px;padding:11px 16px;border-radius:100px;font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;transition:all .15s;border:1.5px solid transparent}' +
      '#hp-consent .hpc-accept{background:#1E4E80;color:#fff}' +
      '#hp-consent .hpc-accept:hover{background:#163659}' +
      '#hp-consent .hpc-ghost{background:#fff;color:#3D5A73;border-color:rgba(11,25,41,.16)}' +
      '#hp-consent .hpc-ghost:hover{border-color:rgba(11,25,41,.32)}' +
      '#hp-consent .hpc-cat{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:12px 0;border-top:1px solid rgba(11,25,41,.08)}' +
      '#hp-consent .hpc-cat:first-of-type{border-top:none}' +
      '#hp-consent .hpc-cat-title{font-size:13px;font-weight:600;color:#0B1929;margin-bottom:3px}' +
      '#hp-consent .hpc-cat-desc{font-size:12px;color:#3D5A73;line-height:1.5}' +
      '#hp-consent .hpc-switch{position:relative;width:38px;height:22px;flex-shrink:0;border-radius:100px;background:#D7E0E8;border:none;cursor:pointer;transition:background .15s}' +
      '#hp-consent .hpc-switch.on{background:#1E4E80}' +
      '#hp-consent .hpc-switch::after{content:"";position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .15s}' +
      '#hp-consent .hpc-switch.on::after{transform:translateX(16px)}' +
      '#hp-consent .hpc-always{font-size:11px;color:#7A9AB5;font-weight:600;white-space:nowrap}' +
      '@media(max-width:560px){#hp-consent button{flex:1 1 100%}}' +
      '</style>';

    var bodyHtml;
    if (view === 'main') {
      bodyHtml =
        '<h4>' + t.title + '</h4>' +
        '<p>' + t.body + ' <a class="hpc-link" href="/cookie-policy.html">' + t.more + '</a></p>' +
        '<div class="hpc-btns">' +
        '<button class="hpc-ghost" data-act="reject">' + t.rejectAll + '</button>' +
        '<button class="hpc-ghost" data-act="manage">' + t.manage + '</button>' +
        '<button class="hpc-accept" data-act="accept">' + t.accept + '</button>' +
        '</div>';
    } else {
      bodyHtml =
        '<h4>' + t.manage + '</h4>' +
        '<div class="hpc-cat"><div><div class="hpc-cat-title">' + t.catEssentialTitle + '</div><div class="hpc-cat-desc">' + t.catEssentialDesc + '</div></div><span class="hpc-always">' + t.always + '</span></div>' +
        '<div class="hpc-cat"><div><div class="hpc-cat-title">' + t.catAnalyticsTitle + '</div><div class="hpc-cat-desc">' + t.catAnalyticsDesc + '</div></div><button class="hpc-switch' + (pendingAnalytics ? ' on' : '') + '" data-act="toggle-analytics" role="switch" aria-checked="' + pendingAnalytics + '"></button></div>' +
        '<div class="hpc-btns" style="margin-top:16px">' +
        '<button class="hpc-ghost" data-act="back">' + t.back + '</button>' +
        '<button class="hpc-accept" data-act="save">' + t.save + '</button>' +
        '</div>';
    }

    wrap.innerHTML = styles + bodyHtml;
    document.body.appendChild(wrap);
    bannerEl = wrap;

    wrap.querySelectorAll('[data-act]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var act = btn.getAttribute('data-act');
        if (act === 'accept') commit(true, 'accept_all');
        else if (act === 'reject') commit(false, 'reject_all');
        else if (act === 'manage') { pendingAnalytics = false; view = 'settings'; render(); }
        else if (act === 'back') { view = 'main'; render(); }
        else if (act === 'toggle-analytics') { pendingAnalytics = !pendingAnalytics; render(); }
        else if (act === 'save') commit(pendingAnalytics, 'custom');
      });
    });
  }

  function commit(analytics, method) {
    var record = writeChoice(analytics, method);
    if (bannerEl) { bannerEl.remove(); bannerEl = null; }
    view = 'main';
    if (analytics) loadGA(); else disableGA();
    try { window.dispatchEvent(new CustomEvent('hp:consentchange', { detail: record })); } catch (e) {}
  }

  // Re-render banner text if the language changes while it's open
  window.addEventListener('hp:langchange', function () { if (bannerEl) render(); });

  // Public API
  window.HPConsent = {
    reopen: function () { view = 'main'; pendingAnalytics = (readChoice() || {}).analytics || false; render(); },
    revoke: function () { commit(false, 'reject_all'); },
    status: function () { var c = readChoice(); return c ? (c.analytics ? 'granted' : 'denied') : 'unset'; },
    getChoice: function () { return readChoice(); },
    hasAnalyticsConsent: function () { var c = readChoice(); return !!(c && c.analytics); },
    label: function () { return T[lang()].settingsLinkLabel; },
  };

  // ── Boot ──
  function init() {
    // Never show inside an iframe (e.g. the booking modal) — the top page owns consent.
    try { if (window.self !== window.top) return; } catch (e) { return; }
    var c = readChoice();
    if (c) {
      if (c.analytics) loadGA(); else disableGA();
      try { window.dispatchEvent(new CustomEvent('hp:consentchange', { detail: c })); } catch (e) {}
      return;
    }
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
