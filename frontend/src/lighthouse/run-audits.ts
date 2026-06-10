import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import * as fs from "fs";
import * as path from "path";
import { BASE_URL, LIGHTHOUSE_CONFIG, PAGES } from "./lighthouse.config";

const REPORTS_DIR = path.resolve(process.cwd(), "src/lighthouse/reports");

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

async function auditPage(url: string, pageName: string): Promise<AuditResult> {
    const chrome = await chromeLauncher.launch({
        chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
    });

    try {
        const result = await lighthouse(
            url,
            { port: chrome.port, output: "html", logLevel: "error" },
            LIGHTHOUSE_CONFIG
        );

        if (!result) throw new Error(`Sin resultado para ${url}`);

        if (!fs.existsSync(REPORTS_DIR)) {
            fs.mkdirSync(REPORTS_DIR, { recursive: true });
        }

        fs.writeFileSync(
            path.join(REPORTS_DIR, `${pageName}.html`),
            result.report as string
        );

        const { categories } = result.lhr;
        return {
            page: pageName,
            scores: {
                performance: categories.performance?.score ?? null,
                accessibility: categories.accessibility?.score ?? null,
                bestPractices: categories["best-practices"]?.score ?? null,
                seo: categories.seo?.score ?? null,
            },
        };
    } finally {
        await chrome.kill();
    }
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

async function runPublicAudits(): Promise<void> {
    console.log("🔍 Iniciando auditorías Lighthouse — páginas públicas...\n");

    const results: AuditResult[] = [];

    for (const route of PAGES.public) {
        console.log(`  Auditando: ${route.path}`);
        try {
            const result = await auditPage(`${BASE_URL}${route.path}`, route.name);
            results.push(result);
            console.log(`    ✓ Performance: ${formatScore(result.scores.performance)}`);
        } catch (err) {
            console.error(`    ✗ Error en ${route.path}:`, err);
        }
    }

    printSummary(results);
}

runPublicAudits().catch(console.error);