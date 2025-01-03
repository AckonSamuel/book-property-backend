import app from './app';
import env from './utils/env';

const PORT = parseInt(env.PORT, 10);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


// import express, { Request, Response } from 'express';
// import cors from 'cors';
// import mysql from 'mysql2/promise';
// import { z } from 'zod';

// // Initialize Express App
// const app = express();
// app.use(cors());
// app.use(express.json());

// // Database Connection Pool
// const pool = mysql.createPool({
//   host: 'localhost',
//   user: 'root',
//   password: 'password',
//   database: 'scheduling_db'
// });

// // Zod Schema for Meeting Validation
// const MeetingSchema = z.object({
//   title: z.string().min(1),
//   date: z.string().refine((value) => !isNaN(Date.parse(value)), {
//     message: 'Invalid date format',
//   }),
//   duration: z.number().int().min(15).max(180),
//   participant: z.string().email(),
// });

// type Meeting = z.infer<typeof MeetingSchema>;

// // Create a new meeting
// app.post('/meetings', async (req: Request, res: Response) => {
//   try {
//     const meetingData = MeetingSchema.parse(req.body);
//     const [result]: any = await pool.execute(
//       'INSERT INTO meetings (title, date, duration, participant) VALUES (?, ?, ?, ?)',
//       [meetingData.title, meetingData.date, meetingData.duration, meetingData.participant]
//     );

//     console.log(`Meeting scheduled: ${meetingData.title}`);
//     res.status(201).json({ id: result.insertId, ...meetingData });
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// });

// // Get available slots
// app.get('/users/:userId/available-slots', async (req: Request, res: Response) => {
//   const userId = req.params.userId;
//   const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

//   try {
//     // Get booked slots for the given date
//     const [bookedSlots]: any = await pool.execute(
//       'SELECT date, duration FROM meetings WHERE DATE(date) = ? AND (participant = ? OR userId = ?)',
//       [date, userId, userId]
//     );

//     const slots: string[] = [];
//     const startHour = 9;
//     const endHour = 17;

//     for (let hour = startHour; hour < endHour; hour++) {
//       for (let minute of [0, 30]) {
//         const slotTime = new Date(`${date}T${hour}:${minute}:00Z`);
//         const isBooked = bookedSlots.some((booking: any) => {
//           const bookingStart = new Date(booking.date);
//           const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60000);
//           return slotTime >= bookingStart && slotTime < bookingEnd;
//         });

//         if (!isBooked) {
//           slots.push(slotTime.toISOString());
//         }
//       }
//     }

//     res.json({ available_slots: slots });
//   } catch (error: any) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Update a meeting
// app.put('/meetings/:meetingId', async (req: Request, res: Response) => {
//   try {
//     const meetingData = MeetingSchema.parse(req.body);
//     const meetingId = req.params.meetingId;

//     await pool.execute(
//       'UPDATE meetings SET title = ?, date = ?, duration = ?, participant = ? WHERE id = ?',
//       [meetingData.title, meetingData.date, meetingData.duration, meetingData.participant, meetingId]
//     );

//     console.log(`Meeting updated: ID ${meetingId}`);
//     res.json({ id: meetingId, ...meetingData });
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// });

// // Delete a meeting
// app.delete('/meetings/:meetingId', async (req: Request, res: Response) => {
//   try {
//     const meetingId = req.params.meetingId;

//     await pool.execute('DELETE FROM meetings WHERE id = ?', [meetingId]);

//     console.log(`Meeting cancelled: ID ${meetingId}`);
//     res.status(204).send();
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// });

// // Start the server
// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
