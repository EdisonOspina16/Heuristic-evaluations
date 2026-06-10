const path = require("path");
const fs = require("fs");
const https = require("https");
const http = require("http");

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const TOKEN_CACHE_PATH = path.resolve(__dirname, "../.auth-cache.json");

function postJSON(url, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const parsed = new URL(url);
        const lib = parsed.protocol === "https:" ? https : http;

        const req = lib.request(
            {
                hostname: parsed.hostname,
                port: parsed.port,
                path: parsed.pathname,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(data),
                },
            },
            (res) => {
                let raw = "";
                res.on("data", (chunk) => (raw += chunk));
                res.on("end", () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(JSON.parse(raw));
                    } else {
                        reject(
                            new Error(
                                `HTTP ${res.statusCode} en ${url}: ${raw}`
                            )
                        );
                    }
                });
            }
        );

        req.on("error", reject);
        req.write(data);
        req.end();
    });
}

module.exports = async function () {
    const { TransformStream, ReadableStream, WritableStream } = require("stream/web");
    globalThis.TransformStream = TransformStream;
    globalThis.ReadableStream = ReadableStream;
    globalThis.WritableStream = WritableStream;

    console.log("\n[globalSetup] Obteniendo token de autenticación...");

    const data = await postJSON(`${API_URL}/auth/login`, {
        email: "stephano.mejia20@icloud.com",
        password: "Stephano123456789",
    });

    const token = data.access_token;
    const user = data.user;

    if (!token) {
        throw new Error(
            "[globalSetup] El backend no retornó access_token. Respuesta: " +
            JSON.stringify(data)
        );
    }

    fs.writeFileSync(
        TOKEN_CACHE_PATH,
        JSON.stringify({ token, user, savedAt: new Date().toISOString() }),
        "utf-8"
    );

    console.log(`[globalSetup] ✓ Token cacheado correctamente.`);
};