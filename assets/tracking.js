/* ════════════════════════════════════════════════════════════════
   HansePay Landing Pages — Page-Level Tracking
   Include on every page, after nav.js: <script src="/assets/tracking.js"></script>
   Fires page_view + scroll_depth automatically. hero_primary /
   hero_secondary / book_call fire via data-track="..." attributes:
     <a href="/gespraech/" data-track="hero_primary">Gespräch buchen</a>
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.dataLayer = window.dataLayer || [];
  function track(event, data) { window.dataLayer.push(Object.assign({ event: event }, data || {})); }

  track('page_view', {
    page: location.pathname,
    utm_source: new URLSearchParams(location.search).get('utm_source') || undefined,
    utm_campaign: new URLSearchParams(location.search).get('utm_campaign') || undefined,
    ref: new URLSearchParams(location.search).get('ref') || undefined,
  });

  // Scroll depth — fires each milestone once per page view
  var firedDepths = {};
  var milestones = [25, 50, 75, 100];
  function checkScrollDepth() {
    var scrolled = window.scrollY + window.innerHeight;
    var full = document.documentElement.scrollHeight;
    var pct = Math.round((scrolled / full) * 100);
    milestones.forEach(function (m) {
      if (pct >= m && !firedDepths[m]) {
        firedDepths[m] = true;
        track('scroll_depth', { depth: m, page: location.pathname });
      }
    });
  }
  var scrollTimer;
  window.addEventListener('scroll', function () {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(checkScrollDepth, 150);
  }, { passive: true });

  // Generic data-track click handler — used for hero_primary, hero_secondary,
  // book_call and any other one-off CTA the page markup wants tracked.
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-track]');
    if (!el) return;
    track(el.getAttribute('data-track'), { page: location.pathname, href: el.getAttribute('href') || undefined });
  });
})();
