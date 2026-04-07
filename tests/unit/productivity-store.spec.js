import { describe, it, expect, beforeEach } from "vitest";
import productivityStoreApi from "../../js/productivity-store.js";

const {
    STORAGE_KEY,
    isValidTimestamp,
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
    });

    it("validates timestamps safely", () => {
        expect(isValidTimestamp("2026-04-07T12:00:00.000Z")).toBe(true);
        expect(isValidTimestamp("not-a-date")).toBe(false);
        expect(isValidTimestamp(null)).toBe(false);
    });

    it("normalizes corrupted raw state into a safe empty/default structure", () => {
        expect(normalizeProductivityState({
            todo: [
                { id: "1", text: "keep", completed: "yes", createdAt: "bad", updatedAt: "bad" },
                { text: "drop-no-id" }
            ],
            notes: [
                { id: "n1", content: "keep note", createdAt: "bad", updatedAt: "2026-04-07T10:00:00.000Z" },
                { id: "n2", text: "drop-no-content" }
            ]
        }, () => fixedNow)).toEqual({
            todo: [{
                id: "1",
                text: "keep",
                completed: true,
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

    it("saves normalized state back to storage", () => {
        const saved = store.save({
            todo: [{ id: "1", text: "Task", completed: false, createdAt: "bad", updatedAt: "bad" }],
            notes: "bad"
        });

        expect(saved.todo).toHaveLength(1);
        expect(saved.notes).toEqual([]);
        expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual(saved);
    });

    it("creates todo items at the top of the list", () => {
        const result = store.create("todo", {
            text: "Write tests",
            completed: false
        });

        expect(result[0]).toEqual({
            id: "fixed-id",
            text: "Write tests",
            completed: false,
            createdAt: fixedNow.toISOString(),
            updatedAt: fixedNow.toISOString()
        });
        expect(store.load().todo).toHaveLength(1);
    });

    it("creates notes with timestamps", () => {
        const result = store.create("notes", {
            content: "Remember edge cases"
        });

        expect(result[0]).toEqual({
            id: "fixed-id",
            content: "Remember edge cases",
            createdAt: fixedNow.toISOString(),
            updatedAt: fixedNow.toISOString()
        });
    });

    it("updates matching items and preserves others", () => {
        store.save({
            todo: [
                {
                    id: "a",
                    text: "First",
                    completed: false,
                    createdAt: "2026-04-07T11:00:00.000Z",
                    updatedAt: "2026-04-07T11:00:00.000Z"
                },
                {
                    id: "b",
                    text: "Second",
                    completed: false,
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
                createdAt: "2026-04-07T11:00:00.000Z",
                updatedAt: "2026-04-07T11:00:00.000Z"
            },
            {
                id: "b",
                text: "Second updated",
                completed: true,
                createdAt: "2026-04-07T11:05:00.000Z",
                updatedAt: fixedNow.toISOString()
            }
        ]);
    });

    it("deletes matching items only", () => {
        store.save({
            todo: [
                { id: "a", text: "First", completed: false, createdAt: fixedNow.toISOString(), updatedAt: fixedNow.toISOString() },
                { id: "b", text: "Second", completed: false, createdAt: fixedNow.toISOString(), updatedAt: fixedNow.toISOString() }
            ],
            notes: []
        });

        expect(store.delete("todo", "a")).toEqual([
            { id: "b", text: "Second", completed: false, createdAt: fixedNow.toISOString(), updatedAt: fixedNow.toISOString() }
        ]);
    });

    it("keeps state unchanged when updating or deleting unknown ids", () => {
        store.save({
            todo: [{ id: "a", text: "Only", completed: false, createdAt: fixedNow.toISOString(), updatedAt: fixedNow.toISOString() }],
            notes: []
        });

        expect(store.update("todo", "missing", { completed: true })).toEqual([
            { id: "a", text: "Only", completed: false, createdAt: fixedNow.toISOString(), updatedAt: fixedNow.toISOString() }
        ]);
        expect(store.delete("todo", "missing")).toEqual([
            { id: "a", text: "Only", completed: false, createdAt: fixedNow.toISOString(), updatedAt: fixedNow.toISOString() }
        ]);
    });
});
