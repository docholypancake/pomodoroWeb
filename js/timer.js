document.addEventListener("DOMContentLoaded", () => {
    const timeDisplay = document.getElementById("timeDisplay");
    const startBtn = document.getElementById("startBtn");
    const resetBtn = document.getElementById("resetBtn");
    const sessionCountEl = document.getElementById("sessionCount");
    const timerLabel = document.querySelector(".timer-label");
    const progressBar = document.querySelector(".timer-progress-bar");
    const modeLabels = document.querySelectorAll(".mode-label");
    const settingsToggle = document.getElementById("settingsToggle");

    if (!timeDisplay || !startBtn || !resetBtn || !timerLabel || !progressBar) return;

    const SETTINGS_KEY = "pomodoroSettings";
    const LONG_BREAK_EVERY = 4;

    // --- Web Worker Initialization ---
    // We use a Web Worker to ensure the timer runs reliably in the background
    let timerWorker = null;
    try {
        timerWorker = new Worker('js/worker.js');
    } catch (e) {
        console.warn("Web Workers require a server context (e.g., Live Server) to function.");
    }
    // ---------------------------------

    let isRunning = false;
    let currentMode = "pomodoro";
    
    // Logic for precise timing using Date.now() to prevent drift
    let endTime = null;
    let remainingSeconds = 25 * 60;
    
    let pomodoroCount = 0;
    let sessionNumber = 1;

    let settings = loadSettingsFromStorage();

    const labelText = {
        pomodoro: "Focus Time",
        "short-break": "Short Break",
        "long-break": "Long Break"
    };

    // --- Worker Signal Handling ---
    if (timerWorker) {
        timerWorker.onmessage = function(e) {
            if (e.data === 'tick') {
                onTimerTick();
            }
        };
    }

    // Core function called every second (on tick)
    function onTimerTick() {
        if (!isRunning) return;

        const now = Date.now();
        // Calculate remaining time by comparing current time with the target end time
        const secondsLeft = Math.round((endTime - now) / 1000);
        
        remainingSeconds = secondsLeft;

        if (secondsLeft >= 0) {
            updateDisplay();
        } else {
            handleCycleComplete();
        }
    }
    // -----------------------------

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

        modeLabels.forEach(label => {
            label.classList.toggle("mode-label--active", label.dataset.mode === mode);
        });

        timerLabel.textContent = labelText[mode] || "Timer";
        updateDisplay();
        resetProgress();
    }

    function updateDisplay() {
        // Guard against negative numbers
        const safeSeconds = Math.max(0, remainingSeconds);
        const minutes = Math.floor(safeSeconds / 60);
        const seconds = safeSeconds % 60;
        timeDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
        updateProgress();
    }

    function updateProgress() {
        const totalSeconds = (settings[getSettingsKey(currentMode)] || 25) * 60;
        const progress = 1 - remainingSeconds / totalSeconds;
        // Clamp progress between 0 and 1 to prevent visual glitches
        const safeProgress = Math.min(Math.max(progress, 0), 1);
        
        const circumference = 2 * Math.PI * 90;
        const offset = circumference * (1 - safeProgress);
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
        
        // Calculate the target end time
        const now = Date.now();
        endTime = now + (remainingSeconds * 1000);
        
        isRunning = true;
        setSettingsButtonState(true);
        startBtn.querySelector(".btn-text").textContent = "Pause";

        const isFreshWorkStart =
            currentMode === "pomodoro" &&
            remainingSeconds === (settings.pomodoro || 25) * 60;

        if (isFreshWorkStart) {
            playSound("timer_sound_up.wav");
        }

        // --- Start via Worker ---
        if (timerWorker) {
            timerWorker.postMessage('start');
        } else {
            // Fallback for environments without Worker support (e.g., local file system)
            window.fallbackTimer = setInterval(onTimerTick, 1000);
        }
    }

    function stopTimer() {
        isRunning = false;
        setSettingsButtonState(false);
        startBtn.querySelector(".btn-text").textContent = "Start";
        
        // --- Stop via Worker ---
        if (timerWorker) {
            timerWorker.postMessage('stop');
        } else if (window.fallbackTimer) {
            clearInterval(window.fallbackTimer);
        }
    }

    function resetTimer() {
        playSound("timer_sound_down.wav");
        stopTimer();
        pomodoroCount = 0;
        sessionNumber = 1;
        sessionCountEl.textContent = String(sessionNumber);
        setMode(currentMode); // Resets remainingSeconds based on the current mode settings
    }

    function handleCycleComplete() {
        stopTimer();
        remainingSeconds = 0;
        updateDisplay();

        if (currentMode === "pomodoro") {
            playSound("timer_sound_down.wav");

            pomodoroCount++;
            sessionCountEl.textContent = String(sessionNumber);

            // Determine if it's a long break or short break
            if (pomodoroCount % LONG_BREAK_EVERY === 0) {
                setMode("long-break");
            } else {
                setMode("short-break");
            }
            startTimer();
        } else {
            // Logic for switching back to work after a break
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

    startBtn.addEventListener("click", () => {
        if (isRunning) stopTimer();
        else startTimer();
    });

    resetBtn.addEventListener("click", resetTimer);

    document.addEventListener("settings:updated", (e) => {
        settings = e.detail;
        if (!isRunning) {
             setMode(currentMode);
        }
    });
    
    // Initial Setup
    setMode("pomodoro");
    sessionCountEl.textContent = String(sessionNumber);
    setSettingsButtonState(false);
});