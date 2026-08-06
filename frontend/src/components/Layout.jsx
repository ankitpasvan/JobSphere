import { useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
  const isPublicPage = publicPaths.includes(location.pathname);
  const isInterviewPage = location.pathname.startsWith('/interview/');

  // If it's a public page or an interview session, use the normal layout (or no layout)
  if (isPublicPage || isInterviewPage) {
    const isHomePage = location.pathname === '/';
    return (
      <div className="flex flex-col min-h-screen bg-white">
        {!isInterviewPage && <Navbar />}
        <main className={`flex-grow flex flex-col ${isHomePage || isInterviewPage ? '' : 'pt-20'}`}>
          {children}
        </main>
        {!isInterviewPage && <Footer />}
      </div>
    );
  }

  const getPageTitle = (path) => {
    if (path.includes('/candidate/dashboard')) return 'Candidate Hub';
    if (path.includes('/recruiter/dashboard')) return 'Enterprise Control';
    if (path.includes('/candidate/jobs')) return 'Opportunity Board';
    if (path.includes('/candidate/applications')) return 'My Applications';
    if (path.includes('/candidate/mock-interview')) return 'Practice Interview';
    if (path.includes('/candidate/ats-analyzer')) return 'Resume Check';
    if (path.includes('/recruiter/jobs')) return 'Job Management';
    if (path.includes('/recruiter/applications')) return 'Applicant Tracking';
    if (path.includes('/profile')) return 'Global Profile';
    return 'Workspace';
  };

  // If authenticated and on an internal page, use the Sidebar layout
  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      
      <div className={`flex-grow transition-all duration-300 min-h-screen flex flex-col ${sidebarCollapsed ? 'ml-24' : 'ml-72'}`}>
        <DashboardHeader title={getPageTitle(location.pathname)} />
        
        <main className="flex-grow p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
