import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import authBg from '../assets/images/auth-bg.png';
import { FiMail, FiArrowLeft, FiSend, FiCheckCircle } from 'react-icons/fi';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Email, 2: OTP
  const [error, setError] = useState('');

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.forgotPassword(email);
      if (response.data.success) {
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'System could not locate this authorization node.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 6) {
      setError('Security segment incomplete. Please enter the 6-digit code.');
      setLoading(false);
      return;
    }

    // Since verification happens on the final reset step, we just move the user
    // In a production app, you might verify the OTP here first.
    // For now, we'll redirect as requested to show the new password screen.
    window.location.href = `/reset-password?otp=${enteredOtp}&email=${email}`;
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
              {step === 1 ? 'Credential Recovery' : 'Identity Verification'} <br />
              <span className="text-blue-500">{step === 1 ? 'Protocol' : 'Protocol'}</span>.
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
              {step === 1 
                ? "Lost your access node? Don't worry, we'll verify your identity and restore your terminal access within minutes."
                : `A unique 6-digit security segment has been dispatched to ${email}. Please enter it to authenticate.`
              }
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
              <FiCheckCircle className="text-blue-500" />
              <span>Two-factor OTP verification</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
              <FiCheckCircle className="text-blue-500" />
              <span>Branded secure email delivery</span>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="p-8 lg:p-16 flex flex-col justify-center">
          {step === 1 ? (
            <>
              <div className="mb-10">
                <Link to="/login" className="inline-flex items-center gap-2 text-sm font-black text-blue-600 uppercase tracking-widest mb-6 hover:gap-3 transition-all">
                  <FiArrowLeft /> Back to Login
                </Link>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2 uppercase italic">Recover Access</h3>
                <p className="text-slate-500 font-medium">
                  Enter your registered work email to receive a secure OTP module.
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleEmailSubmit}>
                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl animate-in fade-in duration-300 text-rose-600 font-bold text-sm">
                    {error}
                  </div>
                )}
                
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Registration Email</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-blue-600 transition-colors">
                      <FiMail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all outline-none font-medium placeholder:text-slate-400"
                      placeholder="name@company.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all hover:-translate-y-1 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-sm group"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Send Security OTP <FiSend className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-10 text-center lg:text-left">
                <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 text-sm font-black text-blue-600 uppercase tracking-widest mb-6 hover:gap-3 transition-all">
                  <FiArrowLeft /> Change Email
                </button>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2 uppercase italic">Verify Identity</h3>
                <p className="text-slate-500 font-medium">
                  Please enter the 6-digit security code sent to <span className="text-slate-900 font-bold">{email}</span>.
                </p>
              </div>

              <form className="space-y-8" onSubmit={handleOtpSubmit}>
                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 font-bold text-sm animate-in fade-in duration-300">
                    {error}
                  </div>
                )}

                <div className="flex justify-between gap-2 sm:gap-4">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      maxLength={1}
                      required
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="w-full h-12 sm:h-16 text-center text-xl sm:text-2xl font-black bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-900/20 hover:bg-black transition-all hover:-translate-y-1 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-sm group"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Verify Security Segment <FiCheckCircle className="group-hover:scale-110 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          <div className="mt-12 pt-8 border-t border-slate-50 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Secured Recovery Terminal</p>
            <div className="flex justify-center gap-6 grayscale opacity-30">
              <span className="text-[9px] font-black border border-slate-200 px-2 py-0.5 rounded">SSL ENCRYPTED</span>
              <span className="text-[9px] font-black border border-slate-200 px-2 py-0.5 rounded">AUTO-EXPIRE 15M</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
