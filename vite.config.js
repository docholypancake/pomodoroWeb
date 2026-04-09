const { resolve } = require("path");
const { defineConfig } = require("vite");

module.exports = defineConfig({
    build: {
        sourcemap: true,
        outDir: "dist",
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
                productivity: resolve(__dirname, "productivity.html"),
                about: resolve(__dirname, "about.html"),
                helpus: resolve(__dirname, "helpus.html")
            }
        }
    }
});
