const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    timeout: 60000,
    retries: 0,
    use: {
        baseURL: 'http://localhost:44436',
        headless: false,
        viewport: { width: 1920, height: 1080 },
        screenshot: 'only-on-failure',
    },
    projects: [
        { name: 'chromium', use: { browserName: 'chromium' } },
    ],
});
