const { createPlaywrightConfig } = require("./tests/create-playwright-config.cjs");

module.exports = createPlaywrightConfig({
    port: 4175,
    testMatch: /(timer|settings|productivity)\.spec\.js$/
});
