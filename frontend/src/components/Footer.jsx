import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin, FiGithub, FiTwitter, FiLinkedin, FiInstagram, FiArrowRight } from 'react-icons/fi';
import logo from '../assets/logo.png';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white relative overflow-hidden">
      {/* Decorative Gradient Background */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2"></div>
      
      {/* Main Footer Container */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-24 pb-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 lg:gap-8 mb-20">
          
          {/* Brand & Mission (4 cols) */}
          <div className="lg:col-span-4 max-w-sm">
            <Link to="/" className="inline-flex items-center gap-3 mb-8 group">
              <div className="w-10 h-10 bg-white shadow-xl rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 overflow-hidden">
                <img src={logo} alt="TalentBridge Logo" className="w-full h-full object-contain p-1" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-white">TalentBridge <span className="text-blue-500 italic">Pro</span></span>
            </Link>
            <p className="text-slate-400 text-lg leading-relaxed mb-10 font-medium">
              The premier ecosystem for high-stakes talent acquisition. We connect the world's most innovative organizations with the top 1% of technical talent.
            </p>
            
            {/* Social Intelligence */}
            <div className="flex gap-4">
              {[FiTwitter, FiLinkedin, FiInstagram, FiGithub].map((Icon, i) => (
                <a key={i} href="#" className="w-11 h-11 bg-slate-800/50 hover:bg-blue-600 rounded-[0.9rem] flex items-center justify-center transition-all duration-300 border border-slate-700/50 hover:border-blue-400 group">
                  <Icon className="text-slate-300 group-hover:text-white" size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Sitemaps (2 cols each = 6 total) */}
          <div className="lg:col-span-2 lg:ml-auto">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-blue-500">Candidate Protocol</h3>
            <ul className="space-y-4">
              {['Browse Jobs', 'Create Account', 'Career Resources', 'Salary Insights'].map((item) => (
                <li key={item}>
                  <Link to={item === 'Create Account' ? '/register' : '/candidate/jobs'} className="text-slate-400 hover:text-white transition-colors font-bold text-sm flex items-center group">
                    <FiArrowRight className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-blue-500" size={14} />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-indigo-500">Recruiter Terminal</h3>
            <ul className="space-y-4">
              {['Post Directive', 'Talent Search', 'Enterprise Plans', 'Integrations', 'Recruiting Guide'].map((item) => (
                <li key={item}>
                  <Link to={item === 'Post Directive' ? '/register' : '/recruiter/dashboard'} className="text-slate-400 hover:text-white transition-colors font-bold text-sm flex items-center group">
                    <FiArrowRight className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-indigo-500" size={14} />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Node (2 cols) */}
          <div className="lg:col-span-4 lg:ml-auto">
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-[2rem] p-8">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-slate-100 italic">Support Hub</h3>
              <ul className="space-y-6">
                <li className="flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shrink-0 border border-slate-700 group-hover:border-blue-500 transition-colors">
                    <FiMail className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Secure Email</p>
                    <span className="text-slate-200 text-sm font-bold">ops@talentbridge.pro</span>
                  </div>
                </li>
                <li className="flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shrink-0 border border-slate-700 group-hover:border-emerald-500 transition-colors">
                    <FiPhone className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Priority Line</p>
                    <span className="text-slate-200 text-sm font-bold">+1 (555) BRIDGE</span>
                  </div>
                </li>
                <li className="flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shrink-0 border border-slate-700 group-hover:border-rose-500 transition-colors">
                    <FiMapPin className="text-rose-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">HQ Node</p>
                    <span className="text-slate-200 text-sm font-bold">San Francisco, CA</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Global Bottom Bar */}
        <div className="pt-12 border-t border-slate-800/60 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest">
              &copy; {new Date().getFullYear()} TalentBridge Ecosystem Inc.
            </p>
            <div className="flex gap-4">
              <span className="px-2 py-1 bg-slate-800/50 rounded text-[9px] font-black text-slate-400 border border-slate-700/50">V4.0.0-PRO</span>
              <span className="px-2 py-1 bg-blue-500/10 rounded text-[9px] font-black text-blue-500 border border-blue-500/20">STATUS: OPTIMAL</span>
            </div>
          </div>
          
          <div className="flex gap-8">
            {['Privacy Protocol', 'Service Terms', 'Intelligence Report'].map((item) => (
              <a key={item} href="#" className="text-slate-500 hover:text-white text-xs font-black uppercase tracking-widest transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
