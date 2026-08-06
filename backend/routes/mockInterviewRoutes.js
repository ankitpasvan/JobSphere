import express from 'express';
import {
  startInterview,
  nextQuestion,
  saveSession,
  getMySessions,
  getSessionById,
  deleteSession
} from '../controllers/mockInterviewController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Conversational AI Interview Routes (Candidate only)
router.post('/start', protect, authorize('candidate'), startInterview);
router.post('/next', protect, authorize('candidate'), nextQuestion);
router.post('/save-session', protect, authorize('candidate'), saveSession);
router.get('/my-sessions', protect, authorize('candidate'), getMySessions);
router.get('/:id', protect, authorize('candidate'), getSessionById);
router.delete('/:id', protect, authorize('candidate'), deleteSession);

export default router;
