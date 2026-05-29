(function(){
  // 1. Inject footer CSS into <head>
  if (!document.getElementById('hp-footer-css')) {
    var st = document.createElement('style');
    st.id = 'hp-footer-css';
    st.textContent = `
/* ── FOOTER ── */
footer{background:#060D1A;padding:96px 0 48px;border-top:1px solid rgba(255,255,255,.07)}
.footer-grid{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:64px;margin-bottom:80px}
@media(max-width:900px){.footer-grid{grid-template-columns:1fr 1fr;gap:48px}}
@media(max-width:560px){.footer-grid{grid-template-columns:1fr}}
.footer-logo{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.footer-logo img{height:28px;width:28px;object-fit:contain}
.footer-logo-text{font-family:var(--font-logo);font-size:18px;font-weight:400;color:#fff;letter-spacing:-.02em}
.footer-tagline{font-size:13px;color:rgba(255,255,255,.45);line-height:1.6;max-width:240px;margin-bottom:12px}
.footer-legal{font-size:11px;color:rgba(255,255,255,.25);line-height:1.6}
.footer-col-title{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#fff;margin-bottom:20px}
.footer-links{list-style:none;display:flex;flex-direction:column;gap:10px}
.footer-link{font-size:13px;color:rgba(255,255,255,.45);transition:color .15s}.footer-link:hover{color:rgba(255,255,255,.9)}
.footer-hr{height:1px;background:rgba(255,255,255,.07);margin-bottom:28px}
.footer-bottom{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px}
.footer-copy{font-size:12px;color:rgba(255,255,255,.25)}
.bafin-badge{display:inline-flex;align-items:center;gap:6px;font-size:11px;color:rgba(255,255,255,.35);padding:5px 12px;border:1px solid rgba(255,255,255,.1);border-radius:var(--r-pill)}
.bafin-badge svg{width:12px;height:12px;color:var(--n200)}
.footer-social{display:inline-flex;align-items:center;gap:8px}
.footer-social-link{display:inline-flex;align-items:center;gap:6px;font-size:11px;color:rgba(255,255,255,.35);transition:color .15s;text-decoration:none}.footer-social-link:hover{color:rgba(255,255,255,.75)}
.footer-social-link svg{width:14px;height:14px}
@media(max-width:768px){footer{padding:64px 0 36px}.footer-grid{margin-bottom:48px;gap:36px}}
`;
    document.head.appendChild(st);
  }

  // 2. Inject footer HTML
  var FOOTER_HTML = `
<footer>
  <div class="container">
    <div class="footer-grid">
      <div>
        <div class="footer-logo"><img src="assets/hansepay-mark-uploaded-white.png" alt="HansePay" /><span class="footer-logo-text">HansePay</span></div>
        <p class="footer-tagline">Commercial FX, made in Hamburg.</p>
        <p class="footer-legal">&#169; 2026 Caplend Technologies GmbH<br>HansePay is a brand of Caplend Technologies GmbH</p>
      </div>
      <div>
        <div class="footer-col-title">Platform</div>
        <ul class="footer-links">
          <li><a class="footer-link" href="platform.html">Overview</a></li>
          <li><a class="footer-link" href="platform-technology.html">Technology</a></li>
          <li><a class="footer-link" href="platform-security.html">Security</a></li>
          <li><a class="footer-link" href="tools.html">Tools</a></li>
          <li><a class="footer-link" href="tools-calculator.html">FX Calculator</a></li>
          <li><a class="footer-link" href="tools-converter.html">Currency Converter</a></li>
        </ul>
      </div>
      <div>
        <div class="footer-col-title">Company</div>
        <ul class="footer-links">
          <li><a class="footer-link" href="about-vision.html">Vision &amp; Values</a></li>
          <li><a class="footer-link" href="about-history.html">History</a></li>
          <li><a class="footer-link" href="about-team.html">Team</a></li>
          <li><a class="footer-link" href="about-licenses.html">Licenses</a></li>
          <li><a class="footer-link" href="insights-stories.html">Customer stories</a></li>
          <li><a class="footer-link" href="insights-market.html">Market insights</a></li>
        </ul>
      </div>
      <div>
        <div class="footer-col-title">Legal</div>
        <ul class="footer-links">
          <li><a class="footer-link" href="imprint.html">Imprint</a></li>
          <li><a class="footer-link" href="#">Privacy policy</a></li>
          <li><a class="footer-link" href="#">Terms of service</a></li>
          <li><a class="footer-link" href="#">Complaints</a></li>
          <li><a class="footer-link" href="about-licenses.html">Licences</a></li>
          <li><a class="footer-link" href="partners-partner.html">Partners</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-hr"></div>
    <div class="footer-bottom">
      <span class="footer-copy">HansePay &middot; Hamburg, Germany &middot; Regulated by BaFin</span>
      <span class="bafin-badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        BaFin-regulated &middot; EU E-Money Institution
      </span>
      <span class="footer-social">
        <a class="footer-social-link" href="https://www.linkedin.com/company/atrya-infrastructure/" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          LinkedIn
        </a>
      </span>
    </div>
  </div>
</footer>
`;

  var s = document.currentScript;
  var tmp = document.createElement('div');
  tmp.innerHTML = FOOTER_HTML;
  while (tmp.firstChild) s.parentNode.insertBefore(tmp.firstChild, s);
})();
