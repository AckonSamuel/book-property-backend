"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const EnvSchema = zod_1.z.object({
    DB_HOST: zod_1.z.string(),
    DB_USER: zod_1.z.string(),
    DB_PASSWORD: zod_1.z.string(),
    DB_NAME: zod_1.z.string(),
    PORT: zod_1.z.string().optional().default('3000'),
    DB_PORT: zod_1.z.string(),
    DB_URL: zod_1.z.string()
});
const env = EnvSchema.parse(process.env);
exports.default = env;
