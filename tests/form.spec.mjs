import { test, expect } from '@playwright/test';

async function fillValidEnquiry(page, suffix = '', { forceCheckbox = false } = {}) {
  await page.locator('#name').fill(`Test Buyer${suffix}`);
  await page.locator('#company').fill('Example Procurement');
  await page.locator('#inquiry-type').selectOption('product_purchase');
  await page.locator('#email').fill('buyer@gmail.com');
  await page.locator('#phone').fill('+65 6000 0000');
  await page.locator('#message').fill(`Non-confidential test enquiry${suffix}.`);
  await page.locator('#agree-privacy').check({ force: forceCheckbox });
}

function desktopOnly(testInfo) {
  test.skip(testInfo.project.name !== 'desktop-1440');
}

test('offline form submission is not queued and preserves every entry', async ({ page, context }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto('/contact');
  await fillValidEnquiry(page, ' offline');

  await context.setOffline(true);
  try {
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[data-form-status="error"]')).toContainText(/offline/i);
    await expect(page.locator('#name')).toHaveValue('Test Buyer offline');
    await expect(page.locator('#company')).toHaveValue('Example Procurement');
    await expect(page.locator('#email')).toHaveValue('buyer@gmail.com');
    await expect(page.locator('#phone')).toHaveValue('+65 6000 0000');
    await expect(page.locator('#message')).toHaveValue('Non-confidential test enquiry offline.');
  } finally {
    await context.setOffline(false);
  }
});

test('the 12 second AbortController path reports timeout and preserves data', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.addInitScript(() => {
    const nativeSetTimeout = window.setTimeout.bind(window);
    window.setTimeout = (callback, delay, ...args) => nativeSetTimeout(
      callback,
      delay === 12000 ? 40 : delay,
      ...args
    );
  });
  await page.route('**/success', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    try {
      await route.fulfill({ status: 200, body: 'late response' });
    } catch {
      // The browser correctly aborted the pending request before this response.
    }
  });

  await page.goto('/contact');
  await fillValidEnquiry(page, ' timeout');
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('[data-form-status="error"]')).toContainText(/timed out/i);
  await expect(page.locator('#message')).toHaveValue('Non-confidential test enquiry timeout.');
});

test('duplicate submit events produce only one network request', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  let requests = 0;
  await page.route('**/success', async (route) => {
    requests += 1;
    await new Promise((resolve) => setTimeout(resolve, 150));
    await route.fulfill({ status: 200, body: 'ok' });
  });

  await page.goto('/contact');
  await fillValidEnquiry(page, ' duplicate');
  await page.evaluate(() => {
    const form = document.querySelector('#contact-form');
    form.requestSubmit();
    form.requestSubmit();
  });
  await expect(page.locator('[data-form-status="success"]')).toBeVisible();
  expect(requests).toBe(1);
});

test('no-JavaScript mode retains a native Netlify POST fallback', async ({ browser }, testInfo) => {
  desktopOnly(testInfo);
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:4173',
    javaScriptEnabled: false
  });
  const page = await context.newPage();
  let submittedRequest = null;
  await page.route('**/success', async (route) => {
    submittedRequest = {
      method: route.request().method(),
      body: route.request().postData() || '',
      contentType: route.request().headers()['content-type'] || ''
    };
    await route.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      body: '<!doctype html><html lang="en"><title>Fallback received</title><body>Fallback received</body></html>'
    });
  });

  try {
    await page.goto('/contact');
    const form = page.locator('#contact-form');
    await expect(form).toHaveAttribute('method', /post/i);
    await expect(form).toHaveAttribute('action', '/success');
    await expect(form).toHaveAttribute('data-netlify', 'true');
    await expect(form).toHaveAttribute('data-netlify-honeypot', 'bot-field');
    await expect(page.locator('#title')).not.toHaveAttribute('required', '');

    await fillValidEnquiry(page, ' fallback', { forceCheckbox: true });
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('body')).toContainText('Fallback received');
    expect(submittedRequest?.method).toBe('POST');
    expect(submittedRequest?.contentType).toContain('application/x-www-form-urlencoded');
    expect(submittedRequest?.body).toContain('form-name=contact');
    expect(submittedRequest?.body).toContain('email=buyer%40gmail.com');
  } finally {
    await context.close();
  }
});
