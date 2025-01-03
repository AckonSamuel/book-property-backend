import { z } from 'zod';

export const MeetingSchema = z.object({
    title: z.string().min(1, "Title is required"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    slot_id: z.number().int().min(1),
    user_id: z.string(),
    participant: z.string(),
    timezone: z.string(),
    description: z.string().optional()
});

export type Meeting = z.infer<typeof MeetingSchema>;
