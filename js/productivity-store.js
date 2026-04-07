(function (globalScope) {
    const STORAGE_KEY = "pomodoroProductivity.v1";

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

    function normalizeProductivityState(rawState, nowProvider = () => new Date()) {
        const fallbackTimestamp = getIsoNow(nowProvider);
        const safeState = emptyState();

        safeState.todo = Array.isArray(rawState?.todo)
            ? rawState.todo
                .filter(item => item && typeof item.id === "string" && typeof item.text === "string")
                .map(item => ({
                    id: item.id,
                    text: item.text,
                    completed: Boolean(item.completed),
                    createdAt: isValidTimestamp(item.createdAt) ? item.createdAt : fallbackTimestamp,
                    updatedAt: isValidTimestamp(item.updatedAt) ? item.updatedAt : fallbackTimestamp
                }))
            : [];

        safeState.notes = Array.isArray(rawState?.notes)
            ? rawState.notes
                .filter(item => item && typeof item.id === "string" && typeof item.content === "string")
                .map(item => ({
                    id: item.id,
                    content: item.content,
                    createdAt: isValidTimestamp(item.createdAt) ? item.createdAt : fallbackTimestamp,
                    updatedAt: isValidTimestamp(item.updatedAt) ? item.updatedAt : fallbackTimestamp
                }))
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
                const now = getIsoNow(nowProvider);
                const nextItem = {
                    id: idFactory(),
                    createdAt: now,
                    updatedAt: now,
                    ...payload
                };

                state[type] = [nextItem, ...state[type]];
                return this.save(state)[type];
            },
            update(type, itemId, changes) {
                const state = this.load();
                state[type] = state[type].map(item => {
                    if (item.id !== itemId) return item;

                    return {
                        ...item,
                        ...changes,
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
        createId,
        isValidTimestamp,
        emptyState,
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
