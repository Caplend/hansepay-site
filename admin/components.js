/* HansePay Admin — shared components & helpers (CRM / Sales / Marketing) */
(function () {
  'use strict';

  var API = 'https://hansepay-deploy-production-328c.up.railway.app';
  var token = localStorage.getItem('hp_token');
  if (!token) { window.location.href = '/hansepay/admin/login.html'; return; }
  var user = JSON.parse(localStorage.getItem('hp_user') || 'null');

  function signOut() {
    localStorage.removeItem('hp_token');
    localStorage.removeItem('hp_user');
    window.location.href = '/hansepay/admin/login.html';
  }

  function authFetch(url, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }, opts.headers || {});
    return fetch(API + url, opts).then(function (r) {
      if (r.status === 401) { signOut(); throw new Error('unauthorised'); }
      return r;
    });
  }

  // ── Formatting helpers ──
  function eur(n) {
    n = Number(n) || 0;
    if (Math.abs(n) >= 1e6) return '€' + (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1) + 'M';
    if (Math.abs(n) >= 1e3) return '€' + Math.round(n / 1e3) + 'k';
    return '€' + n;
  }
  function eurFull(n) { return '€' + (Number(n) || 0).toLocaleString('en-GB'); }
  function num(n) { return (Number(n) || 0).toLocaleString('en-GB'); }
  function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function fmtDateTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
  function timeAgo(iso) {
    if (!iso) return '';
    var d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (d <= 0) return 'today';
    if (d === 1) return 'yesterday';
    if (d < 30) return d + 'd ago';
    if (d < 365) return Math.floor(d / 30) + 'mo ago';
    return Math.floor(d / 365) + 'y ago';
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function initials(name) {
    return String(name || 'A').split(' ').map(function (w) { return w[0]; }).join('').substring(0, 2).toUpperCase();
  }
  function healthColor(score) {
    if (score >= 80) return '#16a34a';
    if (score >= 65) return '#65a30d';
    if (score >= 40) return '#d97706';
    return '#dc2626';
  }
  function healthHtml(h) {
    if (!h) return '—';
    var c = healthColor(h.score);
    return '<span class="health"><span class="health-bar"><span class="health-fill" style="width:' + h.score + '%;background:' + c + '"></span></span>' +
      '<span class="health-num" style="color:' + c + '">' + h.score + '</span></span>';
  }

  var toastTimer;
  function toast(msg, type) {
    var t = document.getElementById('hp-toast');
    if (!t) { t = document.createElement('div'); t.id = 'hp-toast'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.className = 'toast show' + (type ? ' ' + type : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = 'toast'; }, 3000);
  }

  // ── Sidebar ──
  var ICONS = {
    dash: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    pipeline: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    mega: '<path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M5.34 18.66l-1.41 1.41M19.07 19.07l-1.41-1.41M5.34 5.34L3.93 3.93M21 12h-2M5 12H3M12 21v-2M12 5V3"/>',
    signout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  };
  function svg(p) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'; }

  var NAV = [
    { sec: 'Main' },
    { key: 'dash', label: 'Dashboard', href: '/hansepay/admin/', icon: 'dash' },
    { key: 'bookings', label: 'Bookings', href: '/hansepay/admin/bookings.html', icon: 'cal' },
    { sec: 'Growth' },
    { key: 'sales', label: 'Sales Pipeline', href: '/hansepay/admin/sales.html', icon: 'pipeline' },
    { key: 'crm', label: 'Customers (CRM)', href: '/hansepay/admin/crm.html', icon: 'users' },
    { key: 'enrich', label: 'Enrichment', href: '/hansepay/admin/enrich.html', icon: 'sparkle' },
    { key: 'marketing', label: 'Marketing', href: '/hansepay/admin/marketing.html', icon: 'mega' },
    { sec: 'Content' },
    { key: 'posts', label: 'Posts', href: '/hansepay/admin/posts.html', icon: 'doc' },
    { key: 'new-post', label: 'New Post', href: '/hansepay/admin/new-post.html', icon: 'plus' },
    { sec: 'Optimise' },
    { key: 'seo', label: 'SEO Manager', href: '/hansepay/admin/seo.html', icon: 'search' },
    { key: 'analytics', label: 'Analytics', href: '/hansepay/admin/analytics.html', icon: 'pipeline' },
    { sec: 'Admin' },
    { key: 'users', label: 'Users', href: '/hansepay/admin/users.html', icon: 'users' },
    { key: 'settings', label: 'Settings', href: '/hansepay/admin/settings.html', icon: 'settings' },
  ];

  function renderSidebar(active) {
    var nav = NAV.map(function (n) {
      if (n.sec) return '<span class="nav-section">' + n.sec + '</span>';
      return '<a href="' + n.href + '" class="nav-item' + (n.key === active ? ' active' : '') + '">' + svg(ICONS[n.icon]) + n.label + '</a>';
    }).join('');

    var ini = initials(user && user.name);
    var html =
      '<aside class="sidebar">' +
      '<div class="sidebar-logo"><div><div class="sidebar-brand">HansePay</div><span class="sidebar-admin-badge">Admin</span></div></div>' +
      '<nav class="sidebar-nav">' + nav + '</nav>' +
      '<div class="sidebar-footer"><div class="sidebar-user">' +
      '<div class="sidebar-avatar" id="hp-side-avatar">' + ini + '</div>' +
      '<div class="sidebar-user-info"><div class="sidebar-user-name" id="hp-side-name">' + escapeHtml((user && user.name) || 'Admin') + '</div>' +
      '<div class="sidebar-user-email" id="hp-side-email">' + escapeHtml((user && user.email) || '') + '</div></div></div>' +
      '<button class="signout-link" id="hp-signout">' + svg(ICONS.signout) + 'Sign out</button>' +
      '</div></aside>';

    var mount = document.getElementById('hp-sidebar');
    if (mount) mount.outerHTML = html; else document.body.insertAdjacentHTML('afterbegin', html);
    document.getElementById('hp-signout').addEventListener('click', signOut);

    // Validate token + refresh user info
    authFetch('/api/auth/me').then(function (r) { return r.json(); }).then(function (me) {
      if (me && me.name) {
        document.getElementById('hp-side-avatar').textContent = initials(me.name);
        document.getElementById('hp-side-name').textContent = me.name;
        if (me.email) document.getElementById('hp-side-email').textContent = me.email;
        var ta = document.getElementById('hp-topbar-avatar'); if (ta) ta.textContent = initials(me.name);
        var tn = document.getElementById('hp-topbar-name'); if (tn) tn.textContent = me.name;
      }
    }).catch(function () {});
  }

  window.HPAdmin = {
    API: API, token: token, user: user, authFetch: authFetch, signOut: signOut,
    renderSidebar: renderSidebar, toast: toast,
    eur: eur, eurFull: eurFull, num: num, fmtDate: fmtDate, fmtDateTime: fmtDateTime,
    timeAgo: timeAgo, escapeHtml: escapeHtml, initials: initials,
    healthColor: healthColor, healthHtml: healthHtml,
  };
})();
