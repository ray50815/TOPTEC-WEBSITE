import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import { XMLParser, XMLValidator } from 'fast-xml-parser';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SITE_ORIGIN = 'https://toptec.com.sg';
const ROUTES = [
  [
    "index.html",
    "/"
  ],
  [
    "about.html",
    "/about"
  ],
  [
    "products.html",
    "/products"
  ],
  [
    "trading.html",
    "/trading"
  ],
  [
    "logistics.html",
    "/logistics"
  ],
  [
    "compliance.html",
    "/compliance"
  ],
  [
    "contact.html",
    "/contact"
  ],
  [
    "app.html",
    "/app"
  ],
  [
    "privacy.html",
    "/privacy"
  ],
  [
    "terms.html",
    "/terms"
  ]
];
const SPECIAL_FILES = ['404.html', 'success.html', 'offline.html'];
const ROOT_ASSETS = [
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
  'apple-touch-icon.png',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'favicon.ico'
];
const EXPECTED_HTML = new Set([
  ...ROUTES.map(([file]) => file),
  ...SPECIAL_FILES,
  ...ROUTES.map(([file]) => `zh-hant/${file}`),
  ...SPECIAL_FILES.map((file) => `zh-hant/${file}`)
]);
const EXPECTED_ROOT = new Set([
  ...EXPECTED_HTML,
  ...ROOT_ASSETS,
  '_headers',
  '_redirects',
  'robots.txt',
  'site.webmanifest',
  'sitemap.xml',
  'sw.js'
]);

const errors = [];

function issue(message) {
  errors.push(message);
}

function sha256(value, encoding = 'base64') {
  return createHash('sha256').update(value).digest(encoding);
}

function zhRoute(route) {
  return route === '/' ? '/zh-hant/' : `/zh-hant${route}`;
}

function canonical(route, language) {
  return `${SITE_ORIGIN}${language === 'zh' ? zhRoute(route) : route}`;
}

function nestedValue(object, dottedKey) {
  let value = object;
  for (const key of dottedKey.split('.')) value = value?.[key];
  return typeof value === 'string' ? value : undefined;
}

async function walk(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...await walk(path.join(directory, entry.name), relative));
    } else if (entry.isFile()) {
      files.push(relative);
    }
  }
  return files.sort();
}

function stripQueryHash(reference) {
  return reference.split(/[?#]/, 1)[0];
}

function internalPath(reference) {
  if (!reference || reference.startsWith('#') || /^(?:mailto:|tel:|sms:|data:|blob:|javascript:|\/\/)/i.test(reference)) {
    return undefined;
  }
  if (/^https?:\/\//i.test(reference)) {
    const url = new URL(reference);
    return url.origin === SITE_ORIGIN ? url.pathname : undefined;
  }
  return stripQueryHash(reference);
}

function outputFileForPath(pathname) {
  if (pathname === '/') return 'index.html';
  if (pathname === '/zh-hant' || pathname === '/zh-hant/') return 'zh-hant/index.html';
  const clean = pathname.replace(/^\//, '').replace(/\/$/, '');
  if (clean.startsWith('assets/') || ROOT_ASSETS.includes(clean) || ['site.webmanifest', 'sw.js', 'sitemap.xml', 'robots.txt', '404.html'].includes(clean)) {
    return clean;
  }
  if (clean.endsWith('.html')) return clean;
  return `${clean}.html`;
}

function visibleText($) {
  $('script, style, noscript').remove();
  return $('body').text().replace(/\s+/g, ' ').trim();
}

function validateLocaleMarkup(value, key) {
  if (/<\s*\/?\s*(?:script|style|iframe)\b|\bon[a-z]+\s*=|javascript\s*:/i.test(value)) {
    issue(`locale ${key}: unsafe active markup`);
    return;
  }
  const $ = cheerio.load(`<div id="root">${value}</div>`);
  const allowedTags = new Set(['strong', 'em', 'br', 'a']);
  $('#root').find('*').each((_, element) => {
    const tag = element.tagName.toLowerCase();
    if (!allowedTags.has(tag)) issue(`locale ${key}: forbidden <${tag}>`);
    const allowedAttributes = tag === 'a' ? new Set(['href']) : new Set();
    for (const attribute of Object.keys(element.attribs || {})) {
      if (!allowedAttributes.has(attribute.toLowerCase())) issue(`locale ${key}: forbidden ${attribute} attribute`);
    }
    if (tag === 'a') {
      const href = element.attribs?.href || '';
      const approvedContactLink = href === 'mailto:contact@toptec.com.sg' || href === 'tel:+6589656938';
      const approvedSiteLink = href && !href.includes('..') && /^(?:\/)?[a-z\d][a-z\d._/-]*(?:#[a-z\d_-]+)?$/i.test(href);
      if (!approvedContactLink && !approvedSiteLink) {
        issue(`locale ${key}: unsafe link target`);
      }
    }
  });
}

async function validateSourceTranslations() {
  const locale = JSON.parse(await readFile(path.join(ROOT, 'locales', 'zh-Hant.json'), 'utf8'));
  // One key must always translate the same English source. Reusing a key for
  // different English text silently shows the wrong Chinese copy.
  const englishByKey = new Map();
  const targetAttribute = {
    'data-i18n-placeholder': 'placeholder',
    'data-i18n-title': 'title',
    'data-i18n-aria-label': 'aria-label',
    'data-i18n-alt': 'alt'
  };
  for (const source of [...ROUTES.map(([file]) => file), ...SPECIAL_FILES]) {
    const sourcePath = path.join(ROOT, source);
    const html = await readFile(sourcePath, 'utf8');
    const $ = cheerio.load(html);
    $('[data-i18n], [data-i18n-placeholder], [data-i18n-title], [data-i18n-aria-label], [data-i18n-alt]').each((_, element) => {
      for (const attribute of ['data-i18n', 'data-i18n-placeholder', 'data-i18n-title', 'data-i18n-aria-label', 'data-i18n-alt']) {
        const key = $(element).attr(attribute);
        if (!key) continue;
        const english = (attribute === 'data-i18n' ? $(element).html() : $(element).attr(targetAttribute[attribute]) || '')
          .replace(/\s+/g, ' ').trim();
        const seen = englishByKey.get(`${attribute}:${key}`);
        if (seen && seen.english !== english) {
          issue(`${source}: i18n key ${key} maps to different English text than in ${seen.source} ("${english.slice(0, 50)}" vs "${seen.english.slice(0, 50)}")`);
        } else if (!seen) {
          englishByKey.set(`${attribute}:${key}`, { english, source });
        }
        const value = nestedValue(locale, key);
        if (value === undefined) {
          issue(`${source}: missing locale key ${key}`);
        } else if (attribute === 'data-i18n') {
          validateLocaleMarkup(value, key);
        } else if (/<[^>]+>/.test(value)) {
          issue(`${source}: attribute translation ${key} contains markup`);
        }
      }
    });
  }
}

function validateAllowlist(files) {
  for (const expected of EXPECTED_ROOT) {
    if (!files.includes(expected)) issue(`missing required deploy file: ${expected}`);
  }
  for (const file of files) {
    if (EXPECTED_ROOT.has(file)) continue;
    if (/^assets\/css\/[a-z0-9_-]+\.[a-f0-9]{12}\.css$/i.test(file)) continue;
    if (/^assets\/js\/[a-z0-9_-]+\.[a-f0-9]{12}\.js$/i.test(file)) continue;
    if (/^assets\/img\/[a-z0-9_.-]+\.(?:avif|jpe?g|png|svg|webp)$/i.test(file)) continue;
    issue(`file is outside the deployment allowlist: ${file}`);
  }

  const forbiddenPatterns = [
    /(?:^|\/)graphify-out(?:\/|$)/i,
    /(?:^|\/)scripts(?:\/|$)/i,
    /(?:^|\/)locales(?:\/|$)/i,
    /(?:^|\/)(?:readme|operations_runbook)\.md$/i,
    /\.(?:md|py|zip|map)$/i,
    /(?:^|\/)package(?:-lock)?\.json$/i,
    /(?:^|\/)netlify\.toml$/i
  ];
  files.forEach((file) => forbiddenPatterns.forEach((pattern) => {
    if (pattern.test(file)) issue(`forbidden deployment artifact: ${file}`);
  }));
}

async function validateHtml(files, headers) {
  const htmlFiles = files.filter((file) => file.endsWith('.html'));
  const documents = new Map();
  const references = new Set();
  const cspHashes = new Set();

  for (const file of htmlFiles) {
    const html = await readFile(path.join(DIST, file), 'utf8');
    const $ = cheerio.load(html);
    documents.set(file, { html, $ });

    if ($('[data-i18n], [data-i18n-placeholder], [data-i18n-title], [data-i18n-aria-label], [data-i18n-alt]').length) {
      issue(`${file}: runtime i18n attributes remain in static output`);
    }
    if ($('link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]').length) {
      issue(`${file}: hosted Google Fonts remain`);
    }
    if ($('style, [style]').length) issue(`${file}: inline style markup remains`);
    if ($('iframe').length) issue(`${file}: eager third-party iframe remains; use click-to-load`);
    if ($('main').length !== 1) issue(`${file}: expected exactly one main landmark`);
    if ($('meta[name="toptec-pwa-enabled"]').attr('content') !== 'true') {
      issue(`${file}: normal build is missing the enabled PWA control`);
    }

    const ids = new Set();
    $('[id]').each((_, element) => {
      const id = $(element).attr('id');
      if (ids.has(id)) issue(`${file}: duplicate id #${id}`);
      ids.add(id);
    });

    $('img').each((_, element) => {
      const image = $(element);
      if (image.attr('alt') === undefined) issue(`${file}: image is missing alt`);
      if (!image.attr('width') || !image.attr('height')) issue(`${file}: image is missing intrinsic dimensions`);
      if (!['eager', 'lazy'].includes(image.attr('loading') || '') && !image.closest('.site-header, .utility-card').length) {
        issue(`${file}: image must declare loading="eager" or loading="lazy" (${image.attr('src')})`);
      }
    });
    $('button.mobile-toggle').each((_, element) => {
      const button = $(element);
      if (!button.attr('aria-label') && !button.attr('aria-labelledby') && !button.text().trim()) {
        issue(`${file}: mobile menu button has no accessible name`);
      }
    });
    $('div[aria-label]:not([role])').each(() => {
      issue(`${file}: generic div uses aria-label without a role`);
    });

    let previousHeading = 0;
    $('h1,h2,h3,h4,h5,h6').each((_, element) => {
      const level = Number(element.tagName.slice(1));
      if (previousHeading && level > previousHeading + 1) {
        issue(`${file}: heading level skips from h${previousHeading} to h${level}`);
      }
      previousHeading = level;
    });

    $('script:not([src])').each((_, element) => {
      const type = ($(element).attr('type') || '').toLowerCase();
      if (type !== 'application/ld+json') {
        issue(`${file}: executable inline script remains`);
        return;
      }
      const hash = `'sha256-${sha256($(element).html() || '')}'`;
      cspHashes.add(hash);
      if (!headers.includes(hash)) issue(`${file}: JSON-LD hash is absent from CSP`);
      try {
        JSON.parse($(element).html());
      } catch {
        issue(`${file}: invalid JSON-LD`);
      }
    });
    $('[onload], [onclick], [onchange], [onsubmit], [onerror]').each((_, element) => {
      issue(`${file}: inline event handler on <${element.tagName}>`);
    });

    $('[href], [src], [action], [poster]').each((_, element) => {
      for (const attribute of ['href', 'src', 'action', 'poster']) {
        const reference = $(element).attr(attribute);
        if (!reference) continue;
        if (/^javascript:/i.test(reference)) issue(`${file}: javascript URL in ${attribute}`);
        const pathname = internalPath(reference);
        if (!pathname) continue;
        references.add(stripQueryHash(pathname));
        if (file.startsWith('zh-hant/') && !reference.startsWith('/') && !/^https?:\/\//i.test(reference) && !reference.startsWith('#')) {
          issue(`${file}: ${attribute} must be root-absolute (${reference})`);
        }
        if (/\.html(?:[?#]|$)/i.test(reference) && !/\/404\.html(?:[?#]|$)/i.test(reference)) {
          issue(`${file}: internal link exposes .html (${reference})`);
        }
      }
    });
    $('[srcset]').each((_, element) => {
      $(element).attr('srcset').split(',').forEach((candidate) => {
        const reference = candidate.trim().split(/\s+/, 1)[0];
        const pathname = internalPath(reference);
        if (pathname) references.add(stripQueryHash(pathname));
        if (file.startsWith('zh-hant/') && !reference.startsWith('/')) {
          issue(`${file}: srcset URL must be root-absolute (${reference})`);
        }
      });
    });
  }

  for (const [file, { $ }] of documents) {
    $('a[href]').each((_, element) => {
      const reference = $(element).attr('href');
      if (!reference || /^(?:mailto:|tel:|sms:|https?:\/\/|\/\/)/i.test(reference)) return;
      const hashIndex = reference.indexOf('#');
      const pathname = (hashIndex === -1 ? reference : reference.slice(0, hashIndex)).split('?', 1)[0];
      const fragment = hashIndex === -1 ? '' : decodeURIComponent(reference.slice(hashIndex + 1));
      const currentPath = file === 'index.html' ? '/' : file === 'zh-hant/index.html' ? '/zh-hant/' : `/${file.replace(/\.html$/, '')}`;
      const targetPath = pathname || currentPath;
      const targetFile = outputFileForPath(targetPath);
      const target = documents.get(targetFile);
      if (!target && !files.includes(targetFile)) {
        issue(`${file}: broken internal link ${reference}`);
      } else if (fragment && target) {
        const decodedFragment = decodeURIComponent(fragment);
        const found = target.$('[id]').toArray().some((node) => target.$(node).attr('id') === decodedFragment);
        if (!found) issue(`${file}: missing fragment #${fragment} in ${targetFile}`);
      }
    });
  }

  for (const [sourceFile, route] of ROUTES) {
    for (const language of ['en', 'zh']) {
      const file = language === 'en' ? sourceFile : `zh-hant/${sourceFile}`;
      const { $ } = documents.get(file);
      const expectedSelf = canonical(route, language);
      const expectedEn = canonical(route, 'en');
      const expectedZh = canonical(route, 'zh');
      if ($('html').attr('lang') !== (language === 'zh' ? 'zh-Hant' : 'en')) issue(`${file}: incorrect lang attribute`);
      if ($('link[rel="canonical"]').length !== 1 || $('link[rel="canonical"]').attr('href') !== expectedSelf) {
        issue(`${file}: incorrect self-canonical`);
      }
      const alternates = new Map();
      $('link[rel="alternate"][hreflang]').each((_, element) => alternates.set($(element).attr('hreflang'), $(element).attr('href')));
      if (alternates.get('en') !== expectedEn || alternates.get('zh-Hant') !== expectedZh || alternates.get('x-default') !== expectedEn) {
        issue(`${file}: incomplete reciprocal hreflang set`);
      }
      if ($('meta[property="og:url"]').attr('content') !== expectedSelf) issue(`${file}: og:url does not match canonical`);
      for (const property of ['og:site_name', 'og:image:alt', 'og:image:width', 'og:image:height']) {
        if (!$(`meta[property="${property}"]`).attr('content')?.trim()) issue(`${file}: ${property} is missing`);
      }
      const jsonLd = $('script[type="application/ld+json"]');
      if (jsonLd.length !== 1) {
        issue(`${file}: expected exactly one JSON-LD block`);
      } else {
        try {
          const graph = JSON.parse(jsonLd.html())['@graph'] || [];
          const organization = graph.find((node) => node['@type'] === 'Organization');
          const webPage = graph.find((node) => /Page$/.test(node['@type'] || ''));
          if (organization?.legalName !== 'TOPTEC GLOBAL PTE. LTD.' || organization?.identifier?.value !== '201932202N') {
            issue(`${file}: JSON-LD organization legal name or UEN is incorrect`);
          }
          if (webPage?.url !== expectedSelf || webPage?.inLanguage !== (language === 'zh' ? 'zh-Hant' : 'en')) {
            issue(`${file}: JSON-LD WebPage url/inLanguage does not match the page`);
          }
          if (route !== '/' && !graph.some((node) => node['@type'] === 'BreadcrumbList')) issue(`${file}: JSON-LD breadcrumb is missing`);
        } catch {
          // Invalid JSON is reported by the generic JSON-LD check above.
        }
      }
      if (!$('title').text().trim() || !$('meta[name="description"]').attr('content')?.trim()) issue(`${file}: title or description missing`);
    }
  }

  for (const special of SPECIAL_FILES) {
    for (const file of [special, `zh-hant/${special}`]) {
      const { $ } = documents.get(file);
      if (!$('meta[name="robots"]').attr('content')?.toLowerCase().includes('noindex')) issue(`${file}: special page must be noindex`);
      if ($('link[rel="canonical"]').length || $('link[rel="alternate"][hreflang]').length) issue(`${file}: special utility page should not be canonicalized or have hreflang`);
      if ($('script[type="application/ld+json"]').length) issue(`${file}: special utility page must not carry structured data`);
    }
  }

  return { documents, references };
}

function validateContactForm(documents, sourceScriptText) {
  for (const [file, expectedAction] of [['contact.html', '/success'], ['zh-hant/contact.html', '/zh-hant/success']]) {
    const { $ } = documents.get(file);
    const form = $('#contact-form');
    if (!form.length || form.attr('method')?.toUpperCase() !== 'POST' || form.attr('action') !== expectedAction) {
      issue(`${file}: Netlify POST form or action is incorrect`);
    }
    if (form.attr('data-netlify') !== 'true' || !form.attr('data-netlify-honeypot')) issue(`${file}: Netlify form/honeypot configuration missing`);
    const limits = { name: '80', company: '120', title: '100', email: '254', phone: '40', message: '4000' };
    for (const [field, maximum] of Object.entries(limits)) {
      if (form.find(`[name="${field}"]`).attr('maxlength') !== maximum) issue(`${file}: ${field} maxlength must be ${maximum}`);
    }
    if (form.find('[name="title"]').attr('required') !== undefined) issue(`${file}: job title must be optional`);
    const types = ['product_purchase', 'supplier_cooperation', 'logistics_cooperation', 'corporate_kyc_request', 'other'];
    const select = form.find('select[name="inquiry_type"]');
    if (select.attr('required') === undefined || select.find('option').map((_, option) => $(option).attr('value')).get().join('|') !== ['', ...types].join('|')) {
      issue(`${file}: required inquiry_type contract is incorrect`);
    }
    if (form.find('[name="company"]').attr('required') === undefined) issue(`${file}: company must be required`);
    if (form.find('input[type="file"]').length) issue(`${file}: public uploads are forbidden`);
    if (!form.find('[name="bot-field"]').closest('[hidden][aria-hidden="true"]').length || form.find('[name="bot-field"]').attr('tabindex') !== '-1') {
      issue(`${file}: honeypot must remain hidden from users and assistive technology`);
    }
    if (!/KYC/.test(form.find('#sensitive-document-warning').text())) issue(`${file}: explicit KYC warning is missing`);
    const status = form.find('[role="status"]');
    const alert = form.find('[role="alert"]');
    if (!status.length || !alert.length) issue(`${file}: separate status and alert live regions are required`);
    const text = visibleText(cheerio.load($.html()));
    if (!/(?:passport|護照)/i.test(text) || !/KYC/.test(text)) issue(`${file}: sensitive-document warning is missing`);
  }

  for (const required of ['AbortController', '12000', 'response.ok']) {
    if (!sourceScriptText.includes(required)) issue(`contact form script is missing ${required}`);
  }
  if (/freeEmailDomains|isFreeDomain|businessEmail/i.test(sourceScriptText)) issue('contact form still blocks free email providers');
}

function validateClaims(documents) {
  const appEn = visibleText(cheerio.load(documents.get('app.html').html));
  const appZh = visibleText(cheerio.load(documents.get('zh-hant/app.html').html));
  if (!/public website/i.test(appEn) || !/does not provide/i.test(appEn)) issue('app page does not clearly define the public website shortcut limitation');
  if (!/公開(?:官網|網站)/.test(appZh) || !/不提供/.test(appZh)) issue('zh-Hant app page does not clearly define the website shortcut limitation');
  const legacyPositiveClaims = [
    /track (?:your )?(?:projects|workflows)/i,
    /secure (?:compliance )?(?:file|document) vault/i,
    /sign in to (?:your )?dashboard/i,
    /real[- ]time project (?:tracking|dashboard)/i
  ];
  legacyPositiveClaims.forEach((pattern) => {
    if (pattern.test(appEn)) issue(`app page retains unsupported positive claim: ${pattern}`);
  });
  for (const [file, { html }] of documents) {
    const text = visibleText(cheerio.load(html));
    // Scan the full public HTML (including meta and JSON-LD), not only visible text.
    if (/Paya Lebar|409051|Taipei|Taiwan office|台北|臺北|供應鏈治理|Supply Chain Governance/i.test(html)) issue(`${file}: obsolete company information or positioning remains`);
    if (/Sambu|our terminal|our refinery|our fleet|\b(?:CIF|FOB)\b/i.test(html)) issue(`${file}: unpublished facility or delivery claim remains`);
    if (/electronic components?|engineering advice|statement of work|工程建議|工作說明書/i.test(html)) issue(`${file}: legacy electronics or project wording remains`);
    if (!file.endsWith('about.html') && /electronics|電子(?:零|產品|相關)/i.test(text)) issue(`${file}: electronics content is only permitted in About history`);
  }
  for (const file of ['index.html', 'about.html', 'zh-hant/index.html', 'zh-hant/about.html']) {
    const text = visibleText(cheerio.load(documents.get(file).html));
    if (!text.includes('SSIC 46610') || !text.includes('711 Geylang Road') || !text.includes('201932202N')) issue(`${file}: current corporate facts are incomplete`);
    const zh = file.startsWith('zh-hant/');
    const positioning = zh ? ['能源與成品油貿易', '燃料及相關產品批發'] : ['Energy & Refined Products Trading', 'Wholesale of Fuels and Related Products'];
    for (const phrase of positioning) {
      if (!text.includes(phrase)) issue(`${file}: required positioning phrase is missing: ${phrase}`);
    }
  }
}

async function validateAssets(files, references) {
  const manifest = JSON.parse(await readFile(path.join(DIST, 'site.webmanifest'), 'utf8'));
  if (manifest.id !== '/' || manifest.start_url !== '/' || manifest.name !== 'TOPTEC Global Website') issue('manifest identity/start URL is incorrect');
  if (!manifest.icons?.some((icon) => icon.sizes === '512x512' && /maskable/.test(icon.purpose || ''))) issue('manifest has no 512px maskable icon');
  for (const icon of manifest.icons || []) references.add(icon.src);

  const codeFiles = files.filter((file) => /^assets\/(?:css|js)\//.test(file));
  const scriptText = [];
  for (const file of codeFiles) {
    const content = await readFile(path.join(DIST, file), 'utf8');
    for (const match of content.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
      const reference = match[1];
      if (!reference.startsWith('data:')) references.add(reference.startsWith('/') ? reference : `/${path.posix.normalize(path.posix.join(path.posix.dirname(file), reference))}`);
    }
    if (file.endsWith('.js')) {
      scriptText.push(content);
      try { new vm.Script(content, { filename: file }); } catch (error) { issue(`${file}: JavaScript syntax error: ${error.message}`); }
    }
  }

  for (const file of files.filter((entry) => entry.startsWith('assets/') || ROOT_ASSETS.includes(entry))) {
    const publicPath = `/${file}`;
    if (!references.has(publicPath)) issue(`deployed asset is not referenced: ${file}`);
    const size = (await stat(path.join(DIST, file))).size;
    if (size > 750 * 1024) issue(`public asset exceeds 750 KiB: ${file}`);
  }
  return scriptText.join('\n');
}

function validateReferenceTargets(files, references) {
  for (const reference of references) {
    if (!reference?.startsWith('/')) continue;
    const target = outputFileForPath(reference);
    if (!files.includes(target)) issue(`referenced public target is missing: ${reference} -> ${target}`);
  }
}

function validateHeadersAndRedirects(headers, redirects) {
  const normalize = (value) => value.replace(/\/+$/, '') || '/';
  const publicRoutes = ROUTES.flatMap(([, route]) => [route, zhRoute(route)]);
  for (const line of redirects.split('\n')) {
    const [source, target, status] = line.trim().split(/\s+/);
    if (!source || source.startsWith('#') || !status) continue;
    if (/^30[1278]/.test(status) && normalize(source) === normalize(target)) {
      issue(`_redirects creates a Netlify normalized self-redirect: ${line}`);
    }
    if (status.startsWith('410')) {
      const prefix = normalize(source.replace(/\/\*$/, ''));
      for (const route of publicRoutes) {
        const normalized = normalize(route);
        if (normalized === prefix || (source.endsWith('/*') && normalized.startsWith(`${prefix}/`))) {
          issue(`_redirects blocks public route ${route}: ${line}`);
        }
      }
    }
  }
  const requiredDirectives = [
    "default-src 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "script-src-attr 'none'",
    "style-src-attr 'none'",
    'upgrade-insecure-requests'
  ];
  const requiredHeaders = [
    'Content-Security-Policy',
    'Referrer-Policy: strict-origin-when-cross-origin',
    'Permissions-Policy:',
    'X-Content-Type-Options: nosniff',
    'X-Frame-Options: DENY',
    'Service-Worker-Allowed: /',
    'max-age=31536000, immutable'
  ];
  requiredDirectives.forEach((directive) => { if (!headers.includes(directive)) issue(`_headers missing CSP directive ${directive}`); });
  requiredHeaders.forEach((header) => { if (!headers.includes(header)) issue(`_headers missing ${header}`); });

  for (const route of ['/graphify-out/*', '/README.md', '/scripts/*', '/assets/img/favicon_Toptec.zip']) {
    if (!new RegExp(`^${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('\\*', '.*')} .* 410!$`, 'm').test(redirects)) {
      issue(`_redirects lacks 410 rule for ${route}`);
    }
  }
  // The Chinese 404 must follow every specific /zh-hant/ rule (Netlify stops at
  // the first match) and precede any broader site-wide /* rule.
  const rules = redirects.split('\n').map((line) => line.trim().split(/\s+/)).filter(([source]) => source);
  const zhNotFound = rules.findIndex(([source, target, status]) => source === '/zh-hant/*' && target === '/zh-hant/404.html' && status === '404');
  if (zhNotFound === -1) {
    issue('_redirects lacks the /zh-hant/* Chinese 404 rule');
  } else {
    rules.forEach(([source], index) => {
      if (index > zhNotFound && source.startsWith('/zh-hant/') && source !== '/zh-hant/*') {
        issue(`_redirects: specific rule ${source} is shadowed by the earlier /zh-hant/* 404 rule`);
      }
      if (index < zhNotFound && source === '/*') issue('_redirects: a site-wide /* rule precedes the /zh-hant/* 404 rule');
    });
  }
  for (const [source, route] of ROUTES) {
    if (route === '/') continue;
    if (!redirects.includes(`/${source} ${route} 301!`)) issue(`_redirects lacks canonical redirect for /${source}`);
    if (!redirects.includes(`/zh-hant/${source} ${zhRoute(route)} 301!`)) issue(`_redirects lacks zh-Hant canonical redirect for ${source}`);
  }
  for (const [old, target] of Object.entries({ electronics: 'about', services: 'about', 'case-studies': 'trading', solutions: 'trading', trust: 'compliance' })) {
    for (const prefix of ['', '/zh-hant']) {
      for (const suffix of ['', '.html', '/']) {
        const rule = `${prefix}/${old}${suffix} ${prefix}/${target} 301!`;
        if (!redirects.split('\n').includes(rule)) issue(`missing legacy redirect: ${rule}`);
      }
    }
  }
}

async function validateServiceWorker() {
  const serviceWorker = await readFile(path.join(DIST, 'sw.js'), 'utf8');
  if (/__TOPTEC_[A-Z_]+__/.test(serviceWorker)) issue('service worker contains unresolved build placeholders');
  for (const marker of ['MAX_RUNTIME_ENTRIES = 50', "request.method !== 'GET'", "request.headers.has('authorization')", 'no-store|private', "name.startsWith(CACHE_PREFIX)", "url.pathname.startsWith('/zh-hant/')", 'isAllowlistedPublicPath', 'TOPTEC_PWA_KILL_SWITCH']) {
    if (!serviceWorker.includes(marker)) issue(`service worker safety marker missing: ${marker}`);
  }
  try { new vm.Script(serviceWorker, { filename: 'sw.js' }); } catch (error) { issue(`service worker syntax error: ${error.message}`); }
}

async function validateSitemap() {
  const sitemap = await readFile(path.join(DIST, 'sitemap.xml'), 'utf8');
  const validation = XMLValidator.validate(sitemap);
  if (validation !== true) {
    issue(`sitemap is not valid XML: ${validation.err?.msg || 'unknown XML error'}`);
    return;
  }
  const parsed = new XMLParser({ ignoreAttributes: false }).parse(sitemap);
  if (!parsed.urlset || !parsed.urlset.url) issue('sitemap XML has no urlset entries');
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const expected = ROUTES.flatMap(([, route]) => [canonical(route, 'en'), canonical(route, 'zh')]);
  if (locations.length !== expected.length || new Set(locations).size !== expected.length) issue('sitemap locations are missing or duplicated');
  expected.forEach((url) => { if (!locations.includes(url)) issue(`sitemap missing ${url}`); });
  if (!sitemap.includes('hreflang="x-default"')) issue('sitemap lacks x-default alternates');
}

async function validateProductionReviewGate() {
  let register;
  try {
    register = JSON.parse(await readFile(path.join(ROOT, 'compliance', 'claims.json'), 'utf8'));
  } catch (error) {
    issue(`review gate: claims register is unavailable or invalid (${error.message})`);
    return;
  }
  if (register.schemaVersion !== 1 || !Array.isArray(register.claims) || !register.claims.length) {
    issue('review gate: claims register schema or claims list is invalid');
    return;
  }
  const approvals = register.releaseApprovals || {};
  for (const [approval, approved] of Object.entries(approvals)) {
    if (approved !== true) issue(`review gate: release approval is not recorded: ${approval}`);
  }
  if (!Object.keys(approvals).length) issue('review gate: release approvals are missing');

  const today = new Date().toISOString().slice(0, 10);
  const ids = new Set();
  for (const claim of register.claims) {
    const required = ['id', 'page', 'claim', 'owner', 'evidence', 'expiry', 'classification', 'status'];
    for (const field of required) {
      if (!claim[field] || (Array.isArray(claim[field]) && !claim[field].length)) issue(`review gate: ${claim.id || 'unknown claim'} lacks ${field}`);
    }
    if (ids.has(claim.id)) issue(`review gate: duplicate claim ID ${claim.id}`);
    ids.add(claim.id);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(claim.expiry || '') || claim.expiry < today) issue(`review gate: ${claim.id} evidence is expired or has an invalid expiry`);
    if (!/^APPROVED(?:_|$)/.test(claim.status || '')) issue(`review gate: ${claim.id} is not approved (${claim.status || 'missing status'})`);
  }
}

async function main() {
  if (Number(process.versions.node.split('.')[0]) !== 24) issue(`Node.js 24 is required; received ${process.version}`);
  let files;
  try {
    files = await walk(DIST);
  } catch {
    throw new Error('[check] dist is missing; run npm run build first');
  }

  validateAllowlist(files);
  await validateSourceTranslations();
  const headers = await readFile(path.join(DIST, '_headers'), 'utf8');
  const redirects = await readFile(path.join(DIST, '_redirects'), 'utf8');
  validateHeadersAndRedirects(headers, redirects);
  const { documents, references } = await validateHtml(files, headers);
  await validateAssets(files, references);
  const sourceScriptText = await readFile(path.join(ROOT, 'assets', 'js', 'main.js'), 'utf8');
  validateReferenceTargets(files, references);
  validateContactForm(documents, sourceScriptText);
  validateClaims(documents);
  await validateServiceWorker();
  await validateSitemap();
  if (process.argv.includes('--review-gate')) await validateProductionReviewGate();

  if (errors.length) {
    console.error(`[check] ${errors.length} problem(s):`);
    errors.forEach((error) => console.error(`  - ${error}`));
    process.exitCode = 1;
    return;
  }
  console.log(`[check] ${files.length} allowlisted files validated successfully`);
}

await main();
