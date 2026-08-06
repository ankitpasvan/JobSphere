import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { applicationAPI, jobAPI, interviewAPI } from '../../services/api';
import { FiUser, FiFileText, FiCalendar, FiCheckCircle, FiXCircle, FiClock, FiMail, FiPhone, FiExternalLink, FiSearch, FiFilter, FiActivity, FiMessageSquare, FiUsers, FiVideo, FiBriefcase } from 'react-icons/fi';

const ViewApplications = ({ defaultJobId }) => {
  const { jobId: urlId } = useParams();
  const jobId = urlId || defaultJobId;
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [feedbackMap, setFeedbackMap] = useState({});
  const [scheduledInterviewMap, setScheduledInterviewMap] = useState({});
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [existingInterviewId, setExistingInterviewId] = useState(null);
  const [interviewData, setInterviewData] = useState({
    title: 'Technical Interview',
    date: '',
    time: '',
    location: 'Video Call (TalentBridge)',
  });

  useEffect(() => {
    fetchJobAndApplications();
    fetchScheduledInterviews();
  }, [jobId]);

  const fetchJobAndApplications = async () => {
    try {
      const resp = await applicationAPI.getJobApplications(jobId);
      setApplications(resp.data.applications);

      if (jobId !== 'all') {
        const jobResp = await jobAPI.getJobById(jobId);
        setJob(jobResp.data.job);
      }
    } catch (err) {
      console.error('Error loading applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduledInterviews = async () => {
    try {
      const resp = await interviewAPI.getRecruiterInterviews({ upcoming: true, limit: 100 });
      const map = {};
      (resp.data.interviews || []).forEach((interview) => {
        const applicationId = interview.application?._id || interview.application;
        if (applicationId) {
          map[applicationId] = interview._id;
        }
      });
      setScheduledInterviewMap(map);
    } catch (err) {
      console.error('Error loading scheduled interviews:', err);
    }
  };

  const handleStatusUpdate = async (appId, status) => {
    try {
      const note = feedbackMap[appId] || '';
      await applicationAPI.updateApplicationStatus(appId, { status, note });
      toast.success(`Applicant status updated to: ${status}`);
      setFeedbackMap({ ...feedbackMap, [appId]: '' });
      fetchJobAndApplications();
    } catch (err) {
      toast.error('Error updating status: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      const scheduledDate = new Date(`${interviewData.date}T${interviewData.time}`);

      if (isRescheduling && existingInterviewId) {
        // Reschedule existing interview
        const response = await interviewAPI.updateInterview(existingInterviewId, {
          scheduledDate,
          title: interviewData.title,
          location: interviewData.location
        });

        toast.success('Interview rescheduled successfully! Candidate notified.');
        setShowScheduleModal(false);
        setIsRescheduling(false);
        setExistingInterviewId(null);
        fetchJobAndApplications();
        fetchScheduledInterviews();
      } else {
        // Schedule new interview
        const response = await interviewAPI.scheduleInterview({
          applicationId: selectedApp._id,
          candidateId: selectedApp.candidate._id,
          jobId: selectedApp.job._id || jobId,
          scheduledDate,
          title: interviewData.title,
          meetingLink: ''
        });

        const interviewId = response.data.interview?._id;
        if (interviewId) {
          setScheduledInterviewMap(prev => ({ ...prev, [selectedApp._id]: interviewId }));
        }

        toast.success('Interview scheduled successfully');
        setShowScheduleModal(false);
        fetchJobAndApplications();
        fetchScheduledInterviews();
      }
    } catch (err) {
      toast.error(isRescheduling ? 'Error rescheduling interview' : 'Error scheduling interview');
      console.error(err);
    }
  };

  const handleOpenScheduleModal = async (app) => {
    setSelectedApp(app);
    const interviewId = scheduledInterviewMap[app._id];

    if (interviewId) {
      // Already scheduled - fetch existing interview data for rescheduling
      try {
        const response = await interviewAPI.getInterviewById(interviewId);
        const interview = response.data.interview;

        const scheduledDate = new Date(interview.scheduledDate);
        const dateStr = scheduledDate.toISOString().split('T')[0];
        const timeStr = scheduledDate.toTimeString().slice(0, 5);

        setInterviewData({
          title: interview.title || 'Technical Interview',
          date: dateStr,
          time: timeStr,
          location: interview.location || 'Video Call (TalentBridge)',
        });
        setIsRescheduling(true);
        setExistingInterviewId(interviewId);
      } catch (err) {
        console.error('Error fetching interview:', err);
        toast.error('Could not load interview details');
        return;
      }
    } else {
      // New interview - reset form
      setInterviewData({
        title: 'Technical Interview',
        date: '',
        time: '',
        location: 'Video Call (TalentBridge)',
      });
      setIsRescheduling(false);
      setExistingInterviewId(null);
    }

    setShowScheduleModal(true);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Loading applications...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 font-sans px-4 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header Section */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <Link to="/recruiter/jobs" className="text-xs font-bold text-blue-600 flex items-center gap-2 mb-4 hover:underline transition-all">
              ← Back to Job Postings
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {jobId === 'all' ? 'All Applications' : job?.title}
            </h1>
            <p className="text-slate-500 mt-1 font-medium flex items-center gap-2">
              <FiActivity size={18} className="text-blue-600" /> Reviewing candidates
            </p>
          </div>

          <div className="flex gap-8 divide-x divide-slate-100">
            <div className="text-center px-4">
              <p className="text-3xl font-bold text-slate-900">{applications.length}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Total Applicants</p>
            </div>
            <div className="text-center px-8">
              <p className="text-3xl font-bold text-emerald-600">{applications.filter(a => a.status === 'Shortlisted').length}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Shortlisted</p>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-6">
          {applications.length > 0 ? applications.map((app) => (
            <div key={app._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 group transition-all hover:border-blue-500">

              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">

                {/* Profile Section */}
                <div className="flex items-start gap-6 flex-1">
                  <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl font-black text-slate-600 shadow-inner overflow-hidden shrink-0 border border-slate-200 group-hover:border-blue-200 transition-all">
                    {app.candidate?.avatar ? (
                      <img src={app.candidate.avatar} alt="" className="w-full h-full object-cover" />
                    ) : app.candidate?.name?.[0]}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-1">{app.candidate?.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${app.status === 'Shortlisted' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          app.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                            app.status === 'Under Review' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                              'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                        Status: {app.status}
                      </span>

                      {app.candidate?.aiMockScore !== undefined && (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-200 shadow-sm transition-all hover:bg-amber-100">
                          🧠 Mock Score: {app.candidate.aiMockScore}/50
                        </span>
                      )}

                      {app.aiMatchData?.matchScore !== undefined && (
                        <div className="relative inline-block">
                          <span className={`peer inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm transition-all cursor-help ${app.aiMatchData.matchScore >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' :
                              app.aiMatchData.matchScore >= 50 ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' :
                                'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}>
                            ⚡ AI Synergy: {app.aiMatchData.matchScore}%
                          </span>
                          {app.aiMatchData.analysisReason && (
                            <div className="absolute top-[calc(100%+8px)] left-0 w-[280px] p-4 bg-slate-900 text-white text-[11px] font-semibold leading-relaxed rounded-2xl opacity-0 invisible peer-hover:opacity-100 peer-hover:visible transition-all duration-300 z-[100] shadow-2xl border border-white/10 transform -translate-y-2 peer-hover:translate-y-0">
                              <div className="mb-2 pb-2 border-b border-white/10 text-emerald-400 uppercase tracking-[0.2em] text-[8px] font-black">AI Analysis Recommendation</div>
                              {app.aiMatchData.analysisReason}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                        <FiMail className="text-slate-400 group-hover:text-blue-600 transition-colors" /> {app.candidate?.email}
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                        <FiPhone className="text-slate-400 group-hover:text-blue-600 transition-colors" /> {app.candidate?.phone || 'No phone'}
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold text-blue-600">
                        <FiBriefcase className="text-blue-400 shrink-0" /> <span className="uppercase tracking-widest text-[10px] font-black">Applied for:</span> {app.job?.title || 'Unknown Role'}
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                        <FiCalendar className="text-slate-400 group-hover:text-blue-600 transition-colors" /> Applied on: {new Date(app.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Terminal */}
                <div className="flex flex-col gap-3 min-w-[220px]">
                  {app.candidate?.profile?.resume && (
                    <button
                      onClick={() => {
                        const win = window.open();
                        win.document.write(`<iframe src="${app.candidate.profile.resume}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                        win.document.title = `Resume - ${app.candidate.name}`;
                      }}
                      className="flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-md active:scale-95"
                    >
                      View Resume <FiFileText />
                    </button>
                  )}
                  {app.candidate?.profile?.resumeLink && (
                    <a href={app.candidate.profile.resumeLink} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95">
                      External Drive Link <FiExternalLink />
                    </a>
                  )}
                  {app.status === 'Interview Scheduled' && (
                    <Link to={`/interview/${scheduledInterviewMap[app._id] || app._id}`} className="flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95">
                      Start Interview <FiVideo />
                    </Link>
                  )}

                  <div className="grid grid-cols-4 gap-2 mt-1">
                    <button
                      onClick={() => handleStatusUpdate(app._id, 'Under Review')}
                      className={`p-3 rounded-xl border flex items-center justify-center transition-all ${app.status === 'Under Review' ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-inner' : 'bg-white border-slate-200 text-slate-400 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200'}`}
                      title="Under Review"
                    >
                      <FiClock size={18} />
                    </button>

                    <button
                      onClick={() => handleStatusUpdate(app._id, 'Shortlisted')}
                      className={`p-3 rounded-xl border flex items-center justify-center transition-all ${app.status === 'Shortlisted' ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-inner' : 'bg-white border-slate-200 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'}`}
                      title="Shortlist"
                    >
                      <FiCheckCircle size={18} />
                    </button>

                    <button
                      onClick={() => handleOpenScheduleModal(app)}
                      className={`p-3 rounded-xl border flex items-center justify-center transition-all ${app.status === 'Interview Scheduled' ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-inner' : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200'}`}
                      title={scheduledInterviewMap[app._id] ? "Reschedule Interview" : "Schedule Interview"}
                    >
                      <FiCalendar size={18} />
                    </button>

                    <button
                      onClick={() => handleStatusUpdate(app._id, 'Rejected')}
                      className={`p-3 rounded-xl border flex items-center justify-center transition-all ${app.status === 'Rejected' ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-inner' : 'bg-white border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200'}`}
                      title="Reject Application"
                    >
                      <FiXCircle size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Internal Details */}
              <div className="mt-8 pt-8 border-t border-slate-50 flex flex-col xl:flex-row gap-10">
                <div className="flex-1 space-y-6">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest leading-relaxed">Candidate Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {app.candidate?.profile?.skills?.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-slate-50 text-slate-800 text-xs font-bold rounded-lg border border-slate-200 transition-colors">
                          {skill}
                        </span>
                      )) || <p className="text-xs text-slate-400 font-bold italic">No skills listed.</p>}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest leading-relaxed">Cover Letter / Message</h4>
                    <div className="p-5 bg-slate-50 text-slate-600 rounded-xl text-sm italic font-medium leading-relaxed border border-slate-200 group-hover:bg-white transition-colors">
                      {app.coverLetter || "No message provided."}
                    </div>
                  </div>
                </div>

                <div className="flex-1 xl:max-w-[360px]">
                  <div className="flex flex-col gap-3 h-full">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 leading-relaxed">
                      <FiMessageSquare className="text-blue-600" /> Recruiter Feedback (Internal)
                    </label>
                    <textarea
                      className="w-full flex-1 min-h-[140px] p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm font-bold placeholder:text-slate-400 transition-all shadow-inner"
                      placeholder="Write internal notes or feedback for this candidate..."
                      value={feedbackMap[app._id] || ''}
                      onChange={(e) => setFeedbackMap({ ...feedbackMap, [app._id]: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-20 text-center shadow-sm">
              <FiUsers className="mx-auto w-16 h-16 text-slate-100 mb-6" />
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No Applications Yet</p>
              <p className="text-xs text-slate-400 mt-2 font-medium italic">No candidates have applied for this job yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Interview Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm shadow-xl" onClick={() => setShowScheduleModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100">
                <FiCalendar size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                {isRescheduling ? 'Reschedule Interview' : 'Schedule Interview'}
              </h2>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Interview Title</label>
                <input type="text" className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={interviewData.title} onChange={(e) => setInterviewData({ ...interviewData, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Date</label>
                  <input type="date" className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={interviewData.date} onChange={(e) => setInterviewData({ ...interviewData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Time</label>
                  <input type="time" className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={interviewData.time} onChange={(e) => setInterviewData({ ...interviewData, time: e.target.value })}
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl text-sm shadow-lg hover:bg-blue-700 transition-all active:scale-95 mt-4">
                {isRescheduling ? 'Update and Notify Candidate' : 'Schedule and Send Notification'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewApplications;
