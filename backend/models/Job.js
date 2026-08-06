import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a job title'],
    trim: true,
    maxlength: [100, 'Job title cannot exceed 100 characters']
  },
  company: {
    type: String,
    required: [true, 'Please provide company name'],
    trim: true
  },
  companyLogo: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    required: [true, 'Please provide job description']
  },
  requirements: {
    type: [String],
    required: [true, 'Please provide job requirements']
  },
  responsibilities: {
    type: [String],
    required: [true, 'Please provide job responsibilities']
  },
  skills: {
    type: [String],
    required: [true, 'Please provide required skills']
  },
  experience: {
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 0
    }
  },
  salary: {
    min: {
      type: Number,
      required: [true, 'Please provide minimum salary/stipend']
    },
    max: {
      type: Number,
      required: [true, 'Please provide maximum salary/stipend']
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  location: {
    type: String,
    required: [true, 'Please provide job location']
  },
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'],
    default: 'Full-time'
  },
  isPaid: {
    type: Boolean,
    default: true
  },
  duration: {
    type: String,
    default: 'Permanent'
  },
  workMode: {
    type: String,
    enum: ['On-site', 'Remote', 'Hybrid'],
    default: 'On-site'
  },
  category: {
    type: String,
    required: [true, 'Please provide job category'],
    enum: [
      'Software Development',
      'Data Science',
      'Design',
      'Marketing',
      'Sales',
      'HR',
      'Finance',
      'Operations',
      'Customer Support',
      'Other'
    ]
  },
  applicationDeadline: {
    type: Date,
    required: [true, 'Please provide application deadline']
  },
  openings: {
    type: Number,
    default: 1,
    min: [1, 'Minimum 1 opening required']
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Closed', 'On Hold'],
    default: 'Active'
  },
  applicationsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for search optimization
jobSchema.index({ title: 'text', company: 'text', description: 'text' });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ postedBy: 1 });

export default mongoose.model('Job', jobSchema);
