(function (globalScope) {
    const SILENT_WAV_DATA_URI = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAA";

    function createAudioElement(src, { muted = false, loop = false } = {}) {
        const audio = new Audio(src);
        audio.preload = "auto";
        audio.muted = muted;
        audio.loop = loop;
        audio.playsInline = true;
        return audio;
    }

    function createSoundManager() {
        const primingAudio = createAudioElement(SILENT_WAV_DATA_URI, { muted: true, loop: true });
        const playbackAudio = createAudioElement(SILENT_WAV_DATA_URI, { muted: true, loop: true });
        let isPrimed = false;

        function emitSoundEvent(name, detail) {
            if (typeof globalScope.CustomEvent !== "function") return;
            globalScope.dispatchEvent(new CustomEvent(name, { detail }));
        }

        async function startPrimingLoop() {
            try {
                await primingAudio.play();
                isPrimed = true;
            } catch (error) {
                isPrimed = false;
            }
        }

        async function unlockFromGesture() {
            try {
                await primingAudio.play();
                await playbackAudio.play();
                playbackAudio.pause();
                playbackAudio.currentTime = 0;
                playbackAudio.src = SILENT_WAV_DATA_URI;
                playbackAudio.loop = true;
                playbackAudio.muted = true;
                await playbackAudio.play();
                isPrimed = true;
            } catch (error) {
                isPrimed = false;
            }
        }

        function registerUnlockListeners() {
            const unlockOnce = async () => {
                await unlockFromGesture();
                cleanup();
            };

            const cleanup = () => {
                globalScope.removeEventListener("pointerdown", unlockOnce, true);
                globalScope.removeEventListener("keydown", unlockOnce, true);
                globalScope.removeEventListener("touchstart", unlockOnce, true);
            };

            globalScope.addEventListener("pointerdown", unlockOnce, true);
            globalScope.addEventListener("keydown", unlockOnce, true);
            globalScope.addEventListener("touchstart", unlockOnce, true);
        }

        async function play(fileName, enabled = true) {
            if (!enabled) return false;

            emitSoundEvent("pomodoro:sound-requested", { fileName });

            try {
                playbackAudio.pause();
                playbackAudio.currentTime = 0;
                playbackAudio.loop = false;
                playbackAudio.muted = false;
                playbackAudio.src = `assets/sounds/${fileName}`;
                await playbackAudio.play();
                isPrimed = true;
                return true;
            } catch (error) {
                try {
                    await unlockFromGesture();
                    playbackAudio.pause();
                    playbackAudio.currentTime = 0;
                    playbackAudio.loop = false;
                    playbackAudio.muted = false;
                    playbackAudio.src = `assets/sounds/${fileName}`;
                    await playbackAudio.play();
                    isPrimed = true;
                    emitSoundEvent("pomodoro:sound-played", { fileName });
                    return true;
                } catch (retryError) {
                    emitSoundEvent("pomodoro:sound-blocked", { fileName });
                    console.warn("Sound playback was blocked on this page.", retryError);
                    return false;
                }
            } finally {
                playbackAudio.addEventListener("ended", async function restoreLoop() {
                    playbackAudio.removeEventListener("ended", restoreLoop);
                    playbackAudio.pause();
                    playbackAudio.currentTime = 0;
                    playbackAudio.src = SILENT_WAV_DATA_URI;
                    playbackAudio.loop = true;
                    playbackAudio.muted = true;
                    try {
                        await playbackAudio.play();
                    } catch (error) {
                        isPrimed = false;
                    }
                }, { once: true });
            }
        }

        startPrimingLoop();
        registerUnlockListeners();

        return {
            play,
            unlockFromGesture,
            isPrimed: () => isPrimed
        };
    }

    const manager = createSoundManager();

    if (globalScope) {
        globalScope.PomodoroSoundManager = manager;
    }

    if (typeof module !== "undefined" && module.exports) {
        module.exports = manager;
    }
})(typeof window !== "undefined" ? window : globalThis);
