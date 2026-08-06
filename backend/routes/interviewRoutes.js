import express from 'express';
import {
  scheduleInterview,
  getMyInterviews,
  getRecruiterInterviews,
  getInterviewById,
  updateInterview,
  addInterviewFeedback,
  cancelInterview,
  startMeeting,
  acceptCall,
  declineCall,
  handleCallTimeout
} from '../controllers/interviewController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Candidate routes
router.get('/my-interviews', protect, authorize('candidate'), getMyInterviews);
router.post('/:id/accept-call', protect, authorize('candidate'), acceptCall);
router.post('/:id/decline-call', protect, authorize('candidate'), declineCall);
router.post('/:id/call-timeout', protect, authorize('candidate'), handleCallTimeout);

// Recruiter routes
router.post('/', protect, authorize('recruiter'), scheduleInterview);
router.get('/recruiter-interviews', protect, authorize('recruiter'), getRecruiterInterviews);
router.post('/:id/start', protect, authorize('recruiter'), startMeeting);
router.put('/:id', protect, authorize('recruiter'), updateInterview);
router.post('/:id/feedback', protect, authorize('recruiter'), addInterviewFeedback);
router.delete('/:id', protect, authorize('recruiter'), cancelInterview);

// Common routes
router.get('/:id', protect, getInterviewById);

export default router;
