import Application from '../models/Application.js';
import Job from '../models/Job.js';
import MockInterview from '../models/MockInterview.js';
import mongoose from 'mongoose';
import { matchWithJob } from '../utils/aiService.js';


// @desc    Apply for a job
// @route   POST /api/applications
// @access  Private (Candidate only)
export const applyForJob = async (req, res) => {
  try {
    const { jobId, coverLetter, answers } = req.body;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if job is active
    if (job.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'This job is no longer accepting applications'
      });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      job: jobId,
      candidate: req.user.id
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    // Create application
    const application = await Application.create({
      job: jobId,
      candidate: req.user.id,
      recruiter: job.postedBy,
      coverLetter,
      answers,
      resume: req.user.profile?.resume,
      statusHistory: [{
        status: 'Applied',
        changedBy: req.user.id,
        changedAt: new Date()
      }]
    });

    // (AI Interaction) Execute AI Talent Matching logic
    try {
       console.log(`[AI Interaction] Analyzing synergy between ${req.user.name} and ${job.title}...`);
       const matchResult = await matchWithJob(req.user, job);
       
       application.aiMatchData = {
         matchScore: matchResult.matchScore || 0,
         matchingSkills: matchResult.matchingSkills || [],
         missingSkills: matchResult.missingSkills || [],
         recommendation: matchResult.recommendation || 'Review',
         analysisReason: matchResult.analysisReason || 'Synergy analysis completed via AI core.'
       };
       
       await application.save();
       console.log(`[AI Success] Match Score: ${application.aiMatchData.matchScore}%`);
    } catch (err) {
       console.error('[AI Error] Skill matching failed:', err.message);
    }

    await application.populate([
      { path: 'job', select: 'title company location jobType' },
      { path: 'candidate', select: 'name email phone profile' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application
    });
  } catch (error) {
    console.error('Apply for job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting application',
      error: error.message
    });
  }
};

// @desc    Get all applications for a candidate
// @route   GET /api/applications/my-applications
// @access  Private (Candidate only)
export const getMyApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { candidate: req.user.id };
    if (status) {
      query.status = status;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const applications = await Application.find(query)
      .populate('job', 'title company location jobType salary workMode status')
      .populate('recruiter', 'name email company')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum);

    const total = await Application.countDocuments(query);

    res.status(200).json({
      success: true,
      count: applications.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      applications
    });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
};

// @desc    Get applications for a specific job (Recruiter)
// @route   GET /api/applications/job/:jobId
// @access  Private (Recruiter only)
export const getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    let query = {};

    if (jobId === 'all') {
      // Recruiter fetching ALL apps across all their jobs
      query = { recruiter: new mongoose.Types.ObjectId(req.user.id) };
    } else {
      // Check if specific job exists and belongs to recruiter
      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      if (job.postedBy.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view applications for this job'
        });
      }
      query = { job: new mongoose.Types.ObjectId(jobId) };
    }

    if (status) {
      query.status = status;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const applications = await Application.find(query)
      .populate('candidate', 'name email phone profile')
      .populate('job', 'title company location')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum);

    const total = await Application.countDocuments(query);

    // Get status counts
    const statusCounts = await Application.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Gather Candidate AI Mock Scores automatically
    const appData = await Promise.all(applications.map(async (app) => {
      const plainApp = app.toObject();
      if (plainApp.candidate && plainApp.candidate._id) {
        const mockStats = await MockInterview.aggregate([
          { $match: { user: plainApp.candidate._id, status: 'Completed' } },
          { $group: { _id: null, avgScore: { $avg: '$overallScore' } } }
        ]);
        if (mockStats.length > 0) {
           plainApp.candidate.aiMockScore = Math.round(mockStats[0].avgScore);
        }
      }
      return plainApp;
    }));

    res.status(200).json({
      success: true,
      count: applications.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      statusCounts,
      applications: appData
    });
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
};

// @desc    Get single application details
// @route   GET /api/applications/:id
// @access  Private (Candidate or Recruiter)
export const getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job')
      .populate('candidate', 'name email phone profile')
      .populate('recruiter', 'name email company')
      .populate('notes.addedBy', 'name')
      .populate('statusHistory.changedBy', 'name');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check authorization
    if (
      application.candidate._id.toString() !== req.user.id &&
      application.recruiter._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this application'
      });
    }

    res.status(200).json({
      success: true,
      application
    });
  } catch (error) {
    console.error('Get application by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching application',
      error: error.message
    });
  }
};

// @desc    Update application status (Recruiter)
// @route   PUT /api/applications/:id/status
// @access  Private (Recruiter only)
export const updateApplicationStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    console.log(`[Status Update Request] AppID: ${req.params.id} | New Status: ${status} | By: ${req.user.id}`);

    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if recruiter owns the job
    if (application.recruiter.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this application'
      });
    }

    // Update status and add to history
    application.status = status;
    application.statusHistory.push({
      status,
      changedBy: req.user.id,
      changedAt: new Date(),
      note
    });

    await application.save();

    await application.populate([
      { path: 'candidate', select: 'name email phone' },
      { path: 'job', select: 'title company' },
      { path: 'recruiter', select: 'name' }
    ]);

    // Send Status Update Email
    try {
      if (application.candidate?.email) {
        import('../utils/emailService.js').then(({ sendStatusUpdateEmail }) => {
          sendStatusUpdateEmail(
            application.candidate.email,
            application.candidate.name,
            application.job.title,
            status,
            application.recruiter?.name || 'Recruiter'
          ).catch(err => console.error('Status Email Error:', err));
        }).catch(err => console.error('Error importing email service:', err));
      }
    } catch (err) {
       console.error('Email Notification Error:', err.message);
    }

    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      application
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating application status',
      error: error.message
    });
  }
};

// @desc    Add note to application (Recruiter)
// @route   POST /api/applications/:id/notes
// @access  Private (Recruiter only)
export const addNote = async (req, res) => {
  try {
    const { text } = req.body;

    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    if (application.recruiter.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add notes to this application'
      });
    }

    application.notes.push({
      text,
      addedBy: req.user.id,
      addedAt: new Date()
    });

    await application.save();

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      application
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding note',
      error: error.message
    });
  }
};

// @desc    Withdraw application (Candidate)
// @route   DELETE /api/applications/:id
// @access  Private (Candidate only)
export const withdrawApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    if (application.candidate.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to withdraw this application'
      });
    }

    await application.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Application withdrawn successfully'
    });
  } catch (error) {
    console.error('Withdraw application error:', error);
    res.status(500).json({
      success: false,
      message: 'Error withdrawing application',
      error: error.message
    });
  }
};

// @desc    Get application statistics (Candidate)
// @route   GET /api/applications/stats
// @access  Private (Candidate only)
export const getApplicationStats = async (req, res) => {
  try {
    const stats = await Application.aggregate([
      {
        $match: { candidate: req.user._id }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await Application.countDocuments({ candidate: req.user.id });

    res.status(200).json({
      success: true,
      total,
      stats
    });
  } catch (error) {
    console.error('Get application stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching application statistics',
      error: error.message
    });
  }
};

// @desc    Analyze match before applying (Pre-submission)
// @route   POST /api/applications/analyze/:jobId
// @access  Private (Candidate only)
export const analyzeJobMatch = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const matchResult = await matchWithJob(req.user, job);

    res.status(200).json({
      success: true,
      data: matchResult
    });
  } catch (error) {
    console.error('Pre-apply analysis error:', error);
    res.status(500).json({ success: false, message: 'Matching analysis failed' });
  }
};
