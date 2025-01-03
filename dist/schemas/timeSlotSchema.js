"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeSlotSchema = void 0;
const zod_1 = require("zod");
exports.TimeSlotSchema = zod_1.z.object({
    id: zod_1.z.number().int().optional(),
    available_start_time: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/), // Matches a valid time string (HH:mm)
    available_end_time: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/), // Matches a valid time string (HH:mm)
    created_at: zod_1.z.string().datetime().optional(),
});
