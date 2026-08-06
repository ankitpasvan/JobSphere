import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['candidate', 'recruiter'], required: true },
  phone: { type: String },
  avatar: { type: String },
  company: {
    name: { type: String },
    website: { type: String },
    location: { type: String },
    description: { type: String },
    industry: { type: String },
    employeeCount: { type: String }
  },
  profile: {
    bio: { type: String },
    skills: [String],
    resume: { type: String },
    resumeLink: { type: String, default: '' },
    professionalSummary: { type: String },
    location: { type: String },
    linkedin: { type: String },
    github: { type: String },
    education: [{
      school: String,
      degree: String,
      year: String
    }],
    experience: [{
      company: String,
      role: String,
      duration: String,
      description: String
    }],
    projects: [{
      title: String,
      technologies: String,
      date: String,
      description: String
    }],
    aiAnalysis: {
      extractedSkills: [String],
      summary: String,
      isProcessed: { type: Boolean, default: false },
      lastProcessed: Date
    }
  },
  otp: { type: String },
  otpExpires: { type: Date }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare user password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.generateToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
};

const User = mongoose.model('User', userSchema);
export default User;
