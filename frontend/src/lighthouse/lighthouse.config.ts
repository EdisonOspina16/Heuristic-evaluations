import type { Config } from "lighthouse";

export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export const LIGHTHOUSE_CONFIG: Config = {
    extends: "lighthouse:default",
    settings: {
        formFactor: "desktop",
        screenEmulation: {
            mobile: false,
            width: 1350,
            height: 940,
            deviceScaleFactor: 1,
            disabled: false,
        },
        throttling: {
            rttMs: 40,
            throughputKbps: 10240,
            cpuSlowdownMultiplier: 1,
        },
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
        skipAudits: ["benchmarkIndex"],
    },
};

export const PAGES = {
    public: [
        { name: "login", path: "/login" },
        { name: "register", path: "/register" },
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
        { name: "evaluacion", path: "/evaluacion/1" },
    ],
};