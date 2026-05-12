import { describe, it, expect, beforeEach } from "vitest";
import productivityStoreApi from "../../src/js/productivity-store.js";

const {
    STORAGE_KEY,
    ITEM_LIMITS,
    TODO_PRIORITIES,
    isValidTimestamp,
    sanitizeTextValue,
    sanitizeTodoPriority,
    normalizeProductivityState,
    createProductivityStore
} = productivityStoreApi;

describe("productivity-store", () => {
    const fixedNow = new Date("2026-04-07T12:00:00.000Z");
    let store;

    beforeEach(() => {
        localStorage.clear();
        store = createProductivityStore(localStorage, {
            nowProvider: () => fixedNow,
            idFactory: () => "fixed-id"
        });
    });

    it("uses the expected storage key", () => {
        expect(STORAGE_KEY).toBe("pomodoroProductivity.v1");
        expect(store.key).toBe(STORAGE_KEY);
        expect(ITEM_LIMITS.todo).toBe(160);
        expect(ITEM_LIMITS.notes).toBe(1200);
        expect(TODO_PRIORITIES.URGENT).toBe("urgent");
        expect(TODO_PRIORITIES.NORMAL).toBe("normal");
    });

    it("returns a fresh empty state object each time", () => {
        const first = store.emptyState();
        const second = store.emptyState();

        expect(first).toEqual({ todo: [], notes: [] });
        expect(second).toEqual({ todo: [], notes: [] });
        expect(first).not.toBe(second);
        expect(first.todo).not.toBe(second.todo);
        expect(first.notes).not.toBe(second.notes);
    });

    it("validates timestamps safely", () => {
        expect(isValidTimestamp("2026-04-07T12:00:00.000Z")).toBe(true);
        expect(isValidTimestamp("not-a-date")).toBe(false);
        expect(isValidTimestamp(null)).toBe(false);
    });

    it("trims values, enforces maximum lengths, and rejects blank strings", () => {
        expect(sanitizeTextValue("  hello  ", ITEM_LIMITS.todo)).toBe("hello");
        expect(sanitizeTextValue("   ", ITEM_LIMITS.todo)).toBe(null);
        expect(sanitizeTextValue("x".repeat(200), ITEM_LIMITS.todo)).toHaveLength(160);
        expect(sanitizeTodoPriority("urgent")).toBe("urgent");
        expect(sanitizeTodoPriority("anything-else")).toBe("normal");
    });

    it("normalizes corrupted raw state into a safe empty/default structure", () => {
        expect(normalizeProductivityState({
            todo: [
                { id: "1", text: "keep", completed: "yes", createdAt: "bad", updatedAt: "bad" },
                { id: "2", text: "   ", completed: false },
                { text: "drop-no-id" }
            ],
            notes: [
                { id: "n1", content: "keep note", createdAt: "bad", updatedAt: "2026-04-07T10:00:00.000Z" },
                { id: "n3", content: "   " },
                { id: "n2", text: "drop-no-content" }
            ]
        }, () => fixedNow)).toEqual({
            todo: [{
                id: "1",
                text: "keep",
                completed: true,
                priority: "normal",
                createdAt: fixedNow.toISOString(),
                updatedAt: fixedNow.toISOString()
            }],
            notes: [{
                id: "n1",
                content: "keep note",
                createdAt: fixedNow.toISOString(),
                updatedAt: "2026-04-07T10:00:00.000Z"
            }]
        });
    });

    it("loads an empty state when storage is missing or malformed", () => {
        expect(store.load()).toEqual({ todo: [], notes: [] });

        localStorage.setItem(STORAGE_KEY, "{broken");
        expect(store.load()).toEqual({ todo: [], notes: [] });
    });

    it("treats non-array top-level collections as empty lists", () => {
        expect(normalizeProductivityState({
            todo: "bad",
            notes: { also: "bad" }
        }, () => fixedNow)).toEqual({
            todo: [],
            notes: []
        });
    });

    it("saves normalized state back to storage", () => {
        const saved = store.save({
            todo: [{ id: "1", text: "Task", completed: false, createdAt: "bad", updatedAt: "bad" }],
            notes: "bad"
        });

        expect(saved.todo).toHaveLength(1);
        expect(saved.notes).toEqual([]);
        expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual(saved);
    });

    it("supports a custom storage key", () => {
        const customStore = createProductivityStore(localStorage, {
            key: "custom-productivity-key",
            nowProvider: () => fixedNow,
            idFactory: () => "custom-id"
        });

        customStore.save({
            todo: [{ id: "1", text: "Task", completed: false, createdAt: fixedNow.toISOString(), updatedAt: fixedNow.toISOString() }],
            notes: []
        });

        expect(localStorage.getItem("custom-productivity-key")).toContain("Task");
    });

    it("creates todo items at the top of the list", () => {
        const result = store.create("todo", {
            text: "  Write tests  ",
            completed: false
        });

        expect(result[0]).toEqual({
            id: "fixed-id",
            text: "Write tests",
            completed: false,
            priority: "normal",
            createdAt: fixedNow.toISOString(),
            updatedAt: fixedNow.toISOString()
        });
        expect(store.load().todo).toHaveLength(1);
    });

    it("prepends newly created todo items ahead of existing ones", () => {
        store.save({
            todo: [{ id: "older", text: "Older", completed: false, priority: "normal", createdAt: fixedNow.toISOString(), updatedAt: fixedNow.toISOString() }],
            notes: []
        });

        const result = store.create("todo", {
            text: "Newest",
            completed: false
        });

        expect(result.map(item => item.id)).toEqual(["fixed-id", "older"]);
    });

    it("creates notes with timestamps", () => {
        const result = store.create("notes", {
            content: "  Remember edge cases  "
        });

        expect(result[0]).toEqual({
            id: "fixed-id",
            content: "Remember edge cases",
            createdAt: fixedNow.toISOString(),
            updatedAt: fixedNow.toISOString()
        });
    });

    it("creates urgent todo items with explicit priority", () => {
        const result = store.create("todo", {
            text: "Ship fix",
            completed: false,
            priority: "urgent"
        });

        expect(result[0].priority).toBe("urgent");
    });

    it("refuses to create blank items", () => {
        expect(store.create("todo", {
            text: "   ",
            completed: false
        })).toEqual([]);

        expect(store.create("notes", {
            content: "   "
        })).toEqual([]);
    });

    it("updates matching items and preserves others", () => {
        store.save({
            todo: [
                {
                    id: "a",
                    text: "First",
                    completed: false,
                    priority: "normal",
                    createdAt: "2026-04-07T11:00:00.000Z",
                    updatedAt: "2026-04-07T11:00:00.000Z"
                },
                {
                    id: "b",
                    text: "Second",
                    completed: false,
                    priority: "normal",
                    createdAt: "2026-04-07T11:05:00.000Z",
                    updatedAt: "2026-04-07T11:05:00.000Z"
                }
            ],
            notes: []
        });

        const result = store.update("todo", "b", {
            text: "Second updated",
            completed: true
        });

        expect(result).toEqual([
            {
                id: "a",
                text: "First",
                completed: false,
                priority: "normal",
                createdAt: "2026-04-07T11:00:00.000Z",
                updatedAt: "2026-04-07T11:00:00.000Z"
            },
            {
                id: "b",
                text: "Second updated",
                completed: true,
                priority: "normal",
                createdAt: "2026-04-07T11:05:00.000Z",
                updatedAt: fixedNow.toISOString()
            }
        ]);
    });

    it("updates note content and refreshes only the note timestamp", () => {
        store.save({
            todo: [],
            notes: [{
                id: "n1",
                content: "Draft",
                createdAt: "2026-04-07T11:00:00.000Z",
                updatedAt: "2026-04-07T11:00:00.000Z"
            }]
        });

        expect(store.update("notes", "n1", { content: "Final" })).toEqual([
            {
                id: "n1",
                content: "Final",
                createdAt: "2026-04-07T11:00:00.000Z",
                updatedAt: fixedNow.toISOString()
            }
        ]);
    });

    it("rejects blank updates and keeps the previous item content", () => {
        store.save({
            todo: [{
                id: "a",
                text: "Only",
                completed: false,
                priority: "normal",
                createdAt: fixedNow.toISOString(),
                updatedAt: fixedNow.toISOString()
            }],
            notes: [{
                id: "n1",
                content: "Saved",
                createdAt: fixedNow.toISOString(),
                updatedAt: fixedNow.toISOString()
            }]
        });

        expect(store.update("todo", "a", { text: "   " })).toEqual([
            { id: "a", text: "Only", completed: false, priority: "normal", createdAt: fixedNow.toISOString(), updatedAt: fixedNow.toISOString() }
        ]);

        expect(store.update("notes", "n1", { content: "   " })).toEqual([
            { id: "n1", content: "Saved", createdAt: fixedNow.toISOString(), updatedAt: fixedNow.toISOString() }
        ]);
    });

    it("deletes matching items only", () => {
        store.save({
            todo: [
                { id: "a", text: "First", completed: false, priority: "normal", createdAt: fixedNow.toISOString(), updatedAt: fixedNow.toISOString() },
                { id: "b", text: "Second", completed: false, priority: "normal", createdAt: fixedNow.toISOString(), updatedAt: fixedNow.toISOString() }
            ],
            notes: []
        });

        expect(store.delete("todo", "a")).toEqual([
            { id: "b", text: "Second", completed: false, priority: "normal", createdAt: fixedNow.toISOString(), updatedAt: fixedNow.toISOString() }
        ]);
    });

    it("deletes notes independently from todo items", () => {
        store.save({
            todo: [{ id: "t1", text: "Task", completed: false, priority: "normal", createdAt: fixedNow.toISOString(), updatedAt: fixedNow.toISOString() }],
            notes: [
                { id: "n1", content: "One", createdAt: fixedNow.toISOString(), updatedAt: fixedNow.toISOString() },
                { id: "n2", content: "Two", createdAt: fixedNow.toISOString(), updatedAt: fixedNow.toISOString() }
            ]
        });

        expect(store.delete("notes", "n1")).toEqual([
            { id: "n2", content: "Two", createdAt: fixedNow.toISOString(), updatedAt: fixedNow.toISOString() }
        ]);
        expect(store.load().todo).toHaveLength(1);
    });

    it("keeps state unchanged when updating or deleting unknown ids", () => {
        store.save({
            todo: [{ id: "a", text: "Only", completed: false, priority: "normal", createdAt: fixedNow.toISOString(), updatedAt: fixedNow.toISOString() }],
            notes: []
        });

        expect(store.update("todo", "missing", { completed: true })).toEqual([
            { id: "a", text: "Only", completed: false, priority: "normal", createdAt: fixedNow.toISOString(), updatedAt: fixedNow.toISOString() }
        ]);
        expect(store.delete("todo", "missing")).toEqual([
            { id: "a", text: "Only", completed: false, priority: "normal", createdAt: fixedNow.toISOString(), updatedAt: fixedNow.toISOString() }
        ]);
    });
});
