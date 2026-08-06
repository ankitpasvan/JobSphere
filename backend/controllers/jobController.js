import Job from '../models/Job.js';
import { validationResult } from 'express-validator';

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Private (Recruiter only)
export const createJob = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const jobData = {
      ...req.body,
      postedBy: req.user.id,
      company: req.user.company?.name || req.body.company
    };

    const job = await Job.create(jobData);

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      job
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating job',
      error: error.message
    });
  }
};

// @desc    Get all jobs (with filters)
// @route   GET /api/jobs
// @access  Public
export const getAllJobs = async (req, res) => {
  try {
    const {
      keyword,
      location,
      category,
      jobType,
      workMode,
      minSalary,
      maxSalary,
      page = 1,
      limit = 10,
      sort = '-createdAt'
    } = req.query;

    // Build query
    const query = { status: 'Active' };

    if (keyword) {
      query.$text = { $search: keyword };
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (category) {
      query.category = category;
    }

    if (jobType) {
      query.jobType = jobType;
    }

    if (workMode) {
      query.workMode = workMode;
    }

    if (minSalary || maxSalary) {
      query['salary.min'] = {};
      if (minSalary) query['salary.min'].$gte = Number(minSalary);
      if (maxSalary) query['salary.max'].$lte = Number(maxSalary);
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const jobs = await Job.find(query)
      .populate('postedBy', 'name email company')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Job.countDocuments(query);

    res.status(200).json({
      success: true,
      count: jobs.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      jobs
    });
  } catch (error) {
    console.error('Get all jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs',
      error: error.message
    });
  }
};

// @desc    Get single job by ID
// @route   GET /api/jobs/:id
// @access  Public
export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'name email company phone');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.status(200).json({
      success: true,
      job
    });
  } catch (error) {
    console.error('Get job by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job',
      error: error.message
    });
  }
};

// @desc    Get jobs posted by logged in recruiter
// @route   GET /api/jobs/my-jobs
// @access  Private (Recruiter only)
export const getMyJobs = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { postedBy: req.user.id };
    if (status) {
      query.status = status;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const jobs = await Job.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum);

    const total = await Job.countDocuments(query);

    res.status(200).json({
      success: true,
      count: jobs.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      jobs
    });
  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs',
      error: error.message
    });
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (Recruiter only - own jobs)
export const updateJob = async (req, res) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user is the job poster
    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this job'
      });
    }

    job = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      job
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating job',
      error: error.message
    });
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Recruiter only - own jobs)
export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user is the job poster
    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this job'
      });
    }

    await job.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting job',
      error: error.message
    });
  }
};

// @desc    Get job statistics
// @route   GET /api/jobs/stats
// @access  Private (Recruiter only)
export const getJobStats = async (req, res) => {
  try {
    const stats = await Job.aggregate([
      {
        $match: { postedBy: req.user._id }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalApplications: { $sum: '$applicationsCount' }
        }
      }
    ]);

    const totalJobs = await Job.countDocuments({ postedBy: req.user.id });

    res.status(200).json({
      success: true,
      totalJobs,
      stats
    });
  } catch (error) {
    console.error('Get job stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job statistics',
      error: error.message
    });
  }
};
