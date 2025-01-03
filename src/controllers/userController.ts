import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';
import { DateTime } from 'luxon';
import { convertToUserTimezone } from '../helpers';

export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const [users]: any = await pool.execute(
            'SELECT user_id, available_days, work_hours FROM user_schedules'
        );

        res.json({ users });
    } catch (error) {
        console.error('Error in getAllUsers:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const getUserMeetings = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const userId = req.params.userId;
        const startDate = req.query.start_date as string || DateTime.now().toISODate();
        const endDate = req.query.end_date as string || DateTime.now().plus({ days: 30 }).toISODate();

        const [meetings]: any = await pool.execute(
            `SELECT 
                m.*,
                CASE 
                    WHEN m.created_by = ? THEN 'organizer'
                    WHEN m.participant = ? THEN 'participant'
                END as role
            FROM meetings m
            WHERE (m.participant = ? OR m.created_by = ?)
                AND m.date BETWEEN ? AND ?
            ORDER BY m.date ASC, m.start_time ASC`,
            [userId, userId, userId, userId, startDate, endDate]
        );

        res.json({ 
            meetings: meetings.map((meeting: any) => ({
                ...meeting,
                start_time: convertToUserTimezone(
                    meeting.date,
                    meeting.start_time,
                    'UTC',
                    meeting.timezone
                ),
                end_time: convertToUserTimezone(
                    meeting.date,
                    meeting.end_time,
                    'UTC',
                    meeting.timezone
                )
            }))
        });
    } catch (error) {
        console.error('Error in getUserMeetings:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};