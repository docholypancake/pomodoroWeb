const { test, expect } = require("@playwright/test");

test.describe("productivity page", () => {
    test("persists tasks and notes across reloads", async ({ page }) => {
        await page.goto("/productivity.html");

        await page.fill("#todoInput", "Write integration notes");
        await page.click('button:has-text("Add task")');
        await expect(page.locator('[data-item-list="todo"]')).toContainText("Write integration notes");

        await page.click('[data-tab-trigger="notes"]');
        await page.fill("#noteInput", "Remember to validate localStorage recovery.");
        await page.click('button:has-text("Add note")');
        await expect(page.locator('[data-item-list="notes"]')).toContainText("Remember to validate localStorage recovery.");

        await page.reload();

        await expect(page.locator('[data-item-list="todo"]')).toContainText("Write integration notes");
        await page.click('[data-tab-trigger="notes"]');
        await expect(page.locator('[data-item-list="notes"]')).toContainText("Remember to validate localStorage recovery.");
    });

    test("recovers from malformed productivity storage", async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem("pomodoroProductivity.v1", "{not-valid-json");
        });

        await page.goto("/productivity.html");

        await expect(page.locator('[data-empty-state="todo"]')).toBeVisible();
        await expect(page.locator('[data-empty-state="notes"]')).toBeHidden();
        await page.click('[data-tab-trigger="notes"]');
        await expect(page.locator('[data-empty-state="notes"]')).toBeVisible();
    });
});
