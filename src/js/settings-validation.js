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

const DECIMAL_MINUTES_PATTERN = /^\d+(?:\.\d+)?$/;

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

    if (!DECIMAL_MINUTES_PATTERN.test(trimmedValue)) {
        return {
            value: null,
            isValid: false,
            displayValue: trimmedValue,
            reason: "invalid-format"
        };
    }

    const numericValue = Number(trimmedValue);
    const flooredValue = Math.floor(numericValue);
  
    if (flooredValue === 0) {
        return {
            value: config.defaultValue,
            isValid: true,
            displayValue: String(config.defaultValue),
            reason: "below-min-defaulted"
        };
    }

    if (flooredValue < config.min) {
        return {
            value: flooredValue,
            isValid: false,
            displayValue: String(flooredValue),
            reason: "below-min"
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
    DECIMAL_MINUTES_PATTERN,
    buildFieldConfig,
    normalizeMinuteValue,
    validateSettingsDraftValues
};

if (typeof window !== "undefined") {
    window.PomodoroSettingsValidation = api;
}

export default api;
