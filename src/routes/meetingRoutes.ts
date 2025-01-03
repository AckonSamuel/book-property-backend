import express from 'express';
import { createMeeting, getAvailableSlots, updateMeeting, deleteMeeting } from '../controllers/meetingController';

const router = express.Router();

router.post('/meetings', createMeeting);
router.get('/users/:userId/available-slots', getAvailableSlots);
router.put('/meetings/:meetingId', updateMeeting);   // Update meeting endpoint
router.delete('/meetings/:meetingId', deleteMeeting); // Delete meeting endpoint

export default router;
