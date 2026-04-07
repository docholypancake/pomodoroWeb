const { test, expect } = require("@playwright/test");

async function seedTimerStorage(page, settings, state) {
    await page.addInitScript(({ seededSettings, seededState }) => {
        localStorage.setItem("pomodoroSettings", JSON.stringify(seededSettings));
        localStorage.setItem("pomodoroTimerState", JSON.stringify(seededState));
    }, {
        seededSettings: settings,
        seededState: state
    });
}

test.describe("timer persistence", () => {
    test("keeps running across reloads", async ({ page }) => {
        await page.goto("/index.html");
        await page.click("#startBtn");
        await page.waitForTimeout(1500);
        const beforeReload = await page.locator("#timeDisplay").textContent();

        await page.reload();
        const afterReload = await page.locator("#timeDisplay").textContent();

        expect(beforeReload).not.toBe("25:00");
        expect(afterReload).not.toBe("25:00");
        await expect(page.locator("#startBtn .btn-text")).toHaveText("Pause");
    });

    test("hydrates into a short break when a pomodoro elapsed in the background", async ({ page }) => {
        const now = Date.now();
        await seedTimerStorage(page,
            { pomodoro: 1, shortBreak: 5, longBreak: 15, soundEnabled: false },
            {
                currentMode: "pomodoro",
                isRunning: true,
                endTime: now - 2_000,
                remainingSeconds: 60,
                completedPomodorosInCycle: 0
            }
        );

        await page.goto("/index.html");

        await expect(page.locator(".timer-label")).toHaveText("Short Break");
        await expect(page.locator("#sessionCount")).toHaveText("1");
    });

    test("preserves a paused timer across reloads", async ({ page }) => {
        await page.goto("/index.html");
        await page.click("#startBtn");
        await page.waitForTimeout(1200);
        await page.click("#startBtn");

        const pausedTime = await page.locator("#timeDisplay").textContent();
        await page.reload();

        await expect(page.locator("#timeDisplay")).toHaveText(pausedTime);
        await expect(page.locator("#startBtn .btn-text")).toHaveText("Start");
    });

    test("hydrates across multiple elapsed segments into the second pomodoro", async ({ page }) => {
        const start = Date.now() - (2 * 60 * 1000) - 30_000;
        await seedTimerStorage(page,
            { pomodoro: 1, shortBreak: 1, longBreak: 2, soundEnabled: false },
            {
                currentMode: "pomodoro",
                isRunning: true,
                endTime: start + (60 * 1000),
                remainingSeconds: 60,
                completedPomodorosInCycle: 0
            }
        );

        await page.goto("/index.html");

        await expect(page.locator(".timer-label")).toHaveText("Focus Time");
        await expect(page.locator("#sessionCount")).toHaveText("2");
        await expect(page.locator("#timeDisplay")).toHaveText("00:30");
    });

    test("resets after the fourth pomodoro long break completes", async ({ page }) => {
        const now = Date.now();
        await seedTimerStorage(page,
            { pomodoro: 25, shortBreak: 5, longBreak: 1, soundEnabled: false },
            {
                currentMode: "long-break",
                isRunning: true,
                endTime: now - 2_000,
                remainingSeconds: 60,
                completedPomodorosInCycle: 4
            }
        );

        await page.goto("/index.html");

        await expect(page.locator(".timer-label")).toHaveText("Focus Time");
        await expect(page.locator("#timeDisplay")).toHaveText("25:00");
        await expect(page.locator("#sessionCount")).toHaveText("1");
        await expect(page.locator("#startBtn .btn-text")).toHaveText("Start");
    });

    test("recovers safely from corrupted timer storage", async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem("pomodoroTimerState", "{bad-json");
            localStorage.setItem("pomodoroSettings", JSON.stringify({
                pomodoro: 25,
                shortBreak: 5,
                longBreak: 15,
                soundEnabled: false
            }));
        });

        await page.goto("/index.html");

        await expect(page.locator(".timer-label")).toHaveText("Focus Time");
        await expect(page.locator("#timeDisplay")).toHaveText("25:00");
        await expect(page.locator("#startBtn .btn-text")).toHaveText("Start");
    });

    test("validates and saves settings", async ({ page }) => {
        await page.goto("/index.html");
        await page.click("#settingsToggle");

        await page.fill("#pomodoroTime", "0");
        await page.click("#saveSettings");
        await expect(page.locator("#settingsError")).toContainText("Pomodoro must be between 1 and 120.");

        await page.fill("#pomodoroTime", "30");
        await page.fill("#shortBreakTime", "6");
        await page.fill("#longBreakTime", "20");
        await page.uncheck("#soundEnabled");
        await page.click("#saveSettings");

        await expect(page.locator("#settingsSection")).toHaveClass(/hidden/);
        await expect(page.locator("#timeDisplay")).toHaveText("30:00");

        await page.reload();
        await page.click("#settingsToggle");
        await expect(page.locator("#pomodoroTime")).toHaveValue("30");
        await expect(page.locator("#shortBreakTime")).toHaveValue("6");
        await expect(page.locator("#longBreakTime")).toHaveValue("20");
        await expect(page.locator("#soundEnabled")).not.toBeChecked();
    });

    test("disables settings while running", async ({ page }) => {
        await page.goto("/index.html");
        await page.click("#startBtn");
        await expect(page.locator("#settingsToggle")).toBeDisabled();
    });

    test("shows the mini timer state on non-home pages", async ({ page }) => {
        const now = Date.now();
        await seedTimerStorage(page,
            { pomodoro: 25, shortBreak: 5, longBreak: 15, soundEnabled: false },
            {
                currentMode: "pomodoro",
                isRunning: true,
                endTime: now + 20 * 60 * 1000,
                remainingSeconds: 20 * 60,
                completedPomodorosInCycle: 0
            }
        );

        await page.goto("/about.html");

        await expect(page.locator("#miniTimerMode")).toHaveText("Pomodoro");
        await expect(page.locator("#miniTimerStatus")).toHaveText("Running");
        await expect(page.locator("#miniTimerTime")).not.toHaveText("25:00");
    });

    test("syncs mini timer state across pages through storage events", async ({ browser }) => {
        const context = await browser.newContext();
        const timerPage = await context.newPage();
        const aboutPage = await context.newPage();

        await aboutPage.goto("/about.html");
        await timerPage.goto("/index.html");
        await timerPage.click("#startBtn");

        await expect(aboutPage.locator("#miniTimerStatus")).toHaveText("Running");
        await expect(aboutPage.locator("#miniTimerTime")).not.toHaveText("25:00");

        await timerPage.click("#startBtn");
        await expect(aboutPage.locator("#miniTimerStatus")).toHaveText("Paused");

        await context.close();
    });
});
