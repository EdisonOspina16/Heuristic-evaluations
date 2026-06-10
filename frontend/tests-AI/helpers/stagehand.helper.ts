import { Stagehand } from "@browserbasehq/stagehand";
import { stagehandConfig, BASE_URL } from "../../stagehand.config";
import type { Page } from "playwright";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// Compatibilidad __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Archivo temporal donde globalSetup guarda el token
const TOKEN_CACHE_PATH = path.resolve(__dirname, "../.auth-cache.json");

/**
 * Crea una instancia básica de Stagehand sin autenticación.
 * Usar solo para rutas públicas (login, register, landing).
 */
export async function createStagehand() {
    const stagehand = new Stagehand(stagehandConfig);
    await stagehand.init();
    const page = stagehand.context.pages()[0] as unknown as Page;
    return { stagehand, page };
}

/**
 * Crea una instancia de Stagehand con el token inyectado en localStorage
 * ANTES de cualquier navegación. Lee el token del cache generado por globalSetup.
 *
 * Usar en todos los tests que accedan a rutas protegidas.
 */
export async function createAuthenticatedStagehand() {
    // ── 1. Leer token del cache generado en globalSetup ──
    if (!fs.existsSync(TOKEN_CACHE_PATH)) {
        throw new Error(
            `[createAuthenticatedStagehand] No se encontró el archivo de auth cache en ${TOKEN_CACHE_PATH}. ` +
            "Asegúrate de que globalSetup haya corrido correctamente."
        );
    }

    const { token, user } = JSON.parse(
        fs.readFileSync(TOKEN_CACHE_PATH, "utf-8")
    );

    // ── 2. Inicializar Stagehand ──
    const stagehand = new Stagehand(stagehandConfig);
    await stagehand.init();
    const page = stagehand.context.pages()[0] as unknown as Page;

    // ── 3. Inyectar token en localStorage antes de cada navegación ──
    await stagehand.context.addInitScript(
        ({ token, user }: { token: string; user: unknown }) => {
            localStorage.setItem("access_token", token);
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
        },
        { token, user }
    );

    return { stagehand, page };
}