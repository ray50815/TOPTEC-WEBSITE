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

Content routes include home, about, products, trading, logistics, compliance, contact, website shortcut, privacy, and terms. Legacy electronics/services routes redirect to About; case-studies/solutions redirect to Trading; trust redirects to Compliance. English, Traditional Chinese, `.html`, and trailing-slash variants are covered. The success, error, and offline utility pages are excluded from search indexing.

## Contact form

The contact form is processed by Netlify Forms. JavaScript enhances submission feedback, but the native POST path remains functional when JavaScript is unavailable. Only a successful HTTP response may clear the form or display success. Never add file upload or request sensitive documents through this public form without a separately reviewed secure exchange process.

The form name remains `contact`. Both languages submit required `company` and `inquiry_type`; category values are `product_purchase`, `supplier_cooperation`, `logistics_cooperation`, `corporate_kyc_request`, and `other`. The KYC category requests documents **from TOPTEC** and does not accept visitor documents. Keep the hidden `bot-field` honeypot and verify native Netlify spam filtering, detected fields and notification delivery in Deploy Preview; local browser tests intercept submissions.

The September 2026 energy redesign, image prompts, source records and local validation results are documented in `compliance/implementation-review-2026-09-27.md`. Internal records are never deployed.

## Public claims and evidence

Public operational, security, legal, certification, response-time, and customer claims must be represented in `compliance/claims.json` and approved by the named business owner before publication. Sensitive evidence belongs in an access-controlled data room and must not be committed or deployed.

See `CUSTOMER_REVIEW_CHECKLIST.md` and `OPERATIONS_RUNBOOK.md` for customer-review evidence, release controls, mail-domain protection, and external administrative steps.

Production remains blocked by `npm run review:gate` until every approval and claim status is backed by current evidence. Setting the build environment variable `PWA_KILL_SWITCH=true` creates an emergency artifact that disables registration and removes only `toptec-*` browser caches; use `npm run test:pwa-kill` to exercise and restore that path locally.

## Third parties and analytics

The site intentionally contains no analytics or behavioural tracking. Google Fonts are not used. Google Maps loads only after an explicit visitor action. Do not add a new processor, tracking script, consent mechanism, or external asset without privacy review, CSP updates, documented ownership, and a production test.
