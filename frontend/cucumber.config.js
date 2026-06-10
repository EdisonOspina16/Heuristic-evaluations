process.env.TS_NODE_PROJECT = "tests/bdd/support/tsconfig.bdd.json";
process.env.TS_NODE_TRANSPILE_ONLY = "true";
process.env.TS_NODE_FILES = "true";

module.exports = {
    default: {
        paths: ["tests/bdd/features/**/*.feature"],
        require: [
            "tests/bdd/support/world.ts",
            "tests/bdd/support/hooks.ts",
            "tests/bdd/steps/**/*.ts",
        ],
        requireModule: ["ts-node/register"],
        format: ["progress-bar", "@serenity-js/cucumber"],
        publishQuiet: false,
    },
};