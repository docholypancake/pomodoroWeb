(function () {
    const AUTH_KEY = "pomodoroAuthState";

    function normalizeAuthState(state = {}) {
        const identifier = typeof state.identifier === "string" ? state.identifier.trim() : "";
        const displayName = typeof state.displayName === "string" ? state.displayName.trim() : "";
        const isAuthenticated = Boolean(state.isAuthenticated && identifier);

        return {
            isAuthenticated,
            identifier,
            displayName: displayName || identifier
        };
    }

    function getDefaultDisplayName(identifier) {
        if (!identifier) return "User";
        const localPart = identifier.split("@")[0];
        return (localPart || identifier).trim();
    }

    function loadAuthState() {
        const saved = localStorage.getItem(AUTH_KEY);
        if (!saved) {
            return normalizeAuthState();
        }

        try {
            return normalizeAuthState(JSON.parse(saved));
        } catch (error) {
            console.warn("Failed to parse auth state.", error);
            return normalizeAuthState();
        }
    }

    function saveAuthState(state) {
        const normalized = normalizeAuthState(state);
        localStorage.setItem(AUTH_KEY, JSON.stringify(normalized));
        document.dispatchEvent(new CustomEvent("auth:state-updated", { detail: normalized }));
        return normalized;
    }

    function clearAuthState() {
        localStorage.removeItem(AUTH_KEY);
        const cleared = normalizeAuthState();
        document.dispatchEvent(new CustomEvent("auth:state-updated", { detail: cleared }));
        return cleared;
    }

    function getAccountTargetPath(authState) {
        return authState.isAuthenticated ? "/user" : "/login";
    }

    function updateHeaderAuthUI(authState) {
        const profileEntry = document.getElementById("profileEntry");
        const profileEntryLabel = document.getElementById("profileEntryLabel");
        const logoutBtn = document.getElementById("logoutBtn");

        if (profileEntry) {
            profileEntry.href = getAccountTargetPath(authState);
            profileEntry.dataset.authenticated = authState.isAuthenticated ? "true" : "false";
        }

        if (profileEntryLabel) {
            profileEntryLabel.textContent = authState.isAuthenticated ? authState.displayName : "Login";
        }

        if (logoutBtn) {
            logoutBtn.classList.toggle("hidden", !authState.isAuthenticated);
        }
    }

    function handleProtectedRoutes(authState) {
        const path = window.location.pathname;

        if (path === "/user" && !authState.isAuthenticated) {
            window.location.replace("/login");
            return;
        }

        if (path === "/login" && authState.isAuthenticated) {
            const profileName = document.getElementById("profileName");
            if (profileName) {
                profileName.value = authState.displayName;
            }
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        let authState = loadAuthState();
        const logoutBtn = document.getElementById("logoutBtn");

        updateHeaderAuthUI(authState);
        handleProtectedRoutes(authState);

        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                authState = clearAuthState();
                updateHeaderAuthUI(authState);

                if (window.location.pathname === "/user") {
                    window.location.replace("/login");
                    return;
                }

                window.location.reload();
            });
        }

        document.addEventListener("auth:state-updated", (event) => {
            authState = normalizeAuthState(event.detail);
            updateHeaderAuthUI(authState);
        });

        window.addEventListener("storage", (event) => {
            if (event.key !== AUTH_KEY) return;
            authState = loadAuthState();
            updateHeaderAuthUI(authState);
            handleProtectedRoutes(authState);
        });
    });

    window.PomodoroAuth = {
        key: AUTH_KEY,
        loadAuthState,
        saveAuthState,
        clearAuthState,
        normalizeAuthState,
        getDefaultDisplayName,
        getAccountTargetPath
    };
})();
