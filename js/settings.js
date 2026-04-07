const settingsToggle = document.getElementById("settingsToggle");
const timerSection = document.getElementById("timerSection");
const settingsSection = document.getElementById("settingsSection");
const saveSettingsBtn = document.getElementById("saveSettings");
const cancelSettingsBtn = document.getElementById("cancelSettings");

const pomodoroInput = document.getElementById("pomodoroTime");
const shortBreakInput = document.getElementById("shortBreakTime");
const longBreakInput = document.getElementById("longBreakTime");
const soundEnabledInput = document.getElementById("soundEnabled");
const settingsError = document.getElementById("settingsError");

const timerStateStore = window.PomodoroTimerState;
const defaultSettings = timerStateStore ? timerStateStore.getDefaultSettings() : {
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
    soundEnabled: true
};

const fieldConfig = [
    { input: pomodoroInput, key: "pomodoro", label: "Pomodoro", min: 1, max: 120, defaultValue: defaultSettings.pomodoro },
    { input: shortBreakInput, key: "shortBreak", label: "Short break", min: 1, max: 30, defaultValue: defaultSettings.shortBreak },
    { input: longBreakInput, key: "longBreak", label: "Long break", min: 1, max: 80, defaultValue: defaultSettings.longBreak }
];

let savedSettings = loadSettingsFromStorage();

function loadSettingsFromStorage() {
    return timerStateStore ? timerStateStore.loadSettings() : {
        pomodoro: 25,
        shortBreak: 5,
        longBreak: 15,
        soundEnabled: true
    };
}

function applySettingsToInputs(settings) {
    pomodoroInput.value = settings.pomodoro;
    shortBreakInput.value = settings.shortBreak;
    longBreakInput.value = settings.longBreak;
    soundEnabledInput.checked = settings.soundEnabled;
}

function clearValidationState() {
    fieldConfig.forEach(({ input }) => {
        input.removeAttribute("aria-invalid");
        input.classList.remove("settings-input--invalid");
    });

    if (settingsError) {
        settingsError.textContent = "";
        settingsError.classList.add("hidden");
    }
}

function showValidationError(message, invalidInputs) {
    invalidInputs.forEach(input => {
        input.setAttribute("aria-invalid", "true");
        input.classList.add("settings-input--invalid");
    });

    if (settingsError) {
        settingsError.textContent = message;
        settingsError.classList.remove("hidden");
    }
}

function normalizeMinuteInputValue(input, config) {
    const rawValue = input.value.trim();

    if (rawValue === "") {
        return { value: null, isValid: false };
    }

    const numericValue = Number(rawValue);
    if (!Number.isFinite(numericValue)) {
        return { value: null, isValid: false };
    }

    const flooredValue = Math.floor(numericValue);

    if (flooredValue < config.min) {
        input.value = String(config.defaultValue);
        return { value: config.defaultValue, isValid: true };
    }

    input.value = String(flooredValue);

    if (flooredValue > config.max) {
        return { value: flooredValue, isValid: false };
    }

    return { value: flooredValue, isValid: true };
}

function validateSettingsDraft() {
    clearValidationState();
    const draft = {
        soundEnabled: soundEnabledInput.checked
    };

    for (const { input, key, label, min, max, defaultValue } of fieldConfig) {
        const normalizedField = normalizeMinuteInputValue(input, { key, label, min, max, defaultValue });
        const value = normalizedField.value;

        if (!normalizedField.isValid || !Number.isInteger(value) || value < min || value > max) {
            showValidationError(`${label} must be between ${min} and ${max}.`, [input]);
            input.focus();
            return null;
        }

        draft[key] = value;
    }

    return timerStateStore.normalizeSettings(draft);
}

function openSettings() {
    savedSettings = loadSettingsFromStorage();
    applySettingsToInputs(savedSettings);
    clearValidationState();
    timerSection.classList.add("hidden");
    settingsSection.classList.remove("hidden");
}

function closeSettings() {
    settingsSection.classList.add("hidden");
    timerSection.classList.remove("hidden");
}

function saveSettings() {
    const validatedSettings = validateSettingsDraft();
    if (!validatedSettings) return;

    savedSettings = timerStateStore.saveSettings(validatedSettings);
    document.dispatchEvent(new CustomEvent("settings:updated", { detail: savedSettings }));
    closeSettings();
}

function cancelSettings() {
    applySettingsToInputs(savedSettings);
    clearValidationState();
    closeSettings();
}

settingsToggle?.addEventListener("click", () => {
    if (settingsToggle.disabled) return;
    settingsSection.classList.contains("hidden") ? openSettings() : cancelSettings();
});

saveSettingsBtn?.addEventListener("click", saveSettings);
cancelSettingsBtn?.addEventListener("click", cancelSettings);

fieldConfig.forEach(({ input }) => {
    input.addEventListener("input", () => {
        input.removeAttribute("aria-invalid");
        input.classList.remove("settings-input--invalid");

        if (settingsError) {
            settingsError.textContent = "";
            settingsError.classList.add("hidden");
        }
    });

    input.addEventListener("change", () => {
        const config = fieldConfig.find(field => field.input === input);
        if (!config) return;

        normalizeMinuteInputValue(input, config);
    });
});

window.addEventListener("storage", (event) => {
    if (!timerStateStore || event.key !== timerStateStore.keys.SETTINGS_KEY) return;

    savedSettings = loadSettingsFromStorage();
    if (!settingsSection.classList.contains("hidden")) {
        applySettingsToInputs(savedSettings);
        clearValidationState();
    }
});

if (timerStateStore) {
    savedSettings = loadSettingsFromStorage();
    applySettingsToInputs(savedSettings);
    document.dispatchEvent(new CustomEvent("settings:loaded", { detail: savedSettings }));
}
