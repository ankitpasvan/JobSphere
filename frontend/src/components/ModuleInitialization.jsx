import { FiZap, FiLoader } from 'react-icons/fi';

const ModuleInitialization = ({ title, description }) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-slate-50 rounded-[3rem] border border-slate-100 my-12 mx-auto max-w-5xl text-center shadow-2xl shadow-slate-200/50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-100 rounded-full blur-[100px] opacity-20 translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="relative z-10">
        <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center shrink-0 mx-auto mb-8 shadow-xl shadow-slate-900/20 group">
          <FiZap className="text-blue-500 group-hover:scale-110 transition-transform" size={40} strokeWidth={2.5} />
        </div>
        
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-full mb-4 animate-pulse">
          <FiLoader className="animate-spin" /> SYSTEM INITIALIZING
        </div>
        
        <h1 className="text-4xl font-black text-slate-900 tracking-tight italic mb-4">
          {title} <span className="text-blue-600">Protocol</span>
        </h1>
        <p className="text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
          {description || "The requested module is currently undergoing system calibration and integration. Please standby for deployment."}
        </p>
        
        <div className="mt-12 pt-8 border-t border-slate-200/50 w-full max-w-xs mx-auto">
          <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            <span>Deployment Status</span>
            <span>85% complete</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="w-[85%] h-full bg-blue-600 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleInitialization;
