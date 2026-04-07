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

    test("supports edit, complete, and delete flows for todos", async ({ page }) => {
        await page.goto("/productivity.html");

        await page.fill("#todoInput", "Original task");
        await page.click('button:has-text("Add task")');
        await page.check('[data-action="toggle-complete"]');
        await expect(page.locator(".productivity-item__content")).toHaveClass(/completed/);

        await page.click('[data-action="edit"]');
        await page.fill('[data-edit-field="todo"]', "Updated task");
        await page.press('[data-edit-field="todo"]', "Enter");
        await expect(page.locator('[data-item-list="todo"]')).toContainText("Updated task");

        await page.click('[data-action="delete"]');
        await expect(page.locator('[data-empty-state="todo"]')).toBeVisible();
    });

    test("supports edit and keyboard save for notes", async ({ page }) => {
        await page.goto("/productivity.html");
        await page.click('[data-tab-trigger="notes"]');

        await page.fill("#noteInput", "First note");
        await page.click('button:has-text("Add note")');
        await page.click('[data-action="edit"]');
        await page.fill('[data-edit-field="notes"]', "Updated note");
        await page.press('[data-edit-field="notes"]', "Meta+Enter");
        await expect(page.locator('[data-item-list="notes"]')).toContainText("Updated note");
    });

    test("shows validation for blank submissions", async ({ page }) => {
        await page.goto("/productivity.html");
        await page.click('button:has-text("Add task")');
        await expect(page.locator('[data-form-message="todo"]')).toContainText("Please enter a task before adding it.");

        await page.click('[data-tab-trigger="notes"]');
        await page.click('button:has-text("Add note")');
        await expect(page.locator('[data-form-message="notes"]')).toContainText("Please enter a note before adding it.");
    });

    test("syncs storage changes across two productivity pages", async ({ browser }) => {
        const context = await browser.newContext();
        const firstPage = await context.newPage();
        const secondPage = await context.newPage();

        await firstPage.goto("/productivity.html");
        await secondPage.goto("/productivity.html");

        await firstPage.fill("#todoInput", "Shared task");
        await firstPage.click('button:has-text("Add task")');

        await expect(secondPage.locator('[data-item-list="todo"]')).toContainText("Shared task");

        await context.close();
    });
});
