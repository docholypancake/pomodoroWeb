const { defineConfig } = require("vitest/config");
const showExplanations = process.env.TEST_EXPLANATIONS !== "0";

module.exports = defineConfig({
    test: {
        environment: "jsdom",
        include: ["tests/unit/**/*.spec.js"],
        setupFiles: ["./tests/unit/setup.js"],
        reporters: showExplanations
            ? [
                "default",
                new (require("./tests/unit/explanation-reporter.cjs"))()
            ]
            : ["default"],
        coverage: {
            provider: "v8",
            all: true,
            include: ["src/js/**/*.js"],
            exclude: [
                "src/js/entries/*.js"
            ],
            reporter: ["text", "html", "json-summary"],
            reportsDirectory: "./coverage/unit"
        }
    }
});
