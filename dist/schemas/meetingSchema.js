"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingSchema = void 0;
const zod_1 = require("zod");
exports.MeetingSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Title is required"),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    slot_id: zod_1.z.number().int().min(1),
    user_id: zod_1.z.string(),
    participant: zod_1.z.string(),
    timezone: zod_1.z.string(),
    description: zod_1.z.string().optional()
});
