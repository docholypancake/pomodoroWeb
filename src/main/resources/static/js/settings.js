const settingsToggle = document.getElementById("settingsToggle");
const timerSection = document.getElementById("timerSection");
const settingsSection = document.getElementById("settingsSection");
const saveSettingsBtn = document.getElementById("saveSettings");
const cancelSettingsBtn = document.getElementById("cancelSettings");

const pomodoroInput = document.getElementById("pomodoroTime");
const shortBreakInput = document.getElementById("shortBreakTime");
const longBreakInput = document.getElementById("longBreakTime");
const soundEnabledInput = document.getElementById("soundEnabled");

const SETTINGS_KEY = "pomodoroSettings";

function getDefaultSettings() {
    return {
        pomodoro: 25,
        shortBreak: 5,
        longBreak: 15,
        soundEnabled: true
    };
}

function readSettingsFromInputs() {
    return {
        pomodoro: Number(pomodoroInput.value),
        shortBreak: Number(shortBreakInput.value),
        longBreak: Number(longBreakInput.value),
        soundEnabled: soundEnabledInput.checked
    };
}

function loadSettings() {
    const saved = localStorage.getItem(SETTINGS_KEY);
    const settings = saved ? JSON.parse(saved) : getDefaultSettings();

    pomodoroInput.value = settings.pomodoro;
    shortBreakInput.value = settings.shortBreak;
    longBreakInput.value = settings.longBreak;
    soundEnabledInput.checked = settings.soundEnabled;

    return settings;
}

function saveSettings() {
    const settings = readSettingsFromInputs();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    document.dispatchEvent(new CustomEvent("settings:updated", { detail: settings }));
    closeSettings();
}

function applySettingsLive() {
    const settings = readSettingsFromInputs();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    document.dispatchEvent(new CustomEvent("settings:updated", { detail: settings }));
}

function openSettings() {
    timerSection.classList.add("hidden");
    settingsSection.classList.remove("hidden");
}

function closeSettings() {
    settingsSection.classList.add("hidden");
    timerSection.classList.remove("hidden");
}

settingsToggle?.addEventListener("click", () => {
    if (settingsToggle.disabled) return;
    settingsSection.classList.contains("hidden") ? openSettings() : closeSettings();
});

saveSettingsBtn?.addEventListener("click", saveSettings);
cancelSettingsBtn?.addEventListener("click", closeSettings);

// Live updates when inputs change
[pomodoroInput, shortBreakInput, longBreakInput].forEach(input => {
    input.addEventListener("input", applySettingsLive);
});
soundEnabledInput.addEventListener("change", applySettingsLive);

const settings = loadSettings();
document.dispatchEvent(new CustomEvent("settings:loaded", { detail: settings }));