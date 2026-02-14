const timeDisplay = document.getElementById("timeDisplay");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const sessionCountEl = document.getElementById("sessionCount");
const timerLabel = document.querySelector(".timer-label");
const progressBar = document.querySelector(".timer-progress-bar");
const modeButtons = document.querySelectorAll(".mode-btn");

let timer = null;
let isRunning = false;
let currentMode = "pomodoro";
let remainingSeconds = 25 * 60;
let sessionCount = 1;

let settings = {
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    soundEnabled: true
};

const modeLabels = {
    pomodoro: "Focus Time",
    "short-break": "Short Break",
    "long-break": "Long Break"
};

function setMode(mode) {
    currentMode = mode;
    const minutes = settings[getSettingsKey(mode)] || 25;
    remainingSeconds = minutes * 60;
    updateDisplay();
    updateLabel();

    modeButtons.forEach(btn => {
        btn.classList.toggle("mode-btn--active", btn.dataset.mode === mode);
    });

    resetProgress();
}

function getSettingsKey(mode) {
    if (mode === "pomodoro") return "pomodoro";
    if (mode === "short-break") return "shortBreak";
    if (mode === "long-break") return "longBreak";
    return "pomodoro";
}

function updateDisplay() {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    timeDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    updateProgress();
}

function updateLabel() {
    timerLabel.textContent = modeLabels[currentMode] || "Timer";
}

function updateProgress() {
    const totalSeconds = (settings[getSettingsKey(currentMode)] || 25) * 60;
    const progress = 1 - remainingSeconds / totalSeconds;
    const circumference = 2 * Math.PI * 90;
    const offset = circumference * (1 - progress);
    progressBar.style.strokeDasharray = `${circumference}`;
    progressBar.style.strokeDashoffset = `${offset}`;
}

function resetProgress() {
    const circumference = 2 * Math.PI * 90;
    progressBar.style.strokeDasharray = `${circumference}`;
    progressBar.style.strokeDashoffset = `${circumference}`;
}

function startTimer() {
    if (isRunning) return;
    isRunning = true;
    startBtn.querySelector(".btn-text").textContent = "Stop";

    timer = setInterval(() => {
        if (remainingSeconds > 0) {
            remainingSeconds--;
            updateDisplay();
        } else {
            completeCycle();
        }
    }, 1000);
}

function stopTimer() {
    isRunning = false;
    startBtn.querySelector(".btn-text").textContent = "Start";
    clearInterval(timer);
}

function resetTimer() {
    stopTimer();
    setMode(currentMode);
}

function completeCycle() {
    stopTimer();

    if (currentMode === "pomodoro") {
        sessionCount++;
        sessionCountEl.textContent = sessionCount;
        if (settings.autoStartBreaks) {
            setMode("short-break");
            startTimer();
        } else {
            setMode("short-break");
        }
    } else {
        if (settings.autoStartPomodoros) {
            setMode("pomodoro");
            startTimer();
        } else {
            setMode("pomodoro");
        }
    }

    if (settings.soundEnabled) {
        beep();
    }
}

function beep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 880;
        gain.gain.value = 0.1;
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    } catch {
        // no-op if audio fails
    }
}

startBtn?.addEventListener("click", () => {
    if (isRunning) stopTimer();
    else startTimer();
});

resetBtn?.addEventListener("click", resetTimer);

modeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        stopTimer();
        setMode(btn.dataset.mode);
    });
});

document.addEventListener("settings:loaded", (e) => {
    settings = e.detail;
    setMode(currentMode);
});

document.addEventListener("settings:updated", (e) => {
    settings = e.detail;
    setMode(currentMode);
});

// Initialize
setMode("pomodoro");