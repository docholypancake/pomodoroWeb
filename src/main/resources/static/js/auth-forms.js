document.addEventListener("DOMContentLoaded", () => {
    const authStore = window.PomodoroAuth;
    const forms = document.querySelectorAll("[data-auth-form]");
    const currentAuthState = authStore ? authStore.loadAuthState() : null;

    if (!forms.length) return;

    function setFieldError(input, message) {
        const errorEl = document.querySelector(`[data-error-for="${input.id}"]`);
        input.classList.add("settings-input--invalid");
        input.setAttribute("aria-invalid", "true");

        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.remove("hidden");
        }
    }

    function clearFieldError(input) {
        const errorEl = document.querySelector(`[data-error-for="${input.id}"]`);
        input.classList.remove("settings-input--invalid");
        input.removeAttribute("aria-invalid");

        if (errorEl) {
            errorEl.textContent = "";
            errorEl.classList.add("hidden");
        }
    }

    function setFormMessage(form, message, tone = "info") {
        const messageEl = form.querySelector("[data-form-message]");
        if (!messageEl) return;

        messageEl.textContent = message;
        messageEl.classList.remove("hidden", "form-message--success", "form-message--error");

        if (tone === "success") {
            messageEl.classList.add("form-message--success");
            return;
        }

        if (tone === "error") {
            messageEl.classList.add("form-message--error");
        }
    }

    function clearFormMessage(form) {
        const messageEl = form.querySelector("[data-form-message]");
        if (!messageEl) return;

        messageEl.textContent = "";
        messageEl.classList.add("hidden");
        messageEl.classList.remove("form-message--success", "form-message--error");
    }

    function validateLoginForm(form) {
        const identifier = form.querySelector("#loginIdentifier");
        const password = form.querySelector("#loginPassword");
        let isValid = true;

        if (!identifier.value.trim() || identifier.value.trim().length < 3) {
            setFieldError(identifier, "Enter an email or username with at least 3 characters.");
            isValid = false;
        }

        if (!password.value || password.value.length < 8) {
            setFieldError(password, "Enter a password with at least 8 characters.");
            isValid = false;
        }

        return isValid;
    }

    function validateProfileForm(form) {
        const profileName = form.querySelector("#profileName");
        const value = profileName.value.trim();

        if (value.length < 2 || value.length > 40) {
            setFieldError(profileName, "Display name must be between 2 and 40 characters.");
            return false;
        }

        return true;
    }

    function validatePasswordForm(form) {
        const currentPassword = form.querySelector("#currentPassword");
        const newPassword = form.querySelector("#newPassword");
        const confirmPassword = form.querySelector("#confirmPassword");
        let isValid = true;

        if (!currentPassword.value) {
            setFieldError(currentPassword, "Enter your current password.");
            isValid = false;
        }

        if (!newPassword.value || newPassword.value.length < 8) {
            setFieldError(newPassword, "New password must be at least 8 characters long.");
            isValid = false;
        }

        if (newPassword.value && currentPassword.value && newPassword.value === currentPassword.value) {
            setFieldError(newPassword, "New password must be different from the current password.");
            isValid = false;
        }

        if (!confirmPassword.value || confirmPassword.value !== newPassword.value) {
            setFieldError(confirmPassword, "Password confirmation must match the new password.");
            isValid = false;
        }

        return isValid;
    }

    function validateForm(form) {
        clearFormMessage(form);
        form.querySelectorAll(".auth-input").forEach(clearFieldError);

        const formType = form.dataset.authForm;
        if (formType === "login") {
            return validateLoginForm(form);
        }

        if (formType === "profile") {
            return validateProfileForm(form);
        }

        if (formType === "password") {
            return validatePasswordForm(form);
        }

        return true;
    }

    forms.forEach((form) => {
        if (form.dataset.authForm === "profile" && currentAuthState?.isAuthenticated) {
            const profileName = form.querySelector("#profileName");
            if (profileName) {
                profileName.value = currentAuthState.displayName;
            }
        }

        form.querySelectorAll(".auth-input").forEach((input) => {
            input.addEventListener("input", () => {
                clearFieldError(input);
                clearFormMessage(form);
            });
        });

        form.addEventListener("submit", (event) => {
            event.preventDefault();

            if (!validateForm(form)) {
                setFormMessage(form, "Please fix the highlighted fields before continuing.", "error");
                return;
            }

            if (form.dataset.authForm === "login") {
                const identifier = form.querySelector("#loginIdentifier").value.trim();
                const nextAuthState = authStore.saveAuthState({
                    isAuthenticated: true,
                    identifier,
                    displayName: authStore.getDefaultDisplayName(identifier)
                });

                setFormMessage(form, `Logged in as ${nextAuthState.displayName}. Redirecting to profile...`, "success");
                window.setTimeout(() => {
                    window.location.assign("/user");
                }, 250);
                return;
            }

            if (form.dataset.authForm === "profile") {
                const profileName = form.querySelector("#profileName").value.trim();
                const updatedAuthState = authStore.saveAuthState({
                    ...authStore.loadAuthState(),
                    displayName: profileName
                });

                setFormMessage(form, `Display name updated to ${updatedAuthState.displayName}.`, "success");
                return;
            }

            if (form.dataset.authForm === "password") {
                form.reset();
                setFormMessage(form, "Password change request is validated and ready for backend integration.", "success");
            }
        });
    });
});
