import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { jobAPI, applicationAPI, authAPI } from '../../services/api';
import { FiSearch, FiMapPin, FiBriefcase, FiDollarSign, FiFilter, FiSend, FiCheckCircle, FiInfo, FiArrowLeft, FiZap, FiTarget, FiAlertCircle, FiClock, FiCheck, FiArrowRight } from 'react-icons/fi';


const BrowseJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [filters, setFilters] = useState({
    keyword: '',
    location: '',
    category: '',
    jobType: '',
    workMode: '',
  });
  const [selectedJob, setSelectedJob] = useState(null);
  const [modalPhase, setModalPhase] = useState('details');
  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
  });
  const [stats, setStats] = useState(null);
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);


  useEffect(() => {
    fetchJobs();
    fetchStats();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await jobAPI.getAllJobs(filters);
      setJobs(response.data.jobs);
      
      const appResp = await applicationAPI.getMyApplications();
      setAppliedJobIds(appResp.data.applications.map(app => app.job._id || app.job));
    } catch (error) {
      console.error('Error fetching jobs:', error);
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

  const handleApply = async (e) => {
    e.preventDefault();
    setApplying(true);
    try {
      await applicationAPI.applyForJob({
        jobId: selectedJob._id,
        coverLetter: applicationData.coverLetter,
      });
      toast.success('Application submitted successfully!');
      setSelectedJob(null);
      setModalPhase('details');
      setApplicationData({ coverLetter: '' });
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error applying for job');
    } finally {
      setApplying(false);
    }
  };

  const handleAnalyzeMatch = async () => {
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      const resp = await applicationAPI.analyzeMatch(selectedJob._id);
      setAnalysisResult(resp.data.data);
      setModalPhase('analysis');
      toast.success('AI Synergy Analysis Complete!');
    } catch (err) {
      toast.error('AI analysis failed. Please ensure your profile is complete.');
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };



  return (
    <div>
      {/* Header Info Section - Kept stats but removed redundant title */}
      <div className="mb-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-end gap-6 mb-8">
          {stats && (
            <div className="flex gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <FiSend />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8]">Active Submissions</p>
                  <p className="text-xl font-black text-[#0f172a]">{stats.total}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="relative group">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Job title or keywords..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-medium"
              value={filters.keyword}
              onChange={(e) => setFilters({...filters, keyword: e.target.value})}
            />
          </div>
          <div className="relative">
            <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input 
              type="text" 
              placeholder="City or remote..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-medium"
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
            />
          </div>
          <div className="relative">
            <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <select 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-medium appearance-none"
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
            >
              <option value="">All Categories</option>
              <option value="Software Development">Software Development</option>
              <option value="Data Science">Data Science</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
              <option value="Customer Support">Customer Support</option>
            </select>
          </div>
          <div className="relative">
            <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <select 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-medium appearance-none"
              value={filters.jobType}
              onChange={(e) => setFilters({...filters, jobType: e.target.value})}
            >
              <option value="">All Job Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
              <option value="Freelance">Freelance</option>
            </select>
          </div>
          <div className="relative">
            <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <select 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-medium appearance-none"
              value={filters.workMode}
              onChange={(e) => setFilters({...filters, workMode: e.target.value})}
            >
              <option value="">All Work Modes</option>
              <option value="On-site">On-site</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>
          <button 
            onClick={fetchJobs}
            className="bg-blue-600 text-white py-3 rounded-2xl font-semibold tracking-wide text-sm hover:bg-blue-700 transition-all shadow-md active:scale-95"
          >
            Search Jobs
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-700">
             <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
             <p className="font-semibold text-sm text-slate-500">Loading jobs...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.length > 0 ? jobs.map((job) => (
              <div key={job._id} onClick={() => { setSelectedJob(job); setModalPhase('details'); }} className="cursor-pointer bg-white p-6 rounded-[2rem] border border-slate-100 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center font-bold text-blue-600 text-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 overflow-hidden shadow-sm border border-slate-100">
                      <img 
                        src={job.companyLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=f1f5f9&color=2563eb&bold=true&size=128`} 
                        alt={job.company} 
                        className="w-full h-full object-contain p-2" 
                        onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=f1f5f9&color=2563eb&bold=true&size=128`; }}
                      />
                    </div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold border border-blue-100">
                      {job.jobType}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">{job.title}</h3>
                  <p className="text-sm font-semibold text-slate-500 mb-6 flex items-center gap-1">
                    <FiInfo className="text-blue-400" /> {job.company}
                  </p>
                  
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-sm text-[#475569] font-medium">
                      <FiMapPin className="text-[#94a3b8]" /> {job.location} • {job.workMode}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#475569] font-medium">
                      <FiDollarSign className="text-[#94a3b8]" /> ₹{job.salary.min} - ₹{job.salary.max} / Year
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-400">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                  {appliedJobIds.includes(job._id) ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedJob(job); setModalPhase('details'); }}
                      className="px-5 py-2.5 bg-emerald-50 text-emerald-600 font-semibold rounded-xl flex items-center gap-2 text-sm border border-emerald-100"
                    >
                      <FiCheckCircle /> Applied
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedJob(job); setModalPhase('details'); }}
                      className="px-5 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center gap-2 text-sm"
                    >
                      View Details <FiSend className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )) : (
              <div className="col-span-full py-32 text-center">
                <FiBriefcase className="w-16 h-16 text-[#e2e8f0] mx-auto mb-6" />
                <p className="text-xl font-black text-[#0f172a] uppercase italic mb-2">No active directives found</p>
                <p className="text-[#64748b] font-medium">Try adjusting your search filters to find high-stakes opportunities.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Application Details & Apply Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-md" onClick={() => setSelectedJob(null)}></div>
          <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col overflow-x-hidden soft-scrollbar">
             <div className="bg-slate-900 p-8 text-white relative shrink-0">
                 <div className="absolute top-8 right-8 cursor-pointer opacity-50 hover:opacity-100 transition-all font-semibold text-sm bg-white/10 px-4 py-2 rounded-xl" onClick={() => setSelectedJob(null)}>Close X</div>
                 <div className="flex items-center gap-6 mt-4">
                    <div className="w-20 h-20 bg-white rounded-[1.5rem] flex items-center justify-center p-2 shadow-inner shrink-0 overflow-hidden border border-slate-700/30">
                       <img 
                        src={selectedJob.companyLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedJob.company)}&background=f1f5f9&color=2563eb&bold=true&size=128`} 
                        className="w-full h-full object-contain" 
                        alt="Logo"
                        onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedJob.company)}&background=f1f5f9&color=2563eb&bold=true&size=128`; }}
                       />
                    </div>
                    <div>
                       <h2 className="text-2xl lg:text-3xl font-bold tracking-tight mb-2 pr-12">{selectedJob.title}</h2>
                       <p className="text-blue-200 font-semibold">{selectedJob.company} &bull; {selectedJob.location}</p>
                    </div>
                 </div>
             </div>
             
             {modalPhase === 'details' ? (
               <div className="p-8 space-y-8 pb-12">
                 <div>
                   <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-widest border-b border-slate-100 pb-2">About the Role</h3>
                   <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-line">{selectedJob.description}</p>
                 </div>
                 
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Salary Range</p>
                      <p className="font-bold text-slate-800 text-sm">₹{selectedJob.salary.min} - ₹{selectedJob.salary.max}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Work Mode</p>
                       <p className="font-bold text-slate-800 text-sm">{selectedJob.workMode}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Job Type</p>
                       <p className="font-bold text-slate-800 text-sm">{selectedJob.jobType}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Experience</p>
                       <p className="font-bold text-slate-800 text-sm">{selectedJob.experience?.min || 0}-{selectedJob.experience?.max || 3}+ years</p>
                    </div>
                 </div>

                 {selectedJob.skills?.length > 0 && (
                   <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100/50">
                     <h3 className="text-xs font-black text-blue-600 mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                       <FiZap className="text-amber-500" /> Required Tech Stack
                     </h3>
                     <div className="flex flex-wrap gap-2">
                       {selectedJob.skills.map((skill, i) => (
                         <span key={i} className="px-4 py-2 bg-white text-blue-700 text-xs font-bold rounded-xl shadow-sm border border-blue-100/50">
                           {skill}
                         </span>
                       ))}
                     </div>
                   </div>
                 )}

                 {selectedJob.requirements?.length > 0 && (
                   <div>
                     <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-widest border-b border-slate-100 pb-2">Requirements</h3>
                     <ul className="list-disc pl-5 space-y-2 text-sm font-medium text-slate-600">
                       {selectedJob.requirements.map((r, i) => <li key={i}>{r}</li>)}
                     </ul>
                   </div>
                 )}

                 {selectedJob.responsibilities?.length > 0 && (
                   <div>
                     <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-widest border-b border-slate-100 pb-2">Responsibilities</h3>
                     <ul className="list-disc pl-5 space-y-2 text-sm font-medium text-slate-600">
                       {selectedJob.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                     </ul>
                   </div>
                 )}
                 
                 <div className="pt-8 border-t border-slate-100 flex flex-col lg:flex-row justify-end gap-4 mt-8">

                     {!appliedJobIds.includes(selectedJob._id) && (
                       <button 
                        onClick={handleAnalyzeMatch} 
                        disabled={analyzing}
                        className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl active:scale-95 text-center flex-1 lg:flex-none"
                       >
                         {analyzing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><FiZap className="text-yellow-400" /> AI Synergy Score</>}
                       </button>
                     )}
                     {appliedJobIds.includes(selectedJob._id) ? (
                        <button disabled className="px-8 py-4 bg-emerald-50 text-emerald-600 font-bold rounded-2xl flex items-center justify-center gap-3 cursor-not-allowed border border-emerald-100 w-full lg:w-auto">
                          <FiCheckCircle size={20}/> Already Applied
                        </button>
                     ) : (
                        <button onClick={() => setModalPhase('apply')} className="flex-1 lg:flex-none px-12 py-4 bg-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 text-center">
                          Proceed to Apply <FiArrowLeft className="rotate-180" />
                        </button>
                     )}
                  </div>
               </div>

             ) : modalPhase === 'analysis' ? (
                 <div className="p-8 space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 soft-scrollbar overflow-y-auto">
                    <div className="flex items-center gap-4 mb-2 pb-4 border-b border-slate-100">
                      <button onClick={() => setModalPhase('details')} className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all">
                        <FiArrowLeft />
                      </button>
                      <p className="font-bold text-slate-800 uppercase tracking-widest text-xs">Groq-AI Synergy Analysis</p>
                    </div>

                    {/* Score Gauge */}
                    <div className="bg-slate-50 rounded-[2rem] p-8 flex flex-col items-center text-center border border-slate-100 shadow-inner">
                      <div className="relative w-32 h-32 flex items-center justify-center mb-4 scale-110">
                        <svg className="w-full h-full -rotate-90">
                          <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-200" />
                          <circle 
                            cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" 
                            strokeDasharray={2 * Math.PI * 58} 
                            strokeDashoffset={2 * Math.PI * 58 * (1 - (analysisResult?.matchScore || 0) / 100)} 
                            strokeLinecap="round"
                            className={analysisResult?.matchScore > 80 ? 'text-emerald-500' : analysisResult?.matchScore > 50 ? 'text-blue-500' : 'text-amber-500'} 
                          />
                        </svg>
                        <span className="absolute text-3xl font-black text-slate-900">{analysisResult?.matchScore || 0}%</span>
                      </div>
                      <h4 className="text-xl font-bold text-slate-800 mt-2">Synergy Rating</h4>
                      <p className="text-slate-500 text-[11px] mt-2 font-medium max-w-[240px]">AI comparison between your profile and this specific role.</p>
                    </div>

                    <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-xl border border-white/10">
                       <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] mb-4 text-blue-400"><FiInfo /> AI Recommendation</h4>
                       <p className="text-sm font-medium leading-relaxed italic">"{analysisResult?.analysisReason || 'Synergy analysis complete.'}"</p>
                       <div className="mt-6 flex items-center gap-3">
                          <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                             analysisResult?.recommendation === 'Shortlist' ? 'bg-emerald-500 text-white' :
                             analysisResult?.recommendation === 'Review' ? 'bg-blue-500 text-white' :
                             'bg-amber-500 text-white'
                          }`}>{analysisResult?.recommendation || 'Analyzing'}</span>
                       </div>
                    </div>

                    {/* Skills Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">Matched Traits</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult?.matchingSkills?.map(s => (
                            <span key={s} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-100">{s}</span>
                          )) || <p className="text-[10px] text-slate-400 italic">No direct matches identified.</p>}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-600">Gaps Identified</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult?.missingSkills?.map(s => (
                            <span key={s} className="px-3 py-1.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-100">{s}</span>
                          )) || <p className="text-[10px] text-slate-400 italic">No significant gaps found.</p>}
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                      <button onClick={() => setModalPhase('apply')} className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:bg-blue-700 transition-all active:scale-95 text-base">
                        Proceed to Apply <FiArrowRight />
                      </button>
                    </div>
                </div>
             ) : (
               <div className="p-8 pb-12">
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                    <button onClick={() => setModalPhase('details')} className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all">
                      <FiArrowLeft />
                    </button>
                    <p className="font-bold text-slate-800 uppercase tracking-widest text-xs">Application Form</p>
                  </div>

                  <form className="space-y-6" onSubmit={handleApply}>
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Cover Letter (Optional)</label>
                        <textarea 
                          required
                          className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl min-h-[160px] focus:bg-white focus:border-blue-600 outline-none transition-all font-medium text-sm leading-relaxed"
                          placeholder="Detail your engineering prowess and why you're a fit for this directive..."
                          value={applicationData.coverLetter}
                          onChange={(e) => setApplicationData({...applicationData, coverLetter: e.target.value})}
                        ></textarea>
                     </div>

                     <div className="bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-200">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-2">Resume Module</p>
                        <div className="flex items-center justify-between">
                           <p className="text-xs text-slate-500 font-bold italic line-clamp-1">
                             System will securely attach your Profile Resume
                           </p>
                           <Link to="/profile" className="text-[10px] font-black text-blue-600 uppercase hover:underline">Edit Profile [→]</Link>
                        </div>
                     </div>

                     <p className="text-xs text-slate-500 font-medium flex gap-2 items-center bg-blue-50 p-4 rounded-xl border border-blue-100/50">
                       <FiCheckCircle className="text-blue-500 shrink-0" size={16}/> Your profile details and resume will be automatically shared with the employer.
                     </p>

                     <button 
                       type="submit"
                       disabled={applying}
                       className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:bg-blue-700 transition-all active:scale-95 text-base"
                     >
                       {applying ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (
                         <>Submit Final Application <FiSend /></>
                       )}
                     </button>
                  </form>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseJobs;
