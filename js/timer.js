document.addEventListener("DOMContentLoaded", () => {
    const timeDisplay = document.getElementById("timeDisplay");
    const startBtn = document.getElementById("startBtn");
    const resetBtn = document.getElementById("resetBtn");
    const sessionCountEl = document.getElementById("sessionCount");
    const timerLabel = document.querySelector(".timer-label");
    const progressBar = document.querySelector(".timer-progress-bar");

    if (!timeDisplay || !startBtn || !resetBtn || !timerLabel || !progressBar) return;

    const SETTINGS_KEY = "pomodoroSettings";
    const LONG_BREAK_EVERY = 4;

    let timer = null;
    let isRunning = false;
    let currentMode = "pomodoro";
    let remainingSeconds = 25 * 60;
    let pomodoroCount = 0;
    let sessionNumber = 1;

    let settings = loadSettingsFromStorage();

    const labelText = {
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
            soundEnabled: true
        };
    }

    function playSound(fileName) {
        if (!settings.soundEnabled) return;
        const audio = new Audio(`assets/sounds/${fileName}`);
        audio.play().catch(() => {});
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

        timerLabel.textContent = labelText[mode] || "Timer";
        updateDisplay();
        resetProgress();
    }

    function updateDisplay(seconds) {
        if (seconds !== undefined) {
            remainingSeconds = seconds;
        }
        const minutes = Math.floor(remainingSeconds / 60);
        const secs = remainingSeconds % 60;
        timeDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
        updateProgress();
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

    function setSettingsButtonState(running) {
        if (!settingsToggle) return;
        settingsToggle.disabled = running;
        settingsToggle.setAttribute("aria-disabled", running ? "true" : "false");
    }

    function startTimer() {
        if (isRunning) return;
        isRunning = true;
        currentMode === "pomodoro";
        setSettingsButtonState(true);
        startBtn.querySelector(".btn-text").textContent = "Stop";

        const isFreshWorkStart =
            currentMode === "pomodoro" &&
            remainingSeconds === (settings.pomodoro || 25) * 60;

        if (isFreshWorkStart) {
            playSound("timer_sound_up.wav");
        }

        timer = setInterval(() => {
            if (remainingSeconds > 0) {
                remainingSeconds--;
                updateDisplay();
            } else {
                handleCycleComplete();
            }
        }, 1000);
    }

    function stopTimer() {
        isRunning = false;
        setSettingsButtonState(false);
        startBtn.querySelector(".btn-text").textContent = "Start";
        clearInterval(timer);
        timer = null;
    }

    function resetTimer() {
        playSound("timer_sound_down.wav");
        stopTimer();
        pomodoroCount = 0;
        sessionNumber = 1;
        sessionCountEl.textContent = String(sessionNumber);
        setMode(currentMode);
    }

    function handleCycleComplete() {
        stopTimer();

        if (currentMode === "pomodoro") {
            playSound("timer_sound_down.wav");

            pomodoroCount++;
            sessionCountEl.textContent = String(sessionNumber);

            if (pomodoroCount % LONG_BREAK_EVERY === 0) {
                setMode("long-break");
            } else {
                setMode("short-break");
            }

            startTimer();
        } else {
            // After any break, go back to work and auto-start
            if (currentMode === "long-break") {
                sessionNumber = 1;
                pomodoroCount = 0;
                sessionCountEl.textContent = String(sessionNumber);
            } else {
                sessionNumber++;
                sessionCountEl.textContent = String(sessionNumber);
            }

            setMode("pomodoro");
            startTimer();
        }
    }

    const worker = new Worker('js/timerWorker.js');

    worker.onmessage = function(e) {
        const { remainingSeconds, action } = e.data;
        if (remainingSeconds !== undefined) {
            updateDisplay(remainingSeconds);
        }
        if (action === 'complete') {
            // Handle timer completion
            handleCycleComplete();
        }
    };

    startBtn.addEventListener("click", () => {
        const seconds = 25 * 60; // Example for Pomodoro
        worker.postMessage({ action: 'start', seconds });
    });

    resetBtn.addEventListener("click", () => {
        worker.postMessage({ action: 'stop' });
        resetTimer();
    });

    document.addEventListener("settings:updated", (e) => {
        settings = e.detail;
        setMode(currentMode);
    });

    setMode("pomodoro");
    sessionCountEl.textContent = String(sessionNumber);
    setSettingsButtonState(false);
});