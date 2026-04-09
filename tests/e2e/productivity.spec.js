const { test, expect } = require("@playwright/test");

function buildText(length, char = "x") {
    return char.repeat(length);
}

async function addTodo(page, value) {
    await page.fill("#todoInput", value);
    await page.click('button:has-text("Add task")');
}

async function openNotes(page) {
    await page.click('[data-tab-trigger="notes"]');
    await expect(page.locator("#noteInput")).toBeVisible();
}

async function addNote(page, value) {
    await openNotes(page);
    await page.fill("#noteInput", value);
    await page.click('button:has-text("Add note")');
}

test.describe("productivity page", () => {
    test("persists tasks and notes across reloads", async ({ page }) => {
        await page.goto("/productivity.html");

        await addTodo(page, "Write integration notes");
        await expect(page.locator('[data-item-list="todo"]')).toContainText("Write integration notes");

        await addNote(page, "Remember to validate localStorage recovery.");
        await expect(page.locator('[data-item-list="notes"]')).toContainText("Remember to validate localStorage recovery.");

        await page.reload();

        await expect(page.locator('[data-item-list="todo"]')).toContainText("Write integration notes");
        await openNotes(page);
        await expect(page.locator('[data-item-list="notes"]')).toContainText("Remember to validate localStorage recovery.");
    });

    test("trims surrounding whitespace from new tasks and notes", async ({ page }) => {
        await page.goto("/productivity.html");

        await addTodo(page, "   Trimmed task   ");
        await expect(page.locator('[data-item-list="todo"]')).toContainText("Trimmed task");

        await addNote(page, "   Trimmed note   ");
        await expect(page.locator('[data-item-list="notes"]')).toContainText("Trimmed note");
    });

    test("recovers from malformed productivity storage", async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem("pomodoroProductivity.v1", "{not-valid-json");
        });

        await page.goto("/productivity.html");

        await expect(page.locator('[data-empty-state="todo"]')).toBeVisible();
        await expect(page.locator('[data-empty-state="notes"]')).toBeHidden();
        await openNotes(page);
        await expect(page.locator('[data-empty-state="notes"]')).toBeVisible();
    });

    test("supports edit, complete, uncomplete, and delete flows for todos", async ({ page }) => {
        await page.goto("/productivity.html");

        await addTodo(page, "Original task");
        await page.check('[data-action="toggle-complete"]');
        await expect(page.locator(".productivity-item__content")).toHaveClass(/completed/);

        await page.uncheck('[data-action="toggle-complete"]');
        await expect(page.locator(".productivity-item__content")).not.toHaveClass(/completed/);

        await page.click('[data-action="edit"]');
        await page.fill('[data-edit-field="todo"]', "Updated task");
        await page.press('[data-edit-field="todo"]', "Enter");
        await expect(page.locator('[data-item-list="todo"]')).toContainText("Updated task");

        await page.click('[data-action="delete"]');
        await expect(page.locator('[data-empty-state="todo"]')).toBeVisible();
    });

    test("supports note editing, keyboard save, and delete flows", async ({ page }) => {
        await page.goto("/productivity.html");
        await addNote(page, "First note");

        await page.click('[data-action="edit"]');
        await page.fill('[data-edit-field="notes"]', "Updated note");
        await page.press('[data-edit-field="notes"]', "Meta+Enter");
        await expect(page.locator('[data-item-list="notes"]')).toContainText("Updated note");

        await page.click('[data-action="edit"]');
        await page.fill('[data-edit-field="notes"]', "Updated again");
        await page.press('[data-edit-field="notes"]', "Control+Enter");
        await expect(page.locator('[data-item-list="notes"]')).toContainText("Updated again");

        await page.click('[data-action="delete"]');
        await expect(page.locator('[data-empty-state="notes"]')).toBeVisible();
    });

    test("shows validation for blank and whitespace-only submissions", async ({ page }) => {
        await page.goto("/productivity.html");
        await page.click('button:has-text("Add task")');
        await expect(page.locator('[data-form-message="todo"]')).toContainText("Please enter a task before adding it.");
        await expect(page.locator("#todoInput")).toHaveAttribute("aria-invalid", "true");

        await page.fill("#todoInput", "    ");
        await page.click('button:has-text("Add task")');
        await expect(page.locator('[data-form-message="todo"]')).toContainText("Please enter a task before adding it.");

        await openNotes(page);
        await page.click('button:has-text("Add note")');
        await expect(page.locator('[data-form-message="notes"]')).toContainText("Please enter a note before adding it.");
        await expect(page.locator("#noteInput")).toHaveAttribute("aria-invalid", "true");

        await page.fill("#noteInput", "   ");
        await page.click('button:has-text("Add note")');
        await expect(page.locator('[data-form-message="notes"]')).toContainText("Please enter a note before adding it.");
    });

    test("clears form validation after the user starts typing again", async ({ page }) => {
        await page.goto("/productivity.html");
        await page.click('button:has-text("Add task")');
        await expect(page.locator("#todoInput")).toHaveAttribute("aria-invalid", "true");

        await page.fill("#todoInput", "Recovered task");
        await expect(page.locator('[data-form-message="todo"]')).toBeHidden();
        await expect(page.locator("#todoInput")).not.toHaveAttribute("aria-invalid", "true");
    });

    test("keeps the original item when todo edit is cancelled", async ({ page }) => {
        await page.goto("/productivity.html");
        await addTodo(page, "Keep me");

        await page.click('[data-action="edit"]');
        await page.fill('[data-edit-field="todo"]', "Discarded change");
        await page.click('button:has-text("Cancel")');

        await expect(page.locator('[data-item-list="todo"]')).toContainText("Keep me");
        await expect(page.locator('[data-item-list="todo"]')).not.toContainText("Discarded change");
    });

    test("keeps the original item when note edit is cancelled", async ({ page }) => {
        await page.goto("/productivity.html");
        await addNote(page, "Keep this note");

        await page.click('[data-action="edit"]');
        await page.fill('[data-edit-field="notes"]', "Discarded note");
        await page.click('button:has-text("Cancel")');

        await expect(page.locator('[data-item-list="notes"]')).toContainText("Keep this note");
        await expect(page.locator('[data-item-list="notes"]')).not.toContainText("Discarded note");
    });

    test("rejects blank todo edits and keeps the editor open", async ({ page }) => {
        await page.goto("/productivity.html");
        await addTodo(page, "Editable task");

        await page.click('[data-action="edit"]');
        await page.fill('[data-edit-field="todo"]', "   ");
        await page.press('[data-edit-field="todo"]', "Enter");

        await expect(page.locator('[data-edit-field="todo"]')).toBeVisible();
        await expect(page.locator('[data-edit-field="todo"]')).toHaveAttribute("aria-invalid", "true");
        await expect(page.locator('[data-edit-message="todo"]')).toContainText("Please enter a task before saving it.");
    });

    test("rejects blank note edits and keeps the editor open", async ({ page }) => {
        await page.goto("/productivity.html");
        await addNote(page, "Editable note");

        await page.click('[data-action="edit"]');
        await page.fill('[data-edit-field="notes"]', "   ");
        await page.press('[data-edit-field="notes"]', "Control+Enter");

        await expect(page.locator('[data-edit-field="notes"]')).toBeVisible();
        await expect(page.locator('[data-edit-field="notes"]')).toHaveAttribute("aria-invalid", "true");
        await expect(page.locator('[data-edit-message="notes"]')).toContainText("Please enter a note before saving it.");
    });

    test("drops invalid productivity entries seeded directly in localStorage", async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem("pomodoroProductivity.v1", JSON.stringify({
                todo: [
                    { id: "t1", text: "   ", completed: false, createdAt: "bad", updatedAt: "bad" },
                    { id: "t2", text: "A".repeat(200), completed: false, createdAt: "2026-04-01T10:00:00.000Z", updatedAt: "2026-04-01T10:00:00.000Z" }
                ],
                notes: [
                    { id: "n1", content: "   ", createdAt: "bad", updatedAt: "bad" },
                    { id: "n2", content: "B".repeat(1400), createdAt: "2026-04-01T10:00:00.000Z", updatedAt: "2026-04-01T10:00:00.000Z" }
                ]
            }));
        });

        await page.goto("/productivity.html");
        await expect(page.locator(".productivity-item__content")).toHaveText("A".repeat(160));

        await openNotes(page);
        await expect(page.locator(".productivity-note__content")).toHaveText("B".repeat(1200));
    });

    test("enforces the task maxlength during real typing", async ({ page }) => {
        const taskValue = buildText(160, "t");
        const overflow = buildText(10, "z");

        await page.goto("/productivity.html");
        await page.locator("#todoInput").focus();
        await page.keyboard.type(taskValue + overflow);

        await expect(page.locator("#todoInput")).toHaveValue(taskValue);
        await page.click('button:has-text("Add task")');
        await expect(page.locator(".productivity-item__content")).toHaveText(taskValue);
    });

    test("enforces the note maxlength during real typing", async ({ page }) => {
        const noteValue = buildText(1200, "n");
        const overflow = buildText(20, "z");

        await page.goto("/productivity.html");
        await openNotes(page);
        await page.locator("#noteInput").focus();
        await page.keyboard.type(noteValue + overflow);

        await expect(page.locator("#noteInput")).toHaveValue(noteValue);
        await page.click('button:has-text("Add note")');
        await expect(page.locator(".productivity-note__content")).toHaveText(noteValue);
    });

    test("syncs storage changes across two productivity pages", async ({ browser }) => {
        const context = await browser.newContext();
        const firstPage = await context.newPage();
        const secondPage = await context.newPage();

        await firstPage.goto("/productivity.html");
        await secondPage.goto("/productivity.html");

        await addTodo(firstPage, "Shared task");
        await expect(secondPage.locator('[data-item-list="todo"]')).toContainText("Shared task");

        await addNote(firstPage, "Shared note");
        await openNotes(secondPage);
        await expect(secondPage.locator('[data-item-list="notes"]')).toContainText("Shared note");

        await context.close();
    });

    test("keeps tabs and aria state in sync when switching between todo and notes", async ({ page }) => {
        await page.goto("/productivity.html");

        await expect(page.locator('#productivity-tab-todo')).toHaveAttribute("aria-selected", "true");
        await expect(page.locator('#productivity-panel-todo')).toHaveAttribute("aria-hidden", "false");
        await expect(page.locator('#productivity-panel-notes')).toHaveAttribute("aria-hidden", "true");

        await openNotes(page);

        await expect(page.locator('#productivity-tab-notes')).toHaveAttribute("aria-selected", "true");
        await expect(page.locator('#productivity-panel-notes')).toHaveAttribute("aria-hidden", "false");
        await expect(page.locator('#productivity-panel-todo')).toHaveAttribute("aria-hidden", "true");
    });
});
