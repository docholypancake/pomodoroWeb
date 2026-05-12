const analyticsApi = window.PomodoroAnalytics;
const observabilityDemoSection = document.getElementById("observabilityDemoSection");

function setObservabilityDemoVisibility(isVisible) {
    if (!observabilityDemoSection) return;

    observabilityDemoSection.classList.toggle("hidden", !isVisible);
    observabilityDemoSection.setAttribute("aria-hidden", isVisible ? "false" : "true");
}

setObservabilityDemoVisibility(false);

if (analyticsApi && observabilityDemoSection) {
    analyticsApi.onFeatureFlagsReady(() => {
        const isEnabled = analyticsApi.isFeatureEnabled(analyticsApi.flags.observabilityDemo);
        setObservabilityDemoVisibility(isEnabled);
    });
}
