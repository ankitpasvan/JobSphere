import axios from 'axios';
import { getApiBaseUrl } from '../utils/urlConfig';

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  register: (data) => api.post('auth/register', data),
  login: (data) => api.post('auth/login', data),
  getMe: () => api.get('auth/me'),
  updateProfile: (data) => api.put('auth/profile', data),
  updatePassword: (data) => api.put('auth/update-password', data),
  forgotPassword: (email) => api.post('auth/forgot-password', { email }),
  resetPassword: (data) => api.post('auth/reset-password', data),
};

// Job API
export const jobAPI = {
  getAllJobs: (params) => api.get('jobs', { params }),
  getJobById: (id) => api.get(`jobs/${id}`),
  createJob: (data) => api.post('jobs', data),
  getMyJobs: (params) => api.get('jobs/recruiter/my-jobs', { params }),
  updateJob: (id, data) => api.put(`jobs/${id}`, data),
  deleteJob: (id) => api.delete(`jobs/${id}`),
  getJobStats: () => api.get('jobs/recruiter/stats'),
};

// Application API
export const applicationAPI = {
  applyForJob: (data) => api.post('applications', data),
  getMyApplications: (params) => api.get('applications/my-applications', { params }),
  getJobApplications: (jobId, params) => api.get(`applications/job/${jobId}`, { params }),
  getApplicationById: (id) => api.get(`applications/${id}`),
  updateApplicationStatus: (id, data) => api.put(`applications/${id}/status`, data),
  addNote: (id, data) => api.post(`applications/${id}/notes`, data),
  withdrawApplication: (id) => api.delete(`applications/${id}`),
  getApplicationStats: () => api.get('applications/stats'),
  analyzeMatch: (jobId) => api.post(`applications/analyze/${jobId}`),
};

// Interview API
export const interviewAPI = {
  scheduleInterview: (data) => api.post('interviews', data),
  getMyInterviews: (params) => api.get('interviews/my-interviews', { params }),
  getRecruiterInterviews: (params) => api.get('interviews/recruiter-interviews', { params }),
  getInterviewById: (id) => api.get(`interviews/${id}`),
  updateInterview: (id, data) => api.put(`interviews/${id}`, data),
  addInterviewFeedback: (id, data) => api.post(`interviews/${id}/feedback`, data),
  cancelInterview: (id) => api.delete(`interviews/${id}`),
  startMeeting: (id) => api.post(`interviews/${id}/start`),
};

// Notification API
export const notificationAPI = {
  getNotifications: (params) => api.get('notifications', { params }),
  getUnreadCount: () => api.get('notifications/unread-count'),
  markAsRead: (id) => api.patch(`notifications/${id}/read`),
  markAllAsRead: () => api.patch('notifications/mark-all-read'),
  deleteNotification: (id) => api.delete(`notifications/${id}`),
  deleteAllRead: () => api.delete('notifications/read/all'),
};



// Mock Interview API — conversational AI interviewer
export const mockInterviewAPI = {
  startInterview: (data) => api.post('mock-interview/start', data),
  nextQuestion: (data) => api.post('mock-interview/next', data),
  saveSession: (data) => api.post('mock-interview/save-session', data),
  getMySessions: () => api.get('mock-interview/my-sessions'),
  getSessionById: (id) => api.get(`mock-interview/${id}`),
  deleteSession: (id) => api.delete(`mock-interview/${id}`),
};

// ATS Resume Analyzer API
export const atsAPI = {
  // Analyze resume text with optional job description
  analyzeText: (data) => api.post('ats/analyze-text', data),
  
  // Upload and analyze PDF resume
  analyzeFile: (formData) => {
    return api.post('ats/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Get ATS report for a specific application
  getReport: (applicationId) => api.get(`ats/report/${applicationId}`),
  
  // Get all ATS reports for current user
  getMyReports: () => api.get('ats/my-reports'),
  
  // Reanalyze an existing application
  reanalyze: (applicationId) => api.post(`ats/reanalyze/${applicationId}`),
};
