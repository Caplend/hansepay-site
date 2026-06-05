(function(){
  // 1. Inject nav CSS into <head>
  if (!document.getElementById('hp-nav-css')) {
    var st = document.createElement('style');
    st.id = 'hp-nav-css';
    st.textContent = `
/* ── NAV ── */
nav{position:fixed;top:0;left:0;right:0;z-index:200;padding:0 clamp(20px,5vw,80px);height:68px;display:flex;align-items:center;transition:background .35s,box-shadow .35s,backdrop-filter .35s}
nav.scrolled{background:rgba(255,255,255,.97);box-shadow:0 1px 0 rgba(11,25,41,.08);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.nav-inner{max-width:1240px;margin:0 auto;width:100%;display:flex;align-items:center;gap:0}
.nav-logo{display:flex;align-items:center;gap:10px;text-decoration:none;flex-shrink:0;margin-right:40px}
.nav-logo img{height:28px;width:28px;object-fit:contain;filter:brightness(0) invert(1);transition:filter .35s}
nav.scrolled .nav-logo img{filter:none}
.nav-logo-text{font-family:var(--font-logo);font-size:19px;font-weight:400;letter-spacing:-.02em;color:#fff;line-height:1;transition:color .25s}
nav.scrolled .nav-logo-text{color:var(--n800)}
.nav-links{display:flex;align-items:stretch;gap:0;list-style:none;flex:1;height:68px}
.nav-item{position:relative;display:flex;align-items:center}
.nav-link{display:flex;align-items:center;gap:5px;font-size:14px;font-weight:500;color:rgba(255,255,255,.78);transition:color .15s;white-space:nowrap;padding:0 16px;height:100%;cursor:pointer}
nav.scrolled .nav-link{color:rgba(11,25,41,.68)}
.nav-link:hover,.nav-link.active-page{color:#fff}
nav.scrolled .nav-link:hover,nav.scrolled .nav-link.active-page{color:var(--n700)}
.nav-link svg{transition:transform .2s ease;flex-shrink:0}
.nav-item:hover .nav-link svg{transform:rotate(180deg)}
.nav-dropdown{position:absolute;top:calc(100% + 1px);left:50%;transform:translateX(-50%);width:260px;
  background:rgba(12,22,38,.96);backdrop-filter:blur(24px) saturate(1.5);-webkit-backdrop-filter:blur(24px) saturate(1.5);
  border:1px solid rgba(255,255,255,.12);border-radius:16px;
  box-shadow:0 8px 32px rgba(0,0,0,.4),0 32px 80px rgba(0,0,0,.32),inset 0 1px 0 rgba(255,255,255,.18);
  padding:10px;opacity:0;pointer-events:none;transform:translateX(-50%) translateY(-6px);
  transition:opacity .18s ease,transform .18s ease}
.nav-item:hover .nav-dropdown{opacity:1;pointer-events:auto;transform:translateX(-50%) translateY(0)}
.nav-dropdown-section{padding:6px 0 2px}
.nav-dropdown-label{font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.30);padding:4px 12px 8px;display:block}
.nav-dd-link{display:flex;align-items:center;gap:12px;padding:9px 12px;border-radius:9px;text-decoration:none;transition:background .14s}
.nav-dd-link:hover{background:rgba(255,255,255,.07)}
.nav-dd-icon{width:32px;height:32px;border-radius:8px;background:rgba(141,189,230,.10);border:1px solid rgba(141,189,230,.16);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.nav-dd-icon svg{width:14px;height:14px;color:var(--n200)}
.nav-dd-text{flex:1;min-width:0}
.nav-dd-title{font-size:13px;font-weight:600;color:#fff;line-height:1.2}
.nav-dd-sub{font-size:11px;color:rgba(255,255,255,.40);margin-top:1px;line-height:1.3}
.nav-dd-active .nav-dd-icon{background:rgba(201,169,97,.14);border-color:rgba(201,169,97,.24)}
.nav-dd-active .nav-dd-icon svg{color:var(--gold)}
.nav-dd-active .nav-dd-title{color:var(--gold)}
.nav-dropdown-sep{height:1px;background:rgba(255,255,255,.08);margin:6px 0}
.nav-right{display:flex;align-items:center;gap:8px;margin-left:16px;flex-shrink:0}
.nav-signin{background:none;border:none;color:rgba(255,255,255,.7);padding:4px 2px;font-size:13px;font-weight:500;cursor:pointer;font-family:var(--font-ui);transition:color .18s;letter-spacing:.01em}
.nav-signin:hover{color:#fff}
nav.scrolled .nav-signin{color:var(--ink3)}
nav.scrolled .nav-signin:hover{color:var(--ink)}
.nav-cta{background:rgba(255,255,255,.12);color:#fff;border:1.5px solid rgba(255,255,255,.28);padding:8px 20px;font-size:13px;border-radius:var(--r-pill);backdrop-filter:blur(8px)}
.nav-cta:hover{background:rgba(255,255,255,.2);border-color:rgba(255,255,255,.45)}
nav.scrolled .nav-cta{background:var(--n500);border-color:var(--n500);backdrop-filter:none}
nav.scrolled .nav-cta:hover{background:var(--n600)}
/* Sign-in modal */
.hp-signin-overlay{position:fixed;inset:0;background:rgba(6,13,26,.55);z-index:9000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);animation:hpFadeIn .2s ease}
@keyframes hpFadeIn{from{opacity:0}to{opacity:1}}
.hp-signin-modal{background:#fff;border-radius:20px;padding:36px 40px;max-width:420px;width:100%;box-shadow:0 24px 60px rgba(6,13,26,.28);position:relative;animation:hpSlideUp .25s cubic-bezier(.4,0,.2,1)}
@keyframes hpSlideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.hp-signin-close{position:absolute;top:16px;right:18px;background:rgba(11,25,41,.07);border:none;width:30px;height:30px;border-radius:50%;font-size:18px;cursor:pointer;color:var(--ink3);line-height:1;display:flex;align-items:center;justify-content:center}
.hp-signin-close:hover{background:rgba(11,25,41,.14);color:var(--ink)}
.hp-signin-logo{margin-bottom:22px;display:flex;align-items:center}
.hp-signin-title{font-family:var(--font-logo);font-size:1.5rem;font-weight:400;color:var(--n800);margin-bottom:6px}
.hp-signin-sub{font-size:14px;color:var(--ink3);margin-bottom:24px}
.hp-signin-coming{display:flex;gap:14px;background:var(--n050);border-radius:12px;padding:18px 20px;margin-bottom:22px;align-items:flex-start}
.hp-signin-coming-icon{font-size:22px;flex-shrink:0;margin-top:1px}
.hp-signin-coming-label{font-size:14px;font-weight:700;color:var(--n700);margin-bottom:4px}
.hp-signin-coming-text{font-size:13px;color:var(--ink2);line-height:1.5}
.hp-signin-book{display:block;background:var(--n500);color:#fff;text-align:center;padding:13px 24px;border-radius:var(--r-pill);font-family:var(--font-ui);font-size:14px;font-weight:600;text-decoration:none;margin-bottom:16px;transition:.18s}
.hp-signin-book:hover{background:var(--n600)}
.hp-signin-footer{font-size:12px;color:var(--ink3);text-align:center;line-height:1.5}
@media(max-width:480px){.hp-signin-modal{padding:28px 24px}.hp-signin-title{font-size:1.25rem}}
.nav-burger{display:none;flex-direction:column;gap:5px;cursor:pointer;padding:6px;border:none;background:none}
.nav-burger span{display:block;width:22px;height:2px;border-radius:2px;background:rgba(255,255,255,.85);transition:all .22s ease}
nav.scrolled .nav-burger span{background:var(--n700)}
.nav-burger.open span:nth-child(1){transform:translateY(7px) rotate(45deg)}
.nav-burger.open span:nth-child(2){opacity:0;transform:scaleX(0)}
.nav-burger.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
.mobile-menu{display:none;position:fixed;top:68px;left:0;right:0;background:rgba(12,22,38,.97);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,.07);padding:24px clamp(20px,5vw,80px);z-index:199;flex-direction:column;gap:4px;max-height:calc(100vh - 68px);overflow-y:auto}
.mobile-menu.open{display:flex}
.mobile-menu-link{font-size:16px;font-weight:500;color:rgba(255,255,255,.7);padding:12px 0;border-bottom:1px solid rgba(255,255,255,.07)}
.mobile-menu-sub{font-size:14px;color:rgba(255,255,255,.45);padding:8px 0 8px 16px;border-bottom:1px solid rgba(255,255,255,.05)}
.mobile-menu-link:last-of-type,.mobile-menu-sub:last-of-type{border-bottom:none}
.mobile-menu-cta{margin-top:16px}
@media(max-width:768px){.nav-links{display:none}.nav-burger{display:flex}.nav-inner{justify-content:space-between}.nav-logo{margin-right:0}.nav-cta{display:none}.nav-signin{display:none}}
/* ── LANG TOGGLE (floating, fixed bottom-right) ── */
.hp-lang-float{position:fixed;bottom:24px;right:24px;z-index:300;display:flex;align-items:center;gap:2px;background:rgba(11,25,41,.92);border:1px solid rgba(255,255,255,.15);border-radius:100px;padding:4px;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 4px 16px rgba(0,0,0,.28);}
.nav-lang-btn{padding:6px 13px;border-radius:100px;border:none;font-family:var(--font-ui,sans-serif);font-size:12px;font-weight:700;letter-spacing:.06em;cursor:pointer;transition:all .18s ease;background:transparent;color:rgba(255,255,255,.55);}
.nav-lang-btn.active{background:var(--n500,#1E4E80);color:#fff;}
@media(max-width:768px){.hp-lang-float{bottom:16px;right:16px;}}
.mobile-lang-toggle{display:flex;gap:6px;padding:16px 0 8px;border-top:1px solid rgba(255,255,255,.07);margin-top:4px;}
.mobile-lang-btn{flex:1;padding:9px;border-radius:8px;border:1.5px solid rgba(255,255,255,.15);background:transparent;font-family:var(--font-ui,sans-serif);font-size:13px;font-weight:600;color:rgba(255,255,255,.5);cursor:pointer;transition:all .18s;}
.mobile-lang-btn.active{background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.3);}
`;
    document.head.appendChild(st);
  }

  // 2. Inject nav HTML
  var NAV_HTML = `
<nav id="main-nav">
  <div class="nav-inner">
    <a href="index.html" class="nav-logo">
      <img src="assets/hansepay-mark-uploaded.png" alt="HansePay" />
      <span class="nav-logo-text">HansePay</span>
    </a>
    <ul class="nav-links">

      <!-- Platform -->
      <li class="nav-item">
        <span class="nav-link"><span data-i18n="nav.platform">Platform</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </span>
        <div class="nav-dropdown">
          <div class="nav-dropdown-section">
            <span class="nav-dropdown-label" data-i18n="nav.platform">Platform</span>
            <a href="platform.html" class="nav-dd-link">
              <div class="nav-dd-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></div>
              <div class="nav-dd-text"><div class="nav-dd-title" data-i18n="nav.platform.overview">Overview</div><div class="nav-dd-sub" data-i18n="nav.platform.overview.sub">See the full platform at a glance</div></div>
            </a>
            <a href="platform-technology.html" class="nav-dd-link">
              <div class="nav-dd-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg></div>
              <div class="nav-dd-text"><div class="nav-dd-title" data-i18n="nav.platform.tech">Technology</div><div class="nav-dd-sub" data-i18n="nav.platform.tech.sub">The infrastructure behind every transfer</div></div>
            </a>
          </div>
        </div>
      </li>

      <!-- Solutions -->
      <li class="nav-item">
        <span class="nav-link"><span data-i18n="nav.solutions">Solutions</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </span>
        <div class="nav-dropdown" style="width:300px">
          <div class="nav-dropdown-section">
            <span class="nav-dropdown-label" data-i18n="nav.solutions.by-industry">By Industry</span>
            <a href="solutions-ecommerce.html" class="nav-dd-link">
              <div class="nav-dd-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></div>
              <div class="nav-dd-text"><div class="nav-dd-title" data-i18n="nav.solutions.ecom">E-Commerce &amp; Retail</div><div class="nav-dd-sub" data-i18n="nav.solutions.ecom.sub">Supplier payments, bulk FX, emerging markets</div></div>
            </a>
            <a href="solutions-manufacturing.html" class="nav-dd-link">
              <div class="nav-dd-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>
              <div class="nav-dd-text"><div class="nav-dd-title" data-i18n="nav.solutions.mfg">Import &amp; Manufacturing</div><div class="nav-dd-sub" data-i18n="nav.solutions.mfg.sub">Industrial FX, big-ticket execution, supply chain</div></div>
            </a>
            <a href="solutions-logistics.html" class="nav-dd-link">
              <div class="nav-dd-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></div>
              <div class="nav-dd-text"><div class="nav-dd-title" data-i18n="nav.solutions.log">Logistics &amp; Freight</div><div class="nav-dd-sub" data-i18n="nav.solutions.log.sub">Same-day execution, agent networks, maritime</div></div>
            </a>
          </div>
          <div class="nav-dropdown-sep"></div>
          <div class="nav-dropdown-section">
            <span class="nav-dropdown-label" data-i18n="nav.solutions.by-size">By Business Size</span>
            <a href="solutions-corporate.html" class="nav-dd-link">
              <div class="nav-dd-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
              <div class="nav-dd-text"><div class="nav-dd-title" data-i18n="nav.solutions.corp">Mid &amp; Large Business</div><div class="nav-dd-sub" data-i18n="nav.solutions.corp.sub">Institutional pricing, named expert, &gt;€2M</div></div>
            </a>
            <a href="solutions-sme.html" class="nav-dd-link">
              <div class="nav-dd-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
              <div class="nav-dd-text"><div class="nav-dd-title" data-i18n="nav.solutions.sme">Small Business</div><div class="nav-dd-sub" data-i18n="nav.solutions.sme.sub">No minimum volume, same-day, interbank rates</div></div>
            </a>
          </div>
        </div>
      </li>

      <!-- About -->
      <li class="nav-item">
        <span class="nav-link"><span data-i18n="nav.about">About</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </span>
        <div class="nav-dropdown" style="width:270px">
          <div class="nav-dropdown-section">
            <span class="nav-dropdown-label" data-i18n="nav.about.label">About HansePay</span>
            <a href="about-vision.html" class="nav-dd-link">
              <div class="nav-dd-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></div>
              <div class="nav-dd-text"><div class="nav-dd-title" data-i18n="nav.about.vision">Vision &amp; Mission</div><div class="nav-dd-sub" data-i18n="nav.about.vision.sub">Why we built HansePay</div></div>
            </a>
            <a href="about-team.html" class="nav-dd-link">
              <div class="nav-dd-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
              <div class="nav-dd-text"><div class="nav-dd-title" data-i18n="nav.about.team">Team &amp; History</div><div class="nav-dd-sub" data-i18n="nav.about.team.sub">Founders, advisors, offices &amp; milestones</div></div>
            </a>
            <a href="about-licenses.html" class="nav-dd-link">
              <div class="nav-dd-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
              <div class="nav-dd-text"><div class="nav-dd-title" data-i18n="nav.about.licenses">Licenses</div><div class="nav-dd-sub" data-i18n="nav.about.licenses.sub">MiCAR, BaFin, GDPR, ISO 27001</div></div>
            </a>
          </div>
        </div>
      </li>

      <!-- Insights -->
      <li class="nav-item">
        <span class="nav-link"><span data-i18n="nav.insights">Insights</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </span>
        <div class="nav-dropdown" style="width:270px">
          <div class="nav-dropdown-section">
            <span class="nav-dropdown-label" data-i18n="nav.insights">Insights</span>
            <a href="insights-stories.html" class="nav-dd-link">
              <div class="nav-dd-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>
              <div class="nav-dd-text"><div class="nav-dd-title" data-i18n="nav.insights.stories">Customer stories</div><div class="nav-dd-sub" data-i18n="nav.insights.stories.sub">Real customers. Real results.</div></div>
            </a>
            <a href="insights-market.html" class="nav-dd-link">
              <div class="nav-dd-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg></div>
              <div class="nav-dd-text"><div class="nav-dd-title" data-i18n="nav.insights.market">Market insights</div><div class="nav-dd-sub" data-i18n="nav.insights.market.sub">Currency analysis, weekly</div></div>
            </a>
            <a href="events.html" class="nav-dd-link">
              <div class="nav-dd-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
              <div class="nav-dd-text"><div class="nav-dd-title" data-i18n="nav.insights.events">Events</div><div class="nav-dd-sub" data-i18n="nav.insights.events.sub">Where to find us this season</div></div>
            </a>
          </div>
          <div class="nav-dropdown-sep"></div>
          <div class="nav-dropdown-section">
            <span class="nav-dropdown-label" data-i18n="nav.tools.label">Free tools</span>
            <a href="tools-calculator.html" class="nav-dd-link">
              <div class="nav-dd-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/></svg></div>
              <div class="nav-dd-text"><div class="nav-dd-title" data-i18n="nav.tools.calc">FX Savings Calculator</div><div class="nav-dd-sub" data-i18n="nav.tools.calc.sub">Estimate your annual saving</div></div>
            </a>
            <a href="tools-converter.html" class="nav-dd-link">
              <div class="nav-dd-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/></svg></div>
              <div class="nav-dd-text"><div class="nav-dd-title" data-i18n="nav.tools.conv">Currency Converter</div><div class="nav-dd-sub" data-i18n="nav.tools.conv.sub">Live mid-market rates</div></div>
            </a>
            <a href="tools-iban.html" class="nav-dd-link">
              <div class="nav-dd-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
              <div class="nav-dd-text"><div class="nav-dd-title" data-i18n="nav.tools.iban">IBAN Verifier</div><div class="nav-dd-sub" data-i18n="nav.tools.iban.sub">Validate format and bank details</div></div>
            </a>
          </div>
        </div>
      </li>

    </ul>
    <div class="nav-right">
      <button class="btn nav-signin" id="nav-signin-btn" onclick="openSignIn()" data-i18n="nav.signin">Sign in</button>
      <a href="/onboarding.html" class="btn nav-cta" data-i18n="nav.cta">Open an account</a>
      <button class="nav-burger" id="nav-burger" aria-label="Menu"><span></span><span></span><span></span></button>
    </div>
  </div>
</nav>
<!-- Floating language toggle (fixed bottom-right) -->
<div class="hp-lang-float" id="nav-lang-toggle">
  <button class="nav-lang-btn active" id="nav-btn-de" onclick="HP.setLang('de')">DE</button>
  <button class="nav-lang-btn" id="nav-btn-en" onclick="HP.setLang('en')">EN</button>
</div>
<!-- Sign-in modal -->
<div class="hp-signin-overlay" id="hp-signin-overlay" onclick="if(event.target===this)closeSignIn()" style="display:none">
  <div class="hp-signin-modal" id="hp-signin-modal" role="dialog" aria-modal="true">
    <button class="hp-signin-close" onclick="closeSignIn()" aria-label="Close">×</button>
    <div class="hp-signin-logo">
      <img src="/assets/hansepay-mark-uploaded.png" width="28" height="28" alt="HansePay" style="vertical-align:middle;margin-right:9px">
      <span style="font-family:var(--font-logo);font-size:20px;font-weight:400;color:var(--n800)">HansePay</span>
    </div>
    <h2 class="hp-signin-title" id="hp-signin-title" data-i18n="signin.title">Sign in to your account</h2>
    <p class="hp-signin-sub" id="hp-signin-sub" data-i18n="signin.sub">Access your HansePay dashboard.</p>
    <div class="hp-signin-coming">
      <div class="hp-signin-coming-icon">🚀</div>
      <div>
        <div class="hp-signin-coming-label" data-i18n="signin.soon.title">Customer portal launching soon</div>
        <div class="hp-signin-coming-text" data-i18n="signin.soon.body">We're putting the finishing touches on your account dashboard. In the meantime, speak with your dedicated FX specialist.</div>
      </div>
    </div>
    <a href="/booking.html" class="hp-signin-book" onclick="closeSignIn()" data-i18n="signin.book">Book a discovery call →</a>
    <p class="hp-signin-footer" data-i18n="signin.footer">Already working with us? Your specialist will share your portal access link once it's ready.</p>
  </div>
</div>
<div class="mobile-menu" id="mobile-menu">
  <a class="mobile-menu-link" href="index.html" onclick="closeMobileMenu()" data-i18n="nav.home">Home</a>
  <a class="mobile-menu-link" href="platform.html" onclick="closeMobileMenu()" data-i18n="nav.platform">Platform</a>
  <a class="mobile-menu-sub" href="platform-technology.html" onclick="closeMobileMenu()" data-i18n="nav.platform.tech">Technology</a>
  <a class="mobile-menu-link" href="solutions-ecommerce.html" onclick="closeMobileMenu()" data-i18n="nav.solutions">Solutions</a>
  <a class="mobile-menu-sub" href="solutions-ecommerce.html" onclick="closeMobileMenu()" data-i18n="nav.solutions.ecom">E-Commerce &amp; Retail</a>
  <a class="mobile-menu-sub" href="solutions-manufacturing.html" onclick="closeMobileMenu()" data-i18n="nav.solutions.mfg">Import &amp; Manufacturing</a>
  <a class="mobile-menu-sub" href="solutions-logistics.html" onclick="closeMobileMenu()" data-i18n="nav.solutions.log">Logistics &amp; Freight</a>
  <a class="mobile-menu-sub" href="solutions-corporate.html" onclick="closeMobileMenu()" data-i18n="nav.solutions.corp">Mid &amp; Large Business</a>
  <a class="mobile-menu-sub" href="solutions-sme.html" onclick="closeMobileMenu()" data-i18n="nav.solutions.sme">Small Business</a>
  <a class="mobile-menu-link" href="about-vision.html" onclick="closeMobileMenu()" data-i18n="nav.about">About</a>
  <a class="mobile-menu-sub" href="about-vision.html" onclick="closeMobileMenu()" data-i18n="nav.about.vision">Vision &amp; Mission</a>
  <a class="mobile-menu-sub" href="about-team.html" onclick="closeMobileMenu()" data-i18n="nav.about.team">Team &amp; History</a>
  <a class="mobile-menu-sub" href="about-licenses.html" onclick="closeMobileMenu()" data-i18n="nav.about.licenses">Licenses</a>
  <a class="mobile-menu-link" href="insights-stories.html" onclick="closeMobileMenu()" data-i18n="nav.insights">Insights</a>
  <a class="mobile-menu-sub" href="insights-stories.html" onclick="closeMobileMenu()" data-i18n="nav.insights.stories">Customer stories</a>
  <a class="mobile-menu-sub" href="insights-market.html" onclick="closeMobileMenu()" data-i18n="nav.insights.market">Market insights</a>
  <a class="mobile-menu-sub" href="events.html" onclick="closeMobileMenu()" data-i18n="nav.insights.events">Events</a>
  <a class="mobile-menu-sub" href="tools-calculator.html" onclick="closeMobileMenu()" data-i18n="nav.tools.calc">FX Savings Calculator</a>
  <a class="mobile-menu-sub" href="tools-converter.html" onclick="closeMobileMenu()" data-i18n="nav.tools.conv">Currency Converter</a>
  <a class="mobile-menu-sub" href="tools-iban.html" onclick="closeMobileMenu()" data-i18n="nav.tools.iban">IBAN Verifier</a>
  <a href="/onboarding.html" class="btn btn-primary mobile-menu-cta" onclick="closeMobileMenu()" data-i18n="nav.cta">Open an account</a>
  <div class="mobile-lang-toggle">
    <button class="mobile-lang-btn active" id="mob-btn-de" onclick="HP.setLang('de')">DE</button>
    <button class="mobile-lang-btn" id="mob-btn-en" onclick="HP.setLang('en')">EN</button>
  </div>
</div>
`;

  var s = document.currentScript;
  var tmp = document.createElement('div');
  tmp.innerHTML = NAV_HTML;
  while (tmp.firstChild) s.parentNode.insertBefore(tmp.firstChild, s);

  // 3. Active-page detection
  (function setActive(){
    var file = window.location.pathname
      .replace(/^\/hansepay\//, '/')
      .replace(/^\//, '') || 'index.html';
    file = file.split('#')[0].split('?')[0] || 'index.html';

    document.querySelectorAll('a.nav-dd-link').forEach(function(a){
      var href = (a.getAttribute('href')||'').split('#')[0];
      if (href && href === file) {
        a.classList.add('nav-dd-active');
        var item = a.closest('.nav-item');
        if (item) {
          var pl = item.querySelector('.nav-link');
          if (pl) pl.classList.add('active-page');
        }
      }
    });
    document.querySelectorAll('li.nav-item > a.nav-link').forEach(function(a){
      var href = (a.getAttribute('href')||'').split('#')[0];
      if (href && href === file) a.classList.add('active-page');
    });

    // Section-based activations
    var prefixes = [
      {prefix:'solutions-', text:'Solutions'},
      {prefix:'platform', text:'Platform'},
      {prefix:'about-', text:'About'},
      {prefix:'insights-', text:'Insights'},
      {prefix:'events', text:'Insights'},
      {prefix:'tools', text:'Insights'}
    ];
    prefixes.forEach(function(p){
      if(file.startsWith(p.prefix)){
        document.querySelectorAll('.nav-item .nav-link').forEach(function(el){
          if(el.textContent.trim().startsWith(p.text)) el.classList.add('active-page');
        });
      }
    });
  })();

  // 4. Scroll + burger
  // Returns true if the luminance of an rgb(...) / rgba(...) string is light (>0.55)
  function isLightColor(cssColor) {
    var m = cssColor.match(/[\d.]+/g);
    if (!m || m.length < 3) return false;
    var r = +m[0], g = +m[1], b = +m[2], a = m[3] !== undefined ? +m[3] : 1;
    if (a < 0.15) return false; // nearly transparent — ignore
    var lum = (0.299*r + 0.587*g + 0.114*b) / 255;
    return lum > 0.55;
  }

  // Walk up from el looking for a non-transparent background
  function resolvedBg(el) {
    while (el && el !== document.documentElement) {
      var bg = window.getComputedStyle(el).backgroundColor;
      if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') return bg;
      el = el.parentElement;
    }
    return window.getComputedStyle(document.body).backgroundColor;
  }

  // Decide whether the nav needs to start solid (light page top) or can stay
  // transparent (dark hero). Checks the first content element visible at y=80px.
  function needsSolidNav() {
    // Honour an explicit override: data-nav="dark" → always transparent; data-nav="light" → always solid
    var attr = document.body.getAttribute('data-nav');
    if (attr === 'dark')  return false;
    if (attr === 'light') return true;

    // Auto-detect: find the topmost element behind the nav
    var candidates = ['[class*="hero"]', 'section', 'main', 'header:not(#main-nav)'];
    for (var i = 0; i < candidates.length; i++) {
      var el = document.querySelector(candidates[i]);
      if (!el) continue;
      var bg = resolvedBg(el);
      if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
        return isLightColor(bg);
      }
    }
    return false; // Default: transparent nav (dark hero assumed)
  }

  function openSignIn() {
    var overlay = document.getElementById('hp-signin-overlay');
    if (overlay) { overlay.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
    // Apply current language to modal
    if (window.HP && window.HP.apply) window.HP.apply();
  }
  function closeSignIn() {
    var overlay = document.getElementById('hp-signin-overlay');
    if (overlay) { overlay.style.display = 'none'; document.body.style.overflow = ''; }
  }
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeSignIn(); });
  window.openSignIn  = openSignIn;
  window.closeSignIn = closeSignIn;

  function initNav(){
    var nav = document.getElementById('main-nav');
    if (!nav) return;

    // Apply solid state immediately if the page has a light top section
    var forceSolid = needsSolidNav();
    if (forceSolid) nav.classList.add('nav-force-solid');

    window.addEventListener('scroll', function(){
      var solid = scrollY > 20 || forceSolid;
      nav.classList.toggle('scrolled', solid);
    }, {passive:true});
    if (scrollY > 20 || forceSolid) nav.classList.add('scrolled');

    var burger = document.getElementById('nav-burger');
    var menu   = document.getElementById('mobile-menu');
    if (burger && menu) {
      burger.addEventListener('click', function(){
        var open = menu.classList.toggle('open');
        burger.classList.toggle('open', open);
        document.body.style.overflow = open ? 'hidden' : '';
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initNav);
  else initNav();

  window.closeMobileMenu = function(){
    var menu   = document.getElementById('mobile-menu');
    var burger = document.getElementById('nav-burger');
    if (menu)   menu.classList.remove('open');
    if (burger) burger.classList.remove('open');
    document.body.style.overflow = '';
  };

  // ── Booking modal ─────────────────────────────────────────────────────────
  if (!document.getElementById('hp-bm-css')) {
    var bmSt = document.createElement('style');
    bmSt.id = 'hp-bm-css';
    bmSt.textContent = `
/* Overlay */
.hp-bm-overlay{position:fixed;inset:0;z-index:9000;background:rgba(6,13,26,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;pointer-events:none;transition:opacity .28s ease}
.hp-bm-overlay.hp-bm-open{opacity:1;pointer-events:auto}

/* Main panel */
.hp-bm-panel{width:100%;max-width:1060px;height:100%;max-height:720px;border-radius:20px;overflow:hidden;display:flex;box-shadow:0 40px 100px rgba(6,13,26,.55),0 0 0 1px rgba(255,255,255,.06);transform:translateY(18px) scale(.97);transition:transform .35s cubic-bezier(.22,.68,0,1.2),opacity .28s ease;opacity:0}
.hp-bm-overlay.hp-bm-open .hp-bm-panel{transform:translateY(0) scale(1);opacity:1}

/* Left branding column */
.hp-bm-left{width:320px;flex-shrink:0;background:linear-gradient(160deg,#0B1929 0%,#0F2540 45%,#163659 100%);padding:40px 36px;display:flex;flex-direction:column;position:relative;overflow:hidden}
.hp-bm-left::before{content:'';position:absolute;right:-80px;top:-80px;width:320px;height:320px;background:radial-gradient(circle,rgba(46,107,173,.35) 0%,transparent 70%);pointer-events:none}
.hp-bm-left::after{content:'';position:absolute;left:-40px;bottom:-60px;width:240px;height:240px;background:radial-gradient(circle,rgba(30,78,128,.25) 0%,transparent 70%);pointer-events:none}

.hp-bm-left-logo{display:flex;align-items:center;gap:10px;margin-bottom:auto;text-decoration:none}
.hp-bm-left-logo img{height:26px;width:26px;object-fit:contain}
.hp-bm-left-logo-text{font-family:'Libre Baskerville',Georgia,serif;font-size:17px;font-weight:400;color:#fff;letter-spacing:-.02em}

.hp-bm-left-body{margin:auto 0;padding:32px 0}
.hp-bm-left-eyebrow{font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(141,189,230,.7);margin-bottom:14px}
.hp-bm-left-headline{font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#fff;line-height:1.15;letter-spacing:-.02em;margin-bottom:8px}
.hp-bm-left-headline em{font-style:italic;color:#8DBDE6}
.hp-bm-left-sub{font-size:13px;color:rgba(255,255,255,.45);line-height:1.6;margin-bottom:32px}

.hp-bm-left-items{display:flex;flex-direction:column;gap:14px}
.hp-bm-left-item{display:flex;align-items:flex-start;gap:12px}
.hp-bm-left-item-icon{width:28px;height:28px;border-radius:8px;background:rgba(141,189,230,.12);border:1px solid rgba(141,189,230,.18);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
.hp-bm-left-item-icon svg{width:13px;height:13px;stroke:#8DBDE6}
.hp-bm-left-item-text{font-size:13px;color:rgba(255,255,255,.7);line-height:1.5}
.hp-bm-left-item-text strong{display:block;color:#fff;font-size:13px;font-weight:600;margin-bottom:1px}

.hp-bm-left-footer{margin-top:auto;padding-top:24px;border-top:1px solid rgba(255,255,255,.07)}
.hp-bm-left-footer-text{font-size:11px;color:rgba(255,255,255,.25);line-height:1.5}
.hp-bm-left-footer-text strong{color:rgba(255,255,255,.4)}

/* Right content column */
.hp-bm-right{flex:1;background:#F6F9FC;display:flex;flex-direction:column;min-width:0;position:relative}
.hp-bm-right-head{display:flex;align-items:center;justify-content:flex-end;padding:16px 20px;flex-shrink:0;background:#F6F9FC;border-bottom:1px solid rgba(11,25,41,.06)}
.hp-bm-close{width:32px;height:32px;border:1.5px solid rgba(11,25,41,.12);border-radius:8px;background:#fff;color:rgba(11,25,41,.45);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;flex-shrink:0}
.hp-bm-close:hover{border-color:rgba(11,25,41,.3);color:rgba(11,25,41,.8);background:#fff;box-shadow:0 2px 8px rgba(11,25,41,.08)}
.hp-bm-close svg{width:14px;height:14px;stroke:currentColor}
.hp-bm-iframe{flex:1;border:none;width:100%;display:block;min-height:0}

/* Mobile: stack vertically, full screen */
@media(max-width:720px){
  .hp-bm-overlay{padding:0}
  .hp-bm-panel{max-width:100%;max-height:100%;border-radius:0;flex-direction:column}
  .hp-bm-left{width:100%;flex-shrink:0;padding:24px 24px 20px;flex-direction:row;align-items:center;gap:16px}
  .hp-bm-left::before,.hp-bm-left::after{display:none}
  .hp-bm-left-body,.hp-bm-left-items,.hp-bm-left-footer{display:none}
  .hp-bm-left-logo{margin-bottom:0}
  .hp-bm-left-eyebrow{display:none}
  .hp-bm-right-head{display:none}
  .hp-bm-close-mobile{display:flex!important;margin-left:auto}
}
.hp-bm-close-mobile{display:none;width:32px;height:32px;border:1.5px solid rgba(255,255,255,.2);border-radius:8px;background:transparent;color:rgba(255,255,255,.6);align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:all .15s}
.hp-bm-close-mobile:hover{border-color:rgba(255,255,255,.5);color:#fff}
.hp-bm-close-mobile svg{width:14px;height:14px;stroke:currentColor}
`;
    document.head.appendChild(bmSt);
  }

  function openBookingModal() {
    var overlay = document.getElementById('hp-bm-overlay');
    if (!overlay) {
      var closeIconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      overlay = document.createElement('div');
      overlay.id = 'hp-bm-overlay';
      overlay.className = 'hp-bm-overlay';
      overlay.innerHTML =
        '<div class="hp-bm-panel">' +
          // Left branding panel
          '<div class="hp-bm-left">' +
            '<a class="hp-bm-left-logo" href="index.html">' +
              '<img src="assets/hansepay-mark-uploaded-white.png" alt="HansePay"/>' +
              '<span class="hp-bm-left-logo-text">HansePay</span>' +
            '</a>' +
            '<button class="hp-bm-close-mobile" id="hp-bm-close-mobile" aria-label="Close">' + closeIconSvg + '</button>' +
            '<div class="hp-bm-left-body">' +
              '<p class="hp-bm-left-eyebrow">Discovery Call</p>' +
              '<h2 class="hp-bm-left-headline">Talk to an<br><em>FX specialist.</em></h2>' +
              '<p class="hp-bm-left-sub">30 minutes. We map your payment flows and show you exactly what you&rsquo;d save.</p>' +
              '<div class="hp-bm-left-items">' +
                '<div class="hp-bm-left-item">' +
                  '<div class="hp-bm-left-item-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>' +
                  '<div class="hp-bm-left-item-text"><strong>30 minutes</strong>No lengthy sales process</div>' +
                '</div>' +
                '<div class="hp-bm-left-item">' +
                  '<div class="hp-bm-left-item-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>' +
                  '<div class="hp-bm-left-item-text"><strong>No commitment</strong>Just an honest conversation</div>' +
                '</div>' +
                '<div class="hp-bm-left-item">' +
                  '<div class="hp-bm-left-item-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>' +
                  '<div class="hp-bm-left-item-text"><strong>Regulated by BaFin</strong>EU E-Money Institution</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="hp-bm-left-footer">' +
              '<p class="hp-bm-left-footer-text"><strong>HansePay</strong> &middot; Hamburg, Germany<br>A brand of Caplend Technologies GmbH</p>' +
            '</div>' +
          '</div>' +
          // Right booking panel
          '<div class="hp-bm-right">' +
            '<div class="hp-bm-right-head">' +
              '<button class="hp-bm-close" id="hp-bm-close-btn" aria-label="Close">' + closeIconSvg + '</button>' +
            '</div>' +
            '<iframe class="hp-bm-iframe" id="hp-bm-iframe" src="" title="Book a discovery call"></iframe>' +
          '</div>' +
        '</div>';
      document.body.appendChild(overlay);

      // Close handlers
      overlay.addEventListener('click', function(e){ if (e.target === overlay) closeBookingModal(); });
      document.getElementById('hp-bm-close-btn').addEventListener('click', closeBookingModal);
      document.getElementById('hp-bm-close-mobile').addEventListener('click', closeBookingModal);
      document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeBookingModal(); });
      window.addEventListener('message', function(e){
        if (e.data && e.data.type === 'hp-booking-complete') {
          // Track confirmed booking in funnel
          try {
            fetch('/api/analytics/event', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ event: 'booking_confirmed', page: window.location.pathname })
            });
          } catch(ex) {}
        }
      });
    }
    var iframe = document.getElementById('hp-bm-iframe');
    iframe.src = 'booking.html?modal=1';
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function(){
      overlay.classList.add('hp-bm-open');
    });
    // Track funnel event
    try {
      fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'booking_modal_open', page: window.location.pathname })
      });
    } catch(e) {}
  }

  function closeBookingModal() {
    var overlay = document.getElementById('hp-bm-overlay');
    if (!overlay) return;
    overlay.classList.remove('hp-bm-open');
    document.body.style.overflow = '';
    setTimeout(function(){
      var iframe = document.getElementById('hp-bm-iframe');
      if (iframe) iframe.src = '';
    }, 400);
  }

  // Intercept ALL clicks on links pointing to booking.html
  document.addEventListener('click', function(e){
    var link = e.target.closest('a[href="booking.html"], a[href*="booking.html"]');
    if (!link) return;
    if (window.location.pathname.endsWith('booking.html')) return;
    e.preventDefault();
    closeMobileMenu();
    openBookingModal();
  });

  // ── i18n engine ──────────────────────────────────────────────────────────────
  var HP_DICT = {
    en: {
      // Nav
      'nav.home':'Home','nav.platform':'Platform','nav.solutions':'Solutions',
      'nav.signin':'Sign in',
      'signin.title':'Sign in to your account','signin.sub':'Access your HansePay dashboard.',
      'signin.soon.title':'Customer portal launching soon',
      'signin.soon.body':'We\'re putting the finishing touches on your account dashboard. In the meantime, speak with your dedicated FX specialist.',
      'signin.book':'Book a discovery call →',
      'signin.footer':'Already working with us? Your specialist will share your portal access link once it\'s ready.',
      'nav.about':'About','nav.insights':'Insights','nav.cta':'Open an account',
      'nav.platform.overview':'Overview','nav.platform.overview.sub':'See the full platform at a glance',
      'nav.platform.tech':'Technology','nav.platform.tech.sub':'The infrastructure behind every transfer',
      'nav.solutions.by-industry':'By Industry','nav.solutions.by-size':'By Business Size',
      'nav.solutions.ecom':'E-Commerce & Retail','nav.solutions.ecom.sub':'Supplier payments, bulk FX, emerging markets',
      'nav.solutions.mfg':'Import & Manufacturing','nav.solutions.mfg.sub':'Industrial FX, big-ticket execution, supply chain',
      'nav.solutions.log':'Logistics & Freight','nav.solutions.log.sub':'Same-day execution, agent networks, maritime',
      'nav.solutions.corp':'Mid & Large Business','nav.solutions.corp.sub':'Institutional pricing, named expert, >€2M',
      'nav.solutions.sme':'Small Business','nav.solutions.sme.sub':'No minimum volume, same-day, interbank rates',
      'nav.about.label':'About HansePay',
      'nav.about.vision':'Vision & Mission','nav.about.vision.sub':'Why we built HansePay',
      'nav.about.team':'Team & History','nav.about.team.sub':'Founders, advisors, offices & milestones',
      'nav.about.licenses':'Licenses','nav.about.licenses.sub':'MiCAR, BaFin, GDPR, ISO 27001',
      'nav.insights.stories':'Customer stories','nav.insights.stories.sub':'Real customers. Real results.',
      'nav.insights.market':'Market insights','nav.insights.market.sub':'Currency analysis, weekly',
      'nav.insights.events':'Events','nav.insights.events.sub':'Where to find us this season',
      'nav.tools.label':'Free tools',
      'nav.tools.calc':'FX Savings Calculator','nav.tools.calc.sub':'Estimate your annual saving',
      'nav.tools.conv':'Currency Converter','nav.tools.conv.sub':'Live mid-market rates',
      'nav.tools.iban':'IBAN Verifier','nav.tools.iban.sub':'Validate format and bank details',
      // Common CTAs
      'cta.open-account':'Open an account','cta.book-call':'Book a call',
      'cta.learn-more':'Learn more','cta.get-started':'Get started',
      'cta.talk-to-team':'Talk to our team','cta.back-to-site':'← Back to HansePay',
      // index.html
      'index.chip':'EU-regulated · Hamburg',
      'index.hero.sub':'Send money in 30+ currencies at the real interbank rate — no markups, no surprises. Faster settlement, lower costs, every time.',
      'index.hero.cta1':'Open an account','index.hero.cta2':'Book a call',
      'index.trust.bafin':'EU-regulated','index.trust.rates':'Mid-market rates',
      'index.trust.speed':'Same-day settlement','index.trust.experts':'Dedicated FX expert',
      'index.features.label':'Features','index.features.h2':'Everything your treasury needs.',
      'index.how.label':'How it works','index.how.h2':'Up and running in minutes.',
      'index.calc.label':'FX Calculator','index.calc.h2':'See what you could save.',
      'index.gs.h2':'Open your account.','index.gs.sub':'Start sending money in minutes, or talk to us about your use case.',
      // tools-calculator.html
      'calc.chip':'FX Savings Calculator','calc.h1.1':'See what you could save','calc.h1.2':'in under 30 seconds.',
      'calc.sub':'Set your volume, currency, and provider below. These are estimates based on industry-standard margins.',
      // tools-converter.html
      'conv.chip':'Live Currency Converter','conv.h1':'Real rates,','conv.h1.em':'right now.',
      'conv.sub':'Mid-market exchange rates updated every 60 seconds. No markup, no hidden fees.',
      // tools-iban.html
      'iban.chip':'IBAN Verifier','iban.h1':'Validate any IBAN,','iban.h1.em':'instantly.',
      'iban.sub':'Check format, extract BIC, and verify bank details for 77 countries.',
      // tools.html
      'tools.chip':'Free Tools','tools.h1':'Tools built for','tools.h1.em':'finance teams.',
      'tools.sub':'Free, no sign-up required. Built by payments professionals.',
      // blog.html
      'blog.h1':'HansePay Insights.','blog.sub':'FX education, market analysis, and treasury best practices.',
      // about-vision.html
      'vision.chip':'Vision & Mission','vision.h1':'Why we built','vision.h1.em':'HansePay.',
      // about-team.html
      'team.chip':'Our Team','team.h1':'The people behind','team.h1.em':'HansePay.',
      // about-licenses.html
      'licenses.chip':'Regulation & Compliance','licenses.h1':'Built on a foundation of','licenses.h1.em':'trust.',
      // solutions
      'sol-ecom.chip':'Solutions · E-Commerce','sol-ecom.h1':'FX built for','sol-ecom.h1.em':'online retail.',
      'sol-mfg.chip':'Solutions · Manufacturing','sol-mfg.h1':'FX for import &','sol-mfg.h1.em':'manufacturing.',
      'sol-log.chip':'Solutions · Logistics','sol-log.h1':'FX for logistics &','sol-log.h1.em':'freight.',
      'sol-corp.chip':'Solutions · Corporate','sol-corp.h1':'FX for mid &','sol-corp.h1.em':'large business.',
      'sol-sme.chip':'Solutions · SME','sol-sme.h1':'FX for','sol-sme.h1.em':'small business.',
      // platform
      'platform.chip':'Platform Overview','platform.h1':'The payment platform','platform.h1.em':'built for business.',
      'platform-tech.chip':'Technology','platform-tech.h1':'Infrastructure you can','platform-tech.h1.em':'rely on.',
      // partners
      'partners-embed.chip':'Embedded FX','partners-embed.h1':'Embed HansePay into','partners-embed.h1.em':'your product.',
      'partners-partner.chip':'Partner Programme','partners-partner.h1':'Grow together','partners-partner.h1.em':'with HansePay.',
      'partners-refer.chip':'Referral Programme','partners-refer.h1':'Refer a business,','partners-refer.h1.em':'earn a reward.',
      'partners-resell.chip':'Reseller Programme','partners-resell.h1':'Resell HansePay','partners-resell.h1.em':'to your clients.',
      // insights
      'stories.chip':'Customer Stories','stories.h1':'Real customers.','stories.h1.em':'Real results.',
      'market.chip':'Market Insights','market.h1':'Weekly FX','market.h1.em':'analysis.',
      'events.chip':'Events','events.h1':'Meet us','events.h1.em':'in person.',
      // common section tails
      'gs.h2':'Open your account.','gs.sub':'Start sending money in minutes, or talk to us about your use case.',
      // ── HTML keys for data-i18n-html (headings with <em> tags) ──
      // index.html
      'index.hero.h1.html':'Cross-border<br>payments, <em>reimagined.</em>',
      'index.vp.h2.html':'The lowest fees.<br><em>The fastest transfers.</em>',
      'index.how.h2.html':'From quote to <em>cleared funds</em> in four steps.',
      'index.currencies.h2.html':'Send to <em>45+ markets.</em>',
      'index.solutions.h2.html':'Solutions for <em>every industry.</em>',
      'index.about.h2.html':'Built in Hamburg.<br><em>Trusted across Europe.</em>',
      'index.insights.h2.html':'FX knowledge that moves<br><em>your business forward.</em>',
      'index.faq.h2.html':'Common <em>questions.</em>',
      'index.cta.h2.html':'Ready for a real <em>FX team?</em>',
      // solutions pages
      'sol-ecom.hero.h1.html':'FX built for<br><em>cross-border commerce.</em>',
      'sol-ecom.comp.h2.html':'HansePay vs. your bank<br><em>vs. a fintech app.</em>',
      'sol-ecom.cov.h2.html':'45+ markets, <em>one platform.</em>',
      'sol-ecom.calc.h2.html':'Estimate your annual saving, <em>in 30 seconds.</em>',
      // platform
      'platform.h1.html':'One platform<br><em>for global payments.</em>',
      'platform.transfers.h2.html':'Send anywhere,<br><em>in minutes.</em>',
      'platform.alerts.h2.html':'Never miss a<br><em>rate opportunity.</em>',
      // calculator categories + banks
      'calc.cat.major':'Major','calc.cat.minor':'Minor','calc.cat.exotic':'Exotic',
      'calc.bank.major_de':'Major German bank (Deutsche Bank, Commerzbank)',
      'calc.bank.sparkasse':'Sparkasse / Volksbank',
      'calc.bank.international':'International bank (HSBC, BNP Paribas)',
      'calc.bank.broker':'FX broker / specialist',
      // common section tails HTML
      'gs.h2.html':'Open your account.',
    },
    de: {
      // Nav
      'nav.home':'Startseite','nav.platform':'Plattform','nav.solutions':'Lösungen',
      'nav.signin':'Anmelden',
      'signin.title':'In Ihr Konto einloggen','signin.sub':'Zugang zu Ihrem HansePay-Dashboard.',
      'signin.soon.title':'Kundenportal in Kürze verfügbar',
      'signin.soon.body':'Wir legen letzte Hand an Ihr Account-Dashboard. Sprechen Sie in der Zwischenzeit mit Ihrem persönlichen FX-Spezialisten.',
      'signin.book':'Kennenlerngespräch buchen →',
      'signin.footer':'Arbeiten Sie bereits mit uns? Ihr Spezialist schickt Ihnen den Portal-Zugang, sobald er bereit ist.',
      'nav.about':'Über uns','nav.insights':'Einblicke','nav.cta':'Konto eröffnen',
      'nav.platform.overview':'Übersicht','nav.platform.overview.sub':'Die gesamte Plattform auf einen Blick',
      'nav.platform.tech':'Technologie','nav.platform.tech.sub':'Die Infrastruktur hinter jeder Überweisung',
      'nav.solutions.by-industry':'Nach Branche','nav.solutions.by-size':'Nach Unternehmensgröße',
      'nav.solutions.ecom':'E-Commerce & Einzelhandel','nav.solutions.ecom.sub':'Lieferantenzahlungen, FX-Volumen, Schwellenmärkte',
      'nav.solutions.mfg':'Import & Produktion','nav.solutions.mfg.sub':'Industrielles FX, Großaufträge, Lieferkette',
      'nav.solutions.log':'Logistik & Fracht','nav.solutions.log.sub':'Same-Day-Ausführung, Agentennetzwerke, Schifffahrt',
      'nav.solutions.corp':'Mittelstand & Konzerne','nav.solutions.corp.sub':'Institutionelle Konditionen, persönlicher Experte, >2 Mio. €',
      'nav.solutions.sme':'Kleinunternehmen','nav.solutions.sme.sub':'Kein Mindestvolumen, Same-Day, Interbanken-Kurs',
      'nav.about.label':'Über HansePay',
      'nav.about.vision':'Vision & Mission','nav.about.vision.sub':'Warum wir HansePay gegründet haben',
      'nav.about.team':'Team & Geschichte','nav.about.team.sub':'Gründer, Berater, Standorte & Meilensteine',
      'nav.about.licenses':'Lizenzen','nav.about.licenses.sub':'MiCAR, BaFin, DSGVO, ISO 27001',
      'nav.insights.stories':'Kundenstories','nav.insights.stories.sub':'Echte Kunden. Echte Ergebnisse.',
      'nav.insights.market':'Marktanalysen','nav.insights.market.sub':'Währungsanalysen, wöchentlich',
      'nav.insights.events':'Veranstaltungen','nav.insights.events.sub':'Wo Sie uns diese Saison finden',
      'nav.tools.label':'Kostenlose Tools',
      'nav.tools.calc':'FX-Sparrechner','nav.tools.calc.sub':'Schätzen Sie Ihre jährliche Ersparnis',
      'nav.tools.conv':'Währungsrechner','nav.tools.conv.sub':'Live Interbanken-Kurse',
      'nav.tools.iban':'IBAN-Prüfer','nav.tools.iban.sub':'Format und Bankdaten validieren',
      // Common CTAs
      'cta.open-account':'Konto eröffnen','cta.book-call':'Gespräch buchen',
      'cta.learn-more':'Mehr erfahren','cta.get-started':'Jetzt starten',
      'cta.talk-to-team':'Mit unserem Team sprechen','cta.back-to-site':'← Zurück zu HansePay',
      // index.html
      'index.chip':'EU-reguliert · Hamburg',
      'index.hero.sub':'Überweisungen in über 30 Währungen — zum echten Interbanken-Kurs, ohne versteckte Aufschläge. Schneller als Ihre Bank, günstiger als jede Alternative.',
      'index.hero.cta1':'Konto eröffnen','index.hero.cta2':'Gespräch buchen',
      'index.trust.bafin':'EU-reguliert','index.trust.rates':'Interbanken-Kurs',
      'index.trust.speed':'Same-Day-Abwicklung','index.trust.experts':'Persönlicher FX-Experte',
      'index.features.label':'Funktionen','index.features.h2':'Alles, was Ihr Treasury braucht.',
      'index.how.label':'So funktioniert es','index.how.h2':'In Minuten einsatzbereit.',
      'index.calc.label':'FX-Rechner','index.calc.h2':'Sehen Sie, was Sie sparen könnten.',
      'index.gs.h2':'Eröffnen Sie Ihr Konto.','index.gs.sub':'In Minuten loslegen oder mit uns über Ihren Anwendungsfall sprechen.',
      // tools
      'calc.chip':'FX-Sparrechner','calc.h1.1':'Sehen Sie, was Sie sparen','calc.h1.2':'in unter 30 Sekunden.',
      'calc.sub':'Geben Sie Ihr Volumen, Ihre Währung und Ihren aktuellen Anbieter ein. Schätzungen basieren auf branchenüblichen Margen.',
      'conv.chip':'Live-Währungsrechner','conv.h1':'Echte Kurse,','conv.h1.em':'jetzt.',
      'conv.sub':'Interbanken-Wechselkurse, alle 60 Sekunden aktualisiert. Kein Aufschlag, keine versteckten Gebühren.',
      'iban.chip':'IBAN-Prüfer','iban.h1':'Jede IBAN validieren,','iban.h1.em':'sofort.',
      'iban.sub':'Format prüfen, BIC extrahieren und Bankdaten für 77 Länder verifizieren.',
      'tools.chip':'Kostenlose Tools','tools.h1':'Tools für','tools.h1.em':'Finance-Teams.',
      'tools.sub':'Kostenlos, keine Anmeldung erforderlich. Entwickelt von Zahlungsprofis.',
      // blog
      'blog.h1':'HansePay Einblicke.','blog.sub':'FX-Wissen, Marktanalysen und Treasury Best Practices.',
      // about
      'vision.chip':'Vision & Mission','vision.h1':'Warum wir','vision.h1.em':'HansePay gründeten.',
      'team.chip':'Unser Team','team.h1':'Die Menschen hinter','team.h1.em':'HansePay.',
      'licenses.chip':'Regulierung & Compliance','licenses.h1':'Auf einem Fundament des','licenses.h1.em':'Vertrauens.',
      // solutions
      'sol-ecom.chip':'Lösungen · E-Commerce','sol-ecom.h1':'FX für','sol-ecom.h1.em':'Online-Handel.',
      'sol-mfg.chip':'Lösungen · Produktion','sol-mfg.h1':'FX für Import &','sol-mfg.h1.em':'Produktion.',
      'sol-log.chip':'Lösungen · Logistik','sol-log.h1':'FX für Logistik &','sol-log.h1.em':'Fracht.',
      'sol-corp.chip':'Lösungen · Konzerne','sol-corp.h1':'FX für Mittelstand &','sol-corp.h1.em':'Konzerne.',
      'sol-sme.chip':'Lösungen · KMU','sol-sme.h1':'FX für','sol-sme.h1.em':'Kleinunternehmen.',
      // platform
      'platform.chip':'Plattform-Übersicht','platform.h1':'Die Zahlungsplattform','platform.h1.em':'für Unternehmen.',
      'platform-tech.chip':'Technologie','platform-tech.h1':'Infrastruktur, auf die','platform-tech.h1.em':'Sie sich verlassen können.',
      // partners
      'partners-embed.chip':'Embedded FX','partners-embed.h1':'HansePay in Ihr','partners-embed.h1.em':'Produkt einbetten.',
      'partners-partner.chip':'Partnerprogramm','partners-partner.h1':'Gemeinsam wachsen','partners-partner.h1.em':'mit HansePay.',
      'partners-refer.chip':'Empfehlungsprogramm','partners-refer.h1':'Empfehlen und','partners-refer.h1.em':'Prämie erhalten.',
      'partners-resell.chip':'Reseller-Programm','partners-resell.h1':'HansePay weiterverkaufen','partners-resell.h1.em':'an Ihre Kunden.',
      // insights
      'stories.chip':'Kundenstories','stories.h1':'Echte Kunden.','stories.h1.em':'Echte Ergebnisse.',
      'market.chip':'Marktanalysen','market.h1':'Wöchentliche FX-','market.h1.em':'Analyse.',
      'events.chip':'Veranstaltungen','events.h1':'Treffen Sie uns','events.h1.em':'persönlich.',
      // common section tails
      'gs.h2':'Eröffnen Sie Ihr Konto.','gs.sub':'In Minuten loslegen oder mit uns über Ihren Anwendungsfall sprechen.',
      // blog
      'blog.chip':'HansePay Einblicke',
      // about subtitles
      'vision.sub':'Von Hamburg aus — wohin Ihr Unternehmen auch wächst, einschließlich der Märkte, die die meisten Banken nicht bedienen.',
      'team.sub':'In Hamburg aufgebaut von einem Team, das weiß, was regulierte Finanzen, moderne Infrastruktur und der deutsche Mittelstand jeweils verlangen.',
      'licenses.sub':'HansePay operiert unter einem der strengsten Regulierungsrahmen Europas. MiCAR-autorisiert nach EU-Recht, beaufsichtigt in Deutschland durch die BaFin, zertifiziert für Datenschutz und Informationssicherheit in jedem System.',
      // solution subtitles
      'sol-ecom.sub':'FX und Zahlungen für Online-Händler — auch in Währungen, die Ihre Bank nicht erreicht. Zahlen Sie Lieferanten in jedem Markt, begleichen Sie Rechnungen und verlieren Sie keine Marge durch Spreads bei jeder Bestellung.',
      'sol-mfg.sub':'FX und Zahlungen für Hersteller und Importeure. Kurs zum Zeitpunkt der Ausführung fixieren. Märkte erreichen, die Ihre Bank nicht bedient. Großbeträge abwickeln, ohne den gesehenen Kurs zu verlieren.',
      'sol-log.sub':'FX und zeitkritische Ausführung für Spediteure, Carrier, Zollagenten und Schiffsoperatoren. Zahlen Sie Carrier, Häfen und Agenten in jedem Markt, Same-Day, zu den Spreads, die Ihre Marge tatsächlich erfordert.',
      'sol-corp.sub':'Für Unternehmen mit mehr als 2 Mio. € jährlichen grenzüberschreitenden Zahlungen. Institutionelle FX-Konditionen, kursgesperrte Ausführung und ein namentlich bekannter Experte, den Sie tatsächlich erreichen können — keine Hotline.',
      'sol-sme.sub':'Für Unternehmen mit bis zu 2 Mio. € jährlichem FX-Volumen. Der gleiche Zugang zu Interbanken-Kursen und transparenter Ausführung, den Großkonzerne seit Jahrzehnten haben — ohne banktypische Gebühren oder lange Wartezeiten.',
      // platform subtitles
      'platform.sub':'Grenzüberschreitende Zahlungen, Wholesale-FX und vollständige Treasury-Transparenz — entwickelt für Unternehmen, die Geld über Grenzen bewegen. BaFin-lizenziert, Interbanken-Kurse, keine versteckten Gebühren.',
      'platform-tech.sub':'Wie HansePay Geld in Minuten zu einem Bruchteil der Kosten bewegt. Die Technologie ist bewusst im Hintergrund — aber hier ist, was darunter läuft, wenn Sie es wissen müssen.',
      // partners subtitles
      'partners-embed.sub':'HansePay bietet Software-Plattformen eine einzige Integration für grenzüberschreitende Zahlungen, FX-Ausführung und EMT-Ausgabe. Wir kümmern uns um die regulierte Infrastruktur, damit Ihr Team sich auf das Produkt konzentrieren kann.',
      'partners-partner.sub':'Wir arbeiten mit Software-Plattformen, Beratern und Resellern zusammen, um besseres FX für mittelständische Unternehmen in ganz Europa anzubieten. Jede Partnerschaft wird individuell gestaltet. Sagen Sie uns, was Sie sich vorstellen, und wir finden gemeinsam einen Weg.',
      'partners-refer.sub':'Wenn ein Kunde Lieferanten im Ausland bezahlt, in mehreren Währungen fakturiert oder grenzüberschreitende Tochtergesellschaften verwaltet, sehen Sie die Kosten in seinen Büchern. HansePay ist die regulierte EU-Infrastruktur, die das löst.',
      'partners-resell.sub':'HansePay arbeitet mit Regionalbanken, Branchenverbänden und Branchennetzwerken zusammen, um deren Mitgliedern und Kunden einen regulierten EU-FX- und grenzüberschreitenden Zahlungsservice anzubieten. Das Programm befindet sich in der Anfangsphase. Wir arbeiten mit unseren ersten Partnern individuell zusammen.',
      // insights subtitles
      'stories.sub':'Wir stellen ausführliche Berichte von Unternehmen zusammen, die HansePay bereits nutzen: wie sie FX-Kosten gesenkt, die Abwicklung beschleunigt und das Treasury vereinfacht haben. Die ersten Berichte erscheinen 2026.',
      'market.sub':'Kurze, praxisnahe Einblicke zu den Währungsbewegungen, die für Unternehmen in Europa und darüber hinaus relevant sind. Kein Lärm, keine Prognosespiele — nur das, was Sie brauchen, um diese Woche bessere Zahlungsentscheidungen zu treffen.',
      'events.sub':'Wir finalisieren die Konferenzen, Panels und Meetups, bei denen das HansePay-Team 2026 vor Ort sein wird. Vollständiger Zeitplan folgt in Kürze.',
      // ── NEW KEYS (2026-06-01) ──
      // index hero
      'index.hero.h1':'Internationale Zahlungen, neu gedacht.',
      'index.hero.sub':'Überweisungen in über 30 Währungen zum echten Interbanken-Kurs — ohne Aufschläge, ohne Überraschungen. Schnellere Abwicklung, niedrigere Kosten, jedes Mal.',
      'index.chip':'EU-reguliert · Hamburg',
      'cta.open-account':'Konto eröffnen',
      'cta.book-call':'Gespräch buchen',
      // index trust
      'index.trust.1.title':'BaFin-reguliert',
      'index.trust.1.sub':'EU-lizenziertes E-Geld-Institut',
      'index.trust.2.title':'Interbanken-Kurs',
      'index.trust.2.sub':'Keine versteckten Aufschläge',
      'index.trust.3.title':'Live-Kurse',
      'index.trust.3.sub':'Echtzeitkurse rund um die Uhr',
      'index.trust.4.title':'Persönlicher Experte',
      'index.trust.4.sub':'Direktkontakt, kein Callcenter',
      // index calc
      'index.calc.eyebrow':'Die versteckten Kosten',
      'index.calc.h2':'Ihre Bank berechnet Ihnen still und heimlich zu viel.',
      'index.calc.h2.html':'Ihre Bank berechnet Ihnen <em>still und heimlich zu viel.</em>',
      'index.calc.sub':'Bei jeder grenzüberschreitenden Überweisung fügt Ihre Bank einen Aufschlag von 2–4 % auf den Wechselkurs hinzu — Geld, das verschwindet, ohne in einer Zeile aufzutauchen. Berechnen Sie genau, was Sie verlieren.',
      'index.calc.b1.title':'Keine versteckten Aufschläge',
      'index.calc.b1.desc':'Wir berechnen nur eine transparente Transaktionsgebühr.',
      'index.calc.b2.title':'Interbanken-Kurs garantiert',
      'index.calc.b2.desc':'Der echte Marktpreis — kein Bankspread.',
      'index.calc.b3.title':'Konservative Schätzung',
      'index.calc.b3.desc':'Realistische Richtwerte aus dem deutschen Geschäftsbankensektor.',
      'index.calc.lbl.vol':'Jährliches FX-Volumen',
      'index.calc.lbl.ccy':'Währungspaar',
      'index.calc.lbl.provider':'Aktueller Anbieter',
      'index.calc.lbl.payments':'Zahlungen pro Monat',
      'index.calc.res.margins':'Einsparung bei FX-Aufschlägen',
      'index.calc.res.fees':'Einsparung bei Transaktionsgebühren',
      'index.calc.res.total':'Gesamte jährliche Einsparung',
      'index.calc.disclaimer':'Schätzungen basieren auf branchenüblichen Margen. Hauptwährungspaare: Bank 2,5 %, HansePay 0,3 %. Bankgebühr pro Überweisung €38, HansePay €10. Die genaue Einsparung hängt von Ihrem Transaktionsverlauf ab.',
      'index.calc.cta':'Vollständiger Rechner mit detaillierter Aufschlüsselung →',
      // index value proposition
      'index.vp.eyebrow':'Der HansePay-Unterschied',
      'index.vp.h2':'Die niedrigsten Gebühren. Die schnellsten Überweisungen.',
      'index.vp.sub':'HansePay gibt europäischen Unternehmen direkten Zugang zu Interbanken-FX-Kursen — dem Kurs, den Banken untereinander zahlen, ohne Aufschlag. Same-Day-Abwicklung auf den wichtigsten Korridoren. Die effizienteste Infrastruktur für grenzüberschreitende Zahlungen, die es gibt.',
      'index.vp.cta':'Unsere Preise im Überblick →',
      'index.vp.eyebrow':'Der HansePay-Unterschied',
      'index.vp.h2.html':'Transparente Preise.<br><em>Schnelle Abwicklung.</em>',
      'index.vp.lede':'HansePay gibt europäischen Unternehmen direkten Zugang zu Interbanken-Kursen mit einer transparenten Marge ab 0,15 % auf Hauptwährungspaaren, vor jedem Handel offengelegt, ohne versteckten Spread. Mit Abwicklung am selben Tag auf den Hauptkorridoren werden grenzüberschreitende Zahlungen planbar.',
      'index.vp.m1.label':'FX-Marge ab',
      'index.vp.m1.sub':'Hauptwährungspaare, vor jedem Handel offengelegt',
      'index.vp.m2.value':'Same Day',
      'index.vp.m2.label':'Abwicklung',
      'index.vp.m2.sub':'Auf den Hauptkorridoren',
      'index.vp.m3.label':'Märkte',
      'index.vp.m3.sub':'Über fünf Regionen weltweit',
      'index.vp.m4.label':'Onboarding',
      'index.vp.m4.sub':'Vollständig digitaler Antrag',
      // index how it works
      'index.how.eyebrow':'So funktioniert es',
      'index.how.h2':'Vom Kurs zur Gutschrift in vier Schritten.',
      'index.how.sub':'Keine Wartezeiten, keine undurchsichtige Preisgestaltung. Nur schnelle, präzise FX-Ausführung — wie sie sein sollte.',
      'index.how.s1.title':'Konto eröffnen',
      'index.how.s1.desc':'Online-Antrag in unter 10 Minuten. Kein Papierkram, keine Banktermine — digitale Identitätsprüfung inklusive.',
      'index.how.s2.title':'Kurs anfragen',
      'index.how.s2.desc':'Live-Kurs im Dashboard oder direkt von Ihrem Experten. Transparent, in Echtzeit, keine Überraschungen.',
      'index.how.s3.title':'Zahlung auslösen',
      'index.how.s3.desc':'Mit einem Klick bestätigen oder per API automatisieren. Empfängervalidierung und IBAN-Prüfung inklusive.',
      'index.how.s4.title':'Echtzeit-Tracking',
      'index.how.s4.desc':'Jede Transaktion vollständig nachverfolgbar. Automatische Bestätigung und Buchungsbeleg per E-Mail.',
      // index platform
      'index.platform.eyebrow':'Die Plattform',
      'index.platform.h2':'Was Ihr Treasury braucht — und nichts darüber hinaus.',
      'index.platform.h2.html':'Was Ihr Treasury braucht — <em style="color:var(--n200)">und nichts darüber hinaus.</em>',
      'index.platform.sub':'Live-FX-Kurse, sofortige Zahlungen, vollständiger Prüfpfad — Ihr Finanzteam erhält ein übersichtliches Dashboard mit allem an einem Ort.',
      'index.platform.f1.title':'Live-FX-Kursstreaming',
      'index.platform.f1.desc':'Den echten Kurs mit einem Klick sichern. Spot, Forward oder geplant — Ihre Wahl.',
      'index.platform.f2.title':'Vollständige Zahlungstransparenz',
      'index.platform.f2.desc':'Jede Überweisung in Echtzeit verfolgt. Abgewickelt, unterwegs oder ausstehend — stets sichtbar.',
      'index.platform.f3.title':'Empfängerverwaltung',
      'index.platform.f3.desc':'Verifizierte Begünstigte in 45+ Märkten speichern — IBAN, SWIFT, lokale Formate.',
      'index.platform.f4.title':'API & Massenzahlungen',
      'index.platform.f4.desc':'Integration mit Ihrem ERP oder TMS. Hunderte von Zahlungen per CSV-Upload versenden.',
      'index.platform.cta':'Plattform erkunden →',
      // index currencies
      'index.currencies.eyebrow':'Globale Reichweite',
      'index.currencies.h2':'In 45+ Märkte senden.',
      'index.currencies.sub':'Nahtlose Überweisungen in Nord- und Südamerika, Afrika, den Nahen Osten, Asien & Pazifik und Europa — mit Same-Day-Verfügbarkeit auf den wichtigsten Korridoren.',
      'index.currencies.more':'+27 weitere Märkte verfügbar — sprechen Sie mit Ihrem FX-Experten für vollständige Korridorverfügbarkeit.',
      'index.currencies.cta':'Vollständige Abdeckung ansehen →',
      // index solutions
      'index.solutions.eyebrow':'Für wen',
      'index.solutions.h2':'Lösungen für jede Branche.',
      'index.solutions.sub':'Ob Import, Export, E-Commerce oder professionelle Dienstleistungen — wir verstehen die spezifischen Anforderungen Ihrer Branche.',
      'index.sol.1.tag':'E-Commerce & Handel',
      'index.sol.1.title':'E-Commerce & Handel',
      'index.sol.1.desc':'Lieferantenzahlungen, Massen-FX, Schwellenmärkte — zahlen Sie überall, wo Ihre Lieferanten sind.',
      'index.sol.2.tag':'Import & Produktion',
      'index.sol.2.title':'Import & Produktion',
      'index.sol.2.desc':'Industrie-FX, Großbetragsausführung, Lieferkette — planbar und kostenoptimiert.',
      'index.sol.3.tag':'Logistik & Fracht',
      'index.sol.3.title':'Logistik & Fracht',
      'index.sol.3.desc':'Same-Day-Ausführung, Agentennetzwerke, maritime Zahlungen — alle Währungen, eine Plattform.',
      'index.sol.4.tag':'Mittelstand & Konzerne',
      'index.sol.4.title':'Mittelstand & Konzerne',
      'index.sol.4.desc':'Institutionelle Konditionen, namentlicher Experte, >€2 Mio. — maßgeschneidertes FX für größere Volumina.',
      'index.sol.5.tag':'Kleinunternehmen',
      'index.sol.5.title':'Kleinunternehmen',
      'index.sol.5.desc':'Kein Mindestvolumen, Same-Day, Interbanken-Kurse — faire Preise vom ersten Tag an.',
      // index about
      'index.about.eyebrow':'Unsere Geschichte',
      'index.about.h2':'In Hamburg gegründet. In ganz Europa vertraut.',
      'index.about.body':'Seit Jahrhunderten ist Hamburg Europas Tor zum Welthandel. HansePay trägt diese Tradition fort — und bringt institutionelle FX-Ausführung zu den Unternehmen, die die moderne Wirtschaft antreiben. BaFin-reguliert, gefördert durch Hamburgs Innovationsfonds, beraten von erfahrenen institutionellen Experten.',
      'index.about.cta':'Mehr über uns erfahren',
      // index credentials
      'index.cred.1.title':'BaFin-lizenziert',
      'index.cred.1.desc':'EU-reguliertes E-Geld-Institut unter MiCAR. Direkte deutsche Aufsicht durch die BaFin.',
      'index.cred.2.title':'Made in Hamburg',
      'index.cred.2.desc':'Seit 2023 im deutschen Tor zur Welt ansässig. Gefördert durch den Innovationsstarter Fonds Hamburg.',
      'index.cred.3.title':'Institutionelle Expertise',
      'index.cred.3.desc':'Gegründet und beraten von erfahrenen FX- und Finanzprofis mit Hintergrund bei führenden institutionellen Unternehmen.',
      // index insights
      'index.insights.eyebrow':'HANSEPAY INSIGHTS',
      'index.insights.h2':'FX-Wissen, das Ihr Unternehmen voranbringt.',
      'index.insights.cta':'Alle Artikel →',
      'index.ins.1.tag':'FX-Grundlagen',
      'index.ins.1.title':'Die versteckten Kosten von Bank-FX-Gebühren — was jeder CFO wissen sollte',
      'index.ins.1.meta':'HansePay Team · 5 Min. Lesezeit',
      'index.ins.2.tag':'Treasury',
      'index.ins.2.title':'Same-Day-Euro-Abwicklung: Ein Praxisleitfaden für europäische Unternehmen',
      'index.ins.2.meta':'HansePay Team · 6 Min. Lesezeit',
      'index.ins.3.tag':'Compliance',
      'index.ins.3.title':'BaFin-Regulierung: Was das für das Geld Ihres Unternehmens bedeutet',
      'index.ins.3.meta':'HansePay Team · 7 Min. Lesezeit',
      // index FAQ
      'index.faq.eyebrow':'FAQ',
      'index.faq.h2':'Häufige Fragen.',
      'index.faq.q1':'Wie schnell sind Überweisungen?',
      'index.faq.a1':'Die meisten Überweisungen auf den wichtigsten Korridoren (EUR/USD, EUR/GBP, EUR/CHF) werden am gleichen Tag abgewickelt. Überweisungen nach Asien und in den Nahen Osten werden in der Regel am nächsten Geschäftstag abgewickelt. Ihr persönlicher FX-Experte bestätigt die genauen Zeiten bei der Buchung.',
      'index.faq.q2':'Welche Gebühren berechnet HansePay?',
      'index.faq.a2':'Eine einzige transparente Transaktionsgebühr von 0,3–0,5 %, abhängig von Volumen und Währungspaar. Kein Aufschlag auf den Wechselkurs — Sie erhalten immer den echten Interbanken-Kurs. Keine Monatsgebühren, keine versteckten Kosten, keine Mindestlaufzeit.',
      'index.faq.q3':'Welche Währungen und Länder werden unterstützt?',
      'index.faq.a3':'45+ Märkte in Nord- und Südamerika, Afrika, dem Nahen Osten, Asien & Pazifik und Europa — darunter USD, GBP, JPY, AED, CNY, AUD, CAD, SGD, BRL, INR, KRW, ZAR und mehr. Benötigen Sie einen bestimmten Korridor? Kontaktieren Sie uns — wir können ihn oft auf Anfrage einrichten.',
      'index.faq.q4':'Ist HansePay reguliert und sicher?',
      'index.faq.a4':'Ja. HansePay ist ein BaFin-reguliertes EU-E-Geld-Institut. Kundengelder werden auf vollständig getrennten Konten verwahrt. Wir erfüllen alle geltenden AML-, KYC- und MiCAR-Vorschriften und unterliegen regelmäßigen Prüfungen nach deutschem und europäischem Finanzrecht.',
      'index.faq.q5':'Wie fange ich an?',
      'index.faq.a5':'Eröffnen Sie ein Konto online in unter 10 Minuten — vollständig digital, kein Papierkram, keine Banktermine. Digitale Identitätsprüfung inklusive. Nach der Genehmigung nimmt Ihr persönlicher FX-Experte Kontakt auf, um die Plattform vorzustellen und Ihre Anforderungen zu besprechen.',
      'index.faq.q6':'Gibt es einen Mindestüberweisungsbetrag?',
      'index.faq.a6':'Der Mindestüberweisungsbetrag beträgt EUR 1.000 (oder Gegenwert). Es gibt kein Maximum. Bei großen oder komplexen Überweisungen kann Ihr FX-Experte maßgeschneiderte Kurse und individuelle Abwicklungsoptionen arrangieren — nehmen Sie einfach Kontakt auf.',
      // index CTA section
      'index.cta.eyebrow':'Jetzt starten',
      'index.cta.h2':'Bereit für ein echtes FX-Team?',
      'index.cta.sub':'Eröffnen Sie in Minuten ein Konto oder sprechen Sie direkt mit einem Devisenspezialist. Keine Mindestvolumina, keine Vertragsbindung.',
      'cta.talk-to-team':'Mit einem Spezialisten sprechen',
      // calc page
      'calc.chip':'FX-Sparrechner',
      'calc.hero.h1':'Sehen Sie, was Sie bei FX sparen könnten — in unter 30 Sekunden.',
      'calc.sub':'Stellen Sie Ihr Jahresvolumen, Ihren aktuellen Anbieter und Ihre Zielwährung ein. Wir zeigen Ihnen die geschätzte jährliche Einsparung mit HansePay — und ermitteln dann eine genaue Zahl mit einem kostenlosen FX-Audit.',
      'calc.card.h3':'Ihre FX-Einsparung schätzen',
      'calc.card.sub':'Stellen Sie unten Ihr Volumen, Ihre Währung und Ihren Anbieter ein. Dies sind Schätzungen auf Basis branchenüblicher Margen.',
      'calc.lbl.volume':'Jährliches grenzüberschreitendes Zahlungsvolumen',
      'calc.lbl.currency':'Währungspaar',
      'calc.lbl.fxcost':'Ihre aktuellen FX-Kosten',
      'calc.mode.provider':'Nach Anbieter',
      'calc.mode.custom':'Nach genauer Marge',
      'calc.prov.major-de':'Große deutsche Bank (Deutsche Bank, Commerzbank)',
      'calc.prov.sparkasse':'Sparkasse / Volksbank',
      'calc.prov.international':'Internationale Bank (HSBC, BNP Paribas)',
      'calc.prov.broker':'FX-Broker / Spezialist',
      'calc.prov.other':'Sonstige / individuell',
      'calc.hint.margin':'Geschätzte Marge bei Ihrem Volumen:',
      'calc.lbl.markup':'Aufschlag des aktuellen Anbieters',
      'calc.lbl.payments':'Grenzüberschreitende Zahlungen pro Monat',
      'calc.hint.payments':'Wird verwendet, um Einsparungen bei Transaktionsgebühren zu schätzen (SWIFT, Lifting-, Begünstigtengebühren).',
      'calc.result.margins':'Einsparung bei FX-Aufschlägen',
      'calc.result.fees':'Einsparung bei Transaktionsgebühren',
      'calc.result.total':'Gesamte jährliche Einsparung',
      'calc.bar.heading':'Jährlicher Kostenvergleich',
      'calc.bar.current':'Ihre aktuellen jährlichen Kosten',
      'calc.bar.hansepay':'Mit HansePay',
      'calc.cta.audit':'Genaue Zahl ermitteln: Kostenloses FX-Audit anfordern',
      'calc.footnote':'Schätzungen basieren auf branchenüblichen Margen. Ihre tatsächliche Einsparung hängt von Ihrem Transaktionsverlauf ab.',
      'gs.h2':'Ermitteln Sie eine genaue Zahl mit einem kostenlosen FX-Audit.',
      'gs.sub':'Wir analysieren Ihre tatsächlichen Transaktionsdaten und zeigen Ihnen die präzise jährliche Einsparung.',
      'calc.cta.request-audit':'Kostenloses FX-Audit anfordern',
      // sol-ecom
      'sol-ecom.hero.badge1':'BaFin-lizenziert',
      'sol-ecom.hero.badge2':'Keine versteckten Gebühren',
      'sol-ecom.comp.row1.feat':'FX-Marge',
      'sol-ecom.comp.row1.bank.val':'2,0 % bis 4,0 %',
      'sol-ecom.comp.row1.bank.sub':'Undurchsichtig / versteckt',
      'sol-ecom.comp.row1.fin.val':'0,4 % bis 1,0 %',
      'sol-ecom.comp.row1.fin.sub':'Standard-Retail',
      'sol-ecom.comp.row1.hp.val':'0,15 % bis 0,75 %',
      'sol-ecom.comp.row1.hp.sub':'Transparent fixiert, vor dem Handel offengelegt*',
      'sol-ecom.comp.row2.feat':'Abwicklung',
      'sol-ecom.comp.row2.bank.val':'1 bis 3 Werktage',
      'sol-ecom.comp.row2.bank.sub':'Langsames SWIFT-Routing',
      'sol-ecom.comp.row2.fin.val':'Same Day',
      'sol-ecom.comp.row2.fin.sub':'Limitiert bei hohen Volumina',
      'sol-ecom.comp.row2.hp.val':'Minuten bis Stunden',
      'sol-ecom.comp.row2.hp.sub':'Lokale Netzwerke, keine SWIFT-Abhängigkeit',
      'sol-ecom.comp.row3.feat':'Abdeckung',
      'sol-ecom.comp.row3.bank.val':'Stark eingeschränkt',
      'sol-ecom.comp.row3.bank.sub':'Manuelle Gebühren und Verzögerungen',
      'sol-ecom.comp.row3.fin.val':'Eingeschränkt',
      'sol-ecom.comp.row3.fin.sub':'Lokale Volumenlimits',
      'sol-ecom.comp.row3.hp.val':'45+ Märkte weltweit',
      'sol-ecom.comp.row3.hp.sub':'Inklusive Märkte, die Ihre Bank nicht bedient',
      'sol-ecom.comp.row4.feat':'Auszahlungsgarantie',
      'sol-ecom.comp.row4.bank.val':'Nein',
      'sol-ecom.comp.row4.bank.sub':'Abzüge durch Korrespondenzbanken',
      'sol-ecom.comp.row4.fin.val':'Bedingt',
      'sol-ecom.comp.row4.fin.sub':'Marktvolatilitätsrisiken',
      'sol-ecom.comp.row4.hp.val':'Kursgarantie bei Fixierung',
      'sol-ecom.comp.row4.hp.sub':'Exakter Empfängerauszahlungsbetrag',
      'sol-ecom.comp.row5.feat':'Gebühr pro Zahlung',
      'sol-ecom.comp.row5.bank':'~€38 pro Überweisung',
      'sol-ecom.comp.row5.fin':'Variiert / versteckt',
      'sol-ecom.comp.row5.hp':'€10',
      'sol-ecom.calc.lbl.cat':'Währungskategorie',
      'sol-ecom.calc.lbl.provider':'Aktueller Anbietertyp',
      'sol-ecom.calc.result.cur':'Ihre aktuellen jährlichen FX-Kosten',
      'sol-ecom.calc.result.hp':'Mit HansePay',
      'sol-ecom.calc.result.saving':'Jährliche Einsparung',
      'sol-ecom.calc.cta':'Vollständiger Rechner mit Aufschlüsselung →',
      'sol-ecom.calc.disclaimer':'Nur Schätzung. Die genaue Einsparung hängt von Ihrem Transaktionsverlauf ab.',
      'sol-ecom.faq.eyebrow':'FAQ',
      'sol-ecom.faq.h2':'Fragen, die Online-Händler uns zuerst stellen.',
      'sol-ecom.faq.1.q':'Kann ich Lieferanten in ihrer Landeswährung bezahlen?',
      'sol-ecom.faq.1.a':'Ja. Die Sendewährung ist EUR. Wir zahlen in der Landeswährung (oder USD, wo lokal üblich) in 45+ Märkten weltweit aus, einschließlich der meisten Schwellenmärkte.',
      'sol-ecom.faq.2.q':'Unterstützen Sie Zahlungen in BRL, MXN, INR, VND oder anderen Schwellenmarktwährungen?',
      'sol-ecom.faq.2.a':'Ja. Alle vier Währungen werden unterstützt, zusammen mit 40+ weiteren in Schwellenmärkten in Asien, Afrika, dem Nahen Osten und Lateinamerika. Die Abwicklung erfolgt über lokale Zahlungsnetzwerke, nicht über SWIFT-Korrespondenzbanken — deshalb erreichen wir Korridore, die die meisten Banken ablehnen.',
      'sol-ecom.faq.3.q':'Wie bezahle ich chinesische Lieferanten in CNY ohne hohe Überweisungsgebühren?',
      'sol-ecom.faq.3.a':'Wir wickeln CNY-Zahlungen über lokale Zahlungsschienen ab, nicht über SWIFT. Es gibt keine Lifting-Gebühr, keinen Korrespondenzbankenabzug und keinen versteckten Aufschlag auf der Empfängerseite. Der Betrag, den Ihr Lieferant sieht, entspricht dem Betrag im Angebot.',
      'sol-ecom.faq.4.q':'Was ist das Mindestvolumen für eine Zusammenarbeit mit HansePay?',
      'sol-ecom.faq.4.a':'Kein festes Minimum. HansePay arbeitet mit Unternehmen zusammen, die von einigen tausend Euro pro Jahr bis zu mehreren hundert Millionen handeln. Das Einzige, was sich ändert, ist, welche Produkte für Ihren Zahlungsfluss sinnvoll sind.',
      'sol-ecom.faq.5.q':'Kann ich HansePay in meine Systeme integrieren?',
      'sol-ecom.faq.5.a':'API-Zugang ist für institutionelle Kunden verfügbar. Standardformat-Exporte funktionieren mit den meisten Buchhaltungsabläufen. Sprechen Sie mit unserem Spezialisten über Ihre spezifischen Integrationsbedürfnisse.',
      'sol-ecom.faq.6.q':'Kann ich den Kurs bei der Ausführung sichern?',
      'sol-ecom.faq.6.a':'Ja. Der Wechselkurs wird zum Zeitpunkt der Handelsausführung fixiert. Der im Angebot angezeigte Kurs ist der ausgeführte Kurs. Kein Slippage zwischen Angebot und Abwicklung, keine zukunftsdatierte Fixierung.',
      'sol-ecom.faq.7.q':'Wie funktioniert das mit meinem Buchhalter?',
      'sol-ecom.faq.7.a':'Transaktionen werden in Standardformaten exportiert, die Ihr Buchhaltungsteam bereits verwendet. Lesezugriff für Ihren Buchhalter ist auf Anfrage über Ihren Kontoadministrator verfügbar. Sprechen Sie mit unserem Spezialisten über spezifische Prüfpfadanforderungen.',
      'sol-ecom.cta.dealer':'Mit einem Händler sprechen',
      // sol-mfg
      'sol-mfg.cov.eyebrow':'Globale Reichweite',
      'sol-mfg.cov.h2':'45+ Märkte, eine Plattform.',
      'sol-mfg.cov.sub':'Erreichen Sie Nord- und Südamerika, Afrika, den Nahen Osten, Asien & Pazifik und Europa — einschließlich Märkte, die die meisten Banken nicht bedienen.',
      'sol-mfg.cov.more':'+11 weitere',
      'sol-mfg.calc.eyebrow':'Was könnten Sie sparen',
      'sol-mfg.calc.h2':'Schätzen Sie Ihre jährliche Einsparung in 30 Sekunden.',
      'sol-mfg.calc.sub':'Stellen Sie Ihr jährliches FX-Volumen und Ihren aktuellen Anbieter ein. Wir berechnen die geschätzte jährliche Einsparung mit HansePay.',
      'sol-mfg.calc.lbl.vol':'Jährliches FX-Volumen',
      'sol-mfg.calc.range.min':'€100T',
      'sol-mfg.calc.range.max':'€50 Mio.',
      'sol-mfg.calc.lbl.cat':'Währungskategorie',
      'sol-mfg.calc.cat.major':'Haupt (USD, GBP, JPY, CAD…)',
      'sol-mfg.calc.cat.minor':'Neben (BRL, MXN, ZAR, AED…)',
      'sol-mfg.calc.cat.exotic':'Exotisch (VND, NGN, PKR…)',
      'sol-mfg.calc.lbl.provider':'Aktueller Anbietertyp',
      'sol-mfg.calc.provider.house-bank':'Hausbank (~2,5 % Marge)',
      'sol-mfg.calc.provider.sparkasse':'Sparkasse / Regionalbank (~3,5 %)',
      'sol-mfg.calc.provider.fintech':'Fintech-App (~0,7 %)',
      'sol-mfg.calc.provider.online-bank':'Online-Bank (~1,5 %)',
      'sol-mfg.calc.res.current':'Ihre aktuellen jährlichen FX-Kosten',
      'sol-mfg.calc.res.with-hp':'Mit HansePay',
      'sol-mfg.calc.res.saving':'Jährliche Einsparung',
      'sol-mfg.calc.cta':'Vollständiger Rechner mit Aufschlüsselung →',
      'sol-mfg.calc.disclaimer':'Nur Schätzung. Die genaue Einsparung hängt von Ihrem Transaktionsverlauf ab.',
      'sol-mfg.comp.row4.feat':'Auszahlungsgarantie',
      'sol-mfg.comp.row4.bank.main':'Nein',
      'sol-mfg.comp.row4.bank.sub':'Abzüge durch Korrespondenzbanken',
      'sol-mfg.comp.row4.fintech.main':'Bedingt',
      'sol-mfg.comp.row4.fintech.sub':'Marktvolatilitätsrisiken',
      'sol-mfg.comp.row4.hp.main':'Kursgarantie bei Fixierung',
      'sol-mfg.comp.row4.hp.sub':'Exakter Empfängerauszahlungsbetrag',
      'sol-mfg.comp.row5.feat':'Gebühr pro Zahlung',
      'sol-mfg.comp.row5.bank':'~€38 pro Überweisung',
      'sol-mfg.comp.row5.fintech':'Variiert / versteckt',
      'sol-mfg.comp.row5.hp':'€10',
      'sol-mfg.comp.footnote':'* Beispiel-Margenbereich für Hauptwährungspaare bei Volumina über EUR 1 Mio. Genauer Kurs wird vor jedem Handel offengelegt.',
      'sol-mfg.faq.eyebrow':'FAQ',
      'sol-mfg.faq.h2':'Fragen, die Hersteller uns zuerst stellen.',
      'sol-mfg.faq.1.q':'Wie ist die Preisgestaltung für institutionelle Volumina strukturiert?',
      'sol-mfg.faq.1.a':'Wir berechnen einen transparenten Aufschlag auf den Interbanken-Kurs, der vor jedem Handel offengelegt wird. Bei Hauptwährungspaaren liegen die Margen zwischen 0,15 % und 0,75 % — basierend auf einem Beispielvolumen über EUR 1 Mio. Individuelle Preisgestaltung ist bei anhaltend hohem Volumen verfügbar.',
      'sol-mfg.faq.2.q':'Können Sie Lieferantenzahlungen in Schwellenmarktwährungen wie BRL, INR oder KRW abwickeln?',
      'sol-mfg.faq.2.a':'Ja. Alle drei werden unterstützt, zusammen mit 40+ weiteren Währungen in Schwellenmärkten in Asien, Afrika, dem Nahen Osten und Lateinamerika. Die Abwicklung erfolgt wo möglich über lokale Zahlungsnetzwerke — deshalb erreichen wir Korridore, die die meisten Banken ablehnen.',
      'sol-mfg.faq.3.q':'Wie schnell können Sie einen Großbetrag ausführen?',
      'sol-mfg.faq.3.a':'Großbeträge werden direkt von einem Senior-Händler quotiert und mit vollständig kursgesperrter Preisgestaltung ausgeführt. Die Ausführung erfolgt in Minuten, nicht in der Warteschlange des nächsten Tages, in die Sie der Schalter Ihrer Bank einreihen würde. Sprechen Sie mit unserem Spezialisten über typische Ticketgrößen und den Korridor-Mix.',
      'sol-mfg.faq.4.q':'Kann ich HansePay in meine Systeme integrieren?',
      'sol-mfg.faq.4.a':'API-Zugang ist für institutionelle Kunden verfügbar. Standardformat-Exporte funktionieren mit den meisten Buchhaltungsabläufen. Sprechen Sie mit unserem Spezialisten über Ihre spezifischen Integrationsbedürfnisse.',
      'sol-mfg.faq.5.q':'Kann ich den Kurs bei der Ausführung sichern?',
      'sol-mfg.faq.5.a':'Ja. Der Wechselkurs wird zum Zeitpunkt der Handelsausführung fixiert. Der im Angebot angezeigte Kurs ist der ausgeführte Kurs. Kein Slippage zwischen Angebot und Abwicklung, keine zukunftsdatierte Fixierung.',
      // sol-log
      'sol-log.faq.eyebrow':'FAQ',
      'sol-log.faq.h2':'Fragen, die Logistikanbieter uns zuerst stellen.',
      'sol-log.faq.1.q':'Wie schnell können Sie einen Carrier oder Hafen-Agenten in Singapur, Houston oder Rotterdam bezahlen?',
      'sol-log.faq.1.a':'Zahlungen werden in den meisten Korridoren über lokale Netzwerke am selben Tag abgewickelt. Die Abwicklungszeit hängt von der Zielbank ab, aber wir fügen Ihrem Handel keine Tage interner Warteschlange hinzu. Sprechen Sie mit unserem Spezialisten über Ihre typischen Ziele.',
      'sol-log.faq.2.q':'Kann ich Gegenparteien in ihrer Landeswährung bezahlen?',
      'sol-log.faq.2.a':'Ja. Die Sendewährung ist EUR. Wir zahlen in der Landeswährung (oder USD, wo lokal üblich) in 45+ Märkten weltweit aus. Lokale Zahlungsschienen, wo verfügbar — deshalb landen die meisten Zahlungen am selben Tag.',
      'sol-log.faq.3.q':'Unterstützen Sie Massenzahlungen in unserem Agentennetzwerk?',
      'sol-log.faq.3.a':'Ja. Mehrere Gegenparteien in verschiedenen Währungen in einem einzigen Batch-Upload bezahlen. Abstimmungsdateien integrieren sich in Standard-Buchhaltungsabläufe. Nützlich für Agentennetzwerke, wo Dutzende kleiner Zahlungen den Bankspread aufaddieren.',
      'sol-log.faq.4.q':'Wickeln Sie lokale Währungen an Häfen und Zollstellen in Schwellenmärkten ab?',
      'sol-log.faq.4.a':'Ja. Die Abdeckung umfasst wichtige Schwellenmarktwährungen in Asien, Afrika, dem Nahen Osten und Lateinamerika. Die Abwicklung erfolgt wo möglich über lokale Zahlungsnetzwerke. Sprechen Sie mit unserem Spezialisten über Ihren spezifischen Korridor.',
      'sol-log.faq.5.q':'Kann ich HansePay in meine Systeme integrieren?',
      'sol-log.faq.5.a':'API-Zugang ist für institutionelle Kunden verfügbar. Standardformat-Exporte funktionieren mit den meisten Buchhaltungsabläufen. Sprechen Sie mit unserem Spezialisten über Ihre spezifischen Integrationsbedürfnisse.',
      'sol-log.faq.6.q':'Bedienen Sie maritime Betreiber mit Besatzungslohn in mehreren Währungen?',
      'sol-log.faq.6.a':'Ja. Besatzungslohn ist einer der klassischen Logistik-Anwendungsfälle für uns. Massenzahlungen per Tabellenkalkulations-Upload bewältigen das operative Volumen, und lokale Währungszahlung erreicht Besatzungsmitglieder direkt in ihrem Heimatmarkt.',
      'sol-log.faq.7.q':'Gibt es ein Mindestvolumen für eine Zusammenarbeit?',
      'sol-log.faq.7.a':'Kein festes Minimum. HansePay arbeitet mit Logistikanbietern von regionalen Speditionen bis zu internationalen Betreibern. Die Produkte und das Service-Level passen sich Ihrem Volumen an.',
      'sol-log.calc.lbl.provider':'Aktueller Anbietertyp',
      'sol-log.calc.result.current':'Ihre aktuellen jährlichen FX-Kosten',
      'sol-log.calc.result.with-hp':'Mit HansePay',
      'sol-log.calc.result.saving':'Jährliche Einsparung',
      'sol-log.calc.cta':'Vollständiger Rechner mit Aufschlüsselung →',
      'sol-log.calc.disclaimer':'Nur Schätzung. Die genaue Einsparung hängt von Ihrem Transaktionsverlauf ab.',
      'sol-log.calc.cat.major':'Haupt (USD, GBP, JPY, CAD…)',
      'sol-log.calc.cat.minor':'Neben (BRL, MXN, ZAR, AED…)',
      'sol-log.calc.cat.exotic':'Exotisch (VND, NGN, PKR…)',
      'sol-log.calc.provider.house-bank':'Hausbank (~2,5 % Marge)',
      'sol-log.calc.provider.regional-bank':'Sparkasse / Regionalbank (~3,5 %)',
      'sol-log.calc.provider.fintech':'Fintech-App (~0,7 %)',
      'sol-log.calc.provider.online-bank':'Online-Bank (~1,5 %)',
      'sol-log.cta.h2':'Hören Sie auf, FX-Margen Ihre Frachtmargen auffressen zu lassen.',
      'sol-log.cta.sub':'Same-Day-Zahlungen, 45+ Märkte, Wholesale-FX-Preise. Entwickelt für den Frachtzeitplan.',
      'sol-log.comp.row1.feat':'FX-Marge',
      'sol-log.comp.row1.bank':'Undurchsichtig / versteckt',
      'sol-log.comp.row1.fintech':'Standard-Retail',
      'sol-log.comp.row1.hp':'Transparent fixiert, vor dem Handel offengelegt*',
      'sol-log.comp.row2.feat':'Abwicklung',
      'sol-log.comp.row2.bank':'1 bis 3 Werktage',
      'sol-log.comp.row2.bank-sub':'Langsames SWIFT-Routing',
      'sol-log.comp.row2.fintech':'Same Day',
      'sol-log.comp.row2.fintech-sub':'Limitiert bei hohen Volumina',
      'sol-log.comp.row2.hp':'Minuten bis Stunden',
      'sol-log.comp.row2.hp-sub':'Lokale Netzwerke, keine SWIFT-Abhängigkeit',
      'sol-log.comp.row3.feat':'Abdeckung',
      'sol-log.comp.row3.bank':'Stark eingeschränkt',
      'sol-log.comp.row3.bank-sub':'Manuelle Gebühren und Verzögerungen',
      'sol-log.comp.row3.fintech':'Eingeschränkt',
      'sol-log.comp.row3.fintech-sub':'Lokale Volumenlimits',
      'sol-log.comp.row3.hp':'45+ Märkte weltweit',
      'sol-log.comp.row3.hp-sub':'Inklusive Märkte, die Ihre Bank nicht bedient',
      'sol-log.comp.row4.feat':'Auszahlungsgarantie',
      'sol-log.comp.row4.bank':'Nein',
      'sol-log.comp.row4.bank-sub':'Abzüge durch Korrespondenzbanken',
      'sol-log.comp.row4.fintech':'Bedingt',
      'sol-log.comp.row4.fintech-sub':'Marktvolatilitätsrisiken',
      'sol-log.comp.row4.hp':'Kursgarantie bei Fixierung',
      'sol-log.comp.row4.hp-sub':'Exakter Empfängerauszahlungsbetrag',
      'sol-log.comp.row5.feat':'Gebühr pro Zahlung',
      'sol-log.comp.row5.bank':'~€38 pro Überweisung',
      'sol-log.comp.row5.fintech':'Variiert / versteckt',
      'sol-log.comp.row5.hp':'€10',
      'sol-log.cov.more':'+11 weitere',
      // sol-corp
      'sol-corp.feat.3.title':'Lokale Zahlungen weltweit',
      'sol-corp.feat.3.desc':'Gegenparteien in ihrer Landeswährung in 45+ Märkten weltweit bezahlen, einschließlich Schwellenmärkte, wo Standardbanken häufig blockieren oder Aufschläge erheben.',
      'sol-corp.feat.4.title':'Lokale Zahlungsschienen, kein SWIFT',
      'sol-corp.feat.4.desc':'Zahlungen werden über lokale Expressnetzwerke wie SEPA und ACH geleitet, nicht über SWIFT-Korrespondenzbanken. Niedrigere Kosten, schnellere Abwicklung, keine versteckten Zwischengebühren.',
      'sol-corp.feat.5.title':'Massenzahlungen per Tabellenkalkulations-Upload',
      'sol-corp.feat.5.desc':'Mehrere Lieferanten in verschiedenen Währungen in einem einzigen Batch-Upload bezahlen. Abstimmungsdateien integrieren sich in Standard-Buchhaltungsabläufe.',
      'sol-corp.feat.6.title':'Namentlicher Experte für institutionelle Volumina',
      'sol-corp.feat.6.desc':'Bei Konten mit institutionellen Volumina steht ein namentlicher Experte als direkter Ansprechpartner zur Verfügung — kein Chatbot. Senior-Händlerzugang vom ersten Tag an.',
      'sol-corp.persona.eyebrow':'Entwickelt für',
      'sol-corp.persona.h2':'Entwickelt für die Art und Weise, wie Mittelstand und Großunternehmen arbeiten.',
      'sol-corp.persona.sub':'Vier Muster, die wir am häufigsten bei Unternehmen mit komplexen FX-Anforderungen sehen.',
      'sol-corp.persona.1.name':'Mittelständische Hersteller',
      'sol-corp.persona.1.desc':'Multi-Entity-Betriebe, die Komponenten importieren und Fertigwaren exportieren. Kursgesperrte Ausführung, die Produktionszyklen entspricht, mit Wholesale-Preisen auf Schwellenmarktkorridoren.',
      'sol-corp.persona.2.name':'Grenzüberschreitende E-Commerce-Gruppen',
      'sol-corp.persona.2.desc':'Lieferanten in CNY, INR und VND bezahlt, mit kursgesperrter Ausführung bei jeder Umrechnung. Batch-Läufe per Tabellenkalkulations-Upload für hochvolumige Zahlungsläufe.',
      'sol-corp.persona.3.name':'B2B-Dienstleistungsunternehmen',
      'sol-corp.persona.3.desc':'Einnahmen in EUR buchen. Kursgesperrte Ausführung bei Zahlungen an ausländische Gegenparteien mit Wholesale-Volumen-Preisen.',
      'sol-corp.persona.4.name':'Internationale Großhändler',
      'sol-corp.persona.4.desc':'Beschaffung in Asien, Afrika und Lateinamerika. Zugang zu Korridoren, die die meisten Banken nicht bedienen, in 45+ Märkten weltweit, mit namentlichen Kontakten für institutionelle Volumina.',
      'sol-corp.comp.eyebrow':'Der Vergleich',
      'sol-corp.comp.h2':'HansePay vs. Ihre Bank vs. eine Fintech-App.',
      'sol-corp.comp.sub':'Der ehrliche, zeilenweise Vergleich, den die meisten Anbieter nicht auf ihre Website stellen.',
      'sol-corp.comp.th.feature':'Merkmal',
      'sol-corp.comp.th.bank':'Hausbank',
      'sol-corp.comp.th.fintech':'Fintech-Apps',
      'sol-corp.comp.th.hp':'HansePay',
      'sol-corp.comp.row1.feat':'FX-Marge',
      'sol-corp.comp.row1.bank':'Undurchsichtig / versteckt',
      'sol-corp.comp.row1.fintech':'Standard-Retail',
      'sol-corp.comp.row1.hp':'Transparent fixiert, vor dem Handel offengelegt*',
      'sol-corp.comp.row2.feat':'Abwicklung',
      'sol-corp.comp.row2.bank.val':'1 bis 3 Werktage',
      'sol-corp.comp.row2.bank.sub':'Langsames SWIFT-Routing',
      'sol-corp.comp.row2.fintech.val':'Same Day',
      'sol-corp.comp.row2.fintech.sub':'Limitiert bei hohen Volumina',
      'sol-corp.comp.row2.hp.val':'Minuten bis Stunden',
      'sol-corp.comp.row2.hp.sub':'Lokale Netzwerke, keine SWIFT-Abhängigkeit',
      'sol-corp.comp.row3.feat':'Abdeckung',
      'sol-corp.comp.row3.bank.val':'Stark eingeschränkt',
      'sol-corp.comp.row3.bank.sub':'Manuelle Gebühren und Verzögerungen',
      'sol-corp.comp.row3.fintech.val':'Eingeschränkt',
      'sol-corp.comp.row3.fintech.sub':'Lokale Volumenlimits',
      'sol-corp.comp.row3.hp.val':'45+ Märkte weltweit',
      'sol-corp.comp.row3.hp.sub':'Inklusive Märkte, die Ihre Bank nicht bedient',
      'sol-corp.comp.row4.feat':'Auszahlungsgarantie',
      'sol-corp.comp.row4.bank.val':'Nein',
      'sol-corp.comp.row4.bank.sub':'Abzüge durch Korrespondenzbanken',
      'sol-corp.comp.row4.fintech.val':'Bedingt',
      'sol-corp.comp.row4.fintech.sub':'Marktvolatilitätsrisiken',
      'sol-corp.comp.row4.hp.val':'Kursgarantie bei Fixierung',
      'sol-corp.comp.row4.hp.sub':'Exakter Empfängerauszahlungsbetrag',
      'sol-corp.comp.row5.feat':'Gebühr pro Zahlung',
      'sol-corp.comp.row5.bank':'~€38 pro Überweisung',
      'sol-corp.comp.row5.fintech':'Variiert / versteckt',
      'sol-corp.comp.row5.hp':'€10',
      'sol-corp.comp.footnote':'* Beispiel-Margenbereich für Hauptwährungspaare bei Volumina über EUR 1 Mio. Genauer Kurs wird vor jedem Handel offengelegt.',
      'sol-corp.cov.eyebrow':'Globale Reichweite',
      'sol-corp.cov.h2':'45+ Märkte, eine Plattform.',
      'sol-corp.cov.sub':'Erreichen Sie Nord- und Südamerika, Afrika, den Nahen Osten, Asien & Pazifik und Europa — einschließlich Märkte, die die meisten Banken nicht bedienen.',
      'sol-corp.calc.eyebrow':'Was könnten Sie sparen',
      'sol-corp.calc.h2':'Schätzen Sie Ihre jährliche Einsparung in 30 Sekunden.',
      'sol-corp.calc.sub':'Stellen Sie Ihr jährliches FX-Volumen und Ihren aktuellen Anbieter ein. Wir berechnen die geschätzte jährliche Einsparung mit HansePay.',
      'sol-corp.calc.lbl.vol':'Jährliches FX-Volumen',
      'sol-corp.calc.lbl.cat':'Währungskategorie',
      'sol-corp.calc.lbl.provider':'Aktueller Anbietertyp',
      'sol-corp.calc.cat.major':'Haupt (USD, GBP, JPY, CAD…)',
      'sol-corp.calc.cat.minor':'Neben (BRL, MXN, ZAR, AED…)',
      'sol-corp.calc.cat.exotic':'Exotisch (VND, NGN, PKR…)',
      'sol-corp.calc.provider.housebank':'Hausbank (~2,5 % Marge)',
      'sol-corp.calc.provider.regional':'Sparkasse / Regionalbank (~3,5 %)',
      'sol-corp.calc.provider.fintech':'Fintech-App (~0,7 %)',
      'sol-corp.calc.provider.online':'Online-Bank (~1,5 %)',
      'sol-corp.calc.result.cur':'Ihre aktuellen jährlichen FX-Kosten',
      'sol-corp.calc.result.hp':'Mit HansePay',
      'sol-corp.calc.result.saving':'Jährliche Einsparung',
      'sol-corp.calc.cta':'Vollständiger Rechner mit Aufschlüsselung →',
      'sol-corp.calc.disclaimer':'Nur Schätzung. Die genaue Einsparung hängt von Ihrem Transaktionsverlauf ab.',
      'sol-corp.faq.eyebrow':'FAQ',
      'sol-corp.faq.h2':'Fragen, die mittelständische Unternehmen uns zuerst stellen.',
      'sol-corp.faq.1.q':'Wie ist die Preisgestaltung für institutionelle Volumina strukturiert?',
      'sol-corp.faq.1.a':'Wir berechnen einen transparenten Aufschlag auf den Interbanken-Kurs, der vor jedem Handel offengelegt wird. Bei Hauptwährungspaaren liegen die Margen zwischen 0,15 % und 0,75 % — basierend auf einem Beispielvolumen über EUR 1 Mio. Individuelle Preisgestaltung ist bei anhaltend hohem Volumen verfügbar.',
      'sol-corp.faq.2.q':'Unterstützen Sie Netting über Konzerneinheiten hinweg?',
      'sol-corp.faq.2.a':'Netting über Konzerneinheiten steht auf der Roadmap. Für heute operierende Konzerne kann unser Spezialist erläutern, wie Sie Positionen über Rechtseinheiten hinweg mit unserem aktuellen Toolset konsolidieren können.',
      'sol-corp.faq.3.q':'Wie handhaben Sie Multi-Entity-KYC?',
      'sol-corp.faq.3.a':'Jede juristische Person wird durch ihre eigene KYC- und KYB-Prüfung nach EU-Vorschriften ongeboardet. Für Konzerne koordinieren wir den Prüfprozess, damit alle Einheiten gemeinsam aktiviert werden können. Sprechen Sie mit unserem Spezialisten über Ihre Konzernstruktur.',
      'sol-corp.faq.4.q':'Was geschieht mit Kundengeldern, wenn HansePay scheitert?',
      'sol-corp.faq.4.a':'Kundengelder werden auf getrennten Konten bei Tier-1-Europabanken verwahrt, getrennt vom Betriebskapital von HansePay. Im Insolvenzfall gehören diese Gelder nicht zur Insolvenzmasse. Sie sind nach MiCAR Artikel 75 rechtlich geschützt und werden zum Nennwert zurückgegeben.',
      'sol-corp.faq.5.q':'Wie ist Ihr Handelstisch besetzt?',
      'sol-corp.faq.5.a':'Unser Handelsteam besteht aus erfahrenen FX-Händlern mit europäischer Bankerfahrung. Bei Konten mit institutionellen Volumina ist ein namentlicher Experte Ihr direkter Ansprechpartner. Anrufe und E-Mails werden an eine echte Person weitergeleitet, die Ihr Handelsprofil kennt — keine Hotline-Warteschlange.',
      'sol-corp.faq.6.q':'Kann Ihre Plattform große Einzelhandelstickets verarbeiten?',
      'sol-corp.faq.6.a':'Ja. Einzelhandelstickets in institutioneller Größe werden direkt von einem Senior-Händler quotiert und mit vollständig kursgesperrter Preisgestaltung ausgeführt. Sprechen Sie mit unserem Spezialisten über Ihre typische Ticketgröße und den Korridor-Mix.',
      'sol-corp.faq.7.q':'Wie ist Ihr regulatorischer Status?',
      'sol-corp.faq.7.a':'HansePay operiert unter einer europäischen MiCAR-Lizenz, beaufsichtigt in Deutschland durch die BaFin. Kundengelder werden auf getrennten Konten bei Tier-1-Europabanken verwahrt. Für Gegenparteirisikofragen, die Ihrer Treasury-Richtlinie entsprechen, kann unser Spezialist die vollständige Struktur erläutern.',
      'sol-corp.faq.8.q':'Kann unser Prüfer direkt auf Transaktionsdaten zugreifen?',
      'sol-corp.faq.8.a':'Ja. Standardformat-Exporte funktionieren mit den meisten Prüfungsabläufen. Lesezugriff für Prüfer ist auf Anfrage über Ihren Kontoadministrator verfügbar. Sprechen Sie mit unserem Spezialisten über spezifische Prüfpfadanforderungen.',
      'sol-corp.cta.h2':'Das FX-Setup, das Ihre Treasury-Funktion wirklich verdient.',
      'sol-corp.cta.sub':'Institutionelle Preisgestaltung, kursgesperrte Ausführung und ein namentlicher Experte vom ersten Tag an. Für Unternehmen mit echtem Volumen.',
      // sol-sme
      'sol-sme.pain.6.title':'Märkte, die Ihre Bank ablehnt',
      'sol-sme.pain.6.desc':'Müssen Sie einen Lieferanten in Vietnam, Brasilien oder Pakistan bezahlen? Die meisten Banken lehnen den Korridor ab oder erheben empfindliche Spreads auf Schwellenmarktwährungen.',
      'sol-sme.sol.eyebrow':'Was wir tun',
      'sol-sme.sol.h2':'Entwickelt für die Art und Weise, wie Kleinunternehmen tatsächlich Geld bewegen.',
      'sol-sme.sol.sub':'Sechs Tools, eine Plattform, preislich für Unternehmen ohne eigene Treasury-Abteilung.',
      'sol-sme.feat.1.title':'Spot-Geschäfte zu Interbanken-Kursen',
      'sol-sme.feat.1.desc':'Echte Interbanken-Kurse plus eine transparente Marge, die Sie vor dem Handel sehen. Kein versteckter Spread, keine Überraschungen auf dem Beleg.',
      'sol-sme.feat.2.title':'Kurs bei Ausführung gesperrt',
      'sol-sme.feat.2.desc':'Der im Angebot angezeigte Kurs ist der ausgeführte Kurs. Kein Slippage zwischen Angebot und Abwicklung. Der Empfänger erhält genau den vereinbarten Betrag.',
      'sol-sme.feat.3.title':'Lokale Zahlungen weltweit',
      'sol-sme.feat.3.desc':'Gegenparteien in ihrer Landeswährung in 45+ Märkten weltweit bezahlen, einschließlich Schwellenmärkte, wo Standardbanken häufig blockieren oder Aufschläge erheben.',
      'sol-sme.feat.4.title':'Lokale Zahlungsschienen, kein SWIFT',
      'sol-sme.feat.4.desc':'Zahlungen werden über lokale Expressnetzwerke wie SEPA und ACH geleitet, nicht über SWIFT-Korrespondenzbanken. Niedrigere Kosten, schnellere Abwicklung, keine versteckten Zwischengebühren.',
      'sol-sme.feat.5.title':'Massenzahlungen per Tabellenkalkulations-Upload',
      'sol-sme.feat.5.desc':'Mehrere Lieferanten in verschiedenen Währungen in einem einzigen Batch-Upload bezahlen. Abstimmungsdateien integrieren sich in Standard-Buchhaltungsabläufe.',
      'sol-sme.feat.6.title':'Direkter Support von Menschen, die Ihr Konto kennen',
      'sol-sme.feat.6.desc':'Kein Chatbot, keine Hotline. FX-Experten, die verfügbar sind, wenn Ihr Unternehmen sie braucht.',
      'sol-sme.persona.eyebrow':'Entwickelt für',
      'sol-sme.persona.h2':'Entwickelt für die Kleinunternehmen, die große Volkswirtschaften aufbauen.',
      'sol-sme.persona.sub':'Vier Beispiele, wie Kleinunternehmen HansePay jede Woche nutzen.',
      'sol-sme.persona.1.name':'Der E-Commerce-Importeur',
      'sol-sme.persona.1.desc':'Sichert Landungskosten-Margen zum Angebotszeitpunkt bei jeder Umrechnung. Transparente Gebühren, kein versteckter Spread bei USD- oder CNY-Lieferantenzahlungen.',
      'sol-sme.persona.2.name':'Der Produktionsexporteur',
      'sol-sme.persona.2.desc':'Sperrt den GBP-EUR-Kurs zum Zeitpunkt der Rechnungsstellung, damit die Marge zwischen Bestellung und Bestätigung nicht driftet.',
      'sol-sme.persona.3.name':'Die Kreativagentur',
      'sol-sme.persona.3.desc':'Zahlt jeden Monat Freelancer in vielen Ländern. Massenzahlungen per Tabellenkalkulations-Upload reduzieren den AP-Aufwand erheblich.',
      'sol-sme.persona.4.name':'Das B2B-SaaS-Startup',
      'sol-sme.persona.4.desc':'Bezahlt AWS, US-Auftragnehmer und ausländische Freelancer in ihrer Landeswährung zu kursgesperrten Kursen. Vorhersehbare, transparente FX bei jeder Umrechnung.',
      'sol-sme.comp.eyebrow':'Der Vergleich',
      'sol-sme.comp.h2':'HansePay vs. Ihre Bank vs. eine Fintech-App.',
      'sol-sme.comp.sub':'Der ehrliche, zeilenweise Vergleich, den die meisten Anbieter nicht auf ihre Website stellen.',
      'sol-sme.comp.th.feature':'Merkmal',
      'sol-sme.comp.th.bank':'Hausbank',
      'sol-sme.comp.th.fintech':'Fintech-Apps',
      'sol-sme.comp.th.hp':'HansePay',
      'sol-sme.comp.footnote':'* Beispiel-Margenbereich für Hauptwährungspaare bei Volumina über EUR 1 Mio. Genauer Kurs wird vor jedem Handel offengelegt.',
      'sol-sme.cov.eyebrow':'Globale Reichweite',
      'sol-sme.cov.h2':'45+ Märkte, eine Plattform.',
      'sol-sme.cov.sub':'Erreichen Sie Nord- und Südamerika, Afrika, den Nahen Osten, Asien & Pazifik und Europa — einschließlich Märkte, die die meisten Banken nicht bedienen.',
      'sol-sme.calc.eyebrow':'Was könnten Sie sparen',
      'sol-sme.calc.h2':'Schätzen Sie Ihre jährliche Einsparung in 30 Sekunden.',
      'sol-sme.calc.sub':'Stellen Sie Ihr jährliches FX-Volumen und Ihren aktuellen Anbieter ein. Wir berechnen die geschätzte jährliche Einsparung mit HansePay.',
      'sol-sme.calc.lbl.vol':'Jährliches FX-Volumen',
      'sol-sme.calc.lbl.cat':'Währungskategorie',
      'sol-sme.calc.lbl.provider':'Aktueller Anbietertyp',
      'sol-sme.calc.result.cur-cost':'Ihre aktuellen jährlichen FX-Kosten',
      'sol-sme.calc.result.hp-cost':'Mit HansePay',
      'sol-sme.calc.result.saving':'Jährliche Einsparung',
      'sol-sme.calc.cta':'Vollständiger Rechner mit Aufschlüsselung →',
      'sol-sme.calc.disclaimer':'Nur Schätzung. Die genaue Einsparung hängt von Ihrem Transaktionsverlauf ab.',
      'sol-sme.faq.eyebrow':'FAQ',
      'sol-sme.faq.h2':'Fragen, die Kleinunternehmen uns zuerst stellen.',
      'sol-sme.faq.1.q':'Gibt es ein Mindest-FX-Volumen für die Kontoeröffnung?',
      'sol-sme.faq.1.a':'Kein festes Minimum. HansePay arbeitet mit Unternehmen zusammen, die von einigen tausend Euro pro Jahr bis zu mehreren hundert Millionen handeln. Das Einzige, was sich ändert, ist, welche Produkte für Ihren Zahlungsfluss sinnvoll sind. Wir sind beim Onboarding ehrlich darüber.',
      'sol-sme.faq.2.q':'Wie ist HansePay reguliert?',
      'sol-sme.faq.2.a':'HansePay operiert unter einer europäischen MiCAR-Lizenz, beaufsichtigt in Deutschland durch die BaFin. Vollständige Lizenzdetails auf unserer Lizenzseite.',
      'sol-sme.faq.3.q':'Wie verdient HansePay Geld, wenn Ihre Spreads so eng sind?',
      'sol-sme.faq.3.a':'Wir berechnen einen kleinen, transparenten Aufschlag auf den Interbanken-Kurs, der vor jedem Handel offengelegt wird. Die Einsparungen gegenüber den typischen Bankpreisen sind strukturell, nicht werblich. Wir verdienen weniger pro Handel als eine Hausbank, bedienen aber Kunden mit beliebigem Volumen.',
      'sol-sme.faq.4.q':'Kann HansePay mit meiner Buchhaltungssoftware integriert werden?',
      'sol-sme.faq.4.a':'API-Zugang ist für institutionelle Kunden verfügbar. Standardformat-Exporte funktionieren mit den meisten Buchhaltungsabläufen. Sprechen Sie mit uns über Ihre spezifischen Integrationsbedürfnisse.',
      'sol-sme.faq.5.q':'Unterstützen Sie Zahlungen in Hochrisikoländer?',
      'sol-sme.faq.5.a':'HansePay deckt 45+ Märkte ab, einschließlich vieler Schwellenmärkte, wo Standardbanken blockieren oder Aufschläge erheben. Jede Transaktion wird nach EU-AML- und KYC-Vorschriften geprüft. Sprechen Sie mit unserem Spezialisten über Ihren spezifischen Korridor.',
      'sol-sme.faq.6.q':'Was geschieht mit meinen Geldern, wenn HansePay scheitert?',
      'sol-sme.faq.6.a':'Kundengelder werden auf getrennten Konten bei Tier-1-Europabanken verwahrt, getrennt vom Betriebskapital von HansePay. Im Insolvenzfall gehören diese Gelder nicht zur Insolvenzmasse. Sie sind nach MiCAR Artikel 75 rechtlich geschützt und werden zum Nennwert zurückgegeben.',
      'sol-sme.faq.7.q':'Kann ich einen Kurs bei der Ausführung sperren?',
      'sol-sme.faq.7.a':'Ja. Der Wechselkurs wird zum Zeitpunkt der Handelsausführung fixiert. Der im Angebot angezeigte Kurs ist der ausgeführte Kurs. Kein Slippage zwischen Angebot und Abwicklung, keine zukunftsdatierte Fixierung.',
      'sol-sme.cta.h2':'FX, das für Sie arbeitet — nicht für Ihre Bank.',
      'sol-sme.cta.sub':'Eröffnen Sie heute ein Geschäftskonto. Kein Mindestvolumen, keine versteckten Gebühren, kein langes Onboarding.',
      // platform
      'platform.h1':'Eine Plattform für globale Zahlungen.',
      'platform.hero.cta2':'Mit einem Händler sprechen',
      'platform.pillars.eyebrow':'Die Plattform',
      'platform.pillars.h2':'Entwickelt für die Art und Weise, wie moderne Unternehmen zahlen.',
      'platform.feat.1.title':'FX ohne Aufschlag',
      'platform.feat.1.desc':'Wir geben den Interbanken-Kurs weiter — kein Spread, keine versteckte Marge. Der gleiche Kurs, den Sie auf Reuters oder Bloomberg sehen.',
      'platform.feat.2.title':'Same-Day-Abwicklung',
      'platform.feat.2.desc':'Die meisten grenzüberschreitenden Überweisungen werden innerhalb von 2 Stunden abgewickelt. SEPA Same-Day für EU-Partner. Vollständiges Tracking von der Bestätigung bis zur Gutschrift bei der Empfängerbank.',
      'platform.feat.3.title':'Treasury-grade Kontrollen',
      'platform.feat.3.desc':'Kursziel-Alarme, Forward-Kurssicherungen, Maker/Checker-Freigabeabläufe und vollständige Prüfpfade — damit Ihr Team mit Zuversicht ausführt.',
      'platform.stat.1.label':'Währungen',
      'platform.stat.2.label':'FX-Aufschlag',
      'platform.stat.3.label':'Onboarding',
      'platform.stat.4.label':'Lizenziert',
      'platform.transfers.eyebrow':'Zahlungen',
      'platform.transfers.h2':'Überall senden, in Minuten.',
      'platform.transfers.lede':'Empfänger einmal speichern und in jeder Währung mit wenigen Klicks bezahlen. Rechnung einlesen und unsere KI extrahiert Betrag, Empfänger und Verwendungszweck — oder manuell ausfüllen, wenn Sie die Kontrolle bevorzugen.',
      'platform.transfers.b1.title':'KI-Rechnungsextraktion',
      'platform.transfers.b1.desc':'PDF einlesen. Betrag, Empfänger und Verwendungszweck automatisch ausgefüllt.',
      'platform.transfers.b2.title':'Empfängerbuch mit IBAN/SWIFT-Validierung',
      'platform.transfers.b2.desc':'Bankdaten vor der ersten Zahlung verifiziert.',
      'platform.transfers.b3.title':'Maker/Checker-Freigabeabläufe',
      'platform.transfers.b3.desc':'Rollenbasierte Berechtigungen, damit die richtigen Personen genehmigen.',
      'platform.transfers.cta':'Demo ansehen',
      'platform.tracking.eyebrow':'Echtzeit-Tracking',
      'platform.tracking.h2':'Verfolgen Sie Ihre Zahlung auf ihrem Weg durch die Welt.',
      'platform.tracking.lede':'Jede Überweisung ist von dem Moment der Bestätigung an vollständig nachverfolgbar — bis zur Abwicklung bei der Bank des Empfängers.',
      'platform.alerts.eyebrow':'Kurs-Alarme',
      'platform.alerts.h2':'Verpassen Sie nie eine Kursgelegenheit.',
      'platform.alerts.lede':'Setzen Sie ein Ziel für ein Währungspaar. Sobald es erreicht wird, benachrichtigen wir Sie per SMS und E-Mail. Bevorzugen Sie einen gleichmäßigen Rhythmus? Tägliche Zusammenfassungen kommen jeden Morgen mit den relevanten Zahlen.',
      'platform.alerts.b1.title':'Interbanken-Kurs rund um die Uhr überwacht',
      'platform.alerts.b1.desc':'Wir prüfen den Live-Interbanken-Kurs, nicht einen verzögerten Bank-Feed.',
      'platform.alerts.b2.title':'SMS- und E-Mail-Benachrichtigungen',
      'platform.alerts.b2.desc':'Wählen Sie beide oder nur eine pro Alarm.',
      'platform.alerts.b3.title':'Ein Klick zur Ausführung aus dem Alarm',
      'platform.alerts.b3.desc':'Alarm ausgelöst, Sie klicken, Zahlung eingeleitet. Keine weiteren Schritte.',
      'platform.alerts.cta':'Ersten Alarm einrichten',
      'platform.coverage.eyebrow':'Abdeckung',
      'platform.coverage.h2':'45+ Märkte, eine Plattform.',
      'platform.coverage.lede':'Von EUR zu BRL, GBP zu CNY — wohin Ihr Unternehmen auch Geld bewegt, wir sind bereits dort.',
      'platform.coverage.footnote':'+ individuelle Korridore auf Anfrage für institutionelle Volumina verfügbar',
      'platform.onboard.eyebrow':'Onboarding',
      'platform.onboard.h2':'Konto in Minuten eröffnen.',
      'platform.onboard.lede':'KYC ist unkompliziert und für Unternehmen konzipiert. Nach der Verifizierung ist Ihr Konto live und bereit zur Einzahlung. Die regulierten Schienen sind bereits vor Ihrer ersten Euro-Überweisung vorhanden.',
      'platform.onboard.s1.title':'Antrag stellen',
      'platform.onboard.s1.desc':'Starten Sie Ihren Antrag online. Kein Papierkram in dieser Phase — nur grundlegende Unternehmensinformationen.',
      'platform.onboard.s2.title':'Identität verifizieren',
      'platform.onboard.s2.desc':'KYC und KYB für das Unternehmen. Firmendokumente und Geschäftsführeridentifikation einreichen.',
      'platform.onboard.s3.title':'Compliance-Prüfung',
      'platform.onboard.s3.desc':'Interne Compliance-Prüfung. Die meisten Prüfungen werden innerhalb eines Werktages abgeschlossen.',
      'platform.onboard.s4.title':'Konto aktivieren',
      'platform.onboard.s4.desc':'Konto wird live. Per SEPA-Überweisung von Ihrer bestehenden Bank einzahlen — Same-Day bei den meisten deutschen Banken.',
      'platform.onboard.s5.title':'Überweisungen starten',
      'platform.onboard.s5.desc':'Empfänger hinzufügen, ersten FX-Kurs sichern, erste grenzüberschreitende Zahlung abwickeln.',
      'platform.faq.eyebrow':'FAQ',
      'platform.faq.h2':'Häufige Fragen',
      'platform.faq.q1':'Ist HansePay reguliert?',
      'platform.faq.a1':'Ja. HansePay operiert unter Atrya Technologies SIA, einem BaFin-lizenzierten E-Geld-Institut, reguliert nach der EU-Zahlungsdiensterichtlinie 2 (PSD2). Kundengelder werden auf getrennten Konten verwahrt und nie für operative Zwecke verwendet.',
      'platform.faq.q2':'Wie funktioniert FX ohne Aufschlag eigentlich?',
      'platform.faq.a2':'Wir beziehen Wechselkurse direkt von Interbanken-Liquiditätsanbietern und geben sie ohne Spread an Sie weiter. Stattdessen berechnen wir eine feste Transaktionsgebühr, die klar vor der Bestätigung angezeigt wird. Sie wissen immer genau, was die Zahlung kostet, bevor Sie senden.',
      'platform.faq.q3':'Wie lange dauern Überweisungen?',
      'platform.faq.a3':'Die meisten EUR-SEPA-Überweisungen werden am gleichen Tag abgewickelt. Grenzüberschreitende SWIFT-Zahlungen werden in der Regel innerhalb von 1–2 Stunden für die wichtigsten Korridore (USD, GBP, CHF, JPY) abgewickelt. Exotische Korridore können einen Werktag dauern. Jede Überweisung ist in Echtzeit nachverfolgbar ab dem Moment der Bestätigung.',
      'platform.faq.q4':'Welche Währungen unterstützen Sie?',
      'platform.faq.a4':'45+ Märkte in Nord- und Südamerika, Afrika, dem Nahen Osten, Asien & Pazifik und Europa — darunter USD, GBP, JPY, CNY, AED, BRL, INR, CAD, AUD, SGD, HKD, MXN, KRW, ZAR und mehr. Für weniger gängige Korridore sind individuelle Vereinbarungen verfügbar — sprechen Sie mit einem unserer FX-Händler.',
      'platform.faq.q5':'Gibt es einen Mindestüberweisungsbetrag?',
      'platform.faq.a5':'Kein Minimum. Von einigen hundert Euro bis zu Multi-Millionen-Euro-Geschäften — gleicher Interbanken-Kurs, gleicher Service. Keine Volumenstaffeln, keine Vertragsbindung. Sie zahlen pro Transaktion und können jederzeit aufhören.',
      'platform.cta.eyebrow':'Bereit anzufangen',
      'platform.cta.btn2':'Mit einem Spezialisten sprechen',
      // vision
      'vision.h1':'Wir verbinden Märkte.',
      'vision.mission.eyebrow':'Mission',
      'vision.mission.h2':'Deutschland mit der Welt verbinden.',
      'vision.mission.p1':'Deutsche Unternehmen bezahlen Lieferanten in Vietnam, der Türkei, Angola, Pakistan. Sie begleichen Rechnungen in Buenos Aires, Mumbai, Lagos. Die Zahlungsinfrastruktur, auf die sie sich verlassen, wurde für Institutionen gebaut und tut so, als ende die restliche Welt am SWIFT-Korridor. HansePay schließt diese Lücke. Wir verbinden deutsche Unternehmen mit den Märkten, mit denen sie tatsächlich handeln — einschließlich derer, die Banken "exotisch" nennen und still meiden.',
      'vision.mission.p2':'Unsere Mission ist einfach zu formulieren und anspruchsvoll umzusetzen: die Reibung bei grenzüberschreitenden Zahlungen für den deutschen Mittelstand beseitigen. Menschen verbinden. Komplexität vereinfachen. Barrieren abbauen. Die Infrastruktur erledigt die technische Arbeit; wir übernehmen das Verbinden.',
      'vision.mission.p3':'Dies ist auch eine Frage europäischer Souveränität. Die Infrastruktur, die die meisten grenzüberschreitenden deutschen Zahlungen heute leitet, wurde vor einem halben Jahrhundert entworfen und läuft durch eine kleine Anzahl dominanter Korrespondenzbanken, meist außerhalb der direkten Regulierungsreichweite der EU. HansePay ist die Alternative. EU-reguliert, in Hamburg betrieben, damit deutsche Unternehmen einen unabhängigen Weg zu den Märkten haben, mit denen sie tatsächlich handeln — einschließlich der Korridore, die andere aus der Reichweite verteuert haben.',
      'vision.logo.eyebrow':'Unser Logo',
      'vision.logo.h2':'Eine Brücke, bewusst gewählt.',
      'vision.logo.p1':'Unser Logo ist eine Brücke. Keine Metapher, die wir später gewählt haben: die Form selbst. Hamburg hat mehr Brücken als Venedig und Amsterdam zusammen, und jede einzelne erfüllt dieselbe Aufgabe. Sie lässt etwas auf einer Seite etwas auf der anderen Seite erreichen. Das ist es, was HansePay in finanzieller Form tut. Es verbindet das deutsche Unternehmen mit seiner Gegenpartei, das EUR-Konto mit der Fremdwährung, den gegenwärtigen Moment mit dem Moment, in dem das Geld ankommt.',
      'vision.logo.p2':'Die Brücke in unserem Logo ist historisch in der Form, modern in der Funktion. Heute gebaut, nach europäischem Recht reguliert, entwickelt für grenzüberschreitende Zahlungsvolumina, die sich der ursprüngliche Hansekaufmann nicht hätte vorstellen können. Die Form ist von 1241. Die Infrastruktur ist von 2026.',
      'vision.name.eyebrow':'Unser Name',
      'vision.name.h2':'HansePay — hanseatisch durch Erbe.',
      'vision.name.p1':'Im Jahr 1241 unterzeichneten Hamburg und Lübeck das Gründungsabkommen der Hanse, ein Netzwerk von Kaufmannsgilden, das den Handel über die Ostsee und die Nordsee für fast vier Jahrhunderte dominierte. Auf ihrem Höhepunkt verband die Hanse rund 200 Handelsstädte in ganz Europa, von Nowgorod bis London, von Bergen bis Brügge. Sie machte Hamburg zu einer der ersten Weltmetropolen Europas. Ihre Kaufleute bewegten Waren, Geld und Kredit über Grenzen, lange bevor es einen Euro zu konvertieren gab.',
      'vision.name.p2':'HansePay ist ein bewusstes Erbe aus dieser Linie. Der Name bindet uns an eine Geschäftsweise: präzise, diskret, langfristig und leise kompetent. Der Hansekaufmann hat nicht geschrien. Er hat geliefert. Wir versuchen dasselbe.',
      'vision.home.eyebrow':'Unser Zuhause',
      'vision.home.h2':'Hamburg, Deutschlands Tor zur Welt.',
      'vision.home.p1':'Seit 750 Jahren ist Hamburg Deutschlands Hafen zur Welt. Die Elbe hört nicht an den Stadtgrenzen auf. Sie trägt Waren von und zu jedem Kontinent. Das macht Hamburg einzigartig unter deutschen Städten. Es ist lokal, aber seine Identität ist global. Es ist verwurzelt, aber seine Arbeit ist nach außen gerichtet.',
      'vision.home.p2':'Jeder deutsche Export, der per Schiff reist, und die meisten, die per Luft reisen, passieren Hamburg oder seine logistischen Nachbarn. Die Stadt ist das Tor des Landes in beide Richtungen. Sie bringt die Welt nach Deutschland, und sie trägt Deutschland in die Welt hinaus. Eingehend. Ausgehend. Die Brücke funktioniert in beide Richtungen.',
      'vision.home.p3':'HansePay sitzt bewusst in dieser Tradition. Wir haben unseren Sitz in Hamburg, weil die Geschichte der Stadt dieselbe Geschichte ist, an der unsere Kunden teilnehmen. Wo Brücken immer gestanden haben, ist dem Handel immer gefolgt.',
      'vision.infra.eyebrow':'Die Infrastruktur davor',
      'vision.infra.h2':'Warum eine moderne Alternative überfällig war.',
      'vision.infra.p1':'Das dominante grenzüberschreitende Zahlungsnetzwerk, SWIFT, wurde 1973 von einem Konsortium aus 239 Banken in 15 Ländern entworfen. Es war ein Triumph seiner Ära: ein standardisiertes Messaging-Protokoll, mit dem Banken Zahlungsanweisungen über Grenzen an einander senden konnten. Ein halbes Jahrhundert später hüpfen diese Anweisungen immer noch durch drei bis fünf Korrespondenzbanken, bevor sie beim Empfänger ankommen. Jeder Sprung fügt eine Gebühr, einen Devisenspread und eine in Tagen gemessene Verzögerung hinzu.',
      'vision.infra.p2':'Dieses Modell war 1973 Stand der Technik. Bis 2026 hatte sich die Welt verändert. E-Commerce-Plattformen rechnen in Millisekunden ab. KI-Agenten handeln autonom. Deutsche Unternehmen bezahlen Lieferanten in Märkten, die das ursprüngliche SWIFT-Konsortium nie hätte erreichen sollen. Eine moderne Alternative war kein Luxus. Sie war überfällig.',
      'vision.infra.p3':'HansePay ist diese Alternative. Aufgebaut auf regulierter digitaler Geldinfrastruktur — dem E-Money-Token-Rahmen, der durch MiCAR 2024 etabliert wurde — wickelt sie grenzüberschreitend in Minuten ab, nicht in Tagen, zu einem Bruchteil der Kosten. Die darunter liegende Technologie ist neu. Die Disziplin des Unternehmens ist jahrhundertealt.',
      'vision.timeline.1.label':'Die Hanse gegründet',
      'vision.timeline.1.desc':'Hamburg und Lübeck gründen das Handelsbündnis, das 200 Städte in ganz Europa verbindet.',
      'vision.timeline.2.label':'SWIFT entworfen',
      'vision.timeline.2.desc':'239 Banken bauen das grenzüberschreitende Messaging-Protokoll, das heute noch die meisten internationalen Zahlungen leitet.',
      'vision.timeline.3.label':'MiCAR tritt in Kraft',
      'vision.timeline.3.desc':'Die EU etabliert den rechtlichen Rahmen für reguliertes digitales Geld, einschließlich E-Money-Tokens.',
      'vision.timeline.4.label':'HansePay startet',
      'vision.timeline.4.desc':'Eine europäische, regulierte, moderne grenzüberschreitende Zahlungsplattform, entwickelt für die Unternehmen, für die SWIFT nie ausgelegt war.',
      'vision.values.eyebrow':'Wofür wir stehen',
      'vision.values.h2':'Hanseatische Werte, täglich gelebt.',
      'vision.values.sub':'Drei Prinzipien. Fest. Klar. Keine Ausnahmen.',
      'vision.val.1.title':'Kunde zuerst',
      'vision.val.1.desc':'Jede Produktentscheidung, jedes kommerzielle Gespräch, jede Zeile Code beantwortet ein Kundenergebnis. Interne Cleverness, die keinen Kunden erreicht, zählt nicht.',
      'vision.val.2.title':'Integrität',
      'vision.val.2.desc':'Integrität heißt, zu dem zu stehen, was wir sagen, und die Versprechen zu halten, die wir geben. Transparenz ist die Art, wie wir sie leben: Der Kurs, den Sie sehen, ist der Kurs, den Sie erhalten, die offengelegte Gebühr ist die berechnete Gebühr, und jede Bestätigung entspricht ihrer Abwicklung. Kein Kleingedrucktes, keine Ausnahmen für unbequeme Fälle.',
      'vision.val.3.title':'Souveränität',
      'vision.val.3.desc':'Europäische Unabhängigkeit ist keine Marketing-Zeile. Es ist eine strukturelle Designentscheidung. Wir verringern die Abhängigkeit von amerikanischer und anderer ausländischer FX-Infrastruktur und halten europäische Unternehmen mit jeder regulatorischen, technologischen und operativen Entscheidung auf europäischen Schienen.',
      'vision.members.eyebrow':'Mitgliedschaften und Partnerschaften',
      'vision.members.h2':'Wo wir auftreten.',
      'vision.members.sub':'HansePay ist Teil des deutschen und europäischen Finanz- und Fintech-Ökosystems — durch Mitgliedschaft, durch Prüfbeziehung und durch berufliches Ansehen.',
      'vision.member.1.name':'The Payments Association',
      'vision.member.1.desc':'Aktives Mitglied der europäischen Zahlungsgemeinschaft.',
      'vision.member.2.name':'IFB Innovationsstarter Hamburg',
      'vision.member.2.desc':'Förderpartner für Hamburger Fintech-Innovation.',
      'vision.member.3.name':'Finanzplatz Hamburg',
      'vision.member.3.desc':'Mitglied der Hamburger Finanzplatz-Initiative.',
      'vision.member.4.name':'FinTech Association',
      'vision.member.4.desc':'Mitglied der europäischen Fintech-Gemeinschaft.',
      'vision.member.5.name':'PwC',
      'vision.member.5.desc':'Prüfungs- und Beratungspartner.',
      'vision.member.6.name':'Amazon',
      'vision.member.6.desc':'Cloud- und Infrastrukturpartner.',
      'vision.member.7.name':'Handelskammer Hamburg',
      'vision.member.7.desc':'Mitglied der Handelskammer Hamburg.',
      'vision.gs.cta-team':'Das Team kennenlernen',
      // team
      'team.hero.h1':'Die Menschen hinter HansePay.',
      'team.origin.eyebrow':'Wie wir hierher kamen',
      'team.origin.h2':'Von Hamburg aus, in die Welt.',
      'team.origin.p1':'HansePay begann mit einer Frustration, die wir immer wieder von deutschen Unternehmern hörten. Ihre Bank berechnete ihnen 2 bis 3 Prozent über dem Interbanken-Kurs bei jeder grenzüberschreitenden Überweisung, versteckte den Kurs hinter der Gebühr und brauchte drei bis fünf Tage, um das Geld tatsächlich zu bewegen. Das Finanzsystem war gebaut, um zu funktionieren. Nur nicht für sie.',
      'team.origin.p2':'Im Jahr 2023 begann das Gründerteam, HansePay in Hamburg aufzubauen. Das Ziel: eine grenzüberschreitende Zahlungsplattform für deutsche Unternehmen, von Anfang bis Ende reguliert, entwickelt für die tatsächlichen Rhythmen des Mittelstandsbetriebs: Rechnungszyklen, Lieferantenzahlungen, Treasury-Abstimmung, Prüfungsbereitschaft. Drei Jahre später wickelt die Plattform in Sekunden in 45+ Märkten weltweit ab, einschließlich der Märkte, die die meisten Banken nicht bedienen.',
      'team.origin.p3':'HansePay ist die Plattform, die deutsche Unternehmen täglich nutzen. In Hamburg aufgebaut, für die Unternehmen, die Deutschlands Handelswirtschaft aufgebaut haben.',
      'team.origin.p4':'Die Plattform war konstant günstiger und zuverlässiger als die Bankinfrastruktur, die sie ersetzt. Niedrigere Margen, schnellere Abwicklung, weniger fehlgeschlagene Transaktionen. Die Zahlen addieren sich für Unternehmen, die jede Woche Geld über Grenzen bewegen.',
      'team.leadership.eyebrow':'Führung',
      'team.leadership.h2':'Gründergeführt.',
      'team.leadership.sub':'HansePay wird von den Gründern geleitet. Das Führungsteam trägt direkte Verantwortung für Produkt, kommerzielle Beziehungen und Betrieb und bleibt persönlich in jede wichtige Kundenbeziehung eingebunden.',
      'team.founder.1.name':'Lorian Qorraj',
      'team.founder.1.role':'Mitgründer & CEO',
      'team.founder.1.quote':'"In Hamburg aufgebaut, in Europa reguliert, entwickelt, um deutschen Unternehmen einen unabhängigen Weg zu geben. So sieht europäische Zahlungssouveränität in der Praxis aus."',
      'team.founder.2.name':'Benjamin James',
      'team.founder.2.role':'Mitgründer',
      'team.founder.2.quote':'"Niemand führt sein Unternehmen mit Technologie von 1973. Sie sollten ihre grenzüberschreitenden Zahlungen auch nicht damit abwickeln müssen."',
      'team.advisors.eyebrow':'Berater & Investoren',
      'team.advisors.h2':'Mit institutioneller Erfahrung aufgebaut.',
      'team.advisor.1.name':'Andrew Bosomworth',
      'team.advisor.1.role':'Berater',
      'team.advisor.1.bio':'Ehemaliger Leiter von PIMCO Deutschland. Drei Jahrzehnte Erfahrung in Fixed Income und Asset Management bei einem der größten Investmentmanager der Welt.',
      'team.advisor.2.name':'Innovationsstarter Fonds Hamburg GmbH',
      'team.advisor.2.role':'Investor',
      'team.advisor.2.bio':'Hamburgs öffentlicher Innovationsfonds, der Hamburger Fintech- und Technologieunternehmen unterstützt. Ansässig am Besenbinderhof 31, 20097 Hamburg, eingetragen beim Amtsgericht Hamburg (HRB).',
      'team.offices.eyebrow':'Unsere Büros',
      'team.offices.h2':'Drei Büros, eine Brücke.',
      'team.offices.sub':'HansePay operiert aus drei europäischen Städten. Jede spielt eine andere Rolle darin, wie die Plattform für unsere Kunden funktioniert.',
      'team.office.1.tag':'Kommerziell',
      'team.office.1.city':'Hamburg',
      'team.office.1.address':'Stadtdeich 2-4, 20097 Hamburg',
      'team.office.1.desc':'Wo die kommerziellen Beziehungen leben.',
      'team.office.2.tag':'Technologie',
      'team.office.2.city':'Berlin',
      'team.office.2.address':'House of FINTech, Berlin',
      'team.office.2.desc':'Wo die Plattform entwickelt wird.',
      'team.office.3.tag':'Betrieb',
      'team.office.3.city':'Riga',
      'team.office.3.address':'[Adresse folgt]',
      'team.office.3.desc':'Wo der tägliche Betrieb läuft.',
      'team.offices.closing':'Drei Adressen. Eine Plattform. In Hamburg aufgebaut, für deutsche Unternehmen, die über Grenzen hinweg handeln.',
      'team.gs.cta2':'Unsere Vision & Werte',
      // ── HTML keys for data-i18n-html (headings with <em> tags) ──
      // index.html
      'index.hero.h1.html':'Internationale<br>Zahlungen, <em>neu gedacht.</em>',
      'index.vp.h2.html':'Die niedrigsten Kosten.<br><em>Die schnellsten Überweisungen.</em>',
      'index.how.h2.html':'Vom Kurs zur <em>Gutschrift</em> in vier Schritten.',
      'index.currencies.h2.html':'Zahlungen in <em>45+ Märkte.</em>',
      'index.solutions.h2.html':'Lösungen für <em>jede Branche.</em>',
      'index.about.h2.html':'Gegründet in Hamburg.<br><em>Vertrauen in ganz Europa.</em>',
      'index.insights.h2.html':'FX-Wissen, das<br><em>Ihr Unternehmen voranbringt.</em>',
      'index.faq.h2.html':'Häufige <em>Fragen.</em>',
      'index.cta.h2.html':'Bereit für ein echtes <em>FX-Team?</em>',
      // solutions pages
      'sol-ecom.hero.h1.html':'FX für den<br><em>internationalen Handel.</em>',
      'sol-ecom.comp.h2.html':'HansePay vs. Ihre Bank<br><em>vs. Fintech-App.</em>',
      'sol-ecom.cov.h2.html':'45+ Märkte, <em>eine Plattform.</em>',
      'sol-ecom.calc.h2.html':'Ihre jährliche Ersparnis — <em>in 30 Sekunden.</em>',
      // platform
      'platform.h1.html':'Eine Plattform<br><em>für globale Zahlungen.</em>',
      'platform.transfers.h2.html':'Überall senden,<br><em>in Minuten.</em>',
      'platform.alerts.h2.html':'Keine Kurschance<br><em>mehr verpassen.</em>',
      // converter hero
      'conv.hero.h1.html':'Live Interbanken-Kurse <em>in 30+ Währungen weltweit.</em>',
      // calculator categories + banks
      'calc.cat.major':'Hauptwährungen','calc.cat.minor':'Nebenwährungen','calc.cat.exotic':'Exotische',
      'calc.bank.major_de':'Große deutsche Bank (Deutsche Bank, Commerzbank)',
      'calc.bank.sparkasse':'Sparkasse / Volksbank',
      'calc.bank.international':'Internationale Bank (HSBC, BNP Paribas)',
      'calc.bank.broker':'FX-Broker / Spezialist',
      // platform-technology page
      'platform-tech.h1.html':'Die Infrastruktur hinter <br><em>jeder Überweisung.</em>',
      'platform-tech.s1.eyebrow':'Was es ist',
      'platform-tech.s1.h2.html':'Der Euro auf <em>anderen Schienen.</em>',
      'platform-tech.s2.eyebrow':'Wie es funktioniert',
      'platform-tech.s2.h2.html':'Sechs Stationen statt <em>einer.</em>',
      'platform-tech.s2.p':'Jede Bank in der Korrespondenzkette erhebt eine Gebühr, einen Spread und kostet einen Tag Verzögerung. Die EMT-Abwicklung kollabiert die gesamte Kette in einen einzigen atomaren Schritt.',
      'platform-tech.s2.track-bank-label':'Heute, mit einer Bank',
      'platform-tech.s2.node-sender':'Absenderbank',
      'platform-tech.s2.node-sender-sub':'Überweisung initiiert',
      'platform-tech.s2.node-corr1':'Korrespondent 1',
      'platform-tech.s2.node-corr2':'Korrespondent 2',
      'platform-tech.s2.node-swift':'SWIFT-Netzwerk',
      'platform-tech.s2.node-swift-sub':'Routing-Schicht',
      'platform-tech.s2.node-corr3':'Korrespondent 3',
      'platform-tech.s2.node-recipient':'Empfängerbank',
      'platform-tech.s2.node-recipient-sub-bank':'Betrag gutgeschrieben — irgendwann',
      'platform-tech.s2.foot-bank':'3–5 Werktage · 60–180 € Gebühren · ~1,2 % Spread',
      'platform-tech.s2.track-hp-label':'Mit HansePay',
      'platform-tech.s2.node-sender-sub-hp':'Kurs sofort gesperrt',
      'platform-tech.s2.node-emt':'EMT-Abwicklung',
      'platform-tech.s2.node-emt-sub':'Atomare Konvertierung',
      'platform-tech.s2.node-recipient-sub-hp':'In gleicher Sitzung gutgeschrieben',
      'platform-tech.s2.foot-hp':'Minuten · 0,15 %–0,75 % all-in · Kurs zum Zeitpunkt des Angebots gesperrt',
      'platform-tech.s3.eyebrow':'Vertrautes Terrain',
      'platform-tech.s3.h2.html':'Sie nutzen E-Geld <em>ohne es zu wissen.</em>',
      'platform-tech.s3.p':'Jedes PayPal-Guthaben, das Sie halten, ist E-Geld — reguliert unter demselben EU-Rahmen wie ein HansePay-EMT, verwahrt unter denselben Verwahrungsregeln. HansePay operiert in derselben Rechtskategorie. Der Unterschied liegt in dem, was wir darauf aufgebaut haben: grenzüberschreitende Echtzeit-Abwicklung ab 0,15 %.',
      'platform-tech.s3.tagline':'Dieselbe Regulierungskategorie wie PayPal. Andere Konditionen.',
      'platform-tech.s3.spectrum-label':'Wo E-Geld sich einordnet',
      'platform-tech.s4.eyebrow':'Der Kostenstapel',
      'platform-tech.s4.h2.html':'1,2 % versus 0,15–0,75 %. So verschwindet <em>der Unterschied.</em>',
      'platform-tech.s4.p':'Jede Gebühr im grenzüberschreitenden Bankgeschäft ist eine Folge von Infrastruktur, die um die eigene Latenz herum gebaut wurde. Entfernen Sie die Latenz, und die meisten dieser Schichten verschwinden.',
      'platform-tech.s4.callout':'HansePay ist strukturell typischerweise 8× günstiger',
      'platform-tech.s4.chart-note':'Indikative Aufschlüsselung für eine kleine bis mittlere grenzüberschreitende Überweisung. Tatsächliche Bankkosten variieren je nach Korridor, Volumen und Geschäftsbeziehung.',
      'platform-tech.s4.col-bank':'Banküberweisung',
      'platform-tech.s4.col-hp':'HansePay',
      'platform-tech.s4.legend-bank-title':'Aufschlüsselung Banküberweisung',
      'platform-tech.s4.legend-fx-spread':'FX-Spread',
      'platform-tech.s4.legend-corr-fees':'Korrespondenzgebühren',
      'platform-tech.s4.legend-settlement-risk':'Abwicklungsrisiko',
      'platform-tech.s4.legend-swift-fees':'SWIFT-Gebühren',
      'platform-tech.s4.legend-lift-fee':'Lift-Gebühr',
      'platform-tech.s4.legend-hp-title':'Aufschlüsselung HansePay',
      'platform-tech.s4.legend-network-fee':'Netzwerkgebühr',
      'platform-tech.s4.chart-note2':'Diagramm nicht maßstabsgetreu. Im wahren Maßstab wäre der Bankbalken 8× höher.',
      'platform-tech.s5.eyebrow':'Gesperrte Kurse',
      'platform-tech.s5.h2.html':'Der Kurs, den Sie sehen, ist <em>der Kurs, den Sie zahlen.</em>',
      'platform-tech.s5.p':'Wenn Sie eine Überweisung bei HansePay bestätigen, wird der Kurs in genau diesem Moment — atomar — gesperrt. Der Betrag, der Ihr Konto verlässt, ist der Betrag, der bei der Empfängerbank ankommt. Kein Ausführungsspalt. Kein Slippage.',
      'platform-tech.s5.card-bank-label':'Traditionelle Bank',
      'platform-tech.s5.rate-quoted':'Kurs angeboten',
      'platform-tech.s5.delay-bank':'3 Tage später',
      'platform-tech.s5.rate-executed':'Kurs ausgeführt',
      'platform-tech.s5.badge-bank':'−7 Pips Slippage',
      'platform-tech.s5.card-hp-label':'HansePay',
      'platform-tech.s5.delay-hp':'Sofort',
      'platform-tech.s5.badge-hp':'✓ Atomar gesperrt',
      'platform-tech.s5.note-bank.html':'Bei einer Überweisung von 100.000 € entsprechen 7 Pips <strong>70 € verloren</strong> durch den Ausführungsspalt.',
      'platform-tech.s5.note-hp.html':'Gleicher Kurs bei Anfrage, Ausführung und Abwicklung. <strong>Null Slippage by Design.</strong>',
      'platform-tech.s6.eyebrow':'Warum es wichtig ist',
      'platform-tech.s6.h2.html':'Was sich ändert, wenn Abwicklung und <em>Zahlung eins werden.</em>',
      'platform-tech.s6.t1.title':'Abwicklung in Minuten',
      'platform-tech.s6.t1.body':'Ihr Lieferant wird noch am selben Tag bezahlt. Die Buchungsbestätigung landet in Ihrem Buchhaltungssystem, bevor Ihr Kreditorenteam den Kaffee ausgetrunken hat.',
      'platform-tech.s6.t2.title':'Tagesgleiche Abstimmung',
      'platform-tech.s6.t2.body':'Finale Abwicklung in Minuten bedeutet, dass die Bestätigung noch am selben Tag in Ihrem Buchhaltungssystem erscheint — nicht in derselben Woche. Der Aufwand in der Kreditorenbuchhaltung verdichtet sich von Tagen auf Stunden.',
      'platform-tech.s6.t3.title':'FX vor Ausführung gesperrt',
      'platform-tech.s6.t3.body':'Deterministische Preisgestaltung. Kein Slippage, keine Überraschung zum Abwicklungsdatum, kein Bedarf, Puffer für Bankausführungsverzögerungen einzuplanen.',
      'platform-tech.s6.t4.title':'Strukturell niedrigere Kosten',
      'platform-tech.s6.t4.body':'Ohne Korrespondenzbanken, SWIFT-Gebühren oder Abwicklungsrisikoaufschläge kollabiert der Kostenstapel. Die Einsparungen stecken in der Architektur.',
      'platform-tech.s7.eyebrow':'Regulatorischer Rahmen',
      'platform-tech.s7.h2.html':'Gebaut auf dem strengsten Rahmen für digitales Geld <em>weltweit.</em>',
      'platform-tech.s7.p1':'Jeder Euro, den Sie über HansePay senden, liegt innerhalb dieses Rahmens. Kundengelder sind segregiert, das lizenzierte Unternehmen ist MiCAR-autorisiert, unser deutsches Geschäft wird unter Aufsicht der BaFin geführt.',
      'platform-tech.s7.p2':'Sie berühren nie einen Token. Sie sehen nie eine Wallet. Die Infrastruktur tut, was Infrastruktur tun sollte: Sie verschwindet.',
      'platform-tech.s7.licences-link':'Unsere Lizenzen lesen',
      'platform-tech.s7.pyr1.text':'Kunde',
      'platform-tech.s7.pyr1.sub':'Fiat ein · Fiat aus',
      'platform-tech.s7.pyr2.sub':'Deutschland · BaFin-Aufsicht',
      'platform-tech.s7.pyr3.sub':'MiCAR-autorisiert · EU-Recht',
      'platform-tech.s7.pyr4.text':'EU-Regulatoren',
      'platform-tech.s7.pyr4.sub':'MiCAR-Rahmen · EBA · ECB',
      'platform-tech.s8.eyebrow':'FAQ',
      'platform-tech.s8.h2.html':'Fragen, die CFOs <em>zuerst stellen.</em>',
      'platform-tech.s8.q1':'Sind EMTs Kryptowährungen?',
      'platform-tech.s8.a1':'Nein. Krypto-Assets wie Bitcoin haben einen Marktpreis, der schwankt. EMTs haben einen festen Wert von einem Euro pro Token, 1:1 durch Reserven bei regulierten Banken gedeckt. Das Asset verhält sich wie der Euro, weil es der Euro ist — nur in digitaler Form, reguliert unter MiCAR.',
      'platform-tech.s8.q2':'Wie unterscheidet sich das von PayPal?',
      'platform-tech.s8.a2':'PayPal ist ebenfalls ein E-Geld-Institut nach EU-Recht — derselbe rechtliche Rahmen. Der Unterschied liegt im Umfang und den Konditionen. PayPal optimiert für Verbraucherzahlungen bei rund 3 % pro Transaktion. HansePay optimiert für grenzüberschreitende Geschäftszahlungen ab 0,15 % bei wichtigen Währungspaaren.',
      'platform-tech.s8.q3':'Was passiert mit meinem Geld, wenn HansePay ausfällt?',
      'platform-tech.s8.a3':'Kundengelder liegen auf segregierten Konten bei Tier-1-Europäischen Banken, vom Betriebskapital von HansePay getrennt. Im Insolvenzfall gehören diese Mittel nicht zur Insolvenzmasse. Sie sind rechtlich geschützt nach MiCAR Artikel 75 und werden den Kunden zum Nennwert zurückgegeben.',
      'platform-tech.s8.q4':'Wie klassifiziert mein Wirtschaftsprüfer EMT-Bestände?',
      'platform-tech.s8.a4':'Als Zahlungsmitteläquivalent — dieselbe Bilanzposition wie Ihr Betriebskonto. EMTs werden nach EU-Recht als elektronisches Geld behandelt, nicht als Krypto-Assets. Keine Sondersteuerbehandlung, kein Tracking von Kapitalgewinnen, keine Marktbewertung bei jeder Transaktion.',
      'platform-tech.s8.q5':'Sende ich Krypto, wenn ich HansePay nutze?',
      'platform-tech.s8.a5':'Nein. Sie senden Euro und der Empfänger erhält Euro. Die Abwicklungsschicht nutzt regulierte digitale Infrastruktur für atomare Übertragungen. Sie sehen nie einen Token, berühren nie eine Wallet, haben nie mit etwas zu tun, das Krypto ähnelt.',
      'platform-tech.s8.q6':'Was, wenn das Abwicklungsnetzwerk Probleme hat?',
      'platform-tech.s8.a6':'Die Abwicklungsinfrastruktur ist Multi-Rail. Wenn ein primäres Netzwerk überlastet ist, werden Transaktionen automatisch über redundante Schienen geleitet. Die Nutzererfahrung bleibt unverändert. Im seltenen Fallback-Fall kann die Abwicklung geringfügig länger dauern, aber die Kurssperrung und die Kostenstruktur bleiben erhalten.',
      // common section tails HTML
      'gs.h2.html':'Eröffnen Sie Ihr Konto.',
      // ── auto-added DE translations (solutions, platform-tech, converter) ──
      'conv.chart-disclaimer':'Mid-Market-Kurse dienen als Referenz. Die tatsächlichen Überweisungskurse richten sich nach dem zum Handelszeitpunkt von HansePay angebotenen Preis.',
      'conv.field.gets':'Empfänger erhält',
      'conv.field.send':'Sie senden',
      'conv.info.arrives-label':'Ankunft',
      'conv.info.arrives-val':'⚡ Innerhalb von 2 Stunden',
      'conv.info.fee-label':'Gebühr',
      'conv.live-badge':'Live',
      'conv.rate-label':'Devisenkurs',
      'conv.trend-label':'Kursverlauf',
      'gs.eyebrow':'Jetzt starten',
      'platform-tech.s1.equation-note':'Immer 1:1. Gesetzlich fixiert nach MiCAR. Kein Marktpreis.',
      'platform-tech.s3.sp1.en':'Bargeld',
      'platform-tech.s3.sp1.examples':'Münzen &amp; Scheine',
      'platform-tech.s3.sp1.label':'Traditionell',
      'platform-tech.s3.sp1.name':'Bargeld',
      'platform-tech.s3.sp2.en':'Buchgeld',
      'platform-tech.s3.sp2.examples':'Bankkonto',
      'platform-tech.s3.sp2.label':'Traditionell',
      'platform-tech.s3.sp2.name':'Giralgeld',
      'platform-tech.s3.sp3.en':'Elektronisches Geld',
      'platform-tech.s3.sp3.examples':'PayPal · HansePay',
      'platform-tech.s3.sp3.label':'E-Geld',
      'platform-tech.s3.sp3.name':'E-Geld',
      'platform-tech.s3.spectrum-note':'E-Geld hat einen festen Wert (1:1 zum EUR), wird von einem lizenzierten Institut ausgegeben und ist nach EU-Recht reguliert.',
      'platform-tech.s7.pyr2.text':'HansePay',
      'sol-corp.feat.1.desc':'Konvertieren Sie zu wettbewerbsfähigen Interbanken-Kursen mit einer fairen, transparenten Gebühr, die vor dem Handel offengelegt wird. Keine versteckten Kosten, keine Spread-Tricks bei institutionellem Volumen.',
      'sol-corp.feat.1.title':'Devisenkurse zu Großhandelskonditionen',
      'sol-corp.feat.2.desc':'Der Kurs im Angebot ist der Kurs, der ausgeführt wird. Kurzfristige Fixierung im Moment des Handels wird unterstützt. Kein Schlupf zwischen Angebot und Abwicklung.',
      'sol-corp.feat.2.title':'Kurs bei Ausführung fixiert',
      'sol-corp.hero.vis.label':'Persönlicher Experte als Ansprechpartner',
      'sol-corp.hero.vis.sub':'&gt;2 Mio. € Jahresvolumen',
      'sol-corp.pain.1.desc':'Banken berechnen bei Hauptwährungspaaren typischerweise 1,5 % bis 3 % über dem Mid-Market und schärfen erst nach, wenn Sie nachhaken. Über institutionelles Volumen ist das eine sechsstellige Kostenposition, die in keinem Kontoauszug sichtbar ist.',
      'sol-corp.pain.1.title':'Breite Spreads bei jedem Handel',
      'sol-corp.pain.2.desc':'Handel werden per Telefon vereinbart und Stunden später per E-Mail bestätigt. Bis das Ticket vorliegt, hat sich der Kurs bewegt, und der Prüfpfad liegt in Ihrem Postfach.',
      'sol-corp.pain.2.title':'Manuelle Bestätigung per Telefon',
      'sol-corp.pain.3.desc':'Banken quotieren einen Kurs und wickeln dann zu einem anderen ab. Der Spread steckt verborgen im Kurs. Es gibt kein Angebot, das Sie für die Dauer eines Bestätigungsanrufs halten können.',
      'sol-corp.pain.3.title':'Kein transparenter Ausführungsmoment',
      'sol-corp.pain.4.desc':'Risikodaten liegen in verschiedenen Tabellen, die sich nicht abgleichen lassen. Eine saubere Übersicht für den Vorstand zu erstellen, kostet eine Woche manueller Arbeit.',
      'sol-corp.pain.4.title':'Begrenzter Einblick in das Risiko',
      'sol-corp.pain.5.desc':'T+2 ist die Norm, T+1 ein Gefallen. Lieferanten mahnen Sie, Ihr Kreditorenteam mahnt die Bank, und das Betriebskapital steckt unterwegs statt in Ihrem Unternehmen.',
      'sol-corp.pain.5.title':'Langsame internationale Abwicklung',
      'sol-corp.pain.6.desc':'Ihr Kundenbetreuer ruft zweimal im Jahr an, meist um etwas zu verkaufen. Zugang zum Senior-Handel bleibt den größten Kunden der Bank vorbehalten.',
      'sol-corp.pain.6.title':'Kundenbetreuer, den Sie kaum erreichen',
      'sol-corp.pain.eyebrow':'Die versteckten Kosten',
      'sol-corp.pain.h2.html':'Wo die meisten FX-Setups im<br>Mittelstand zu kurz greifen.',
      'sol-corp.pain.sub':'Mittelständische und große Unternehmen zahlen für eine Raffinesse, die sie selten erhalten. Sechs Dinge, die uns Finanzteams im Mittelstand über ihr bestehendes FX-Setup immer wieder berichten.',
      'sol-corp.trust.1':'Von der BaFin zugelassen',
      'sol-corp.trust.2':'45+ Märkte weltweit',
      'sol-corp.trust.3':'Kurs bei Ausführung fixiert',
      'sol-corp.trust.4':'Persönlicher Experte als Ansprechpartner',
      'sol-ecom.calc.eyebrow':'Was könnten Sie sparen',
      'sol-ecom.calc.lbl.vol':'Jährliches FX-Volumen',
      'sol-ecom.calc.sub':'Geben Sie Ihr jährliches FX-Volumen und Ihren aktuellen Anbieter an. Wir berechnen die geschätzte jährliche Ersparnis mit HansePay.',
      'sol-ecom.comp.eyebrow':'Der Vergleich',
      'sol-ecom.comp.footnote':'* Beispielhafte Margenspanne für Hauptwährungspaare bei Volumina über 1 Mio. EUR. Der genaue Kurs wird vor jedem Handel offengelegt.',
      'sol-ecom.comp.sub':'Der ehrliche, zeilenweise Vergleich, den die meisten Anbieter nicht auf ihre Website stellen.',
      'sol-ecom.comp.th.bank':'Hausbank',
      'sol-ecom.comp.th.feature':'Funktion',
      'sol-ecom.comp.th.fintech':'Fintech-Apps',
      'sol-ecom.comp.th.hp':'HansePay',
      'sol-ecom.cov.more':'+11 weitere',
      'sol-ecom.feat.1.desc':'Konvertieren Sie zu wettbewerbsfähigen Interbanken-Kursen mit einer fairen, transparenten Gebühr, die vor dem Handel offengelegt wird. Keine versteckten Kosten, keine Spread-Tricks bei jeder Bestellung.',
      'sol-ecom.feat.1.title':'Devisenkurse zu Großhandelskonditionen',
      'sol-ecom.feat.2.desc':'Bezahlen Sie Lieferanten in BRL, MXN, INR, VND, THB, IDR, ZAR, TRY, AED und mehr. Erreichen Sie die Märkte, die Ihre Bank als zu kompliziert behandelt.',
      'sol-ecom.feat.2.title':'45+ Märkte weltweit',
      'sol-ecom.feat.3.desc':'Der Kurs im Angebot ist der Kurs, der ausgeführt wird. Keine Abweichung zwischen Bestätigung und Abwicklung. Der Empfänger erhält genau den vereinbarten Betrag.',
      'sol-ecom.feat.3.title':'Kurs bei Ausführung fixiert',
      'sol-ecom.feat.4.desc':'Bezahlen Sie mehrere Lieferanten in verschiedenen Währungen in einem einzigen Sammel-Upload. Abgleichdateien lassen sich in gängige Buchhaltungsabläufe integrieren.',
      'sol-ecom.feat.4.title':'Sammelzahlungen per Tabellen-Upload',
      'sol-ecom.feat.5.desc':'Zahlungen laufen über lokale Express-Netzwerke wie SEPA und ACH statt über das SWIFT-Korrespondenzbankwesen. Geringere Kosten, schnellere Abwicklung, keine versteckten Zwischengebühren.',
      'sol-ecom.feat.5.title':'Lokale Zahlungswege statt SWIFT',
      'sol-ecom.feat.6.desc':'API-Zugang für institutionelle Kunden. Individuelle Integrationen auf Anfrage. Standardisierte Exportformate für Buchhaltungsabläufe.',
      'sol-ecom.feat.6.title':'API-Zugang',
      'sol-ecom.hero.cta2':'Mit einem Händler sprechen',
      'sol-ecom.pain.1.desc':'1,5 % bis 2,5 % Aufschlag bei jeder USD-, CNY- oder BRL-Überweisung an Ihren Lieferanten. Über Hunderte Bestellungen pro Jahr ist das Ihre eigentliche Bankgebühr.',
      'sol-ecom.pain.1.title':'Spreads bei jeder Lieferantenzahlung',
      'sol-ecom.pain.2.desc':'Bis zu 4 % Umrechnungsgebühr bei jedem grenzüberschreitenden Verkauf. Der Käufer zahlt, doch die Marge verschwindet, bevor sie bei Ihnen ankommt.',
      'sol-ecom.pain.2.title':'FX-Schnitte von PayPal &amp; Stripe',
      'sol-ecom.pain.3.desc':'Beschaffung aus Vietnam oder Mexiko? Verkauf nach Brasilien? Die meisten deutschen Banken verweigern Zahlungen in exotischen Währungen oder berechnen Spreads, die Ihre Marge auslöschen.',
      'sol-ecom.pain.3.title':'Märkte, die Ihre Bank nicht erreicht',
      'sol-ecom.pain.4.desc':'Bestellen Sie das Q4-Inventar im Mai und sehen Sie zu, wie sich der Kurs bis Oktober um 5 % bewegt. Ohne Kursfixierung bei der Ausführung ist Ihre Marge in der Hochsaison dem Spotmarkt ausgeliefert.',
      'sol-ecom.pain.4.title':'Keine Möglichkeit, den Kurs beim Angebot zu fixieren',
      'sol-ecom.pain.5.desc':'Lieferanten halten Ihre Ware zurück, bis die Zahlung eintrifft. Banküberweisungen dauern 2 bis 3 Tage. Bis die Bestellung versandt wird, haben Sie das Startfenster bereits verpasst.',
      'sol-ecom.pain.5.title':'Überweisungsverzögerungen in der Hochsaison',
      'sol-ecom.pain.6.desc':'Lieferantenrechnungen in fünf Währungen, Zahlungen über mehrere Banken verteilt. Ihr Buchhalter berechnet jeden Monat zusätzliche Stunden.',
      'sol-ecom.pain.6.title':'Abgleich-Chaos',
      'sol-ecom.pain.eyebrow':'Die versteckten Kosten',
      'sol-ecom.pain.h2.html':'Wo Online-Händler<br>Marge an Devisen verlieren.',
      'sol-ecom.pain.sub':'Online-Handel lebt von knappen Margen. Grenzüberschreitende Devisen sind eine der größten unsichtbaren Kostenpositionen, und eine der am leichtesten zu behebenden.',
      'sol-ecom.persona.1.desc':'Bootstrapped oder im Wachstum, Import aus Asien, Verkauf in EU und USA. Brauchen Großhandels-FX auf USD und CNY sowie Zugang zu alternativen Beschaffungsmärkten wie Vietnam und Mexiko.',
      'sol-ecom.persona.1.name':'DTC-Marken',
      'sol-ecom.persona.2.desc':'Betreiber mehrerer Marktplätze, die Lieferanten weltweit bezahlen. Brauchen Großhandels-FX, Sammelläufe und zuverlässige Abwicklung auf jedem Korridor.',
      'sol-ecom.persona.2.name':'Marktplatz-Verkäufer',
      'sol-ecom.persona.3.desc':'Eigener Webshop plus Marktplätze, strukturierte Kreditorenabläufe. Brauchen Sammelzahlungen, API-Zugang und fixierte Kurse bei Ausführung.',
      'sol-ecom.persona.3.name':'Multi-Channel-Händler',
      'sol-ecom.persona.eyebrow':'Entwickelt für',
      'sol-ecom.persona.h2.html':'Gemacht für die Arbeitsweise<br>von Online-Händlern.',
      'sol-ecom.sol.eyebrow':'Was wir tun',
      'sol-ecom.sol.h2.html':'Devisen und Zahlungen,<br>gebaut für den Online-Handel.',
      'sol-ecom.trust.1':'45+ Märkte weltweit',
      'sol-ecom.trust.2':'Sammelzahlungen an Lieferanten per Tabelle',
      'sol-ecom.trust.3':'API-Zugang',
      'sol-ecom.trust.4':'Von der BaFin zugelassen',
      'sol-log.calc.eyebrow':'Was könnten Sie sparen',
      'sol-log.calc.h2.html':'Berechnen Sie Ihre jährliche Ersparnis, <em>in 30 Sekunden.</em>',
      'sol-log.calc.lbl.cat':'Währungskategorie',
      'sol-log.calc.lbl.vol':'Jährliches FX-Volumen',
      'sol-log.calc.sub':'Geben Sie Ihr jährliches FX-Volumen und Ihren aktuellen Anbieter an. Wir berechnen die geschätzte jährliche Ersparnis mit HansePay.',
      'sol-log.comp.eyebrow':'Der Vergleich',
      'sol-log.comp.footnote':'* Beispielhafte Margenspanne für Hauptwährungspaare bei Volumina über 1 Mio. EUR. Der genaue Kurs wird vor jedem Handel offengelegt.',
      'sol-log.comp.h2.html':'HansePay vs. Ihre Bank<br><em>vs. eine Fintech-App.</em>',
      'sol-log.comp.sub':'Der ehrliche, zeilenweise Vergleich, den die meisten Anbieter nicht auf ihre Website stellen.',
      'sol-log.comp.th.bank':'Hausbank',
      'sol-log.comp.th.feature':'Funktion',
      'sol-log.comp.th.fintech':'Fintech-Apps',
      'sol-log.comp.th.hp':'HansePay',
      'sol-log.feat.1.desc':'Konvertieren Sie zu wettbewerbsfähigen Interbanken-Kursen mit einer fairen, transparenten Gebühr, die vor dem Handel offengelegt wird. Keine versteckten Kosten, keine Spread-Tricks bei Carrier-Zahlungen.',
      'sol-log.feat.1.title':'Devisenkurse zu Großhandelskonditionen',
      'sol-log.feat.2.desc':'Bezahlen Sie Gegenparteien in ihrer Landeswährung in 45+ Märkten weltweit, einschließlich Schwellenmärkten, in denen Standardbanken häufig blockieren oder Aufschläge verlangen.',
      'sol-log.feat.2.title':'Lokale Zahlungen weltweit',
      'sol-log.feat.3.desc':'Zahlungen werden in den meisten Korridoren am selben Tag über lokale Netzwerke abgewickelt. Wenn die Fracht nicht warten kann, wartet auch Ihr Treasury nicht.',
      'sol-log.feat.3.title':'Zahlungen am selben Tag an Häfen, Zoll und Agenten',
      'sol-log.feat.4.desc':'Bezahlen Sie mehrere Gegenparteien in verschiedenen Währungen in einem einzigen Sammel-Upload. Abgleichdateien lassen sich in gängige Buchhaltungsabläufe integrieren.',
      'sol-log.feat.4.title':'Sammelzahlungen per Tabellen-Upload',
      'sol-log.feat.5.desc':'Zahlungen laufen über lokale Express-Netzwerke wie SEPA und ACH statt über das SWIFT-Korrespondenzbankwesen. Geringere Kosten, schnellere Abwicklung, keine versteckten Zwischengebühren.',
      'sol-log.feat.5.title':'Lokale Zahlungswege statt SWIFT',
      'sol-log.feat.6.desc':'API-Zugang für institutionelle Kunden. Individuelle Integrationen auf Anfrage. Standardisierte Exportformate für Buchhaltungsabläufe.',
      'sol-log.feat.6.title':'API-Zugang',
      'sol-log.hero.h1.html':'Devisen, gebaut für<br><em>Logistik und Spedition.</em>',
      'sol-log.hero.overlay.sub':'45+ Märkte',
      'sol-log.hero.overlay.title':'Abwicklung am selben Tag',
      'sol-log.pain.2.desc':'Kunden rechnen in EUR ab, Carrier werden in USD bezahlt, Hafengebühren in Landeswährung. Die Abweichung frisst Kurse, die Sie bereits angeboten haben.',
      'sol-log.pain.2.title':'Währungsabweichung bei jeder Sendung',
      'sol-log.pain.3.desc':'Der Zollagent braucht die Zahlung, um die Sendung freizugeben. Der Carrier bucht nicht ohne Vorauszahlung. Banküberweisungen dauern 24 bis 48 Stunden. Die Fracht wartet, Standgeld läuft.',
      'sol-log.pain.3.title':'Langsame Zahlungen verzögern Fracht',
      'sol-log.pain.4.desc':'Jede Bewegung berührt mehrere Gegenparteien: Makler, Hafenagent, Carrier, Nahverkehr, letzte Meile. Jede Umrechnung frisst Spread, jede Überweisung verursacht Gebühren.',
      'sol-log.pain.4.title':'Hunderte Kleinzahlungen pro Sendung',
      'sol-log.pain.5.desc':'Hafengebühren in MXN, Zoll in BRL, Agenturprovisionen in INR. Die meisten Banken verweigern entweder oder berechnen empfindliche Spreads.',
      'sol-log.pain.5.title':'Fremdwährungsrisiko an jedem Knotenpunkt',
      'sol-log.pain.6.desc':'Carrier verlangen Vorauszahlung. Kunden zahlen Netto 30 bis 60. Währungsbewegungen zwischen Abfluss und Zufluss fressen die Lücke.',
      'sol-log.pain.6.title':'Druck auf das Betriebskapital',
      'sol-log.pain.eyebrow':'Die versteckten Kosten',
      'sol-log.pain.h2.html':'Wo Logistikdienstleister<br>Marge an Devisen verlieren.',
      'sol-log.pain.sub':'Logistik lebt von knappen Margen und noch knapperen Zeitplänen. Grenzüberschreitende Devisen treffen beides, bei jeder Sendung.',
      'sol-log.persona.1.desc':'Internationale Sendungen über mehrere Verkehrsträger, weltweite Agentennetze, grenzüberschreitende Rechnungsstellung und Carrier-Abwicklung zu fixierten Kursen.',
      'sol-log.persona.1.name':'Spediteure und 3PL/4PL',
      'sol-log.persona.2.desc':'Zeitkritische Zahlungen in Landeswährung an Häfen und Zoll. Ausführung am selben Tag und Reichweite in Schwellenmärkte, wo Banken Sie ausbremsen.',
      'sol-log.persona.2.name':'Zollmakler und Abfertigungsagenten',
      'sol-log.persona.3.desc':'Anlagenfinanzierung in USD, Betrieb in EUR, Gebühren in Landeswährung. Großhandelskonditionen, fixiert im Moment der Ausführung.',
      'sol-log.persona.3.name':'Hafenbetreiber und Terminaldienste',
      'sol-log.persona.4.desc':'Reedereien mit Charterverträgen, Bunker-Exposure, Hafenanläufen und globaler Crew-Lohnabrechnung. Ein in Hamburg verwurzelter Handelsdesk, der den maritimen Kalender kennt.',
      'sol-log.persona.4.name':'Reedereien und Schifffahrtsbetreiber',
      'sol-log.persona.eyebrow':'Entwickelt für',
      'sol-log.persona.h2.html':'Gemacht für die Arbeitsweise<br>von Logistikdienstleistern.',
      'sol-log.persona.sub':'Vier Muster, die uns in Logistik und Spedition am häufigsten begegnen.',
      'sol-log.sol.eyebrow':'Was wir tun',
      'sol-log.sol.h2.html':'Devisen, gebaut für die Praxis<br>von Logistikdienstleistern.',
      'sol-log.sol.sub':'Sechs Werkzeuge, eine Plattform, gebaut rund um den Frachtzeitplan.',
      'sol-log.trust.1':'Ausführung am selben Tag',
      'sol-log.trust.2':'45+ Märkte weltweit',
      'sol-log.trust.3':'Sammelzahlungen per Tabellen-Upload',
      'sol-log.trust.4':'Von der BaFin zugelassen',
      'sol-mfg.comp.eyebrow':'Der Vergleich',
      'sol-mfg.comp.h2.html':'HansePay vs. Ihre Bank<br><em>vs. eine Fintech-App.</em>',
      'sol-mfg.comp.row1.bank':'Undurchsichtig / verborgen',
      'sol-mfg.comp.row1.feat':'FX-Marge',
      'sol-mfg.comp.row1.fintech':'Standard-Retail',
      'sol-mfg.comp.row1.hp':'Transparent fixiert, vor dem Handel offengelegt*',
      'sol-mfg.comp.row2.bank.main':'1 bis 3 Werktage',
      'sol-mfg.comp.row2.bank.sub':'Langsames SWIFT-Routing',
      'sol-mfg.comp.row2.feat':'Abwicklung',
      'sol-mfg.comp.row2.fintech.main':'Selber Tag',
      'sol-mfg.comp.row2.fintech.sub':'Bei großen Volumina gedeckelt',
      'sol-mfg.comp.row2.hp.main':'Minuten bis Stunden',
      'sol-mfg.comp.row2.hp.sub':'Lokale Wege, keine SWIFT-Abhängigkeit',
      'sol-mfg.comp.row3.bank.main':'Stark eingeschränkt',
      'sol-mfg.comp.row3.bank.sub':'Manuelle Gebühren und Verzögerungen',
      'sol-mfg.comp.row3.feat':'Abdeckung',
      'sol-mfg.comp.row3.fintech.main':'Eingeschränkt',
      'sol-mfg.comp.row3.fintech.sub':'Lokale Volumengrenzen',
      'sol-mfg.comp.row3.hp.main':'45+ Märkte weltweit',
      'sol-mfg.comp.row3.hp.sub':'Einschließlich Märkten, die Ihre Bank meidet',
      'sol-mfg.comp.sub':'Der ehrliche, zeilenweise Vergleich, den die meisten Anbieter nicht auf ihre Website stellen.',
      'sol-mfg.comp.th.bank':'Hausbank',
      'sol-mfg.comp.th.feature':'Funktion',
      'sol-mfg.comp.th.fintech':'Fintech-Apps',
      'sol-mfg.comp.th.hp':'HansePay',
      'sol-mfg.feat.1.desc':'Konvertieren Sie zu wettbewerbsfähigen Interbanken-Kursen mit einer fairen, transparenten Gebühr, die vor dem Handel offengelegt wird. Keine versteckten Kosten, keine Spread-Tricks bei industriellem Volumen.',
      'sol-mfg.feat.1.title':'Devisenkurse zu Großhandelskonditionen',
      'sol-mfg.feat.2.desc':'Der Kurs im Angebot ist der Kurs, der ausgeführt wird. Kurzfristige Fixierung im Moment des Handels wird unterstützt. Keine Abweichung zwischen Bestätigung und Abwicklung.',
      'sol-mfg.feat.2.title':'Kurs bei Ausführung fixiert',
      'sol-mfg.feat.3.desc':'Bezahlen Sie Gegenparteien in ihrer Landeswährung in 45+ Märkten weltweit, einschließlich Schwellenmärkten, in denen Standardbanken häufig blockieren oder Aufschläge verlangen.',
      'sol-mfg.feat.3.title':'Lokale Zahlungen weltweit',
      'sol-mfg.feat.4.desc':'Zahlungen laufen über lokale Express-Netzwerke wie SEPA und ACH statt über das SWIFT-Korrespondenzbankwesen. Geringere Kosten, schnellere Abwicklung, keine versteckten Zwischengebühren.',
      'sol-mfg.feat.4.title':'Lokale Zahlungswege statt SWIFT',
      'sol-mfg.feat.5.desc':'API-Zugang für institutionelle Kunden. Individuelle Integrationen auf Anfrage. Standardisierte Exportformate für Buchhaltungsabläufe.',
      'sol-mfg.feat.5.title':'API-Zugang',
      'sol-mfg.feat.6.desc':'Für Konten mit institutionellem Volumen steht ein persönlicher Experte als direkter Ansprechpartner zur Verfügung, kein Chatbot. Zugang zum Senior-Handel ab dem ersten Tag.',
      'sol-mfg.feat.6.title':'Persönlicher Experte für institutionelle Volumina',
      'sol-mfg.hero.h1.html':'Devisen, gebaut für<br><em>industrielle Lieferketten.</em>',
      'sol-mfg.hero.overlay.fees':'Keine versteckten SWIFT-Gebühren',
      'sol-mfg.hero.overlay.rate':'Kurs bei Ausführung fixiert',
      'sol-mfg.pain.1.desc':'Banken berechnen bei Hauptwährungspaaren typischerweise 1,5 % bis 3 % über dem Mid-Market. Übers Jahr multipliziert ist das der größte unsichtbare Aufwand bei jeder Sendung.',
      'sol-mfg.pain.1.title':'Breite Spreads bei großen Handeln',
      'sol-mfg.pain.2.desc':'Banken quotieren einen Kurs und wickeln dann zu einem anderen ab. Der Spread steckt verborgen im Kurs. Es gibt kein Angebot, das Sie für die Dauer eines Bestätigungsanrufs halten können.',
      'sol-mfg.pain.2.title':'Kein transparenter Ausführungsmoment',
      'sol-mfg.pain.3.desc':'Lieferanten in Brasilien, Indien oder Südkorea bezahlen? Die meisten Banken verweigern oder berechnen empfindliche Spreads auf Schwellenmarktwährungen.',
      'sol-mfg.pain.3.title':'Märkte, die Ihre Bank meidet',
      'sol-mfg.pain.4.desc':'Ein großer Handel bleibt am Bankschalter liegen. Bis er bestätigt wird, ist der Kurs, den Sie sahen, bereits weg.',
      'sol-mfg.pain.4.title':'Langsame Ausführung bei großen Tickets',
      'sol-mfg.pain.5.desc':'Korrespondenzbankgebühren, Lifting-Fees, Abzüge beim Begünstigten. Die tatsächlichen Kosten einer Zahlung sind selten die, die Sie freigegeben haben.',
      'sol-mfg.pain.5.title':'Versteckte SWIFT- und Korrespondenzgebühren',
      'sol-mfg.pain.6.desc':'Jeder Handel wird aus dem Kontoauszug erneut in Ihr Buchhaltungssystem eingetippt. Jeder Monatsabschluss wird zur forensischen Übung.',
      'sol-mfg.pain.6.title':'Manuelle Treasury-Arbeit',
      'sol-mfg.pain.eyebrow':'Die versteckten Kosten',
      'sol-mfg.pain.h2.html':'Wo Hersteller Marge<br>an Devisen verlieren.',
      'sol-mfg.persona.1.desc':'Komponenten aus Asien, Vertrieb weltweit. USD, CNY, JPY im Zentrum. Kursfixierte Ausführung bei jeder Umrechnung, mit Großhandelskonditionen über die Hauptkorridore.',
      'sol-mfg.persona.1.name':'Mittelstands-Maschinenbau',
      'sol-mfg.persona.2.desc':'JIT-Lieferketten, OEM-Verträge, währungsübergreifendes Stücklisten-Exposure. Ausführungsgeschwindigkeit und Großhandelskonditionen sind nicht verhandelbar. Persönlicher Experte bei Tickets, die Senior-Aufmerksamkeit brauchen.',
      'sol-mfg.persona.2.name':'Automobilzulieferer',
      'sol-mfg.persona.3.desc':'Rohstoffe in USD, Fertigwaren in EUR oder CHF. Transparente Gebühren bei jeder Umrechnung, fixiert im Moment des Handels.',
      'sol-mfg.persona.3.name':'Chemie und Verarbeitung',
      'sol-mfg.persona.4.desc':'Agrarrohstoffe mit Exposure in BRL, ARS, AUD, USD. Großhandelskonditionen über Schwellenmarktkorridore, mit lokalen Wegen in die Herkunftsländer.',
      'sol-mfg.persona.4.name':'Lebensmittel- und Getränkeimporteure',
      'sol-mfg.persona.eyebrow':'Entwickelt für',
      'sol-mfg.persona.h2.html':'Gemacht für die Praxis<br>von Industrieunternehmen.',
      'sol-mfg.sol.eyebrow':'Was wir tun',
      'sol-mfg.sol.h2.html':'Devisen, gebaut für industrielle<br>Lieferketten.',
      'sol-mfg.trust.1':'Kurs bei Ausführung fixiert',
      'sol-mfg.trust.2':'Lokale Zahlungen weltweit',
      'sol-mfg.trust.3':'45+ Märkte weltweit',
      'sol-mfg.trust.4':'Von der BaFin zugelassen',
      'sol-sme.hero.badge1':'Kein Mindestvolumen',
      'sol-sme.hero.badge2':'BaFin-lizenziert',
      'sol-sme.pain.1.desc':'Ihre Bank stellt Ihnen eine „kostenlose“ Überweisung in Aussicht, nimmt aber 2 % bis 4 % im Kurs. Bei einer Überweisung von 100.000 € sind das bis zu 4.000 €, jedes Mal.',
      'sol-sme.pain.1.title':'Versteckte FX-Margen',
      'sol-sme.pain.2.desc':'Banken leiten kleine Kunden an eine Hotline weiter, nicht an einen Spezialisten. Bis jemand zurückruft, ist das Zeitfenster vorbei.',
      'sol-sme.pain.2.title':'Niemand geht ran, wenn sich der Kurs bewegt',
      'sol-sme.pain.3.desc':'Korrespondenzbankgebühren, Lifting-Fees, Abzüge beim Begünstigten. Die tatsächlichen Kosten einer Zahlung sind selten die, die Sie freigegeben haben.',
      'sol-sme.pain.3.title':'SWIFT-Gebühren, die Sie erst beim Empfänger sehen',
      'sol-sme.pain.4.desc':'Ihre Bank quotiert einen Kurs und wickelt dann zu einem anderen ab. Der Spread steckt verborgen im Kurs. Es gibt keinen transparenten Ausführungsmoment, kein Angebot, das Sie halten können.',
      'sol-sme.pain.4.title':'Kein transparenter Ausführungsmoment',
      'sol-sme.pain.5.desc':'Ihr Lieferant in Shenzhen fragt sich, wo sein Geld bleibt. Sie sich auch.',
      'sol-sme.pain.5.title':'Zwei bis drei Werktage für eine einfache Überweisung',
      'sol-sme.pain.eyebrow':'Die versteckten Kosten',
      'sol-sme.pain.h2.html':'Die versteckten Kosten, Devisen über<br>Ihre Hausbank abzuwickeln.',
      'sol-sme.pain.sub':'Die meisten kleinen Unternehmen verlieren still Geld bei grenzüberschreitenden Zahlungen, und die meisten Banken haben keinen Anreiz, es ihnen zu sagen.',
      'sol-sme.trust.1':'Von der BaFin zugelassen',
      'sol-sme.trust.2':'Ausführung am selben Tag',
      'sol-sme.trust.3':'45+ Märkte weltweit',
      'sol-sme.trust.4':'Kurs bei Ausführung fixiert',
    }
  };

  window.HP = {
    lang: 'de',
    t: function(key) {
      var d = HP_DICT[window.HP.lang] || HP_DICT.en;
      return d[key] !== undefined ? d[key] : (HP_DICT.en[key] || key);
    },
    setLang: function(lang) {
      window.HP.lang = lang;
      try { localStorage.setItem('hp_lang', lang); } catch(e) {}
      document.documentElement.lang = lang;
      // Toggle button states
      ['de','en'].forEach(function(l) {
        var nb = document.getElementById('nav-btn-' + l);
        var mb = document.getElementById('mob-btn-' + l);
        if (nb) nb.classList.toggle('active', l === lang);
        if (mb) mb.classList.toggle('active', l === lang);
      });
      window.HP.apply();
      // Notify booking iframe if open
      var iframe = document.getElementById('hp-bm-iframe');
      if (iframe && iframe.src && iframe.contentWindow) {
        try { iframe.contentWindow.postMessage({ type: 'setLang', lang: lang }, '*'); } catch(ex) {}
      }
      // Let other widgets (e.g. cookie banner) re-localise
      try { window.dispatchEvent(new CustomEvent('hp:langchange', { detail: { lang: lang } })); } catch(ex) {}
    },
    apply: function() {
      var lang = window.HP.lang;
      var t = window.HP.t.bind(window.HP);

      // ── data-i18n (text) ──────────────────────────────────────────────────
      document.querySelectorAll('[data-i18n]').forEach(function(el) {
        var key = el.getAttribute('data-i18n');

        // Snapshot original English content the very first time we touch this element
        if (!el.hasAttribute('data-i18n-orig')) {
          var hasChildEls = false;
          for (var ci = 0; ci < el.childNodes.length; ci++) {
            if (el.childNodes[ci].nodeType === 1) { hasChildEls = true; break; }
          }
          if (!hasChildEls) {
            el.setAttribute('data-i18n-orig', el.textContent);
          } else {
            // Find the last text node
            for (var si = el.childNodes.length - 1; si >= 0; si--) {
              var sn = el.childNodes[si];
              if (sn.nodeType === 3 && sn.textContent.trim()) {
                el.setAttribute('data-i18n-orig', sn.textContent.trim());
                break;
              }
            }
          }
        }

        if (lang === 'en') {
          // Restore original English
          var orig = el.getAttribute('data-i18n-orig') || '';
          var hasChildElsR = false;
          for (var ri = 0; ri < el.childNodes.length; ri++) {
            if (el.childNodes[ri].nodeType === 1) { hasChildElsR = true; break; }
          }
          if (!hasChildElsR) {
            el.textContent = orig;
          } else {
            for (var rj = el.childNodes.length - 1; rj >= 0; rj--) {
              var rn = el.childNodes[rj];
              if (rn.nodeType === 3 && rn.textContent.trim()) {
                rn.textContent = ' ' + orig;
                break;
              }
            }
          }
          return;
        }

        var val = t(key);
        if (val === key) return; // no DE translation, leave as-is
        var hasChildEls2 = false;
        for (var ci2 = 0; ci2 < el.childNodes.length; ci2++) {
          if (el.childNodes[ci2].nodeType === 1) { hasChildEls2 = true; break; }
        }
        if (!hasChildEls2) {
          el.textContent = val;
        } else {
          for (var ti = el.childNodes.length - 1; ti >= 0; ti--) {
            var node = el.childNodes[ti];
            if (node.nodeType === 3 && node.textContent.trim()) {
              node.textContent = ' ' + val;
              break;
            }
          }
        }
      });

      // ── data-i18n-html (innerHTML) ────────────────────────────────────────
      document.querySelectorAll('[data-i18n-html]').forEach(function(el) {
        var key = el.getAttribute('data-i18n-html');

        // Snapshot original English HTML on first touch
        if (!el.hasAttribute('data-i18n-html-orig')) {
          el.setAttribute('data-i18n-html-orig', el.innerHTML);
        }

        if (lang === 'en') {
          el.innerHTML = el.getAttribute('data-i18n-html-orig') || el.innerHTML;
          return;
        }

        var htmlKey = key + '.html';
        var val = t(htmlKey);
        if (val === htmlKey) val = t(key);
        if (val !== key && val !== htmlKey) el.innerHTML = val;
      });

      // ── data-i18n-ph (placeholder) ────────────────────────────────────────
      document.querySelectorAll('[data-i18n-ph]').forEach(function(el) {
        var key = el.getAttribute('data-i18n-ph');
        if (!el.hasAttribute('data-i18n-ph-orig')) {
          el.setAttribute('data-i18n-ph-orig', el.placeholder || '');
        }
        if (lang === 'en') {
          el.placeholder = el.getAttribute('data-i18n-ph-orig') || '';
          return;
        }
        var val = t(key);
        if (val !== key) el.placeholder = val;
      });
    }
  };

  // Init language from localStorage, default DE
  (function() {
    var saved = null;
    try { saved = localStorage.getItem('hp_lang'); } catch(e) {}
    window.HP.lang = (saved === 'en') ? 'en' : 'de';
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        window.HP.setLang(window.HP.lang);
      });
    } else {
      window.HP.setLang(window.HP.lang);
    }
  })();

  // Load the cookie-consent / analytics gate from the same /assets/ folder
  (function () {
    try {
      var ns = document.querySelector('script[src*="nav.js"]');
      var base = ns ? ns.getAttribute('src').replace(/nav\.js.*$/, '') : 'assets/';
      var s = document.createElement('script');
      s.src = base + 'consent.js';
      s.defer = true;
      document.head.appendChild(s);
    } catch (e) {}
  })();

})();
