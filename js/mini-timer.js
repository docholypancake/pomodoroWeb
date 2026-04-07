document.addEventListener("DOMContentLoaded", () => {
    const timerStateStore = window.PomodoroTimerState;
    const soundManager = window.PomodoroSoundManager;
    const miniTimer = document.getElementById("miniTimer");
    const miniTimerMode = document.getElementById("miniTimerMode");
    const miniTimerTime = document.getElementById("miniTimerTime");
    const miniTimerStatus = document.getElementById("miniTimerStatus");

    if (!timerStateStore || !miniTimer || !miniTimerMode || !miniTimerTime || !miniTimerStatus) return;

    const timerModeClasses = [
        "mini-timer--pomodoro",
        "mini-timer--short-break",
        "mini-timer--long-break"
    ];

    const labelText = {
        pomodoro: "Pomodoro",
        "short-break": "Short Break",
        "long-break": "Long Break"
    };

    let timerTick = null;
    let settings = timerStateStore.loadSettings();
    let timerState = timerStateStore.loadTimerState(settings);

    function playSound(fileName) {
        soundManager?.play(fileName, settings.soundEnabled);
    }

    function formatTime(totalSeconds) {
        const safeSeconds = Math.max(0, totalSeconds);
        const minutes = Math.floor(safeSeconds / 60);
        const seconds = safeSeconds % 60;
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    function setTicking(running) {
        if (running && !timerTick) {
            timerTick = window.setInterval(() => syncState(Date.now()), 1000);
            return;
        }

        if (!running && timerTick) {
            window.clearInterval(timerTick);
            timerTick = null;
        }
    }

    function getStatusText() {
        const remainingSeconds = timerStateStore.getRemainingSeconds(timerState);
        const fullModeSeconds = timerStateStore.getModeDurationSeconds(settings, timerState.currentMode);

        if (timerState.isRunning) {
            return "Running";
        }

        if (timerState.currentMode === "pomodoro"
            && timerState.completedPomodorosInCycle === 0
            && remainingSeconds === fullModeSeconds) {
            return "Ready";
        }

        return "Paused";
    }

    function render() {
        miniTimer.classList.remove(...timerModeClasses);
        miniTimer.classList.add(`mini-timer--${timerState.currentMode}`);
        miniTimer.dataset.running = String(timerState.isRunning);

        miniTimerMode.textContent = labelText[timerState.currentMode] || "Timer";
        miniTimerTime.textContent = formatTime(timerStateStore.getRemainingSeconds(timerState));
        miniTimerStatus.textContent = getStatusText();

        setTicking(timerState.isRunning);
    }

    function applyIncomingState(nextState, nextSettings = settings, shouldPlaySounds = true) {
        const previousState = timerState;
        settings = nextSettings;
        timerState = nextState;

        const stateChanged = !timerStateStore.areStatesEqual(previousState, nextState);

        if (stateChanged && shouldPlaySounds) {
            if (previousState.currentMode === "pomodoro" && nextState.currentMode !== "pomodoro") {
                playSound("timer_sound_down.wav");
            } else if (previousState.currentMode !== "pomodoro" && nextState.currentMode === "pomodoro") {
                playSound("timer_sound_up.wav");
            }
        }

        render();
        return stateChanged;
    }

    function syncState(now = Date.now(), shouldPlaySounds = true) {
        const nextState = timerStateStore.hydrateTimerState(timerState, settings, now);
        const stateChanged = applyIncomingState(nextState, settings, shouldPlaySounds);

        if (stateChanged) {
            timerState = timerStateStore.saveTimerState(timerState, settings);
        }
    }

    document.addEventListener("settings:updated", (event) => {
        settings = event.detail;
        const nextState = timerStateStore.applySettingsToTimerState(timerState, settings);
        applyIncomingState(nextState, settings, false);
        timerState = timerStateStore.saveTimerState(timerState, settings);
    });

    document.addEventListener("timer:state-updated", (event) => {
        applyIncomingState(event.detail.state, event.detail.settings, true);
    });

    window.addEventListener("storage", (event) => {
        let nextSettings = settings;
        if (event.key === timerStateStore.keys.SETTINGS_KEY) {
            nextSettings = timerStateStore.loadSettings();
        }

        if (event.key === timerStateStore.keys.TIMER_STATE_KEY || event.key === timerStateStore.keys.SETTINGS_KEY) {
            const nextState = timerStateStore.loadTimerState(nextSettings);
            applyIncomingState(nextState, nextSettings, true);
        }
    });

    render();
    syncState(Date.now(), false);
});
