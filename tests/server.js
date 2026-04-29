const http = require("http");
const fs = require("fs");
const path = require("path");
const { PostHog } = require("posthog-node");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT || 4173);

const posthog = new PostHog(process.env.POSTHOG_API_KEY || "", {
    host: process.env.POSTHOG_HOST || "https://us.i.posthog.com",
    enableExceptionAutocapture: true,
    flushAt: 1,
    flushInterval: 0
});
const SERVER_DISTINCT_ID = "test-server";

const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".ico": "image/x-icon",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".wav": "audio/wav"
};

function sendResponse(response, statusCode, body, contentType = "text/plain; charset=utf-8") {
    response.writeHead(statusCode, { "Content-Type": contentType });
    response.end(body);
}

function resolveRequestPath(requestUrl) {
    let cleanPath;

    try {
        cleanPath = decodeURIComponent((requestUrl || "/").split("?")[0]);
    } catch {
        return { errorStatusCode: 400, absolutePath: null };
    }

    const relativePath = cleanPath === "/" ? "/index.html" : cleanPath;
    const absolutePath = path.resolve(ROOT, `.${relativePath}`);

    if (!absolutePath.startsWith(ROOT)) {
        return { errorStatusCode: 403, absolutePath: null };
    }

    return { errorStatusCode: null, absolutePath };
}

const server = http.createServer((request, response) => {
    const resolvedRequest = resolveRequestPath(request.url);
    if (resolvedRequest.errorStatusCode) {
        const errorMessage = resolvedRequest.errorStatusCode === 400
            ? "Bad request"
            : "Forbidden";
        posthog.capture({
            distinctId: SERVER_DISTINCT_ID,
            event: "request_error",
            properties: {
                status_code: resolvedRequest.errorStatusCode,
                path: request.url,
                method: request.method
            }
        });
        sendResponse(response, resolvedRequest.errorStatusCode, errorMessage);
        return;
    }

    const targetPath = resolvedRequest.absolutePath;
    fs.stat(targetPath, (statError, stats) => {
        if (statError) {
            posthog.capture({
                distinctId: SERVER_DISTINCT_ID,
                event: "request_not_found",
                properties: {
                    path: request.url,
                    method: request.method
                }
            });
            sendResponse(response, 404, "Not found");
            return;
        }

        const filePath = stats.isDirectory()
            ? path.join(targetPath, "index.html")
            : targetPath;
        const extension = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[extension] || "application/octet-stream";

        fs.readFile(filePath, (readError, data) => {
            if (readError) {
                posthog.captureException(readError, SERVER_DISTINCT_ID, {
                    event_name: "request_error",
                    status_code: 500,
                    path: request.url,
                    method: request.method
                });
                posthog.capture({
                    distinctId: SERVER_DISTINCT_ID,
                    event: "request_error",
                    properties: {
                        status_code: 500,
                        path: request.url,
                        method: request.method
                    }
                });
                sendResponse(response, 500, "Failed to read file");
                return;
            }

            sendResponse(response, 200, data, contentType);
        });
    });
});

server.listen(PORT, "127.0.0.1", () => {
    console.log(`Static test server running at http://127.0.0.1:${PORT}`);
    posthog.capture({
        distinctId: SERVER_DISTINCT_ID,
        event: "server_started",
        properties: {
            port: PORT,
            host: "127.0.0.1"
        }
    });
});

process.on("SIGINT", async () => {
    await posthog.shutdown();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    await posthog.shutdown();
    process.exit(0);
});
