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

const timerStateStore = window.PomodoroTimerState;

function readSettingsFromInputs() {
    return timerStateStore.normalizeSettings({
        pomodoro: Number(pomodoroInput.value),
        shortBreak: Number(shortBreakInput.value),
        longBreak: Number(longBreakInput.value),
        soundEnabled: soundEnabledInput.checked,
        focusCycles: Number(focusCyclesInput.value)
    });
}

function loadSettings() {
    const settings = timerStateStore.loadSettings();

    pomodoroInput.value = settings.pomodoro;
    shortBreakInput.value = settings.shortBreak;
    longBreakInput.value = settings.longBreak;
    soundEnabledInput.checked = settings.soundEnabled;
    focusCyclesInput.value = settings.focusCycles;

    return settings;
}

function saveSettings() {
    const settings = readSettingsFromInputs();
    timerStateStore.saveSettings(settings);
    document.dispatchEvent(new CustomEvent("settings:updated", { detail: settings }));
    closeSettings();
}

function applySettingsLive() {
    const settings = readSettingsFromInputs();
    timerStateStore.saveSettings(settings);
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

[pomodoroInput, shortBreakInput, longBreakInput, focusCyclesInput].forEach(input => {
    input.addEventListener("input", applySettingsLive);
});
soundEnabledInput.addEventListener("change", applySettingsLive);

const settings = loadSettings();
document.dispatchEvent(new CustomEvent("settings:loaded", { detail: settings }));
