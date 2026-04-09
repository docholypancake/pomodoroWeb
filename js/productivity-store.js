(function (globalScope) {
    const STORAGE_KEY = "pomodoroProductivity.v1";
    const ITEM_LIMITS = {
        todo: 160,
        notes: 1200
    };

    function createId() {
        if (globalScope?.crypto?.randomUUID) {
            return globalScope.crypto.randomUUID();
        }

        return `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function isValidTimestamp(value) {
        if (typeof value !== "string") return false;
        return !Number.isNaN(new Date(value).getTime());
    }

    function getIsoNow(nowProvider = () => new Date()) {
        const value = nowProvider();
        return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
    }

    function emptyState() {
        return {
            todo: [],
            notes: []
        };
    }

    function sanitizeTextValue(value, maxLength) {
        if (typeof value !== "string") return null;

        const trimmedValue = value.trim();
        if (!trimmedValue) return null;

        return trimmedValue.slice(0, maxLength);
    }

    function normalizeTodoItem(item, fallbackTimestamp) {
        const text = sanitizeTextValue(item?.text, ITEM_LIMITS.todo);
        if (!item || typeof item.id !== "string" || !text) {
            return null;
        }

        return {
            id: item.id,
            text,
            completed: Boolean(item.completed),
            createdAt: isValidTimestamp(item.createdAt) ? item.createdAt : fallbackTimestamp,
            updatedAt: isValidTimestamp(item.updatedAt) ? item.updatedAt : fallbackTimestamp
        };
    }

    function normalizeNoteItem(item, fallbackTimestamp) {
        const content = sanitizeTextValue(item?.content, ITEM_LIMITS.notes);
        if (!item || typeof item.id !== "string" || !content) {
            return null;
        }

        return {
            id: item.id,
            content,
            createdAt: isValidTimestamp(item.createdAt) ? item.createdAt : fallbackTimestamp,
            updatedAt: isValidTimestamp(item.updatedAt) ? item.updatedAt : fallbackTimestamp
        };
    }

    function sanitizeCreatePayload(type, payload) {
        if (type === "todo") {
            const text = sanitizeTextValue(payload?.text, ITEM_LIMITS.todo);
            if (!text) return null;

            return {
                text,
                completed: Boolean(payload?.completed)
            };
        }

        if (type === "notes") {
            const content = sanitizeTextValue(payload?.content, ITEM_LIMITS.notes);
            if (!content) return null;

            return { content };
        }

        return null;
    }

    function sanitizeUpdateChanges(type, changes) {
        if (!changes || typeof changes !== "object") return null;

        if (type === "todo") {
            const nextChanges = {};

            if (Object.prototype.hasOwnProperty.call(changes, "text")) {
                const text = sanitizeTextValue(changes.text, ITEM_LIMITS.todo);
                if (!text) return null;
                nextChanges.text = text;
            }

            if (Object.prototype.hasOwnProperty.call(changes, "completed")) {
                nextChanges.completed = Boolean(changes.completed);
            }

            return Object.keys(nextChanges).length ? nextChanges : null;
        }

        if (type === "notes") {
            if (!Object.prototype.hasOwnProperty.call(changes, "content")) {
                return null;
            }

            const content = sanitizeTextValue(changes.content, ITEM_LIMITS.notes);
            if (!content) return null;

            return { content };
        }

        return null;
    }

    function normalizeProductivityState(rawState, nowProvider = () => new Date()) {
        const fallbackTimestamp = getIsoNow(nowProvider);
        const safeState = emptyState();

        safeState.todo = Array.isArray(rawState?.todo)
            ? rawState.todo
                .map(item => normalizeTodoItem(item, fallbackTimestamp))
                .filter(Boolean)
            : [];

        safeState.notes = Array.isArray(rawState?.notes)
            ? rawState.notes
                .map(item => normalizeNoteItem(item, fallbackTimestamp))
                .filter(Boolean)
            : [];

        return safeState;
    }

    function createProductivityStore(storage = globalScope?.localStorage, options = {}) {
        const key = options.key || STORAGE_KEY;
        const nowProvider = options.nowProvider || (() => new Date());
        const idFactory = options.idFactory || createId;

        return {
            key,
            emptyState,
            normalize(rawState) {
                return normalizeProductivityState(rawState, nowProvider);
            },
            load() {
                try {
                    const storedValue = storage?.getItem(key);
                    if (!storedValue) {
                        return emptyState();
                    }

                    return normalizeProductivityState(JSON.parse(storedValue), nowProvider);
                } catch (error) {
                    return emptyState();
                }
            },
            save(nextState) {
                const normalizedState = normalizeProductivityState(nextState, nowProvider);
                storage?.setItem(key, JSON.stringify(normalizedState));
                return normalizedState;
            },
            create(type, payload) {
                const state = this.load();
                const sanitizedPayload = sanitizeCreatePayload(type, payload);
                if (!sanitizedPayload || !Array.isArray(state[type])) {
                    return state[type] || [];
                }

                const now = getIsoNow(nowProvider);
                const nextItem = {
                    id: idFactory(),
                    createdAt: now,
                    updatedAt: now,
                    ...sanitizedPayload
                };

                state[type] = [nextItem, ...state[type]];
                return this.save(state)[type];
            },
            update(type, itemId, changes) {
                const state = this.load();
                const sanitizedChanges = sanitizeUpdateChanges(type, changes);
                if (!sanitizedChanges || !Array.isArray(state[type])) {
                    return state[type] || [];
                }

                state[type] = state[type].map(item => {
                    if (item.id !== itemId) return item;

                    return {
                        ...item,
                        ...sanitizedChanges,
                        updatedAt: getIsoNow(nowProvider)
                    };
                });

                return this.save(state)[type];
            },
            delete(type, itemId) {
                const state = this.load();
                state[type] = state[type].filter(item => item.id !== itemId);
                return this.save(state)[type];
            }
        };
    }

    const api = {
        STORAGE_KEY,
        ITEM_LIMITS,
        createId,
        isValidTimestamp,
        emptyState,
        sanitizeTextValue,
        normalizeProductivityState,
        createProductivityStore
    };

    if (globalScope) {
        globalScope.PomodoroProductivityStore = api;
    }

    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    }
})(typeof window !== "undefined" ? window : globalThis);
