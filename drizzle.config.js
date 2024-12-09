"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var drizzle_kit_1 = require("drizzle-kit");
var env_1 = require("./src/env");
exports.default = (0, drizzle_kit_1.defineConfig)({
    dialect: "postgresql",
    schema: "./src/db/schema/index.ts",
    out: "./src/db/migrations",
    dbCredentials: {
        url: env_1.default.DB_URL
    },
    verbose: true,
    strict: true
});
