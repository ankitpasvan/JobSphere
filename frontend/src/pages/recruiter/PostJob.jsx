import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { jobAPI } from '../../services/api';
import { 
  FiBriefcase, FiMapPin, FiClock, FiDollarSign, FiSend, 
  FiCheckCircle, FiChevronLeft, FiPlus, FiArrowRight, FiZap, FiTarget 
} from 'react-icons/fi';
import DashboardHeader from '../../components/DashboardHeader';

const PostJob = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    category: 'Software Development',
    description: '',
    location: '',
    workMode: 'On-site',
    jobType: 'Full-time',
    salary: { min: 0, max: 0, currency: 'INR' },
    applicationDeadline: '',
    requirements: '',
    responsibilities: '',
    skills: '',
    companyLogo: '',
    openings: 1,
    isPaid: true,
    duration: 'Permanent'
  });

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    setFetching(true);
    try {
      const response = await jobAPI.getJobById(jobId);
      const job = response.data.job;
      setFormData({
        title: job.title || '',
        company: job.company || '',
        category: job.category || 'Software Development',
        description: job.description || '',
        location: job.location || '',
        workMode: job.workMode || 'On-site',
        jobType: job.jobType || 'Full-time',
        salary: {
          min: job.salary?.min || 0,
          max: job.salary?.max || 0,
          currency: job.salary?.currency || 'INR'
        },
        applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline).toISOString().split('T')[0] : '',
        requirements: job.requirements?.join(', ') || '',
        responsibilities: job.responsibilities?.join(', ') || '',
        skills: job.skills?.join(', ') || '',
        companyLogo: job.companyLogo || '',
        openings: job.openings || 1,
        isPaid: job.isPaid !== undefined ? job.isPaid : true,
        duration: job.duration || 'Permanent'
      });
    } catch (error) {
      toast.error('Failed to fetch job details');
      navigate('/recruiter/jobs');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const processedData = {
        ...formData,
        requirements: formData.requirements.split(',').map(s => s.trim()).filter(s => s !== ''),
        responsibilities: formData.responsibilities.split(',').map(s => s.trim()).filter(s => s !== ''),
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s !== ''),
        salary: {
          ...formData.salary,
          min: Number(formData.salary.min),
          max: Number(formData.salary.max)
        }
      };

      if (jobId) {
        await jobAPI.updateJob(jobId, processedData);
        toast.success('Job Posting Updated Successfully');
      } else {
        await jobAPI.createJob(processedData);
        toast.success('Job Published to TalentBridge');
      }
      navigate('/recruiter/jobs');
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || 'Error saving job';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="flex items-center justify-center min-h-[400px]">
       <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-8 flex items-center justify-between">
        <button 
          onClick={() => navigate('/recruiter/jobs')}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-xs uppercase tracking-widest transition-all"
        >
          <FiChevronLeft size={16} /> Back to Jobs
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        {/* Header Section */}
        <div className="px-10 py-12 bg-slate-900 text-white">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                 <h1 className="text-3xl font-bold tracking-tight mb-2">
                   {jobId ? 'Edit Job Posting' : 'Post a New Job'}
                 </h1>
                 <p className="text-slate-400 text-sm font-medium max-w-md">
                   Provide the details below to help candidates understand the role and requirements.
                 </p>
              </div>
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white/40">
                 <FiBriefcase size={32} />
              </div>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 md:p-12 space-y-12">
          
          {/* Section 1: Job Information */}
          <section className="space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
               <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
               <h3 className="text-lg font-bold text-slate-900">Job Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Job Title</label>
                  <input 
                    type="text" required placeholder="e.g. Frontend Developer"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:bg-white outline-none transition-all font-semibold text-slate-900"
                    value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Company Name</label>
                  <input 
                    type="text" required placeholder="Company Name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:bg-white outline-none transition-all font-semibold text-slate-900"
                    value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})}
                  />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Location</label>
                  <div className="relative">
                    <FiMapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" required placeholder="City, Country or Remote"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-6 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:bg-white outline-none transition-all font-semibold text-slate-900"
                      value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Company Logo URL</label>
                  <input 
                    type="text" placeholder="https://logo-url.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:bg-white outline-none transition-all text-sm font-medium text-slate-600"
                    value={formData.companyLogo} onChange={(e) => setFormData({...formData, companyLogo: e.target.value})}
                  />
               </div>
            </div>
          </section>

          {/* Section 2: Salary & Details */}
          <section className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-200/50 pb-4">
               <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
               <h3 className="text-lg font-bold text-slate-900">Salary & Job Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Job Type</label>
                  <select 
                    className="w-full bg-white border border-slate-200 rounded-xl py-4 px-6 focus:border-blue-600 outline-none transition-all font-bold text-slate-700 appearance-none cursor-pointer"
                    value={formData.jobType} onChange={(e) => setFormData({...formData, jobType: e.target.value})}
                  >
                     <option value="Full-time">Full-time</option>
                     <option value="Internship">Internship</option>
                     <option value="Contract">Contract</option>
                     <option value="Part-time">Part-time</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Work Mode</label>
                  <select 
                    className="w-full bg-white border border-slate-200 rounded-xl py-4 px-6 focus:border-blue-600 outline-none transition-all font-bold text-slate-700 appearance-none cursor-pointer"
                    value={formData.workMode} onChange={(e) => setFormData({...formData, workMode: e.target.value})}
                  >
                     <option value="On-site">On-site</option>
                     <option value="Remote">Remote</option>
                     <option value="Hybrid">Hybrid</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Category</label>
                  <select 
                    className="w-full bg-white border border-slate-200 rounded-xl py-4 px-6 focus:border-blue-600 outline-none transition-all font-bold text-slate-700 appearance-none cursor-pointer"
                    value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                     <option value="Software Development">Software Development</option>
                     <option value="Data Science">Data Science</option>
                     <option value="Design">Design</option>
                     <option value="Marketing">Marketing</option>
                     <option value="HR">Human Resources</option>
                  </select>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Min Salary (Annual INR)</label>
                  <input 
                    type="number" required placeholder="0"
                    className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 focus:border-blue-600 outline-none transition-all font-bold text-slate-900"
                    value={formData.salary.min} onChange={(e) => setFormData({...formData, salary: {...formData.salary, min: e.target.value}})}
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Max Salary (Annual INR)</label>
                  <input 
                    type="number" required placeholder="0"
                    className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 focus:border-blue-600 outline-none transition-all font-bold text-slate-900"
                    value={formData.salary.max} onChange={(e) => setFormData({...formData, salary: {...formData.salary, max: e.target.value}})}
                  />
               </div>
            </div>
          </section>

          {/* Section 3: Requirements */}
          <section className="space-y-10">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
               <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
               <h3 className="text-lg font-bold text-slate-900">Requirements & Description</h3>
            </div>

            <div className="space-y-8">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Required Skills</label>
                  <textarea 
                    required placeholder="React, Node.js, JavaScript..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-5 px-8 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:bg-white outline-none transition-all text-sm font-bold text-blue-600 min-h-[80px]"
                    value={formData.skills} onChange={(e) => setFormData({...formData, skills: e.target.value})}
                  />
                  <p className="text-[10px] text-slate-400 font-medium ml-2">Separate skills with commas. These are used for candidate matching.</p>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Qualifications</label>
                  <textarea 
                    required placeholder="Education, years of experience, etc."
                    className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-5 px-8 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:bg-white outline-none transition-all text-sm font-medium text-slate-700 min-h-[120px]"
                    value={formData.requirements} onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                  />
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Full Job Description</label>
                  <textarea 
                    required placeholder="Describe the role and responsibilities..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-5 px-8 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:bg-white outline-none transition-all text-sm font-medium text-slate-700 min-h-[200px]"
                    value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
               </div>
            </div>
          </section>

          {/* Section 4: Timeline */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Application Deadline</label>
                <input 
                  type="date" required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:bg-white outline-none transition-all font-bold text-slate-700"
                  value={formData.applicationDeadline} onChange={(e) => setFormData({...formData, applicationDeadline: e.target.value})}
                />
             </div>
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Number of Vacancies</label>
                <input 
                  type="number" required min="1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:bg-white outline-none transition-all font-bold text-slate-900"
                  value={formData.openings} onChange={(e) => setFormData({...formData, openings: e.target.value})}
                />
             </div>
          </section>

          {/* Final Actions */}
          <div className="pt-10 border-t border-slate-50 flex flex-col sm:flex-row gap-6">
             <button 
               type="button" 
               onClick={() => navigate('/recruiter/jobs')}
               className="flex-1 py-4 text-slate-500 font-bold hover:text-slate-900 transition-all uppercase tracking-widest text-xs"
             >
                Cancel
             </button>
             <button 
               type="submit" 
               disabled={loading}
               className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/10 hover:bg-slate-900 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs active:scale-95 disabled:opacity-50"
             >
                {loading ? 'Processing...' : (jobId ? 'Update Job' : 'Post Job')} <FiArrowRight size={18} />
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostJob;
