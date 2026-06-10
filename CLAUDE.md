# HansePay — Project Context for Claude Code

> Read this file completely before writing a single line of code or copy.  
> It is the single source of truth for brand, code, and tone.

---

## What this project is

HansePay is a **commercial FX and cross-border payments platform** for European businesses. It is a brand of Caplend Technologies GmbH, Hamburg. The company was built out of Caplend (lending) and Atrya (prior name), rebranded to HansePay with a MiCAR authorisation and BaFin supervision.

This repository is a **static website** — plain HTML files served by Express on Railway. There is no build step, no bundler, no React, no npm. Every file is a standalone `.html` page.

**The live site:** `https://hansepay-deploy-production-328c.up.railway.app`

---

## Repository structure

```
/Users/philcarstensen/Claude/hansepay/        ← edit here
/Users/philcarstensen/hansepay-deploy/        ← deploy copy (git repo → Railway)
```

**Workflow to deploy:**
1. Edit/create files in `/Users/philcarstensen/Claude/hansepay/`
2. Copy changed files: `cp file.html /Users/philcarstensen/hansepay-deploy/`
3. `cd /Users/philcarstensen/hansepay-deploy && git add -A && git commit -m "..." && git push origin main`
4. Railway auto-deploys on push. No further action needed.

**Assets directory:** `assets/` — contains `nav.js`, `footer.js`, `hansepay-mark-uploaded.png`, `hansepay-mark-uploaded-white.png`, and `global.css`.

**Special assets:**
- `/blz.json` — Deutsche Bundesbank BLZ register (bank code → name/city/BIC lookup for IBAN verifier)

---

## Every page shares this HTML skeleton

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>HansePay — [Page Name]</title>
  <meta name="description" content="[SEO description]" />
  <link rel="icon" type="image/png" href="assets/hansepay-mark-uploaded.png">
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Inter:wght@300;400;500;600&family=Libre+Baskerville:ital,wght@0,400;1,400&display=swap" rel="stylesheet" />
  <style>/* page styles */</style>
</head>
<body>
<script src="assets/nav.js"></script>
<!-- page content -->
<script src="assets/footer.js"></script>
<!-- optional inline JS -->
</body>
</html>
```

`nav.js` and `footer.js` are self-injecting IIFEs that insert the nav/footer HTML at the `<script>` tag position. They also inject their own CSS. **Never hardcode nav or footer HTML — always use these scripts.**

---

## CSS design tokens (put in `:root` on every page)

```css
:root {
  /* Navy scale — the entire brand lives here */
  --n900: #060D1A;   /* near-black, darkest backgrounds */
  --n800: #0B1929;   /* footer, dark sections */
  --n700: #0F2540;   /* dark section alternative */
  --n600: #163659;   /* active states, hover */
  --n500: #1E4E80;   /* PRIMARY — buttons, eyebrows, accent */
  --n400: #2E6BAD;   /* lighter interactive */
  --n300: #5090CE;   /* light accent (design system), #3B7BC4 used in code */
  --n200: #8DBDE6;   /* nav icons, subtle accents */
  --n100: #C4DDEF;   /* chart lines, hairlines */
  --n050: #EBF4FB;   /* background tints, icon bubbles */

  /* Surfaces */
  --off:  #F6F9FC;   /* off-white (cool blue-tint) — use for hero/section bg */

  /* Accent */
  --gold: #C9A961;   /* sparingly: coming-soon badges, active nav items */

  /* Text */
  --ink:  #0B1929;   /* primary body text */
  --ink2: #3D5A73;   /* secondary / muted text */
  --ink3: #7A9AB0;   /* tertiary, captions */

  /* Semantic */
  --success:   #1A7F5A;
  --in-transit:#1D4ED8;
  --error:     #B91C1C;

  /* Structural */
  --hairline: rgba(11,25,41,0.07);

  /* Fonts */
  --font-ui:      'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-display: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
  --font-logo:    'Libre Baskerville', Georgia, serif;

  /* Radii */
  --r-pill: 100px;
  --r-lg:   16px;
  --r-md:   10px;
}
```

> **Note:** All pages were migrated to `#F6F9FC` (cool off-white) in June 2026 — `#F5F1EA` warm cream no longer appears on any site surface (it survives only in `lib/email.js`, deliberately). All pages also now load Cormorant Garamond and use it as `--font-display`.

---

## Typography — three families, strict roles

### Cormorant Garamond — display headlines
The primary headline face. **All `<h1>` and `<h2>` on every page** use this family.

```css
font-family: var(--font-display);
font-weight: 400;              /* regular for most headings */
font-style: normal;
letter-spacing: -0.03em;       /* tight tracking always */
line-height: 1.05;

/* The "accent phrase" within a headline */
em {
  font-style: italic;
  font-weight: 300;            /* light italic — the signature move */
  color: var(--n500);          /* navy accent on light bg */
}
```

- **Scale:** `clamp(44px, 5.5vw, 76px)` for hero H1 · `clamp(30px, 3.6vw, 48px)` for section H2
- The italic-light em inside a headline is the **single most recognisable brand pattern** — use it on every major headline. One word or short phrase is italic light navy, the rest is regular weight.
- **Numerals** in display contexts: `font-variant-numeric: tabular-nums` always.

### Inter — everything else
UI labels, body copy, buttons, nav, captions, form fields, badges. No exceptions.

```css
font-family: var(--font-ui);
/* Body: */   font-size: 16px; line-height: 1.75; color: var(--ink2);
/* Label: */  font-size: 14px; font-weight: 500;
/* Caption: */font-size: 13px; font-weight: 400;
/* Eyebrow: */font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;
```

### Libre Baskerville — wordmark only
**Never use for headlines, body, or anything other than the HansePay logotype.** It appears in `nav.js` and `footer.js` for the logo text. Do not introduce it elsewhere.

---

## Signature gradient

Four-stop layered radial, used on dark hero surfaces (not flat navy):

```css
background: radial-gradient(ellipse at 60% 50%,
  #2E6BAD 0%,    /* Navy 400 */
  #1E4E80 25%,   /* Navy 500 */
  #163659 55%,   /* Navy 600 */
  #0F2540 100%   /* Navy 700 */
);
```

Used in: dark photo hero overlays, the business card front face, premium CTAs. **Do not apply to background sections or cards** — reserve it for high-impact hero moments only.

---

## The two hero patterns

### Dark photo hero (About pages)
```html
<section class="hero-dark" style="position:relative;min-height:520px;display:flex;align-items:flex-end;padding:120px 0 80px">
  <div style="position:absolute;inset:0;overflow:hidden">
    <img src="https://images.unsplash.com/photo-XXXXX?w=1600&q=80&fit=crop"
         style="width:100%;height:100%;object-fit:cover;object-position:center" alt="" />
    <div style="position:absolute;inset:0;background:linear-gradient(to right, rgba(11,25,41,.72), rgba(11,25,41,.30) 60%, rgba(11,25,41,.15))"></div>
  </div>
  <div class="container" style="position:relative;z-index:1">
    <!-- white text on photo -->
  </div>
</section>
```
- H1 and eyebrow in **white** (`color:#fff`)
- Eyebrow: `background:rgba(255,255,255,.12); color:#fff; border:1px solid rgba(255,255,255,.25)`
- Sub copy: `color:rgba(255,255,255,.75)`

### Light hero (Platform, Partners, Tools)
```html
<section class="hero" style="background:#FAFAFA; padding:140px 0 80px">
  <div class="container">
    <span class="eyebrow">...</span>
    <h1>...</h1>
    <p class="hero-sub">...</p>
  </div>
</section>
```
- H1 in `color:var(--ink)` (dark)
- `em` inside H1: `font-style:italic; font-weight:300; color:var(--n500)`

---

## Standard component CSS

Paste these into the `<style>` block of every page:

```css
/* Reset + base */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth;overflow-x:hidden}
body{font-family:var(--font-ui);color:var(--ink);background:#fff;-webkit-font-smoothing:antialiased;line-height:1.6;overflow-x:hidden}
img{display:block;max-width:100%}
a{color:inherit;text-decoration:none}
.container{max-width:1200px;margin:0 auto;padding:0 clamp(20px,5vw,80px)}

/* Buttons */
.btn{display:inline-flex;align-items:center;gap:8px;padding:12px 28px;border-radius:var(--r-pill);font-family:var(--font-ui);font-size:14px;font-weight:600;cursor:pointer;border:none;transition:all .18s ease;text-decoration:none;white-space:nowrap}
.btn-primary{background:var(--n500);color:#fff}
.btn-primary:hover{background:var(--n600)}
.btn-ghost-navy{background:transparent;color:var(--n600);border:1.5px solid rgba(11,25,41,.20)}
.btn-ghost-navy:hover{background:var(--n050)}

/* Eyebrow tag */
.eyebrow{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;padding:5px 12px;border-radius:var(--r-pill);background:rgba(30,78,128,.08);color:var(--n500)}

/* Section spacing */
.section{padding:96px 0}
.section-light{background:#FAFAFA}
.section-mid{background:#F8F9FC}
.section-border{border-top:1px solid rgba(11,25,41,.08)}
@media(max-width:768px){.section{padding:64px 0}}

/* Section heading */
.section-heading{font-family:var(--font-display);font-size:clamp(30px,3.6vw,48px);font-weight:400;line-height:1.1;letter-spacing:-.025em;color:var(--ink);margin-top:12px}
.section-heading em{font-style:italic;font-weight:300;color:var(--n500)}

/* Cards */
.icon-card{background:#fff;border:1px solid rgba(11,25,41,.08);border-radius:var(--r-lg);padding:28px;display:flex;flex-direction:column}
.icon-pill{width:44px;height:44px;border-radius:10px;background:var(--n050);display:flex;align-items:center;justify-content:center;margin-bottom:20px}
.icon-pill svg{width:20px;height:20px;color:var(--n500)}

/* FAQ accordion (native details/summary) */
.faq-list{border:1px solid rgba(11,25,41,.08);border-radius:var(--r-lg);overflow:hidden}
.faq-item{border-bottom:1px solid rgba(11,25,41,.07)}
.faq-item:last-child{border-bottom:none}
.faq-item summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;padding:20px 24px;font-size:15px;font-weight:600;color:var(--ink);gap:16px}
.faq-item summary::-webkit-details-marker{display:none}
.faq-item summary .chev{width:18px;height:18px;color:var(--ink3);flex-shrink:0;transition:transform .22s ease}
details[open].faq-item summary .chev{transform:rotate(180deg)}
.faq-body{font-size:15px;color:var(--ink2);line-height:1.72;padding:0 24px 20px}

/* Coming soon badge */
.cs-badge{display:inline-flex;align-items:center;gap:6px;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;background:rgba(201,169,97,.12);color:var(--gold);padding:4px 10px;border-radius:var(--r-pill);border:1px solid rgba(201,169,97,.25)}
.cs-badge-dot{width:6px;height:6px;border-radius:50%;background:var(--gold);animation:cs-pulse 1.8s ease-in-out infinite}
@keyframes cs-pulse{0%,100%{opacity:1}50%{opacity:.35}}

/* CTA strip (dark, used at page bottom) */
.cta-strip{background:var(--n800);padding:80px 0;text-align:center}
.cta-strip h2{font-family:var(--font-display);font-size:clamp(28px,3.5vw,46px);font-weight:400;color:#fff;letter-spacing:-.025em;margin-bottom:12px}
.cta-strip h2 em{font-style:italic;font-weight:300;color:var(--n200)}
.cta-strip p{font-size:16px;color:rgba(255,255,255,.55);margin-bottom:32px}
```

---

## Iconography rules

Source: **Lucide** icon set. Inline SVG always (never `<img>` for icons).

```
viewBox="0 0 24 24"
fill="none"
stroke="currentColor"
stroke-width="1.75"      ← 1.5–2px, never heavier
stroke-linecap="round"
stroke-linejoin="round"
```

- **Never use filled icons.** Always outline/line style.
- **Never mix icon sets.** Lucide only.
- In icon pills/bubbles: size `20px × 20px` inside a `44px × 44px` container with `background:var(--n050)`.
- In nav dropdowns: size `14px × 14px` inside a `32px × 32px` container with `background:rgba(141,189,230,.10)`.
- Color is `currentColor` — set it via the parent's `color` property.

---

## nav.js and footer.js

Both are **IIFEs** (immediately-invoked function expressions) that:
1. Inject their CSS into `<head>` (idempotent — won't duplicate)
2. Inject their HTML at the position of the `<script>` tag
3. Run their init logic (scroll listener for nav, none for footer)

**Never modify these files for one-off page changes.** They are shared across all pages. If a nav link needs updating, update nav.js and re-copy to deploy.

**Active-page detection:** nav.js reads `window.location.pathname` and matches file prefixes to highlight the correct nav item. Current prefixes: `solutions-`, `platform`, `partners-`, `about-`, `insights-`, `events`, `tools`.

---

## Page inventory

| File | Type | Hero |
|---|---|---|
| `index.html` | Homepage | Dark gradient hero |
| `platform.html` | Platform overview | — |
| `platform-technology.html` | Technology | Light |
| `platform-security.html` | Security | Light |
| `solutions-ecommerce.html` | Solutions | Light |
| `solutions-manufacturing.html` | Solutions | Light |
| `solutions-logistics.html` | Solutions | Light |
| `solutions-corporate.html` | Solutions | Light |
| `solutions-sme.html` | Solutions | Light |
| `partners-partner.html` | Partners hub | Light |
| `partners-refer.html` | Refer clients | Light |
| `partners-resell.html` | Resell | Light |
| `partners-embed.html` | Embed payments | Light |
| `about-vision.html` | Vision & Values | Dark photo |
| `about-history.html` | History | White |
| `about-team.html` | Team | Dark photo |
| `about-licenses.html` | Licenses | Dark photo |
| `insights-stories.html` | Customer stories | Coming soon |
| `insights-market.html` | Market insights | Coming soon |
| `events.html` | Events | Coming soon |
| `imprint.html` | Legal/Imprint | — |
| `tools.html` | Tools hub | Light |
| `tools-converter.html` | Currency Converter | Light |
| `tools-calculator.html` | FX Savings Calculator | Light |
| `tools-iban.html` | IBAN Verifier | Light |
| `tools-swift.html` | SWIFT/BIC Lookup | Light |
| `blog.html` | Blog list | — |
| `blog-post.html` | Blog post | — |

---

## Interactive tools — technical reference

### Currency Converter (`tools-converter.html`)
- **API:** `https://api.frankfurter.app/latest?from={FROM}&to={TO}` for live rate
- **History:** `https://api.frankfurter.app/{START}..{END}?from={FROM}&to={TO}` — returns `{rates: {"YYYY-MM-DD": {"TO": float}}}`
- **Ranges:** 1W (7d), 1M (30d), 1Y (365d, downsample every 5th point)
- **Chart:** Plain SVG, drawn with a `<polyline>`, gradient area fill, axis labels, active dot
- **Fallback:** If API fails, generate a pseudo-random wobble series from the last known rate

### FX Savings Calculator (`tools-calculator.html`)
- **Inputs:** Annual volume (100k–50M), currency pair (grouped by region), provider type OR custom margin (0.5%–6%), payments/month (1–500)
- **Bank presets:** major_de (×1.0), sparkasse (×1.12), international (×1.0), broker (×0.6), other
- **Category markups:** major (bank 2.5%, HP 0.4%), minor (bank 3.5%, HP 0.7%), exotic (bank 5.0%, HP 1.3%)
- **Per-payment bank fee:** €38; HansePay: €0
- **Animated counter:** `requestAnimationFrame` with cubic ease-out (1 - (1-t)³)
- **Slider CSS trick:** `--pct` custom property drives the gradient fill: `background: linear-gradient(to right, var(--n300) 0%, var(--n300) var(--pct), var(--n100) var(--pct), var(--n100) 100%)`

### IBAN Verifier (`tools-iban.html`)
- **Algorithm:** mod-97 on a numeric string — rearrange IBAN (last 4 chars first), convert letters to digits (A=10…Z=35), mod 97 must equal 1
- **Country lengths:** 70+ countries, table embedded in page
- **German BLZ lookup:** Fetch `/blz.json` lazily on first DE IBAN. Map format: `[{blz, name, shortName, city, bic}]`
- **Debounce:** 250ms after last keystroke before validating

### SWIFT/BIC Lookup (`tools-swift.html`)
- **Database:** 50 major banks embedded as a JS array in the page
- **Search:** Live filter across name, country, city, swift fields; first 10 shown when empty; up to 50 shown on search

---

## Voice & tone

### HansePay speaks like:
- **Precise** — exact numbers, no hedging. "€38 per payment" not "significant fees."
- **Authoritative** — we know this space. No disclaimers in brand copy.
- **Considered** — deliberate word choice. No filler. Every sentence earns its place.
- **Global** — continental in register. Not British, not American, not startup-Californian.
- **Understated** — the work speaks. We don't shout about it.
- **Institutional** — we serve serious businesses. We sound like one.

### HansePay does not speak like:
- ❌ Hyped ("revolutionary," "game-changing," "disrupting")
- ❌ Casual ("hey," "awesome," "super easy")
- ❌ Jargon-heavy (avoid "synergies," "ecosystem," "leverage" as a verb)
- ❌ Startup-cute (no exclamation marks in brand copy, no emojis outside tools)
- ❌ Loud (no ALL CAPS sentences in body copy)
- ❌ Disruptive framing ("we're changing finance")

### The manifesto (exact wording — reference this for tone):
> "We don't disrupt finance. We give businesses access to the infrastructure that has always powered it — with precision, reliability, and discretion."

### Headline pattern
Every major headline follows the same structure: **regular-weight statement** containing an **italic-light accent phrase** in navy `--n500`.

```
"Every transfer, [italic]safe at every step.[/italic]"
"Free utilities for [italic]moving money smarter.[/italic]"
"Validate any IBAN [italic]in one click.[/italic]"
```

The accent phrase is:
- Short (3–6 words)
- The emotional or differentiating claim
- Never cliché ("the future of," "reimagined," "next-gen")
- Often a promise, not a feature

### Body copy rules
- Max 2–3 sentences per paragraph in hero/intro contexts
- Active voice always
- Spell out what the product does, then why it matters — never reverse
- Numbers are precise: "38 EUR per payment" not "around €40"
- Oxford comma always
- Use em-dashes (—) not hyphens for clauses. Space on both sides.

---

## Brand values (every design decision answers to one of these)

| Value | What it means in practice |
|---|---|
| **Precision** | Exact numbers. No rounded figures unless intentional. Tight type. No visual noise. |
| **Reliability** | Consistent components. Never break patterns without reason. Same button, same spacing, same behaviour everywhere. |
| **Discretion** | No decorative gradients. No animation for its own sake. No badge-heavy UIs. The product performs quietly. |
| **Access** | Clear hierarchy. Nothing gated behind jargon. Tools are free. No minimum volume. |

---

## What the brand never does (visual rules)

1. **Never distort, rotate, recolor, or add effects to the mark.** Use the SVG files as-is.
2. **No decorative gradients** — the signature gradient is for specific, intentional use only (dark hero overlay, business card). Not for buttons, cards, backgrounds.
3. **No purple, no teal** — the palette is exclusively the navy scale + gold accent + semantic colours.
4. **No drop shadows on text** — ever.
5. **No border-radius on the logo mark.**
6. **No filled icons** — Lucide outline only.
7. **No warm off-whites on the website** — `#F5F1EA` is not a site surface colour. Use `#F6F9FC`, `#FAFAFA`, or `#F8F9FC`. **Exception (deliberate, June 2026):** transactional emails use warm cream — `BRAND.off` in `lib/email.js` is `#f5f1ea` to match the booking-confirmation reference design. Do not "fix" it back to cool.
8. **No heavy type** — headlines are weight 400 (regular). Bold (`700`) is only for UI labels, eyebrow tags, and small metadata. Never set a display headline in bold.
9. **No rounded sections with background colours** — sections are rectangular. No `border-radius` on full-width section backgrounds.
10. **Never use Libre Baskerville** except for the wordmark "HansePay."

---

## Spacing and layout principles

- **Max content width:** 1200px (`.container`)
- **Max text column width:** 820px for hero/intro prose, 680px for body paragraphs
- **Section padding:** `96px 0` desktop, `64px 0` mobile (below 768px)
- **Hero padding:** `140px 0 80px` (accounts for 68px fixed nav)
- **Card gap:** `20px` for 2/3/4-col grids
- **Responsive breakpoints:**
  - 4-col → 2-col at 900px, 1-col at 560px
  - 3-col → 1-col at 860px
  - 2-col → 1-col at 640–780px (varies by context)

---

## Status colours (for pills and data states)

```css
/* Settled / success */
background: #E6F4EE;  color: #1A7F5A;

/* In Transit */
background: rgba(29,78,216,.10);  color: #1D4ED8;

/* Failed / error */
background: #FEF2F2;  color: #B91C1C;

/* Warning / unknown */
background: #FFFBEB;  color: #B45309;

/* Coming soon (gold) */
background: rgba(201,169,97,.12);  color: var(--gold);
```

---

## The company at a glance

- **Legal entity:** Caplend Technologies GmbH
- **Brand:** HansePay (a brand of Caplend Technologies GmbH)
- **Regulatory:** MiCAR-authorised, supervised by BaFin (Bundesanstalt für Finanzdienstleistungsaufsicht)
- **Certifications:** ISO 27001, GDPR-compliant
- **Offices:** Hamburg (HQ), Berlin, Riga
- **Founders:** Lorian Qorraj, Benjamin James
- **Advisors:** Andrew Bosomworth (PIMCO), Innovationsstarter Hamburg
- **History:** Caplend (2017, SME lending) → Atrya (FX/payments pivot) → HansePay (2024 rebrand, 2026 launch)
- **Memberships:** Hanseatic Chamber of Commerce, Bitkom, German FinTech Association, and others (see `about-vision.html`)
- **Segregated funds:** Ring-fenced at tier-1 European banks under MiCAR Article 75
- **Fund safeguard:** Funds not part of insolvency estate

---

## SEO meta descriptions — style guide

Keep under 160 characters. Lead with the value proposition. Include a differentiator. No full stops at end.

Good: `"Validate any IBAN instantly. Checks format, country length, mod-97 checksum. For German IBANs, identifies the bank name, city, and BIC. Free, no signup."`

Bad: `"HansePay's IBAN verification tool allows users to check their IBAN numbers using our advanced validation system."`

---

## Things Claude should do automatically

- Always load Cormorant Garamond from Google Fonts alongside Inter and Libre Baskerville
- Always add `font-variant-numeric: tabular-nums` to elements showing amounts, rates, or counts
- Always use the `<details>/<summary>` FAQ accordion pattern (not custom JS accordions)
- Always include a `section-border` (border-top hairline) between sections unless adjacent sections have contrasting background colours
- Always end pages with a dark CTA strip (`background:var(--n800)`) — never leave a page without a conversion prompt
- Always use `clamp()` for responsive type sizes
- Always set `overflow-x:hidden` on `html` and `body`
- Always give the eyebrow tag its own line before the `<h1>` or `<h2>`, with `margin-top:24px` on the heading

---

## Things Claude must never do

- Import React, Vue, or any JS framework
- Use `document.write()`
- Add `!important` to CSS
- Use `px` for font sizes in media queries (use `em`)
- Hardcode nav or footer HTML into a page
- Use Bootstrap, Tailwind, or any CSS framework
- Use `<table>` for layout
- Add console.log() calls to production code
- Use external CDN links for anything other than Google Fonts
- Create new pages without updating nav.js (if the page should appear in the nav)
