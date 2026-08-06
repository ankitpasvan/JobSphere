import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { jobAPI } from '../../services/api';
import { FiPlus, FiBriefcase, FiTrash2, FiEdit3, FiUsers, FiMapPin } from 'react-icons/fi';

const ManageJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    fetchMyJobs();
    fetchStats();
  }, []);

  const fetchMyJobs = async () => {
    try {
      const response = await jobAPI.getMyJobs();
      setJobs(response.data.jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const resp = await jobAPI.getJobStats();
      setStats(resp.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div className="bg-white border-2 border-slate-100 p-6 rounded-[32px] shadow-2xl max-w-sm">
        <p className="font-bold text-slate-900 text-sm mb-6 leading-relaxed">Are you absolutely sure you want to delete this job listing? This action cannot be undone.</p>
        <div className="flex gap-4">
          <button 
            className="flex-1 px-6 py-4 bg-rose-600 text-white rounded-2xl text-[10px] uppercase font-black tracking-widest active:scale-95 transition-all shadow-xl shadow-rose-600/20"
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await jobAPI.deleteJob(id);
                setJobs(prev => prev.filter(j => j._id !== id));
                fetchStats();
                toast.success('Listing Permanently Removed');
              } catch (error) {
                toast.error('Connection Error: Could not delete');
              }
            }}
          >
            Delete
          </button>
          <button 
            className="flex-1 px-6 py-4 bg-slate-50 text-slate-500 rounded-2xl text-[10px] uppercase font-black tracking-widest border border-slate-200 active:scale-95 transition-all"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: Infinity, style: { padding: 0 } });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      
      {/* Title & Action Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-4">
         <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Job Inventory</h1>
            <p className="text-slate-500 font-medium mt-1">Audit, manage, and monitor your organization's active openings.</p>
         </div>
         <button 
           onClick={() => navigate('/recruiter/jobs/new')}
           className="bg-blue-600 text-white px-10 py-5 rounded-[22px] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-2xl shadow-blue-600/20 flex items-center justify-center gap-3 active:scale-95"
         >
           <FiPlus size={20} /> Publish New Role
         </button>
      </div>

      {/* Overview Analytics */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
           <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-blue-200 transition-all">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 text-2xl group-hover:bg-blue-600 group-hover:text-white transition-all"><FiBriefcase /></div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Roles</p>
                 <p className="text-3xl font-bold text-slate-900">{stats.totalJobs || 0}</p>
              </div>
           </div>
           
           <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-indigo-200 transition-all">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all"><FiUsers /></div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Applicants</p>
                 <p className="text-3xl font-bold text-slate-900">
                    {stats.stats?.reduce((acc, curr) => acc + (curr.totalApplications || 0), 0) || 0}
                 </p>
              </div>
           </div>
        </div>
      )}

      {/* Main Inventory Board */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[32px] border border-slate-100 shadow-sm">
           <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-6"></div>
           <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Synchronizing Inventory...</p>
        </div>
      ) : (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-900/5 overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full">
                <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                   <tr>
                      <th className="px-10 py-6 text-left">Internal Identity</th>
                      <th className="px-10 py-6 text-left">Status</th>
                      <th className="px-10 py-6 text-left">Activity</th>
                      <th className="px-10 py-6 text-right">Operations</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {jobs.length > 0 ? jobs.map((job) => (
                      <tr key={job._id} className="hover:bg-slate-50/50 transition-all group">
                         <td className="px-10 py-8">
                            <div className="flex items-center gap-6">
                               <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-xl font-bold text-slate-900 border border-slate-100 overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                                  {job.companyLogo ? <img src={job.companyLogo} className="w-full h-full object-cover" /> : job.title[0]}
                               </div>
                               <div>
                                  <h4 className="font-bold text-slate-900 text-lg tracking-tight mb-1">{job.title}</h4>
                                  <div className="flex items-center gap-4 text-[11px] text-slate-400 font-bold uppercase tracking-tighter">
                                     <span className="flex items-center gap-1.5"><FiMapPin /> {job.location}</span>
                                     <span className="flex items-center gap-1.5"><FiBriefcase /> {job.jobType}</span>
                                  </div>
                               </div>
                            </div>
                         </td>
                         <td className="px-10 py-8">
                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                job.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                               {job.status}
                            </span>
                         </td>
                         <td className="px-10 py-8">
                            <Link 
                               to={`/recruiter/applications/${job._id}`}
                               className="inline-flex flex-col group/app"
                            >
                               <span className="text-2xl font-black text-slate-900 group-hover/app:text-blue-600 transition-colors leading-none tracking-tighter">{job.applicationsCount}</span>
                               <span className="text-[10px] font-bold text-slate-400 uppercase">Applicants</span>
                            </Link>
                         </td>
                         <td className="px-10 py-8 text-right">
                            <div className="flex items-center justify-end gap-3 text-slate-300">
                               <button 
                                 onClick={() => navigate(`/recruiter/jobs/edit/${job._id}`)}
                                 className="w-12 h-12 flex items-center justify-center bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:shadow-lg transition-all"
                                 title="Edit Profile"
                               >
                                 <FiEdit3 size={18} />
                               </button>
                               <button 
                                 onClick={() => handleDelete(job._id)}
                                 className="w-12 h-12 flex items-center justify-center bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-rose-600 hover:border-rose-100 hover:shadow-lg transition-all"
                                 title="Purge Listing"
                               >
                                 <FiTrash2 size={18} />
                               </button>
                            </div>
                         </td>
                      </tr>
                   )) : (
                      <tr>
                         <td colSpan="4" className="px-10 py-32 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center mx-auto mb-6 text-slate-200 border border-dashed border-slate-200">
                               <FiBriefcase size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">No Active Listings</h3>
                            <p className="text-slate-400 text-sm font-medium">Create your first job posting to begin receiving high-quality candidates.</p>
                         </td>
                      </tr>
                   )}
                </tbody>
             </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default ManageJobs;
