const { createPlaywrightConfig } = require("./tests/create-playwright-config.cjs");

module.exports = createPlaywrightConfig({
    port: 4174,
    testMatch: /smoke\.spec\.js$/
});
