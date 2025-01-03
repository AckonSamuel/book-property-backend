"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const env_1 = __importDefault(require("../utils/env"));
const pool = promise_1.default.createPool({
    host: env_1.default.DB_HOST,
    user: env_1.default.DB_USER,
    password: env_1.default.DB_PASSWORD,
    database: env_1.default.DB_NAME,
    port: Number(env_1.default.DB_PORT), // Convert port to number
});
exports.default = pool;
