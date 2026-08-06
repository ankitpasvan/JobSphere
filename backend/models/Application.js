import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job reference is required']
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Candidate reference is required']
  },
  recruiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recruiter reference is required']
  },
  status: {
    type: String,
    enum: ['Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Rejected', 'Accepted'],
    default: 'Applied'
  },
  aiMatchData: {
    matchScore: { type: Number, min: 0, max: 100 },
    matchingSkills: [String],
    missingSkills: [String],
    recommendation: String,
    analysisReason: String
  },
  resume: String,
  coverLetter: {
    type: String,
    maxlength: [1000, 'Cover letter cannot exceed 1000 characters']
  },
  answers: [{
    question: String,
    answer: String
  }],
  notes: [{
    text: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  statusHistory: [{
    status: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    note: String
  }]
}, {
  timestamps: true
});

// Compound index to prevent duplicate applications
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });
applicationSchema.index({ candidate: 1, status: 1 });
applicationSchema.index({ recruiter: 1, status: 1 });

// Update job applications count after save
applicationSchema.post('save', async function() {
  const Job = mongoose.model('Job');
  const count = await mongoose.model('Application').countDocuments({ job: this.job });
  await Job.findByIdAndUpdate(this.job, { applicationsCount: count });
});

// Update job applications count after delete
applicationSchema.post('deleteOne', async function() {
  const Job = mongoose.model('Job');
  const count = await mongoose.model('Application').countDocuments({ job: this.job });
  await Job.findByIdAndUpdate(this.job, { applicationsCount: count });
});

export default mongoose.model('Application', applicationSchema);
