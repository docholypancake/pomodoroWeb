const { test, expect } = require("@playwright/test");

const fieldCases = [
    {
        key: "pomodoro",
        selector: "#pomodoroTime",
        min: 1,
        max: 120,
        defaultValue: 25,
        validValue: 30,
        decimalValue: "5.9",
        flooredValue: "5",
        aboveMax: "121",
        error: "Pomodoro must be between 1 and 120."
    },
    {
        key: "shortBreak",
        selector: "#shortBreakTime",
        min: 1,
        max: 30,
        defaultValue: 5,
        validValue: 6,
        decimalValue: "7.9",
        flooredValue: "7",
        aboveMax: "31",
        error: "Short break must be between 1 and 30."
    },
    {
        key: "longBreak",
        selector: "#longBreakTime",
        min: 1,
        max: 80,
        defaultValue: 15,
        validValue: 20,
        decimalValue: "9.9",
        flooredValue: "9",
        aboveMax: "81",
        error: "Long break must be between 1 and 80."
    }
];

async function openSettings(page) {
    await page.goto("/index.html");
    await page.click("#settingsToggle");
    await expect(page.locator("#settingsSection")).not.toHaveClass(/hidden/);
}

async function expectSettingsValues(page, { pomodoro, shortBreak, longBreak, soundEnabled }) {
    await expect(page.locator("#pomodoroTime")).toHaveValue(String(pomodoro));
    await expect(page.locator("#shortBreakTime")).toHaveValue(String(shortBreak));
    await expect(page.locator("#longBreakTime")).toHaveValue(String(longBreak));

    if (soundEnabled) {
        await expect(page.locator("#soundEnabled")).toBeChecked();
    } else {
        await expect(page.locator("#soundEnabled")).not.toBeChecked();
    }
}

async function saveSettings(page, { pomodoro, shortBreak, longBreak, soundEnabled }) {
    await page.fill("#pomodoroTime", String(pomodoro));
    await page.fill("#shortBreakTime", String(shortBreak));
    await page.fill("#longBreakTime", String(longBreak));

    const soundToggle = page.locator("#soundEnabled");
    if (soundEnabled) {
        await soundToggle.check();
    } else {
        await soundToggle.uncheck();
    }

    await page.click("#saveSettings");
}

async function changeAndBlur(page, selector, rawValue) {
    await page.fill(selector, rawValue);
    await page.locator(selector).dispatchEvent("change");
}

test.describe("timer settings automation", () => {
    test("saves valid settings and persists them after reload", async ({ page }) => {
        await openSettings(page);
        await saveSettings(page, {
            pomodoro: 30,
            shortBreak: 6,
            longBreak: 20,
            soundEnabled: false
        });

        await expect(page.locator("#settingsSection")).toHaveClass(/hidden/);
        await expect(page.locator("#timeDisplay")).toHaveText("30:00");

        await page.reload();
        await page.click("#settingsToggle");
        await expectSettingsValues(page, {
            pomodoro: 30,
            shortBreak: 6,
            longBreak: 20,
            soundEnabled: false
        });
    });

    test("accepts minimum boundary values", async ({ page }) => {
        await openSettings(page);
        await saveSettings(page, {
            pomodoro: 1,
            shortBreak: 1,
            longBreak: 1,
            soundEnabled: true
        });

        await expect(page.locator("#timeDisplay")).toHaveText("01:00");
        await page.reload();
        await page.click("#settingsToggle");
        await expectSettingsValues(page, {
            pomodoro: 1,
            shortBreak: 1,
            longBreak: 1,
            soundEnabled: true
        });
    });

    test("accepts maximum boundary values", async ({ page }) => {
        await openSettings(page);
        await saveSettings(page, {
            pomodoro: 120,
            shortBreak: 30,
            longBreak: 80,
            soundEnabled: true
        });

        await expect(page.locator("#timeDisplay")).toHaveText("120:00");
        await page.reload();
        await page.click("#settingsToggle");
        await expectSettingsValues(page, {
            pomodoro: 120,
            shortBreak: 30,
            longBreak: 80,
            soundEnabled: true
        });
    });

    test("persists sound toggle changes off and back on", async ({ page }) => {
        await openSettings(page);
        await saveSettings(page, {
            pomodoro: 25,
            shortBreak: 5,
            longBreak: 15,
            soundEnabled: false
        });

        await page.reload();
        await page.click("#settingsToggle");
        await expect(page.locator("#soundEnabled")).not.toBeChecked();

        await page.check("#soundEnabled");
        await page.click("#saveSettings");
        await page.reload();
        await page.click("#settingsToggle");
        await expect(page.locator("#soundEnabled")).toBeChecked();
    });

    test("cancel discards unsaved changes", async ({ page }) => {
        await openSettings(page);
        await saveSettings(page, {
            pomodoro: 35,
            shortBreak: 7,
            longBreak: 22,
            soundEnabled: true
        });

        await page.click("#settingsToggle");
        await page.fill("#pomodoroTime", "99");
        await page.fill("#shortBreakTime", "29");
        await page.fill("#longBreakTime", "79");
        await page.uncheck("#soundEnabled");
        await page.click("#cancelSettings");

        await page.click("#settingsToggle");
        await expectSettingsValues(page, {
            pomodoro: 35,
            shortBreak: 7,
            longBreak: 22,
            soundEnabled: true
        });
    });

    for (const fieldCase of fieldCases) {
        test(`floors decimal ${fieldCase.key} values on change and save`, async ({ page }) => {
            await openSettings(page);
            await changeAndBlur(page, fieldCase.selector, fieldCase.decimalValue);
            await expect(page.locator(fieldCase.selector)).toHaveValue(fieldCase.flooredValue);

            await page.click("#saveSettings");
            await expect(page.locator("#settingsError")).toBeHidden();
            await expect(page.locator("#settingsSection")).toHaveClass(/hidden/);

            await page.click("#settingsToggle");
            await expect(page.locator(fieldCase.selector)).toHaveValue(fieldCase.flooredValue);
        });

        test(`defaults ${fieldCase.key} to its configured default when zero is entered`, async ({ page }) => {
            await openSettings(page);
            await changeAndBlur(page, fieldCase.selector, "0");
            await expect(page.locator(fieldCase.selector)).toHaveValue(String(fieldCase.defaultValue));

            await page.click("#saveSettings");
            await expect(page.locator("#settingsSection")).toHaveClass(/hidden/);
            await page.click("#settingsToggle");
            await expect(page.locator(fieldCase.selector)).toHaveValue(String(fieldCase.defaultValue));
        });

        test(`rejects negative ${fieldCase.key} values`, async ({ page }) => {
            await openSettings(page);
            await changeAndBlur(page, fieldCase.selector, "-4");
            await expect(page.locator(fieldCase.selector)).toHaveValue("-4");
            await page.click("#saveSettings");
            await expect(page.locator("#settingsError")).toContainText(fieldCase.error);
            await expect(page.locator(fieldCase.selector)).toHaveAttribute("aria-invalid", "true");
        });

        test(`rejects blank ${fieldCase.key} values`, async ({ page }) => {
            await openSettings(page);
            await page.locator(fieldCase.selector).clear();
            await page.click("#saveSettings");

            await expect(page.locator("#settingsError")).toContainText(fieldCase.error);
            await expect(page.locator(fieldCase.selector)).toHaveAttribute("aria-invalid", "true");
        });

        test(`rejects ${fieldCase.key} values above the allowed range`, async ({ page }) => {
            await openSettings(page);
            await page.fill(fieldCase.selector, fieldCase.aboveMax);
            await page.click("#saveSettings");

            await expect(page.locator("#settingsError")).toContainText(fieldCase.error);
            await expect(page.locator(fieldCase.selector)).toHaveAttribute("aria-invalid", "true");
        });
    }

    test("rejects scientific notation in settings fields", async ({ page }) => {
        await openSettings(page);
        await page.fill("#pomodoroTime", "1e2");
        await page.click("#saveSettings");

        await expect(page.locator("#settingsError")).toContainText("Pomodoro must be between 1 and 120.");
        await expect(page.locator("#pomodoroTime")).toHaveAttribute("aria-invalid", "true");
    });

    test("rejects hexadecimal-like values in settings fields", async ({ page }) => {
        await openSettings(page);
        await page.evaluate(() => {
            const input = document.querySelector("#pomodoroTime");
            input.value = "0x10";
            input.dispatchEvent(new Event("input", { bubbles: true }));
        });
        await page.click("#saveSettings");

        await expect(page.locator("#settingsError")).toContainText("Pomodoro must be between 1 and 120.");
        await expect(page.locator("#pomodoroTime")).toHaveAttribute("aria-invalid", "true");
    });

    test("clears validation state after the user edits an invalid field", async ({ page }) => {
        await openSettings(page);
        await page.fill("#pomodoroTime", "121");
        await page.click("#saveSettings");

        await expect(page.locator("#settingsError")).toContainText("Pomodoro must be between 1 and 120.");
        await expect(page.locator("#pomodoroTime")).toHaveAttribute("aria-invalid", "true");

        await page.fill("#pomodoroTime", "60");
        await expect(page.locator("#settingsError")).toBeHidden();
        await expect(page.locator("#pomodoroTime")).not.toHaveAttribute("aria-invalid", "true");
    });

    test("syncs visible settings inputs when storage changes in another page", async ({ browser }) => {
        const context = await browser.newContext();
        const firstPage = await context.newPage();
        const secondPage = await context.newPage();

        await firstPage.goto("/index.html");
        await firstPage.click("#settingsToggle");
        await secondPage.goto("/index.html");
        await secondPage.click("#settingsToggle");

        await saveSettings(secondPage, {
            pomodoro: 44,
            shortBreak: 9,
            longBreak: 24,
            soundEnabled: false
        });

        await expect(firstPage.locator("#pomodoroTime")).toHaveValue("44");
        await expect(firstPage.locator("#shortBreakTime")).toHaveValue("9");
        await expect(firstPage.locator("#longBreakTime")).toHaveValue("24");
        await expect(firstPage.locator("#soundEnabled")).not.toBeChecked();

        await context.close();
    });

    test("prevents opening settings while the timer is running", async ({ page }) => {
        await page.goto("/index.html");
        await page.click("#startBtn");

        await expect(page.locator("#settingsToggle")).toBeDisabled();
        await expect(page.locator("#settingsSection")).toHaveClass(/hidden/);
    });

    test("falls back to defaults when saved settings storage is corrupted", async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem("pomodoroSettings", "{bad-json");
        });

        await page.goto("/index.html");
        await expect(page.locator("#timeDisplay")).toHaveText("25:00");

        await page.click("#settingsToggle");
        await expectSettingsValues(page, {
            pomodoro: 25,
            shortBreak: 5,
            longBreak: 15,
            soundEnabled: true
        });
    });
});
