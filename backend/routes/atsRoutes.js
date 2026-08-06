import express from 'express';
import { 
  analyzeResumeController, 
  getATSReport, 
  getMyATSReports, 
  reanalyzeResume,
  analyzeResumeText 
} from '../controllers/atsController.js';
import { protect } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/temp/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only PDF files
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

/**
 * @route   POST /api/ats/analyze
 * @desc    Analyze resume with optional job description
 * @access  Private
 * @body    Form-data with: resumeFile (optional), resumeText (optional), jobDescription (optional), applicationId (optional), jobId (optional)
 */
router.post('/analyze', protect, upload.single('resumeFile'), analyzeResumeController);

/**
 * @route   POST /api/ats/analyze-text
 * @desc    Analyze resume text directly (no file upload)
 * @access  Private
 * @body    { resumeText: string, jobDescription?: string }
 */
router.post('/analyze-text', protect, analyzeResumeText);

/**
 * @route   GET /api/ats/report/:applicationId
 * @desc    Get ATS report for a specific application
 * @access  Private (Candidate or Recruiter)
 */
router.get('/report/:applicationId', protect, getATSReport);

/**
 * @route   GET /api/ats/my-reports
 * @desc    Get all ATS reports for current user
 * @access  Private
 */
router.get('/my-reports', protect, getMyATSReports);

/**
 * @route   POST /api/ats/reanalyze/:applicationId
 * @desc    Reanalyze an existing application
 * @access  Private (Candidate or Recruiter)
 */
router.post('/reanalyze/:applicationId', protect, reanalyzeResume);

export default router;
