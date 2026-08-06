import express from 'express';
import {
  createJob,
  getAllJobs,
  getJobById,
  getMyJobs,
  updateJob,
  deleteJob,
  getJobStats
} from '../controllers/jobController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllJobs);
router.get('/:id', getJobById);

// Protected routes - Recruiter only
router.post('/', protect, authorize('recruiter'), createJob);
router.get('/recruiter/my-jobs', protect, authorize('recruiter'), getMyJobs);
router.get('/recruiter/stats', protect, authorize('recruiter'), getJobStats);
router.put('/:id', protect, authorize('recruiter'), updateJob);
router.delete('/:id', protect, authorize('recruiter'), deleteJob);

export default router;
