import { describe, it, expect } from "vitest";
import settingsValidation from "../../src/js/settings-validation.js";

const {
    DEFAULT_SETTINGS,
    DECIMAL_MINUTES_PATTERN,
    FIELD_LIMITS,
    buildFieldConfig,
    normalizeMinuteValue,
    validateSettingsDraftValues
} = settingsValidation;

describe("settings-validation", () => {
    it("builds field config with labels, limits, and default values", () => {
        expect(buildFieldConfig({
            pomodoro: 40,
            shortBreak: 7,
            longBreak: 22
        })).toEqual([
            {
                key: "pomodoro",
                label: "Pomodoro",
                min: 1,
                max: 120,
                defaultValue: 40
            },
            {
                key: "shortBreak",
                label: "Short break",
                min: 1,
                max: 30,
                defaultValue: 7
            },
            {
                key: "longBreak",
                label: "Long break",
                min: 1,
                max: 80,
                defaultValue: 22
            }
        ]);
    });

    it("exports the expected default settings and field limits", () => {
        expect(DEFAULT_SETTINGS).toEqual({
            pomodoro: 25,
            shortBreak: 5,
            longBreak: 15,
            soundEnabled: true
        });
        expect(FIELD_LIMITS.pomodoro.max).toBe(120);
        expect(FIELD_LIMITS.shortBreak.max).toBe(30);
        expect(FIELD_LIMITS.longBreak.max).toBe(80);
        expect(DECIMAL_MINUTES_PATTERN.test("12.5")).toBe(true);
        expect(DECIMAL_MINUTES_PATTERN.test("1e2")).toBe(false);
    });

    it("accepts valid integer values unchanged", () => {
        expect(normalizeMinuteValue("45", buildFieldConfig()[0])).toEqual({
            value: 45,
            isValid: true,
            displayValue: "45",
            reason: "valid"
        });
    });

    it("floors decimal values and returns the floored display value", () => {
        expect(normalizeMinuteValue("5.9", buildFieldConfig()[0])).toEqual({
            value: 5,
            isValid: true,
            displayValue: "5",
            reason: "floored"
        });
    });

    it("defaults zero values back to each field default", () => {
        expect(normalizeMinuteValue("0", buildFieldConfig()[0])).toEqual({
            value: 25,
            isValid: true,
            displayValue: "25",
            reason: "below-min-defaulted"
        });
    });

    it("rejects negative values instead of silently defaulting them", () => {
        expect(normalizeMinuteValue("-8", buildFieldConfig()[1])).toEqual({
            value: null,
            isValid: false,
            displayValue: "-8",
            reason: "invalid-format"
        });
    });

    it("rejects blank values", () => {
        expect(normalizeMinuteValue("", buildFieldConfig()[2])).toEqual({
            value: null,
            isValid: false,
            displayValue: "",
            reason: "blank"
        });
    });

    it("rejects non-numeric values", () => {
        expect(normalizeMinuteValue("abc", buildFieldConfig()[0])).toEqual({
            value: null,
            isValid: false,
            displayValue: "abc",
            reason: "invalid-format"
        });
    });

    it("rejects scientific and hexadecimal number formats", () => {
        expect(normalizeMinuteValue("1e2", buildFieldConfig()[0])).toEqual({
            value: null,
            isValid: false,
            displayValue: "1e2",
            reason: "invalid-format"
        });

        expect(normalizeMinuteValue("0x10", buildFieldConfig()[0])).toEqual({
            value: null,
            isValid: false,
            displayValue: "0x10",
            reason: "invalid-format"
        });
    });

    it("rejects values above the allowed maximum while preserving the visible number", () => {
        expect(normalizeMinuteValue("121", buildFieldConfig()[0])).toEqual({
            value: 121,
            isValid: false,
            displayValue: "121",
            reason: "above-max"
        });
    });

    it("trims surrounding whitespace before validation", () => {
        expect(normalizeMinuteValue("  14.8  ", buildFieldConfig()[1])).toEqual({
            value: 14,
            isValid: true,
            displayValue: "14",
            reason: "floored"
        });
    });

    it("validates a full draft and normalizes each minute field", () => {
        const result = validateSettingsDraftValues({
            pomodoro: "50.7",
            shortBreak: "0",
            longBreak: "79.9",
            soundEnabled: false
        }, buildFieldConfig(), draft => ({
            ...draft,
            normalized: true
        }));

        expect(result.isValid).toBe(true);
        expect(result.invalidKey).toBeNull();
        expect(result.draft).toEqual({
            pomodoro: 50,
            shortBreak: 5,
            longBreak: 79,
            soundEnabled: false,
            normalized: true
        });
        expect(result.fieldResults.shortBreak.displayValue).toBe("5");
    });

    it("returns the first invalid field when pomodoro is blank", () => {
        const result = validateSettingsDraftValues({
            pomodoro: "",
            shortBreak: "5",
            longBreak: "15",
            soundEnabled: true
        }, buildFieldConfig());

        expect(result.isValid).toBe(false);
        expect(result.invalidKey).toBe("pomodoro");
        expect(result.message).toBe("Pomodoro must be between 1 and 120.");
    });

    it("returns the first invalid field when short break exceeds the maximum", () => {
        const result = validateSettingsDraftValues({
            pomodoro: "25",
            shortBreak: "31",
            longBreak: "15",
            soundEnabled: true
        }, buildFieldConfig());

        expect(result.isValid).toBe(false);
        expect(result.invalidKey).toBe("shortBreak");
        expect(result.message).toBe("Short break must be between 1 and 30.");
    });

    it("returns the first invalid field when long break is blank", () => {
        const result = validateSettingsDraftValues({
            pomodoro: "25",
            shortBreak: "5",
            longBreak: "",
            soundEnabled: true
        }, buildFieldConfig());

        expect(result.isValid).toBe(false);
        expect(result.invalidKey).toBe("longBreak");
        expect(result.message).toBe("Long break must be between 1 and 80.");
    });

    it("defaults soundEnabled to true when the draft omits it", () => {
        const result = validateSettingsDraftValues({
            pomodoro: "25",
            shortBreak: "5",
            longBreak: "15"
        }, buildFieldConfig());

        expect(result.isValid).toBe(true);
        expect(result.draft.soundEnabled).toBe(true);
    });
});
