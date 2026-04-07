import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import timerState from "../../js/timer-state.js";

describe("timer-state", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("normalizes settings to safe defaults and bounds", () => {
        expect(timerState.normalizeSettings({
            pomodoro: 999,
            shortBreak: "5.9",
            longBreak: "abc",
            soundEnabled: false
        })).toEqual({
            pomodoro: 120,
            shortBreak: 5,
            longBreak: 15,
            soundEnabled: false
        });
    });

    it("normalizes timer state with fallback mode and remaining time", () => {
        const settings = { pomodoro: 10, shortBreak: 3, longBreak: 20, soundEnabled: true };

        expect(timerState.normalizeTimerState({
            currentMode: "invalid-mode",
            isRunning: true,
            endTime: "nope",
            remainingSeconds: -1,
            completedPomodorosInCycle: 99
        }, settings)).toEqual({
            currentMode: "pomodoro",
            isRunning: true,
            endTime: null,
            remainingSeconds: 10 * 60,
            completedPomodorosInCycle: 4
        });
    });

    it("returns default timer state for the current pomodoro duration", () => {
        expect(timerState.getDefaultTimerState({
            pomodoro: 15,
            shortBreak: 4,
            longBreak: 18,
            soundEnabled: true
        })).toEqual({
            currentMode: "pomodoro",
            isRunning: false,
            endTime: null,
            remainingSeconds: 15 * 60,
            completedPomodorosInCycle: 0
        });
    });

    it("saves and loads normalized settings", () => {
        const saved = timerState.saveSettings({
            pomodoro: 60,
            shortBreak: 10,
            longBreak: 20,
            soundEnabled: false
        });

        expect(saved).toEqual({
            pomodoro: 60,
            shortBreak: 10,
            longBreak: 20,
            soundEnabled: false
        });
        expect(timerState.loadSettings()).toEqual(saved);
    });

    it("falls back to defaults when saved settings JSON is malformed", () => {
        localStorage.setItem(timerState.keys.SETTINGS_KEY, "{broken");
        expect(timerState.loadSettings()).toEqual(timerState.getDefaultSettings());
    });

    it("computes remaining seconds for running and paused states", () => {
        const now = 50_000;
        expect(timerState.getRemainingSeconds({
            currentMode: "pomodoro",
            isRunning: true,
            endTime: now + 7_200,
            remainingSeconds: 10,
            completedPomodorosInCycle: 0
        }, now)).toBe(8);

        expect(timerState.getRemainingSeconds({
            currentMode: "pomodoro",
            isRunning: false,
            endTime: null,
            remainingSeconds: 42,
            completedPomodorosInCycle: 0
        }, now)).toBe(42);
    });

    it("starts a paused timer from the current remaining time", () => {
        const now = 100_000;
        const started = timerState.startTimerState({
            currentMode: "pomodoro",
            isRunning: false,
            endTime: null,
            remainingSeconds: 500,
            completedPomodorosInCycle: 1
        }, timerState.getDefaultSettings(), now);

        expect(started.isRunning).toBe(true);
        expect(started.endTime).toBe(now + 500_000);
        expect(started.remainingSeconds).toBe(500);
        expect(started.completedPomodorosInCycle).toBe(1);
    });

    it("starts a paused timer from full mode duration when remaining time is zero", () => {
        const now = 120_000;
        const started = timerState.startTimerState({
            currentMode: "short-break",
            isRunning: false,
            endTime: null,
            remainingSeconds: 0,
            completedPomodorosInCycle: 2
        }, timerState.getDefaultSettings(), now);

        expect(started.endTime).toBe(now + (5 * 60 * 1000));
        expect(started.remainingSeconds).toBe(5 * 60);
    });

    it("pauses a running timer using the live remaining time", () => {
        const now = 200_000;
        const paused = timerState.pauseTimerState({
            currentMode: "pomodoro",
            isRunning: true,
            endTime: now + 19_000,
            remainingSeconds: 25 * 60,
            completedPomodorosInCycle: 0
        }, timerState.getDefaultSettings(), now);

        expect(paused.isRunning).toBe(false);
        expect(paused.endTime).toBe(null);
        expect(paused.remainingSeconds).toBe(19);
    });

    it("hydrates pomodoro completion into short break", () => {
        const now = 500_000;
        const hydrated = timerState.hydrateTimerState({
            currentMode: "pomodoro",
            isRunning: true,
            endTime: now - 1_000,
            remainingSeconds: 60,
            completedPomodorosInCycle: 0
        }, {
            pomodoro: 1,
            shortBreak: 5,
            longBreak: 15,
            soundEnabled: true
        }, now);

        expect(hydrated.currentMode).toBe("short-break");
        expect(hydrated.isRunning).toBe(true);
        expect(hydrated.completedPomodorosInCycle).toBe(1);
        expect(hydrated.remainingSeconds).toBe(5 * 60 - 1);
    });

    it("hydrates across multiple elapsed segments into the correct later pomodoro", () => {
        const settings = {
            pomodoro: 1,
            shortBreak: 1,
            longBreak: 2,
            soundEnabled: false
        };
        const start = 1_000_000;
        const now = start + (60 * 1000) + (60 * 1000) + (30 * 1000);
        const hydrated = timerState.hydrateTimerState({
            currentMode: "pomodoro",
            isRunning: true,
            endTime: start + (60 * 1000),
            remainingSeconds: 60,
            completedPomodorosInCycle: 0
        }, settings, now);

        expect(hydrated.currentMode).toBe("pomodoro");
        expect(hydrated.completedPomodorosInCycle).toBe(1);
        expect(hydrated.isRunning).toBe(true);
        expect(hydrated.remainingSeconds).toBe(30);
    });

    it("resets to idle after the long break completes", () => {
        const settings = {
            pomodoro: 25,
            shortBreak: 5,
            longBreak: 1,
            soundEnabled: false
        };
        const now = 2_000_000;
        const hydrated = timerState.hydrateTimerState({
            currentMode: "long-break",
            isRunning: true,
            endTime: now - 1_000,
            remainingSeconds: 60,
            completedPomodorosInCycle: 4
        }, settings, now);

        expect(hydrated).toEqual({
            currentMode: "pomodoro",
            isRunning: false,
            endTime: null,
            remainingSeconds: 25 * 60,
            completedPomodorosInCycle: 0
        });
    });

    it("applies settings to idle timer state but leaves running timers unchanged", () => {
        const idle = timerState.applySettingsToTimerState({
            currentMode: "short-break",
            isRunning: false,
            endTime: null,
            remainingSeconds: 300,
            completedPomodorosInCycle: 2
        }, {
            pomodoro: 50,
            shortBreak: 7,
            longBreak: 20,
            soundEnabled: true
        });

        expect(idle.remainingSeconds).toBe(7 * 60);

        const running = timerState.applySettingsToTimerState({
            currentMode: "pomodoro",
            isRunning: true,
            endTime: Date.now() + 10_000,
            remainingSeconds: 120,
            completedPomodorosInCycle: 1
        }, {
            pomodoro: 10,
            shortBreak: 3,
            longBreak: 8,
            soundEnabled: true
        });

        expect(running.isRunning).toBe(true);
        expect(running.currentMode).toBe("pomodoro");
    });

    it("reports the current pomodoro number for work and break states", () => {
        expect(timerState.getCurrentPomodoroNumber({
            currentMode: "pomodoro",
            completedPomodorosInCycle: 0
        })).toBe(1);

        expect(timerState.getCurrentPomodoroNumber({
            currentMode: "short-break",
            completedPomodorosInCycle: 2
        })).toBe(2);
    });

    it("projects the cycle end time from a paused timer", () => {
        const settings = {
            pomodoro: 1,
            shortBreak: 1,
            longBreak: 1,
            soundEnabled: true
        };
        const now = 1_500_000;
        const projection = timerState.getProjectedCycleEndTime({
            currentMode: "pomodoro",
            isRunning: false,
            endTime: null,
            remainingSeconds: 60,
            completedPomodorosInCycle: 3
        }, settings, now);

        expect(projection).toBe(now + (60 * 1000) + (60 * 1000));
    });

    it("saves normalized timer state and loads a safe fallback for malformed storage", () => {
        const saved = timerState.saveTimerState({
            currentMode: "pomodoro",
            isRunning: false,
            endTime: 999,
            remainingSeconds: 90,
            completedPomodorosInCycle: 1
        }, timerState.getDefaultSettings());

        expect(saved).toEqual({
            currentMode: "pomodoro",
            isRunning: false,
            endTime: null,
            remainingSeconds: 90,
            completedPomodorosInCycle: 1
        });

        localStorage.setItem(timerState.keys.TIMER_STATE_KEY, "{bad");
        expect(timerState.loadTimerState(timerState.getDefaultSettings())).toEqual(
            timerState.getDefaultTimerState(timerState.getDefaultSettings())
        );
    });

    it("resets timer state using saved settings when explicit settings are absent", () => {
        timerState.saveSettings({
            pomodoro: 40,
            shortBreak: 7,
            longBreak: 22,
            soundEnabled: true
        });

        expect(timerState.resetTimerState({
            currentMode: "short-break",
            isRunning: false,
            endTime: null,
            remainingSeconds: 1,
            completedPomodorosInCycle: 2
        })).toEqual({
            currentMode: "pomodoro",
            isRunning: false,
            endTime: null,
            remainingSeconds: 40 * 60,
            completedPomodorosInCycle: 0
        });
    });

    it("compares states for equality", () => {
        const state = {
            currentMode: "pomodoro",
            isRunning: true,
            endTime: 123,
            remainingSeconds: 456,
            completedPomodorosInCycle: 2
        };

        expect(timerState.areStatesEqual(state, { ...state })).toBe(true);
        expect(timerState.areStatesEqual(state, { ...state, remainingSeconds: 455 })).toBe(false);
    });
});
