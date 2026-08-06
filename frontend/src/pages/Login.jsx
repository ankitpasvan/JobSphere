import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authBg from '../assets/images/auth-bg.png';
import logo from '../assets/logo.png';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiCheckCircle } from 'react-icons/fi';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
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
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        if (result.user.role === 'candidate') {
          navigate('/candidate/dashboard');
        } else if (result.user.role === 'recruiter') {
          navigate('/recruiter/dashboard');
        } else {
          navigate('/');
        }
      } else {
        setError(result.message || 'Invalid email or password. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 pt-24 font-sans">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        {/* Left Side */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-900 text-white relative">
          <img 
            src={authBg} 
            alt="Workspace" 
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
          
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3 mb-12 group">
              <div className="w-10 h-10 bg-white shadow-xl rounded-xl flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110">
                <img src={logo} alt="TalentBridge Logo" className="w-full h-full object-contain p-1" />
              </div>
              <span className="font-bold text-2xl tracking-tight">TalentBridge</span>
            </Link>
            
            <h2 className="text-4xl font-bold leading-tight mb-6">
              Welcome back! <br />
              Ready for your next opportunity?
            </h2>
            <p className="text-slate-300 text-lg leading-relaxed max-w-sm">
              Sign in to catch up on your applications, manage your job posts, and see what's new.
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
              <FiCheckCircle className="text-blue-500" />
              <span>Track your applications in real-time</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
              <FiCheckCircle className="text-blue-500" />
              <span>Connect with top recruiters</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
              <FiCheckCircle className="text-blue-500" />
              <span>Secure and easy to use</span>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="p-8 lg:p-16 flex flex-col justify-center">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight lg:hidden mb-8 flex items-center gap-3">
              <div className="w-10 h-10 bg-white shadow-md border border-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                <img src={logo} alt="TalentBridge Logo" className="w-full h-full object-contain p-1" />
              </div>
              TalentBridge
            </h1>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Sign In</h3>
            <p className="text-slate-500 font-medium">
              New here?{' '}
              <Link to="/register" className="text-blue-600 font-bold hover:underline">Create an account</Link>
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-sm font-semibold text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                    <FiMail className="w-5 h-5" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-medium"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-slate-700">Password</label>
                  <Link to="/forgot-password" title="Initialize Recovery" className="text-xs font-bold text-blue-600 hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                    <FiLock className="w-5 h-5" />
                  </div>
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-medium"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="remember" className="text-sm font-medium text-slate-600 cursor-pointer">Remember me</label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Sign In <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <footer className="mt-12 pt-8 border-t border-slate-100 text-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Secure Login</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Login;
