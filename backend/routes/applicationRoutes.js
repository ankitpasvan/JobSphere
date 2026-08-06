import express from 'express';
import {
  applyForJob,
  getMyApplications,
  getJobApplications,
  getApplicationById,
  updateApplicationStatus,
  addNote,
  withdrawApplication,
  getApplicationStats,
  analyzeJobMatch
} from '../controllers/applicationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * [TalentBridge Intelligence Routes]
 */

// AI analysis route (Candidate)
router.post('/analyze/:jobId', protect, authorize('candidate'), analyzeJobMatch);

// Basic Candidate routes
router.post('/', protect, authorize('candidate'), applyForJob);
router.get('/my-applications', protect, authorize('candidate'), getMyApplications);
router.get('/stats', protect, authorize('candidate'), getApplicationStats);
router.delete('/:id', protect, authorize('candidate'), withdrawApplication);

// Recruiter routes
router.get('/job/:jobId', protect, authorize('recruiter'), getJobApplications);
router.put('/:id/status', protect, authorize('recruiter'), updateApplicationStatus);
router.post('/:id/notes', protect, authorize('recruiter'), addNote);

// Common routes (both candidate and recruiter can view)
router.get('/:id', protect, getApplicationById);

export default router;
