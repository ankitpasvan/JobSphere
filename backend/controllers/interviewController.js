import Interview from '../models/Interview.js';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import Notification from '../models/Notification.js';
import { sendMeetingStartEmail } from '../utils/emailService.js';
import User from '../models/User.js';

const getFrontendBaseUrl = (req) => {
  const configuredUrl = (process.env.PUBLIC_FRONTEND_URL || process.env.FRONTEND_URL || '').trim();
  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, '');
  }

  const requestOrigin = req.get('origin');
  if (requestOrigin) {
    return requestOrigin.replace(/\/+$/, '');
  }

  return '';
};

const buildInterviewLink = (req, interviewId) => {
  const baseUrl = getFrontendBaseUrl(req);
  return baseUrl ? `${baseUrl}/interview/${interviewId}` : `/interview/${interviewId}`;
};

// @desc    Schedule an interview
// @route   POST /api/interviews
// @access  Private (Recruiter only)
export const scheduleInterview = async (req, res) => {
  try {
    const {
      applicationId,
      title,
      type,
      scheduledDate,
      duration,
      meetingLink,
      location,
      instructions,
      interviewers
    } = req.body;

    // Check if application exists
    const application = await Application.findById(applicationId)
      .populate('job')
      .populate('candidate');

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
        message: 'Not authorized to schedule interview for this application'
      });
    }

    // Create interview
    const interview = await Interview.create({
      application: applicationId,
      job: application.job._id,
      candidate: application.candidate._id,
      recruiter: req.user.id,
      title,
      type,
      scheduledDate,
      duration,
      meetingLink: meetingLink || '',
      location,
      instructions,
      interviewers
    });

    interview.meetingLink = buildInterviewLink(req, interview._id);
    await interview.save();

    // Update application status
    application.status = 'Interview Scheduled';
    application.statusHistory.push({
      status: 'Interview Scheduled',
      changedBy: req.user.id,
      changedAt: new Date(),
      note: `Interview scheduled for ${new Date(scheduledDate).toLocaleString()}`
    });
    await application.save();

    await interview.populate([
      { path: 'candidate', select: 'name email phone' },
      { path: 'job', select: 'title company' }
    ]);

    // Create notification for candidate
    const io = req.app.get('io');
    const candidateId = application.candidate._id.toString();
    
    try {
      const notification = await Notification.create({
        userId: candidateId,
        type: 'interview_scheduled',
        title: '📅 Interview Scheduled!',
        message: `Your interview for ${application.job.title} has been scheduled for ${new Date(scheduledDate).toLocaleString()}`,
        interviewId: interview._id,
        isRead: false
      });

      // Send real-time notification to candidate
      if (io) {
        io.to(candidateId).emit('new-notification', {
          notification: {
            _id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            interviewId: interview._id,
            isRead: false,
            createdAt: notification.createdAt
          }
        });
      }
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
      // Don't fail the whole request if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Interview scheduled successfully',
      interview,
      meetingLink: interview.meetingLink
    });
  } catch (error) {
    console.error('Schedule interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error scheduling interview',
      error: error.message
    });
  }
};

// @desc    Get interviews for candidate
// @route   GET /api/interviews/my-interviews
// @access  Private (Candidate only)
export const getMyInterviews = async (req, res) => {
  try {
    const { status, upcoming, page = 1, limit = 10 } = req.query;

    const query = { candidate: req.user.id };
    
    if (status) {
      query.status = status;
    }

    if (upcoming === 'true') {
      query.scheduledDate = { $gte: new Date() };
      query.status = { $in: ['Scheduled', 'Rescheduled'] };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const interviews = await Interview.find(query)
      .populate('job', 'title company location')
      .populate('recruiter', 'name email company')
      .sort('scheduledDate')
      .skip(skip)
      .limit(limitNum);

    const total = await Interview.countDocuments(query);

    res.status(200).json({
      success: true,
      count: interviews.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      interviews
    });
  } catch (error) {
    console.error('Get my interviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching interviews',
      error: error.message
    });
  }
};

// @desc    Get interviews scheduled by recruiter
// @route   GET /api/interviews/recruiter-interviews
// @access  Private (Recruiter only)
export const getRecruiterInterviews = async (req, res) => {
  try {
    const { status, upcoming, page = 1, limit = 10 } = req.query;

    const query = { recruiter: req.user.id };
    
    if (status) {
      query.status = status;
    }

    if (upcoming === 'true') {
      query.scheduledDate = { $gte: new Date() };
      query.status = { $in: ['Scheduled', 'Rescheduled'] };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const interviews = await Interview.find(query)
      .populate('candidate', 'name email phone profile')
      .populate('job', 'title company')
      .populate('application', 'status')
      .sort('scheduledDate')
      .skip(skip)
      .limit(limitNum);

    const total = await Interview.countDocuments(query);

    res.status(200).json({
      success: true,
      count: interviews.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      interviews
    });
  } catch (error) {
    console.error('Get recruiter interviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching interviews',
      error: error.message
    });
  }
};

// @desc    Get single interview
// @route   GET /api/interviews/:id
// @access  Private (Candidate or Recruiter)
export const getInterviewById = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('candidate', 'name email phone profile')
      .populate('recruiter', 'name email company')
      .populate('job')
      .populate('application');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check authorization
    if (
      interview.candidate._id.toString() !== req.user.id &&
      interview.recruiter._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this interview'
      });
    }

    res.status(200).json({
      success: true,
      interview
    });
  } catch (error) {
    console.error('Get interview by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching interview',
      error: error.message
    });
  }
};

// @desc    Update interview
// @route   PUT /api/interviews/:id
// @access  Private (Recruiter only)
export const updateInterview = async (req, res) => {
  try {
    let interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    if (interview.recruiter.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this interview'
      });
    }

    const oldDate = interview.scheduledDate;
    const isRescheduling = req.body.scheduledDate && req.body.scheduledDate !== interview.scheduledDate.toISOString();
    
    // If rescheduling
    if (isRescheduling) {
      req.body.status = 'Rescheduled';
    }

    interview = await Interview.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate([
      { path: 'candidate', select: 'name email' },
      { path: 'recruiter', select: 'name' },
      { path: 'job', select: 'title company' }
    ]);

    // Send notification if rescheduled
    if (isRescheduling) {
      const io = req.app.get('io');
      const candidateId = interview.candidate._id.toString();
      
      const notification = await Notification.create({
        userId: candidateId,
        type: 'interview_rescheduled',
        title: '📅 Interview Rescheduled',
        message: `Your interview for ${interview.job.title} has been rescheduled to ${new Date(interview.scheduledDate).toLocaleString()}`,
        interviewId: interview._id,
        isRead: false
      });

      // Send real-time notification
      if (io) {
        io.to(candidateId).emit('new-notification', {
          notification: {
            _id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            interviewId: interview._id,
            isRead: false,
            createdAt: notification.createdAt
          }
        });
        
        io.to(candidateId).emit('interview-rescheduled', {
          interviewId: interview._id,
          oldDate: oldDate,
          newDate: interview.scheduledDate,
          jobTitle: interview.job.title
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Interview updated successfully',
      interview
    });
  } catch (error) {
    console.error('Update interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating interview',
      error: error.message
    });
  }
};

// @desc    Add feedback to interview
// @route   POST /api/interviews/:id/feedback
// @access  Private (Recruiter only)
export const addInterviewFeedback = async (req, res) => {
  try {
    const { rating, comments, strengths, weaknesses, recommendation } = req.body;

    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    if (interview.recruiter.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add feedback to this interview'
      });
    }

    interview.feedback = {
      rating,
      comments,
      strengths,
      weaknesses,
      recommendation,
      addedBy: req.user.id,
      addedAt: new Date()
    };

    interview.status = 'Completed';
    await interview.save();

    res.status(200).json({
      success: true,
      message: 'Feedback added successfully',
      interview
    });
  } catch (error) {
    console.error('Add feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding feedback',
      error: error.message
    });
  }
};

// @desc    Cancel interview
// @route   DELETE /api/interviews/:id
// @access  Private (Recruiter only)
export const cancelInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    if (interview.recruiter.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this interview'
      });
    }

    interview.status = 'Cancelled';
    await interview.save();

    res.status(200).json({
      success: true,
      message: 'Interview cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling interview',
      error: error.message
    });
  }
};

// @desc    Start meeting (notify candidate)
// @route   POST /api/interviews/:id/start
// @access  Private (Recruiter only)
export const startMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const recruiterId = req.user.id;

    // Get io instance from app
    const io = req.app.get('io');

    const interview = await Interview.findById(id)
      .populate('candidate', 'name email')
      .populate('recruiter', 'name')
      .populate('job', 'title');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Verify recruiter owns this interview
    if (interview.recruiter._id.toString() !== recruiterId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to start this interview'
      });
    }

    // Update interview status and call tracking
    interview.meetingStatus = 'in_progress';
    interview.meetingStartedAt = new Date();
    interview.status = 'In Progress';
    interview.callInitiatedAt = new Date();
    interview.callStatus = 'pending';
    await interview.save();

    const candidateId = interview.candidate._id.toString();
    const candidateEmail = interview.candidate.email;
    const candidateName = interview.candidate.name;
    const recruiterName = interview.recruiter.name;
    const jobTitle = interview.job?.title || 'Position';
    const meetingLink = buildInterviewLink(req, id);

    // Create notification in database
    const notification = await Notification.create({
      userId: candidateId,
      type: 'meeting_start',
      title: '🔴 Interview Starting Now!',
      message: `${recruiterName} is waiting for you in the interview room for ${jobTitle}`,
      interviewId: id,
      meetingLink,
      recruiterName,
      jobTitle,
      isRead: false
    });

    // Send real-time Socket.IO notification with timeout info
    if (io) {
      const expiresAt = new Date(Date.now() + 60000); // 60 seconds from now
      io.to(candidateId).emit('call-notification', {
        interviewId: id,
        recruiterName,
        jobTitle,
        meetingLink,
        notificationId: notification._id,
        expiresAt: expiresAt.toISOString(),
        callTimeout: 60000 // milliseconds
      });

      io.to(candidateId).emit('new-notification', {
        notification: {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          interviewId: id,
          meetingLink,
          recruiterName,
          jobTitle,
          isRead: false,
          createdAt: notification.createdAt
        }
      });
    }

    // Send email notification
    try {
      await sendMeetingStartEmail(
        candidateEmail,
        candidateName,
        jobTitle,
        recruiterName,
        meetingLink,
        id
      );
      interview.notificationSent = true;
      await interview.save();
    } catch (emailError) {
      console.error('Error sending meeting start email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Meeting started and candidate notified',
      interview: {
        _id: interview._id,
        meetingStatus: interview.meetingStatus,
        meetingStartedAt: interview.meetingStartedAt,
        notificationSent: interview.notificationSent
      },
      notification
    });
  } catch (error) {
    console.error('Start meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting meeting',
      error: error.message
    });
  }
};

// @desc    Accept incoming call
// @route   POST /api/interviews/:id/accept-call
// @access  Private (Candidate only)
export const acceptCall = async (req, res) => {
  try {
    const { id } = req.params;
    const candidateId = req.user.id;

    // Get io instance from app
    const io = req.app.get('io');

    const interview = await Interview.findById(id)
      .populate('recruiter', 'name')
      .populate('candidate', 'name');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Verify candidate owns this interview
    if (interview.candidate._id.toString() !== candidateId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept this call'
      });
    }

    // Update call status
    interview.callStatus = 'accepted';
    interview.callEndedAt = new Date();
    await interview.save();

    // Notify recruiter that call was accepted
    if (io) {
      io.to(interview.recruiter._id.toString()).emit('call-accepted', {
        interviewId: id,
        candidateName: interview.candidate.name,
        message: 'Candidate is joining the interview'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Call accepted',
      interview: {
        _id: interview._id,
        callStatus: interview.callStatus
      }
    });
  } catch (error) {
    console.error('Accept call error:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting call',
      error: error.message
    });
  }
};

// @desc    Decline incoming call
// @route   POST /api/interviews/:id/decline-call
// @access  Private (Candidate only)
export const declineCall = async (req, res) => {
  try {
    const { id } = req.params;
    const candidateId = req.user.id;

    // Get io instance from app
    const io = req.app.get('io');

    const interview = await Interview.findById(id)
      .populate('recruiter', 'name')
      .populate('candidate', 'name');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Verify candidate owns this interview
    if (interview.candidate._id.toString() !== candidateId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to decline this call'
      });
    }

    // Update call status
    interview.callStatus = 'declined';
    interview.callEndedAt = new Date();
    interview.meetingStatus = 'scheduled';
    interview.status = 'Scheduled';
    await interview.save();

    // Notify recruiter that call was declined
    if (io) {
      io.to(interview.recruiter._id.toString()).emit('call-declined', {
        interviewId: id,
        candidateName: interview.candidate.name,
        message: 'Candidate declined the call'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Call declined',
      interview: {
        _id: interview._id,
        callStatus: interview.callStatus
      }
    });
  } catch (error) {
    console.error('Decline call error:', error);
    res.status(500).json({
      success: false,
      message: 'Error declining call',
      error: error.message
    });
  }
};

// @desc    Handle call timeout
// @route   POST /api/interviews/:id/call-timeout
// @access  Private (Candidate only)
export const handleCallTimeout = async (req, res) => {
  try {
    const { id } = req.params;
    const candidateId = req.user.id;

    // Get io instance from app
    const io = req.app.get('io');

    const interview = await Interview.findById(id)
      .populate('recruiter', 'name')
      .populate('candidate', 'name');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Verify candidate owns this interview
    if (interview.candidate._id.toString() !== candidateId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Only update if still pending (prevent race conditions)
    if (interview.callStatus === 'pending') {
      interview.callStatus = 'timed_out';
      interview.callEndedAt = new Date();
      interview.meetingStatus = 'scheduled';
      interview.status = 'Scheduled';
      await interview.save();

      // Notify recruiter that call timed out
      if (io) {
        io.to(interview.recruiter._id.toString()).emit('call-timeout', {
          interviewId: id,
          candidateName: interview.candidate.name,
          message: 'Candidate did not answer the call'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Call timed out',
        interview: {
          _id: interview._id,
          callStatus: interview.callStatus
        }
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'Call already handled',
        interview: {
          _id: interview._id,
          callStatus: interview.callStatus
        }
      });
    }
  } catch (error) {
    console.error('Call timeout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error handling timeout',
      error: error.message
    });
  }
};
