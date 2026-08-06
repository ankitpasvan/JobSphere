import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema({
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: [true, 'Application reference is required']
  },
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
  title: {
    type: String,
    required: [true, 'Interview title is required']
  },
  type: {
    type: String,
    enum: ['Phone', 'Video', 'In-person', 'Technical', 'HR Round', 'Final Round'],
    default: 'Video'
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  duration: {
    type: Number, // in minutes
    default: 60
  },
  meetingLink: {
    type: String
  },
  location: {
    type: String
  },
  instructions: {
    type: String
  },
  interviewers: [{
    name: String,
    email: String,
    role: String
  }],
  status: {
    type: String,
    enum: ['Scheduled', 'Rescheduled', 'Completed', 'Cancelled', 'No Show', 'In Progress'],
    default: 'Scheduled'
  },
  meetingStartedAt: {
    type: Date
  },
  meetingStatus: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String,
    strengths: [String],
    weaknesses: [String],
    recommendation: {
      type: String,
      enum: ['Strongly Recommend', 'Recommend', 'Maybe', 'Not Recommend']
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: Date
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  // Call tracking fields
  callInitiatedAt: {
    type: Date
  },
  callStatus: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'missed', 'timed_out'],
    default: null
  },
  callEndedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for querying
interviewSchema.index({ candidate: 1, scheduledDate: 1 });
interviewSchema.index({ recruiter: 1, scheduledDate: 1 });
interviewSchema.index({ status: 1, scheduledDate: 1 });

export default mongoose.model('Interview', interviewSchema);
