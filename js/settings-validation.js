(function (globalScope) {
    const DEFAULT_SETTINGS = {
        pomodoro: 25,
        shortBreak: 5,
        longBreak: 15,
        soundEnabled: true
    };

    const FIELD_LIMITS = {
        pomodoro: {
            key: "pomodoro",
            label: "Pomodoro",
            min: 1,
            max: 120
        },
        shortBreak: {
            key: "shortBreak",
            label: "Short break",
            min: 1,
            max: 30
        },
        longBreak: {
            key: "longBreak",
            label: "Long break",
            min: 1,
            max: 80
        }
    };

    function buildFieldConfig(defaultSettings = DEFAULT_SETTINGS) {
        return Object.values(FIELD_LIMITS).map(field => ({
            ...field,
            defaultValue: Number(defaultSettings?.[field.key]) || DEFAULT_SETTINGS[field.key]
        }));
    }

    function normalizeMinuteValue(rawValue, config) {
        const trimmedValue = String(rawValue ?? "").trim();

        if (trimmedValue === "") {
            return {
                value: null,
                isValid: false,
                displayValue: "",
                reason: "blank"
            };
        }

        const numericValue = Number(trimmedValue);
        if (!Number.isFinite(numericValue)) {
            return {
                value: null,
                isValid: false,
                displayValue: trimmedValue,
                reason: "non-numeric"
            };
        }

        const flooredValue = Math.floor(numericValue);

        if (flooredValue < config.min) {
            return {
                value: config.defaultValue,
                isValid: true,
                displayValue: String(config.defaultValue),
                reason: "below-min-defaulted"
            };
        }

        if (flooredValue > config.max) {
            return {
                value: flooredValue,
                isValid: false,
                displayValue: String(flooredValue),
                reason: "above-max"
            };
        }

        return {
            value: flooredValue,
            isValid: true,
            displayValue: String(flooredValue),
            reason: Number.isInteger(numericValue) ? "valid" : "floored"
        };
    }

    function validateSettingsDraftValues(rawValues, fieldConfigs, normalizeSettings = value => value) {
        const draft = {
            soundEnabled: rawValues?.soundEnabled !== false
        };
        const fieldResults = {};

        for (const config of fieldConfigs) {
            const normalizedField = normalizeMinuteValue(rawValues?.[config.key], config);
            fieldResults[config.key] = normalizedField;

            if (
                !normalizedField.isValid
                || !Number.isInteger(normalizedField.value)
                || normalizedField.value < config.min
                || normalizedField.value > config.max
            ) {
                return {
                    isValid: false,
                    draft: null,
                    invalidKey: config.key,
                    message: `${config.label} must be between ${config.min} and ${config.max}.`,
                    fieldResults
                };
            }

            draft[config.key] = normalizedField.value;
        }

        return {
            isValid: true,
            draft: normalizeSettings(draft),
            invalidKey: null,
            message: "",
            fieldResults
        };
    }

    const api = {
        DEFAULT_SETTINGS,
        FIELD_LIMITS,
        buildFieldConfig,
        normalizeMinuteValue,
        validateSettingsDraftValues
    };

    if (globalScope) {
        globalScope.PomodoroSettingsValidation = api;
    }

    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    }
})(typeof window !== "undefined" ? window : globalThis);
