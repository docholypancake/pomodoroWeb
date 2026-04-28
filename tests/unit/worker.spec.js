import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("worker", () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete globalThis.self;
    });

    it("starts, ticks, restarts, and stops the worker interval", async () => {
        const postMessage = vi.fn();
        globalThis.self = { postMessage };

        const intervalToken = { id: "first" };
        const restartedToken = { id: "second" };
        const setIntervalMock = vi.fn()
            .mockReturnValueOnce(intervalToken)
            .mockReturnValueOnce(restartedToken);
        const clearIntervalMock = vi.fn();

        vi.stubGlobal("setInterval", setIntervalMock);
        vi.stubGlobal("clearInterval", clearIntervalMock);

        await import("../../src/js/worker.js");

        globalThis.self.onmessage({ data: "start" });
        expect(setIntervalMock).toHaveBeenCalledTimes(1);
        expect(clearIntervalMock).not.toHaveBeenCalled();

        const tickCallback = setIntervalMock.mock.calls[0][0];
        tickCallback();
        expect(postMessage).toHaveBeenCalledWith("tick");

        globalThis.self.onmessage({ data: "start" });
        expect(clearIntervalMock).toHaveBeenCalledWith(intervalToken);
        expect(setIntervalMock).toHaveBeenCalledTimes(2);

        globalThis.self.onmessage({ data: "stop" });
        expect(clearIntervalMock).toHaveBeenCalledWith(restartedToken);
    });
});
