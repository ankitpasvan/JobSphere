import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Dashboards
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';

// Core Nodes
import Profile from './pages/Profile';

// Candidate Operational Nodes
import BrowseJobs from './pages/candidate/BrowseJobs';
import MyApplications from './pages/candidate/MyApplications';
import MockInterview from './pages/candidate/MockInterview';
import ATSAnalyzer from './pages/candidate/ATSAnalyzer';


// Recruiter Control Nodes
import ManageJobs from './pages/recruiter/ManageJobs';
import PostJob from './pages/recruiter/PostJob';
import ViewApplications from './pages/recruiter/ViewApplications';
import InterviewRoom from './pages/InterviewRoom';

import ModuleInitialization from './components/ModuleInitialization';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Common Internal Routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['candidate', 'recruiter']}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Candidate Internal Routing */}
            <Route
              path="/candidate/dashboard"
              element={
                <ProtectedRoute allowedRoles={['candidate']}>
                  <CandidateDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/jobs"
              element={
                <ProtectedRoute allowedRoles={['candidate']}>
                  <BrowseJobs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/applications"
              element={
                <ProtectedRoute allowedRoles={['candidate']}>
                  <MyApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/mock-interview"
              element={
                <ProtectedRoute allowedRoles={['candidate']}>
                  <MockInterview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/ats-analyzer"
              element={
                <ProtectedRoute allowedRoles={['candidate']}>
                  <ATSAnalyzer />
                </ProtectedRoute>
              }
            />

            <Route
              path="/candidate/interviews"
              element={
                <ProtectedRoute allowedRoles={['candidate']}>
                  <ModuleInitialization title="Interview Terminal" description="Prepare for and execute high-stakes talent syncs with industry leaders." />
                </ProtectedRoute>
              }
            />

            {/* Recruiter Tactical Routing */}
            <Route
              path="/recruiter/dashboard"
              element={
                <ProtectedRoute allowedRoles={['recruiter']}>
                  <RecruiterDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/jobs"
              element={
                <ProtectedRoute allowedRoles={['recruiter']}>
                  <ManageJobs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/jobs/new"
              element={
                <ProtectedRoute allowedRoles={['recruiter']}>
                  <PostJob />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/jobs/edit/:jobId"
              element={
                <ProtectedRoute allowedRoles={['recruiter']}>
                  <PostJob />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/applications"
              element={
                <ProtectedRoute allowedRoles={['recruiter']}>
                   <ViewApplications defaultJobId="all" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/applications/:jobId"
              element={
                <ProtectedRoute allowedRoles={['recruiter']}>
                   <ViewApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/interviews"
              element={
                <ProtectedRoute allowedRoles={['recruiter']}>
                  <ModuleInitialization title="Interview Scheduler" description="Sync your calendar and manage technical interview cycles at scale." />
                </ProtectedRoute>
              }
            />

            <Route
              path="/interview/:interviewId"
              element={
                <ProtectedRoute allowedRoles={['candidate', 'recruiter']}>
                   <InterviewRoom />
                </ProtectedRoute>
              }
            />
            {/* 404 Node Protection */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;
