import dotenv from 'dotenv';
dotenv.config(); // Must be FIRST — ESM imports hoist before module body runs

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import atsRoutes from './routes/atsRoutes.js';

import mockInterviewRoutes from './routes/mockInterviewRoutes.js';

import http from 'http';
import { Server } from 'socket.io';

// --- Connect to Database ---
connectDB();

const app = express();
const server = http.createServer(app);

const parseAllowedOrigins = () => {
  const environmentOrigins = [process.env.FRONTEND_URL, process.env.FRONTEND_URLS]
    .filter(Boolean)
    .flatMap((value) => value.split(','))
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [...new Set([
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    ...environmentOrigins
  ])];
};

const allowedOrigins = parseAllowedOrigins();

// Initialize Socket.io with optimized settings for Render
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'], // Support both, but client will favor websocket
  path: '/socket.io/'
});

// Make io instance available to controllers
app.set('io', io);

// --- Socket signaling logic ---
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Users join their own ID room to receive direct notifications
  socket.on('register-user', (userId) => {
    socket.join(userId);
    console.log(`User registered in private room: ${userId}`);
  });

  // Recruiter triggers a call to a specific candidate
  socket.on('initiate-call', ({ targetUserId, recruiterName, interviewId, jobTitle }) => {
    console.log(`Call initiated from ${recruiterName} to ${targetUserId}`);
    socket.to(targetUserId).emit('call-notification', {
      recruiterName,
      interviewId,
      jobTitle
    });
  });

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.roomId = roomId; // Store roomId on socket for disconnect cleanup
    console.log(`User ${socket.id} joined room ${roomId}`);
    
    // Get list of existing users in the room (excluding current user)
    const clients = io.sockets.adapter.rooms.get(roomId);
    const participantCount = clients ? clients.size : 0;
    
    // Tell the joining user if someone is already there
    socket.emit('joined-room', { 
      roomId, 
      participantCount,
      otherParticipants: Array.from(clients || []).filter(id => id !== socket.id)
    });
    
    // Tell existing users that someone new joined
    socket.to(roomId).emit('user-connected', socket.id);
  });

  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.id} left room ${roomId}`);
    socket.to(roomId).emit('user-disconnected', socket.id);
  });

  socket.on('offer', ({ offer, roomId }) => {
    socket.to(roomId).emit('offer', { offer, senderId: socket.id });
  });

  socket.on('answer', ({ answer, roomId }) => {
    socket.to(roomId).emit('answer', { answer, senderId: socket.id });
  });

  socket.on('ice-candidate', ({ candidate, roomId }) => {
    socket.to(roomId).emit('ice-candidate', { candidate, senderId: socket.id });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket.roomId) {
      socket.to(socket.roomId).emit('user-disconnected', socket.id);
    }
  });
});

// --- Rate Limiting (Brute Force Protection) ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // Increased for development flexibility
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again in 15 minutes.' }
});

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS Policy block'), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// --- Security & Body Parsing Layer ---
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(hpp());
app.use(xss());

// --- API Routing Node ---
app.use('/api/auth', authLimiter, authRoutes); // Rate-limited auth routes
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ats', atsRoutes); // ATS Resume Analyzer routes

app.use('/api/mock-interview', mockInterviewRoutes);

// --- Health Check / Ping Endpoint for Cron Jobs ---
app.get('/api/ping', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is active',
    timestamp: new Date().toISOString()
  });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    // Never expose internal error details in production
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred.'
      : err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`>>> TalentBridge API running on port ${PORT} | ENV: ${process.env.NODE_ENV || 'development'}`);
});
