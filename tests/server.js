const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT || 4173);

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
    } catch (error) {
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
        sendResponse(response, resolvedRequest.errorStatusCode, errorMessage);
        return;
    }

    const targetPath = resolvedRequest.absolutePath;
    fs.stat(targetPath, (statError, stats) => {
        if (statError) {
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
                sendResponse(response, 500, "Failed to read file");
                return;
            }

            sendResponse(response, 200, data, contentType);
        });
    });
});

server.listen(PORT, "127.0.0.1", () => {
    console.log(`Static test server running at http://127.0.0.1:${PORT}`);
});
