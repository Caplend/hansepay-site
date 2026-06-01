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
.nav-cta{background:rgba(255,255,255,.12);color:#fff;border:1.5px solid rgba(255,255,255,.28);padding:8px 20px;font-size:13px;border-radius:var(--r-pill);backdrop-filter:blur(8px)}
.nav-cta:hover{background:rgba(255,255,255,.2);border-color:rgba(255,255,255,.45)}
nav.scrolled .nav-cta{background:var(--n500);border-color:var(--n500);backdrop-filter:none}
nav.scrolled .nav-cta:hover{background:var(--n600)}
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
@media(max-width:768px){.nav-links{display:none}.nav-burger{display:flex}.nav-inner{justify-content:space-between}.nav-logo{margin-right:0}.nav-cta{display:none}}
/* ── LANG TOGGLE ── */
.nav-lang{display:flex;align-items:center;gap:2px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:100px;padding:3px;}
nav.scrolled .nav-lang{background:rgba(11,25,41,.06);border-color:rgba(11,25,41,.12);}
.nav-lang-btn{padding:4px 10px;border-radius:100px;border:none;font-family:var(--font-ui,sans-serif);font-size:11px;font-weight:700;letter-spacing:.06em;cursor:pointer;transition:all .18s ease;background:transparent;color:rgba(255,255,255,.45);}
nav.scrolled .nav-lang-btn{color:rgba(11,25,41,.4);}
.nav-lang-btn.active{background:rgba(255,255,255,.18);color:#fff;}
nav.scrolled .nav-lang-btn.active{background:var(--n500,#1E4E80);color:#fff;}
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
      <div class="nav-lang" id="nav-lang-toggle">
        <button class="nav-lang-btn active" id="nav-btn-de" onclick="HP.setLang('de')">DE</button>
        <button class="nav-lang-btn" id="nav-btn-en" onclick="HP.setLang('en')">EN</button>
      </div>
      <a href="index.html#contact" class="btn nav-cta" data-i18n="nav.cta">Open an account</a>
      <button class="nav-burger" id="nav-burger" aria-label="Menu"><span></span><span></span><span></span></button>
    </div>
  </div>
</nav>
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
  <a href="index.html#contact" class="btn btn-primary mobile-menu-cta" onclick="closeMobileMenu()" data-i18n="nav.cta">Open an account</a>
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
    },
    de: {
      // Nav
      'nav.home':'Startseite','nav.platform':'Plattform','nav.solutions':'Lösungen',
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
    },
    apply: function() {
      var t = window.HP.t.bind(window.HP);
      document.querySelectorAll('[data-i18n]').forEach(function(el) {
        var key = el.getAttribute('data-i18n');
        var val = t(key);
        if (val === key) return;
        var hasChildEls = false;
        for (var ci = 0; ci < el.childNodes.length; ci++) {
          if (el.childNodes[ci].nodeType === 1) { hasChildEls = true; break; }
        }
        if (!hasChildEls) {
          el.textContent = val;
        } else {
          // Update the last direct text node (preserves child elements like dot spans)
          for (var ti = el.childNodes.length - 1; ti >= 0; ti--) {
            var node = el.childNodes[ti];
            if (node.nodeType === 3 && node.textContent.trim()) {
              node.textContent = " " + val;
              break;
            }
          }
        }
      });
      document.querySelectorAll('[data-i18n-html]').forEach(function(el) {
        var key = el.getAttribute('data-i18n-html');
        var val = t(key);
        if (val !== key) el.innerHTML = val;
      });
      document.querySelectorAll('[data-i18n-ph]').forEach(function(el) {
        var key = el.getAttribute('data-i18n-ph');
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

})();
