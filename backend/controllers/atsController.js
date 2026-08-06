import ATSReport from '../models/ATSReport.js';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import { analyzeResume } from '../utils/atsAnalyzer.js';
import fs from 'fs';
import mongoose from 'mongoose';

/**
 * Helper function to parse PDF - handles errors gracefully
 */
async function parsePDF(filePath) {
  try {
    // Import the parser implementation directly to avoid pdf-parse index debug mode in ESM.
    const pdfParseModule = await import('pdf-parse/lib/pdf-parse.js');
    const pdfParse = pdfParseModule.default || pdfParseModule;
    
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    
    if (!data || !data.text || data.text.trim().length === 0) {
      throw new Error('PDF contains no readable text');
    }
    
    return data;
  } catch (error) {
    console.error('PDF Parse Error:', error.message);
    throw new Error('Could not extract text from PDF. The file may be corrupted, password-protected, or contain only images.');
  }
}

/**
 * @desc    Analyze resume with optional job description
 * @route   POST /api/ats/analyze
 * @access  Private (Candidate or Recruiter)
 * @body    { resumeText?, resumeFile?, jobDescription?, applicationId?, jobId? }
 */
export const analyzeResumeController = async (req, res) => {
  try {
    const { resumeText, jobDescription, applicationId, jobId } = req.body;
    const userId = req.user.id;

    // Validate ObjectIds if provided
    if (applicationId && !mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID format'
      });
    }

    if (jobId && !mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }

    let finalResumeText = resumeText;
    let jobDescriptionText = jobDescription || '';
    let application = null;
    let job = null;

    // If applicationId provided, fetch the application
    if (applicationId) {
      application = await Application.findById(applicationId)
        .populate('job')
        .populate('candidate');

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      // Check authorization
      if (application.candidate._id.toString() !== userId && 
          application.recruiter.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to analyze this application'
        });
      }

      // Get job description from application's job
      if (application.job) {
        job = application.job;
        jobDescriptionText = `${job.title}\n\n${job.description}\n\nRequired Skills: ${job.skills.join(', ')}\n\nResponsibilities:\n${job.responsibilities.join('\n')}`;
      }

      // Get resume text from candidate profile if not provided
      if (!finalResumeText && application.candidate.profile.resume) {
        // If resume is a file path, try to read it
        const resumePath = application.candidate.profile.resume;
        if (fs.existsSync(resumePath)) {
          try {
            const pdfData = await parsePDF(resumePath);
            finalResumeText = pdfData.text;
          } catch (error) {
            console.error('Error parsing resume PDF:', error);
          }
        }
      }
    }

    // If jobId provided, fetch job
    if (jobId && !job) {
      job = await Job.findById(jobId);
      if (job) {
        jobDescriptionText = `${job.title}\n\n${job.description}\n\nRequired Skills: ${job.skills.join(', ')}\n\nResponsibilities:\n${job.responsibilities.join('\n')}`;
      }
    }

    // If resume file uploaded (handle multer upload)
    if (req.file && !finalResumeText) {
      try {
        console.log('📄 Attempting to parse PDF:', req.file.originalname);
        console.log('   File path:', req.file.path);
        console.log('   File size:', req.file.size, 'bytes');
        
        const pdfData = await parsePDF(req.file.path);
        finalResumeText = pdfData.text;
        
        console.log('✅ PDF parsed successfully!');
        console.log('   Extracted text length:', finalResumeText.length, 'characters');
        
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
      } catch (error) {
        console.error('❌ PDF parsing failed:', error.message);
        
        // Clean up file even on error
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        return res.status(400).json({
          success: false,
          message: error.message || 'Could not read your PDF file. Please make sure it contains readable text and is not password-protected.'
        });
      }
    }

    // Validate resume text
    if (!finalResumeText || finalResumeText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Resume text is empty or could not be extracted from the PDF'
      });
    }

    console.log('Starting ATS analysis...');
    console.log('Resume length:', finalResumeText.length);
    console.log('Has job description:', !!jobDescriptionText);

    // Perform ATS analysis
    console.log('Running analysis logic...');
    const analysisResult = analyzeResume(finalResumeText, jobDescriptionText || null);
    console.log('Analysis complete. Score:', analysisResult.atsScore);

    // Save ATS report to database
    const atsReport = await ATSReport.create({
      application: applicationId || null,
      candidate: userId,
      job: job ? job._id : null,
      mode: analysisResult.mode,
      atsScore: analysisResult.atsScore,
      keywordAnalysis: analysisResult.keywordAnalysis,
      sectionAnalysis: analysisResult.sectionAnalysis,
      issues: analysisResult.issues,
      suggestions: analysisResult.suggestions,
      resumeText: finalResumeText,
      jobDescriptionText: jobDescriptionText || ''
    });

    // If this is for an application, update the application with ATS data
    if (application) {
      application.aiMatchData = {
        matchScore: analysisResult.atsScore,
        matchingSkills: analysisResult.keywordAnalysis.matchedKeywords,
        missingSkills: analysisResult.keywordAnalysis.missingKeywords,
        recommendation: analysisResult.atsScore >= 70 ? 'Strong Match' : 
                       analysisResult.atsScore >= 50 ? 'Moderate Match' : 'Weak Match',
        analysisReason: `ATS Score: ${analysisResult.atsScore}/100. ${analysisResult.suggestions[0] || ''}`
      };
      await application.save();
    }

    res.status(200).json(analysisResult);

  } catch (error) {
    console.error('CRITICAL: ATS Analysis Error');
    console.error('Stack Trace:', error.stack);
    
    // Provide more specific error messages for database issues
    let errorMessage = 'Failed to analyze resume';
    if (error.name === 'ValidationError') {
      errorMessage = `Validation Error: ${Object.values(error.errors).map(e => e.message).join(', ')}`;
    } else if (error.name === 'CastError') {
      errorMessage = 'Database format error. Please check your inputs.';
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get ATS report for an application
 * @route   GET /api/ats/report/:applicationId
 * @access  Private (Candidate or Recruiter of the application)
 */
export const getATSReport = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.id;

    // Find the application first to check authorization
    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check authorization
    if (application.candidate.toString() !== userId && 
        application.recruiter.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this report'
      });
    }

    // Find the most recent ATS report for this application
    const atsReport = await ATSReport.findOne({ application: applicationId })
      .sort({ createdAt: -1 })
      .populate('candidate', 'name email')
      .populate('job', 'title company');

    if (!atsReport) {
      return res.status(404).json({
        success: false,
        message: 'No ATS report found for this application'
      });
    }

    res.status(200).json({
      success: true,
      data: atsReport
    });

  } catch (error) {
    console.error('Get ATS Report Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve ATS report',
      error: error.message
    });
  }
};

/**
 * @desc    Get all ATS reports for current user
 * @route   GET /api/ats/my-reports
 * @access  Private
 */
export const getMyATSReports = async (req, res) => {
  try {
    const userId = req.user.id;

    const reports = await ATSReport.find({ candidate: userId })
      .sort({ createdAt: -1 })
      .populate('job', 'title company')
      .populate('application', 'status');

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });

  } catch (error) {
    console.error('Get My ATS Reports Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve ATS reports',
      error: error.message
    });
  }
};

/**
 * @desc    Reanalyze an existing application
 * @route   POST /api/ats/reanalyze/:applicationId
 * @access  Private (Candidate or Recruiter)
 */
export const reanalyzeResume = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.id;

    // Find the application
    const application = await Application.findById(applicationId)
      .populate('job')
      .populate('candidate');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check authorization
    if (application.candidate._id.toString() !== userId && 
        application.recruiter.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reanalyze this application'
      });
    }

    // Prepare job description
    const job = application.job;
    const jobDescriptionText = `${job.title}\n\n${job.description}\n\nRequired Skills: ${job.skills.join(', ')}\n\nResponsibilities:\n${job.responsibilities.join('\n')}`;

    // Get resume text
    let resumeText = '';
    if (application.candidate.profile.resume) {
      const resumePath = application.candidate.profile.resume;
      if (fs.existsSync(resumePath)) {
        try {
          const pdfData = await parsePDF(resumePath);
          resumeText = pdfData.text;
        } catch (error) {
          console.error('Error parsing resume PDF:', error);
          return res.status(400).json({
            success: false,
            message: 'Failed to parse resume PDF'
          });
        }
      }
    }

    if (!resumeText) {
      return res.status(400).json({
        success: false,
        message: 'Resume not found for this candidate'
      });
    }

    // Perform ATS analysis
    const analysisResult = analyzeResume(resumeText, jobDescriptionText);

    // Create new ATS report
    const atsReport = await ATSReport.create({
      application: applicationId,
      candidate: application.candidate._id,
      job: job._id,
      mode: analysisResult.mode,
      atsScore: analysisResult.atsScore,
      keywordAnalysis: analysisResult.keywordAnalysis,
      sectionAnalysis: analysisResult.sectionAnalysis,
      issues: analysisResult.issues,
      suggestions: analysisResult.suggestions,
      resumeText: resumeText,
      jobDescriptionText: jobDescriptionText
    });

    // Update application with new ATS data
    application.aiMatchData = {
      matchScore: analysisResult.atsScore,
      matchingSkills: analysisResult.keywordAnalysis.matchedKeywords,
      missingSkills: analysisResult.keywordAnalysis.missingKeywords,
      recommendation: analysisResult.atsScore >= 70 ? 'Strong Match' : 
                     analysisResult.atsScore >= 50 ? 'Moderate Match' : 'Weak Match',
      analysisReason: `ATS Score: ${analysisResult.atsScore}/100. ${analysisResult.suggestions[0] || ''}`
    };
    await application.save();

    res.status(200).json(analysisResult);

  } catch (error) {
    console.error('Reanalyze Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reanalyze resume',
      error: error.message
    });
  }
};

/**
 * @desc    Analyze resume text directly (standalone - no application)
 * @route   POST /api/ats/analyze-text
 * @access  Private
 */
export const analyzeResumeText = async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    const userId = req.user.id;

    if (!resumeText) {
      return res.status(400).json({
        success: false,
        message: 'Resume text is required'
      });
    }

    // Perform ATS analysis
    const analysisResult = analyzeResume(resumeText, jobDescription || null);

    // Save to database for history
    await ATSReport.create({
      candidate: userId,
      mode: analysisResult.mode,
      atsScore: analysisResult.atsScore,
      keywordAnalysis: analysisResult.keywordAnalysis,
      sectionAnalysis: analysisResult.sectionAnalysis,
      issues: analysisResult.issues,
      suggestions: analysisResult.suggestions,
      resumeText: resumeText,
      jobDescriptionText: jobDescription || ''
    });

    // Return strict JSON format as specified
    res.status(200).json(analysisResult);

  } catch (error) {
    console.error('ATS Text Analysis Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze resume',
      error: error.message
    });
  }
};
