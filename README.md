# Toptec Global — Corporate Website

Public corporate website for **TOPTEC GLOBAL PTE. LTD.** (UEN: 201932202N, Singapore), served at [https://toptec.com.sg/](https://toptec.com.sg/).

## Stack

- Static HTML/CSS/JS — no build step required. Each page is a standalone HTML file with its own `<head>`, header, and footer.
- Hosted on **Netlify**: contact form uses Netlify Forms (`data-netlify="true"`, redirects to `/success`); `_redirects` maps legacy URLs; `netlify/functions/translate.js` is a serverless DeepL proxy used by the password-gated internal tools under `/internal/` (excluded from search engines via `robots.txt`).
- **PWA**: `site.webmanifest` + `sw.js` service worker (cache version `toptec-v8`).

## Internationalization (i18n)

- English is authored directly in the HTML; elements carry `data-i18n="dot.notation.key"` attributes.
- Traditional Chinese lives in `locales/zh-Hant.json`; `assets/js/main.js` applies it client-side and persists the choice in `localStorage` (`toptec-lang`).
- **Rule:** any new visible English string needs a `data-i18n` attribute **and** a matching key in `locales/zh-Hant.json`, or the Chinese view will fall back to English.

## Structured data

`index.html` carries the canonical schema.org `Organization` JSON-LD (legal name, UEN, founding date, offices). Keep it in sync with the footer's corporate disclosure and the Corporate & Compliance Facts section on `about.html`.

## Pages

`index` · `about` (company story, leadership, compliance framework, corporate facts) · `electronics` · `trading` · `case-studies` · `contact` · `app` · `privacy` · `terms` · `404` · `success`

## Analytics (currently not installed — intentional)

Analytics were removed while no real measurement IDs exist; do not ship placeholder IDs. To re-enable once real IDs are available:

1. Create `assets/js/analytics.js` containing the GA4/Hotjar loaders with the **real** IDs, gated behind a cookie-consent check.
2. Reference it with a single `<script src="assets/js/analytics.js" defer></script>` line in each page's `<head>` (7 content pages), so IDs live in exactly one file.
3. Add a lightweight consent banner (pattern: `localStorage`, as `main.js` already does for language) and a Cookies subsection to `privacy.html` — both bilingual via `data-i18n` keys.
4. Re-add `<meta name="google-site-verification" content="...">` with the real Search Console token to `index.html` only.

## Local development

Serve the directory with any static server, e.g. `python3 -m http.server 8000`, then open `http://localhost:8000`. Netlify-specific features (form submission, functions) require `netlify dev`.

## Image pipeline

`scripts/optimize_images.py` generates the responsive WebP/JPEG variants under `assets/img/`.
