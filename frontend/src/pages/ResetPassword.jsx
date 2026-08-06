import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import authBg from '../assets/images/auth-bg.png';
import { FiLock, FiEye, FiEyeOff, FiCheckCircle, FiShield, FiArrowRight } from 'react-icons/fi';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [searchParams] = useSearchParams();
  const token = searchParams.get('otp'); // Actually using OTP as the session token
  const email = searchParams.get('email');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Password segments do not match. Identity verification failed.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Security key must be at least 8 characters long for terminal access.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authAPI.resetPassword({
        email,
        otp: token,
        newPassword: formData.password
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'System could not update your authorization node. Link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 pt-24">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100">
        
        {/* Left Side - Visual/Branding */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-900 text-white relative overflow-hidden">
          <img 
            src={authBg} 
            alt="Secure Terminal" 
            className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-slate-900/60"></div>
          
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2 mb-12">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black italic">T</div>
              <span className="font-bold tracking-tight text-xl">TalentBridge</span>
            </Link>
            
            <h2 className="text-4xl font-black leading-tight mb-6 italic">
              New Key <br />
              <span className="text-blue-500">Generation</span> Protocol.
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
              You are accessing a secure reset tunnel. Please define a unique, complex security key for <span className="text-white font-bold">{email}</span>.
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
              <FiShield className="text-blue-500" />
              <span>Full end-to-end encryption</span>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="p-8 lg:p-16 flex flex-col justify-center">
          {!success ? (
            <>
              <div className="mb-10 text-center lg:text-left">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2 uppercase italic">Update Credentials</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Terminal authorization verified via OTP segment: <span className="text-blue-600 font-black">{token}</span>
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 font-bold text-sm animate-in fade-in duration-300">
                    {error}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">New Security Key</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-blue-600 transition-colors">
                        <FiLock className="w-5 h-5" />
                      </div>
                      <input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all outline-none font-medium placeholder:text-slate-400"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-900 transition-colors"
                      >
                        {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Confirm Identity Key</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-blue-600 transition-colors">
                        <FiLock className="w-5 h-5" />
                      </div>
                      <input
                        name="confirmPassword"
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all outline-none font-medium placeholder:text-slate-400"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all hover:-translate-y-1 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-sm group mt-4"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Confirm New Authorization <FiCheckCircle className="transition-transform group-hover:scale-110" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center animate-in zoom-in-95 duration-500">
               <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-emerald-100">
                  <FiCheckCircle size={40} />
               </div>
               <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-4 uppercase italic">Encryption <br />Success</h3>
               <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto leading-relaxed">
                  Your security key has been updated across all TalentBridge nodes. Redirecting you to the main console...
               </p>
               <div className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all uppercase tracking-widest text-sm text-center">
                  Routing Initialized
               </div>
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-slate-50 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 italic">256-Bit Cryptographic Update Terminal</p>
            <div className="flex justify-center gap-6 grayscale opacity-30">
              <span className="text-[9px] font-black border border-slate-200 px-2 py-0.5 rounded">SESSION SECURE</span>
              <span className="text-[9px] font-black border border-slate-200 px-2 py-0.5 rounded">NO KEY LOGGING</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
