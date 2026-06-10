import lighthouse from "lighthouse";
import * as fs from "fs";
import * as path from "path";
import puppeteer, { type Browser, type Page } from "puppeteer";
import { BASE_URL, LIGHTHOUSE_CONFIG, PAGES } from "./lighthouse.config";

const REPORTS_DIR = path.resolve(process.cwd(), "src/lighthouse/reports");

const CREDENTIALS = {
    email: "stephano.mejia20@icloud.com",
    password: "Stephano123456789",
};

interface AuditScore {
    performance: number | null;
    accessibility: number | null;
    bestPractices: number | null;
    seo: number | null;
}

interface AuditResult {
    page: string;
    scores: AuditScore;
}

function formatScore(score: number | null): string {
    return score != null ? String(Math.round(score * 100)) : "N/A";
}

/**
 * Hace login real llenando el formulario, igual que un usuario.
 * Retorna el token guardado en localStorage por la app.
 */
async function getTokenViaLogin(page: Page): Promise<string> {
    console.log("  🔑 Haciendo login via formulario...");

    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle0" });

    // Llenar formulario
    await page.type('input[type="email"]', CREDENTIALS.email);
    await page.type('input[type="password"]', CREDENTIALS.password);
    await page.click('button[type="submit"]');

    // Esperar que el token aparezca en localStorage (tu app lo guarda como "token")
    await page.waitForFunction(
        () => window.localStorage.getItem("token") !== null,
        { timeout: 15000 }
    );

    const token = await page.evaluate(() => window.localStorage.getItem("token"));
    if (!token) throw new Error("Login fallido: no se encontró token en localStorage");

    console.log("  ✓ Login exitoso, token obtenido");
    return token;
}

/**
 * Audita una URL usando el mismo browser donde ya está la sesión activa.
 * Usa wsEndpoint() para obtener el puerto CDP — igual que el proyecto Linker.
 */
async function auditUrl(
    browser: Browser,
    url: string,
    name: string
): Promise<AuditResult> {
    const wsEndpoint = browser.wsEndpoint();
    const port = parseInt(new URL(wsEndpoint).port, 10);

    const result = await lighthouse(
        url,
        {
            port,
            output: "html",
            logLevel: "error",
            disableStorageReset: true,
        },
        LIGHTHOUSE_CONFIG
    );

    if (!result) throw new Error(`Sin resultado para ${url}`);

    if (!fs.existsSync(REPORTS_DIR)) {
        fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }

    fs.writeFileSync(
        path.join(REPORTS_DIR, `${name}.html`),
        result.report as string
    );

    const { categories } = result.lhr;
    return {
        page: name,
        scores: {
            performance: categories.performance?.score ?? null,
            accessibility: categories.accessibility?.score ?? null,
            bestPractices: categories["best-practices"]?.score ?? null,
            seo: categories.seo?.score ?? null,
        },
    };
}

function printSummary(results: AuditResult[]): void {
    console.log("\n📊 Resumen (0–100):\n");
    console.table(
        results.map((r) => ({
            Página: r.page,
            Performance: formatScore(r.scores.performance),
            Accesibilidad: formatScore(r.scores.accessibility),
            "Buenas Prácticas": formatScore(r.scores.bestPractices),
            SEO: formatScore(r.scores.seo),
        }))
    );
    console.log(`\n📁 Reportes guardados en: ${REPORTS_DIR}`);
}

async function runProtectedAudits(): Promise<void> {
    console.log("🔍 Iniciando auditorías Lighthouse — páginas protegidas...\n");

    if (!fs.existsSync(REPORTS_DIR)) {
        fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-gpu",
            "--disable-dev-shm-usage",
            "--remote-debugging-port=0",
        ],
    });

    const results: AuditResult[] = [];

    try {
        // Login real una sola vez — la sesión queda activa en el browser
        const loginPage = await browser.newPage();
        await getTokenViaLogin(loginPage);
        await loginPage.close();

        for (const route of PAGES.protected) {
            const url = `${BASE_URL}${route.path}`;
            console.log(`  Auditando (auth): ${route.path}`);

            try {
                const result = await auditUrl(browser, url, route.name);

                // Verificar que no auditó el login
                const reportContent = fs.readFileSync(
                    path.join(REPORTS_DIR, `${route.name}.html`),
                    "utf-8"
                );
                const finalUrlMatch = reportContent.match(/"finalDisplayedUrl":"([^"]+)"/);
                const finalUrl = finalUrlMatch?.[1] ?? "";

                if (finalUrl.includes("/login")) {
                    console.warn(`    ⚠️  Lighthouse auditó login en vez de ${route.path}`);
                    continue;
                }

                results.push(result);
                console.log(`    ✓ Performance: ${formatScore(result.scores.performance)}`);
            } catch (err) {
                console.error(`    ✗ Error en ${route.path}:`, err);
            }
        }
    } finally {
        await browser.close();
    }

    printSummary(results);
}

runProtectedAudits().catch(console.error);