import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const englishRoutes = [
  '/',
  '/about',
  '/products',
  '/logistics',
  '/trading',
  '/contact',
  '/app',
  '/privacy',
  '/terms'
];

const contentRoutes = [
  ...englishRoutes,
  ...englishRoutes.map((route) => route === '/' ? '/zh-hant/' : `/zh-hant${route}`)
];

for (const route of contentRoutes) {
  test(`${route} renders without serious accessibility or layout failures`, async ({ page }) => {
    const consoleErrors = [];
    const blockedFontRequests = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('request', (request) => {
      if (/fonts\.(?:googleapis|gstatic)\.com/i.test(request.url())) {
        blockedFontRequests.push(request.url());
      }
    });

    const response = await page.goto(route, { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);
    const responseHeaders = response?.headers() || {};
    const csp = responseHeaders['content-security-policy'] || responseHeaders['content-security-policy-report-only'];
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    await expect(page.locator('main')).toHaveCount(1);

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      brokenImages: [...document.images]
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src)
    }));
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
    expect(layout.brokenImages).toEqual([]);
    expect(blockedFontRequests).toEqual([]);
    expect(consoleErrors).toEqual([]);

    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const serious = accessibility.violations.filter((violation) =>
      violation.impact === 'critical' || violation.impact === 'serious'
    );
    expect(serious).toEqual([]);
  });
}

test('mobile navigation traps and restores focus', async ({ page }, testInfo) => {
  test.skip(!['mobile-320', 'mobile-375', 'tablet-768'].includes(testInfo.project.name));
  await page.goto('/');

  const toggle = page.locator('.mobile-toggle');
  await toggle.focus();
  await toggle.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#primary-navigation')).toHaveClass(/open/);
  await expect(page.locator('#primary-navigation a').first()).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
});

test('contact form handles HTTP failures, accepts Gmail, and clears only after 2xx', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440');
  await page.goto('/contact');
  await page.locator('#name').fill('Test Buyer');
  await page.locator('#company').fill('Example Procurement');
  await page.locator('#inquiry-type').selectOption('product_purchase');
  await page.locator('#email').fill('test@gmail.com');
  await page.locator('#message').fill('Non-confidential test enquiry.');
  await page.locator('#agree-privacy').check();

  const statuses = [400, 429, 500, 204];
  await page.route('**/success', (route) => {
    const status = statuses.shift();
    return route.fulfill({ status, body: status === 204 ? '' : 'failure' });
  });

  for (const status of [400, 429, 500]) {
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[data-form-status="error"]'), `HTTP ${status}`).toBeVisible();
    await expect(page.locator('#message')).toHaveValue('Non-confidential test enquiry.');
    await expect(page.locator('#email')).toHaveValue('test@gmail.com');
  }

  await page.locator('button[type="submit"]').click();
  await expect(page.locator('[data-form-status="success"]')).toBeVisible();
  await expect(page.locator('#message')).toHaveValue('');
});

test('Google map is not requested until consent', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440');
  let mapRequests = 0;
  await page.route('https://www.google.com/maps**', (route) => {
    mapRequests += 1;
    return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Map</title>' });
  });

  await page.goto('/contact');
  expect(mapRequests).toBe(0);
  await expect(page.locator('.map-consent iframe')).toHaveCount(0);
  await page.locator('[data-map-load]').click();
  const iframe = page.locator('.map-embed iframe');
  await expect(iframe).toHaveAttribute('referrerpolicy', 'no-referrer');
  await expect(iframe).toHaveAttribute('src', /google\.com\/maps/);
});

test('language routes are static and reciprocal', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440');
  await page.goto('/about');
  await expect(page.locator('.language-switcher a')).toHaveAttribute('href', '/zh-hant/about');

  await page.goto('/zh-hant/about');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hant');
  await expect(page.locator('.language-switcher a')).toHaveAttribute('href', '/about');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://toptec.com.sg/zh-hant/about');
  expect(await page.title()).toMatch(/[\u3400-\u9fff]/u);
});

test('400% browser zoom reflow equivalent has no horizontal content loss', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440');
  test.setTimeout(60000);

  // At 400% browser zoom, a 1280 CSS-pixel desktop viewport exposes a
  // 320 CSS-pixel layout viewport. Testing every route at that width is the
  // deterministic cross-browser equivalent used by WCAG reflow checks.
  await page.setViewportSize({ width: 320, height: 720 });
  for (const route of contentRoutes) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    const widths = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth
    }));
    expect(widths.scroll, `${route} overflows at 400% zoom equivalent`).toBeLessThanOrEqual(widths.client + 1);
  }
});
