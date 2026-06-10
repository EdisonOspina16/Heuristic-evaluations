import dotenv from "dotenv";
dotenv.config();

export const stagehandConfig = {
    env: "LOCAL" as const,
    model: "ollama/llama3.2:3b",
    localBrowserLaunchOptions: {
        headless: false,
    },
};

export const BASE_URL = process.env.BASE_URL || "http://localhost:3000";