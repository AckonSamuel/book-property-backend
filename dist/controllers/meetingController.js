"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableSlots = exports.deleteMeeting = exports.updateMeeting = exports.createMeeting = void 0;
const db_1 = __importDefault(require("../config/db"));
const luxon_1 = require("luxon");
const events_1 = require("events");
const meetingSchema_1 = require("../schemas/meetingSchema");
const helpers_1 = require("../helpers");
const notifier = new events_1.EventEmitter();
const PREDEFINED_SLOTS = [
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
const sendNotification = (type, data) => {
    console.log(`[NOTIFICATION] ${type}:`, data);
    notifier.emit('notification', { type, data });
};
// Helper function to update user schedules
const updateUserSchedules = async (connection, slotObj, userIds, operation) => {
    for (const userId of userIds) {
        if (operation === 'add') {
            const [userScheduleExists] = await connection.execute('SELECT user_id FROM user_schedules WHERE user_id = ?', [userId]);
            if (!userScheduleExists?.[0]) {
                await connection.execute('INSERT INTO user_schedules (user_id, unavailable_slots) VALUES (?, JSON_ARRAY(CAST(? AS JSON)))', [userId, JSON.stringify(slotObj)]);
            }
            else {
                await connection.execute(`UPDATE user_schedules 
                     SET unavailable_slots = COALESCE(
                         JSON_ARRAY_APPEND(unavailable_slots, '$', CAST(? AS JSON)),
                         JSON_ARRAY(CAST(? AS JSON))
                     )
                     WHERE user_id = ?`, [JSON.stringify(slotObj), JSON.stringify(slotObj), userId]);
            }
        }
        else {
            await connection.execute(`UPDATE user_schedules 
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
                 WHERE user_id = ?`, [JSON.stringify(slotObj), userId]);
        }
    }
};
const createMeeting = async (req, res, next) => {
    try {
        const meeting = meetingSchema_1.MeetingSchema.parse(req.body);
        const slot = PREDEFINED_SLOTS.find(s => s.id === meeting.slot_id);
        if (!slot) {
            res.status(400).json({ error: 'Invalid time slot' });
            return;
        }
        const [conflicts] = await db_1.default.execute('SELECT id FROM meetings WHERE date = ? AND slot_id = ? AND (participant = ? OR created_by = ?)', [meeting.date, meeting.slot_id, meeting.participant, meeting.user_id]);
        if (conflicts.length > 0) {
            res.status(409).json({ error: 'Time slot already booked' });
            return;
        }
        const userStartTime = (0, helpers_1.convertToUserTimezone)(meeting.date, slot.start_time, 'UTC', meeting.timezone);
        const connection = await db_1.default.getConnection();
        try {
            await connection.beginTransaction();
            const [result] = await connection.execute('INSERT INTO meetings (title, date, slot_id, start_time, end_time, duration, participant, created_by, timezone, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [meeting.title, meeting.date, meeting.slot_id, slot.start_time, slot.end_time, slot.duration, meeting.participant, meeting.user_id, meeting.timezone, meeting.description]);
            const newUnavailableSlot = {
                date: meeting.date,
                slot_id: meeting.slot_id
            };
            await updateUserSchedules(connection, newUnavailableSlot, [meeting.participant, meeting.user_id], 'add');
            await connection.commit();
            sendNotification('MEETING_CREATED', {
                meetingId: result.insertId,
                title: meeting.title,
                participant: meeting.participant,
                user_id: meeting.user_id,
                userStartTime
            });
            const { id: _, ...slotWithoutId } = slot;
            res.status(201).json({
                id: result.insertId,
                ...meeting,
                ...slotWithoutId,
                user_id: meeting.user_id,
                start_time: userStartTime
            });
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    catch (error) {
        console.error('Error in createMeeting:', error);
        res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};
exports.createMeeting = createMeeting;
const updateMeeting = async (req, res, next) => {
    try {
        const meetingId = req.params.meetingId;
        const meeting = meetingSchema_1.MeetingSchema.parse(req.body);
        const slot = PREDEFINED_SLOTS.find(s => s.id === meeting.slot_id);
        if (!slot) {
            res.status(400).json({ error: 'Invalid slot_id' });
            return;
        }
        const connection = await db_1.default.getConnection();
        try {
            await connection.beginTransaction();
            const [existingMeeting] = await connection.execute('SELECT title, participant, created_by, date, slot_id FROM meetings WHERE id = ?', [meetingId]);
            if (!existingMeeting?.[0]) {
                res.status(404).json({ error: 'Meeting not found' });
                return;
            }
            const { date: oldDate, slot_id: oldSlotId, participant, created_by } = existingMeeting[0];
            const [conflicts] = await connection.execute('SELECT id FROM meetings WHERE id != ? AND date = ? AND slot_id = ? AND (participant = ? OR created_by = ?)', [meetingId, meeting.date, meeting.slot_id, meeting.participant, meeting.user_id]);
            if (conflicts.length > 0) {
                res.status(409).json({ error: 'Time slot already booked' });
                return;
            }
            const userStartTime = (0, helpers_1.convertToUserTimezone)(meeting.date, slot.start_time, 'UTC', meeting.timezone);
            await connection.execute('UPDATE meetings SET title = ?, date = ?, slot_id = ?, start_time = ?, end_time = ?, duration = ?, timezone = ?, description = ? WHERE id = ?', [meeting.title, meeting.date, meeting.slot_id, slot.start_time, slot.end_time, slot.duration, meeting.timezone, meeting.description, meetingId]);
            // Remove old slot from both users' schedules
            const oldSlotObj = {
                date: oldDate,
                slot_id: oldSlotId
            };
            await updateUserSchedules(connection, oldSlotObj, [participant, created_by], 'remove');
            // Add new slot to both users' schedules
            const newSlotObj = {
                date: meeting.date,
                slot_id: meeting.slot_id
            };
            await updateUserSchedules(connection, newSlotObj, [participant, created_by], 'add');
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
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    catch (error) {
        console.error('Error in updateMeeting:', error);
        res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};
exports.updateMeeting = updateMeeting;
const deleteMeeting = async (req, res, next) => {
    try {
        const meetingId = req.params.meetingId;
        const connection = await db_1.default.getConnection();
        try {
            await connection.beginTransaction();
            const [meeting] = await connection.execute('SELECT title, participant, created_by, date, slot_id FROM meetings WHERE id = ?', [meetingId]);
            if (!meeting?.[0]) {
                res.status(404).json({ error: 'Meeting not found' });
                return;
            }
            const { date, slot_id, participant, created_by } = meeting[0];
            await connection.execute('DELETE FROM meetings WHERE id = ?', [meetingId]);
            const slotObj = {
                date,
                slot_id
            };
            await updateUserSchedules(connection, slotObj, [participant, created_by], 'remove');
            await connection.commit();
            sendNotification('MEETING_CANCELLED', {
                meetingId,
                title: meeting[0].title,
                participant: meeting[0].participant
            });
            res.status(204).send();
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    catch (error) {
        console.error('Error in deleteMeeting:', error);
        res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};
exports.deleteMeeting = deleteMeeting;
const getAvailableSlots = async (req, res, next) => {
    try {
        const userId = req.params.userId;
        if (!userId) {
            res.status(400).json({ error: 'User ID is required' });
            return;
        }
        const startDate = req.query.start_date || luxon_1.DateTime.now().toISODate();
        const endDate = req.query.end_date || luxon_1.DateTime.now().plus({ days: 30 }).toISODate();
        const timezone = req.query.timezone || 'UTC';
        const [userSchedule] = await db_1.default.execute('SELECT available_days, work_hours, unavailable_slots FROM user_schedules WHERE user_id = ?', [userId]);
        if (!userSchedule?.[0]) {
            res.status(404).json({ error: 'User schedule not found' });
            return;
        }
        const [bookedSlots] = await db_1.default.execute('SELECT date, slot_id FROM meetings WHERE participant = ? OR created_by = ?', [userId, userId]);
        const availability = [];
        let currentDate = luxon_1.DateTime.fromISO(startDate);
        const end = luxon_1.DateTime.fromISO(endDate);
        const userUnavailableSlots = Array.isArray(userSchedule[0].unavailable_slots)
            ? userSchedule[0].unavailable_slots
            : [];
        const isSlotUnavailable = (date, slotId) => {
            return userUnavailableSlots.some(unavailable => unavailable.date === date && unavailable.slot_id === slotId);
        };
        while (currentDate <= end) {
            const dateStr = currentDate.toFormat('yyyy-MM-dd');
            const isAvailableDay = userSchedule[0].available_days?.includes(currentDate.weekday);
            if (isAvailableDay) {
                const dayBookings = bookedSlots.filter((booking) => booking.date === dateStr);
                const bookedSlotIds = dayBookings.map((booking) => booking.slot_id);
                const availableSlots = PREDEFINED_SLOTS
                    .filter(slot => {
                    const slotTime = luxon_1.DateTime.fromFormat(`${dateStr} ${slot.start_time}`, 'yyyy-MM-dd HH:mm', { zone: 'UTC' });
                    return slotTime > luxon_1.DateTime.now() &&
                        !bookedSlotIds.includes(slot.id) &&
                        !isSlotUnavailable(dateStr, slot.id);
                })
                    .map(slot => ({
                    ...slot,
                    start_time: (0, helpers_1.convertToUserTimezone)(dateStr, slot.start_time, 'UTC', timezone),
                    end_time: (0, helpers_1.convertToUserTimezone)(dateStr, slot.end_time, 'UTC', timezone)
                }));
                availability.push({
                    date: dateStr,
                    is_available: true,
                    available_slots: availableSlots
                });
            }
            else {
                availability.push({
                    date: dateStr,
                    is_available: false,
                    available_slots: []
                });
            }
            currentDate = currentDate.plus({ days: 1 });
        }
        res.json({ availability });
    }
    catch (error) {
        console.error('Error in getAvailableSlots:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};
exports.getAvailableSlots = getAvailableSlots;
