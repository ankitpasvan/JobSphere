import mongoose from 'mongoose';

const atsReportSchema = new mongoose.Schema({
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: false // Can be null for standalone resume analysis
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: false // Only for job-based analysis
  },
  mode: {
    type: String,
    enum: ['job-based', 'general'],
    required: true
  },
  atsScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  keywordAnalysis: {
    matchedKeywords: {
      type: [String],
      default: []
    },
    missingKeywords: {
      type: [String],
      default: []
    }
  },
  sectionAnalysis: {
    hasSkills: {
      type: Boolean,
      default: false
    },
    hasEducation: {
      type: Boolean,
      default: false
    },
    hasExperience: {
      type: Boolean,
      default: false
    },
    hasProjects: {
      type: Boolean,
      default: false
    }
  },
  issues: {
    type: [String],
    default: []
  },
  suggestions: {
    type: [String],
    default: []
  },
  resumeText: {
    type: String,
    required: true // Store the analyzed resume text
  },
  jobDescriptionText: {
    type: String,
    default: '' // Store job description if job-based
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
atsReportSchema.index({ application: 1 });
atsReportSchema.index({ candidate: 1 });
atsReportSchema.index({ job: 1 });
atsReportSchema.index({ atsScore: -1 });
atsReportSchema.index({ createdAt: -1 });

// Virtual for score category
atsReportSchema.virtual('scoreCategory').get(function() {
  if (this.atsScore >= 80) return 'Excellent';
  if (this.atsScore >= 60) return 'Good';
  if (this.atsScore >= 40) return 'Fair';
  return 'Needs Improvement';
});

// Ensure virtuals are included in JSON
atsReportSchema.set('toJSON', { virtuals: true });
atsReportSchema.set('toObject', { virtuals: true });

export default mongoose.model('ATSReport', atsReportSchema);
