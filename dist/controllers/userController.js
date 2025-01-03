"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserMeetings = exports.getAllUsers = void 0;
const db_1 = __importDefault(require("../config/db"));
const luxon_1 = require("luxon");
const helpers_1 = require("../helpers");
const getAllUsers = async (req, res, next) => {
    try {
        const [users] = await db_1.default.execute('SELECT user_id, available_days, work_hours FROM user_schedules');
        res.json({ users });
    }
    catch (error) {
        console.error('Error in getAllUsers:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};
exports.getAllUsers = getAllUsers;
const getUserMeetings = async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const startDate = req.query.start_date || luxon_1.DateTime.now().toISODate();
        const endDate = req.query.end_date || luxon_1.DateTime.now().plus({ days: 30 }).toISODate();
        const [meetings] = await db_1.default.execute(`SELECT 
                m.*,
                CASE 
                    WHEN m.created_by = ? THEN 'organizer'
                    WHEN m.participant = ? THEN 'participant'
                END as role
            FROM meetings m
            WHERE (m.participant = ? OR m.created_by = ?)
                AND m.date BETWEEN ? AND ?
            ORDER BY m.date ASC, m.start_time ASC`, [userId, userId, userId, userId, startDate, endDate]);
        res.json({
            meetings: meetings.map((meeting) => ({
                ...meeting,
                start_time: (0, helpers_1.convertToUserTimezone)(meeting.date, meeting.start_time, 'UTC', meeting.timezone),
                end_time: (0, helpers_1.convertToUserTimezone)(meeting.date, meeting.end_time, 'UTC', meeting.timezone)
            }))
        });
    }
    catch (error) {
        console.error('Error in getUserMeetings:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};
exports.getUserMeetings = getUserMeetings;
