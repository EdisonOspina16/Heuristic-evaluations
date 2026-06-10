import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { chromium, type BrowserContext, type Browser } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKEN_CACHE_PATH = path.resolve(__dirname, "../.auth-cache.json");

export interface AuthContext {
    browser: Browser;
    context: BrowserContext;
    port: number;
}

function extractPort(wsEndpoint: string): number {
    const match = wsEndpoint.match(/:(\d+)\//);
    if (!match) throw new Error(`No se pudo extraer el puerto de: ${wsEndpoint}`);
    return parseInt(match[1], 10);
}

/**
 * Crea un contexto de Playwright con auth inyectada en localStorage.
 * Lighthouse usará este contexto para auditar páginas protegidas.
 * Análogo a createAuthenticatedStagehand() en tus tests.
 */
export async function createAuthenticatedContext(): Promise<AuthContext> {
    if (!fs.existsSync(TOKEN_CACHE_PATH)) {
        throw new Error(
            `[Lighthouse] No se encontró auth cache en ${TOKEN_CACHE_PATH}. ` +
            "Asegúrate de que globalSetup haya corrido correctamente."
        );
    }

    const { token, user } = JSON.parse(
        fs.readFileSync(TOKEN_CACHE_PATH, "utf-8")
    );

    const browserServer = await chromium.launchServer({
        headless: true,
        args: ["--remote-debugging-port=0"],
    });

    const wsEndpoint = browserServer.wsEndpoint();
    const port = extractPort(wsEndpoint);

    const browser = await chromium.connect(wsEndpoint);
    const context = await browser.newContext();

    // Inyectar token ANTES de cualquier navegación (igual que en Stagehand)
    await context.addInitScript(
        ({ token, user }: { token: string; user: unknown }) => {
            localStorage.setItem("access_token", token);
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
        },
        { token, user }
    );

    return { browser, context, port };
}

/**
 * Crea un contexto sin auth para páginas públicas.
 */
export async function createPublicContext(): Promise<AuthContext> {
    const browserServer = await chromium.launchServer({ headless: true });
    const wsEndpoint = browserServer.wsEndpoint();
    const port = extractPort(wsEndpoint);

    const browser = await chromium.connect(wsEndpoint);
    const context = await browser.newContext();

    return { browser, context, port };
}