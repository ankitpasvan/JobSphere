import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { applicationAPI, interviewAPI } from '../../services/api';
import { FiClock, FiCheckCircle, FiXCircle, FiTrendingUp, FiArrowRight, FiInfo, FiTrash2, FiFileText, FiSend, FiBriefcase } from 'react-icons/fi';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchApplications();
    fetchStats();
    fetchInterviews();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await applicationAPI.getMyApplications();
      setApplications(response.data.applications);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const resp = await applicationAPI.getApplicationStats();
      setStats(resp.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInterviews = async () => {
    try {
      const resp = await interviewAPI.getMyInterviews({ upcoming: true, limit: 50 });
      setInterviews(resp.data.interviews || []);
    } catch (err) {
      console.error('Error fetching interviews:', err);
    }
  };

  const getInterviewIdForApplication = (applicationId) => {
    const interview = interviews.find((item) => {
      const linkedApplicationId = item.application?._id || item.application;
      return linkedApplicationId === applicationId;
    });
    return interview?._id;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Applied': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Under Review': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'Shortlisted': return 'bg-violet-50 text-violet-600 border-violet-100';
      case 'Interview Scheduled': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Accepted': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Applied': return <FiSend />;
      case 'Under Review': return <FiClock />;
      case 'Shortlisted': return <FiTrendingUp />;
      case 'Interview Scheduled': return <FiInfo />;
      case 'Rejected': return <FiXCircle />;
      case 'Accepted': return <FiCheckCircle />;
      default: return <FiInfo />;
    }
  };

  const getLatestNote = (app) => {
    if (!app.statusHistory || app.statusHistory.length === 0) return null;
    for (let i = app.statusHistory.length - 1; i >= 0; i--) {
       if (app.statusHistory[i].note) return app.statusHistory[i].note;
    }
    return null;
  };

  const handleWithdraw = (id) => {
    toast((t) => (
      <div>
        <p className="font-bold text-slate-800 mb-3">Withdraw this application? This action is irreversible.</p>
        <div className="flex gap-2 justify-end">
          <button 
            className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-bold shadow-sm"
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await applicationAPI.withdrawApplication(id);
                setApplications(prev => prev.filter(app => app._id !== id));
                fetchStats();
                toast.success('Application withdrawn successfully');
              } catch (error) {
                toast.error('Error withdrawing application');
              }
            }}
          >
            Confirm
          </button>
          <button 
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold border border-slate-200"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        {/* Header and Stats */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-end gap-6 mb-8">
          
          {stats && (
            <div className="flex flex-wrap gap-4">
               <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <FiTrendingUp />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Applications</p>
                    <p className="text-xl font-bold text-slate-900">{stats.total}</p>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Content Table / Cards */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
             <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
             <p className="font-bold text-sm text-slate-500">Loading your applications...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.length > 0 ? applications.map((app) => (
              <div key={app._id} className="bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all p-6 flex flex-col gap-4 relative">
                 {/* Top Row: Info + Actions */}
                 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center font-bold text-xl text-slate-800 border border-slate-100">
                        {app.job?.company ? app.job.company[0] : 'J'}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-0.5">
                          {app.job?.title || 'Role'}
                        </h3>
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                          <span className="text-blue-600">{app.job?.company}</span> • <span>{app.job?.location}</span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                           Applied on {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-6">
                      <div className="flex flex-col lg:items-end gap-2">
                        {app.aiMatchData?.matchScore !== undefined && (
                          <div className={`px-4 py-1.5 rounded-full border ${
                            app.aiMatchData.matchScore >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            app.aiMatchData.matchScore >= 50 ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            'bg-slate-50 text-slate-700 border-slate-100'
                          } text-[11px] font-bold flex items-center gap-2`}>
                            ⚡ AI Match: {app.aiMatchData.matchScore}%
                          </div>
                        )}
                        <div className={`px-4 py-1.5 rounded-full border ${getStatusColor(app.status)} text-[11px] font-bold flex items-center gap-2`}>
                          {getStatusIcon(app.status)} {app.status}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                         {app.status === 'Interview Scheduled' && getInterviewIdForApplication(app._id) && (
                           <Link to={`/interview/${getInterviewIdForApplication(app._id)}`} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-sm">
                            Join Call
                           </Link>
                         )}
                         <button 
                           onClick={() => handleWithdraw(app._id)}
                           className="w-9 h-9 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                         >
                           <FiTrash2 size={16} />
                         </button>
                      </div>
                   </div>
                 </div>

                 {/* Note if available */}
                 {getLatestNote(app) && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mt-2">
                       <p className="text-xs font-bold text-blue-600 mb-1">Update from Recruiter:</p>
                       <p className="text-sm text-slate-600 font-medium leading-relaxed">{getLatestNote(app)}</p>
                    </div>
                 )}
              </div>
            )) : (
              <div className="py-24 bg-white rounded-3xl border border-slate-200 border-dashed text-center">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-6">
                   <FiBriefcase className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">No applications found</h3>
                 <p className="text-slate-500 font-medium mb-8 max-w-sm mx-auto">Start your career journey by browsing open roles that match your skills.</p>
                 <Link to="/candidate/jobs" className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg active:scale-95 inline-block">
                    Browse Jobs
                 </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplications;
