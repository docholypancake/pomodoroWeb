const settingsToggle = document.getElementById("settingsToggle");
const timerSection = document.getElementById("timerSection");
const settingsSection = document.getElementById("settingsSection");
const saveSettingsBtn = document.getElementById("saveSettings");
const cancelSettingsBtn = document.getElementById("cancelSettings");

const pomodoroInput = document.getElementById("pomodoroTime");
const shortBreakInput = document.getElementById("shortBreakTime");
const longBreakInput = document.getElementById("longBreakTime");
const soundEnabledInput = document.getElementById("soundEnabled");
const focusCyclesInput = document.getElementById("focusCycles");
const settingsError = document.getElementById("settingsError");

const timerStateStore = window.PomodoroTimerState;

const fieldConfig = [
    { input: pomodoroInput, key: "pomodoro", label: "Work", min: 1, max: 120 },
    { input: shortBreakInput, key: "shortBreak", label: "Short break", min: 1, max: 30 },
    { input: longBreakInput, key: "longBreak", label: "Long break", min: 1, max: 80 },
    { input: focusCyclesInput, key: "focusCycles", label: "Focus session cycles", min: 1, max: 12 }
];

let savedSettings = loadSettingsFromStorage();

function loadSettingsFromStorage() {
    return timerStateStore.loadSettings();
}

function applySettingsToInputs(settings) {
    pomodoroInput.value = settings.pomodoro;
    shortBreakInput.value = settings.shortBreak;
    longBreakInput.value = settings.longBreak;
    soundEnabledInput.checked = settings.soundEnabled;
    focusCyclesInput.value = settings.focusCycles;
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

function validateSettingsDraft() {
    clearValidationState();

    const draft = {
        pomodoro: Number(pomodoroInput.value),
        shortBreak: Number(shortBreakInput.value),
        longBreak: Number(longBreakInput.value),
        soundEnabled: soundEnabledInput.checked,
        focusCycles: Number(focusCyclesInput.value)
    };

    for (const { input, key, label, min, max } of fieldConfig) {
        const value = draft[key];
        if (!Number.isInteger(value) || value < min || value > max) {
            showValidationError(`${label} must be between ${min} and ${max}.`, [input]);
            input.focus();
            return null;
        }
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
});

window.addEventListener("storage", (event) => {
    if (event.key !== timerStateStore.keys.SETTINGS_KEY) return;

    savedSettings = loadSettingsFromStorage();
    if (!settingsSection.classList.contains("hidden")) {
        applySettingsToInputs(savedSettings);
        clearValidationState();
    }
});

applySettingsToInputs(savedSettings);
document.dispatchEvent(new CustomEvent("settings:loaded", { detail: savedSettings }));
