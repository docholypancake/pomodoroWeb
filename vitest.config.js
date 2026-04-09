const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
    test: {
        environment: "jsdom",
        include: ["tests/unit/**/*.spec.js"],
        reporters: [
            "default",
            new (require("./tests/unit/explanation-reporter.cjs"))()
        ]
    }
});
