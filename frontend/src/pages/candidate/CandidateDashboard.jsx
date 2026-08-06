import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { applicationAPI, interviewAPI, jobAPI } from '../../services/api';
import { 
  FiBriefcase, FiCalendar, FiArrowRight, FiActivity, 
  FiFileText, FiClock, FiAward, FiTarget
} from 'react-icons/fi';

const CandidateDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalApplied: 0, pending: 0, interviews: 0 });
  const [interviews, setInterviews] = useState([]);
  const [recentApps, setRecentApps] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const resp = await Promise.allSettled([
        applicationAPI.getApplicationStats(),
        interviewAPI.getMyInterviews({ upcoming: true, limit: 1 }),
        applicationAPI.getMyApplications({ limit: 4 }),
        jobAPI.getAllJobs({ limit: 3 })
      ]);

      const appStats = resp[0].status === 'fulfilled' ? resp[0].value : null;
      const interviewList = resp[1].status === 'fulfilled' ? resp[1].value : null;
      const myApps = resp[2].status === 'fulfilled' ? resp[2].value : null;
      const allJobs = resp[3].status === 'fulfilled' ? resp[3].value : null;

      setStats({
        totalApplied: appStats?.data?.total || 0,
        pending: appStats?.data?.stats?.find(s => s._id === 'Applied' || s._id === 'Under Review')?.count || 0,
        interviews: interviewList?.data?.count || 0
      });

      setInterviews(interviewList?.data?.interviews || []);
      setRecentApps(myApps?.data?.applications || []);
      setRecommendedJobs(allJobs?.data?.jobs || []);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileStrength = () => {
    if (!user) return 0;
    let score = 0;
    if (user.name) score += 10;
    if (user.email) score += 10;
    if (user.bio && user.bio.length > 10) score += 20;
    if (Array.isArray(user.skills) && user.skills.length > 0) score += 20;
    if (Array.isArray(user.experience) && user.experience.length > 0) score += 15;
    if (Array.isArray(user.education) && user.education.length > 0) score += 15;
    if (user.resumeUrl || user.resume) score += 10;
    return score;
  };

  const profileStrength = calculateProfileStrength();

  if (loading) return (
     <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
     </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
       
       {/* Page Header */}
       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 py-2">
          <div className="space-y-1">
             <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back, {user?.name?.split(' ')[0] || 'Explorer'} 👋</h2>
             <p className="text-slate-500 text-sm font-medium">Tracking your trajectory at <span className="text-blue-600">{(typeof user?.company === 'object' ? user?.company?.name : user?.company) || 'TalentBridge Intelligence'}</span></p>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">System Ready</span>
          </div>
       </div>

       {/* Summary KPI Grid */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { label: 'Applications', value: stats.totalApplied, icon: FiBriefcase, color: 'blue', sub: 'Total submissions' },
            { label: 'In Review', value: stats.pending, icon: FiClock, color: 'indigo', sub: 'Active feedback' },
            { label: 'Interviews', value: stats.interviews, icon: FiTarget, color: 'emerald', sub: 'Upcoming calls' }
          ].map((kpi, i) => (
             <div key={i} className="bg-white p-7 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-4">
                   <div className={`p-2.5 rounded-xl bg-blue-50 text-blue-600`}>
                      <kpi.icon size={20} />
                   </div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{kpi.sub}</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-500">{kpi.label}</h4>
                <p className="text-3xl font-bold text-slate-900 mt-1">{kpi.value}</p>
             </div>
          ))}
       </div>

       <div className="grid lg:grid-cols-12 gap-8">
          {/* Main Space */}
          <div className="lg:col-span-8 space-y-8">
             
             {/* Dynamic Interview Banner */}
             {interviews.length > 0 && (
                <div className="bg-slate-900 rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/10">
                   <div className="absolute top-0 right-0 p-8">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
                   </div>
                   <div className="relative z-10 space-y-8">
                      <div>
                         <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em] mb-4">Live Session Detected</p>
                         <h3 className="text-4xl font-bold tracking-tight leading-none">
                            {interviews[0].job?.company}
                         </h3>
                         <p className="text-slate-400 mt-2 font-medium">{interviews[0].job?.title}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-8 py-6 border-y border-slate-800">
                         <div className="space-y-1">
                            <p className="text-[9px] font-bold text-slate-500 uppercase">Scheduled Date</p>
                            <p className="text-sm font-bold text-blue-100">{new Date(interviews[0].scheduledDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[9px] font-bold text-slate-500 uppercase">Starting Time</p>
                            <p className="text-sm font-bold text-blue-100">{new Date(interviews[0].scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                         </div>
                      </div>
                      <Link to={`/interview/${interviews[0]._id}`} className="inline-flex items-center gap-3 px-10 py-5 bg-blue-600 text-white font-bold rounded-2xl text-sm shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all uppercase tracking-widest">
                         Start Session <FiArrowRight />
                      </Link>
                   </div>
                </div>
             )}

             {/* Recent Application History */}
             <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                   <h3 className="text-lg font-bold text-slate-900 tracking-tight">Application Pipeline</h3>
                   <Link to="/candidate/applications" className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-all">View All History</Link>
                </div>
                <div className="divide-y divide-slate-50">
                   {recentApps.map((app, i) => (
                      <div key={i} className="flex items-center justify-between p-7 hover:bg-slate-50/50 transition-all group">
                         <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-bold text-blue-600 border border-slate-100 shadow-sm relative overflow-hidden">
                               {app.job?.companyLogo ? <img src={app.job.companyLogo} className="w-full h-full object-cover" /> : (app.job?.company?.[0] || 'J')}
                            </div>
                            <div>
                               <h4 className="font-bold text-slate-900 text-sm tracking-tight capitalize mb-0.5">{app.job?.title}</h4>
                               <p className="text-[11px] text-slate-500 font-medium">{app.job?.company}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <span className={`text-[10px] font-bold px-3 py-1 rounded-lg border ${
                               app.status === 'Applied' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                               app.status === 'Shortlisted' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                               'bg-slate-50 text-slate-500 border-slate-100'
                            }`}>{app.status}</span>
                            <Link to="/candidate/applications" className="p-2 text-slate-300 hover:text-blue-600 transition-all">
                               <FiArrowRight size={18} />
                            </Link>
                         </div>
                      </div>
                   ))}
                   {recentApps.length === 0 && (
                      <div className="p-12 text-center text-slate-400 text-sm italic">You haven't applied to any roles yet.</div>
                   )}
                </div>
             </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-6">
             
             {/* Career Profile Card */}
             <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm group">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                      {user?.name?.[0]}
                   </div>
                   <div>
                      <h3 className="font-bold text-slate-900">{user?.name}</h3>
                      <p className="text-xs text-slate-400">Verified Professional</p>
                   </div>
                </div>
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Profile Strength</span>
                      <span className="text-blue-600 font-bold">{profileStrength}%</span>
                   </div>
                   <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full shadow-sm transition-all duration-1000" style={{ width: `${profileStrength}%` }}></div>
                   </div>
                   <Link to="/profile" className="block text-center mt-6 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all">Complete Profile</Link>
                </div>
             </div>

             {/* Job Matches Component */}
             <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 bg-slate-50/20">
                   <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Recommended Roles</h3>
                </div>
                <div className="p-2 divide-y divide-slate-50">
                   {recommendedJobs.map((job) => (
                      <div key={job._id} className="p-5 hover:bg-slate-50/50 transition-all rounded-2xl">
                         <div className="flex items-center gap-4 mb-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-bold text-blue-600 border border-slate-100">
                               {job.companyLogo ? <img src={job.companyLogo} className="w-full h-full object-cover rounded-xl" /> : 'J'}
                            </div>
                            <div className="flex-grow min-w-0">
                               <h4 className="font-bold text-slate-900 text-xs tracking-tight truncate">{job.title}</h4>
                               <p className="text-[10px] text-slate-400 font-bold uppercase">{job.location}</p>
                            </div>
                         </div>
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">₹{(job.salary.min / 1000).toFixed(0)}k+</span>
                            <Link to="/candidate/jobs" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors">Apply</Link>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             {/* AI Tools Grid */}
             <div className="grid grid-cols-2 gap-4">
                <Link to="/candidate/mock-interview" className="p-6 bg-blue-600 text-white rounded-3xl shadow-xl shadow-blue-600/10 flex flex-col items-center justify-center gap-3 group hover:-translate-y-1 transition-all">
                   <FiAward size={24} className="group-hover:scale-110 transition-transform" />
                   <span className="text-[10px] font-bold uppercase tracking-widest text-center">AI Mock</span>
                </Link>
                <Link to="/candidate/ats-analyzer" className="p-6 bg-slate-900 text-white rounded-3xl shadow-xl shadow-slate-900/10 flex flex-col items-center justify-center gap-3 group hover:-translate-y-1 transition-all">
                   <FiTarget size={24} className="group-hover:scale-110 transition-transform" />
                   <span className="text-[10px] font-bold uppercase tracking-widest text-center">ATS Check</span>
                </Link>
             </div>
          </div>
       </div>
    </div>
  );
};

export default CandidateDashboard;
