const { test, expect } = require("@playwright/test");

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

    test("rejects blank pomodoro values", async ({ page }) => {
        await openSettings(page);
        await page.locator("#pomodoroTime").clear();
        await page.click("#saveSettings");

        await expect(page.locator("#settingsError")).toContainText("Pomodoro must be between 1 and 120.");
        await expect(page.locator("#pomodoroTime")).toHaveAttribute("aria-invalid", "true");
    });

    test("rejects pomodoro values below and above range", async ({ page }) => {
        await openSettings(page);

        await page.fill("#pomodoroTime", "0");
        await page.click("#saveSettings");
        await expect(page.locator("#settingsError")).toContainText("Pomodoro must be between 1 and 120.");

        await page.fill("#pomodoroTime", "121");
        await page.click("#saveSettings");
        await expect(page.locator("#settingsError")).toContainText("Pomodoro must be between 1 and 120.");
    });

    test("rejects short break values below and above range", async ({ page }) => {
        await openSettings(page);

        await page.fill("#shortBreakTime", "0");
        await page.click("#saveSettings");
        await expect(page.locator("#settingsError")).toContainText("Short break must be between 1 and 30.");

        await page.fill("#shortBreakTime", "31");
        await page.click("#saveSettings");
        await expect(page.locator("#settingsError")).toContainText("Short break must be between 1 and 30.");
    });

    test("rejects long break values below and above range", async ({ page }) => {
        await openSettings(page);

        await page.fill("#longBreakTime", "0");
        await page.click("#saveSettings");
        await expect(page.locator("#settingsError")).toContainText("Long break must be between 1 and 80.");

        await page.fill("#longBreakTime", "81");
        await page.click("#saveSettings");
        await expect(page.locator("#settingsError")).toContainText("Long break must be between 1 and 80.");
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
