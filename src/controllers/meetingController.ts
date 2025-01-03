import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';
import { z } from 'zod';
import { DateTime } from 'luxon';
import { EventEmitter } from 'events';
import { MeetingSchema } from '../schemas/meetingSchema';
import { TimeSlot, DayAvailability, UnavailableSlot } from '../types';

const notifier = new EventEmitter();

const PREDEFINED_SLOTS: TimeSlot[] = [
    { id: 1, start_time: '09:00', end_time: '09:30', duration: 30 },
    { id: 2, start_time: '09:30', end_time: '10:00', duration: 30 },
    { id: 3, start_time: '10:00', end_time: '10:30', duration: 30 },
    { id: 4, start_time: '10:30', end_time: '11:00', duration: 30 },
    { id: 5, start_time: '11:00', end_time: '11:30', duration: 30 },
    { id: 6, start_time: '11:30', end_time: '12:00', duration: 30 },
    { id: 7, start_time: '13:00', end_time: '13:30', duration: 30 },
    { id: 8, start_time: '13:30', end_time: '14:00', duration: 30 },
    { id: 9, start_time: '14:00', end_time: '14:30', duration: 30 },
    { id: 10, start_time: '14:30', end_time: '15:00', duration: 30 },
    { id: 11, start_time: '15:00', end_time: '15:30', duration: 30 },
    { id: 12, start_time: '15:30', end_time: '16:00', duration: 30 },
    { id: 13, start_time: '16:00', end_time: '16:30', duration: 30 },
    { id: 14, start_time: '16:30', end_time: '17:00', duration: 30 }
];

const sendNotification = (type: string, data: any) => {
    console.log(`[NOTIFICATION] ${type}:`, data);
    notifier.emit('notification', { type, data });
};

const convertToUserTimezone = (date: string, time: string, fromZone: string, toZone: string): string => {
    const dateTime = DateTime.fromFormat(`${date} ${time}`, 'yyyy-MM-dd HH:mm', { zone: fromZone });
    return dateTime.setZone(toZone).toFormat('HH:mm');
};

export const createMeeting = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const meeting = MeetingSchema.parse(req.body);
        const slot = PREDEFINED_SLOTS.find(s => s.id === meeting.slot_id);

        if (!slot) {
            res.status(400).json({ error: 'Invalid time slot' });
            return;
        }

        const [conflicts]: any = await pool.execute(
            'SELECT id FROM meetings WHERE date = ? AND slot_id = ? AND (participant = ? OR created_by = ?)',
            [meeting.date, meeting.slot_id, meeting.participant, meeting.user_id]
        );

        if (conflicts.length > 0) {
            res.status(409).json({ error: 'Time slot already booked' });
            return;
        }

        const userStartTime = convertToUserTimezone(
            meeting.date,
            slot.start_time,
            'UTC',
            meeting.timezone
        );

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [result]: any = await connection.execute(
                'INSERT INTO meetings (title, date, slot_id, start_time, end_time, duration, participant, created_by, timezone, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [meeting.title, meeting.date, meeting.slot_id, slot.start_time, slot.end_time, slot.duration, meeting.participant, meeting.user_id, meeting.timezone, meeting.description]
            );

            const newUnavailableSlot = {
                date: meeting.date,
                slot_id: meeting.slot_id
            };

            const [userScheduleExists]: any = await connection.execute(
                'SELECT user_id FROM user_schedules WHERE user_id = ?',
                [meeting.participant]
            );

            if (!userScheduleExists?.[0]) {
                await connection.execute(
                    'INSERT INTO user_schedules (user_id, unavailable_slots) VALUES (?, JSON_ARRAY(CAST(? AS JSON)))',
                    [meeting.participant, JSON.stringify(newUnavailableSlot)]
                );
            } else {
                await connection.execute(
                    `UPDATE user_schedules 
                     SET unavailable_slots = COALESCE(
                         JSON_ARRAY_APPEND(unavailable_slots, '$', CAST(? AS JSON)),
                         JSON_ARRAY(CAST(? AS JSON))
                     )
                     WHERE user_id = ?`,
                    [JSON.stringify(newUnavailableSlot), JSON.stringify(newUnavailableSlot), meeting.participant]
                );
            }

            await connection.commit();

            sendNotification('MEETING_CREATED', {
                meetingId: result.insertId,
                title: meeting.title,
                participant: meeting.participant,
                userStartTime
            });

            const { id: _, ...slotWithoutId } = slot;
            res.status(201).json({
                id: result.insertId,
                ...meeting,
                ...slotWithoutId,
                start_time: userStartTime
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error in createMeeting:', error);
        res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const updateMeeting = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const meetingId = req.params.meetingId;
        const meeting = MeetingSchema.parse(req.body);
        const slot = PREDEFINED_SLOTS.find(s => s.id === meeting.slot_id);

        if (!slot) {
            res.status(400).json({ error: 'Invalid slot_id' });
            return;
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [existingMeeting]: any = await connection.execute(
                'SELECT title, participant, date, slot_id FROM meetings WHERE id = ?',
                [meetingId]
            );

            if (!existingMeeting?.[0]) {
                res.status(404).json({ error: 'Meeting not found' });
                return;
            }

            const { date: oldDate, slot_id: oldSlotId, participant } = existingMeeting[0];

            const [conflicts]: any = await connection.execute(
                'SELECT id FROM meetings WHERE id != ? AND date = ? AND slot_id = ? AND (participant = ? OR created_by = ?)',
                [meetingId, meeting.date, meeting.slot_id, meeting.participant, meeting.user_id]
            );

            if (conflicts.length > 0) {
                res.status(409).json({ error: 'Time slot already booked' });
                return;
            }

            const userStartTime = convertToUserTimezone(
                meeting.date,
                slot.start_time,
                'UTC',
                meeting.timezone
            );

            await connection.execute(
                'UPDATE meetings SET title = ?, date = ?, slot_id = ?, start_time = ?, end_time = ?, duration = ?, timezone = ?, description = ? WHERE id = ?',
                [meeting.title, meeting.date, meeting.slot_id, slot.start_time, slot.end_time, slot.duration, meeting.timezone, meeting.description, meetingId]
            );

            // Remove old slot from unavailable slots
            const oldSlotObj = {
                date: oldDate,
                slot_id: oldSlotId
            };

            await connection.execute(
                `UPDATE user_schedules 
                 SET unavailable_slots = JSON_REMOVE(
                     unavailable_slots, 
                     CONCAT('$[', 
                       JSON_SEARCH(
                         unavailable_slots, 
                         'one', 
                         CAST(? AS JSON),
                         NULL, 
                         '$[*]'
                       ), 
                     ']')
                 )
                 WHERE user_id = ?`,
                [JSON.stringify(oldSlotObj), participant]
            );

            // Add new slot to unavailable slots
            const newSlotObj = {
                date: meeting.date,
                slot_id: meeting.slot_id
            };

            await connection.execute(
                `UPDATE user_schedules 
                 SET unavailable_slots = JSON_ARRAY_APPEND(unavailable_slots, '$', CAST(? AS JSON))
                 WHERE user_id = ?`,
                [JSON.stringify(newSlotObj), participant]
            );

            await connection.commit();

            sendNotification('MEETING_UPDATED', {
                meetingId,
                title: meeting.title,
                participant: meeting.participant,
                userStartTime
            });

            res.json({
                id: meetingId,
                ...meeting,
                start_time: userStartTime
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error in updateMeeting:', error);
        res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const deleteMeeting = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const meetingId = req.params.meetingId;
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const [meeting]: any = await connection.execute(
                'SELECT title, participant, date, slot_id FROM meetings WHERE id = ?',
                [meetingId]
            );

            if (!meeting?.[0]) {
                res.status(404).json({ error: 'Meeting not found' });
                return;
            }

            const { date, slot_id, participant } = meeting[0];

            await connection.execute('DELETE FROM meetings WHERE id = ?', [meetingId]);

            const slotObj = {
                date,
                slot_id
            };

            await connection.execute(
                `UPDATE user_schedules 
                 SET unavailable_slots = JSON_REMOVE(
                     unavailable_slots, 
                     CONCAT('$[', 
                       JSON_SEARCH(
                         unavailable_slots, 
                         'one', 
                         CAST(? AS JSON),
                         NULL, 
                         '$[*]'
                       ), 
                     ']')
                 )
                 WHERE user_id = ?`,
                [JSON.stringify(slotObj), participant]
            );

            await connection.commit();

            sendNotification('MEETING_CANCELLED', {
                meetingId,
                title: meeting[0].title,
                participant: meeting[0].participant
            });

            res.status(204).send();

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error in deleteMeeting:', error);
        res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const getAvailableSlots = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const userId = req.params.userId;

        if (!userId) {
            res.status(400).json({ error: 'User ID is required' });
            return;
        }

        const startDate = req.query.start_date as string || DateTime.now().toISODate();
        const endDate = req.query.end_date as string || DateTime.now().plus({ days: 30 }).toISODate();
        const timezone = req.query.timezone as string || 'UTC';

        const [userSchedule]: any = await pool.execute(
            'SELECT available_days, work_hours, unavailable_slots FROM user_schedules WHERE user_id = ?',
            [userId]
        );

        if (!userSchedule?.[0]) {
            res.status(404).json({ error: 'User schedule not found' });
            return;
        }

        const [bookedSlots]: any = await pool.execute(
            'SELECT date, slot_id FROM meetings WHERE participant = ? OR created_by = ?',
            [userId, userId]
        );

        const availability: DayAvailability[] = [];
        let currentDate = DateTime.fromISO(startDate);
        const end = DateTime.fromISO(endDate);

        const userUnavailableSlots: UnavailableSlot[] = Array.isArray(userSchedule[0].unavailable_slots) 
            ? userSchedule[0].unavailable_slots 
            : [];

        const isSlotUnavailable = (date: string, slotId: number) => {
            return userUnavailableSlots.some(unavailable => 
                unavailable.date === date && unavailable.slot_id === slotId
            );
        };

        while (currentDate <= end) {
            const dateStr = currentDate.toFormat('yyyy-MM-dd');
            const isAvailableDay = userSchedule[0].available_days?.includes(currentDate.weekday);

            if (isAvailableDay) {
                const dayBookings = bookedSlots.filter((booking: any) => booking.date === dateStr);
                const bookedSlotIds = dayBookings.map((booking: any) => booking.slot_id);

                const availableSlots = PREDEFINED_SLOTS
                    .filter(slot => {
                        const slotTime = DateTime.fromFormat(
                            `${dateStr} ${slot.start_time}`, 
                            'yyyy-MM-dd HH:mm', 
                            { zone: 'UTC' }
                        );
                        
                        return slotTime > DateTime.now() && 
                               !bookedSlotIds.includes(slot.id) && 
                               !isSlotUnavailable(dateStr, slot.id);
                    })
                    .map(slot => ({
                        ...slot,
                        start_time: convertToUserTimezone(dateStr, slot.start_time, 'UTC', timezone),
                        end_time: convertToUserTimezone(dateStr, slot.end_time, 'UTC', timezone)
                    }));

                availability.push({
                    date: dateStr,
                    is_available: true,
                    available_slots: availableSlots
                });
            } else {
                availability.push({
                    date: dateStr,
                    is_available: false,
                    available_slots: []
                });
            }

            currentDate = currentDate.plus({ days: 1 });
        }

        res.json({ availability });
    } catch (error) {
        console.error('Error in getAvailableSlots:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};