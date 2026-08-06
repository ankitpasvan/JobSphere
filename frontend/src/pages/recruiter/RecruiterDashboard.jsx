import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { jobAPI, interviewAPI, applicationAPI } from '../../services/api';
import { 
  FiBriefcase, FiUsers, FiCalendar, FiPlus, FiArrowRight, 
  FiActivity, FiClock, FiCheckSquare
} from 'react-icons/fi';
import io from 'socket.io-client';
import { getSocketBaseUrl } from '../../utils/urlConfig';

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ activeJobs: 0, totalApps: 0, growth: '--', shortlisted: 0 });
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [callStatus, setCallStatus] = useState({});
  const [statusMessages, setStatusMessages] = useState({});
  const socketRef = useRef();

  useEffect(() => {
    fetchDashboardData();
    
    // Only set up socket if user exists
    if (!user) return;

    const socketBaseUrl = getSocketBaseUrl();
    socketRef.current = io(socketBaseUrl, {
       transports: ['websocket', 'polling'],
       reconnection: true,
       reconnectionAttempts: 5,
       path: '/socket.io/',
       autoConnect: true
    });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('register-user', user._id || user.id);
    });

    socketRef.current.on('call-accepted', ({ interviewId, candidateName }) => {
      setCallStatus(prev => ({ ...prev, [interviewId]: 'accepted' }));
      setStatusMessages(prev => ({ ...prev, [interviewId]: `${candidateName} joined` }));
      setTimeout(() => navigate(`/interview/${interviewId}`), 1000);
    });

    socketRef.current.on('call-declined', ({ interviewId, candidateName }) => {
      setCallStatus(prev => ({ ...prev, [interviewId]: 'declined' }));
      setStatusMessages(prev => ({ ...prev, [interviewId]: `Call declined by ${candidateName}` }));
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      }
    };
  }, [user, navigate]);

  const startCall = async (interview) => {
    if (!interview || !interview._id) return;
    const interviewId = interview._id;
    try {
      setCallStatus(prev => ({ ...prev, [interviewId]: 'calling' }));
      setStatusMessages(prev => ({ ...prev, [interviewId]: 'Calling...' }));
      await interviewAPI.startMeeting(interviewId);
    } catch (error) {
      console.error('Error starting call:', error);
      setCallStatus(prev => ({ ...prev, [interviewId]: 'error' }));
      setStatusMessages(prev => ({ ...prev, [interviewId]: 'Failed to call' }));
    }
  };

  const fetchDashboardData = async () => {
    try {
      const resp = await Promise.allSettled([
        jobAPI.getJobStats(),
        interviewAPI.getRecruiterInterviews({ upcoming: true, limit: 6 }),
        applicationAPI.getJobApplications('all', { limit: 6 })
      ]);

      const jobStats = resp[0].status === 'fulfilled' ? resp[0].value : null;
      const interviewList = resp[1].status === 'fulfilled' ? resp[1].value : null;
      const recentApps = resp[2].status === 'fulfilled' ? resp[2].value : null;

      const jobsCount = jobStats?.data?.totalJobs || 0;
      const statsList = jobStats?.data?.stats || [];
      const totalApps = statsList.reduce((acc, curr) => acc + (curr.totalApplications || 0), 0) || 0;
      const shortlisted = statsList.find(s => s._id === 'Shortlisted')?.count || 0;
      
      setStats({
        activeJobs: jobsCount,
        totalApps: totalApps,
        shortlisted: shortlisted,
        growth: totalApps > 0 ? '+12% Up' : 'Stable'
      });

      setUpcomingInterviews(interviewList?.data?.interviews || []);
      setRecentApplications(recentApps?.data?.applications || []);
    } catch (err) {
      console.error('Error loading recruiter dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
       <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
       
       {/* High-Level Greeting */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
             <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back, {user?.name?.split(' ')[0] || 'Recruiter'} 👋</h2>
             <p className="text-slate-500 text-sm font-medium">Monitoring hiring at <span className="text-blue-600">{(typeof user?.company === 'object' ? user?.company?.name : user?.company) || 'Your Organization'}</span></p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-xl border border-emerald-100 flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                Live System
             </div>
             <button onClick={fetchDashboardData} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm">
                <FiActivity size={18} />
             </button>
          </div>
       </div>

       {/* Major Stats Tiles */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm hover:border-blue-100 transition-all group">
             <div className="flex items-center justify-between mb-5">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><FiBriefcase size={22} /></div>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Active</span>
             </div>
             <p className="text-sm font-bold text-slate-500">Job Postings</p>
             <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.activeJobs}</h3>
          </div>
          <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm hover:border-blue-100 transition-all group">
             <div className="flex items-center justify-between mb-5">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><FiUsers size={22} /></div>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Total</span>
             </div>
             <p className="text-sm font-bold text-slate-500">Applicants</p>
             <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.totalApps}</h3>
          </div>
          <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm hover:border-blue-100 transition-all group">
             <div className="flex items-center justify-between mb-5">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><FiCheckSquare size={22} /></div>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Qualified</span>
             </div>
             <p className="text-sm font-bold text-slate-500">Shortlisted</p>
             <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.shortlisted}</h3>
          </div>
          <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm hover:border-blue-100 transition-all group">
             <div className="flex items-center justify-between mb-5">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl"><FiActivity size={22} /></div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-100 uppercase">{stats.growth}</span>
             </div>
             <p className="text-sm font-bold text-slate-500">System Flow</p>
             <h3 className="text-3xl font-bold text-slate-900 mt-1">100%</h3>
          </div>
       </div>

       <div className="grid lg:grid-cols-12 gap-8">
          {/* Main Visual Section */}
          <div className="lg:col-span-8 space-y-8">
                        {/* Today's Interviews Grid */}
             <div className="bg-white rounded-[32px] p-8 md:p-10 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-10">
                   <h3 className="text-xl font-bold text-slate-900 tracking-tight">Today's Sessions</h3>
                   <div className="px-3 py-1 bg-blue-50 text-[10px] font-bold text-blue-600 rounded-lg border border-blue-100 uppercase tracking-widest">Live</div>
                </div>
                
                {upcomingInterviews.length > 0 ? (
                   <div className="grid md:grid-cols-2 gap-6">
                      {upcomingInterviews.map((interview) => (
                         <div key={interview._id} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-600/5 transition-all group">
                            <div className="flex items-center gap-4 mb-6">
                               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-bold text-blue-600 shadow-sm border border-slate-100 text-lg uppercase">
                                  {interview.candidate?.name?.[0] || '?'}
                               </div>
                               <div>
                                  <h4 className="font-bold text-slate-900 capitalize text-sm">{interview.candidate?.name || 'Candidate'}</h4>
                                  <p className="text-[11px] text-slate-500 font-medium">{interview.job?.title || 'Job Role'}</p>
                               </div>
                            </div>
                            <div className="flex gap-4 items-center mb-8 pt-4 border-t border-slate-100">
                               <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase"><FiCalendar size={14} /> {new Date(interview.scheduledDate).toLocaleDateString()}</div>
                               <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase"><FiClock size={14} /> {new Date(interview.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                            
                            {statusMessages[interview._id] && (
                              <p className="mb-4 text-[10px] font-black text-blue-600 uppercase text-center">{statusMessages[interview._id]}</p>
                            )}

                            <button 
                              onClick={() => startCall(interview)}
                              disabled={callStatus[interview._id] === 'calling'}
                              className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/10 active:scale-95 disabled:opacity-50"
                            >
                               {callStatus[interview._id] === 'calling' ? 'Connecting...' : 'Start Session'}
                            </button>
                         </div>
                      ))}
                   </div>
                ) : (
                   <div className="py-20 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                      <FiCalendar className="mx-auto text-slate-300 mb-4" size={40} />
                      <p className="text-slate-400 text-sm font-medium">No sessions scheduled for today.</p>
                   </div>
                )}
             </div>

             {/* Candidate Activity List */}
             <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/10">
                   <h3 className="text-xl font-bold text-slate-900 tracking-tight">Recent Pipeline</h3>
                   <Link to="/recruiter/applications" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-all uppercase tracking-widest border-b border-transparent hover:border-blue-600">Full Pipeline</Link>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <tbody className="divide-y divide-slate-50">
                         {Array.isArray(recentApplications) && recentApplications.map((app) => (
                            <tr key={app._id} className="hover:bg-slate-50/50 transition-colors">
                               <td className="px-10 py-6">
                                  <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-slate-900/10 uppercase">
                                        {app.candidate?.name?.[0] || '?'}
                                     </div>
                                     <div>
                                        <p className="font-bold text-slate-900 text-sm tracking-tight capitalize">{app.candidate?.name || 'Anonymous'}</p>
                                        <p className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]">{app.job?.title || 'Unknown Role'}</p>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-10 py-6">
                                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                     {app.createdAt ? new Date(app.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '--'}
                                  </p>
                               </td>
                               <td className="px-10 py-6 text-right">
                                  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                     app.status === 'Shortlisted' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                     app.status === 'Interview Scheduled' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                     'bg-slate-50 text-slate-600 border-slate-200'
                                  }`}>
                                     {app.status || 'Pending'}
                                  </span>
                               </td>
                            </tr>
                         ))}
                         {(!recentApplications || recentApplications.length === 0) && (
                            <tr>
                               <td colSpan="3" className="px-10 py-16 text-center text-slate-400 text-sm italic font-medium">No candidates in current pipeline.</td>
                            </tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>

          {/* Sidebar Tools Area */}
          <div className="lg:col-span-4 space-y-8">
             
             {/* Dynamic Insights / Conversion */}
             <div className="bg-slate-900 rounded-[32px] p-8 md:p-10 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
                <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-blue-600/20 rounded-full blur-3xl group-hover:bg-blue-600/30 transition-all duration-700"></div>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.4em] mb-10">Recruitment Pulse</p>
                <div className="space-y-8 relative z-10">
                   <div className="flex items-center justify-between">
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Responses</p>
                      <p className="text-2xl font-bold">{stats.totalApps}</p>
                   </div>
                   <div className="flex items-center justify-between">
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Qualify Ratio</p>
                      <p className="text-2xl font-bold">{stats.totalApps > 0 ? Math.round((stats.shortlisted / stats.totalApps) * 100) : 0}%</p>
                   </div>
                   <div className="pt-8 border-t border-slate-800">
                      <div className="flex items-center justify-between gap-4">
                         <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: '45%' }}></div>
                         </div>
                         <span className="text-[10px] font-bold text-emerald-400 uppercase">{stats.growth}</span>
                      </div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-4">Growth Intelligence</p>
                   </div>
                </div>
             </div>

             {/* Hiring Tools Area */}
             <div className="bg-white rounded-[32px] p-8 md:p-10 border border-slate-100 shadow-sm text-center transform transition-all hover:-translate-y-1">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-blue-100/50">
                   <FiPlus size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2">Build Your Team</h3>
                <p className="text-slate-500 text-xs font-medium leading-relaxed mb-10 px-6">Ready to expand? Create a new job listing to find world-class talent.</p>
                <Link to="/recruiter/jobs/new" className="block w-full py-5 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-slate-900/10">
                   Post New Opening
                </Link>
             </div>
          </div>
       </div>
    </div>
  );
};

export default RecruiterDashboard;
