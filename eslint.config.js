const js = require("@eslint/js");
const globals = require("globals");

const testGlobals = {
    describe: "readonly",
    it: "readonly",
    test: "readonly",
    expect: "readonly",
    beforeAll: "readonly",
    beforeEach: "readonly",
    afterAll: "readonly",
    afterEach: "readonly",
    vi: "readonly"
};

module.exports = [
    {
        ignores: [
            "dist/**",
            "node_modules/**",
            "playwright-report/**",
            "test-results/**",
            "coverage/**"
        ]
    },
    js.configs.recommended,
    {
        files: ["js/**/*.js"],
        languageOptions: {
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.worker
            }
        },
        rules: {
            "no-unused-vars": "error"
        }
    },
    {
        files: ["tests/unit/**/*.js"],
        languageOptions: {
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.node,
                ...testGlobals
            }
        }
    },
    {
        files: [
            "tests/e2e/**/*.js",
            "tests/**/*.cjs",
            "tests/server.js",
            "*.config.js",
            "*.config.cjs"
        ],
        languageOptions: {
            sourceType: "commonjs",
            globals: {
                ...globals.node,
                ...globals.browser,
                ...testGlobals
            }
        }
    }
];
