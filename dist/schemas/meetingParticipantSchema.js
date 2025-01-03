"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingParticipantSchema = void 0;
const zod_1 = require("zod");
exports.MeetingParticipantSchema = zod_1.z.object({
    meeting_id: zod_1.z.number().int(),
    user_id: zod_1.z.number().int(),
});
