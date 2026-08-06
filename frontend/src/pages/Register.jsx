import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authBg from '../assets/images/auth-bg.png';
import logo from '../assets/logo.png';
import { FiMail, FiLock, FiUser, FiPhone, FiEye, FiEyeOff, FiBriefcase, FiArrowRight, FiCheckCircle, FiGlobe, FiMapPin } from 'react-icons/fi';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'candidate',
    companyName: '',
    companyWebsite: '',
    companyLocation: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const registerData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: formData.role,
      };

      if (formData.role === 'recruiter') {
        registerData.company = {
          name: formData.companyName,
          website: formData.companyWebsite,
          location: formData.companyLocation,
        };
      }

      const result = await register(registerData);

      if (result.success) {
        if (result.user.role === 'candidate') {
          navigate('/candidate/dashboard');
        } else if (result.user.role === 'recruiter') {
          navigate('/recruiter/dashboard');
        } else {
          navigate('/');
        }
      } else {
        setError(result.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 pt-28 pb-12 font-sans">
      <div className="w-full max-w-6xl grid lg:grid-cols-5 bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Left Side (2 cols) */}
        <div className="hidden lg:flex lg:col-span-2 flex-col justify-between p-12 bg-slate-900 text-white relative">
          <img 
            src={authBg} 
            alt="Office" 
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
          
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3 mb-16 group">
              <div className="w-10 h-10 bg-white shadow-xl rounded-xl flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110">
                <img src={logo} alt="TalentBridge Logo" className="w-full h-full object-contain p-1" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-white">TalentBridge</span>
            </Link>
            
            <h2 className="text-4xl font-bold leading-tight mb-8">
              Start your professional journey today.
            </h2>
            
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                  <FiBriefcase className="text-blue-500" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-100">For Recruiters</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">Find top talent and grow your team with ease. Post jobs and manage applications in one place.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                  <FiUser className="text-indigo-500" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-100">For Candidates</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">Discover exciting job opportunities and get hired by top companies that match your goals.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-12 border-t border-slate-800">
            <div className="flex items-center gap-4">
              <p className="text-sm font-semibold text-slate-400">Join thousands of professionals already on TalentBridge.</p>
            </div>
          </div>
        </div>

        {/* Right Side - Form (3 cols) */}
        <div className="lg:col-span-3 p-8 lg:p-14 bg-white overflow-y-auto max-h-[90vh] custom-scrollbar">
          <div className="mb-10 lg:text-left">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight lg:hidden mb-12 flex items-center gap-3">
              <div className="w-10 h-10 bg-white shadow-md border border-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                 <img src={logo} alt="TalentBridge Logo" className="w-full h-full object-contain p-1" />
              </div>
              TalentBridge
            </h1>
            <h3 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h3>
            <p className="text-slate-500 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 font-bold hover:underline">Sign In</Link>
            </p>
          </div>

          {/* Role Switcher */}
          <div className="flex p-1 bg-slate-50 rounded-2xl mb-10 border border-slate-200">
            <button
              onClick={() => setFormData({ ...formData, role: 'candidate' })}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all ${formData.role === 'candidate' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
            >
              CANDIDATE
            </button>
            <button
              onClick={() => setFormData({ ...formData, role: 'recruiter' })}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all ${formData.role === 'recruiter' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
            >
              RECRUITER
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-sm font-semibold text-red-600">{error}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                    <FiUser className="w-5 h-5" />
                  </div>
                  <input
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-medium placeholder:font-normal"
                    placeholder="e.g. John Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
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
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-medium placeholder:font-normal"
                    placeholder="e.g. john@example.com"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                    <FiPhone className="w-5 h-5" />
                  </div>
                  <input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-medium placeholder:font-normal"
                    placeholder="e.g. +1 234 567 890"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
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
                    className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-medium placeholder:font-normal"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Recruiter Specific Fields */}
            {formData.role === 'recruiter' && (
              <div className="grid md:grid-cols-2 gap-6 p-6 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-blue-700 ml-1">Company Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-blue-400">
                      <FiBriefcase className="w-5 h-5" />
                    </div>
                    <input
                      name="companyName"
                      required
                      value={formData.companyName}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-white border border-blue-200 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium placeholder:font-normal"
                      placeholder="e.g. TalentBridge Inc."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-blue-700 ml-1">Company Website</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-blue-400">
                      <FiGlobe className="w-5 h-5" />
                    </div>
                    <input
                      name="companyWebsite"
                      type="url"
                      value={formData.companyWebsite}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-white border border-blue-200 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium placeholder:font-normal"
                      placeholder="e.g. https://example.com"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-blue-700 ml-1">Company Location</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-blue-400">
                      <FiMapPin className="w-5 h-5" />
                    </div>
                    <input
                      name="companyLocation"
                      required
                      value={formData.companyLocation}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-white border border-blue-200 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium placeholder:font-normal"
                      placeholder="e.g. London, UK"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2 text-left">
              <label className="text-sm font-bold text-slate-700 ml-1">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                  <FiLock className="w-5 h-5" />
                </div>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-medium placeholder:font-normal"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <input
                id="terms"
                type="checkbox"
                required
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="terms" className="text-sm font-medium text-slate-500 cursor-pointer">
                I agree to the <a href="#" className="text-blue-600 font-bold hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 font-bold hover:underline">Privacy Policy</a>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-slate-900 text-white font-bold rounded-2xl shadow-lg hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Create Account <FiArrowRight />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
