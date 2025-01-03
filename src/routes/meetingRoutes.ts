import express from 'express';
import { createMeeting, getAvailableSlots, updateMeeting, deleteMeeting } from '../controllers/meetingController';
import { getAllUsers, getUserMeetings } from '../controllers/userController';

const router = express.Router();

/**
 * @swagger
 * /meetings:
 *   post:
 *     summary: Create a new meeting
 *     tags: [Meetings]
 *     description: Creates a new meeting with a specified title, date, slot, and participants.
 *     operationId: createMeeting
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - date
 *               - slot_id
 *               - participant
 *               - user_id
 *               - timezone
 *             properties:
 *               title:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               slot_id:
 *                 type: integer
 *               participant:
 *                 type: string
 *               user_id:
 *                 type: string
 *               timezone:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Successfully created a new meeting
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 title:
 *                   type: string
 *                 date:
 *                   type: string
 *                 slot_id:
 *                   type: integer
 *                 participant:
 *                   type: string
 *                 user_id:
 *                   type: string
 *                 start_time:
 *                   type: string
 *       '400':
 *         description: Invalid input data
 *       '409':
 *         description: Time slot already booked
 */
router.post('/meetings', createMeeting);

/**
 * @swagger
 * /users/{userId}/available-slots:
 *   get:
 *     summary: Get available slots for a user
 *     tags: [Users]
 *     description: Retrieves the available time slots for a user between the specified date range.
 *     operationId: getAvailableSlots
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user for whom to get available slots.
 *       - in: query
 *         name: start_date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: timezone
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successfully retrieved available slots
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 availability:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       is_available:
 *                         type: boolean
 *                       available_slots:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             start_time:
 *                               type: string
 *                             end_time:
 *                               type: string
 *       '400':
 *         description: Missing userId or invalid parameters
 *       '404':
 *         description: User schedule not found
 */
router.get('/users/:userId/available-slots', getAvailableSlots);

/**
 * @swagger
 * /meetings/{meetingId}:
 *   put:
 *     summary: Update an existing meeting
 *     tags: [Meetings]
 *     description: Updates the details of an existing meeting, including title, date, slot, and participants.
 *     operationId: updateMeeting
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the meeting to update.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - date
 *               - slot_id
 *               - participant
 *               - user_id
 *               - timezone
 *             properties:
 *               title:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               slot_id:
 *                 type: integer
 *               participant:
 *                 type: string
 *               user_id:
 *                 type: string
 *               timezone:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Successfully updated the meeting
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 title:
 *                   type: string
 *                 date:
 *                   type: string
 *                 slot_id:
 *                   type: integer
 *                 participant:
 *                   type: string
 *                 user_id:
 *                   type: string
 *                 start_time:
 *                   type: string
 *       '400':
 *         description: Invalid input or meeting not found
 *       '409':
 *         description: Time slot already booked
 */
router.put('/meetings/:meetingId', updateMeeting);// Update meeting endpoint

/**
 * @swagger
 * /meetings/{meetingId}:
 *   delete:
 *     summary: Delete an existing meeting
 *     tags: [Meetings]
 *     description: Deletes a meeting based on its ID.
 *     operationId: deleteMeeting
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the meeting to delete.
 *     responses:
 *       '204':
 *         description: Successfully deleted the meeting
 *       '404':
 *         description: Meeting not found
 */
router.delete('/meetings/:meetingId', deleteMeeting); // Delete meeting endpoint


/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     description: Retrieves a list of all users along with their available days and work hours.
 *     operationId: getAllUsers
 *     responses:
 *       '200':
 *         description: Successfully retrieved the users' data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: string
 *                       available_days:
 *                         type: string
 *                       work_hours:
 *                         type: string
 *       '500':
 *         description: Internal server error
 */
router.get('/users', getAllUsers);

/**
 * @swagger
 * /users/{userId}/meetings:
 *   get:
 *     summary: Get meetings for a user
 *     tags: [Users]
 *     description: Retrieves a list of meetings for a specific user, with optional date range filters.
 *     operationId: getUserMeetings
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to retrieve meetings for.
 *       - in: query
 *         name: start_date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: The start date for fetching meetings (defaults to today).
 *       - in: query
 *         name: end_date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: The end date for fetching meetings (defaults to 30 days from today).
 *     responses:
 *       '200':
 *         description: Successfully retrieved the user's meetings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 meetings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       date:
 *                         type: string
 *                         format: date
 *                       start_time:
 *                         type: string
 *                       end_time:
 *                         type: string
 *                       role:
 *                         type: string
 *                         description: The user's role in the meeting (e.g., 'organizer' or 'participant').
 *       '500':
 *         description: Internal server error
 *       '400':
 *         description: Invalid date format or missing parameters
 */
router.get('/users/:userId/meetings', getUserMeetings);

export default router;
