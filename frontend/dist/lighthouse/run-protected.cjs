"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/lighthouse/run-protected.ts
var import_lighthouse = __toESM(require("lighthouse"));
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
var import_puppeteer = __toESM(require("puppeteer"));

// src/lighthouse/lighthouse.config.ts
var BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
var LIGHTHOUSE_CONFIG = {
  extends: "lighthouse:default",
  settings: {
    formFactor: "desktop",
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false
    },
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1
    },
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    skipAudits: ["benchmarkIndex"]
  }
};
var PAGES = {
  public: [
    { name: "login", path: "/login" },
    { name: "register", path: "/register" }
  ],
  protected: [
    { name: "dashboard", path: "/dashboard" },
    { name: "account", path: "/account" },
    { name: "account-roles", path: "/account/roles" },
    { name: "account-users", path: "/account/users" },
    { name: "account-permissions", path: "/account/permissions" },
    { name: "project", path: "/project/1" },
    { name: "project-evaluations", path: "/project/1/evaluations" },
    { name: "project-assignments", path: "/project/1/assignments" },
    { name: "project-analytics", path: "/project/1/analytics" },
    { name: "evaluacion", path: "/evaluacion/1" }
  ]
};

// src/lighthouse/run-protected.ts
var REPORTS_DIR = path.resolve(process.cwd(), "src/lighthouse/reports");
var CREDENTIALS = {
  email: "stephano.mejia20@icloud.com",
  password: "Stephano123456789"
};
function formatScore(score) {
  return score != null ? String(Math.round(score * 100)) : "N/A";
}
async function getTokenViaLogin(page) {
  console.log("  \u{1F511} Haciendo login via formulario...");
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle0" });
  await page.type('input[type="email"]', CREDENTIALS.email);
  await page.type('input[type="password"]', CREDENTIALS.password);
  await page.click('button[type="submit"]');
  await page.waitForFunction(
    () => window.localStorage.getItem("token") !== null,
    { timeout: 15e3 }
  );
  const token = await page.evaluate(() => window.localStorage.getItem("token"));
  if (!token) throw new Error("Login fallido: no se encontr\xF3 token en localStorage");
  console.log("  \u2713 Login exitoso, token obtenido");
  return token;
}
async function auditUrl(browser, url, name) {
  const wsEndpoint = browser.wsEndpoint();
  const port = parseInt(new URL(wsEndpoint).port, 10);
  const result = await (0, import_lighthouse.default)(
    url,
    {
      port,
      output: "html",
      logLevel: "error",
      disableStorageReset: true
    },
    LIGHTHOUSE_CONFIG
  );
  if (!result) throw new Error(`Sin resultado para ${url}`);
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
  fs.writeFileSync(
    path.join(REPORTS_DIR, `${name}.html`),
    result.report
  );
  const { categories } = result.lhr;
  return {
    page: name,
    scores: {
      performance: categories.performance?.score ?? null,
      accessibility: categories.accessibility?.score ?? null,
      bestPractices: categories["best-practices"]?.score ?? null,
      seo: categories.seo?.score ?? null
    }
  };
}
function printSummary(results) {
  console.log("\n\u{1F4CA} Resumen (0\u2013100):\n");
  console.table(
    results.map((r) => ({
      P\u00E1gina: r.page,
      Performance: formatScore(r.scores.performance),
      Accesibilidad: formatScore(r.scores.accessibility),
      "Buenas Pr\xE1cticas": formatScore(r.scores.bestPractices),
      SEO: formatScore(r.scores.seo)
    }))
  );
  console.log(`
\u{1F4C1} Reportes guardados en: ${REPORTS_DIR}`);
}
async function runProtectedAudits() {
  console.log("\u{1F50D} Iniciando auditor\xEDas Lighthouse \u2014 p\xE1ginas protegidas...\n");
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
  const browser = await import_puppeteer.default.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--remote-debugging-port=0"
    ]
  });
  const results = [];
  try {
    const loginPage = await browser.newPage();
    await getTokenViaLogin(loginPage);
    await loginPage.close();
    for (const route of PAGES.protected) {
      const url = `${BASE_URL}${route.path}`;
      console.log(`  Auditando (auth): ${route.path}`);
      try {
        const result = await auditUrl(browser, url, route.name);
        const reportContent = fs.readFileSync(
          path.join(REPORTS_DIR, `${route.name}.html`),
          "utf-8"
        );
        const finalUrlMatch = reportContent.match(/"finalDisplayedUrl":"([^"]+)"/);
        const finalUrl = finalUrlMatch?.[1] ?? "";
        if (finalUrl.includes("/login")) {
          console.warn(`    \u26A0\uFE0F  Lighthouse audit\xF3 login en vez de ${route.path}`);
          continue;
        }
        results.push(result);
        console.log(`    \u2713 Performance: ${formatScore(result.scores.performance)}`);
      } catch (err) {
        console.error(`    \u2717 Error en ${route.path}:`, err);
      }
    }
  } finally {
    await browser.close();
  }
  printSummary(results);
}
runProtectedAudits().catch(console.error);
