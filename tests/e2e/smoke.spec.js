const { test, expect } = require("@playwright/test");

const pageCases = [
    {
        path: "/index.html",
        title: "Pomodoro Web",
        heading: "Deep work with a visible finish line.",
        activeNav: "Timer",
        hasMiniTimer: false
    },
    {
        path: "/productivity.html",
        title: "Productivity - Pomodoro Web",
        heading: "Productivity",
        activeNav: "Productivity",
        hasMiniTimer: true
    },
    {
        path: "/about.html",
        title: "About - Pomodoro Web",
        heading: "About This App",
        activeNav: "About",
        hasMiniTimer: true
    },
    {
        path: "/helpus.html",
        title: "Help Us - Pomodoro Web",
        heading: "Help Us",
        activeNav: "Help Us",
        hasMiniTimer: true
    }
];

test.describe("smoke coverage", () => {
    for (const pageCase of pageCases) {
        test(`renders ${pageCase.path} with the main shell`, async ({ page }) => {
            await page.goto(pageCase.path);

            await expect(page).toHaveTitle(pageCase.title);
            await expect(page.locator(".header")).toBeVisible();
            await expect(page.getByRole("heading", { name: pageCase.heading })).toBeVisible();
            await expect(page.locator(".footer")).toBeVisible();
            await expect(page.locator(`.nav-btn--active:has-text("${pageCase.activeNav}")`)).toBeVisible();

            if (pageCase.hasMiniTimer) {
                await expect(page.locator("#miniTimer")).toBeVisible();
                await expect(page.locator("#miniTimerTime")).toHaveText(/\d{2}:\d{2}|\d{3}:\d{2}/);
            } else {
                await expect(page.locator("#miniTimer")).toHaveCount(0);
            }
        });
    }

    test("navigates through all main pages from the header", async ({ page }) => {
        await page.goto("/index.html");
        await page.click('a[href="productivity.html"]');
        await expect(page).toHaveURL(/productivity\.html$/);
        await page.click('a[href="about.html"]');
        await expect(page).toHaveURL(/about\.html$/);
        await page.click('a[href="helpus.html"]');
        await expect(page).toHaveURL(/helpus\.html$/);
        await page.click('a[href="index.html"]');
        await expect(page).toHaveURL(/index\.html$/);
    });

    test("shows the main interactive controls on timer and productivity pages", async ({ page }) => {
        await page.goto("/index.html");
        await expect(page.locator("#timeDisplay")).toHaveText("25:00");
        await expect(page.locator("#startBtn")).toBeVisible();
        await expect(page.locator("#resetBtn")).toBeVisible();
        await expect(page.locator("#settingsToggle")).toBeVisible();

        await page.goto("/productivity.html");
        await expect(page.locator("#todoInput")).toBeVisible();
        await expect(page.locator("#noteInput")).toBeHidden();
        await page.click('[data-tab-trigger="notes"]');
        await expect(page.locator("#noteInput")).toBeVisible();
    });
});
