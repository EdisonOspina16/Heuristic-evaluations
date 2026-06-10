const path = require("path");

module.exports = {
    preset: "ts-jest/presets/default-esm",
    testEnvironment: "node",
    testTimeout: 120000,
    maxWorkers: 1,
    extensionsToTreatAsEsm: [".ts"],
    // globalSetup ahora hace: polyfill Web Streams + login UI + cache token
    globalSetup: path.resolve(__dirname, "setup/globalSetup.js"),
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
    transform: {
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                useESM: true,
                tsconfig: path.resolve(__dirname, "tsconfig.json"),
            },
        ],
    },
    transformIgnorePatterns: [
        "node_modules/(?!(chrome-launcher|@browserbasehq/stagehand|eventsource-parser|@ai-sdk|ai)/)",
    ],
    testMatch: ["**/tests-AI/**/*.test.ts"],
};