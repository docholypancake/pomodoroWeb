import timerStateStore from "./timer-state.js";
import settingsValidationApi from "./settings-validation.js";

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

const defaultSettings = timerStateStore.getDefaultSettings();

const fieldConfig = settingsValidationApi.buildFieldConfig(defaultSettings).map(config => ({
    ...config,
    input: {
        pomodoro: pomodoroInput,
        shortBreak: shortBreakInput,
        longBreak: longBreakInput
    }[config.key]
}));

let savedSettings = loadSettingsFromStorage();

function loadSettingsFromStorage() {
    return timerStateStore.loadSettings();
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
    const normalized = settingsValidationApi.normalizeMinuteValue(input.value, config);
    input.value = normalized.displayValue;
    return normalized;
}

function validateSettingsDraft() {
    clearValidationState();
    const rawDraft = {
        pomodoro: pomodoroInput.value,
        shortBreak: shortBreakInput.value,
        longBreak: longBreakInput.value,
        soundEnabled: soundEnabledInput.checked
    };

    const validation = settingsValidationApi.validateSettingsDraftValues(
        rawDraft,
        fieldConfig,
        timerStateStore.normalizeSettings
    );

    fieldConfig.forEach(config => {
        const normalizedField = validation.fieldResults?.[config.key];
        if (normalizedField && typeof normalizedField.displayValue === "string") {
            config.input.value = normalizedField.displayValue;
        }
    });

    if (!validation.isValid) {
        const invalidField = fieldConfig.find(config => config.key === validation.invalidKey);
        if (invalidField?.input) {
            showValidationError(validation.message, [invalidField.input]);
            invalidField.input.focus();
        }
        return null;
    }

    return validation.draft;
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

window.addEventListener("storage", event => {
    if (event.key !== timerStateStore.keys.SETTINGS_KEY) return;

    savedSettings = loadSettingsFromStorage();
    if (!settingsSection.classList.contains("hidden")) {
        applySettingsToInputs(savedSettings);
        clearValidationState();
    }
});

savedSettings = loadSettingsFromStorage();
applySettingsToInputs(savedSettings);
document.dispatchEvent(new CustomEvent("settings:loaded", { detail: savedSettings }));
