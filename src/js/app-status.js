const appStatus = import.meta.env?.VITE_APP_STATUS || "Unknown";

document.querySelectorAll("[data-app-status]").forEach(element => {
    element.textContent = appStatus;
});
