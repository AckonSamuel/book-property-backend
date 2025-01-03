"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSchema = void 0;
const zod_1 = require("zod");
exports.UserSchema = zod_1.z.object({
    id: zod_1.z.number().int().optional(),
    email: zod_1.z.string().email(), // Email must be a valid email
    name: zod_1.z.string().min(1), // Name cannot be empty
    role: zod_1.z.enum(['client', 'freelancer']),
    created_at: zod_1.z.string().datetime().optional(),
    updated_at: zod_1.z.string().datetime().optional(),
});
