document.addEventListener("DOMContentLoaded", () => {
    const timerStateStore = window.PomodoroTimerState;
    const soundManager = window.PomodoroSoundManager;
    const timeDisplay = document.getElementById("timeDisplay");
    const startBtn = document.getElementById("startBtn");
    const resetBtn = document.getElementById("resetBtn");
    const sessionCountEl = document.getElementById("sessionCount");
    const sessionTotalEl = document.getElementById("sessionTotal");
    const sessionProjectionTextEl = document.getElementById("sessionProjectionText");
    const timerLabel = document.querySelector(".timer-label");
    const timerDisplay = document.querySelector(".timer-display");
    const progressBar = document.querySelector(".timer-progress-bar");
    const modeLabels = document.querySelectorAll(".mode-label");
    const settingsToggle = document.getElementById("settingsToggle");

    if (!timerStateStore || !timeDisplay || !startBtn || !resetBtn || !timerLabel || !progressBar) return;

    const labelText = {
        pomodoro: "Focus Time",
        "short-break": "Short Break",
        "long-break": "Long Break"
    };
    const sessionTimeFormatter = new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit"
    });

    let timerWorker = null;
    try {
        timerWorker = new Worker("js/worker.js");
    } catch (error) {
        console.warn("Web Workers require a server context (e.g., Live Server) to function.");
    }

    let settings = timerStateStore.loadSettings();
    let timerState = timerStateStore.loadTimerState(settings);

    function persistTimerState() {
        timerState = timerStateStore.saveTimerState(timerState, settings);
        document.dispatchEvent(new CustomEvent("timer:state-updated", {
            detail: {
                state: timerState,
                settings
            }
        }));
    }

    function playSound(fileName) {
        soundManager?.play(fileName, settings.soundEnabled);
    }

    function setWorkerState(shouldRun) {
        if (timerWorker) {
            timerWorker.postMessage(shouldRun ? "start" : "stop");
            return;
        }

        if (shouldRun) {
            if (!window.fallbackTimer) {
                window.fallbackTimer = setInterval(onTimerTick, 1000);
            }
            return;
        }

        if (window.fallbackTimer) {
            clearInterval(window.fallbackTimer);
            window.fallbackTimer = null;
        }
    }

    function setSettingsButtonState(running) {
        if (!settingsToggle) return;
        settingsToggle.disabled = running;
        settingsToggle.setAttribute("aria-disabled", running ? "true" : "false");
    }

    function updateProgress() {
        const totalSeconds = timerStateStore.getModeDurationSeconds(settings, timerState.currentMode);
        const remainingSeconds = timerStateStore.getRemainingSeconds(timerState);
        const progress = 1 - (remainingSeconds / totalSeconds);
        const safeProgress = Math.min(Math.max(progress, 0), 1);

        const circumference = 2 * Math.PI * 90;
        const offset = circumference * (1 - safeProgress);
        progressBar.style.strokeDasharray = `${circumference}`;
        progressBar.style.strokeDashoffset = `${offset}`;
    }

    function renderProjectionText() {
        if (!sessionProjectionTextEl) return;

        const remainingSeconds = timerStateStore.getRemainingSeconds(timerState);
        const isIdleFreshStart = !timerState.isRunning
            && timerState.currentMode === "pomodoro"
            && timerState.completedPomodorosInCycle === 0
            && remainingSeconds === timerStateStore.getModeDurationSeconds(settings, "pomodoro");

        if (isIdleFreshStart) {
            sessionProjectionTextEl.textContent = "Cycle ends at --:--";
            return;
        }

        const projectedCycleEndTime = timerStateStore.getProjectedCycleEndTime(timerState, settings);
        if (!projectedCycleEndTime) {
            sessionProjectionTextEl.textContent = "Cycle ends at --:--";
            return;
        }

        sessionProjectionTextEl.textContent = `Cycle ends at ${sessionTimeFormatter.format(new Date(projectedCycleEndTime))}`;
    }

    function render() {
        const remainingSeconds = timerStateStore.getRemainingSeconds(timerState);
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;

        timeDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
        timerLabel.textContent = labelText[timerState.currentMode] || "Timer";
        startBtn.querySelector(".btn-text").textContent = timerState.isRunning ? "Pause" : "Start";
        sessionCountEl.textContent = String(timerStateStore.getCurrentPomodoroNumber(timerState));
        if (sessionTotalEl) {
            sessionTotalEl.textContent = String(timerStateStore.getPomodorosPerCycle());
        }

        modeLabels.forEach(label => {
            label.classList.toggle("mode-label--active", label.dataset.mode === timerState.currentMode);
        });

        if (timerDisplay) {
            timerDisplay.classList.toggle("active", timerState.isRunning);
        }

        renderProjectionText();
        setSettingsButtonState(timerState.isRunning);
        updateProgress();
        setWorkerState(timerState.isRunning);
    }

    function syncTimerState(now = Date.now(), shouldPlaySounds = true) {
        const previousState = timerState;
        const nextState = timerStateStore.hydrateTimerState(timerState, settings, now);
        const stateChanged = !timerStateStore.areStatesEqual(previousState, nextState);

        timerState = nextState;

        if (stateChanged && shouldPlaySounds) {
            if (previousState.currentMode === "pomodoro" && nextState.currentMode !== "pomodoro") {
                playSound("timer_sound_down.wav");
            } else if (previousState.currentMode !== "pomodoro" && nextState.currentMode === "pomodoro") {
                playSound("timer_sound_up.wav");
            }
        }

        if (stateChanged) {
            persistTimerState();
        }

        render();
    }

    function onTimerTick() {
        if (!timerState.isRunning) return;
        syncTimerState(Date.now(), true);
    }

    if (timerWorker) {
        timerWorker.onmessage = (event) => {
            if (event.data === "tick") {
                onTimerTick();
            }
        };
    }

    startBtn.addEventListener("click", () => {
        const now = Date.now();

        if (timerState.isRunning) {
            timerState = timerStateStore.pauseTimerState(timerState, settings, now);
        } else {
            const isFreshWorkStart = timerState.currentMode === "pomodoro"
                && timerState.completedPomodorosInCycle === 0
                && timerStateStore.getRemainingSeconds(timerState, now)
                === timerStateStore.getModeDurationSeconds(settings, "pomodoro");

            timerState = timerStateStore.startTimerState(timerState, settings, now);

            if (isFreshWorkStart) {
                playSound("timer_sound_up.wav");
            }
        }

        persistTimerState();
        render();
    });

    resetBtn.addEventListener("click", () => {
        playSound("timer_sound_down.wav");
        timerState = timerStateStore.resetTimerState(timerState, settings);
        persistTimerState();
        render();
    });

    document.addEventListener("settings:updated", (event) => {
        settings = event.detail;
        timerState = timerStateStore.applySettingsToTimerState(timerState, settings);
        persistTimerState();
        render();
    });

    window.addEventListener("storage", (event) => {
        if (event.key === timerStateStore.keys.SETTINGS_KEY) {
            settings = timerStateStore.loadSettings();
        }

        if (event.key === timerStateStore.keys.TIMER_STATE_KEY || event.key === timerStateStore.keys.SETTINGS_KEY) {
            timerState = timerStateStore.loadTimerState(settings);
            render();
        }
    });

    persistTimerState();
    syncTimerState(Date.now(), false);
});
