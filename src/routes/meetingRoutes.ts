import express from 'express';
import { createMeeting, getAvailableSlots, updateMeeting, deleteMeeting } from '../controllers/meetingController';
import { getAllUsers, getUserMeetings } from '../controllers/userController';

const router = express.Router();

//meetings
router.post('/meetings', createMeeting);
router.get('/users/:userId/available-slots', getAvailableSlots);
router.put('/meetings/:meetingId', updateMeeting);   // Update meeting endpoint
router.delete('/meetings/:meetingId', deleteMeeting); // Delete meeting endpoint

//user
router.get('/users', getAllUsers);
router.get('/users/:userId/meetings', getUserMeetings);

export default router;
