import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiGrid, FiBriefcase, FiFileText, FiAward, FiTarget, 
  FiUser, FiSettings, FiLogOut, FiChevronLeft, FiChevronRight,
  FiPlus, FiUsers, FiCalendar, FiBell, FiSearch
} from 'react-icons/fi';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const candidateLinks = [
    { icon: FiGrid, label: 'Dashboard', path: '/candidate/dashboard' },
    { icon: FiBriefcase, label: 'Find Jobs', path: '/candidate/jobs' },
    { icon: FiFileText, label: 'My Applications', path: '/candidate/applications' },
    { icon: FiAward, label: 'Practice Interview', path: '/candidate/mock-interview' },
    { icon: FiTarget, label: 'Resume Checker', path: '/candidate/ats-analyzer' },
    { icon: FiUser, label: 'Profile', path: '/profile' },
  ];

  const recruiterLinks = [
    { icon: FiGrid, label: 'Dashboard', path: '/recruiter/dashboard' },
    { icon: FiPlus, label: 'Post a Job', path: '/recruiter/jobs/new' },
    { icon: FiBriefcase, label: 'Manage Jobs', path: '/recruiter/jobs' },
    { icon: FiUsers, label: 'Applicants', path: '/recruiter/applications' },
    { icon: FiUser, label: 'Company Profile', path: '/profile' },
  ];

  const links = user?.role === 'recruiter' ? recruiterLinks : candidateLinks;

  return (
    <aside className={`fixed left-0 top-0 h-screen transition-all duration-300 z-50 bg-white border-r border-slate-200 p-6 flex flex-col ${collapsed ? 'w-24' : 'w-72'}`}>
      <div className="flex items-center justify-between mb-10 px-2">
        <Link to="/" className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0 transition-transform hover:scale-105 active:scale-95 ${user?.role === 'recruiter' ? 'bg-slate-900 shadow-slate-900/20' : 'bg-blue-600 shadow-blue-600/20'}`}>
            <FiBriefcase size={22} />
          </div>
          {!collapsed && (
            <span className="font-black text-xl text-slate-900 tracking-tighter">
              TalentBridge
            </span>
          )}
        </Link>
        {!collapsed && (
          <button onClick={() => setCollapsed(!collapsed)} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm">
            <FiChevronLeft />
          </button>
        )}
      </div>

      {collapsed && (
        <button onClick={() => setCollapsed(!collapsed)} className="mb-8 mx-auto p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm">
          <FiChevronRight />
        </button>
      )}

      <nav className="flex-grow space-y-2">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link 
              key={link.path}
              to={link.path} 
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
              }`}
            >
              <link.icon size={20} className={isActive ? 'text-white' : 'text-slate-400'} />
              {!collapsed && <span className="font-bold text-sm tracking-tight">{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button 
        onClick={handleLogout}
        className="mt-auto flex items-center gap-3 px-4 py-4 text-slate-400 hover:text-rose-500 transition-all group"
      >
        <FiLogOut size={20} />
        {!collapsed && <span className="font-bold text-sm">Logout</span>}
      </button>
    </aside>
  );
};

export default Sidebar;
