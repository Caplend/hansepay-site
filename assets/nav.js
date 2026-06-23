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
.nav-dd-active .nav-dd-icon{background:rgba(141,189,230,.18);border-color:rgba(141,189,230,.30)}
.nav-dd-active .nav-dd-icon svg{color:var(--n200)}
.nav-dd-active .nav-dd-title{color:var(--n200)}
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
/* ── CINEMATIC IMAGE TREATMENT (shared, locked — do not tune per image) ──
   Apply class "hp-cine" to any photographic / lifestyle / cityscape <img>.
   A refined, slightly muted dusk grade: richer contrast, gently lowered brightness and
   saturation for a premium, cohesive mood. NO hue-rotate, so warm amber light stays warm
   and images never go flat monochrome blue. Theme cohesion comes from each hero's navy
   gradient overlay, the same way the front-page hero is composed.
   One source of truth so future images inherit it automatically. */
img.hp-cine,.hp-cine>img{
  filter:saturate(0.88) contrast(1.08) brightness(0.92);
}
/* ── UNIVERSAL HERO CHIP (shared, locked) — identical bubble on every hero ──
   Dark glass pill, white uppercase label, single blue dot. Overrides any
   per-page .hero-chip styling so all hero bubbles match. */
.hero-chip{display:inline-flex;align-items:center;gap:8px;padding:7px 16px;border-radius:100px;background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.20);font-family:var(--font-ui,sans-serif);font-size:11px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.9);margin-bottom:28px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.hero-chip::before{content:"";width:5px;height:5px;border-radius:50%;background:var(--n200,#8DBDE6);flex-shrink:0;box-shadow:0 0 6px rgba(141,189,230,.7)}
.hero-chip .hero-chip-dot{display:none}
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
    window.location.href = '/hansepay/dashboard-login.html';
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
      // calc page — full i18n set
      'calc.hero.h1':'See what you could save on FX, <em>in under 30 seconds.</em>',
      'calc.hero.sub':'Set your annual volume, your current provider, and your destination currency. We\'ll show you the estimated annual saving with HansePay — then get an exact figure with a free FX audit.',
      'calc.header.h3':'Estimate your FX savings',
      'calc.header.p':'Set your volume, currency, and provider below. These are estimates based on industry-standard margins.',
      'calc.vol.label':'Annual cross-border payment volume',
      'calc.ccy.label':'Currency pair',
      'calc.fxcost.label':'Your current FX cost',
      'calc.mode.provider':'By provider',
      'calc.mode.custom':'By exact margin',
      'calc.margin.hint':'Estimated margin at your volume:',
      'calc.margin.label':'Current provider markup',
      'calc.pay.label':'Cross-border payments per month',
      'calc.pay.hint':'Used to estimate per-payment fee savings (SWIFT, lifting, beneficiary fees).',
      'calc.res.margins':'Saved on FX margins',
      'calc.res.fees':'Saved on per-payment fees',
      'calc.res.total':'Total annual saving',
      'calc.bar.title':'Annual cost comparison',
      'calc.bar.current':'Your current annual cost',
      'calc.bar.hp':'With HansePay',
      'calc.audit.cta':'Get an exact figure: request a free FX audit',
      'calc.footnote':'Estimates based on industry-standard margins. Your actual saving depends on your transaction history.',
      'calc.strip.h2':'Get an exact figure with a <em>free FX audit.</em>',
      'calc.strip.sub':'We\'ll analyse your actual transaction data and show you the precise annual saving.',
      'calc.strip.cta':'Request a free FX audit',
      // tools-swift.html
      'swift.chip':'SWIFT / BIC Lookup',
      'swift.hero.h1':'Find any SWIFT code, <em>fast.</em>',
      'swift.hero.sub':'Look up SWIFT/BIC codes by bank name, country, or code itself. Free, no signup.',
      'swift.search.ph':'Search by bank name, country, city or SWIFT code…',
      'swift.footnote':'This lookup uses a curated dataset of major banks. For institutional use, always verify with your counterparty bank.',
      'swift.ref.eyebrow':'Reference',
      'swift.anatomy.h2':'Anatomy of a SWIFT code.',
      'swift.anatomy.intro':'A SWIFT/BIC code is either 8 or 11 characters and identifies a specific bank (and optionally a specific branch) anywhere in the world. The first four characters are the bank code, a unique short identifier for the institution. The next two are the ISO country code. Two more identify the city or location of the head office. The optional final three identify a specific branch; if omitted, the code refers to the primary office.',
      'swift.anatomy.bank':'Bank code',
      'swift.anatomy.country':'Country code',
      'swift.anatomy.location':'Location code',
      'swift.anatomy.branch':'Branch code',
      'swift.cta.h2':'Ready to send money <em>across borders?</em>',
      'swift.cta.sub':'Open your HansePay account. Mid-market rates, transparent pricing.',
      'swift.cta.conv':'Try the currency converter',
      // tools.html
      'tools.section.h2':'Four utilities. No paywall.',
      'tools.section.sub':'Built for the small daily questions that come up when you move money internationally: quick checks, transparent rates, and zero friction.',
      'tools.card1.name':'FX Savings Calculator',
      'tools.card1.desc':'Estimate how much you\'d save on FX vs. your current provider. Set your volume, currency, and provider type. See the annual saving in under 30 seconds.',
      'tools.card2.name':'Currency Converter',
      'tools.card2.desc':'Convert between 30+ currencies worldwide at live mid-market rates. See real exchange rates and historical trends across 1W, 1M, and 1Y ranges.',
      'tools.card3.name':'SWIFT / BIC Lookup',
      'tools.card3.desc':'Look up SWIFT/BIC codes by bank name, country, city, or code. A curated database of 50+ major banks worldwide, searchable in real time.',
      'tools.card4.name':'IBAN Verifier',
      'tools.card4.desc':'Validate any IBAN and see which bank it belongs to. Checks format, country length, and mod-97 checksum. For German IBANs, surfaces the bank name, city, and BIC.',
      // tools-converter.html
      'conv.diff.eyebrow':'The difference','conv.diff.chip':'The difference',
      'conv.diff.h2':'What banks don\'t show you.',
      'conv.diff.p1':'The mid-market rate is the rate at which banks trade with each other, the closest thing to a “true” price for any currency pair. When you send money through your bank, you almost never see this rate. Instead, you see a worse rate, with the bank\'s spread already baked in. That spread is real cost, just disguised as the exchange rate.',
      'conv.diff.p2':'HansePay starts from the mid-market rate and adds a clearly disclosed markup on top. The number you see in this converter is the same number we start from when quoting your trade.',
      // tools-iban.html
      'iban.hero.h1':'Validate any IBAN <em>in one click.</em>',
      'iban.hero.sub':'Check format, extract BIC, and verify bank details for 77 countries.',
      'iban.field.label':'IBAN',
      'iban.field.ph':'DE89 3704 0044 0532 0130 00',
      'iban.empty':'Enter an IBAN to validate.',
      'iban.disclaimer':'Format validation only. A valid format does not guarantee the IBAN is active or belongs to the intended recipient. Always verify recipient details with your counterparty before sending money.',
      'iban.ref.eyebrow':'Reference',
      'iban.ref.h2':'What we check.',
      'iban.ref.p1':'Every IBAN starts with a two-letter country code, followed by two check digits and the country-specific account identifier. We confirm that the country is recognised, that the length matches the expected length for that country, and that the built-in checksum holds.',
      'iban.ref.p2':'The checksum is a piece of arithmetic baked into the IBAN standard. For German IBANs, we extract the eight-digit Bankleitzahl and look it up against the Deutsche Bundesbank BLZ register, surfacing the bank name, city, and BIC.',
      // events.html
      'events.hero.h1':'Where to find us <em>this season.</em>',
      'events.section.h2':'No events scheduled yet.',
      'events.section.sub':'We\'re finalising our conference and trade show calendar for 2026. Check back soon or register below to be notified when we announce.',
      'events.notify.h2':'Get notified when events are announced.',
      'events.notify.sub':'Leave your details and we\'ll email you when we publish the next event schedule.',
      'events.notify.email.label':'Business email',
      'events.notify.email.ph':'you@company.com',
      'events.notify.name.label':'Your name',
      'events.notify.name.ph':'First name',
      'events.notify.btn':'Notify me',
      'events.final.h2':'In the meantime, open your account.',
      'events.final.sub':'Start sending money across borders today. No minimum volume required.',
      // insights-stories.html
      'stories.hero.h1':'Real customers. <em>Real results.</em>',
      'stories.prep.label':'Stories we’re preparing',
      'stories.prep.h2':'The kind of businesses we <em>build for.</em>',
      'stories.prep.sub':'Each story follows the same pattern: a real FX challenge, and how switching to HansePay changed the numbers.',
      'stories.card1.label':'E-Commerce · Hamburg',
      'stories.card1.h3':'Six-figure annual FX cost, halved in year one.',
      'stories.card1.p':'A multi-channel retailer importing from Asia and Southeast Asia was losing 2.8% on every supplier payment. After switching to HansePay, margins recovered and supplier relationships strengthened.',
      'stories.card2.label':'Manufacturing · Bavaria',
      'stories.card2.h3':'Settlement from days to minutes on industrial contracts.',
      'stories.card2.p':'A Mittelstand manufacturer sending €4M+ annually to US and Japanese suppliers cut settlement time from three days to minutes, without any bank relationship changes.',
      'stories.card3.label':'Logistics · Bremen',
      'stories.card3.h3':'Treasury consolidated across 12 currencies, zero IT project.',
      'stories.card3.p':'A freight forwarder managing 12 active currency corridors brought all FX execution onto a single platform. Month-end reconciliation time dropped from three days to half a day.',
      // insights-market.html
      'market.hero.h1':'Currency analysis, <em>delivered weekly.</em>',
      'market.hero.sub':'Short, practical reads on the currency moves that matter for businesses operating across Europe and beyond. No noise, no forecasting theatre — just what you need to make better payment decisions this week.',
      'market.cta1':'Get early access',
      'market.cta2':'Try the converter',
      'market.topics.label':'Topics we’ll cover',
      'market.topics.h2':'The markets that <em>matter to you.</em>',
      'market.topics.sub':'Written for the finance director and CFO of a mid-market business, not for traders.',
      'market.card1.h3':'EUR/USD movements',
      'market.card1.p':'What recent dollar strength or weakness means for your US supplier invoices and how to respond without speculating.',
      'market.card2.h3':'Emerging market corridors',
      'market.card2.p':'Turkey, India, Vietnam, Mexico — the corridors that dominate Mittelstand supply chains and are hardest to price accurately.',
      'market.card3.h3':'What the ECB is doing',
      'market.card3.p':'Rate decisions and their practical effect on EUR pairs, without the economist jargon, with the business implication up front.',
      'market.card4.h3':'Practical treasury',
      'market.card4.p':'FX policy frameworks, hedging basics, and treasury structure, written for the finance director who needs to act, not study.',
      // about-licenses.html
      'licenses.hero.h1':'Licensed where <em>it counts.</em>',
      'licenses.eu.eyebrow':'European by design',
      'licenses.eu.h2':'Built where oversight <em>is.</em>',
      'licenses.eu.body':'HansePay sits inside the European regulatory perimeter, end to end. The license is European. The supervision is European. The data sits in Europe.',
      'licenses.grid.eyebrow':'Licenses and compliance',
      'licenses.grid.h2':'Stated. Verified. <em>Audited.</em>',
      'licenses.card1.title':'European MiCAR License',
      'licenses.card1.body':'Authorised under the Markets in Crypto-Assets Regulation, the strictest digital-money framework in the European Union.',
      'licenses.card2.title':'BaFin Supervision',
      'licenses.card2.body':'Approved by BaFin, Germany\'s federal financial supervisory authority. Direct German supervisory oversight on European license.',
      'licenses.card3.title':'GDPR',
      'licenses.card3.body':'Compliant data handling under EU regulation 2016/679. Data stored and processed inside the EU.',
      'licenses.card4.title':'ISO 27001',
      'licenses.card4.body':'Certified information security management system. Independent audit on a recurring cadence.',
      // blog.html
      'blog.hero.h1':'FX knowledge that moves your business.',
      'blog.filter.all':'All','blog.filter.edu':'FX Education','blog.filter.treasury':'Treasury','blog.filter.compliance':'Compliance','blog.filter.market':'Market Analysis',
      'blog.loading':'Loading posts…',
      'blog.latest':'Latest articles',
      'blog.error':'Unable to load posts. Please try refreshing the page.',
      // about-history.html
      'history.eyebrow':'History',
      'history.hero.h1':'Built across <em>three pillars.</em>',
      'history.hero.sub':'HansePay didn\'t appear overnight. It is the commercial brand of a regulated structure built carefully across two jurisdictions.',
      'history.corp.eyebrow':'Corporate structure',
      'history.corp.h2':'Three entities, <em>one platform.</em>',
      'history.milestones.eyebrow':'Milestones',
      'history.milestones.h2':'Key <em>moments.</em>',
      'history.m1.text':'Founding of Caplend GmbH',
      'history.m2.text':'Establishment of Caplend Technologies GmbH',
      'history.m3.text':'MiCAR authorisation granted under EU law',
      'history.m4.text':'BaFin cross-border notification effective',
      'history.m5.text':'HansePay platform launch',
      // platform-security.html
      'sec.chip':'Security',
      'sec.hero.h1':'Every transfer, <em>safe at every step.</em>',
      'sec.hero.sub':'Move money confidently across borders with multi-layer protection engineered into the platform.',
      'sec.overview.eyebrow':'Overview','sec.overview.h2':'Security, engineered in by default.',
      'sec.overview.sub':'Safety shows up across the platform, from how you log in to how your funds are held.',
      'sec.2fa.eyebrow':'Authentication','sec.2fa.h2':'Verify every critical action.',
      'sec.2fa.body':'Strong two-factor authentication protects login, transactions, currency exchanges, beneficiary creation, and new user activation.',
      'sec.session.eyebrow':'Session monitoring','sec.session.h2':'See every login. Revoke any session.',
      'sec.session.body':'Connected devices, login timestamps, locations, and browser details visible in your account. Spot unusual access and revoke instantly.',
      'sec.bene.eyebrow':'Beneficiary verification','sec.bene.h2':'Confirm beneficiary details before money moves.',
      'sec.bene.body':'Beneficiary details validated against recipient bank records. Name and account number mismatches surface immediately.',
      'sec.data.eyebrow':'Data protection','sec.data.h2':'Data encrypted in transit and at rest.',
      'sec.data.body':'All sensitive data encrypted in transit and at rest. ISO 27001 certified, GDPR-compliant.',
      'sec.trust.eyebrow':'A partner you can trust','sec.trust.h2':'Secure and reliable above all.',
      'sec.trust.intro':'Four foundations the platform is built on. Each one is documented, audited, and verifiable.',
      'sec.trust.c1.title':'Regulated by design','sec.trust.c1.body':'MiCAR-authorised under EU law, supervised by BaFin.',
      'sec.trust.c2.title':'Direct support','sec.trust.c2.body':'Founder-operated. Named dealer with a real phone number for institutional accounts.',
      'sec.trust.c3.title':'Enterprise-grade security','sec.trust.c3.body':'ISO 27001 certified ISMS, GDPR-compliant, independently audited.',
      'sec.trust.c4.title':'Safeguarded funds','sec.trust.c4.body':'Client funds ring-fenced at tier-1 European banks. Protected under MiCAR Article 75.',
      'sec.faq.eyebrow':'FAQ','sec.faq.h2':'Common questions about security.',
      'sec.faq1.q':'What happens to my money if HansePay fails?','sec.faq1.a':'Customer funds are ring-fenced in segregated accounts, protected under MiCAR Article 75 and returned at par.',
      'sec.faq2.q':'Is my data stored inside the EU?','sec.faq2.a':'Yes. All data stored and processed inside the EU, GDPR-compliant end to end.',
      'sec.faq3.q':'How does HansePay authenticate users?','sec.faq3.a':'Strong 2FA required for login and all critical actions: transactions, FX trades, beneficiary creation.',
      'sec.faq4.q':'Who regulates HansePay?','sec.faq4.a':'MiCAR-authorised under EU law, supervised by BaFin in Germany.',
      'sec.faq5.q':'What certifications does HansePay hold?','sec.faq5.a':'ISO 27001 information security, GDPR compliance, independent audits.',
      'sec.cta.h2':'Ready to move money <em>with confidence?</em>',
      'sec.cta.sub':'Open your account in minutes. No minimum volume.',
      // partners pages
      'pp.hero.chip':'Partners · Partner with us',
      'pp.hero.h1':'Three ways to partner. One conversation to start.',
      'pp.hero.sub':'We work with software platforms, advisors, and resellers to bring better FX to mid-market businesses across Europe. Every partnership is shaped to fit.',
      'pp.stat1.val':'MiCAR','pp.stat2.val':'<10 sec','pp.stat3.val':'0.10%','pp.stat4.val':'45+',
      'pp.ways.card1.title':'Embed payments',
      'pp.ways.card1.body':'For software platforms and ERPs. Add FX and cross-border payments to your product without building a bank.',
      'pp.ways.card1.link':'Read about embed',
      'pp.ways.card2.title':'Refer clients',
      'pp.ways.card2.body':'For tax advisors and consultants. Bring your clients better FX. Earn for the introduction.',
      'pp.ways.card2.link':'Read about refer',
      'pp.ways.card3.title':'Resell to your network',
      'pp.ways.card3.body':'For agencies and white-label partners. Distribute regulated FX to your customer base.',
      'pp.ways.card3.link':'Read about resell',
      'pp.step1.num':'01','pp.step2.num':'02','pp.step3.num':'03',
      'pp.form.heading':'Get in touch',
      'pp.form.sub':'Tell us about your business and how you\'d like to work together. We respond within two business days.',
      'pp.form.label.name':'Name','pp.form.label.company':'Company',
      'pp.form.label.email':'Email','pp.form.label.type':'Partnership type',
      'pp.form.label.message':'Tell us about your business',
      'pp.form.opt.select':'Select one',
      'pp.form.opt.embed':'Embed payments','pp.form.opt.refer':'Refer clients',
      'pp.form.opt.resell':'Resell to network','pp.form.opt.unsure':'Not sure yet',
      'pp.form.submit':'Send message',
      'pp.form.note':'By submitting this form, you agree to be contacted by HansePay. We respond within two business days.',
      'pp.stat1.cap':'EU-licensed under the new framework','pp.stat2.cap':'settlement times',
      'pp.stat3.cap':'average FX spread','pp.stat4.cap':'markets worldwide',
      'pp.why.eyebrow':'Why partner with us',
      'pp.card1.title':'MiCAR-licensed infrastructure',
      'pp.card1.body':'Regulatory work handled. Your clients or users get a regulated EU service without you carrying the compliance burden.',
      'pp.card2.title':'Mid-market focus, by choice',
      'pp.card2.body':'We don\'t compete for your SMB or enterprise clients. We work where mid-market FX needs are underserved.',
      'pp.card3.title':'Modern stack, no legacy drag',
      'pp.card3.body':'On-chain settlement, atomic FX, no SWIFT delays. Built in this decade.',
      'pp.card4.title':'Founder-led partnerships',
      'pp.card4.body':'Direct line to the team. Custom deals. Decisions in days, not quarters.',
      'pp.ways.eyebrow':'Three ways to partner',
      'pp.how.eyebrow':'How it works',
      'pp.step1.title':'Tell us about you','pp.step1.body':'Use the form below to share your business and what partnership you\'re considering.',
      'pp.step2.title':'We get in touch','pp.step2.body':'Our partnerships manager responds within two business days.',
      'pp.step3.title':'We design a deal','pp.step3.body':'Every partnership is shaped to fit. Commission, integration depth, and support are tailored to what works for both sides.',
      'pr.hero.h1':'Your clients have an FX problem. We have the solution.',
      'pr.situation.eyebrow':'The situation','pr.situation.h2':'You\'ve seen this before.',
      'pe.hero.h1':'Add FX to your platform, without building a bank.',
      'pe.problem.eyebrow':'The problem','pe.problem.h2':'Adding FX is harder than it looks.',
      'pe.embed.eyebrow':'What you can embed','pe.embed.h2':'Four capabilities, one integration.',
      'pe.embed.card1.title':'Named EUR accounts',
      'pe.embed.card1.body':'Issue named EUR accounts to your customers under your brand for receiving and sending payments. Funds are held in segregated accounts at tier-1 European banks.',
      'pe.embed.card2.title':'FX execution',
      'pe.embed.card2.body':'Execute live FX at institutional rates with full transparency on the spread. Atomic settlement, no T+2 delays.',
      'pe.embed.card3.title':'Cross-border payments',
      'pe.embed.card3.body':'Send and receive payments across 45+ markets worldwide through a single API. Payouts settle in seconds, not days.',
      'pe.embed.card4.title':'EMT issuance',
      'pe.embed.card4.body':'Issue MiCAR-regulated e-money tokens for programmable settlement and on-chain treasury operations. Same legal framework as a bank deposit, modern mechanics.',
      'pe.how.eyebrow':'How it works','pe.how.h2':'You build the product. We handle the rails.',
      'pe.why.eyebrow':'Why embed HansePay','pe.why.h2':'Built for platforms, not for banks.',
      'pe.why.card1.title':'EU-native, MiCAR-licensed',
      'pe.why.card1.body':'BaFin-regulated and MiCAR-authorised under EU law. Your customers get a regulated EU service. You do not carry the compliance burden.',
      'pe.why.card2.title':'One integration, every capability',
      'pe.why.card2.body':'Cross-border payments, FX, and EMT issuance through a single API surface. Add capabilities over time without re-integrating.',
      'pe.why.card3.title':'Modern stack, no legacy drag',
      'pe.why.card3.body':'On-chain settlement, atomic FX, no SWIFT delays. Built in this decade, not patched together over four.',
      'pe.why.card4.title':'Founder-led integration',
      'pe.why.card4.body':'You work directly with our team. Custom commercial terms, dedicated technical support during integration, decisions in days not quarters.',
      'pe.examples.eyebrow':'Examples','pe.examples.h2':'Three patterns we see most often.',
      'pe.ex1.label':'ERP and accounting platforms',
      'pe.ex1.title':'Cross-border payments inside the workflow',
      'pe.ex1.body':'Your customers run AP and AR in your product. Adding cross-border payments and FX means they don\'t bounce out to Wise, a bank portal, or a treasury tool. Invoices in, payments out, all in one place.',
      'pe.ex2.label':'Marketplaces',
      'pe.ex2.title':'Cross-border settlement to sellers',
      'pe.ex2.body':'Sellers across the EU want to be paid in their local currency. Buyers want to pay in theirs. Embed FX and named accounts, and you settle to each side without margin-stripping intermediaries.',
      'pe.ex3.label':'Fintechs and embedded finance',
      'pe.ex3.title':'Regulated infrastructure under your brand',
      'pe.ex3.body':'You have the customer, the brand, and the product. You don\'t want to become a payment institution. HansePay sits underneath, MiCAR-licensed, so your offering is regulated without you running the regulatory operation.',
      'pe.faq.eyebrow':'FAQ','pe.faq.h2':'What partners ask first.',
      // partners-resell.html
      'prs.opp.eyebrow':'The opportunity','prs.opp.h2':'Your network sees this every day.',
      'prs.offer.eyebrow':'What you can offer your network',
      'prs.offer.h2':'A regulated EU service, trusted at home.',
      'prs.offer.card1.title':'MiCAR-licensed, EU-supervised',
      'prs.offer.card1.body':'BaFin-regulated and MiCAR-authorised under EU law. Same legal framework as a bank deposit.',
      'prs.offer.card2.title':'Typically 60 to 80 percent lower FX costs',
      'prs.offer.card2.body':'Institutional rates with full spread transparency. FX spreads from 0.15% on major currencies, compared to 1 to 3% at high-street banks.',
      'prs.offer.card3.title':'Settlement in seconds',
      'prs.offer.card3.body':'On-chain EMT settlement runs continuously, including outside banking hours. No SWIFT delays, no T+2 wait.',
      'prs.offer.card4.title':'Made in Germany, Hamburg-based',
      'prs.offer.card4.body':'Built in Hamburg, designed for the German Mittelstand. The trusted face on regulated EU rails.',
      'prs.how.eyebrow':'How the partnership works',
      'prs.how.h2':'A program shaped with our first partners.',
      'prs.step1.title':'Tell us about your network',
      'prs.step1.body':'You tell us who your members or clients are and what FX needs you\'ve seen across them. We listen and learn.',
      'prs.step2.title':'We design a deal that fits',
      'prs.step2.body':'Commercial terms, branding model, and rollout plan are designed around what fits your network. HansePay-branded reselling, co-branded ("powered by HansePay"), or future white-label.',
      'prs.step3.title':'We launch together',
      'prs.step3.body':'You introduce, we handle compliance and onboarding, your network gets a regulated EU FX service. Founder-team support throughout the rollout.',
      'prs.why.eyebrow':'Why partner with HansePay',
      'prs.why.h2':'Regulated infrastructure, trusted brand.',
      'prs.why.card1.title':'Regulated EU infrastructure',
      'prs.why.card1.body':'European MiCAR License, approved by BaFin. Your network gets a regulated service without you needing a payment licence.',
      'prs.why.card2.title':'Made in Germany, Hamburg trust',
      'prs.why.card2.body':'A German brand built on Hanseatic trade heritage. The kind of name your members and clients already trust before the conversation starts.',
      'prs.why.card3.title':'Three commercial models',
      'prs.why.card3.body':'HansePay-branded reselling, co-branded partnerships ("powered by HansePay"), and full white-label on the roadmap.',
      'prs.why.card4.title':'Founder-led partnerships',
      'prs.why.card4.body':'Direct line to the founders, custom commercial terms, decisions in days. The program is being shaped with you, not handed down.',
      'prs.examples.eyebrow':'Examples','prs.examples.h2':'Three patterns we see most often.',
      'prs.examples.sub':'Where networks and resellers find HansePay valuable.',
      'prs.ex1.label':'Regional bank',
      'prs.ex1.title':'Co-branded FX for SME clients',
      'prs.ex1.body':'A regional bank\'s mid-market clients pay suppliers in Asia and lose 2% on every transfer. The bank can\'t compete with neobanks on FX rates. With HansePay co-branded, the bank offers a regulated FX service, keeps the customer relationship, and adds margin without building payment infrastructure.',
      'prs.ex2.label':'Trade association',
      'prs.ex2.title':'Preferred service for members',
      'prs.ex2.body':'A German trade association represents 800 mid-market exporters. Members regularly ask for guidance on cross-border payments. The association partners with HansePay to offer preferred onboarding and rates, strengthening member value without taking on payment regulation.',
      'prs.ex3.label':'Accounting software vendor',
      'prs.ex3.title':'Co-branded onboarding without engineering',
      'prs.ex3.body':'A regional accounting software vendor doesn\'t want to build FX into its product. The vendor partners with HansePay to offer customers a co-branded onboarding path, adding cross-border payments to the customer journey without engineering investment.',
      // blog.html CTA + pagination
      'blog.cta.eyebrow':'Ready to act on what you\'ve read?',
      'blog.cta.heading':'Move money at the rate that matters.',
      'blog.cta.primary':'Calculate your savings',
      'blog.cta.secondary':'Talk to a specialist',
      'blog.pag.prev':'← Previous','blog.pag.next':'Next →',
      // licenses.html IDs (TBD placeholders)
      'licenses.card1.id':'License No. [TBD]',
      'licenses.card2.id':'Reference [TBD]',
      // global CTAs
      'gs.cta1':'Open your business account','gs.cta2':'Talk to a specialist',
      'cta.explore-solutions':'Explore solutions',
      'prs.hero.h1':'Bring regulated FX to your network.',
      // about-history.html entity cards
      'history.entity1.name':'Caplend GmbH',
      'history.entity1.desc':'German holding company. Headquartered in Hamburg, the historic seat of the Hanseatic League, where modern cross-border trade has its roots.',
      'history.entity2.name':'Caplend Technologies GmbH',
      'history.entity2.desc':'MiCAR-authorised under EU law. The legal counterparty for all FX and payment services.',
      'history.entity3.name':'HansePay',
      'history.entity3.desc':'The commercial brand. The platform businesses use day-to-day to move money across borders.',
      // global CTA strip
      'cta.strip.h2':'Open your account.',
      'cta.strip.sub':'Start sending money in minutes, or talk to us about your use case.',
      'gs.cta.primary':'Open your business account',
      'gs.cta.secondary':'Talk to a specialist',
      // events.html CTAs
      'events.cta.get-notified':'Get notified',
      'events.cta.meet-team':'Meet the team',
      // tools.html eyebrow
      'tools.section.eyebrow':'What\'s available',
      // partners-refer.html full key set
      'pr.offer.eyebrow':'What you can offer your clients',
      'pr.offer.h2':'A regulated EU alternative to bank FX.',
      'pr.offer.card1.title':'MiCAR-licensed, EU-supervised',
      'pr.offer.card1.body':'BaFin-regulated and MiCAR-authorised under EU law. Same legal framework as a bank deposit, modern mechanics underneath.',
      'pr.offer.card2.title':'Typically 60 to 80 percent lower FX costs',
      'pr.offer.card2.body':'Institutional rates with full spread transparency. FX spreads from 0.15% on major currencies, compared to 1 to 3% at high-street banks.',
      'pr.offer.card3.title':'Settlement in seconds, not days',
      'pr.offer.card3.body':'On-chain EMT settlement runs continuously, including outside banking hours. No SWIFT delays, no T+2 wait.',
      'pr.how.eyebrow':'How the referral works',
      'pr.how.h2':'A program built for how advisors actually work.',
      'pr.step1.title':'You introduce us',
      'pr.step1.body':'You make a warm introduction when a client raises an FX or cross-border payments need. We take it from there.',
      'pr.step2.title':'Your client gets preferred onboarding',
      'pr.step2.body':'Clients introduced through an advisor get dedicated onboarding support, faster account setup, and a direct line to our team during their first months on the platform.',
      'pr.step3.title':'You stay in the loop',
      'pr.step3.body':'We provide monthly reporting on referred clients (where the client consents), standard format exports, and a structured way to keep visibility into their FX activity.',
      'pr.why.eyebrow':'Why advisors recommend HansePay',
      'pr.why.h2':'Built to make your work easier, not harder.',
      'pr.why.card1.title':'Regulatory clarity',
      'pr.why.card1.body':'MiCAR-licensed, BaFin-passported, audit-clean. Your client\'s auditor will thank you for the framework.',
      'pr.why.card2.title':'Clean reporting and exports',
      'pr.why.card2.body':'Standard format exports, transaction-level data, audit-ready statements. Less time chasing PDFs, more time on work that matters.',
      'pr.why.card3.title':'We don\'t compete for your clients',
      'pr.why.card3.body':'We don\'t sell tax, accounting, audit, or consulting services. Your client relationship stays exactly where it is.',
      'pr.why.card4.title':'Direct line to our team',
      'pr.why.card4.body':'When you refer a client, you get a named contact. Issues escalate fast. No support ticket queues.',
      'pr.examples.eyebrow':'Examples',
      'pr.examples.h2':'Where advisors point us.',
      'pr.ex1.label':'Tax advisor (Steuerberater)',
      'pr.ex1.title':'Annual review reveals FX losses',
      'pr.ex1.body':'A client\'s annual review surfaces six-figure currency losses from cross-border supplier payments. The advisor recommends HansePay as the regulated EU alternative. Losses drop, and the conversation in next year\'s review changes.',
      'pr.ex2.label':'Auditor (Wirtschaftsprüfer)',
      'pr.ex2.title':'Treasury structure flagged in audit',
      'pr.ex2.body':'An audit identifies a fragmented treasury setup across three banking partners and four currencies. The auditor introduces HansePay to consolidate without adding banking risk. The client\'s audit footprint shrinks.',
      'pr.ex3.label':'M&A advisor',
      'pr.ex3.title':'Carve-out needs FX infrastructure',
      'pr.ex3.body':'A carve-out leaves a newly independent business without the parent\'s treasury function. The M&A advisor recommends HansePay as a regulated FX layer that can be live in weeks, not months.',
      'pr.faq.eyebrow':'FAQ',
      'pr.faq.h2':'What advisors ask first.',
      'prs.faq.eyebrow':'FAQ',
      'prs.faq.h2':'What partners ask first.',
      // common section tails HTML
      'gs.h2.html':'Open your account.',
      // index.html — full EN coverage
      'index.hero.chip':'Commercial FX · Hamburg',
      'index.trust.1.title':'BaFin Regulated','index.trust.1.sub':'EU-licensed E-Money Institution',
      'index.trust.2.title':'Transparent Pricing','index.trust.2.sub':'Disclosed before every trade',
      'index.trust.3.title':'Live Pricing','index.trust.3.sub':'Real-time rates around the clock',
      'index.trust.4.title':'Dedicated Expert','index.trust.4.sub':'Direct contacts, no call centre',
      'index.calc.eyebrow':'The hidden cost',
      'index.calc.h2.html':'Your bank is quietly <em>overcharging you.</em>',
      'index.calc.sub':'On every cross-border transfer, your bank adds a 2–4% markup on top of the exchange rate, money that disappears without a line item. Calculate exactly what you\'re losing.',
      'index.calc.b1.title':'No hidden markups','index.calc.b1.desc':'We charge only a transparent transaction fee.',
      'index.calc.b2.title':'Transparent margin','index.calc.b2.desc':'Disclosed before every trade, no hidden bank spread.',
      'index.calc.b3.title':'Conservative estimate','index.calc.b3.desc':'Realistic benchmarks from the German business banking sector.',
      'index.calc.lbl.vol':'Annual FX volume','index.calc.lbl.ccy':'Currency pair',
      'index.calc.lbl.provider':'Current provider','index.calc.lbl.payments':'Payments per month',
      'index.calc.res.margins':'Saved on FX margins','index.calc.res.fees':'Saved on per-payment fees',
      'index.calc.res.total':'Total annual saving',
      'index.calc.disclaimer':'Estimates based on industry-standard margins. Major pairs: bank 2.5%, HansePay 0.3%. Bank wire fee €38, HansePay €10. Exact saving depends on your transaction history.',
      'index.calc.cta':'Full calculator with detailed breakdown →',
      'index.vp.eyebrow':'The HansePay difference',
      'index.vp.h2':'Transparent pricing.<br><em>Fast settlement.</em>',
      'index.vp.lede':'HansePay gives European businesses direct access to interbank FX rates with a transparent margin from 0.15% on major currency pairs, disclosed before every trade, with no hidden spread. Add same-day settlement on major corridors, and cross-border payments become predictable.',
      'index.vp.cta':'See how our pricing works →',
      'index.vp.m1.label':'FX margin from','index.vp.m1.sub':'Major pairs, disclosed before trade',
      'index.vp.m2.value':'Same<br>day','index.vp.m2.label':'Settlement','index.vp.m2.sub':'On major corridors',
      'index.vp.m3.label':'Markets','index.vp.m3.sub':'Across five regions worldwide',
      'index.vp.m4.label':'Onboarding','index.vp.m4.sub':'Fully digital application',
      'index.how.eyebrow':'How it works',
      'index.how.sub':'KYC is straightforward and built for businesses. Once verified, your account is live and ready to fund, with regulated rails in place before you send your first euro.',
      'index.how.s1.title':'Apply','index.how.s1.desc':'Start your application online. No paperwork at this stage, just basic company information.',
      'index.how.s2.title':'Verify your identity','index.how.s2.desc':'KYC and KYB for the business. Submit company documents and director identification.',
      'index.how.s3.title':'Compliance review','index.how.s3.desc':'Internal compliance check. Most reviews complete within one business day.',
      'index.how.s4.title':'Activate your account','index.how.s4.desc':'Account goes live. Fund it by SEPA transfer from your existing bank, same day for most German banks.',
      'index.how.s5.title':'Start sending','index.how.s5.desc':'Add recipients, lock your first FX quote, and settle your first cross-border payment.',
      'index.platform.eyebrow':'The Platform',
      'index.platform.h2.html':'Everything your treasury<br><em>needs, nothing it doesn\'t.</em>',
      'index.platform.sub':'Live FX rates, instant payments, full audit trail, your finance team gets a clean, powerful dashboard with everything in one place.',
      'index.platform.f1.title':'Live mid-market rate streaming','index.platform.f1.desc':'Lock in the real rate with one click. Spot, forward, or scheduled, your call.',
      'index.platform.f2.title':'Full payment visibility','index.platform.f2.desc':'Every transfer tracked in real time. Settled, in transit, or pending, always visible.',
      'index.platform.f3.title':'Recipient management','index.platform.f3.desc':'Store verified beneficiaries across 45+ markets, IBAN, SWIFT, local formats.',
      'index.platform.f4.title':'API & bulk payments','index.platform.f4.desc':'Integrate with your ERP or TMS. Send hundreds of payments from one CSV upload.',
      'index.platform.cta':'Explore the platform →',
      'index.currencies.eyebrow':'Global reach',
      'index.currencies.sub':'Seamless transfers across the Americas, Africa, the Middle East, Asia & Pacific, and Europe, with same-day availability on major corridors.',
      'index.currencies.more':'+27 more markets available — speak with your FX expert for full corridor availability.',
      'index.currencies.cta':'See full coverage →',
      'index.solutions.eyebrow':'For whom',
      'index.solutions.sub':'Whether import, export, e-commerce or professional services, we understand the specific requirements of your sector.',
      'index.seg.ecom.tag':'E-Commerce & Retail','index.seg.ecom.title':'E-Commerce & Retail','index.seg.ecom.desc':'Supplier payments, bulk FX, emerging markets, pay anywhere your suppliers are.',
      'index.seg.mfg.tag':'Import & Manufacturing','index.seg.mfg.title':'Import & Manufacturing','index.seg.mfg.desc':'Industrial FX, big-ticket execution, supply chain, plannable and cost-optimised.',
      'index.seg.log.tag':'Logistics & Freight','index.seg.log.title':'Logistics & Freight','index.seg.log.desc':'Same-day execution, agent networks, maritime, all currencies, one platform.',
      'index.seg.corp.tag':'Mid & Large Business','index.seg.corp.title':'Mid & Large Business','index.seg.corp.desc':'Institutional pricing, named expert, >€2M, bespoke FX for larger volumes.',
      'index.seg.sme.tag':'Small Business','index.seg.sme.title':'Small Business','index.seg.sme.desc':'No minimum volume, same-day, interbank rates, fair pricing from day one.',
      'index.about.eyebrow':'Our story',
      'index.about.h2':'Built in Hamburg.<br><em>Trusted across Europe.</em>',
      'index.about.body':'For centuries, Hamburg has been Europe\'s gateway to global commerce. HansePay carries that tradition forward, bringing institutional-grade FX execution to the businesses that drive the modern economy. BaFin-regulated, backed by Hamburg\'s innovation fund, advised by senior institutional experts.',
      'index.about.cta':'Learn more about us',
      'index.cred.1.title':'BaFin Licensed','index.cred.1.desc':'EU-regulated E-Money Institution under MiCAR. Direct German supervisory oversight by BaFin.',
      'index.cred.2.title':'Made in Hamburg','index.cred.2.desc':'Headquartered in Germany\'s gateway to the world, since 2023. Backed by Innovationsstarter Fonds Hamburg.',
      'index.cred.3.title':'Institutional Expertise','index.cred.3.desc':'Founded and advised by experienced FX and finance professionals with backgrounds at leading institutional firms.',
      'index.insights.eyebrow':'HANSEPAY INSIGHTS',
      'index.insights.h2':'FX knowledge that moves<br><em>your business forward.</em>',
      'index.insights.cta':'All articles →',
      'index.ins.1.tag':'FX Education','index.ins.1.title':'The Hidden Cost of Bank FX Fees, What Every CFO Should Know','index.ins.1.meta':'HansePay Team · 5 min read',
      'index.ins.2.tag':'Treasury','index.ins.2.title':'Same-Day Euro Settlement: A Practical Guide for European Businesses','index.ins.2.meta':'HansePay Team · 6 min read',
      'index.ins.3.tag':'Compliance','index.ins.3.title':'BaFin Regulation: What It Means for Your Business\'s Money','index.ins.3.meta':'HansePay Team · 7 min read',
      'index.faq.eyebrow':'FAQ',
      'index.faq.h2':'Common <em>questions.</em>',
      'index.faq.q1':'How fast are transfers?',
      'index.faq.a1':'Most transfers on major corridors (EUR/USD, EUR/GBP, EUR/CHF) settle same day. Transfers to Asia and the Middle East typically settle next business day. Your dedicated FX expert confirms exact timings when you book.',
      'index.faq.q2':'What fees does HansePay charge?',
      'index.faq.a2':'A transparent FX margin, from 0.15% on major currency pairs (0.15% to 0.75%) and disclosed before every trade, plus a flat €10 per payment. No spread hidden in the rate, no monthly fees, no minimum commitment.',
      'index.faq.q3':'Which currencies and countries do you support?',
      'index.faq.a3':'45+ markets across the Americas, Africa, the Middle East, Asia & Pacific, and Europe, including USD, GBP, JPY, AED, CNY, AUD, CAD, SGD, BRL, INR, KRW, ZAR, and more. Need a specific corridor? Get in touch, we can often arrange it on request.',
      'index.faq.q4':'Is HansePay regulated and safe?',
      'index.faq.a4':'Yes. HansePay is a BaFin-regulated EU E-Money Institution. Client funds are held in fully segregated accounts. We comply with all applicable AML, KYC, and MiCAR regulations and are subject to regular audits under German and EU financial law.',
      'index.faq.q5':'How do I get started?',
      'index.faq.a5':'Open an account online in under 10 minutes, fully digital, no paperwork, no bank appointments. Digital ID verification is included. Once approved, your dedicated FX expert contacts you to walk through the platform and discuss your requirements.',
      'index.faq.q6':'Is there a minimum transfer amount?',
      'index.faq.a6':'The minimum transfer is €50. There is no maximum. For large or complex transfers, your FX expert can arrange tailored rates and bespoke settlement options.',
      'index.cta.eyebrow':'Get started',
      'index.cta.h2':'Ready for a real <em>FX team?</em>',
      'index.cta.sub':'Open an account in minutes or speak directly with a foreign exchange specialist. No minimum volumes, no contract lock-in.',
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
      'sol-corp.hero.h1.html':'Der FX-Partner für Mittelstand und<br><em>Großunternehmen.</em>',
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
      'index.trust.2.title':'Transparente Preise',
      'index.trust.2.sub':'Vor jedem Handel offengelegt',
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
      'index.how.h2.html':'Vom Antrag zu Ihrer <em>ersten Zahlung.</em>',
      'index.how.sub':'KYC ist unkompliziert und auf Unternehmen zugeschnitten. Nach der Verifizierung ist Ihr Konto live und einzahlbereit, mit regulierten Schienen, bevor Sie Ihren ersten Euro senden.',
      'index.how.s1.title':'Antrag stellen',
      'index.how.s1.desc':'Starten Sie Ihren Antrag online. Kein Papierkram in diesem Schritt, nur grundlegende Unternehmensangaben.',
      'index.how.s2.title':'Identität verifizieren',
      'index.how.s2.desc':'KYC und KYB für das Unternehmen. Reichen Sie Unternehmensdokumente und die Identifikation der Geschäftsführung ein.',
      'index.how.s3.title':'Compliance-Prüfung',
      'index.how.s3.desc':'Interne Compliance-Prüfung. Die meisten Prüfungen sind innerhalb eines Werktags abgeschlossen.',
      'index.how.s4.title':'Konto aktivieren',
      'index.how.s4.desc':'Das Konto geht live. Zahlen Sie per SEPA-Überweisung von Ihrer bestehenden Bank ein, bei den meisten deutschen Banken am selben Tag.',
      'index.how.s5.title':'Loslegen',
      'index.how.s5.desc':'Empfänger anlegen, ersten FX-Kurs fixieren und Ihre erste grenzüberschreitende Zahlung abwickeln.',
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
      // seg-card keys (new naming used in HTML)
      'index.hero.chip':'Commercial FX · Hamburg',
      'index.seg.ecom.tag':'E-Commerce & Handel','index.seg.ecom.title':'E-Commerce & Handel','index.seg.ecom.desc':'Lieferantenzahlungen, Bulk-FX, Schwellenmärkte — bezahlen Sie überall, wo Ihre Lieferanten sind.',
      'index.seg.mfg.tag':'Import & Produktion','index.seg.mfg.title':'Import & Produktion','index.seg.mfg.desc':'Industrie-FX, Großaufträge, Lieferkette — planbar und kostenoptimiert.',
      'index.seg.log.tag':'Logistik & Fracht','index.seg.log.title':'Logistik & Fracht','index.seg.log.desc':'Same-Day-Abwicklung, Agentennetzwerke, Seeschifffahrt — alle Währungen, eine Plattform.',
      'index.seg.corp.tag':'Mittelstand & Großunternehmen','index.seg.corp.title':'Mittelstand & Großunternehmen','index.seg.corp.desc':'Institutionelle Konditionen, persönlicher Ansprechpartner, ab €2M, maßgeschneidertes FX.',
      'index.seg.sme.tag':'Kleinunternehmen','index.seg.sme.title':'Kleinunternehmen','index.seg.sme.desc':'Kein Mindestvolumen, Same-Day, Interbanken-Kurs — faire Preise von Anfang an.',
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
      'index.faq.a2':'Eine transparente FX-Marge, ab 0,15 % auf Hauptwährungspaaren (0,15 % bis 0,75 %) und vor jedem Handel offengelegt, zuzüglich pauschal 10 € pro Zahlung. Kein im Kurs versteckter Spread, keine Monatsgebühren, keine Mindestlaufzeit.',
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
      'platform.stat.1.label':'Märkte',
      'platform.stat.2.label':'FX-Marge ab',
      'platform.stat.3.label':'Onboarding',
      'platform.pillars.p1.title':'Transparente FX-Preise',
      'platform.pillars.p1.desc':'Wir beziehen den Interbanken-Mid-Market-Kurs und fügen eine transparente Marge hinzu, ab 0,15 % auf Hauptwährungspaaren, vor jedem Handel offengelegt. Kein im Kurs versteckter Spread, keine Überraschungen.',
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
      'platform.demo.eyebrow':'Interaktive Demo',
      'platform.demo.h2.html':'HansePay <em style="font-style:italic;color:var(--n400)">in Aktion.</em>',
      'platform.demo.lede':'Klicken Sie sich durch die Plattform: grenzüberschreitende Zahlungen, KI-gestützte Rechnungserfassung, Kursfixierung und Transaktions-Tracking. Keine Anmeldung erforderlich.',
      'platform.demo.cta':'Tour starten',
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
      'platform.faq.a1':'Ja. HansePay ist in Europa BaFin-reguliert und operiert als lizenziertes E-Geld-Institut nach EU-Recht. Kundengelder werden auf getrennten Konten bei europäischen Tier-1-Banken verwahrt und nie für operative Zwecke verwendet.',
      'platform.faq.q2':'Wie funktioniert Ihre FX-Preisgestaltung?',
      'platform.faq.a2':'Wir beziehen den Interbanken-Mid-Market-Kurs und fügen eine transparente Marge hinzu, ab 0,15 % auf Hauptwährungspaaren (0,15 % bis 0,75 %), vor jedem Handel offengelegt. Es gibt keinen im Kurs versteckten Spread, sodass Sie immer genau wissen, was die Zahlung kostet, bevor Sie bestätigen.',
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
      'vision.values.sub':'Die Prinzipien hinter jeder Entscheidung, die wir treffen, und allem, was wir bauen.',
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
      'platform-tech.s4.callout':'HansePay ist strukturell bis zu 8× günstiger',
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
      // calc page — full i18n set (key names matching tools-calculator.html)
      'calc.hero.h1':'Sehen Sie, was Sie bei FX sparen können, <em>in unter 30 Sekunden.</em>',
      'calc.hero.sub':'Stellen Sie Ihr jährliches Volumen, Ihren aktuellen Anbieter und Ihre Zielwährung ein. Wir zeigen Ihnen die geschätzte jährliche Ersparnis mit HansePay — für eine genaue Zahl fordern Sie ein kostenloses FX-Audit an.',
      'calc.header.h3':'Ihre FX-Einsparung schätzen',
      'calc.header.p':'Stellen Sie unten Ihr Volumen, Ihre Währung und Ihren Anbieter ein. Dies sind Schätzungen auf Basis branchenüblicher Margen.',
      'calc.vol.label':'Jährliches grenzüberschreitendes Zahlungsvolumen',
      'calc.ccy.label':'Währungspaar',
      'calc.fxcost.label':'Ihre aktuellen FX-Kosten',
      'calc.margin.hint':'Geschätzte Marge bei Ihrem Volumen:',
      'calc.margin.label':'Aufschlag des aktuellen Anbieters',
      'calc.pay.label':'Grenzüberschreitende Zahlungen pro Monat',
      'calc.pay.hint':'Wird verwendet, um Einsparungen bei Transaktionsgebühren zu schätzen (SWIFT, Lifting-, Begünstigtengebühren).',
      'calc.res.margins':'Einsparung bei FX-Aufschlägen',
      'calc.res.fees':'Einsparung bei Transaktionsgebühren',
      'calc.res.total':'Gesamte jährliche Einsparung',
      'calc.bar.title':'Jährlicher Kostenvergleich',
      'calc.bar.hp':'Mit HansePay',
      'calc.audit.cta':'Genaue Zahl ermitteln: Kostenloses FX-Audit anfordern',
      'calc.strip.h2':'Genaue Zahl mit einem <em>kostenlosen FX-Audit.</em>',
      'calc.strip.sub':'Wir analysieren Ihre tatsächlichen Transaktionsdaten und zeigen Ihnen die genaue jährliche Einsparung.',
      'calc.strip.cta':'Kostenloses FX-Audit anfordern',
      // tools-swift.html
      'swift.chip':'SWIFT / BIC-Suche',
      'swift.hero.h1':'Jeden SWIFT-Code finden, <em>sofort.</em>',
      'swift.hero.sub':'SWIFT/BIC-Codes nach Bankname, Land oder Code suchen. Kostenlos, keine Anmeldung.',
      'swift.search.ph':'Nach Bankname, Land, Stadt oder SWIFT-Code suchen…',
      'swift.footnote':'Diese Suche verwendet einen kuratierten Datensatz großer Banken. Für institutionelle Verwendung immer mit der Gegenparteibank verifizieren.',
      'swift.ref.eyebrow':'Referenz',
      'swift.anatomy.h2':'Aufbau eines SWIFT-Codes.',
      'swift.anatomy.intro':'Ein SWIFT/BIC-Code besteht aus 8 oder 11 Zeichen und identifiziert eine bestimmte Bank (und optional eine bestimmte Filiale) weltweit. Die ersten vier Zeichen sind der Bankcode, ein eindeutiges Kürzel für das Institut. Die nächsten zwei sind der ISO-Ländercode. Zwei weitere identifizieren den Standort der Zentrale. Die optionalen letzten drei identifizieren eine Filiale; fehlen sie, bezieht sich der Code auf die Hauptstelle.',
      'swift.anatomy.bank':'Bankcode',
      'swift.anatomy.country':'Ländercode',
      'swift.anatomy.location':'Standortcode',
      'swift.anatomy.branch':'Filialcode',
      'swift.cta.h2':'Bereit, Geld <em>über Grenzen zu senden?</em>',
      'swift.cta.sub':'Eröffnen Sie Ihr HansePay-Konto. Interbanken-Kurse, transparente Preise.',
      'swift.cta.conv':'Währungsrechner ausprobieren',
      // tools.html
      'tools.section.h2':'Vier Werkzeuge. Kein Paywall.',
      'tools.section.sub':'Für die kleinen täglichen Fragen beim internationalen Zahlungsverkehr: schnelle Prüfungen, transparente Kurse, keine Reibung.',
      'tools.card1.name':'FX-Sparrechner',
      'tools.card1.desc':'Schätzen Sie, wie viel Sie bei FX im Vergleich zu Ihrem aktuellen Anbieter sparen. Volumen, Währung und Anbietertyp eingeben. Jährliche Ersparnis in unter 30 Sekunden.',
      'tools.card2.name':'Währungsrechner',
      'tools.card2.desc':'Umrechnung in 30+ Währungen weltweit zu Live-Interbanken-Kursen. Echte Wechselkurse und historische Verläufe über 1W, 1M und 1J.',
      'tools.card3.name':'SWIFT / BIC-Suche',
      'tools.card3.desc':'SWIFT/BIC-Codes nach Bankname, Land, Stadt oder Code suchen. Kuratierter Datensatz von 50+ großen Banken weltweit, in Echtzeit durchsuchbar.',
      'tools.card4.name':'IBAN-Prüfer',
      'tools.card4.desc':'Jede IBAN validieren und die zugehörige Bank ermitteln. Prüft Format, Länge und Mod-97-Prüfsumme. Für deutsche IBANs werden Bankname, Stadt und BIC angezeigt.',
      // tools-converter.html
      'conv.diff.eyebrow':'Der Unterschied','conv.diff.chip':'Der Unterschied',
      'conv.diff.h2':'Was Banken Ihnen nicht zeigen.',
      'conv.diff.p1':'Der Interbanken-Kurs ist der Kurs, zu dem Banken untereinander handeln — der wahre Preis eines Währungspaares. Bei Überweisungen über Ihre Hausbank sehen Sie diesen Kurs fast nie. Stattdessen erhalten Sie einen schlechteren Kurs, in den der Bankaufschlag bereits eingerechnet ist. Dieser Spread ist echter Kostenaufwand — nur als Wechselkurs getarnt.',
      'conv.diff.p2':'HansePay beginnt beim Interbanken-Kurs und addiert einen klar ausgewiesenen Aufschlag. Der Kurs hier ist derselbe, von dem wir bei jeder Kursabgabe ausgehen.',
      // tools-iban.html
      'iban.hero.h1':'Jede IBAN validieren, <em>mit einem Klick.</em>',
      'iban.hero.sub':'Format prüfen, BIC extrahieren und Bankdaten für 77 Länder verifizieren.',
      'iban.field.label':'IBAN',
      'iban.field.ph':'DE89 3704 0044 0532 0130 00',
      'iban.empty':'IBAN eingeben, um sie zu validieren.',
      'iban.disclaimer':'Nur Formatprüfung. Ein gültiges Format garantiert nicht, dass die IBAN aktiv ist oder dem gewünschten Empfänger gehört. Empfängerdaten immer vor der Überweisung mit der Gegenpartei verifizieren.',
      'iban.ref.eyebrow':'Referenz',
      'iban.ref.h2':'Was wir prüfen.',
      'iban.ref.p1':'Jede IBAN beginnt mit einem zweistelligen Ländercode, gefolgt von zwei Prüfziffern und dem länderspezifischen Kontoidentifikator. Wir bestätigen, dass das Land anerkannt ist, die Länge dem Erwartungswert für dieses Land entspricht und die Prüfsumme stimmt.',
      'iban.ref.p2':'Für deutsche IBANs extrahieren wir die achtstellige Bankleitzahl und gleichen sie mit dem BLZ-Verzeichnis der Deutschen Bundesbank ab — mit Bankname, Stadt und BIC.',
      // events.html
      'events.hero.h1':'Wo Sie uns <em>diese Saison finden.</em>',
      'events.section.h2':'Noch keine Veranstaltungen geplant.',
      'events.section.sub':'Wir finalisieren unseren Konferenz- und Messekalender für 2026. Schauen Sie bald wieder vorbei oder registrieren Sie sich unten für eine Benachrichtigung.',
      'events.notify.h2':'Benachrichtigt werden, wenn Veranstaltungen angekündigt werden.',
      'events.notify.sub':'Hinterlassen Sie Ihre Daten und wir informieren Sie per E-Mail, wenn wir den nächsten Veranstaltungsplan veröffentlichen.',
      'events.notify.email.label':'Geschäftliche E-Mail',
      'events.notify.email.ph':'sie@unternehmen.de',
      'events.notify.name.label':'Ihr Name',
      'events.notify.name.ph':'Vorname',
      'events.notify.btn':'Benachrichtigen',
      'events.final.h2':'Eröffnen Sie in der Zwischenzeit Ihr Konto.',
      'events.final.sub':'Starten Sie noch heute mit grenzüberschreitenden Überweisungen. Kein Mindestvolumen.',
      // insights-stories.html
      'stories.hero.h1':'Echte Kunden. <em>Echte Ergebnisse.</em>',
      'stories.prep.label':'Geschichten, die wir vorbereiten',
      'stories.prep.h2':'Die Art von Unternehmen, für die wir <em>bauen.</em>',
      'stories.prep.sub':'Jede Geschichte folgt demselben Muster: eine echte FX-Herausforderung und wie der Wechsel zu HansePay die Zahlen verändert hat.',
      'stories.card1.label':'E-Commerce · Hamburg',
      'stories.card1.h3':'Sechsstellige jährliche FX-Kosten, im ersten Jahr halbiert.',
      'stories.card1.p':'Ein Mehrkanaleinzelhändler, der aus Asien und Südostasien importierte, verlor 2,8 % bei jeder Lieferantenzahlung. Nach dem Wechsel zu HansePay erholten sich die Margen und die Lieferantenbeziehungen verbesserten sich.',
      'stories.card2.label':'Produktion · Bayern',
      'stories.card2.h3':'Abwicklung von Tagen auf Minuten bei Industrieaufträgen.',
      'stories.card2.p':'Ein Mittelstandsunternehmen, das jährlich über 4 Mio. € an US- und japanische Lieferanten sendete, verkürzte die Abwicklungszeit von drei Tagen auf Minuten — ohne Änderungen an Bankbeziehungen.',
      'stories.card3.label':'Logistik · Bremen',
      'stories.card3.h3':'Treasury über 12 Währungen konsolidiert, ohne IT-Projekt.',
      'stories.card3.p':'Ein Spediteur, der 12 aktive Währungskorridore verwaltete, brachte alle FX-Ausführungen auf eine Plattform. Die Monatsabschluss-Abstimmungszeit sank von drei Tagen auf einen halben Tag.',
      // insights-market.html
      'market.hero.h1':'Währungsanalyse, <em>wöchentlich geliefert.</em>',
      'market.hero.sub':'Kurze, praxisnahe Einblicke zu den Währungsbewegungen, die für Unternehmen in Europa und darüber hinaus relevant sind. Kein Lärm, keine Prognosespiele — nur das, was Sie brauchen, um diese Woche bessere Zahlungsentscheidungen zu treffen.',
      'market.cta1':'Frühen Zugang erhalten',
      'market.cta2':'Währungsrechner ausprobieren',
      'market.topics.label':'Themen, die wir behandeln',
      'market.topics.h2':'Die Märkte, die <em>für Sie wichtig sind.</em>',
      'market.topics.sub':'Für den Finanzleiter und CFO eines mittelständischen Unternehmens geschrieben — nicht für Händler.',
      'market.card1.h3':'EUR/USD-Bewegungen',
      'market.card1.p':'Was aktuelle Dollar-Stärke oder -Schwäche für Ihre US-Lieferantenrechnungen bedeutet und wie Sie reagieren, ohne zu spekulieren.',
      'market.card2.h3':'Schwellenmarkt-Korridore',
      'market.card2.p':'Türkei, Indien, Vietnam, Mexiko — die Korridore, die Mittelstands-Lieferketten dominieren und am schwierigsten zu bepreisen sind.',
      'market.card3.h3':'Was die EZB tut',
      'market.card3.p':'Zinsentscheidungen und ihre praktische Auswirkung auf EUR-Paare — ohne Ökonomen-Jargon, mit der Unternehmensimplikation im Vordergrund.',
      'market.card4.h3':'Praxisnahes Treasury',
      'market.card4.p':'FX-Richtlinien, Hedging-Grundlagen und Treasury-Struktur — für den Finanzleiter geschrieben, der handeln, nicht studieren muss.',
      // about-licenses.html
      'licenses.hero.h1':'Lizenziert, <em>wo es zählt.</em>',
      'licenses.eu.eyebrow':'Europäisch von Grund auf',
      'licenses.eu.h2':'Dort gebaut, wo die Aufsicht <em>ist.</em>',
      'licenses.eu.body':'HansePay liegt vollständig innerhalb des europäischen Regulierungsrahmens. Die Lizenz ist europäisch. Die Aufsicht ist europäisch. Die Daten liegen in Europa.',
      'licenses.grid.eyebrow':'Lizenzen und Compliance',
      'licenses.grid.h2':'Benannt. Verifiziert. <em>Geprüft.</em>',
      'licenses.card1.title':'Europäische MiCAR-Lizenz',
      'licenses.card1.body':'Autorisiert gemäß der Verordnung über Märkte für Kryptowerte — dem strengsten Rahmen für digitales Geld in der Europäischen Union.',
      'licenses.card2.title':'BaFin-Aufsicht',
      'licenses.card2.body':'Von der BaFin, der deutschen Bundesanstalt für Finanzdienstleistungsaufsicht, genehmigt. Direkte deutsche Aufsicht auf europäischer Lizenz.',
      'licenses.card3.title':'DSGVO',
      'licenses.card3.body':'Konformer Umgang mit Daten gemäß EU-Verordnung 2016/679. Daten werden innerhalb der EU gespeichert und verarbeitet.',
      'licenses.card4.title':'ISO 27001',
      'licenses.card4.body':'Zertifiziertes Informationssicherheits-Managementsystem. Unabhängige Prüfung in regelmäßigem Turnus.',
      // blog.html
      'blog.hero.h1':'FX-Wissen, das Ihr Unternehmen voranbringt.',
      'blog.filter.all':'Alle','blog.filter.edu':'FX-Grundlagen','blog.filter.treasury':'Treasury','blog.filter.compliance':'Compliance','blog.filter.market':'Marktanalyse',
      'blog.loading':'Beiträge werden geladen…',
      'blog.latest':'Neueste Artikel',
      'blog.error':'Beiträge konnten nicht geladen werden. Bitte Seite neu laden.',
      // about-history.html
      'history.eyebrow':'Geschichte',
      'history.hero.h1':'Auf <em>drei Säulen</em> aufgebaut.',
      'history.hero.sub':'HansePay entstand nicht über Nacht. Es ist die kommerzielle Marke einer regulierten Struktur, die sorgfältig in zwei Rechtsordnungen aufgebaut wurde.',
      'history.corp.eyebrow':'Unternehmensstruktur',
      'history.corp.h2':'Drei Einheiten, <em>eine Plattform.</em>',
      'history.milestones.eyebrow':'Meilensteine',
      'history.milestones.h2':'Wichtige <em>Momente.</em>',
      'history.m1.text':'Gründung der Caplend GmbH',
      'history.m2.text':'Gründung der Caplend Technologies GmbH',
      'history.m3.text':'MiCAR-Autorisierung nach EU-Recht erteilt',
      'history.m4.text':'BaFin-grenzüberschreitende Notifizierung wirksam',
      'history.m5.text':'HansePay-Plattform-Launch',
      // platform-security.html
      'sec.chip':'Sicherheit',
      'sec.hero.h1':'Jede Überweisung, <em>sicher auf jedem Schritt.</em>',
      'sec.hero.sub':'Bewegen Sie Geld sicher über Grenzen — mit mehrschichtigem Schutz, der in die Plattform integriert ist.',
      'sec.overview.eyebrow':'Übersicht','sec.overview.h2':'Sicherheit, standardmäßig eingebaut.',
      'sec.overview.sub':'Sicherheit zeigt sich überall auf der Plattform — vom Login bis zur Verwahrung Ihrer Gelder.',
      'sec.2fa.eyebrow':'Authentifizierung','sec.2fa.h2':'Jede kritische Aktion bestätigen.',
      'sec.2fa.body':'Starke Zwei-Faktor-Authentifizierung schützt Login, Transaktionen, Devisengeschäfte, Begünstigtenanlage und Benutzeraktivierung.',
      'sec.session.eyebrow':'Sitzungsüberwachung','sec.session.h2':'Jeden Login sehen. Jede Sitzung widerrufen.',
      'sec.session.body':'Verbundene Geräte, Login-Zeitstempel, Standorte und Browserdetails in Ihrem Konto sichtbar. Ungewöhnliche Zugriffe erkennen und sofort widerrufen.',
      'sec.bene.eyebrow':'Begünstigtenprüfung','sec.bene.h2':'Empfängerdetails bestätigen, bevor Geld bewegt wird.',
      'sec.bene.body':'Empfängerdetails werden gegen die Unterlagen der Empfängerbank geprüft. Name- und Kontonummer-Abweichungen werden sofort angezeigt.',
      'sec.data.eyebrow':'Datenschutz','sec.data.h2':'Daten verschlüsselt, in Transit und im Ruhezustand.',
      'sec.data.body':'Alle sensiblen Daten verschlüsselt, in Transit und im Ruhezustand. ISO 27001 zertifiziert, DSGVO-konform.',
      'sec.trust.eyebrow':'Ein Partner, dem Sie vertrauen können','sec.trust.h2':'Sicher und zuverlässig vor allem.',
      'sec.trust.intro':'Vier Grundlagen, auf denen die Plattform aufgebaut ist. Jede dokumentiert, geprüft und verifizierbar.',
      'sec.trust.c1.title':'Reguliert von Grund auf','sec.trust.c1.body':'MiCAR-autorisiert nach EU-Recht, beaufsichtigt von der BaFin.',
      'sec.trust.c2.title':'Direkter Support','sec.trust.c2.body':'Gründergeführt. Namentlicher Händler mit echter Telefonnummer für institutionelle Kunden.',
      'sec.trust.c3.title':'Sicherheit auf Unternehmensniveau','sec.trust.c3.body':'ISO 27001 zertifiziertes ISMS, DSGVO-konform, unabhängig geprüft.',
      'sec.trust.c4.title':'Gesicherte Gelder','sec.trust.c4.body':'Kundenguthaben bei Tier-1-Europäischen Banken separiert. Geschützt gemäß MiCAR Artikel 75.',
      'sec.faq.eyebrow':'FAQ','sec.faq.h2':'Häufige Fragen zur Sicherheit.',
      'sec.faq1.q':'Was passiert mit meinem Geld, wenn HansePay insolvent wird?','sec.faq1.a':'Kundenguthaben liegen in separaten Konten, nach MiCAR Artikel 75 geschützt und zum Nennwert zurückzugeben.',
      'sec.faq2.q':'Werden meine Daten innerhalb der EU gespeichert?','sec.faq2.a':'Ja. Alle Daten werden innerhalb der EU gespeichert und verarbeitet, vollständig DSGVO-konform.',
      'sec.faq3.q':'Wie authentifiziert HansePay Nutzer?','sec.faq3.a':'Starke 2FA für Login und alle kritischen Aktionen: Transaktionen, Devisengeschäfte, Begünstigtenanlage.',
      'sec.faq4.q':'Wer reguliert HansePay?','sec.faq4.a':'MiCAR-autorisiert nach EU-Recht, beaufsichtigt von der BaFin in Deutschland.',
      'sec.faq5.q':'Welche Zertifizierungen hat HansePay?','sec.faq5.a':'ISO 27001 für Informationssicherheit, DSGVO-Compliance, unabhängige Prüfungen.',
      'sec.cta.h2':'Bereit, Geld <em>mit Zuversicht zu bewegen?</em>',
      'sec.cta.sub':'Konto in Minuten eröffnen. Kein Mindestvolumen.',
      // about-history.html entity cards
      'history.entity1.name':'Caplend GmbH',
      'history.entity1.desc':'Deutsche Holding-Gesellschaft. Mit Sitz in Hamburg, dem historischen Zentrum der Hanse, wo der moderne grenzüberschreitende Handel seine Wurzeln hat.',
      'history.entity2.name':'Caplend Technologies GmbH',
      'history.entity2.desc':'MiCAR-autorisiert nach EU-Recht. Die rechtliche Gegenpartei für alle FX- und Zahlungsdienstleistungen.',
      'history.entity3.name':'HansePay',
      'history.entity3.desc':'Die Handelsmarke. Die Plattform, die Unternehmen täglich nutzen, um Geld über Grenzen zu bewegen.',
      // global CTA strip
      'cta.strip.h2':'Eröffnen Sie Ihr Konto.',
      'cta.strip.sub':'Starten Sie in Minuten mit Überweisungen oder sprechen Sie mit uns über Ihren Anwendungsfall.',
      'gs.cta.primary':'Geschäftskonto eröffnen',
      'gs.cta.secondary':'Mit einem Spezialisten sprechen',
      // events.html CTAs
      'events.cta.get-notified':'Benachrichtigt werden',
      'events.cta.meet-team':'Team kennenlernen',
      // tools.html eyebrow
      'tools.section.eyebrow':'Was verfügbar ist',
      // partners-refer.html full key set
      'pr.offer.eyebrow':'Was Sie Ihren Kunden anbieten können',
      'pr.offer.h2':'Eine regulierte EU-Alternative zu Bank-FX.',
      'pr.offer.card1.title':'MiCAR-lizenziert, EU-beaufsichtigt',
      'pr.offer.card1.body':'BaFin-reguliert und MiCAR-autorisiert nach EU-Recht. Gleicher Rechtsrahmen wie eine Bankeinlage, moderne Mechanismen darunter.',
      'pr.offer.card2.title':'Typischerweise 60 bis 80 Prozent niedrigere FX-Kosten',
      'pr.offer.card2.body':'Institutionelle Kurse mit vollständiger Spread-Transparenz. FX-Spreads ab 0,15 % auf Hauptwährungen, gegenüber 1 bis 3 % bei Filialbanken.',
      'pr.offer.card3.title':'Abwicklung in Sekunden, nicht Tagen',
      'pr.offer.card3.body':'On-Chain-EMT-Abwicklung läuft kontinuierlich, auch außerhalb der Bankzeiten. Keine SWIFT-Verzögerungen, kein T+2-Warten.',
      'pr.how.eyebrow':'So funktioniert die Empfehlung',
      'pr.how.h2':'Ein Programm, das dazu passt, wie Berater tatsächlich arbeiten.',
      'pr.step1.title':'Sie stellen uns vor',
      'pr.step1.body':'Sie machen eine persönliche Einführung, wenn ein Mandant einen FX- oder grenzüberschreitenden Zahlungsbedarf äußert. Den Rest übernehmen wir.',
      'pr.step2.title':'Ihr Mandant erhält bevorzugtes Onboarding',
      'pr.step2.body':'Durch einen Berater empfohlene Mandanten erhalten dedizierten Onboarding-Support, schnellere Kontoeinrichtung und einen direkten Draht zu unserem Team in den ersten Monaten.',
      'pr.step3.title':'Sie bleiben im Bilde',
      'pr.step3.body':'Wir liefern monatliche Berichte über empfohlene Mandanten (mit Zustimmung), Standardformat-Exporte und einen strukturierten Weg zur Sichtbarkeit der FX-Aktivität.',
      'pr.why.eyebrow':'Warum Berater HansePay empfehlen',
      'pr.why.h2':'Gebaut, um Ihre Arbeit einfacher zu machen, nicht schwerer.',
      'pr.why.card1.title':'Regulatorische Klarheit',
      'pr.why.card1.body':'MiCAR-lizenziert, BaFin-passportiert, revisionssicher. Der Wirtschaftsprüfer Ihres Mandanten wird Ihnen für den Rahmen danken.',
      'pr.why.card2.title':'Saubere Berichte und Exporte',
      'pr.why.card2.body':'Standardformat-Exporte, transaktionsgenaue Daten, revisionssichere Auszüge. Weniger Zeit mit PDFs, mehr Zeit für die eigentliche Arbeit.',
      'pr.why.card3.title':'Wir konkurrieren nicht um Ihre Mandanten',
      'pr.why.card3.body':'Wir verkaufen keine Steuer-, Buchhaltungs-, Prüfungs- oder Beratungsdienstleistungen. Ihre Mandantenbeziehung bleibt genau dort, wo sie ist.',
      'pr.why.card4.title':'Direkter Draht zu unserem Team',
      'pr.why.card4.body':'Wenn Sie einen Mandanten empfehlen, erhalten Sie einen namentlichen Ansprechpartner. Probleme eskalieren schnell. Keine Support-Ticket-Warteschlangen.',
      'pr.examples.eyebrow':'Beispiele',
      'pr.examples.h2':'Wo Berater auf uns hinweisen.',
      'pr.ex1.label':'Steuerberater',
      'pr.ex1.title':'Jahresabschluss deckt FX-Verluste auf',
      'pr.ex1.body':'Ein Jahresabschluss bringt sechsstellige Währungsverluste aus grenzüberschreitenden Lieferantenzahlungen ans Licht. Der Berater empfiehlt HansePay als regulierte EU-Alternative für die nächsten Zahlungsflüsse. Die Verluste sinken.',
      'pr.ex2.label':'Wirtschaftsprüfer',
      'pr.ex2.title':'Treasury-Struktur im Audit beanstandet',
      'pr.ex2.body':'Ein Audit identifiziert eine fragmentierte Treasury-Struktur über drei Bankpartner und vier Währungen. Der Prüfer stellt HansePay zur Konsolidierung ohne zusätzliches Bankrisiko vor. Der Prüf-Fußabdruck des Mandanten schrumpft.',
      'pr.ex3.label':'M&A-Berater',
      'pr.ex3.title':'Carve-out benötigt FX-Infrastruktur',
      'pr.ex3.body':'Ein Carve-out hinterlässt ein neu eigenständiges Unternehmen ohne die Treasury-Funktion der Muttergesellschaft. Der M&A-Berater empfiehlt HansePay als regulierten FX-Layer, der in Wochen einsatzbereit ist.',
      'pr.faq.eyebrow':'FAQ',
      'pr.faq.h2':'Was Berater zuerst fragen.',
      'prs.faq.eyebrow':'FAQ',
      'prs.faq.h2':'Was Partner zuerst fragen.',
      // partners pages
      'pp.hero.chip':'Partner · Mit uns partnern',
      'pp.hero.h1':'Drei Partnerschaftsmodelle. Ein Gespräch zum Start.',
      'pp.hero.sub':'Wir arbeiten mit Software-Plattformen, Beratern und Resellern zusammen, um besseres FX für mittelständische Unternehmen in Europa zu bringen. Jede Partnerschaft wird individuell gestaltet.',
      'pp.stat1.val':'MiCAR','pp.stat2.val':'<10 Sek.','pp.stat3.val':'0,10 %','pp.stat4.val':'45+',
      'pp.ways.card1.title':'Zahlungen einbetten',
      'pp.ways.card1.body':'Für Software-Plattformen und ERPs. FX und grenzüberschreitende Zahlungen in Ihr Produkt integrieren — ohne eine Bank aufzubauen.',
      'pp.ways.card1.link':'Über Embed lesen',
      'pp.ways.card2.title':'Mandanten empfehlen',
      'pp.ways.card2.body':'Für Steuerberater und Consultants. Bringen Sie Ihren Mandanten besseres FX. Verdienen Sie an der Einführung.',
      'pp.ways.card2.link':'Über Refer lesen',
      'pp.ways.card3.title':'An Ihr Netzwerk weiterverkaufen',
      'pp.ways.card3.body':'Für Agenturen und White-Label-Partner. Reguliertes FX an Ihre Kundenbasis vertreiben.',
      'pp.ways.card3.link':'Über Resell lesen',
      'pp.step1.num':'01','pp.step2.num':'02','pp.step3.num':'03',
      'pp.form.heading':'Kontakt aufnehmen',
      'pp.form.sub':'Erzählen Sie uns von Ihrem Unternehmen und wie Sie zusammenarbeiten möchten. Wir antworten innerhalb von zwei Werktagen.',
      'pp.form.label.name':'Name','pp.form.label.company':'Unternehmen',
      'pp.form.label.email':'E-Mail','pp.form.label.type':'Partnerschaftstyp',
      'pp.form.label.message':'Erzählen Sie uns von Ihrem Unternehmen',
      'pp.form.opt.select':'Bitte auswählen',
      'pp.form.opt.embed':'Zahlungen einbetten','pp.form.opt.refer':'Mandanten empfehlen',
      'pp.form.opt.resell':'An Netzwerk weiterverkaufen','pp.form.opt.unsure':'Noch unsicher',
      'pp.form.submit':'Nachricht senden',
      'pp.form.note':'Mit dem Absenden stimmen Sie zu, von HansePay kontaktiert zu werden. Wir antworten innerhalb von zwei Werktagen.',
      'pp.stat1.cap':'EU-lizenziert unter dem neuen Rahmen','pp.stat2.cap':'Abwicklungszeiten',
      'pp.stat3.cap':'durchschnittlicher FX-Spread','pp.stat4.cap':'Märkte weltweit',
      'pp.why.eyebrow':'Warum mit uns partnern',
      'pp.card1.title':'MiCAR-lizenzierte Infrastruktur',
      'pp.card1.body':'Regulatorische Arbeit erledigt. Ihre Kunden erhalten einen regulierten EU-Service, ohne dass Sie die Compliance-Last tragen.',
      'pp.card2.title':'Mittelstands-Fokus, bewusst gewählt',
      'pp.card2.body':'Wir konkurrieren nicht um Ihre KMU- oder Großkunden. Wir arbeiten dort, wo der Mittelstand FX-technisch unterversorgt ist.',
      'pp.card3.title':'Moderner Stack, kein Legacy-Ballast',
      'pp.card3.body':'On-Chain-Abwicklung, atomares FX, keine SWIFT-Verzögerungen. In diesem Jahrzehnt gebaut.',
      'pp.card4.title':'Gründergeführte Partnerschaften',
      'pp.card4.body':'Direkter Draht zum Team. Individuelle Deals. Entscheidungen in Tagen, nicht Quartalen.',
      'pp.ways.eyebrow':'Drei Partnerschaftsmodelle',
      'pp.how.eyebrow':'So funktioniert es',
      'pp.step1.title':'Erzählen Sie uns von sich','pp.step1.body':'Nutzen Sie das Formular unten, um Ihr Unternehmen und die gewünschte Partnerschaft zu beschreiben.',
      'pp.step2.title':'Wir melden uns','pp.step2.body':'Unser Partnerships Manager antwortet innerhalb von zwei Werktagen.',
      'pp.step3.title':'Wir gestalten einen Deal','pp.step3.body':'Jede Partnerschaft wird individuell zugeschnitten. Provision, Integrationstiefe und Support auf beide Seiten abgestimmt.',
      'pr.hero.h1':'Ihre Kunden haben ein FX-Problem. Wir haben die Lösung.',
      'pr.situation.eyebrow':'Die Situation','pr.situation.h2':'Das kennen Sie.',
      'pe.hero.h1':'FX in Ihre Plattform integrieren — ohne eine Bank aufzubauen.',
      'pe.problem.eyebrow':'Das Problem','pe.problem.h2':'FX hinzuzufügen ist schwieriger als es aussieht.',
      'pe.embed.eyebrow':'Was Sie einbetten können','pe.embed.h2':'Vier Funktionen, eine Integration.',
      'pe.embed.card1.title':'Benannte EUR-Konten',
      'pe.embed.card1.body':'Stellen Sie Ihren Kunden benannte EUR-Konten unter Ihrer Marke aus, um Zahlungen zu empfangen und zu senden. Gelder werden in segregierten Konten bei Tier-1-Europäischen Banken gehalten.',
      'pe.embed.card2.title':'FX-Ausführung',
      'pe.embed.card2.body':'FX zu institutionellen Kursen mit vollständiger Spread-Transparenz ausführen. Atomare Abwicklung, keine T+2-Verzögerungen.',
      'pe.embed.card3.title':'Grenzüberschreitende Zahlungen',
      'pe.embed.card3.body':'Zahlungen über 45+ Märkte weltweit über eine einzelne API senden und empfangen. Auszahlungen in Sekunden abgewickelt, nicht in Tagen.',
      'pe.embed.card4.title':'EMT-Ausgabe',
      'pe.embed.card4.body':'MiCAR-regulierte E-Geld-Token für programmierbare Abwicklung und On-Chain-Treasury-Operationen ausgeben. Gleicher Rechtsrahmen wie eine Bankeinlage, moderne Mechanismen.',
      'pe.how.eyebrow':'So funktioniert es','pe.how.h2':'Sie bauen das Produkt. Wir verwalten die Infrastruktur.',
      'pe.why.eyebrow':'Warum HansePay einbetten','pe.why.h2':'Für Plattformen gebaut, nicht für Banken.',
      'pe.why.card1.title':'EU-nativ, MiCAR-lizenziert',
      'pe.why.card1.body':'BaFin-reguliert und MiCAR-autorisiert nach EU-Recht. Ihre Kunden erhalten einen regulierten EU-Service. Sie tragen nicht die Compliance-Last.',
      'pe.why.card2.title':'Eine Integration, alle Funktionen',
      'pe.why.card2.body':'Grenzüberschreitende Zahlungen, FX und EMT-Ausgabe über eine einzelne API-Oberfläche. Funktionen über die Zeit hinzufügen ohne Re-Integration.',
      'pe.why.card3.title':'Moderner Stack, kein Legacy-Ballast',
      'pe.why.card3.body':'On-Chain-Abwicklung, atomares FX, keine SWIFT-Verzögerungen. In diesem Jahrzehnt gebaut, nicht über vier zusammengeflickt.',
      'pe.why.card4.title':'Gründergeführte Integration',
      'pe.why.card4.body':'Sie arbeiten direkt mit unserem Team. Individuelle Konditionen, dedizierter technischer Support während der Integration, Entscheidungen in Tagen, nicht Quartalen.',
      'pe.examples.eyebrow':'Beispiele','pe.examples.h2':'Drei Muster, die wir am häufigsten sehen.',
      'pe.ex1.label':'ERP- und Buchhaltungsplattformen',
      'pe.ex1.title':'Grenzüberschreitende Zahlungen im Workflow',
      'pe.ex1.body':'Ihre Kunden führen Kreditoren und Debitoren in Ihrem Produkt. FX und grenzüberschreitende Zahlungen hinzuzufügen bedeutet: keine Weiterleitung an Wise, ein Bankportal oder ein Treasury-Tool. Rechnungen rein, Zahlungen raus — an einem Ort.',
      'pe.ex2.label':'Marktplätze',
      'pe.ex2.title':'Grenzüberschreitende Abwicklung an Verkäufer',
      'pe.ex2.body':'Verkäufer in der EU möchten in ihrer Landeswährung bezahlt werden. Käufer in ihrer. FX und benannte Konten einbetten, und Sie wickeln auf beiden Seiten ab — ohne margenstrippende Vermittler.',
      'pe.ex3.label':'Fintechs und Embedded Finance',
      'pe.ex3.title':'Regulierte Infrastruktur unter Ihrer Marke',
      'pe.ex3.body':'Sie haben den Kunden, die Marke und das Produkt. Sie wollen kein Zahlungsinstitut werden. HansePay liegt darunter, MiCAR-lizenziert, sodass Ihr Angebot reguliert ist, ohne dass Sie den Regulierungsbetrieb führen.',
      'pe.faq.eyebrow':'FAQ','pe.faq.h2':'Was Partner zuerst fragen.',
      // partners-resell.html
      'prs.opp.eyebrow':'Die Chance','prs.opp.h2':'Ihr Netzwerk sieht das täglich.',
      'prs.offer.eyebrow':'Was Sie Ihrem Netzwerk anbieten können',
      'prs.offer.h2':'Ein regulierter EU-Service, zu Hause vertraut.',
      'prs.offer.card1.title':'MiCAR-lizenziert, EU-beaufsichtigt',
      'prs.offer.card1.body':'BaFin-reguliert und MiCAR-autorisiert nach EU-Recht. Gleicher Rechtsrahmen wie eine Bankeinlage.',
      'prs.offer.card2.title':'Typischerweise 60 bis 80 Prozent niedrigere FX-Kosten',
      'prs.offer.card2.body':'Institutionelle Kurse mit vollständiger Spread-Transparenz. FX-Spreads ab 0,15 % auf Hauptwährungen, gegenüber 1 bis 3 % bei Filialbanken.',
      'prs.offer.card3.title':'Abwicklung in Sekunden',
      'prs.offer.card3.body':'On-Chain-EMT-Abwicklung läuft kontinuierlich, auch außerhalb der Bankzeiten. Keine SWIFT-Verzögerungen, kein T+2-Warten.',
      'prs.offer.card4.title':'Made in Germany, Sitz in Hamburg',
      'prs.offer.card4.body':'In Hamburg gebaut, für den deutschen Mittelstand konzipiert. Das vertrauenswürdige Gesicht auf regulierten EU-Rails.',
      'prs.how.eyebrow':'So funktioniert die Partnerschaft',
      'prs.how.h2':'Ein Programm, das mit unseren ersten Partnern gestaltet wird.',
      'prs.step1.title':'Erzählen Sie uns von Ihrem Netzwerk',
      'prs.step1.body':'Sie schildern uns, wer Ihre Mitglieder oder Kunden sind und welche FX-Bedürfnisse Sie bei ihnen beobachtet haben. Wir hören zu und lernen.',
      'prs.step2.title':'Wir gestalten einen passenden Deal',
      'prs.step2.body':'Konditionen, Branding-Modell und Rollout-Plan werden auf Ihr Netzwerk abgestimmt. HansePay-gebrandetes Weiterverkaufen, Co-Branding ("powered by HansePay") oder zukünftiges White-Label.',
      'prs.step3.title':'Wir launchen gemeinsam',
      'prs.step3.body':'Sie stellen vor, wir übernehmen Compliance und Onboarding, Ihr Netzwerk erhält einen regulierten EU-FX-Service. Gründerteam-Support während des gesamten Rollouts.',
      'prs.why.eyebrow':'Warum mit HansePay partnern',
      'prs.why.h2':'Regulierte Infrastruktur, vertrauenswürdige Marke.',
      'prs.why.card1.title':'Regulierte EU-Infrastruktur',
      'prs.why.card1.body':'Europäische MiCAR-Lizenz, von der BaFin genehmigt. Ihr Netzwerk erhält einen regulierten Service, ohne dass Sie eine Zahlungslizenz benötigen.',
      'prs.why.card2.title':'Made in Germany, Hamburger Vertrauen',
      'prs.why.card2.body':'Eine deutsche Marke, aufgebaut auf hanseatischem Handelserbe. Der Name, dem Ihre Mitglieder und Kunden bereits vor dem Gespräch vertrauen.',
      'prs.why.card3.title':'Drei kommerzielle Modelle',
      'prs.why.card3.body':'HansePay-gebrandetes Weiterverkaufen, Co-Branding-Partnerschaften ("powered by HansePay") und vollständiges White-Label auf der Roadmap.',
      'prs.why.card4.title':'Gründergeführte Partnerschaften',
      'prs.why.card4.body':'Direkter Draht zu den Gründern, individuelle Konditionen, Entscheidungen in Tagen. Das Programm wird mit Ihnen gestaltet, nicht vorgegeben.',
      'prs.examples.eyebrow':'Beispiele','prs.examples.h2':'Drei Muster, die wir am häufigsten sehen.',
      'prs.examples.sub':'Wo Netzwerke und Reseller HansePay wertvoll finden.',
      'prs.ex1.label':'Regionalbank',
      'prs.ex1.title':'Co-gebrandetes FX für KMU-Kunden',
      'prs.ex1.body':'Die mittelständischen Kunden einer Regionalbank zahlen Lieferanten in Asien und verlieren 2 % bei jeder Überweisung. Die Bank kann bei FX-Kursen nicht mit Neobanken mithalten. Mit HansePay co-gebrandetbietet die Bank einen regulierten FX-Service, behält die Kundenbeziehung und fügt Marge hinzu, ohne Zahlungsinfrastruktur aufzubauen.',
      'prs.ex2.label':'Branchenverband',
      'prs.ex2.title':'Vorzugsservice für Mitglieder',
      'prs.ex2.body':'Ein deutscher Branchenverband vertritt 800 mittelständische Exporteure. Mitglieder fragen regelmäßig nach Orientierung bei grenzüberschreitenden Zahlungen. Der Verband partnert mit HansePay, um bevorzugtes Onboarding und Kurse anzubieten — ohne Zahlungsregulierung zu übernehmen.',
      'prs.ex3.label':'Buchhaltungssoftware-Anbieter',
      'prs.ex3.title':'Co-gebrandetes Onboarding ohne Engineering',
      'prs.ex3.body':'Ein regionaler Buchhaltungssoftware-Anbieter möchte kein FX in sein Produkt integrieren. Der Anbieter partnert mit HansePay, um Kunden einen co-gebrandeten Onboarding-Pfad anzubieten — grenzüberschreitende Zahlungen im Customer Journey ohne Engineering-Investment.',
      // blog.html CTA + pagination
      'blog.cta.eyebrow':'Bereit, das Gelesene in die Tat umzusetzen?',
      'blog.cta.heading':'Geld zum Kurs bewegen, der zählt.',
      'blog.cta.primary':'Einsparung berechnen',
      'blog.cta.secondary':'Mit einem Spezialisten sprechen',
      'blog.pag.prev':'← Zurück','blog.pag.next':'Weiter →',
      // licenses.html IDs
      'licenses.card1.id':'Lizenznummer [TBD]',
      'licenses.card2.id':'Referenz [TBD]',
      // global CTAs
      'gs.cta1':'Geschäftskonto eröffnen','gs.cta2':'Mit einem Spezialisten sprechen',
      'cta.explore-solutions':'Lösungen erkunden',
      'prs.hero.h1':'Reguliertes FX in Ihr Netzwerk bringen.',
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
