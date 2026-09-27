import { test, expect } from '@playwright/test';

function desktopOnly(testInfo) {
  test.skip(testInfo.project.name !== 'desktop-1440');
}

async function createControlledPwa(browser, { seedCaches = false } = {}) {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:4173',
    serviceWorkers: 'allow'
  });
  const page = await context.newPage();

  await page.goto('/');
  if (seedCaches) {
    await page.evaluate(async () => {
      const obsolete = await caches.open('toptec-obsolete-test');
      await obsolete.put('/electronics', new Response('Retired electronics content'));
      await caches.open('unrelated-application-cache');
    });
  }

  await page.goto('/app');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  return { context, page };
}

test('PWA first registration, update, and scoped cache cleanup work', async ({ browser }, testInfo) => {
  desktopOnly(testInfo);
  const { context, page } = await createControlledPwa(browser, { seedCaches: true });
  try {
    const state = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      const names = await caches.keys();
      return {
        scope: registration.scope,
        updateViaCache: registration.updateViaCache,
        names,
        retiredPageCached: Boolean(await caches.match('/electronics'))
      };
    });
    expect(state.scope).toBe('http://127.0.0.1:4173/');
    expect(state.updateViaCache).toBe('none');
    expect(state.names.some((name) => name.startsWith('toptec-precache-'))).toBe(true);
    expect(state.names).not.toContain('toptec-obsolete-test');
    expect(state.retiredPageCached).toBe(false);
    expect(state.names).toContain('unrelated-application-cache');
  } finally {
    await context.close();
  }
});

test('previously viewed pages work offline and unknown paths use bilingual fallbacks', async ({ browser }, testInfo) => {
  desktopOnly(testInfo);
  const { context, page } = await createControlledPwa(browser);
  try {
    await page.goto('/about', { waitUntil: 'networkidle' });
    await page.goto('/zh-hant/about', { waitUntil: 'networkidle' });
    await page.waitForTimeout(150);
    await context.setOffline(true);

    await page.goto('/about?offline-check=1');
    await expect(page.locator('body')).toHaveAttribute('data-page', 'about');

    await page.goto('/never-visited-before');
    await expect(page.locator('body')).toHaveAttribute('data-page', 'offline');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await page.goto('/zh-hant/never-visited-before');
    await expect(page.locator('body')).toHaveAttribute('data-page', 'offline');
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hant');
  } finally {
    await context.setOffline(false);
    await context.close();
  }
});

test('runtime cache is capped and excludes POST, API, and Authorization requests', async ({ browser }, testInfo) => {
  desktopOnly(testInfo);
  const { context, page } = await createControlledPwa(browser);
  try {
    await page.evaluate(async () => {
      const requests = Array.from({ length: 55 }, (_, index) => new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = resolve;
        image.onerror = reject;
        image.src = `/assets/img/toptec-logo.svg?runtime-entry=${index}`;
      }));
      await Promise.all(requests);
    });
    await page.waitForTimeout(250);

    await page.evaluate(async () => {
      await fetch('/assets/img/toptec-logo.svg?authorization-test=1', {
        headers: { Authorization: 'Bearer non-secret-test-value' }
      });
      await fetch('/api/private-test');
      await fetch('/contact', { method: 'POST', body: 'test=not-sensitive' });
    });

    const cacheState = await page.evaluate(async () => {
      const runtimeName = (await caches.keys()).find((name) => name.startsWith('toptec-runtime-'));
      const requests = runtimeName ? await (await caches.open(runtimeName)).keys() : [];
      return requests.map((request) => request.url);
    });
    expect(cacheState.length).toBeGreaterThan(0);
    expect(cacheState.length).toBeLessThanOrEqual(50);
    expect(cacheState.some((url) => url.includes('authorization-test'))).toBe(false);
    expect(cacheState.some((url) => url.includes('/api/'))).toBe(false);
    expect(cacheState.some((url) => url.endsWith('/contact'))).toBe(false);
  } finally {
    await context.close();
  }
});

test('PWA emergency kill message unregisters only Toptec state', async ({ browser }, testInfo) => {
  desktopOnly(testInfo);
  const { context, page } = await createControlledPwa(browser);
  try {
    await page.evaluate(() => caches.open('unrelated-application-cache'));
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      registration.active.postMessage({ type: 'TOPTEC_PWA_KILL_SWITCH' });
    });
    await page.waitForFunction(async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const names = await caches.keys();
      return registrations.length === 0 && !names.some((name) => name.startsWith('toptec-'));
    });
    const remaining = await page.evaluate(() => caches.keys());
    expect(remaining).toContain('unrelated-application-cache');
  } finally {
    await context.close();
  }
});
