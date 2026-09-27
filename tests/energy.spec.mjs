import { test, expect } from '@playwright/test';

test('legacy English and Chinese URLs redirect directly to replacement pages', async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440');
  for (const [old, target] of Object.entries({ electronics: 'about', services: 'about', 'case-studies': 'trading', solutions: 'trading', trust: 'compliance' })) {
    for (const prefix of ['', '/zh-hant']) {
      for (const suffix of ['', '.html', '/']) {
        const response = await request.get(`${prefix}/${old}${suffix}?source=legacy`, { maxRedirects: 0 });
        expect(response.status()).toBe(301);
        expect(response.headers().location).toBe(`${prefix}/${target}?source=legacy`);
        expect((await request.get(response.headers().location)).status()).toBe(200);
      }
    }
  }
});

for (const prefix of ['', '/zh-hant']) {
  test(`${prefix || 'English'} enquiry types validate and retain stable submitted values`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440');
    await page.goto(`${prefix}/contact`);
    const select = page.locator('#inquiry-type');
    await expect(select).toHaveValue('');
    await expect(select).toHaveAttribute('required', '');
    await expect(page.locator('#company')).toHaveAttribute('required', '');
    await expect(page.locator('input[type="file"]')).toHaveCount(0);
    await expect(page.locator('[name="bot-field"]')).toBeHidden();
    await expect(page.locator('#sensitive-document-warning')).toContainText('KYC');
    await page.locator('#name').fill('Test Counterparty');
    await page.locator('#company').fill('Example Energy');
    await page.locator('#email').fill('buyer@example.com');
    await page.locator('#message').fill('Please provide public corporate information.');
    await page.locator('#agree-privacy').check();
    let submitted;
    let responseStatus = 500;
    await page.route(`**${prefix}/success`, route => {
      submitted = new URLSearchParams(route.request().postData());
      return route.fulfill({ status: responseStatus, body: responseStatus === 204 ? '' : 'unavailable' });
    });
    await page.locator('button[type="submit"]').click();
    expect(submitted).toBeUndefined();
    await expect(select).toBeFocused();
    await select.selectOption('corporate_kyc_request');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[data-form-status="error"]')).toBeVisible();
    expect(submitted.get('inquiry_type')).toBe('corporate_kyc_request');
    expect(submitted.get('company')).toBe('Example Energy');
    expect(submitted.get('form-name')).toBe('contact');
    expect(submitted.get('bot-field')).toBe('');
    await expect(select).toHaveValue('corporate_kyc_request');
    responseStatus = 204;
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[data-form-status="success"]')).toBeVisible();
    await expect(select).toHaveValue('');
    await expect(page.locator('#company')).toHaveValue('');
  });
}

test('every enquiry category submits in both languages without JavaScript', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440');
  test.setTimeout(60000);
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:4173', javaScriptEnabled: false, reducedMotion: 'reduce' });
  const page = await context.newPage();
  let submitted;
  await page.route('**/success', route => {
    submitted = new URLSearchParams(route.request().postData());
    return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Received</title><p>Received</p>' });
  });
  try {
    for (const prefix of ['', '/zh-hant']) {
      for (const value of ['product_purchase', 'supplier_cooperation', 'logistics_cooperation', 'corporate_kyc_request', 'other']) {
        await page.goto(`${prefix}/contact`);
        await page.locator('#name').fill('Test Counterparty');
        await page.locator('#company').fill('Example Energy');
        await page.locator('#email').fill('buyer@example.com');
        await page.locator('#message').fill('Non-confidential test enquiry.');
        await page.locator('#inquiry-type').selectOption(value);
        await page.locator('#agree-privacy').check();
        await page.locator('button[type="submit"]').click();
        await expect(page.locator('body')).toContainText('Received');
        expect(submitted.get('inquiry_type')).toBe(value);
        expect(submitted.get('company')).toBe('Example Energy');
      }
    }
  } finally {
    await context.close();
  }
});
