import mongoose from 'mongoose';

const mockInterviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobRole: {
    type: String,
    required: true
  },
  questions: [String],
  results: [{
    question: String,
    answer: String,
    score: Number,
    feedback: String,
    improvement: String
  }],
  overallScore: {
    type: Number,
    default: 0
  },
  summary: String,
  status: {
    type: String,
    enum: ['In Progress', 'Completed'],
    default: 'In Progress'
  }
}, {
  timestamps: true
});

export default mongoose.model('MockInterview', mockInterviewSchema);
