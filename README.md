# Toptec Global corporate website

Public corporate website for **TOPTEC GLOBAL PTE. LTD.** (UEN 201932202N), served at <https://toptec.com.sg/>.

## Production boundary

The repository root is source material and **must never be published directly**. Production is built into the untracked `dist/` directory from an explicit allowlist. Reports, scripts, compliance records, source assets, archives, and repository documentation are excluded from the public artifact.

Netlify must use:

- Build command: `npm ci && npm test`
- Publish directory: `dist`
- Node version: `24`

## Local workflow

```text
npm ci
npm run scan:secrets
npm test
npm run lint:js
npm run lint:css
npm run test:e2e
npm run lighthouse
npm run serve
```

`npm test` creates `dist/`, runs the deployment allowlist and content/security checks, validates JSON/XML, and validates every generated HTML document. Run the browser and Lighthouse suites and inspect `dist/` before every deployment. A production release must first pass through a Netlify Deploy Preview.

## Site architecture

- English content is authored in the root HTML source pages.
- Approved Traditional Chinese content is stored in `locales/zh-Hant.json` and rendered into static `/zh-hant/` pages at build time.
- The language switch is a normal link between equivalent static routes. Translation does not depend on runtime `innerHTML`, network fetches, or local storage.
- Canonical public URLs are extensionless. Legacy `.html` URLs redirect permanently.
- CSS and JavaScript are minified and fingerprinted by the build; production HTML references only the generated filenames.
- `site.webmanifest` and `sw.js` provide an installable website shortcut and limited offline reading of public content. They do not provide accounts, project tracking, document storage, messaging, or push notifications.

- Every `data-i18n` key must translate one English source string. `npm run check` fails if the same key is reused for different English text, which would otherwise show the wrong Chinese copy.
- Structured data (Organization, WebSite, WebPage and BreadcrumbList JSON-LD) and Open Graph metadata are generated per page and language by the build. `legalName` stays `TOPTEC GLOBAL PTE. LTD.`; `name` is the brand `TOPTEC Global`.
- Unknown `/zh-hant/` URLs are served the Chinese 404 through the generated `/zh-hant/* /zh-hant/404.html 404` rule. It must follow every specific `/zh-hant/` redirect and precede any site-wide `/*` rule; the check enforces this order.
- The header and footer use `assets/img/toptec-logo-light.svg` on the navy background; light-background pages use `assets/img/toptec-logo.svg`. Both wordmarks use `textLength` so fallback fonts cannot clip the text. Converting the text to outlined paths remains a follow-up once the original logo source is available.

Content routes include home, about, products, trading, logistics, compliance, contact, website shortcut, privacy, and terms. Legacy electronics/services routes redirect to About; case-studies/solutions redirect to Trading; trust redirects to Compliance. English, Traditional Chinese, `.html`, and trailing-slash variants are covered. The success, error, and offline utility pages are excluded from search indexing.

## Contact form

The contact form is processed by Netlify Forms. JavaScript enhances submission feedback, but the native POST path remains functional when JavaScript is unavailable. Only a successful HTTP response may clear the form or display success. Never add file upload or request sensitive documents through this public form without a separately reviewed secure exchange process.

Page CTAs may link to `/contact?inquiry=<value>#contact-form` to preselect a category; only values matching an existing option are applied. The form name remains `contact`. Both languages submit required `company` and `inquiry_type`; category values are `product_purchase`, `supplier_cooperation`, `logistics_cooperation`, `corporate_kyc_request`, and `other`. The KYC category requests documents **from TOPTEC** and does not accept visitor documents. Keep the hidden `bot-field` honeypot and verify native Netlify spam filtering, detected fields and notification delivery in Deploy Preview; local browser tests intercept submissions.

The September 2026 energy redesign, image prompts, source records and local validation results are retained in the private working copy. Internal records are excluded from both this public repository and the deployed artifact.

## Public claims and evidence

Business owners maintain public-claim evidence and approvals in the private review process. Its `compliance/claims.json` register is deliberately absent from the public repository. Sensitive evidence belongs in an access-controlled data room and must not be committed or deployed.

Run `npm run review:gate` explicitly in the private working copy when conducting an internal review. It continues to fail if evidence or approvals are missing; it does not silently pass in CI or manufacture approvals. The customer-review checklist and operations runbook are also retained privately.

Netlify production and Deploy Preview both run `npm ci && npm test`, retaining the build, deployment allowlist, content/security, bilingual-route and HTML checks without requiring private records. A successful technical build is not a record of business or legal approval. Do not upload private evidence or change claim statuses to repair a hosting build.

Setting the build environment variable `PWA_KILL_SWITCH=true` creates an emergency artifact that disables registration and removes only `toptec-*` browser caches; use `npm run test:pwa-kill` to exercise and restore that path locally.

## Third parties and analytics

The site intentionally contains no analytics or behavioural tracking. Google Fonts are not used. Google Maps loads only after an explicit visitor action. Do not add a new processor, tracking script, consent mechanism, or external asset without privacy review, CSP updates, documented ownership, and a production test.
