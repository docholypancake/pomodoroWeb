// @ts-check
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:5500'; // url

test.describe('Pomodoro Timer - Initialization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // Clear localStorage before each test
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('must have the correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Pomodoro Web/);
  });

  test('must show 25:00 on start', async ({ page }) => {
    const timeDisplay = page.locator('#timeDisplay');
    await expect(timeDisplay).toHaveText('25:00');
  });

  test('must show "Focus Time" label', async ({ page }) => {
    const timerLabel = page.locator('.timer-label');
    await expect(timerLabel).toHaveText('Focus Time');
  });

  test('session counter must start at 1', async ({ page }) => {
    const sessionCount = page.locator('#sessionCount');
    await expect(sessionCount).toHaveText('1');
  });

  test('must show "Start" button text', async ({ page }) => {
    const startBtn = page.locator('#startBtn .btn-text');
    await expect(startBtn).toHaveText('Start');
  });
});

test.describe('Pomodoro Timer - Start/Pause/Reset', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('must show "Pause" button text after clicking Start', async ({ page }) => {
    const startBtn = page.locator('#startBtn');
    const btnText = startBtn.locator('.btn-text');
    
    await expect(btnText).toHaveText('Start');
    await startBtn.click();
    await expect(btnText).toHaveText('Pause');
  });

  test('must pause the timer', async ({ page }) => {
    const startBtn = page.locator('#startBtn');
    const timeDisplay = page.locator('#timeDisplay');
    
    // Start the timer
    await startBtn.click();
    const startTime = await timeDisplay.textContent();
    
    // Wait 2 seconds
    await page.waitForTimeout(2000);
    const afterWait = await timeDisplay.textContent();
    
    // Timer should change
    expect(startTime).not.toEqual(afterWait);
    
    // Pause
    await startBtn.click();
    const pausedTime = await timeDisplay.textContent();
    
    // Wait more
    await page.waitForTimeout(2000);
    const stillPaused = await timeDisplay.textContent();
    
    // Time should not change
    expect(pausedTime).toEqual(stillPaused);
  });

  test('must reset the timer to 25:00', async ({ page }) => {
    const startBtn = page.locator('#startBtn');
    const resetBtn = page.locator('#resetBtn');
    const timeDisplay = page.locator('#timeDisplay');
    
    // Start the timer
    await startBtn.click();
    await page.waitForTimeout(1500);
    
    // Reset
    await resetBtn.click();
    await expect(timeDisplay).toHaveText('25:00');
  });

  test('must reset the session counter', async ({ page }) => {
    const resetBtn = page.locator('#resetBtn');
    const sessionCount = page.locator('#sessionCount');
    
    // Change counter (manually in console for test)
    await page.evaluate(() => {
      sessionStorage.setItem('sessionNumber', '5');
    });
    
    await resetBtn.click();
    await expect(sessionCount).toHaveText('1');
  });
});

test.describe('Pomodoro Timer - Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('must open settings panel', async ({ page }) => {
    const settingsToggle = page.locator('#settingsToggle');
    const settingsSection = page.locator('#settingsSection');
    
    // Settings panel is initially hidden
    await expect(settingsSection).toHaveClass(/hidden/);
    
    // Open
    await settingsToggle.click();
    await expect(settingsSection).not.toHaveClass(/hidden/);
  });

  test('must close settings panel when Cancel is clicked', async ({ page }) => {
    const settingsToggle = page.locator('#settingsToggle');
    const cancelBtn = page.locator('#cancelSettings');
    const settingsSection = page.locator('#settingsSection');
    
    // Open
    await settingsToggle.click();
    await expect(settingsSection).not.toHaveClass(/hidden/);
    
    // Close
    await cancelBtn.click();
    await expect(settingsSection).toHaveClass(/hidden/);
  });

  test('must change Pomodoro duration', async ({ page }) => {
    const settingsToggle = page.locator('#settingsToggle');
    const pomodoroInput = page.locator('#pomodoroTime');
    const saveBtn = page.locator('#saveSettings');
    const timeDisplay = page.locator('#timeDisplay');
    
    // Open settings
    await settingsToggle.click();
    
    // Change value
    await pomodoroInput.clear();
    await pomodoroInput.fill('10');
    
    // Save
    await saveBtn.click();
    
    // Check that timer is updated
    await expect(timeDisplay).toHaveText('10:00');
  });

  test('must change Short Break duration', async ({ page }) => {
    const settingsToggle = page.locator('#settingsToggle');
    const shortBreakInput = page.locator('#shortBreakTime');
    const saveBtn = page.locator('#saveSettings');
    
    // Open settings
    await settingsToggle.click();
    
    // Change value
    await shortBreakInput.clear();
    await shortBreakInput.fill('3');
    
    // Save
    await saveBtn.click();
    
    // Check that value is saved in localStorage
    const savedSettings = await page.evaluate(() => 
      JSON.parse(localStorage.getItem('pomodoroSettings'))
    );
    expect(savedSettings.shortBreak).toBe(3);
  });

  test('settings must be saved in localStorage', async ({ page }) => {
    const settingsToggle = page.locator('#settingsToggle');
    const pomodoroInput = page.locator('#pomodoroTime');
    const saveBtn = page.locator('#saveSettings');
    
    // Change
    await settingsToggle.click();
    await pomodoroInput.clear();
    await pomodoroInput.fill('20');
    await saveBtn.click();
    
    // Reload page
    await page.reload();
    
    // Check that value persisted
    await expect(pomodoroInput).toHaveValue('20');
  });

  test('Settings button must be disabled during timer', async ({ page }) => {
    const startBtn = page.locator('#startBtn');
    const settingsToggle = page.locator('#settingsToggle');
    
    // Initially enabled
    await expect(settingsToggle).not.toBeDisabled();
    
    // Start timer
    await startBtn.click();
    
    // Now disabled
    await expect(settingsToggle).toBeDisabled();
    
    // Pause
    await startBtn.click();
    
    // Active again
    await expect(settingsToggle).not.toBeDisabled();
  });
});

test.describe('Pomodoro Timer - Mode Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('must change label when mode is clicked', async ({ page }) => {
    const shortBreakMode = page.locator('.mode-label[data-mode="short-break"]');
    const timerLabel = page.locator('.timer-label');
    
    // Click on Short Break
    await shortBreakMode.click();
    
    // Check label
    await expect(timerLabel).toHaveText('Short Break');
  });

  test('Pomodoro mode must show 25:00', async ({ page }) => {
    const pomodoroMode = page.locator('.mode-label[data-mode="pomodoro"]');
    const timeDisplay = page.locator('#timeDisplay');
    
    await pomodoroMode.click();
    await expect(timeDisplay).toHaveText('25:00');
  });

  test('Short Break mode must show 5:00', async ({ page }) => {
    const shortBreakMode = page.locator('.mode-label[data-mode="short-break"]');
    const timeDisplay = page.locator('#timeDisplay');
    
    await shortBreakMode.click();
    await expect(timeDisplay).toHaveText('05:00');
  });

  test('Long Break mode must show 15:00', async ({ page }) => {
    const longBreakMode = page.locator('.mode-label[data-mode="long-break"]');
    const timeDisplay = page.locator('#timeDisplay');
    
    await longBreakMode.click();
    await expect(timeDisplay).toHaveText('15:00');
  });
});

test.describe('Pomodoro Timer - UI Elements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('progress bar must be visible', async ({ page }) => {
    const progressBar = page.locator('.timer-progress-bar');
    await expect(progressBar).toBeVisible();
  });

  test('all buttons must be enabled', async ({ page }) => {
    const startBtn = page.locator('#startBtn');
    const resetBtn = page.locator('#resetBtn');
    const settingsToggle = page.locator('#settingsToggle');
    
    await expect(startBtn).toBeEnabled();
    await expect(resetBtn).toBeEnabled();
    await expect(settingsToggle).toBeEnabled();
  });

  test('session counter must be visible', async ({ page }) => {
    const sessionCount = page.locator('#sessionCount');
    await expect(sessionCount).toBeVisible();
    await expect(sessionCount).not.toBeEmpty();
  });
});
