# Graph Report - .  (2026-07-14)

## Corpus Check
- Corpus is ~16,490 words - fits in a single context window. You may not need a graph.

## Summary
- 55 nodes · 91 edges · 12 communities (6 shown, 6 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.82)
- Token cost: 269,352 input · 0 output

## Community Hubs (Navigation)
- Site Config & Compliance
- Public Marketing Pages
- Image Optimization Pipeline
- Netlify Translate Function
- Internal Invoicing Toolkit
- Corporate Entity & Governance
- Favicon 32x32
- Service Worker Cache
- Android Icon 192
- Android Icon 512
- Apple Touch Icon
- Favicon 16x16

## God Nodes (most connected - your core abstractions)
1. `Home Page (index.html)` - 14 edges
2. `Internal Tool Selector (Access-Gated)` - 14 edges
3. `Contact Page` - 12 edges
4. `Toptec Global README` - 10 edges
5. `About Page` - 10 edges
6. `Case Studies / Engagement Scenarios Page` - 6 edges
7. `save_variants()` - 5 edges
8. `Privacy Policy Page` - 5 edges
9. `Energy & Commodities Trading Page` - 5 edges
10. `process_image()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Contact Page` --references--> `Netlify Forms Contact Submission`  [EXTRACTED]
  contact.html → README.md
- `Contact Form Privacy Policy Consent Checkbox` --references--> `Privacy Policy Page`  [EXTRACTED]
  contact.html → privacy.html
- `404 Page Not Found` --references--> `Contact Page`  [EXTRACTED]
  404.html → contact.html
- `404 Page Not Found` --references--> `Home Page (index.html)`  [EXTRACTED]
  404.html → index.html
- `Toptec Global README` --references--> `About Page`  [EXTRACTED]
  README.md → about.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Public marketing pages sharing common site header/footer navigation** — index, about, electronics, trading, case_studies, contact, app [EXTRACTED 0.95]
- **Internal password-gated toolkit suite (toolselect -> toolkit/toolkit2)** — internal_toolselect, internal_toolkit, internal_toolkit2, concept_access_gate_sha256 [EXTRACTED 0.95]
- **Legal/compliance documentation pages (privacy, terms) tied to corporate entity facts** — privacy, terms, concept_toptec_global_pte_ltd, about [INFERRED 0.85]

## Communities (12 total, 6 thin omitted)

### Community 0 - "Site Config & Compliance"
Cohesion: 0.24
Nodes (11): App Download Page, SHA-256 Access-Code Gate (toolselect.html), i18n data-i18n Attribute System, Netlify Forms Contact Submission, schema.org Organization JSON-LD, PWA beforeinstallprompt Install Flow, PWA / Service Worker (sw.js, toptec-v8), Internal Tool Selector (Access-Gated) (+3 more)

### Community 1 - "Public Marketing Pages"
Cohesion: 0.38
Nodes (11): 404 Page Not Found, Case Studies / Engagement Scenarios Page, Contact Form Privacy Policy Consent Checkbox, Corporate Disclosure Disclaimer (not affiliated with Toptec Co., Ltd KOSDAQ:108230), Electronics Component Sourcing Division, Energy & Commodities Trading Division, Contact Page, Electronics Component Sourcing Page (+3 more)

### Community 2 - "Image Optimization Pipeline"
Cohesion: 0.48
Nodes (6): Image, Path, main(), process_image(), Save WebP and JPEG variants at the requested widths., save_variants()

### Community 3 - "Netlify Translate Function"
Cohesion: 0.43
Nodes (6): allowedOrigins, errorResponse(), handler(), ok(), resolveOrigin(), targetLanguageOverrides

### Community 4 - "Internal Invoicing Toolkit"
Cohesion: 0.40
Nodes (6): Bilingual (zh-Hant/en) Contract Translation Workflow, netlify/functions/translate.js DeepL Proxy, Invoice & Packing List Generator Workflow, Supplier Mode (进项发票 toggle in toolkit.html), Internal Invoice/Packing Generator Toolkit, Internal Bilingual Contract Translator

### Community 5 - "Corporate Entity & Governance"
Cohesion: 0.67
Nodes (4): About Page, Asset-Light Supply Chain Governance Model, Client Compliance Portal (launched 2023), TOPTEC GLOBAL PTE. LTD. (UEN 201932202N)

## Knowledge Gaps
- **11 isolated node(s):** `allowedOrigins`, `targetLanguageOverrides`, `PRECACHE_ASSETS`, `Client Compliance Portal (launched 2023)`, `Bilingual (zh-Hant/en) Contract Translation Workflow` (+6 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Internal Tool Selector (Access-Gated)` connect `Site Config & Compliance` to `Public Marketing Pages`, `Internal Invoicing Toolkit`, `Corporate Entity & Governance`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **Why does `Toptec Global README` connect `Site Config & Compliance` to `Public Marketing Pages`, `Internal Invoicing Toolkit`, `Corporate Entity & Governance`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `About Page` connect `Corporate Entity & Governance` to `Site Config & Compliance`, `Public Marketing Pages`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **What connects `allowedOrigins`, `targetLanguageOverrides`, `PRECACHE_ASSETS` to the rest of the system?**
  _11 weakly-connected nodes found - possible documentation gaps or missing edges._