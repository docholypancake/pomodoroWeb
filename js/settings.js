const settingsToggle = document.getElementById("settingsToggle");
const settingsDropdown = document.getElementById("settingsDropdown");
const saveSettingsBtn = document.getElementById("saveSettings");
const cancelSettingsBtn = document.getElementById("cancelSettings");

const pomodoroInput = document.getElementById("pomodoroTime");
const shortBreakInput = document.getElementById("shortBreakTime");
const longBreakInput = document.getElementById("longBreakTime");
const autoStartBreaksInput = document.getElementById("autoStartBreaks");
const autoStartPomodorosInput = document.getElementById("autoStartPomodoros");
const soundEnabledInput = document.getElementById("soundEnabled");

const SETTINGS_KEY = "pomodoroSettings";

function getDefaultSettings() {
    return {
        pomodoro: 25,
        shortBreak: 5,
        longBreak: 15,
        autoStartBreaks: false,
        autoStartPomodoros: false,
        soundEnabled: true
    };
}

function readSettingsFromInputs() {
    return {
        pomodoro: Number(pomodoroInput.value),
        shortBreak: Number(shortBreakInput.value),
        longBreak: Number(longBreakInput.value),
        autoStartBreaks: autoStartBreaksInput.checked,
        autoStartPomodoros: autoStartPomodorosInput.checked,
        soundEnabled: soundEnabledInput.checked
    };
}

function loadSettings() {
    const saved = localStorage.getItem(SETTINGS_KEY);
    const settings = saved ? JSON.parse(saved) : getDefaultSettings();

    pomodoroInput.value = settings.pomodoro;
    shortBreakInput.value = settings.shortBreak;
    longBreakInput.value = settings.longBreak;
    autoStartBreaksInput.checked = settings.autoStartBreaks;
    autoStartPomodorosInput.checked = settings.autoStartPomodoros;
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
    settingsDropdown.classList.add("active");
}

function closeSettings() {
    settingsDropdown.classList.remove("active");
}

settingsToggle?.addEventListener("click", () => {
    settingsDropdown.classList.contains("active") ? closeSettings() : openSettings();
});

saveSettingsBtn?.addEventListener("click", saveSettings);
cancelSettingsBtn?.addEventListener("click", closeSettings);

document.addEventListener("click", (e) => {
    const isInside = settingsDropdown.contains(e.target) || settingsToggle.contains(e.target);
    if (!isInside) closeSettings();
});

// Live updates when inputs change
[pomodoroInput, shortBreakInput, longBreakInput].forEach(input => {
    input.addEventListener("input", applySettingsLive);
});
[autoStartBreaksInput, autoStartPomodorosInput, soundEnabledInput].forEach(input => {
    input.addEventListener("change", applySettingsLive);
});

const settings = loadSettings();
document.dispatchEvent(new CustomEvent("settings:loaded", { detail: settings }));