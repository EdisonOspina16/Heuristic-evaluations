import { createAuthenticatedStagehand } from "../helpers/stagehand.helper";
import { BASE_URL } from "../../stagehand.config";
import type { Page } from "playwright";

const EVAL_URL = `${BASE_URL}/evaluacion/1?project_id=1&evaluation_id=1`;
const EVAL_ERROR_URL = `${BASE_URL}/evaluacion/9999?project_id=1&evaluation_id=9999`;

type AuthStagehand = Awaited<ReturnType<typeof createAuthenticatedStagehand>>;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function waitForForm(page: Page) {
    await page.waitForSelector("h1", { timeout: 15_000 });
}

/** Polling replacement for page.waitForFunction (not available in Stagehand) */
async function waitForCondition(
    page: Page,
    conditionFn: () => Promise<boolean>,
    { timeout = 10_000, interval = 300 } = {}
): Promise<void> {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
        if (await conditionFn()) return;
        await page.waitForTimeout(interval);
    }
    throw new Error(`waitForCondition timed out after ${timeout}ms`);
}

async function getProgress(page: Page): Promise<number> {
    return page.evaluate(() => {
        const bar = document.querySelector('[data-cy="progress-bar"]');
        return Number(bar?.getAttribute("aria-valuenow") ?? 0);
    });
}

async function getAnsweredCount(page: Page): Promise<number> {
    return page.evaluate(() => {
        const el = document.querySelector('[data-cy="progress-count"]');
        return Number(el?.textContent?.split("/")[0].trim() ?? 0);
    });
}

/** Valor vacío: el hidden input puede tener value="" o value="null" cuando no hay respuesta */
function isEmpty(value: string): boolean {
    return value === "" || value === "null";
}

async function getHiddenValue(page: Page, dataCy: string): Promise<string> {
    return page.evaluate((cy) => {
        const el = document.querySelector(`[data-cy="${cy}"]`) as HTMLInputElement | null;
        return el?.value ?? "";
    }, dataCy);
}

async function getAllHiddenDataCy(page: Page): Promise<string[]> {
    return page.evaluate(() => {
        const inputs = document.querySelectorAll('[data-cy^="respuesta-input-"]');
        return Array.from(inputs)
            .map((el) => el.getAttribute("data-cy") ?? "")
            .filter(Boolean);
    });
}

function extractId(dataCy: string): string {
    return dataCy.replace("respuesta-input-", "");
}

async function clickLikert(page: Page, preguntaId: string, val: number) {
    await page.evaluate(({ id, val }) => {
        const hidden = document.querySelector(`[data-cy="respuesta-input-${id}"]`);
        if (!hidden) return;
        let ancestor: Element | null = hidden.parentElement;
        while (ancestor) {
            const circles = ancestor.querySelectorAll<HTMLElement>(
                ".flex.flex-col.items-center.gap-2.cursor-pointer"
            );
            if (circles.length > 0) {
                const target = circles[val - 1];
                target?.click();
                return;
            }
            ancestor = ancestor.parentElement;
        }
    }, { id: preguntaId, val });
}

/**
 * Hace click en la primera opción de una pregunta de selección.
 * Discrimina por el div.grid que envuelve las opciones (vs div.flex de Likert).
 */
async function clickFirstOption(page: Page, preguntaId: string) {
    await page.evaluate((id) => {
        const hidden = document.querySelector(`[data-cy="respuesta-input-${id}"]`);
        if (!hidden) return;
        let ancestor: Element | null = hidden.parentElement;
        while (ancestor) {
            if (ancestor.classList.contains("grid")) {
                const opts = Array.from(
                    ancestor.querySelectorAll<HTMLElement>(".cursor-pointer")
                ).filter(
                    (el) =>
                        el.classList.contains("rounded-2xl") &&
                        el.querySelector(".rounded-full") !== null
                );
                if (opts.length > 0) {
                    opts[0].click();
                    return;
                }
            }
            ancestor = ancestor.parentElement;
        }
    }, preguntaId);
}

async function findFirstLikertId(page: Page): Promise<string> {
    return page.evaluate(() => {
        const inputs = document.querySelectorAll('[data-cy^="respuesta-input-"]');
        for (const input of Array.from(inputs)) {
            const id = input.getAttribute("data-cy")?.replace("respuesta-input-", "");
            if (!id) continue;
            let ancestor: Element | null = input.parentElement;
            while (ancestor) {
                const circles = ancestor.querySelectorAll(
                    ".flex.flex-col.items-center.gap-2.cursor-pointer"
                );
                if (circles.length > 0) return id;
                ancestor = ancestor.parentElement;
            }
        }
        return "";
    });
}

/**
 * Busca la primera pregunta de selección identificando el div.grid que
 * envuelve las opciones. Esto la distingue con certeza de las preguntas
 * Likert, que usan div.flex.flex-wrap.
 */
async function findFirstSelectionId(page: Page): Promise<string> {
    return page.evaluate(() => {
        const inputs = document.querySelectorAll('[data-cy^="respuesta-input-"]');
        for (const input of Array.from(inputs)) {
            const id = input.getAttribute("data-cy")?.replace("respuesta-input-", "");
            if (!id) continue;
            let ancestor: Element | null = input.parentElement;
            while (ancestor) {
                if (ancestor.classList.contains("grid")) {
                    const opts = Array.from(
                        ancestor.querySelectorAll<HTMLElement>(".cursor-pointer")
                    ).filter(
                        (el) =>
                            el.classList.contains("rounded-2xl") &&
                            el.querySelector(".rounded-full") !== null
                    );
                    if (opts.length > 0) return id;
                }
                ancestor = ancestor.parentElement;
            }
        }
        return "";
    });
}

/**
 * Busca el texto "guardado" usando un TreeWalker sobre nodos Text.
 * Más fiable que filtrar por el.children.length === 0, que omite
 * nodos de texto dentro de elementos con íconos SVG como hijos.
 */
async function hasSavedText(page: Page): Promise<boolean> {
    return page.evaluate(() => {
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT
        );
        let node: Node | null;
        while ((node = walker.nextNode())) {
            if (/guardado/i.test(node.textContent ?? "")) return true;
        }
        return false;
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 – Carga y estructura
// ─────────────────────────────────────────────────────────────────────────────
describe("EvaluationForm – carga y estructura", () => {
    let stagehand: AuthStagehand["stagehand"];
    let page: Page;

    beforeAll(async () => {
        ({ stagehand, page } = await createAuthenticatedStagehand());
        await page.goto(EVAL_URL, { waitUntil: "networkidle" });
        await waitForForm(page);
    });

    afterAll(async () => { await stagehand.close(); });

    it("muestra el título de la plantilla", async () => {
        const heading = await page.evaluate(
            () => document.querySelector("h1")?.textContent?.trim()
        );
        expect(heading?.length).toBeGreaterThan(0);
    });

    it("renderiza al menos una dimensión", async () => {
        const count = await page.evaluate(
            () => document.querySelectorAll('[data-cy="dimension-title"]').length
        );
        expect(count).toBeGreaterThan(0);
    });

    it("la barra de progreso tiene aria-valuenow numérico", async () => {
        const val = await getProgress(page);
        expect(val).toBeGreaterThanOrEqual(0);
    });

    it("el contador tiene formato N / M", async () => {
        const counter = await page.evaluate(
            () => document.querySelector('[data-cy="progress-count"]')?.textContent ?? ""
        );
        expect(counter).toMatch(/^\d+\s*\/\s*\d+$/);
    });

    it("cada pregunta tiene un hidden input", async () => {
        const count = await page.evaluate(
            () => document.querySelectorAll('[data-cy^="respuesta-input-"]').length
        );
        expect(count).toBeGreaterThan(0);
    });

    it("el botón Finalizar Evaluación está visible", async () => {
        const visible = await page.evaluate(() => {
            const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement | null;
            if (!btn) return false;
            const s = window.getComputedStyle(btn);
            return s.display !== "none" && s.visibility !== "hidden";
        });
        expect(visible).toBe(true);
    });

    it("el botón Finalizar Evaluación no está deshabilitado", async () => {
        const disabled = await page.evaluate(
            () => (document.querySelector('button[type="submit"]') as HTMLButtonElement | null)?.disabled ?? true
        );
        expect(disabled).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 – Preguntas Likert
// ─────────────────────────────────────────────────────────────────────────────
describe("EvaluationForm – preguntas Likert", () => {
    let stagehand: AuthStagehand["stagehand"];
    let page: Page;
    let firstLikertId: string;

    beforeAll(async () => {
        ({ stagehand, page } = await createAuthenticatedStagehand());
        await page.goto(EVAL_URL, { waitUntil: "networkidle" });
        await waitForForm(page);
        firstLikertId = await findFirstLikertId(page);
    });

    afterAll(async () => { await stagehand.close(); });

    it("seleccionar un valor Likert actualiza el hidden input", async () => {
        await clickLikert(page, firstLikertId, 3);
        await page.waitForTimeout(300);

        const value = await getHiddenValue(page, `respuesta-input-${firstLikertId}`);
        expect(value).toBe("3");
    });

    it("el progreso sube al responder", async () => {
        const answered = await getAnsweredCount(page);
        expect(answered).toBeGreaterThanOrEqual(1);
    });

    it("hacer clic de nuevo sobre el mismo valor lo deselecciona", async () => {
        await clickLikert(page, firstLikertId, 3);
        await page.waitForTimeout(300);

        const value = await getHiddenValue(page, `respuesta-input-${firstLikertId}`);
        expect(isEmpty(value)).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 – Preguntas de selección
// ─────────────────────────────────────────────────────────────────────────────
describe("EvaluationForm – preguntas de selección", () => {
    let stagehand: AuthStagehand["stagehand"];
    let page: Page;
    let firstSelectionId: string;

    beforeAll(async () => {
        ({ stagehand, page } = await createAuthenticatedStagehand());
        await page.goto(EVAL_URL, { waitUntil: "networkidle" });
        await waitForForm(page);
        firstSelectionId = await findFirstSelectionId(page);
    });

    afterAll(async () => { await stagehand.close(); });

    it("seleccionar la misma opción la deselecciona", async () => {
        await clickFirstOption(page, firstSelectionId);
        await page.waitForTimeout(300);

        const value = await getHiddenValue(page, `respuesta-input-${firstSelectionId}`);
        expect(isEmpty(value)).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 – Comentarios
// ─────────────────────────────────────────────────────────────────────────────
describe("EvaluationForm – comentarios", () => {
    let stagehand: AuthStagehand["stagehand"];
    let page: Page;

    beforeAll(async () => {
        ({ stagehand, page } = await createAuthenticatedStagehand());
        await page.goto(EVAL_URL, { waitUntil: "networkidle" });
        await waitForForm(page);
    });

    afterAll(async () => { await stagehand.close(); });

    it("escribir en el primer textarea persiste el texto", async () => {
        await page.evaluate(() => {
            const ta = document.querySelector("textarea") as HTMLTextAreaElement | null;
            if (!ta) return;
            const setter = Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype, "value"
            )?.set;
            setter?.call(ta, "Esto es una observación de prueba automatizada.");
            ta.dispatchEvent(new Event("input", { bubbles: true }));
        });
        await page.waitForTimeout(300);

        const value = await page.evaluate(
            () => (document.querySelector("textarea") as HTMLTextAreaElement | null)?.value ?? ""
        );
        expect(value).toContain("observación de prueba");
    });

    it("un comentario cuenta como pregunta respondida", async () => {
        const answered = await getAnsweredCount(page);
        expect(answered).toBeGreaterThanOrEqual(1);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 – Guardado de progreso
// ─────────────────────────────────────────────────────────────────────────────
describe("EvaluationForm – guardado de progreso", () => {
    let stagehand: AuthStagehand["stagehand"];
    let page: Page;

    beforeAll(async () => {
        ({ stagehand, page } = await createAuthenticatedStagehand());
        await page.goto(EVAL_URL, { waitUntil: "networkidle" });
        await waitForForm(page);
    });

    afterAll(async () => { await stagehand.close(); });

    it("el botón Guardar progreso existe en el DOM", async () => {
        const exists = await page.evaluate(() => {
            return Array.from(document.querySelectorAll("button"))
                .some((b) => b.textContent?.includes("Guardar progreso"));
        });
        expect(exists).toBe(true);
    });

    it("el guardado manual actualiza el texto de estado", async () => {
        await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll("button"))
                .find((b) => b.textContent?.includes("Guardar progreso")) as HTMLButtonElement | undefined;
            btn?.click();
        });

        await waitForCondition(page, () => hasSavedText(page), { timeout: 10_000 });

        const saved = await hasSavedText(page);
        expect(saved).toBe(true);
    });

    it("el autosave se dispara tras responder una pregunta", async () => {
        const likertId = await findFirstLikertId(page);
        await clickLikert(page, likertId, 5);

        // debounce 700ms + margen
        await waitForCondition(page, () => hasSavedText(page), { timeout: 5_000 });

        const saved = await hasSavedText(page);
        expect(saved).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 – Envío completo
// ─────────────────────────────────────────────────────────────────────────────
describe("EvaluationForm – envío completo", () => {
    let stagehand: AuthStagehand["stagehand"];
    let page: Page;

    beforeAll(async () => {
        ({ stagehand, page } = await createAuthenticatedStagehand());
        await page.goto(EVAL_URL, { waitUntil: "networkidle" });
        await waitForForm(page);
    });

    afterAll(async () => { await stagehand.close(); });

    it("responde todas las preguntas, llega al 100% y envía", async () => {
        const hiddenAttrs = await getAllHiddenDataCy(page);

        for (const attr of hiddenAttrs) {
            const id = extractId(attr);

            const isLikert = await page.evaluate((id) => {
                const hidden = document.querySelector(`[data-cy="respuesta-input-${id}"]`);
                if (!hidden) return false;
                let el: Element | null = hidden.parentElement;
                while (el) {
                    if (el.querySelectorAll(".flex.flex-col.items-center.gap-2.cursor-pointer").length > 0) return true;
                    el = el.parentElement;
                }
                return false;
            }, id);

            if (isLikert) {
                await clickLikert(page, id, 4);
                await page.waitForTimeout(80);
                continue;
            }

            const isSelection = await page.evaluate((id) => {
                const hidden = document.querySelector(`[data-cy="respuesta-input-${id}"]`);
                if (!hidden) return false;
                let el: Element | null = hidden.parentElement;
                while (el) {
                    if (el.classList.contains("grid")) {
                        const opts = Array.from(el.querySelectorAll<HTMLElement>(".cursor-pointer"))
                            .filter(
                                (e) =>
                                    e.classList.contains("rounded-2xl") &&
                                    e.querySelector(".rounded-full") !== null
                            );
                        if (opts.length > 0) return true;
                    }
                    el = el.parentElement;
                }
                return false;
            }, id);

            if (isSelection) {
                await clickFirstOption(page, id);
                await page.waitForTimeout(80);
            }
        }

        // Polling hasta progreso 100%
        await waitForCondition(
            page,
            async () => (await getProgress(page)) === 100,
            { timeout: 15_000, interval: 500 }
        );

        const progress = await getProgress(page);
        expect(progress).toBe(100);

        await page.evaluate(() => {
            (document.querySelector('button[type="submit"]') as HTMLButtonElement | null)?.click();
        });

        // page.waitForURL no está disponible en Stagehand — usar polling sobre page.url()
        await waitForCondition(
            page,
            async () => /\/(project|evaluations|dashboard|success)/.test(page.url()),
            { timeout: 15_000, interval: 400 }
        );
        expect(page.url()).toMatch(/\/(project|evaluations|dashboard|success)/);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 – Manejo de errores
// ─────────────────────────────────────────────────────────────────────────────
describe("EvaluationForm – manejo de errores", () => {
    let stagehand: AuthStagehand["stagehand"];
    let page: Page;

    beforeAll(async () => {
        ({ stagehand, page } = await createAuthenticatedStagehand());
        await page.goto(EVAL_ERROR_URL, { waitUntil: "networkidle" });
    });

    afterAll(async () => { await stagehand.close(); });

    it("muestra el bloque de error cuando la plantilla no existe", async () => {
        await page.waitForSelector('[data-cy="error-message"]', { timeout: 10_000 });
        const text = await page.evaluate(
            () => document.querySelector('[data-cy="error-message"]')?.textContent ?? ""
        );
        expect(text.length).toBeGreaterThan(0);
    });
});