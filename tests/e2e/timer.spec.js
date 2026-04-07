const { test, expect } = require("@playwright/test");

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
        await page.addInitScript(({ settings, state }) => {
            localStorage.setItem("pomodoroSettings", JSON.stringify(settings));
            localStorage.setItem("pomodoroTimerState", JSON.stringify(state));
        }, {
            settings: { pomodoro: 1, shortBreak: 5, longBreak: 15, soundEnabled: false },
            state: {
                currentMode: "pomodoro",
                isRunning: true,
                endTime: now - 2_000,
                remainingSeconds: 60,
                completedPomodorosInCycle: 0
            }
        });

        await page.goto("/index.html");

        await expect(page.locator(".timer-label")).toHaveText("Short Break");
        await expect(page.locator("#sessionCount")).toHaveText("1");
    });

    test("resets after the fourth pomodoro long break completes", async ({ page }) => {
        const now = Date.now();
        await page.addInitScript(({ settings, state }) => {
            localStorage.setItem("pomodoroSettings", JSON.stringify(settings));
            localStorage.setItem("pomodoroTimerState", JSON.stringify(state));
        }, {
            settings: { pomodoro: 25, shortBreak: 5, longBreak: 1, soundEnabled: false },
            state: {
                currentMode: "long-break",
                isRunning: true,
                endTime: now - 2_000,
                remainingSeconds: 60,
                completedPomodorosInCycle: 4
            }
        });

        await page.goto("/index.html");

        await expect(page.locator(".timer-label")).toHaveText("Focus Time");
        await expect(page.locator("#timeDisplay")).toHaveText("25:00");
        await expect(page.locator("#sessionCount")).toHaveText("1");
        await expect(page.locator("#startBtn .btn-text")).toHaveText("Start");
    });

    test("shows the mini timer state on non-home pages", async ({ page }) => {
        const now = Date.now();
        await page.addInitScript(({ settings, state }) => {
            localStorage.setItem("pomodoroSettings", JSON.stringify(settings));
            localStorage.setItem("pomodoroTimerState", JSON.stringify(state));
        }, {
            settings: { pomodoro: 25, shortBreak: 5, longBreak: 15, soundEnabled: false },
            state: {
                currentMode: "pomodoro",
                isRunning: true,
                endTime: now + 20 * 60 * 1000,
                remainingSeconds: 20 * 60,
                completedPomodorosInCycle: 0
            }
        });

        await page.goto("/about.html");

        await expect(page.locator("#miniTimerMode")).toHaveText("Pomodoro");
        await expect(page.locator("#miniTimerStatus")).toHaveText("Running");
        await expect(page.locator("#miniTimerTime")).not.toHaveText("25:00");
    });
});
