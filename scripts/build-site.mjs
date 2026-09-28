import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import { transform } from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SITE_ORIGIN = 'https://toptec.com.sg';
const ZH_PREFIX = '/zh-hant';
const PWA_ENABLED = process.env.PWA_KILL_SWITCH !== 'true';

const ROUTES = [
  {
    "source": "index.html",
    "route": "/",
    "title": {
      "en": "Energy & Refined Products Trading | TOPTEC Global",
      "zh": "能源與成品油貿易｜TOPTEC Global"
    },
    "description": {
      "en": "Singapore-based trading and physical cargo coordination for refined petroleum products, with a focus on Asian markets.",
      "zh": "立足新加坡，從事成品油貿易與實體貨物協調，以亞洲市場為重點。"
    },
    "image": "/assets/img/energy-marine-1280.jpg"
  },
  {
    "source": "about.html",
    "route": "/about",
    "title": {
      "en": "About TOPTEC | TOPTEC Global",
      "zh": "關於 TOPTEC｜TOPTEC Global"
    },
    "description": {
      "en": "Singapore-incorporated energy trading company established in 2019. Corporate information and transaction-specific coordination.",
      "zh": "2019 年於新加坡成立的能源貿易公司，提供公司資料及依交易需求進行的協調介紹。"
    },
    "image": "/assets/img/energy-marine-1280.jpg"
  },
  {
    "source": "products.html",
    "route": "/products",
    "title": {
      "en": "Energy Products | TOPTEC Global",
      "zh": "能源產品｜TOPTEC Global"
    },
    "description": {
      "en": "EN590 10ppm diesel and gasoil enquiries for international wholesale requirements. Specifications and availability subject to agreement.",
      "zh": "面向國際批發需求的 EN590 10ppm 柴油及 Gasoil 詢問；規格與供應情況須個別議定。"
    },
    "image": "/assets/img/energy-marine-1280.jpg"
  },
  {
    "source": "trading.html",
    "route": "/trading",
    "title": {
      "en": "Trading & Supply | TOPTEC Global",
      "zh": "交易與供應｜TOPTEC Global"
    },
    "description": {
      "en": "Commercial sourcing, cargo arrangements, documentation and physical delivery coordination for refined petroleum products.",
      "zh": "成品油商務採購、貨物安排、文件及實體交付協調。"
    },
    "image": "/assets/img/energy-marine-1280.jpg"
  },
  {
    "source": "logistics.html",
    "route": "/logistics",
    "title": {
      "en": "Terminal & Logistics | TOPTEC Global",
      "zh": "碼頭與物流｜TOPTEC Global"
    },
    "description": {
      "en": "Transaction-specific storage, terminal handling and marine logistics coordination through third-party providers.",
      "zh": "依個別交易需求，透過第三方業者協調儲存、碼頭作業與海運物流。"
    },
    "image": "/assets/img/energy-storage-1280.jpg"
  },
  {
    "source": "contact.html",
    "route": "/contact",
    "title": {
      "en": "Contact Trading Desk | TOPTEC Global",
      "zh": "聯絡交易團隊｜TOPTEC Global"
    },
    "description": {
      "en": "Contact TOPTEC for product enquiries, supplier cooperation, logistics arrangements or corporate information requests.",
      "zh": "聯絡 TOPTEC 洽詢產品、供應商合作、物流安排，或申請公司資料。"
    },
    "image": "/assets/img/energy-marine-1280.jpg"
  },
  {
    "source": "app.html",
    "route": "/app",
    "title": {
      "en": "Website Shortcut | TOPTEC Global",
      "zh": "網站捷徑｜TOPTEC Global"
    },
    "description": {
      "en": "Install a shortcut to TOPTEC’s public website. Public company and energy product information with limited offline reading.",
      "zh": "安裝 TOPTEC 公開網站捷徑，瀏覽公司與能源產品資訊，並提供有限的離線閱讀。"
    },
    "image": "/assets/img/energy-marine-1280.jpg"
  },
  {
    "source": "privacy.html",
    "route": "/privacy",
    "title": {
      "en": "Privacy Policy | TOPTEC Global",
      "zh": "隱私權政策｜TOPTEC Global"
    },
    "description": {
      "en": "How TOPTEC handles personal information submitted through its public website.",
      "zh": "TOPTEC 如何處理透過公開網站提交的個人資料。"
    },
    "image": "/assets/img/energy-marine-1280.jpg"
  },
  {
    "source": "terms.html",
    "route": "/terms",
    "title": {
      "en": "Terms of Use | TOPTEC Global",
      "zh": "使用條款｜TOPTEC Global"
    },
    "description": {
      "en": "Terms governing the use of TOPTEC’s public corporate website.",
      "zh": "TOPTEC 公開公司網站的使用條款。"
    },
    "image": "/assets/img/energy-marine-1280.jpg"
  }
];

const SPECIAL_PAGES = [
  {
    source: '404.html',
    route: '/404',
    output: '404.html',
    robots: 'noindex,follow',
    title: { en: 'Page Not Found | TOPTEC Global', zh: '找不到頁面｜TOPTEC Global' },
    description: { en: 'The requested page could not be found.', zh: '找不到您要求的頁面。' }
  },
  {
    source: 'success.html',
    route: '/success',
    output: 'success.html',
    robots: 'noindex,follow',
    title: { en: 'Enquiry Received | TOPTEC Global', zh: '已收到詢問｜TOPTEC Global' },
    description: {
      en: 'Thank you for contacting TOPTEC Global. Your enquiry has been received.',
      zh: '感謝您聯絡 TOPTEC Global，我們已收到您的詢問。'
    }
  },
  {
    source: 'offline.html',
    route: '/offline',
    output: 'offline.html',
    robots: 'noindex,nofollow',
    title: { en: 'Offline | TOPTEC Global', zh: '目前離線｜TOPTEC Global' },
    description: {
      en: 'The TOPTEC Global public website is currently unavailable offline.',
      zh: '目前無法連線至 TOPTEC Global 公開官網。'
    }
  }
];

// Share-image metadata. Dimensions are the measured size of the 1280px JPEG
// variants; alt text describes a general industry scene only.
const SHARE_IMAGE_SIZE = { width: '1280', height: '720' };
const SHARE_IMAGE_ALT = {
  '/assets/img/energy-marine-1280.jpg': {
    en: 'Oil tanker at a marine terminal',
    zh: '海運碼頭旁的油輪'
  },
  '/assets/img/energy-storage-1280.jpg': {
    en: 'Petroleum storage tanks beside a marine jetty',
    zh: '海運碼頭旁的石油儲槽'
  }
};

// Public corporate facts used for structured data. `name` is the brand shown
// on the site; `legalName` must remain the registered entity name.
const ORGANIZATION = {
  '@type': 'Organization',
  '@id': `${SITE_ORIGIN}/#organization`,
  name: 'TOPTEC Global',
  legalName: 'TOPTEC GLOBAL PTE. LTD.',
  url: `${SITE_ORIGIN}/`,
  logo: `${SITE_ORIGIN}/assets/img/toptec-logo.svg`,
  foundingDate: '2019-09-26',
  identifier: { '@type': 'PropertyValue', name: 'UEN', value: '201932202N' },
  email: 'contact@toptec.com.sg',
  telephone: '+65 8965 6938',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '711 Geylang Road, #03-01, Oriental Venture Building',
    addressLocality: 'Singapore',
    postalCode: '389626',
    addressCountry: 'SG'
  }
};

const ROOT_FILES = [
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
  'apple-touch-icon.png',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'favicon.ico'
];

const SOURCE_ROUTE = new Map([
  ...ROUTES.map((item) => [item.source, item.route]),
  ...SPECIAL_PAGES.map((item) => [item.source, item.route])
]);
const ROUTE_PATHS = new Set([...SOURCE_ROUTE.values()]);

function sha256(value, encoding = 'hex') {
  return createHash('sha256').update(value).digest(encoding);
}

function fail(message) {
  throw new Error(`[build] ${message}`);
}

function zhRoute(route) {
  return route === '/' ? `${ZH_PREFIX}/` : `${ZH_PREFIX}${route}`;
}

function canonical(route, language) {
  return `${SITE_ORIGIN}${language === 'zh' ? zhRoute(route) : route}`;
}

function readLocaleValue(locale, dottedKey) {
  let value = locale;
  for (const key of dottedKey.split('.')) {
    value = value?.[key];
  }
  return typeof value === 'string' ? value : undefined;
}

function validateTranslationMarkup(value, key) {
  if (/<\s*\/?\s*(?:script|style|iframe)\b|\bon[a-z]+\s*=|javascript\s*:/i.test(value)) {
    fail(`unsafe markup in zh-Hant translation ${key}`);
  }

  const allowedTags = new Set(['strong', 'em', 'br', 'a']);
  const fragment = cheerio.load(`<div id="translation-root">${value}</div>`);
  fragment('#translation-root').find('*').each((_, element) => {
    const tagName = element.tagName.toLowerCase();
    if (!allowedTags.has(tagName)) {
      fail(`zh-Hant translation ${key} uses forbidden <${tagName}> markup`);
    }
    const attributes = Object.keys(element.attribs || {});
    const allowedAttributes = tagName === 'a' ? new Set(['href']) : new Set();
    for (const attribute of attributes) {
      if (!allowedAttributes.has(attribute.toLowerCase())) {
        fail(`zh-Hant translation ${key} uses forbidden ${attribute} attribute`);
      }
    }
    if (tagName === 'a') {
      const href = element.attribs?.href || '';
      const approvedContactLink = href === 'mailto:contact@toptec.com.sg' || href === 'tel:+6589656938';
      const approvedSiteLink = href && !href.includes('..') && /^(?:\/)?[a-z\d][a-z\d._/-]*(?:#[a-z\d_-]+)?$/i.test(href);
      if (!approvedContactLink && !approvedSiteLink) {
        fail(`zh-Hant translation ${key} has an unsafe link target`);
      }
    }
  });
  return value;
}

function upsertMeta($, selector, attributes) {
  let element = $(selector).first();
  if (!element.length) {
    element = $('<meta>');
    $('head').append(element);
  }
  Object.entries(attributes).forEach(([name, value]) => element.attr(name, value));
}

function splitReference(reference) {
  const match = String(reference).match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  return {
    pathname: match?.[1] ?? reference,
    query: match?.[2] ?? '',
    hash: match?.[3] ?? ''
  };
}

function sourcePathFromReference(reference) {
  if (!reference || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(reference)) {
    return undefined;
  }
  const { pathname } = splitReference(reference);
  return `/${pathname.replace(/^\.\//, '').replace(/^\//, '')}`;
}

function normalizeInternalReference(reference, language, fingerprintMap) {
  if (!reference || reference.startsWith('#') || /^(?:mailto:|tel:|sms:|data:|blob:)/i.test(reference)) {
    return reference;
  }
  if (/^javascript:/i.test(reference)) {
    fail(`javascript: URL is not permitted: ${reference}`);
  }

  let working = reference.trim();
  if (/^https?:\/\//i.test(working)) {
    const absolute = new URL(working);
    if (absolute.origin !== SITE_ORIGIN) {
      return reference;
    }
    working = `${absolute.pathname}${absolute.search}${absolute.hash}`;
  } else if (working.startsWith('//')) {
    return reference;
  }

  const parts = splitReference(working);
  let pathname = parts.pathname.replace(/\\/g, '/');
  if (!pathname) {
    return reference;
  }
  pathname = `/${pathname.replace(/^\.\//, '').replace(/^\//, '')}`;

  const basename = path.posix.basename(pathname);
  if (SOURCE_ROUTE.has(basename) && !pathname.startsWith('/assets/')) {
    pathname = SOURCE_ROUTE.get(basename);
  } else if (pathname === '/index') {
    pathname = '/';
  }

  const fingerprinted = fingerprintMap.get(pathname);
  if (fingerprinted) {
    pathname = fingerprinted;
  }

  if (language === 'zh' && ROUTE_PATHS.has(pathname)) {
    pathname = zhRoute(pathname);
  }

  return `${pathname}${parts.query}${parts.hash}`;
}

function rewriteDocumentReferences($, language, fingerprintMap) {
  $('[href], [src], [action], [poster]').each((_, element) => {
    const $element = $(element);
    for (const attribute of ['href', 'src', 'action', 'poster']) {
      if ($element.attr(attribute)) {
        $element.attr(attribute, normalizeInternalReference($element.attr(attribute), language, fingerprintMap));
      }
    }
  });

  $('[srcset]').each((_, element) => {
    const $element = $(element);
    const rewritten = $element.attr('srcset').split(',').map((candidate) => {
      const trimmed = candidate.trim();
      const separator = trimmed.search(/\s/);
      const url = separator === -1 ? trimmed : trimmed.slice(0, separator);
      const descriptor = separator === -1 ? '' : trimmed.slice(separator);
      return `${normalizeInternalReference(url, language, fingerprintMap)}${descriptor}`;
    }).join(', ');
    $element.attr('srcset', rewritten);
  });
}

function translateDocument($, locale, sourceName) {
  $('[data-i18n]').each((_, element) => {
    const $element = $(element);
    const key = $element.attr('data-i18n');
    const translated = readLocaleValue(locale, key);
    if (translated === undefined) {
      fail(`${sourceName}: missing zh-Hant translation for ${key}`);
    }
    $element.html(validateTranslationMarkup(translated, key));
  });

  const translatedAttributes = [
    ['data-i18n-placeholder', 'placeholder'],
    ['data-i18n-title', 'title'],
    ['data-i18n-aria-label', 'aria-label'],
    ['data-i18n-alt', 'alt']
  ];
  for (const [dataAttribute, targetAttribute] of translatedAttributes) {
    $(`[${dataAttribute}]`).each((_, element) => {
      const $element = $(element);
      const key = $element.attr(dataAttribute);
      const translated = readLocaleValue(locale, key);
      if (translated === undefined) {
        fail(`${sourceName}: missing zh-Hant translation for ${key}`);
      }
      if (/<[^>]+>/.test(translated)) {
        fail(`${sourceName}: translation ${key} cannot contain markup in ${targetAttribute}`);
      }
      $element.attr(targetAttribute, translated);
    });
  }
}

function setIndexableMetadata($, route, language) {
  const key = language === 'zh' ? 'zh' : 'en';
  const pageTitle = language === 'zh' ? route.title[key] : $('title').text().trim();
  const pageDescription = language === 'zh'
    ? route.description[key]
    : ($('meta[name="description"]').attr('content') || '').trim();
  if (!pageTitle || !pageDescription) {
    fail(`${route.source}: English title and description are required`);
  }
  const selfUrl = canonical(route.route, language);
  const enUrl = canonical(route.route, 'en');
  const zhUrl = canonical(route.route, 'zh');

  $('html').attr('lang', language === 'zh' ? 'zh-Hant' : 'en');
  $('body').attr('data-lang', language === 'zh' ? 'zh-Hant' : 'en');
  $('title').text(pageTitle);
  upsertMeta($, 'meta[name="description"]', { name: 'description', content: pageDescription });
  upsertMeta($, 'meta[property="og:title"]', { property: 'og:title', content: pageTitle });
  upsertMeta($, 'meta[property="og:description"]', { property: 'og:description', content: pageDescription });
  upsertMeta($, 'meta[property="og:type"]', { property: 'og:type', content: 'website' });
  upsertMeta($, 'meta[property="og:url"]', { property: 'og:url', content: selfUrl });
  const imageAlt = SHARE_IMAGE_ALT[route.image]?.[key];
  if (!imageAlt) fail(`${route.source}: share image ${route.image} has no alt text`);
  upsertMeta($, 'meta[property="og:site_name"]', { property: 'og:site_name', content: 'TOPTEC Global' });
  upsertMeta($, 'meta[property="og:image"]', { property: 'og:image', content: `${SITE_ORIGIN}${route.image}` });
  upsertMeta($, 'meta[property="og:image:width"]', { property: 'og:image:width', content: SHARE_IMAGE_SIZE.width });
  upsertMeta($, 'meta[property="og:image:height"]', { property: 'og:image:height', content: SHARE_IMAGE_SIZE.height });
  upsertMeta($, 'meta[property="og:image:alt"]', { property: 'og:image:alt', content: imageAlt });
  // Open Graph expects language_TERRITORY locales; hreflang and JSON-LD keep BCP 47 tags.
  upsertMeta($, 'meta[property="og:locale"]', { property: 'og:locale', content: language === 'zh' ? 'zh_TW' : 'en_SG' });
  upsertMeta($, 'meta[property="og:locale:alternate"]', { property: 'og:locale:alternate', content: language === 'zh' ? 'en_SG' : 'zh_TW' });
  upsertMeta($, 'meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
  upsertMeta($, 'meta[name="twitter:title"]', { name: 'twitter:title', content: pageTitle });
  upsertMeta($, 'meta[name="twitter:description"]', { name: 'twitter:description', content: pageDescription });
  upsertMeta($, 'meta[name="twitter:image"]', { name: 'twitter:image', content: `${SITE_ORIGIN}${route.image}` });
  upsertMeta($, 'meta[name="twitter:image:alt"]', { name: 'twitter:image:alt', content: imageAlt });

  $('link[rel="canonical"], link[rel="alternate"][hreflang]').remove();
  $('head').append(`<link rel="canonical" href="${selfUrl}">`);
  $('head').append(`<link rel="alternate" hreflang="en" href="${enUrl}">`);
  $('head').append(`<link rel="alternate" hreflang="zh-Hant" href="${zhUrl}">`);
  $('head').append(`<link rel="alternate" hreflang="x-default" href="${enUrl}">`);
  setStructuredData($, route, language, pageTitle, pageDescription);
}

function pageName(title) {
  return title.split(/\s+\|\s+|｜/)[0].trim();
}

// Generates one JSON-LD graph per indexable page. Hand-written JSON-LD in the
// source is replaced so both languages carry localized, consistent data.
function setStructuredData($, route, language, pageTitle, pageDescription) {
  const inLanguage = language === 'zh' ? 'zh-Hant' : 'en';
  const selfUrl = canonical(route.route, language);
  const homeUrl = canonical('/', language);
  const pageTypes = { '/about': 'AboutPage', '/contact': 'ContactPage' };
  const webPage = {
    '@type': pageTypes[route.route] || 'WebPage',
    '@id': `${selfUrl}#webpage`,
    url: selfUrl,
    name: pageTitle,
    description: pageDescription,
    inLanguage,
    isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
    about: { '@id': ORGANIZATION['@id'] },
    primaryImageOfPage: { '@type': 'ImageObject', url: `${SITE_ORIGIN}${route.image}` }
  };
  const graph = [
    route.route === '/' ? { ...ORGANIZATION, description: pageDescription } : ORGANIZATION,
    {
      '@type': 'WebSite',
      '@id': `${SITE_ORIGIN}/#website`,
      url: `${SITE_ORIGIN}/`,
      name: 'TOPTEC Global',
      inLanguage: ['en', 'zh-Hant'],
      publisher: { '@id': ORGANIZATION['@id'] }
    },
    webPage
  ];
  if (route.route !== '/') {
    webPage.breadcrumb = { '@id': `${selfUrl}#breadcrumb` };
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${selfUrl}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: language === 'zh' ? '首頁' : 'Home', item: homeUrl },
        { '@type': 'ListItem', position: 2, name: pageName(pageTitle), item: selfUrl }
      ]
    });
  }
  $('script[type="application/ld+json"]').remove();
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  $('head').append(`<script type="application/ld+json">${json}</script>`);
}

function setLanguageSwitcher($, route, language) {
  const switcher = $('.language-switcher').first();
  if (!switcher.length) {
    return;
  }
  switcher.removeAttr('aria-label');
  switcher.attr('role', 'group');
  switcher.attr('aria-label', language === 'zh' ? '語言選擇' : 'Language selection');

  let link = switcher.find('a').first();
  if (!link.length) {
    link = $('<a>');
    switcher.empty().append(link);
  }
  if (language === 'zh') {
    link.attr({ href: route.route, hreflang: 'en', lang: 'en' }).removeAttr('aria-label').text('EN');
  } else {
    link.attr({ href: zhRoute(route.route), hreflang: 'zh-Hant', lang: 'zh-Hant' }).removeAttr('aria-label').text('繁中');
  }
}

function removeBuildOnlyI18nAttributes($) {
  $('[data-i18n], [data-i18n-placeholder], [data-i18n-title], [data-i18n-aria-label], [data-i18n-alt]').each((_, element) => {
    const $element = $(element);
    for (const attribute of ['data-i18n', 'data-i18n-placeholder', 'data-i18n-title', 'data-i18n-aria-label', 'data-i18n-alt']) {
      $element.removeAttr(attribute);
    }
  });
}

function removeHostedFonts($) {
  $('link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]').remove();
}

function serialize($) {
  return `${$.html().replace(/^<!DOCTYPE html>/i, '<!DOCTYPE html>\n')}\n`;
}

function renderIndexable(source, route, language, locale, fingerprintMap) {
  const $ = cheerio.load(source);
  removeHostedFonts($);
  upsertMeta($, 'meta[name="toptec-pwa-enabled"]', {
    name: 'toptec-pwa-enabled',
    content: String(PWA_ENABLED)
  });
  if (language === 'zh') {
    translateDocument($, locale, route.source);
  }
  rewriteDocumentReferences($, language, fingerprintMap);
  setIndexableMetadata($, route, language);
  setLanguageSwitcher($, route, language);

  if (route.route === '/contact') {
    $('#contact-form').attr('action', language === 'zh' ? '/zh-hant/success' : '/success');
  }
  removeBuildOnlyI18nAttributes($);
  return serialize($);
}

function renderSpecial(source, special, language, locale, fingerprintMap) {
  const $ = cheerio.load(source);
  const key = language === 'zh' ? 'zh' : 'en';
  removeHostedFonts($);
  upsertMeta($, 'meta[name="toptec-pwa-enabled"]', {
    name: 'toptec-pwa-enabled',
    content: String(PWA_ENABLED)
  });
  $('html').attr('lang', language === 'zh' ? 'zh-Hant' : 'en');
  $('body').attr('data-lang', language === 'zh' ? 'zh-Hant' : 'en');
  // Utility pages are never indexable: no canonical, hreflang or JSON-LD.
  $('link[rel="canonical"], link[rel="alternate"][hreflang], script[type="application/ld+json"]').remove();
  upsertMeta($, 'meta[name="robots"]', { name: 'robots', content: special.robots });
  $('title').text(special.title[key]);
  upsertMeta($, 'meta[name="description"]', { name: 'description', content: special.description[key] });

  if (language === 'zh') {
    translateDocument($, locale, special.source);
  }
  rewriteDocumentReferences($, language, fingerprintMap);
  removeBuildOnlyI18nAttributes($);
  return serialize($);
}

async function fingerprintReferencedCode(sourceDocuments) {
  const references = new Set();
  for (const source of sourceDocuments) {
    const $ = cheerio.load(source);
    $('link[rel~="stylesheet"][href], script[src]').each((_, element) => {
      const reference = $(element).attr('href') || $(element).attr('src');
      const sourcePath = sourcePathFromReference(reference);
      if (sourcePath?.startsWith('/assets/css/') || sourcePath?.startsWith('/assets/js/')) {
        references.add(sourcePath);
      }
    });
  }

  const fingerprintMap = new Map();
  for (const reference of [...references].sort()) {
    const absolute = path.join(ROOT, reference.slice(1));
    const parsed = path.posix.parse(reference);
    const source = await readFile(absolute, 'utf8');
    const transformed = await transform(source, {
      loader: parsed.ext === '.css' ? 'css' : 'js',
      minify: true,
      legalComments: 'none',
      target: parsed.ext === '.css'
        ? ['chrome100', 'firefox100', 'safari15']
        : ['es2020']
    });
    const content = transformed.code.trimEnd();
    const output = `${parsed.dir}/${parsed.name}.${sha256(content).slice(0, 12)}${parsed.ext}`;
    fingerprintMap.set(reference, output);
    const destination = path.join(DIST, output.slice(1));
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, `${content}\n`, 'utf8');
  }
  return fingerprintMap;
}

function collectAssetReferences(htmlDocuments, fingerprintMap, manifest) {
  const assets = new Set(ROOT_FILES.map((file) => `/${file}`));
  assets.add('/assets/img/toptec-logo.svg');

  for (const html of htmlDocuments) {
    const $ = cheerio.load(html);
    $('[href], [src], [poster]').each((_, element) => {
      for (const attribute of ['href', 'src', 'poster']) {
        const reference = $(element).attr(attribute);
        if (!reference) continue;
        let pathname;
        if (/^https?:\/\//i.test(reference)) {
          const absolute = new URL(reference);
          if (absolute.origin !== SITE_ORIGIN) continue;
          pathname = absolute.pathname;
        } else {
          pathname = splitReference(reference).pathname;
        }
        if (pathname.startsWith('/assets/img/') || ROOT_FILES.some((file) => pathname === `/${file}`)) {
          assets.add(pathname);
        }
      }
    });
    $('[srcset]').each((_, element) => {
      $(element).attr('srcset').split(',').forEach((candidate) => {
        const pathname = splitReference(candidate.trim().split(/\s+/, 1)[0]).pathname;
        if (pathname.startsWith('/assets/img/')) assets.add(pathname);
      });
    });
  }

  for (const icon of manifest.icons || []) {
    if (icon.src?.startsWith('/')) assets.add(icon.src);
  }

  return assets;
}

async function copyReferencedAssets(assetReferences, fingerprintMap) {
  for (const reference of [...assetReferences].sort()) {
    if (fingerprintMap.has(reference)) continue;
    if (reference.startsWith('/assets/css/') || reference.startsWith('/assets/js/')) continue;
    if (/\.(?:zip|md|py|map)$/i.test(reference)) {
      fail(`forbidden deployment asset was referenced: ${reference}`);
    }
    const source = path.join(ROOT, reference.slice(1));
    let sourceStat;
    try {
      sourceStat = await stat(source);
    } catch {
      fail(`referenced asset does not exist: ${reference}`);
    }
    if (!sourceStat.isFile()) fail(`referenced asset is not a file: ${reference}`);
    const destination = path.join(DIST, reference.slice(1));
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(source, destination);
  }
}

function collectCspHashes(htmlDocuments) {
  const hashes = new Set();
  for (const [name, html] of htmlDocuments.entries()) {
    const $ = cheerio.load(html);
    $('script:not([src])').each((_, element) => {
      const type = ($(element).attr('type') || '').toLowerCase();
      if (type !== 'application/ld+json') {
        fail(`${name}: executable inline scripts are forbidden`);
      }
      hashes.add(`'sha256-${sha256($(element).html() || '', 'base64')}'`);
    });
    if ($('style').length) fail(`${name}: inline <style> blocks are forbidden`);
    $('[onload], [onclick], [onchange], [onsubmit], [onerror]').each((_, element) => {
      fail(`${name}: inline event handlers are forbidden on <${element.tagName}>`);
    });
  }
  return [...hashes].sort();
}

function createHeaders(cspHashes) {
  const policy = [
    "default-src 'self'",
    "base-uri 'self'",
    "connect-src 'self'",
    "font-src 'self'",
    'form-action \'self\'',
    'frame-ancestors \'none\'',
    'frame-src https://www.google.com',
    "img-src 'self' data:",
    "manifest-src 'self'",
    "object-src 'none'",
    `script-src 'self'${cspHashes.length ? ` ${cspHashes.join(' ')}` : ''}`,
    "script-src-attr 'none'",
    "style-src 'self'",
    "style-src-attr 'none'",
    "worker-src 'self'",
    'upgrade-insecure-requests'
  ].join('; ');
  const cspHeader = process.env.CSP_REPORT_ONLY === 'true'
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy';

  return `/*
  ${cspHeader}: ${policy}
  Cache-Control: public, max-age=0, must-revalidate
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
  Permissions-Policy: camera=(), geolocation=(), microphone=(), payment=(), usb=()
  Referrer-Policy: strict-origin-when-cross-origin
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-Permitted-Cross-Domain-Policies: none

/assets/css/*
  Cache-Control: public, max-age=31536000, immutable

/assets/js/*
  Cache-Control: public, max-age=31536000, immutable

/assets/img/*
  Cache-Control: public, max-age=2592000, must-revalidate

/*.png
  Cache-Control: public, max-age=2592000, must-revalidate

/favicon.ico
  Cache-Control: public, max-age=2592000, must-revalidate

/site.webmanifest
  Cache-Control: public, max-age=0, must-revalidate

/sw.js
  Cache-Control: public, max-age=0, must-revalidate
  Service-Worker-Allowed: /
`;
}

function createRedirects() {
  const gone = [
    '/graphify-out/*',
    '/.codex-remote-attachments/*',
    '/README.md',
    '/OPERATIONS_RUNBOOK.md',
    '/scripts/*',
    '/optimize_images.py',
    '/assets/img/favicon_Toptec.zip',
    '/.claude/*',
    '/.github/*',
    '/.git/*',
    '/package.json',
    '/package-lock.json',
    '/netlify.toml'
  ].map((source) => `${source} /404.html 410!`);

  const canonicalRedirects = [
    // Netlify normalizes trailing slashes before matching. Slash-only redirects
    // therefore match their own destination and must never be generated.
    '/index.html / 301!',
    ...ROUTES.filter((item) => item.route !== '/').map((item) => `/${item.source} ${item.route} 301!`),
    '/success.html /success 301!',
    '/offline.html /offline 301!',
    '/zh-hant/index.html /zh-hant/ 301!',
    ...ROUTES.filter((item) => item.route !== '/').map((item) => `/zh-hant/${item.source} ${zhRoute(item.route)} 301!`),
    '/zh-hant/success.html /zh-hant/success 301!',
    '/zh-hant/offline.html /zh-hant/offline 301!'
  ];

  const legacyRedirects = Object.entries({ electronics: 'about', services: 'about', 'case-studies': 'trading', solutions: 'trading', trust: 'trading', compliance: 'trading' }).flatMap(([old, target]) => ['', '/zh-hant'].flatMap(prefix => ['', '.html', '/'].map(suffix => `${prefix}/${old}${suffix} ${prefix}/${target} 301!`)));
  // Language-specific 404 for unknown Chinese URLs. Netlify stops at the first
  // matching rule, so this must follow every specific /zh-hant/ redirect above
  // (those legacy paths have no file and would otherwise be caught here) and
  // precede any broader /* rule. It is not forced, so existing files still win.
  const localizedNotFound = ['/zh-hant/* /zh-hant/404.html 404'];
  return `${[...gone, ...legacyRedirects, ...canonicalRedirects, ...localizedNotFound].join('\n')}\n`;
}

function escapeXml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  })[character]);
}

function createSitemap() {
  const entries = ROUTES.flatMap((route) => ['en', 'zh'].map((language) => {
    const location = canonical(route.route, language);
    const enUrl = canonical(route.route, 'en');
    const zhUrl = canonical(route.route, 'zh');
    return `  <url>
    <loc>${escapeXml(location)}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(enUrl)}" />
    <xhtml:link rel="alternate" hreflang="zh-Hant" href="${escapeXml(zhUrl)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(enUrl)}" />
  </url>`;
  }));
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;
}

async function main() {
  if (Number(process.versions.node.split('.')[0]) !== 24) {
    fail(`Node.js 24 is required; received ${process.version}`);
  }

  const requiredSources = [...ROUTES.map((route) => route.source), ...SPECIAL_PAGES.map((page) => page.source)];
  const sources = new Map();
  for (const sourceName of requiredSources) {
    try {
      sources.set(sourceName, (await readFile(path.join(ROOT, sourceName), 'utf8')).replace(/^\uFEFF/, ''));
    } catch {
      fail(`required source file is missing: ${sourceName}`);
    }
  }

  const locale = JSON.parse(await readFile(path.join(ROOT, 'locales', 'zh-Hant.json'), 'utf8'));
  const manifest = JSON.parse(await readFile(path.join(ROOT, 'site.webmanifest'), 'utf8'));

  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });

  const fingerprintMap = await fingerprintReferencedCode(sources.values());
  const generated = new Map();

  for (const route of ROUTES) {
    const source = sources.get(route.source);
    generated.set(route.source, renderIndexable(source, route, 'en', locale, fingerprintMap));
    generated.set(`zh-hant/${route.source}`, renderIndexable(source, route, 'zh', locale, fingerprintMap));
  }
  for (const special of SPECIAL_PAGES) {
    const source = sources.get(special.source);
    generated.set(special.output, renderSpecial(source, special, 'en', locale, fingerprintMap));
    generated.set(`zh-hant/${special.output}`, renderSpecial(source, special, 'zh', locale, fingerprintMap));
  }

  for (const [relativePath, html] of generated) {
    const destination = path.join(DIST, relativePath);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, html, 'utf8');
  }

  const assetReferences = collectAssetReferences(generated.values(), fingerprintMap, manifest);
  await copyReferencedAssets(assetReferences, fingerprintMap);

  await writeFile(path.join(DIST, 'site.webmanifest'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  await writeFile(path.join(DIST, 'sitemap.xml'), createSitemap(), 'utf8');
  await writeFile(path.join(DIST, 'robots.txt'), 'User-agent: *\nAllow: /\n\nSitemap: https://toptec.com.sg/sitemap.xml\n', 'utf8');
  await writeFile(path.join(DIST, '_redirects'), createRedirects(), 'utf8');

  const cspHashes = collectCspHashes(generated);
  await writeFile(path.join(DIST, '_headers'), createHeaders(cspHashes), 'utf8');

  const buildSeed = [
    ...[...generated.entries()].flat(),
    ...[...fingerprintMap.entries()].flat(),
    JSON.stringify(manifest)
  ].join('\n');
  const buildId = sha256(buildSeed).slice(0, 12);
  const precache = [
    '/',
    '/offline',
    '/zh-hant/offline',
    '/site.webmanifest',
    '/assets/img/toptec-logo.svg',
    '/assets/img/toptec-logo-light.svg',
    ...ROOT_FILES.map((file) => `/${file}`),
    ...fingerprintMap.values()
  ];
  const swTemplate = await readFile(path.join(ROOT, 'sw.js'), 'utf8');
  if (
    !swTemplate.includes('__TOPTEC_BUILD_ID__')
    || !swTemplate.includes("'__TOPTEC_PRECACHE_ASSETS__'")
    || !swTemplate.includes("'__TOPTEC_PUBLIC_ROUTES__'")
  ) {
    fail('sw.js template placeholders are missing');
  }
  const publicRoutes = [
    ...ROUTES.flatMap((route) => [
      route.route,
      route.route === '/' ? '/index.html' : `/${route.source}`,
      zhRoute(route.route),
      route.route === '/' ? '/zh-hant/index.html' : `/zh-hant/${route.source}`
    ]),
    ...SPECIAL_PAGES.flatMap((page) => [
      page.route,
      `/${page.output}`,
      `${ZH_PREFIX}${page.route}`,
      `${ZH_PREFIX}/${page.output}`
    ])
  ];
  const builtServiceWorker = swTemplate
    .replaceAll('__TOPTEC_BUILD_ID__', buildId)
    .replace("'__TOPTEC_PRECACHE_ASSETS__'", precache.sort().map((entry) => JSON.stringify(entry)).join(',\n  '))
    .replace("'__TOPTEC_PUBLIC_ROUTES__'", [...new Set(publicRoutes)].sort().map((entry) => JSON.stringify(entry)).join(',\n  '));
  await writeFile(path.join(DIST, 'sw.js'), builtServiceWorker, 'utf8');

  console.log(`[build] ${generated.size} HTML documents, ${assetReferences.size} public assets, build ${buildId}`);
}

await main();
