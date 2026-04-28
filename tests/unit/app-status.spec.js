import { beforeEach, describe, expect, it, vi } from "vitest";

const expectedStatus = import.meta.env?.VITE_APP_STATUS || "Unknown";

describe("app-status", () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it("writes the current app status into every marked element", async () => {
        document.body.innerHTML = `
            <span data-app-status>old</span>
            <span data-app-status>old</span>
        `;

        await import("../../src/js/app-status.js");

        const values = Array.from(document.querySelectorAll("[data-app-status]"))
            .map(element => element.textContent);

        expect(values).toEqual([expectedStatus, expectedStatus]);
    });
});
