document.addEventListener("DOMContentLoaded", () => {
    const timeDisplay = document.getElementById("timeDisplay");
    const startBtn = document.getElementById("startBtn");
    const resetBtn = document.getElementById("resetBtn");
    const sessionCountEl = document.getElementById("sessionCount");
    const timerLabel = document.querySelector(".timer-label");
    const progressBar = document.querySelector(".timer-progress-bar");
    const modeButtons = document.querySelectorAll(".mode-btn");

    if (!timeDisplay || !startBtn || !resetBtn || !timerLabel || !progressBar) return;

    const SETTINGS_KEY = "pomodoroSettings";

    let timer = null;
    let isRunning = false;
    let currentMode = "pomodoro";
    let remainingSeconds = 25 * 60;
    let sessionCount = 1;

    let settings = loadSettingsFromStorage();

    const modeLabels = {
        pomodoro: "Focus Time",
        "short-break": "Short Break",
        "long-break": "Long Break"
    };

    function loadSettingsFromStorage() {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) return JSON.parse(saved);
        return {
            pomodoro: 25,
            shortBreak: 5,
            longBreak: 15,
            autoStartBreaks: false,
            autoStartPomodoros: false,
            soundEnabled: true
        };
    }

    function getSettingsKey(mode) {
        if (mode === "pomodoro") return "pomodoro";
        if (mode === "short-break") return "shortBreak";
        if (mode === "long-break") return "longBreak";
        return "pomodoro";
    }

    function setMode(mode) {
        currentMode = mode;
        const minutes = settings[getSettingsKey(mode)] || 25;
        remainingSeconds = minutes * 60;

        modeButtons.forEach(btn => {
            btn.classList.toggle("mode-btn--active", btn.dataset.mode === mode);
        });

        updateLabel();
        updateDisplay();
        resetProgress();
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
                stopTimer();
            }
        }, 1000);
    }

    function stopTimer() {
        isRunning = false;
        startBtn.querySelector(".btn-text").textContent = "Start";
        clearInterval(timer);
        timer = null;
    }

    function resetTimer() {
        stopTimer();
        setMode(currentMode);
    }

    startBtn.addEventListener("click", () => {
        if (isRunning) stopTimer();
        else startTimer();
    });

    resetBtn.addEventListener("click", resetTimer);

    modeButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            stopTimer();
            setMode(btn.dataset.mode);
        });
    });

    document.addEventListener("settings:updated", (e) => {
        settings = e.detail;
        setMode(currentMode);
    });

    // Initialize with stored settings
    setMode("pomodoro");
});