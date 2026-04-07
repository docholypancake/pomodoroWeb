const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
    testDir: "./tests/e2e",
    timeout: 30_000,
    fullyParallel: true,
    reporter: "list",
    use: {
        baseURL: "http://127.0.0.1:4173",
        trace: "on-first-retry"
    },
    webServer: {
        command: "node tests/server.js",
        port: 4173,
        reuseExistingServer: true,
        timeout: 30_000
    }
});
