import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLogOut, FiMenu, FiX, FiUser, FiChevronDown, FiBell, FiSearch, FiVideo, FiPhoneIncoming, FiPhoneOff } from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';
import logo from '../assets/logo.png';
import io from 'socket.io-client';
import NotificationCenter from './NotificationCenter';
import api from '../services/api';
import { getSocketBaseUrl } from '../utils/urlConfig';

const Navbar = () => {
  const { isAuthenticated, user, logout, isCandidate, isRecruiter } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const socketRef = useRef();
  const timeoutRef = useRef();
  const intervalRef = useRef();

  // Request browser notification permission
  useEffect(() => {
    if (isAuthenticated && isCandidate && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [isAuthenticated, isCandidate]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    const userId = user?._id || user?.id;

    if (isAuthenticated && userId && !socketRef.current) {
       const socketBaseUrl = getSocketBaseUrl();
       
       console.log('🔌 Creating Navbar socket connection for user:', userId);
       
       socketRef.current = io(socketBaseUrl, {
         transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
         timeout: 20000,
         path: '/socket.io/',
         autoConnect: true
       });
       
       socketRef.current.on('connect', () => {
         console.log('✅ Navbar socket connected:', socketRef.current.id);
         console.log('👤 Current user:', user?.name, 'Role:', user?.role, 'ID:', userId);
         socketRef.current.emit('register-user', userId);
         console.log('📝 Registered user in socket room:', userId);
         
         // Check notification permission
         if ('Notification' in window) {
           console.log('🔔 Notification permission:', Notification.permission);
         }
       });

       socketRef.current.on('connect_error', (error) => {
         console.error('❌ Navbar socket connection error:', error.message);
       });

       socketRef.current.on('call-notification', (data) => {
          console.log('🔔 CALL NOTIFICATION RECEIVED:', data);
          setIncomingCall(data);
          setTimeLeft(60); // Reset timer to 60 seconds
          
          // Show browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification('🔴 Interview Call', {
              body: `${data.recruiterName} is calling for ${data.jobTitle}`,
              icon: '/logo.png',
              tag: 'interview-call',
              requireInteraction: true,
              vibrate: [200, 100, 200]
            });
            
            // Click notification to navigate to interview
            notification.onclick = () => {
              window.focus();
              navigate(`/interview/${data.interviewId}`);
              notification.close();
            };
          }
          
          // Play notification sound
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
          audio.play().catch(e => console.log('Audio blocked by browser policy'));
          
          // Start countdown timer
          intervalRef.current = setInterval(() => {
            setTimeLeft(prev => {
              if (prev <= 1) {
                clearInterval(intervalRef.current);
                handleCallTimeout(data.interviewId);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          
          // Auto-timeout after 60 seconds
          timeoutRef.current = setTimeout(() => {
            handleCallTimeout(data.interviewId);
          }, 60000);
       });

       // Listen for new interview scheduled notifications
       socketRef.current.on('new-notification', (data) => {
          if (data.notification?.type === 'interview_scheduled') {
            console.log('📅 New interview scheduled - notifying dashboard');
            // Dispatch event for dashboard to refresh
            window.dispatchEvent(new Event('interview-scheduled'));
          }
          
          if (data.notification?.type === 'interview_rescheduled') {
            console.log('📅 Interview rescheduled - notifying dashboard');
            // Show toast notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('📅 Interview Rescheduled', {
                body: data.notification.message,
                icon: '/logo.png',
                tag: 'interview-rescheduled'
              });
            }
            // Refresh dashboard data
            window.dispatchEvent(new Event('interview-scheduled'));
          }
       });
       
       // Listen for interview reschedule events
       socketRef.current.on('interview-rescheduled', (data) => {
          console.log('📅 Interview rescheduled event received:', data);
          // Refresh dashboard
          window.dispatchEvent(new Event('interview-scheduled'));
       });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      }
      // Cleanup timers
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, user]);

  const handleAcceptCall = async () => {
    const interviewId = incomingCall.interviewId;
    
    // Clear timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    // Call backend to mark as accepted
    try {
      await api.post(`/interviews/${interviewId}/accept-call`);
    } catch (error) {
      console.error('Error accepting call:', error);
    }
    
    setIncomingCall(null);
    setTimeLeft(60);
    navigate(`/interview/${interviewId}`);
  };

  const handleDeclineCall = async () => {
    const interviewId = incomingCall.interviewId;
    
    // Clear timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    // Call backend to mark as declined
    try {
      await api.post(`/interviews/${interviewId}/decline-call`);
    } catch (error) {
      console.error('Error declining call:', error);
    }
    
    setIncomingCall(null);
    setTimeLeft(60);
  };

  const handleCallTimeout = async (interviewId) => {
    // Clear timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    // Call backend to mark as timed out
    try {
      await api.post(`/interviews/${interviewId}/call-timeout`);
    } catch (error) {
      console.error('Error handling timeout:', error);
    }
    
    setIncomingCall(null);
    setTimeLeft(60);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setUserMenuOpen(false);
  };

  const isHomePage = location.pathname === '/';
  
  const navbarBg = isHomePage && !scrolled
    ? 'bg-transparent'
    : 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50';

  const textColor = isHomePage && !scrolled
    ? 'text-slate-900'
    : 'text-slate-600';

  const activeTextColor = isHomePage && !scrolled
    ? 'text-blue-600 font-bold'
    : 'text-blue-600 font-bold';

  const logoColor = isHomePage && !scrolled
    ? 'text-slate-900'
    : 'text-blue-600';

  const mobileMenuButtonColor = isHomePage && !scrolled
    ? 'text-slate-900 bg-white/50 backdrop-blur-sm border border-slate-200 shadow-sm'
    : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200';

  return (
    <>
      {/* Incoming Call Overlay */}
      {incomingCall && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-500">
          <div className="bg-white rounded-[40px] p-8 md:p-12 w-full max-w-lg shadow-[0_25px_100px_-15px_rgba(0,0,0,0.4)] border border-white/20 relative overflow-hidden group">
            
            {/* Pulsing Background Ring */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full animate-ping opacity-20 pointer-events-none"></div>
            
            <div className="relative text-center">
              <div className="inline-flex relative mb-8">
                 <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white scale-110 shadow-2xl shadow-blue-500/40 z-10">
                    <FiPhoneIncoming size={40} className="animate-bounce" />
                 </div>
                 <div className="absolute inset-0 rounded-full border-2 border-blue-500 animate-ping opacity-30"></div>
                 <div className="absolute inset-x-0 -top-4 text-[10px] font-black uppercase text-blue-500 tracking-[0.4em] animate-pulse">
                    Live Uplink Request
                 </div>
              </div>

              <h2 className="text-3xl font-black text-slate-900 mb-2 font-sans tracking-tight">
                {incomingCall.recruiterName}
              </h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-4">
                 Interview Requested: <span className="text-blue-600">{incomingCall.jobTitle}</span>
              </p>
              
              {/* Countdown Timer */}
              <div className="mb-6 flex items-center justify-center gap-3">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-slate-200"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      strokeDashoffset={`${2 * Math.PI * 28 * (1 - timeLeft / 60)}`}
                      className={`${timeLeft <= 10 ? 'text-rose-500' : 'text-blue-500'} transition-all duration-1000`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-lg font-black ${timeLeft <= 10 ? 'text-rose-600' : 'text-blue-600'}`}>
                      {timeLeft}
                    </span>
                  </div>
                </div>
                <p className={`text-xs font-semibold ${timeLeft <= 10 ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`}>
                  {timeLeft <= 10 ? 'Call expiring soon!' : 'seconds remaining'}
                </p>
              </div>

              <div className="flex gap-4">
                 <button 
                   onClick={handleDeclineCall}
                   className="flex-1 py-5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-2 border border-slate-200"
                 >
                    <FiPhoneOff size={18} /> Ignore
                 </button>
                 <button 
                   onClick={handleAcceptCall}
                   className="flex-3 py-5 bg-blue-600 hover:bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all shadow-xl shadow-blue-500/30 hover:-translate-y-1 flex items-center justify-center gap-2 group"
                 >
                    <FiVideo size={20} className="group-hover:rotate-12 transition-transform" /> Join Live Stage Now
                 </button>
              </div>
              
              <p className="mt-8 text-[9px] font-bold text-slate-400 uppercase tracking-tighter flex items-center justify-center gap-2">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> 
                 Encrypted WebRTC P2P Session Ready
              </p>
            </div>
          </div>
        </div>
      )}

      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navbarBg} ${scrolled ? 'py-3' : 'py-5'}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className={`group flex items-center gap-2.5 outline-none`}>
              <div className="relative">
                <div className="w-10 h-10 bg-white shadow-md border border-slate-100 rounded-xl overflow-hidden flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <img src={logo} alt="TalentBridge Logo" className="w-full h-full object-contain p-1" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm"></div>
              </div>
              <span className={`text-xl lg:text-2xl font-bold tracking-tight ${logoColor} transition-colors duration-300`}>
                Talent<span className="font-bold opacity-80 text-indigo-500">Bridge</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {isAuthenticated ? (
              <>
                <div className="flex items-center px-4 space-x-1 mr-4 border-r border-slate-200/50">
                  <Link
                    to={isCandidate ? '/candidate/dashboard' : '/recruiter/dashboard'}
                    className={`${location.pathname.includes('dashboard') ? activeTextColor : textColor} px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-100/50 transition-all`}
                  >
                    Dashboard
                  </Link>

                  {isCandidate && (
                    <>
                      <Link
                        to="/candidate/jobs"
                        className={`${location.pathname === '/candidate/jobs' ? activeTextColor : textColor} px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-100/50 transition-all`}
                      >
                        Find Jobs
                      </Link>
                      <Link
                        to="/candidate/applications"
                        className={`${location.pathname === '/candidate/applications' ? activeTextColor : textColor} px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-100/50 transition-all`}
                      >
                        Applications
                      </Link>
                    </>
                  )}

                  {isRecruiter && (
                    <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl">
                      <Link
                        to="/recruiter/jobs"
                        className={`${location.pathname === '/recruiter/jobs' ? activeTextColor : textColor} px-4 py-2 rounded-lg text-sm font-medium hover:bg-white hover:shadow-sm transition-all`}
                      >
                        Inventory
                      </Link>
                      <Link
                        to="/recruiter/applications"
                        className={`${location.pathname === '/recruiter/applications' ? activeTextColor : textColor} px-4 py-2 rounded-lg text-sm font-medium hover:bg-white hover:shadow-sm transition-all`}
                      >
                        Candidates
                      </Link>
                      <Link
                        to="/recruiter/jobs/new"
                        className="ml-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-900 transition-all shadow-md shadow-blue-500/10 active:scale-95"
                      >
                        Post Role
                      </Link>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {isCandidate && <NotificationCenter />}
                  
                  {/* User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-slate-200/50 bg-white/50 hover:bg-white hover:shadow-md transition-all outline-none`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0">
                        {user?.avatar ? (
                          <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <FiUser className="text-slate-400" />
                        )}
                      </div>
                      <div className="text-left py-0.5">
                        <div className="text-xs font-bold text-slate-900 leading-none">
                          {user?.name?.split(' ')[0]}
                        </div>
                      </div>
                      <FiChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${userMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-5 py-3 mb-2 border-b border-slate-50">
                          <div className="font-bold text-slate-900 leading-tight">{user?.name}</div>
                          <div className="text-xs text-slate-500 font-medium truncate">{user?.email}</div>
                          <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                            {user?.role} Account
                          </div>
                        </div>
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <FiUser size={16} />
                          Profile Settings
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-50 transition-all"
                        >
                          <FiLogOut size={16} />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className={`${textColor} px-5 py-2 rounded-xl font-semibold text-sm hover:bg-slate-100/50 transition-all`}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/25 hover:bg-blue-700 hover:shadow-blue-500/40 hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center gap-3">
            {isAuthenticated && (
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                <FiUser className="text-slate-400" />
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`${mobileMenuButtonColor} p-2 rounded-xl shadow-sm transition-all outline-none`}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[73px] bg-white z-[9999] min-h-screen animate-in slide-in-from-right duration-300">
          <div className="px-6 py-8 space-y-6">
            {isAuthenticated ? (
              <>
                <div className="space-y-1">
                  <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Main Menu</p>
                  <Link
                    to={isCandidate ? '/candidate/dashboard' : '/recruiter/dashboard'}
                    className="flex items-center px-4 py-4 text-slate-900 border-b border-slate-50 font-bold tracking-tight hover:text-blue-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  {isCandidate && (
                    <>
                      <Link
                        to="/candidate/jobs"
                        className="flex items-center px-4 py-4 text-slate-900 border-b border-slate-50 font-bold tracking-tight hover:text-blue-600"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Find Jobs
                      </Link>
                      <Link
                        to="/candidate/applications"
                        className="flex items-center px-4 py-4 text-slate-900 border-b border-slate-50 font-bold tracking-tight hover:text-blue-600"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Applications
                      </Link>
                    </>
                  )}
                  {isRecruiter && (
                    <>
                      <Link
                        to="/recruiter/jobs"
                        className="flex items-center px-4 py-4 text-slate-900 border-b border-slate-50 font-bold tracking-tight hover:text-blue-600"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        My Posts
                      </Link>
                      <Link
                        to="/recruiter/applications"
                        className="flex items-center px-4 py-4 text-slate-900 border-b border-slate-50 font-bold tracking-tight hover:text-blue-600"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Candidates
                      </Link>
                    </>
                  )}
                </div>

                <div className="pt-6 space-y-4">
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-4 py-4 text-slate-600 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FiUser size={20} className="text-slate-400" />
                    My Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-4 text-rose-500 font-bold"
                  >
                    <FiLogOut size={20} />
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <Link
                  to="/login"
                  className="block px-6 py-4 text-slate-900 text-center font-bold tracking-tight border border-slate-200 rounded-2xl"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="block px-6 py-4 text-white bg-blue-600 text-center font-bold tracking-tight rounded-2xl shadow-xl shadow-blue-500/20"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Join TalentBridge
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
    </>
  );
};

export default Navbar;
