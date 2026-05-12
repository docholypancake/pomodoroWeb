document.addEventListener("DOMContentLoaded", () => {
    const DEFAULT_TAB = "todo";
    const ITEM_TYPES = ["todo", "notes"];
    const DEFAULT_TODO_PRIORITY = "normal";
    const URGENT_TODO_PRIORITY = "urgent";
    const productivityStoreApi = window.PomodoroProductivityStore;
    const analyticsApi = window.PomodoroAnalytics;
    const itemLabels = {
        todo: "task",
        notes: "note"
    };
    const inputIds = {
        todo: "todoInput",
        notes: "noteInput"
    };
    const inputNames = {
        todo: "text",
        notes: "content"
    };
    const dateFormatter = new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

    const tabButtons = Array.from(document.querySelectorAll("[data-tab-trigger]"));
    const panels = Array.from(document.querySelectorAll("[data-tab-panel]"));
    const forms = Object.fromEntries(
        ITEM_TYPES.map(type => [type, document.querySelector(`[data-entry-form="${type}"]`)])
    );
    const lists = Object.fromEntries(
        ITEM_TYPES.map(type => [type, document.querySelector(`[data-item-list="${type}"]`)])
    );
    const emptyStates = Object.fromEntries(
        ITEM_TYPES.map(type => [type, document.querySelector(`[data-empty-state="${type}"]`)])
    );
    const formMessages = Object.fromEntries(
        ITEM_TYPES.map(type => [type, document.querySelector(`[data-form-message="${type}"]`)])
    );
    const urgentFilterToolbar = document.getElementById("urgentFilterToolbar");
    const urgentFilterBtn = document.getElementById("urgentFilterBtn");

    if (!tabButtons.length || !panels.length) return;

    if (!productivityStoreApi) return;

    const storageAdapter = productivityStoreApi.createProductivityStore(window.localStorage);

    const state = {
        activeTab: DEFAULT_TAB,
        items: storageAdapter.load(),
        editingByType: {
            todo: null,
            notes: null
        },
        urgentFilterAvailable: false,
        urgentFilterActive: false
    };

    function escapeHtml(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll("\"", "&quot;")
            .replaceAll("'", "&#39;");
    }

    function formatTimestamp(value) {
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return dateFormatter.format(date);
    }

    function syncStateFromStorage() {
        state.items = storageAdapter.load();
    }

    function isUrgentTodo(item) {
        return item?.priority === URGENT_TODO_PRIORITY;
    }

    function getTodoById(itemId) {
        return state.items.todo.find(item => item.id === itemId) || null;
    }

    function getVisibleItems(type) {
        const items = state.items[type];
        if (type !== "todo" || !state.urgentFilterAvailable || !state.urgentFilterActive) {
            return items;
        }

        return items.filter(isUrgentTodo);
    }

    function clearFormMessage(type) {
        const messageElement = formMessages[type];
        if (!messageElement) return;

        messageElement.textContent = "";
        messageElement.classList.add("hidden");
        messageElement.classList.remove("form-message--error", "form-message--success");
    }

    function showFormMessage(type, message, isError = true) {
        const messageElement = formMessages[type];
        if (!messageElement) return;

        messageElement.textContent = message;
        messageElement.classList.remove("hidden");
        messageElement.classList.toggle("form-message--error", isError);
        messageElement.classList.toggle("form-message--success", !isError);
    }

    function focusPrimaryInput(type) {
        document.getElementById(inputIds[type])?.focus();
    }

    function setActiveTab(nextTab) {
        state.activeTab = nextTab;

        tabButtons.forEach(button => {
            const isActive = button.dataset.tabTrigger === nextTab;
            button.classList.toggle("productivity-tab--active", isActive);
            button.setAttribute("aria-selected", isActive ? "true" : "false");
            button.tabIndex = isActive ? 0 : -1;
        });

        panels.forEach(panel => {
            const isActive = panel.dataset.tabPanel === nextTab;
            panel.classList.toggle("hidden", !isActive);
            panel.setAttribute("aria-hidden", isActive ? "false" : "true");
        });

        focusPrimaryInput(nextTab);
    }

    function getTrimmedValue(type, container) {
        const fieldName = inputNames[type];
        const input = container.querySelector(`[name="${fieldName}"]`);
        if (!input) return "";

        return input.value.trim();
    }

    function markInvalid(input, shouldMark) {
        if (!input) return;

        if (shouldMark) {
            input.setAttribute("aria-invalid", "true");
            input.classList.add("settings-input--invalid");
            return;
        }

        input.removeAttribute("aria-invalid");
        input.classList.remove("settings-input--invalid");
    }

    function renderTodoItem(item) {
        const isEditing = state.editingByType.todo === item.id;
        const completedClass = item.completed ? " productivity-item__content--completed" : "";
        const urgentBadge = isUrgentTodo(item)
            ? '<span class="productivity-item__badge">Urgent</span>'
            : "";

        if (isEditing) {
            return `
                <li class="productivity-item productivity-item--editing" data-item-id="${item.id}" data-item-type="todo">
                    <div class="productivity-item__editor">
                        <input
                            class="settings-input productivity-input productivity-item__editor-input"
                            data-edit-field="todo"
                            name="text"
                            type="text"
                            maxlength="160"
                            value="${escapeHtml(item.text)}"
                        >
                    </div>
                    <div class="productivity-item__actions">
                        <button class="productivity-action productivity-action--primary" type="button" data-action="save-edit">Save</button>
                        <button class="productivity-action" type="button" data-action="cancel-edit">Cancel</button>
                    </div>
                    <p class="form-message hidden productivity-item__message" data-edit-message="todo" aria-live="polite"></p>
                </li>
            `;
        }

        return `
            <li class="productivity-item" data-item-id="${item.id}" data-item-type="todo">
                <label class="productivity-check">
                    <input
                        class="settings-checkbox productivity-check__input"
                        type="checkbox"
                        data-action="toggle-complete"
                        ${item.completed ? "checked" : ""}
                    >
                    <span class="productivity-item__body">
                        <span class="productivity-item__content${completedClass}">${escapeHtml(item.text)}</span>
                        ${urgentBadge}
                    </span>
                </label>
                <div class="productivity-item__actions">
                    <button class="productivity-action" type="button" data-action="edit">Edit</button>
                    <button class="productivity-action productivity-action--danger" type="button" data-action="delete">Delete</button>
                </div>
            </li>
        `;
    }

    function renderNoteItem(item) {
        const isEditing = state.editingByType.notes === item.id;

        if (isEditing) {
            return `
                <li class="productivity-item productivity-item--note productivity-item--editing" data-item-id="${item.id}" data-item-type="notes">
                    <div class="productivity-item__editor productivity-item__editor--note">
                        <textarea
                            class="settings-input productivity-input productivity-textarea productivity-item__editor-textarea"
                            data-edit-field="notes"
                            name="content"
                            rows="5"
                            maxlength="1200"
                        >${escapeHtml(item.content)}</textarea>
                    </div>
                    <div class="productivity-item__actions">
                        <button class="productivity-action productivity-action--primary" type="button" data-action="save-edit">Save</button>
                        <button class="productivity-action" type="button" data-action="cancel-edit">Cancel</button>
                    </div>
                    <p class="form-message hidden productivity-item__message" data-edit-message="notes" aria-live="polite"></p>
                </li>
            `;
        }

        return `
            <li class="productivity-item productivity-item--note" data-item-id="${item.id}" data-item-type="notes">
                <article class="productivity-note">
                    <p class="productivity-note__content">${escapeHtml(item.content).replaceAll("\n", "<br>")}</p>
                    <p class="productivity-note__meta">Updated ${formatTimestamp(item.updatedAt)}</p>
                </article>
                <div class="productivity-item__actions">
                    <button class="productivity-action" type="button" data-action="edit">Edit</button>
                    <button class="productivity-action productivity-action--danger" type="button" data-action="delete">Delete</button>
                </div>
            </li>
        `;
    }

    function renderType(type) {
        const list = lists[type];
        const items = getVisibleItems(type);
        if (!list) return;

        list.innerHTML = items.map(item => type === "todo" ? renderTodoItem(item) : renderNoteItem(item)).join("");

        const emptyState = emptyStates[type];
        if (emptyState) {
            emptyState.classList.toggle("hidden", items.length > 0);
        }
    }

    function renderUrgentFilter() {
        if (!urgentFilterToolbar || !urgentFilterBtn) return;

        urgentFilterToolbar.classList.toggle("hidden", !state.urgentFilterAvailable);
        urgentFilterBtn.setAttribute("aria-pressed", state.urgentFilterActive ? "true" : "false");
        urgentFilterBtn.classList.toggle("productivity-action--primary", state.urgentFilterActive);
        urgentFilterBtn.textContent = state.urgentFilterActive ? "Showing urgent only" : "Show urgent only";
    }

    function render() {
        ITEM_TYPES.forEach(type => {
            clearFormMessage(type);
            renderType(type);
        });

        renderUrgentFilter();
        setActiveTab(state.activeTab);
    }

    function handleAdd(type, form) {
        const input = form.querySelector(`[name="${inputNames[type]}"]`);
        const value = getTrimmedValue(type, form);
        const urgentCheckbox = form.querySelector('[name="isUrgent"]');
        const priority = urgentCheckbox?.checked ? URGENT_TODO_PRIORITY : DEFAULT_TODO_PRIORITY;

        markInvalid(input, false);
        clearFormMessage(type);

        if (!value) {
            markInvalid(input, true);
            showFormMessage(type, `Please enter a ${itemLabels[type]} before adding it.`);
            if (type === "todo") {
                analyticsApi?.captureTaskCreationValidationFailed({
                    priority,
                    reason: "blank_input"
                });
            }
            input?.focus();
            return;
        }

        if (type === "todo") {
            const nextItems = storageAdapter.create("todo", {
                text: value,
                completed: false,
                priority
            });
            analyticsApi?.captureTaskCreated(nextItems[0]);
        } else {
            storageAdapter.create("notes", {
                content: value
            });
        }

        syncStateFromStorage();
        form.reset();
        render();
        focusPrimaryInput(type);
    }

    function beginEditing(type, itemId) {
        state.editingByType[type] = itemId;
        renderType(type);
        const editor = lists[type]?.querySelector(`[data-item-id="${itemId}"] [data-edit-field="${type}"]`);
        editor?.focus();
        if (editor && "selectionStart" in editor) {
            editor.selectionStart = editor.value.length;
            editor.selectionEnd = editor.value.length;
        }
    }

    function stopEditing(type) {
        state.editingByType[type] = null;
        renderType(type);
    }

    function saveEdit(itemElement) {
        const type = itemElement.dataset.itemType;
        const itemId = itemElement.dataset.itemId;
        const editor = itemElement.querySelector(`[data-edit-field="${type}"]`);
        const messageElement = itemElement.querySelector(`[data-edit-message="${type}"]`);
        const nextValue = editor?.value.trim() || "";

        markInvalid(editor, false);
        if (messageElement) {
            messageElement.textContent = "";
            messageElement.classList.add("hidden");
            messageElement.classList.remove("form-message--error");
        }

        if (!type || !itemId || !editor) return;

        if (!nextValue) {
            markInvalid(editor, true);
            if (messageElement) {
                messageElement.textContent = `Please enter a ${itemLabels[type]} before saving it.`;
                messageElement.classList.remove("hidden");
                messageElement.classList.add("form-message--error");
            }
            editor.focus();
            return;
        }

        if (type === "todo") {
            storageAdapter.update("todo", itemId, { text: nextValue });
        } else {
            storageAdapter.update("notes", itemId, { content: nextValue });
        }

        syncStateFromStorage();
        state.editingByType[type] = null;
        renderType(type);
    }

    tabButtons.forEach(button => {
        button.addEventListener("click", () => {
            setActiveTab(button.dataset.tabTrigger || DEFAULT_TAB);
        });
    });

    ITEM_TYPES.forEach(type => {
        forms[type]?.addEventListener("submit", event => {
            event.preventDefault();
            handleAdd(type, event.currentTarget);
        });

        forms[type]?.addEventListener("input", event => {
            const input = event.target.closest(`[name="${inputNames[type]}"]`);
            if (!input) return;

            markInvalid(input, false);
            clearFormMessage(type);
        });

        lists[type]?.addEventListener("click", event => {
            const actionButton = event.target.closest("[data-action]");
            if (!actionButton) return;

            const itemElement = actionButton.closest("[data-item-id]");
            const itemId = itemElement?.dataset.itemId;

            if (!itemElement || !itemId) return;

            switch (actionButton.dataset.action) {
                case "edit":
                    beginEditing(type, itemId);
                    break;
                case "delete":
                    if (type === "todo") {
                        const taskToDelete = getTodoById(itemId);
                        if (taskToDelete) {
                            analyticsApi?.captureTaskDeleted(
                                taskToDelete,
                                taskToDelete.completed ? "removed_after_completion" : "manual_delete"
                            );
                        }
                    }
                    storageAdapter.delete(type, itemId);
                    syncStateFromStorage();
                    if (state.editingByType[type] === itemId) {
                        state.editingByType[type] = null;
                    }
                    render();
                    break;
                case "cancel-edit":
                    stopEditing(type);
                    break;
                case "save-edit":
                    saveEdit(itemElement);
                    break;
                default:
                    break;
            }
        });

        lists[type]?.addEventListener("change", event => {
            const checkbox = event.target.closest('[data-action="toggle-complete"]');
            const itemElement = checkbox?.closest("[data-item-id]");
            const itemId = itemElement?.dataset.itemId;

            if (!checkbox || !itemId || type !== "todo") return;

            const currentItem = getTodoById(itemId);
            storageAdapter.update("todo", itemId, {
                completed: checkbox.checked
            });
            syncStateFromStorage();
            const updatedItem = getTodoById(itemId);
            if (checkbox.checked && updatedItem && !currentItem?.completed) {
                analyticsApi?.captureTaskCompleted(updatedItem);
            }
            render();
        });

        lists[type]?.addEventListener("keydown", event => {
            const itemElement = event.target.closest("[data-item-id]");
            if (!itemElement) return;

            const itemId = itemElement.dataset.itemId;
            const isEditing = itemId && state.editingByType?.[type] === itemId;

            const keyIsTodoSave = type === "todo" && event.key === "Enter";
            const keyIsNoteSave = type === "notes" && event.key === "Enter" && (event.metaKey || event.ctrlKey);

            if (!keyIsTodoSave && !keyIsNoteSave) return;

            const editorField = event.target.closest("input, textarea");
            const editorBelongsToItem = editorField && itemElement.contains(editorField);

            if (!isEditing || !editorBelongsToItem) return;
            event.preventDefault();
            saveEdit(itemElement);
        });
    });

    window.addEventListener("storage", event => {
        if (event.key !== storageAdapter.key) return;
        syncStateFromStorage();
        render();
    });

    urgentFilterBtn?.addEventListener("click", () => {
        state.urgentFilterActive = !state.urgentFilterActive;
        render();
        analyticsApi?.captureUrgentFilterToggled(
            state.urgentFilterActive,
            getVisibleItems("todo").length,
            state.items.todo.length
        );
    });

    analyticsApi?.captureProductivityPageViewed();
    analyticsApi?.onFeatureFlagsReady(() => {
        state.urgentFilterAvailable = analyticsApi.isFeatureEnabled(analyticsApi.flags.urgentFilter);
        if (!state.urgentFilterAvailable) {
            state.urgentFilterActive = false;
        }
        render();
    });

    render();
});
