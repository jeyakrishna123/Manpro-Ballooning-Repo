const { test, expect } = require('@playwright/test');

const APP_URL = 'http://localhost:44436';
const USERNAME = 'manpro';
const PASSWORD = 'Manpro@2001';
const DRAWING_NO = '123';
const REV_NO = '1';

async function login(page) {
    await page.goto(APP_URL, { waitUntil: 'networkidle', timeout: 30000 });
    const isLogin = await page.locator('#Email').isVisible().catch(() => false);
    if (isLogin) {
        await page.fill('#Email', USERNAME);
        await page.fill('#Password', PASSWORD);
        await page.locator('.btn-login').click();
        await page.waitForSelector('input[name="drawingNo"]', { timeout: 30000 });
    }
}

async function loginAndLoadDrawing(page) {
    await login(page);
    await page.fill('input[name="drawingNo"]', DRAWING_NO);
    await page.fill('input[name="revNo"]', REV_NO);
    await page.locator('button.btn-primary svg, .searchBox button').first().click();
    await page.waitForSelector('.tools-buttons', { timeout: 60000 });
    await page.waitForTimeout(3000);
}

test.describe('Balloon OCR E2E Tests', () => {

    test('1. Login works', async ({ page }) => {
        await login(page);
        await expect(page.locator('input[name="drawingNo"]')).toBeVisible();
    });

    test('2. Drawing loads with balloons', async ({ page }) => {
        await loginAndLoadDrawing(page);
        await expect(page.locator('.tools-buttons')).toBeVisible();
        await expect(page.locator('#fontScale')).toBeVisible();
        await expect(page.locator('#ccFontScale')).toBeVisible();
        await expect(page.locator('#konvaMain')).toBeVisible();
    });

    test('3. Balloon Size + increments', async ({ page }) => {
        await loginAndLoadDrawing(page);
        const input = page.locator('#fontScale');
        const before = parseInt(await input.inputValue());
        await page.locator('#fontScale_wrapper button.qty-btn:last-child').click();
        await page.waitForTimeout(300);
        expect(parseInt(await input.inputValue())).toBe(before + 1);
    });

    test('4. Balloon Size - decrements', async ({ page }) => {
        await loginAndLoadDrawing(page);
        const input = page.locator('#fontScale');
        await page.locator('#fontScale_wrapper button.qty-btn:last-child').click();
        await page.waitForTimeout(200);
        const before = parseInt(await input.inputValue());
        await page.locator('#fontScale_wrapper button.qty-btn:first-child').click();
        await page.waitForTimeout(300);
        expect(parseInt(await input.inputValue())).toBe(before - 1);
    });

    test('5. CC Size + increments', async ({ page }) => {
        await loginAndLoadDrawing(page);
        const input = page.locator('#ccFontScale');
        const before = parseInt(await input.inputValue());
        await page.locator('#ccFontScale_wrapper button.qty-btn:last-child').click();
        await page.waitForTimeout(300);
        expect(parseInt(await input.inputValue())).toBe(before + 1);
    });

    test('6. CC Size - decrements', async ({ page }) => {
        await loginAndLoadDrawing(page);
        const input = page.locator('#ccFontScale');
        await page.locator('#ccFontScale_wrapper button.qty-btn:last-child').click();
        await page.waitForTimeout(200);
        const before = parseInt(await input.inputValue());
        await page.locator('#ccFontScale_wrapper button.qty-btn:first-child').click();
        await page.waitForTimeout(300);
        expect(parseInt(await input.inputValue())).toBe(before - 1);
    });

    test('7. No toolbar jump on rapid clicks', async ({ page }) => {
        await loginAndLoadDrawing(page);
        const box1 = await page.locator('.tools-buttons').boundingBox();
        for (let i = 0; i < 10; i++) {
            await page.locator('#fontScale_wrapper button.qty-btn:last-child').click();
        }
        await page.waitForTimeout(500);
        const box2 = await page.locator('.tools-buttons').boundingBox();
        expect(Math.abs(box2.height - box1.height)).toBeLessThan(2);
        expect(Math.abs(box2.y - box1.y)).toBeLessThan(2);
    });

    test('8. Toolbar height locked', async ({ page }) => {
        await loginAndLoadDrawing(page);
        const box = await page.locator('.tools-buttons').boundingBox();
        expect(box.height).toBeGreaterThanOrEqual(48);
        expect(box.height).toBeLessThanOrEqual(56);
    });

    test('9. Watermark 90° option exists', async ({ page }) => {
        await loginAndLoadDrawing(page);
        await page.locator('text=Watermark').click();
        await page.waitForTimeout(500);
        await expect(page.getByText('90°', { exact: true })).toBeVisible();
        await expect(page.getByText('-90°', { exact: true })).toBeVisible();
    });

    test('10. Save keeps balloons visible', async ({ page }) => {
        await loginAndLoadDrawing(page);
        await expect(page.locator('#konvaMain')).toBeVisible();
        await page.locator('button:has-text("Save")').click();
        await page.waitForTimeout(5000);
        await expect(page.locator('#konvaMain')).toBeVisible();
        await expect(page.locator('.tools-buttons')).toBeVisible();
    });
});
