import { FiSearch, FiBell } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const DashboardHeader = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl px-8 py-6 flex items-center justify-between border-b border-slate-100">
      <div>
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
          {user?.role === 'recruiter' ? 'Recruiter Panel' : 'Candidate Panel'}
        </h2>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden lg:flex relative group">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-72 pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all"
          />
        </div>
        
        <button className="relative p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm">
          <FiBell size={20} />
          <span className="absolute top-3 right-3 w-2 h-2 bg-blue-600 border-2 border-white rounded-full"></span>
        </button>

        <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-slate-900 uppercase">{user?.name}</p>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">
              {user?.role === 'recruiter' ? 'Hiring Team' : 'Job Seeker'}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-2xl p-0.5 shadow-xl ${user?.role === 'recruiter' ? 'bg-slate-900 shadow-slate-900/10' : 'bg-blue-600 shadow-blue-600/10'}`}>
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-slate-900 font-black uppercase tracking-tighter">
              {user?.name?.[0]}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
