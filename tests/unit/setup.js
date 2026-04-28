function createMemoryStorage() {
    const store = new Map();

    return {
        get length() {
            return store.size;
        },
        clear() {
            store.clear();
        },
        getItem(key) {
            return store.has(key) ? store.get(key) : null;
        },
        key(index) {
            return Array.from(store.keys())[index] ?? null;
        },
        removeItem(key) {
            store.delete(String(key));
        },
        setItem(key, value) {
            store.set(String(key), String(value));
        }
    };
}

const storage = createMemoryStorage();
globalThis.localStorage = storage;

if (globalThis.window) {
    globalThis.window.localStorage = storage;
}
