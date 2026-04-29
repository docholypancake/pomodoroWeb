import posthog from "../../node_modules/posthog-js/dist/module.no-external.js";

const env = typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env
    : {};

const POSTHOG_API_KEY = env.VITE_POSTHOG_API_KEY?.trim() || "";
const POSTHOG_API_HOST = env.VITE_POSTHOG_API_HOST?.trim() || "https://eu.posthog.com";
const URGENT_FILTER_FLAG = env.VITE_POSTHOG_URGENT_FILTER_FLAG?.trim() || "show-urgent-filter";

const isConfigured = POSTHOG_API_KEY.length > 0;

function getTaskAgeInSeconds(task) {
    const createdAt = new Date(task?.createdAt || "");
    const updatedAt = new Date(task?.updatedAt || "");

    if (Number.isNaN(createdAt.getTime()) || Number.isNaN(updatedAt.getTime())) {
        return null;
    }

    return Math.max(0, Math.round((updatedAt.getTime() - createdAt.getTime()) / 1000));
}

function getTaskPriority(task) {
    return task?.priority === "urgent" ? "urgent" : "normal";
}

function capture(eventName, properties = {}) {
    if (!isConfigured) return;
    posthog.capture(eventName, properties);
}

if (typeof window !== "undefined" && isConfigured) {
    posthog.init(POSTHOG_API_KEY, {
        api_host: POSTHOG_API_HOST,
        person_profiles: "identified_only",
        capture_pageview: true,
        autocapture: true
    });
}

const api = {
    isConfigured,
    flags: {
        urgentFilter: URGENT_FILTER_FLAG
    },
    capture,
    captureProductivityPageViewed() {
        capture("productivity_page_viewed", {
            page: window.location.pathname || "/productivity"
        });
    },
    captureTaskCreated(task) {
        capture("task_created", {
            priority: getTaskPriority(task),
            text_length: task?.text?.length || 0,
            is_authenticated: false
        });
    },
    captureTaskCompleted(task) {
        capture("task_completed", {
            priority: getTaskPriority(task),
            time_to_complete_seconds: getTaskAgeInSeconds(task)
        });
    },
    captureTaskDeleted(task, reason) {
        capture("task_deleted", {
            priority: getTaskPriority(task),
            was_completed: Boolean(task?.completed),
            reason: reason || "manual_delete"
        });
    },
    captureTaskCreationValidationFailed(properties = {}) {
        capture("task_creation_validation_failed", properties);
    },
    captureUrgentFilterToggled(isEnabled, visibleTaskCount, totalTaskCount) {
        capture("urgent_filter_toggled", {
            enabled: Boolean(isEnabled),
            visible_task_count: visibleTaskCount,
            total_task_count: totalTaskCount
        });
    },
    onFeatureFlagsReady(callback) {
        if (typeof callback !== "function") return;

        if (!isConfigured) {
            queueMicrotask(() => callback(false));
            return;
        }

        posthog.onFeatureFlags(() => callback(true));
    },
    isFeatureEnabled(flagKey) {
        if (!isConfigured) return false;
        return Boolean(posthog.isFeatureEnabled(flagKey));
    }
};

if (typeof window !== "undefined") {
    window.PomodoroAnalytics = api;
}

export default api;
