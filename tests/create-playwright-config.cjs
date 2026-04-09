const { defineConfig } = require("@playwright/test");

function buildReporter(showExplanations) {
    return showExplanations
        ? [
            ["list"],
            ["./tests/e2e/explanation-reporter.cjs"]
        ]
        : "list";
}

function createPlaywrightConfig(options = {}) {
    const {
        port = 4173,
        testMatch,
        grep
    } = options;
    const showExplanations = process.env.TEST_EXPLANATIONS !== "0";

    return defineConfig({
        testDir: "./tests/e2e",
        timeout: 30_000,
        fullyParallel: true,
        reporter: buildReporter(showExplanations),
        testMatch,
        grep,
        use: {
            baseURL: `http://127.0.0.1:${port}`,
            trace: "on-first-retry"
        },
        webServer: {
            command: "node tests/server.js",
            env: {
                PORT: String(port)
            },
            port,
            reuseExistingServer: true,
            timeout: 30_000
        }
    });
}

module.exports = {
    createPlaywrightConfig
};
