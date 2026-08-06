import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowRight, 
  BrainCircuit, 
  FileText, 
  ShieldCheck, 
  ScanSearch, 
  TrendingUp,
  Video,
  ChevronRight,
  Briefcase,
  Users,
  Sparkles,
  Command,
  ArrowUpRight,
  Target,
  Zap
} from 'lucide-react';
import logo from '../assets/logo.png';
import heroBg from '../assets/images/hero-bridge-bg.png';

const Home = () => {
  const { isAuthenticated, isCandidate, isRecruiter } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-700 overflow-x-hidden relative">
      


      {/* Hero Section */}
      <div className="relative z-10 min-h-screen flex items-center justify-center pt-20 overflow-hidden px-6">
        
        {/* The Background Image Image */}
        <div className="absolute inset-0 -z-10 bg-white">
           <img 
            src={heroBg} 
            className="w-full h-full object-cover opacity-60 scale-105" 
            alt="Hero Background"
           />
           <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/40 to-white"></div>
           <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white/10"></div>
        </div>

        <div className="container mx-auto max-w-6xl text-center">
          <div className={`transition-all duration-1000 transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-blue-100 text-blue-600 text-xs font-bold mb-8 shadow-sm">
              <Sparkles size={14} />
              <span>AI-Powered Talent Matching Ecosystem</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-tight leading-[0.95] mb-8">
              Bridging the <span className="text-blue-600 underline decoration-blue-200 underline-offset-8">Gap</span> <br />
              <span className="text-slate-400 font-light">Between Talent & Opportunity.</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
              The AI-powered ecosystem where elite candidates find exceptional careers, and top-tier recruiters meet their perfect match — seamlessly connected on one platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
               {!isAuthenticated ? (
                  <>
                    <Link
                      to="/register"
                      className="px-10 py-5 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all hover:-translate-y-1 flex items-center gap-3 text-lg"
                    >
                      Hire Talent Now <ArrowRight size={20} />
                    </Link>
                    <Link
                      to="/register"
                      className="px-10 py-5 bg-white/50 backdrop-blur-md text-slate-900 font-bold rounded-2xl border border-slate-200 hover:border-blue-600 hover:bg-blue-50/50 transition-all text-lg shadow-sm"
                    >
                      Find My Dream Job
                    </Link>
                  </>
               ) : (
                  <Link
                    to={isCandidate ? '/candidate/dashboard' : '/recruiter/dashboard'}
                    className="px-10 py-5 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all hover:-translate-y-1 flex items-center gap-3 text-lg"
                  >
                    Go to Workspace <ArrowUpRight size={20} />
                  </Link>
               )}
            </div>

            {/* BUILDING THE ELITE TALENT BRIDGE */}
            <div className="relative mt-12 py-10 bg-white/40 backdrop-blur-md rounded-[3rem] border border-white/50 shadow-2xl shadow-blue-900/5 max-w-4xl mx-auto">
               <div className="flex items-center justify-between gap-4 md:gap-20 px-12">
                  <div className="flex-1 flex flex-col items-center">
                     <div className="w-20 h-20 bg-indigo-50/50 rounded-2xl flex items-center justify-center border border-indigo-100 mb-4 shadow-sm backdrop-blur-sm">
                        <Users className="text-indigo-600" size={32} />
                     </div>
                     <span className="font-bold text-slate-900">Elite Candidates</span>
                  </div>
                  
                  <div className="flex-[2] hidden sm:flex flex-col items-center justify-center pt-8">
                     <div className="w-full h-1.5 bg-gradient-to-r from-indigo-200 via-blue-400 to-blue-200 rounded-full relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center shadow-lg">
                           <Target className="text-blue-600 animate-pulse" size={20} />
                        </div>
                     </div>
                     <span className="mt-8 text-xs font-bold text-slate-400 tracking-[0.3em] uppercase">The Talent Bridge</span>
                  </div>

                  <div className="flex-1 flex flex-col items-center">
                     <div className="w-20 h-20 bg-blue-50/50 rounded-2xl flex items-center justify-center border border-blue-100 mb-4 shadow-sm backdrop-blur-sm">
                        <Briefcase className="text-blue-600" size={32} />
                     </div>
                     <span className="font-bold text-slate-900">Expert Recruiters</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Box Grid - Light Mode */}
      <div className="bg-slate-50 py-32 border-y border-slate-100 relative">
        <div className="container mx-auto px-6 max-w-6xl">
           <div className="text-center mb-20">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4">7 Powerful AI Pillars</h2>
              <p className="text-slate-500 font-medium">Everything you need to successfully navigate the modern career landscape.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Feature 1 (Large) */}
              <div className="md:col-span-8 bg-white border border-slate-200 rounded-[2.5rem] p-10 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500 group">
                 <div className="flex flex-col md:flex-row gap-8 items-start md:items-center h-full">
                    <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center shrink-0 border border-blue-100 group-hover:bg-blue-600 transition-colors duration-500">
                       <BrainCircuit className="text-blue-600 group-hover:text-white transition-colors duration-500" size={36} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-bold text-slate-900 mb-3">AI Sync Score</h3>
                       <p className="text-slate-500 leading-relaxed font-medium">
                          The heart of the bridge. Instantly score candidates against specific job descriptions using deep semantic analysis, identifying the perfect fit in seconds.
                       </p>
                    </div>
                 </div>
              </div>

              {/* Feature 2 (Small) */}
              <div className="md:col-span-4 bg-white border border-slate-200 rounded-[2.5rem] p-10 hover:shadow-2xl hover:shadow-emerald-900/5 transition-all duration-500 group">
                 <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100 group-hover:bg-emerald-600 transition-colors">
                    <Video className="text-emerald-600 group-hover:text-white" size={28} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">Live Interviews</h3>
                 <p className="text-slate-500 font-medium text-sm">Schedule real-time video calls with integrated Gmail notifications.</p>
              </div>

              {/* Feature 3 (Small) */}
              <div className="md:col-span-4 bg-white border border-slate-200 rounded-[2.5rem] p-10 hover:shadow-2xl hover:shadow-amber-900/5 transition-all duration-500 group">
                 <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 border border-amber-100 group-hover:bg-amber-600 transition-colors">
                    <FileText className="text-amber-600 group-hover:text-white" size={28} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">AI Resume Builder</h3>
                 <p className="text-slate-500 font-medium text-sm">Craft job-specific resumes that attract recruiters and pass ATS filters.</p>
              </div>

              {/* Feature 4 (Small) */}
              <div className="md:col-span-4 bg-white border border-slate-200 rounded-[2.5rem] p-10 hover:shadow-2xl hover:shadow-rose-900/5 transition-all duration-500 group">
                 <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 border border-rose-100 group-hover:bg-rose-600 transition-colors">
                    <TrendingUp className="text-rose-600 group-hover:text-white" size={28} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">Mock Hero Tests</h3>
                 <p className="text-slate-500 font-medium text-sm">Practice with AI-simulated interview stress tests and analytics.</p>
              </div>

              {/* Feature 5 (Small) */}
              <div className="md:col-span-4 bg-white border border-slate-200 rounded-[2.5rem] p-10 hover:shadow-2xl hover:shadow-purple-900/5 transition-all duration-500 group">
                 <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 border border-purple-100 group-hover:bg-purple-600 transition-colors">
                    <ScanSearch className="text-purple-600 group-hover:text-white" size={28} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">ATS Insight</h3>
                 <p className="text-slate-500 font-medium text-sm">Instant visual analysis of how ATS systems read your resume.</p>
              </div>

              {/* Feature 6 (Medium) */}
              <div className="md:col-span-6 bg-white border border-slate-200 rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-cyan-900/5 transition-all duration-500 group flex items-center gap-6">
                 <div className="w-16 h-16 bg-cyan-50 rounded-3xl flex items-center justify-center border border-cyan-100 shrink-0 group-hover:bg-cyan-600 transition-colors">
                    <Target className="text-cyan-600 group-hover:text-white" size={32} />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">Gap Analyzer</h3>
                    <p className="text-slate-500 font-medium text-sm">Find exactly which skills you lack for your target role and how to fix them.</p>
                 </div>
              </div>

              {/* Feature 7 (Medium) */}
              <div className="md:col-span-6 bg-blue-600 rounded-[2.5rem] p-8 transition-all hover:-translate-y-1 shadow-xl shadow-blue-200 flex items-center gap-6 text-white group">
                 <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/30 shrink-0 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="text-white" size={32} />
                 </div>
                 <div>
                    <div className="flex items-center gap-2 mb-1">
                       <h3 className="text-xl font-bold text-white">AI Verified Badge</h3>
                       <span className="text-[10px] uppercase font-black tracking-widest bg-white text-blue-600 px-2 py-0.5 rounded-full">PRO</span>
                    </div>
                    <p className="text-blue-50 font-medium text-sm">Automated skill verification tests that recruiters trust globally.</p>
                 </div>
              </div>

           </div>
        </div>
      </div>

      {/* Recruiter & Candidate Perspective Section */}
      <div className="py-32 overflow-hidden">
         <div className="container mx-auto px-6 max-w-6xl">
            
            {/* Recruiter Perspective */}
            <div className="flex flex-col lg:flex-row items-center gap-20 mb-32">
               <div className="flex-1 order-2 lg:order-1">
                  <div className="w-full aspect-[4/3] bg-white rounded-3xl shadow-2xl shadow-blue-900/5 border border-slate-200 p-8 relative">
                     <div className="flex items-center gap-4 mb-8">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                     </div>
                     <div className="space-y-6">
                        <div className="h-12 w-full bg-slate-50 border border-slate-100 rounded-xl flex items-center px-4">
                           <div className="w-8 h-8 rounded-lg bg-blue-600/10 mr-4"></div>
                           <div className="h-2 w-1/3 bg-slate-200 rounded"></div>
                           <div className="ml-auto flex gap-2">
                              <div className="h-4 w-12 bg-blue-100 rounded-full"></div>
                           </div>
                        </div>
                        <div className="h-32 w-full bg-blue-50 border border-blue-100 rounded-2xl p-6">
                           <div className="h-2 w-1/4 bg-blue-200 rounded mb-4"></div>
                           <div className="h-4 w-1/2 bg-blue-600 rounded mb-4"></div>
                           <div className="flex gap-2">
                              {Array(5).fill(0).map((_, i) => (
                                 <div key={i} className="h-10 w-10 rounded-lg bg-white shadow-sm border border-blue-100"></div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
               <div className="flex-1 order-1 lg:order-2">
                  <span className="inline-block py-1 pr-4 mb-4 border-r-2 border-blue-600 text-blue-600 font-black text-xs uppercase tracking-widest">Recruiter View</span>
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-[1.1] mb-6">Empower Your Hiring Engine.</h2>
                  <p className="text-slate-600 font-medium text-lg leading-relaxed mb-8">
                     Leverage the TalentBridge AI Sync Score to cut through the noise. Identify top 1% candidates instantly and connect via our live scheduler.
                  </p>
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <h4 className="font-bold text-blue-600">90% faster</h4>
                        <p className="text-sm text-slate-500 font-medium">Time-to-interview</p>
                     </div>
                     <div className="space-y-2">
                        <h4 className="font-bold text-blue-600">Top-Tier</h4>
                        <p className="text-sm text-slate-500 font-medium">Verified skill-matching</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Candidate Perspective */}
            <div className="flex flex-col lg:flex-row items-center gap-20">
               <div className="flex-1">
                  <span className="inline-block py-1 pr-4 mb-4 border-r-2 border-indigo-600 text-indigo-600 font-black text-xs uppercase tracking-widest">Candidate View</span>
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-[1.1] mb-6">Amplify Your Career Trajectory.</h2>
                  <p className="text-slate-600 font-medium text-lg leading-relaxed mb-8">
                     Build a profile that wins. Use our AI Sync logic to see how you stack up against requirements, fix your gaps, and get verified badges to stand out.
                  </p>
                  <div className="flex items-center gap-6">
                     <div className="flex -space-x-3">
                        {Array(4).fill(0).map((_, i) => (
                           <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-slate-200"></div>
                        ))}
                     </div>
                     <p className="text-sm font-bold text-slate-400">Join 10k+ candidates already placed.</p>
                  </div>
               </div>
               <div className="flex-1 w-full relative">
                  <div className="w-full aspect-square bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-indigo-900/5 flex items-center justify-center p-12">
                     <div className="w-full h-full relative border-l border-b border-slate-100 flex items-end justify-between px-8 py-4">
                        {[40, 70, 45, 90, 60, 85].map((h, i) => (
                           <div key={i} className="w-[12%] bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg shadow-lg relative group transition-all" style={{ height: `${h}%` }}>
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Skill Growth: {h}%</div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

         </div>
      </div>

      {/* Final CTA */}
      <div className="container mx-auto px-6 max-w-6xl pb-32">
         <div className="bg-slate-900 rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px]"></div>
            
            <h2 className="text-4xl md:text-6xl font-black mb-8 relative z-10">Start Building Your Bridge.</h2>
            <p className="text-slate-400 text-lg mb-12 max-w-2xl mx-auto relative z-10">Join the thousands of recruiters and candidates already connecting on the world's most advanced AI hiring platform.</p>
            
            {!isAuthenticated && (
               <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                  <Link to="/register" className="px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-blue-900/20">Create Free Account</Link>
                  <Link to="/login" className="px-10 py-5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all border border-white/10">Sign In Now</Link>
               </div>
            )}
         </div>
      </div>

    </div>
  );
};

export default Home;
