const env = typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env
    : {};

const SENTRY_DSN = env.VITE_SENTRY_DSN?.trim() || "";
const SENTRY_ENVIRONMENT = env.VITE_SENTRY_ENVIRONMENT?.trim()
    || (env.PROD ? "production" : "development");
const SENTRY_TRACES_SAMPLE_RATE = Number(env.VITE_SENTRY_TRACES_SAMPLE_RATE || "1");
const SENTRY_REPLAYS_SESSION_SAMPLE_RATE = Number(env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE || "1");
const SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE = Number(env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE || "1");
const DEMO_USER_STORAGE_KEY = "pomodoroSentryDemoUser.v1";
const RELEASE = "pomodoro-weblabs@1.0.0";

const isConfigured = SENTRY_DSN.length > 0;
let sentryClient = null;
let sentryLoadPromise = null;

function parseStoredJson(key) {
    try {
        const value = window.localStorage?.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
}

function persistDemoUser(user) {
    try {
        if (!user) {
            window.localStorage?.removeItem(DEMO_USER_STORAGE_KEY);
            return;
        }

        window.localStorage?.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(user));
    } catch {
        // Ignore storage failures in demo mode.
    }
}

function getDemoUser() {
    const storedUser = parseStoredJson(DEMO_USER_STORAGE_KEY);
    if (storedUser?.id && storedUser?.email) {
        return storedUser;
    }

    return null;
}

function createDemoUser(overrides = {}) {
    const suffix = Math.random().toString(16).slice(2, 8);
    return {
        id: `demo-user-${suffix}`,
        email: `student+${suffix}@example.com`,
        segment: "premium_user",
        ...overrides
    };
}

function setStatusMessage(message, isError = false) {
    const statusElement = document.getElementById("sentryDemoStatus");
    if (!statusElement) return;

    statusElement.textContent = message;
    statusElement.classList.remove("hidden");
    statusElement.classList.toggle("form-message--error", isError);
    statusElement.classList.toggle("form-message--success", !isError);
}

function clearStatusMessage() {
    const statusElement = document.getElementById("sentryDemoStatus");
    if (!statusElement) return;

    statusElement.textContent = "";
    statusElement.classList.add("hidden");
    statusElement.classList.remove("form-message--error", "form-message--success");
}

function getCurrentPageTag() {
    const path = window.location.pathname || "";

    if (path.includes("productivity")) return "productivity";
    if (path.includes("about")) return "about";
    if (path.includes("helpus")) return "helpus";
    return "timer";
}

function withSentry(action) {
    if (!isConfigured) {
        return Promise.resolve(null);
    }

    return loadSentry().then(client => {
        if (!client) return null;
        return action(client);
    });
}

function applyUserContext(client, user) {
    client.setUser(user);
    client.setTag("user_segment", user.segment || "unknown");
}

function loadSentry() {
    if (!isConfigured) {
        return Promise.resolve(null);
    }

    if (sentryClient) {
        return Promise.resolve(sentryClient);
    }

    if (!sentryLoadPromise) {
        sentryLoadPromise = import("@sentry/browser")
            .then(Sentry => {
                Sentry.init({
                    dsn: SENTRY_DSN,
                    release: RELEASE,
                    environment: SENTRY_ENVIRONMENT,
                    integrations: [
                        Sentry.browserTracingIntegration(),
                        Sentry.replayIntegration()
                    ],
                    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
                    replaysSessionSampleRate: SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
                    replaysOnErrorSampleRate: SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE
                });

                Sentry.setTag("app_surface", getCurrentPageTag());
                Sentry.setTag("app_mode", env.VITE_APP_STATUS || SENTRY_ENVIRONMENT);

                const demoUser = getDemoUser();
                if (demoUser) {
                    applyUserContext(Sentry, demoUser);
                }

                sentryClient = Sentry;
                return Sentry;
            })
            .catch(error => {
                console.warn("Sentry failed to initialize.", error);
                return null;
            });
    }

    return sentryLoadPromise;
}

function initDemoControls() {
    document.addEventListener("DOMContentLoaded", () => {
        const breakButton = document.getElementById("breakTheWorldBtn");
        const setUserButton = document.getElementById("setSentryUserBtn");
        const clearUserButton = document.getElementById("clearSentryUserBtn");

        if (!breakButton && !setUserButton && !clearUserButton) return;

        clearStatusMessage();

        setUserButton?.addEventListener("click", () => {
            const demoUser = createDemoUser();
            persistDemoUser(demoUser);

            void withSentry(client => {
                applyUserContext(client, demoUser);
                client.addBreadcrumb({
                    category: "demo",
                    message: "Demo Sentry user context enabled",
                    level: "info"
                });
            });

            setStatusMessage(`Demo user set: ${demoUser.email}`);
        });

        clearUserButton?.addEventListener("click", () => {
            persistDemoUser(null);

            void withSentry(client => {
                client.setUser(null);
                client.addBreadcrumb({
                    category: "demo",
                    message: "Demo Sentry user context cleared",
                    level: "info"
                });
            });

            setStatusMessage("Demo user context cleared.");
        });

        breakButton?.addEventListener("click", () => {
            void withSentry(client => {
                client.addBreadcrumb({
                    category: "demo",
                    message: "Break the world button clicked",
                    level: "warning"
                });
            });

            setStatusMessage("Test error triggered. Check Sentry Issues.", true);
            setTimeout(() => {
                throw new Error("Sentry Test Error: Something went wrong!");
            }, 0);
        });
    });
}

if (typeof window !== "undefined") {
    if (isConfigured) {
        void loadSentry();
    }

    initDemoControls();
}

const api = {
    isConfigured,
    environment: SENTRY_ENVIRONMENT,
    setDemoUser(userOverrides = {}) {
        const demoUser = createDemoUser(userOverrides);
        persistDemoUser(demoUser);
        return withSentry(client => {
            applyUserContext(client, demoUser);
            return demoUser;
        });
    },
    clearUser() {
        persistDemoUser(null);
        return withSentry(client => {
            client.setUser(null);
        });
    },
    addBreadcrumb(breadcrumb) {
        return withSentry(client => {
            client.addBreadcrumb(breadcrumb);
        });
    },
    captureException(error, extra = {}) {
        return withSentry(client => {
            client.captureException(error, {
                extra
            });
        });
    }
};

if (typeof window !== "undefined") {
    window.PomodoroSentry = api;
}

export default api;
