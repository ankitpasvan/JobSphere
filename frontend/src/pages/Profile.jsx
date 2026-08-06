import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { 
  FiUser, FiMail, FiPhone, FiMapPin, FiBriefcase, FiGlobe, 
  FiFileText, FiSave, FiLink, FiCamera, FiPlus, FiTrash2,
  FiLinkedin, FiGithub, FiEdit2, FiLayers, FiUsers, FiHexagon, FiZap, FiExternalLink
} from 'react-icons/fi';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal'); // personal, professional, security
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: '',
    bio: '',
    skills: '',
    location: '',
    resume: '',
    resumeLink: '',
    linkedin: '',
    github: '',
    education: [{ school: '', degree: '', year: '' }],
    experience: [{ company: '', role: '', duration: '', description: '' }],
    company: {
      name: '',
      website: '',
      location: '',
      description: '',
      industry: '',
      employeeCount: ''
    }
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        avatar: user.avatar || '',
        phone: user.phone || '',
        bio: user.profile?.bio || '',
        skills: user.profile?.skills?.join(', ') || '',
        location: user.profile?.location || '',
        resume: user.profile?.resume || '',
        resumeLink: user.profile?.resumeLink || '',
        linkedin: user.profile?.linkedin || '',
        github: user.profile?.github || '',
        education: user.profile?.education?.length > 0 ? user.profile.education : [{ school: '', degree: '', year: '' }],
        experience: user.profile?.experience?.length > 0 ? user.profile.experience : [{ company: '', role: '', duration: '', description: '' }],
        company: {
          name: user.company?.name || '',
          website: user.company?.website || '',
          location: user.company?.location || '',
          description: user.company?.description || '',
          industry: user.company?.industry || '',
          employeeCount: user.company?.employeeCount || ''
        }
      });
    }
  }, [user]);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5MB limit
    if (file.size > maxSize) {
      return toast.error(`${type === 'avatar' ? 'Image' : 'File'} is too large. Max size is 5MB.`);
    }

    if (type === 'resume' && file.type !== 'application/pdf') {
      return toast.error('Please upload your resume in PDF format.');
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileData(prev => ({ ...prev, [type]: reader.result }));
      toast.success(`${file.name} selected! Click "Save Changes" to update your profile.`, {
        duration: 5000,
        icon: '📄'
      });
    };
    reader.readAsDataURL(file);
  };

  const handleArrayChange = (index, field, value, type) => {
    const updatedArray = [...profileData[type]];
    updatedArray[index][field] = value;
    setProfileData({ ...profileData, [type]: updatedArray });
  };

  const addArrayItem = (type) => {
    const newItem = type === 'education' 
      ? { school: '', degree: '', year: '' } 
      : { company: '', role: '', duration: '', description: '' };
    setProfileData({ ...profileData, [type]: [...profileData[type], newItem] });
  };

  const removeArrayItem = (index, type) => {
    const updatedArray = profileData[type].filter((_, i) => i !== index);
    setProfileData({ ...profileData, [type]: updatedArray });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (activeTab === 'security') {
      return handlePasswordSubmit(e);
    }
    setLoading(true);
    try {
      const dataToSubmit = {
        name: profileData.name,
        phone: profileData.phone,
        avatar: profileData.avatar,
        profile: user.role === 'candidate' ? {
          bio: profileData.bio,
          location: profileData.location,
          skills: profileData.skills.split(',').map(s => s.trim()).filter(s => s !== ''),
          resume: profileData.resume,
          linkedin: profileData.linkedin,
          github: profileData.github,
          education: profileData.education.filter(e => e.school),
          experience: profileData.experience.filter(ex => ex.company)
        } : undefined,
        company: user.role === 'recruiter' ? profileData.company : undefined
      };

      const response = await authAPI.updateProfile(dataToSubmit);
      updateUser(response.data.user);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    setLoading(true);
    try {
      await authAPI.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setActiveTab('personal');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-end items-start md:items-center mb-12 gap-6">
          
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
             <button 
               onClick={() => setActiveTab('personal')}
               className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'personal' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
             >
               Profile Details
             </button>
             <button 
               onClick={() => setActiveTab('professional')}
               className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'professional' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
             >
               {user?.role === 'recruiter' ? 'Company Info' : 'Resume & Experience'}
             </button>
             <button 
               onClick={() => setActiveTab('security')}
               className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'security' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
             >
               Security
             </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Profile Photo Sidebar */}
          <div className="lg:col-span-1">
             <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 text-center lg:sticky lg:top-28">
                <div className="relative group mx-auto w-36 h-36 mb-6">
                   <div className="w-full h-full rounded-full ring-4 ring-slate-50 border border-slate-200 shadow-inner overflow-hidden bg-slate-100 flex items-center justify-center">
                      {profileData.avatar ? (
                        <img src={profileData.avatar} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <FiUser size={40} className="text-slate-300" />
                      )}
                   </div>
                   <label htmlFor="avatar-upload" className="absolute bottom-1 right-1 p-2.5 bg-blue-600 text-white rounded-full shadow-lg cursor-pointer hover:bg-blue-700 transition-all border-2 border-white">
                      <FiCamera size={18} />
                      <input type="file" id="avatar-upload" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
                   </label>
                </div>
                
                <h2 className="text-lg font-bold text-slate-900 truncate">{user?.name}</h2>
                <p className="text-xs text-blue-600 font-semibold bg-blue-50 px-3 py-1 rounded-full inline-block mt-2 capitalize">{user?.role}</p>

                <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
                   <div className="bg-slate-50 p-4 rounded-xl text-left border border-slate-100">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Requirements</p>
                      <p className="text-[11px] text-slate-600 font-medium">Max size: 5MB | JPG, PNG</p>
                   </div>
                   <button type="submit" disabled={loading} className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-md hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
                      {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><FiSave /> Save Changes</>}
                   </button>
                </div>
             </div>
          </div>

          {/* Form Fields */}
          <div className="lg:col-span-3 space-y-6">
            
            {activeTab === 'personal' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                
                {/* Basic Info */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                   <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
                         <FiUser size={20} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Personal Information</h3>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-500 ml-1">Full Name</label>
                         <input type="text" required value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                           className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none transition-all font-semibold text-sm"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-500 ml-1">Phone Number</label>
                         <input type="text" value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                           className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none transition-all font-semibold text-sm"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-400 ml-1">Email Address (Cannot be changed)</label>
                         <input type="email" disabled value={profileData.email}
                           className="w-full p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 font-semibold text-sm cursor-not-allowed"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-500 ml-1">Location</label>
                         <div className="relative">
                            <FiMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" value={profileData.location} onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                              className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none transition-all font-semibold text-sm"
                            />
                         </div>
                      </div>
                   </div>
                </div>

                {/* About Me */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100">
                         <FiEdit2 size={20} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">About Me</h3>
                   </div>
                   <textarea value={profileData.bio} onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl min-h-[140px] focus:bg-white focus:border-blue-600 outline-none transition-all font-semibold text-sm leading-relaxed"
                      placeholder="Write a brief professional summary about yourself..."
                   ></textarea>
                </div>
              </div>
            )}

            {activeTab === 'professional' && user?.role === 'candidate' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                
                 {/* Resume Upload Module */}
                <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-lg border border-white/5">
                   <div className="flex items-center justify-between mb-8">
                     <div>
                        <h3 className="text-xl font-bold">Resume Management</h3>
                        <p className="text-slate-400 text-[10px] mt-1 font-bold uppercase tracking-widest leading-relaxed">System will prioritize local file over drive link for AI extraction</p>
                     </div>
                     <FiFileText className="text-blue-500 text-3xl opacity-50" />
                   </div>
                   
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                      {/* Local File Upload */}
                      <div className="space-y-4">
                         <p className="text-xs font-bold text-slate-300">File Analysis Module</p>
                         <label htmlFor="resume-upload" className="w-full flex items-center justify-between p-5 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 hover:border-blue-500 transition-all">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 bg-blue-600/30 rounded-xl flex items-center justify-center text-blue-400 font-bold text-xs">PDF</div>
                               <div className="text-left">
                                  <p className="text-xs text-white font-bold">{profileData.resume ? 'File Synced' : 'Select PDF File'}</p>
                                  <p className="text-[9px] text-slate-400">{profileData.resume?.startsWith('data:') ? 'Awaiting Save' : 'Cloud Stored'}</p>
                               </div>
                            </div>
                            <div className="bg-blue-600 px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-transform active:scale-90">Browse</div>
                            <input type="file" id="resume-upload" className="hidden" accept=".pdf" onChange={(e) => handleFileChange(e, 'resume')} />
                         </label>
                      </div>

                      {/* Drive Link Alternative */}
                      <div className="space-y-4">
                         <p className="text-xs font-bold text-slate-300">Public Link / Drive</p>
                         <div className="relative group">
                            <FiExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input 
                              type="url" 
                              placeholder="e.g. Google Drive, Dropbox link" 
                              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold focus:bg-white/10 focus:border-blue-500 outline-none transition-all placeholder:text-white/20"
                              value={profileData.resumeLink}
                              onChange={(e) => setProfileData({...profileData, resumeLink: e.target.value})}
                            />
                         </div>
                      </div>
                   </div>

                   <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-white/5">
                      {profileData.resume && (
                        <div className="flex gap-2">
                           <button 
                             type="button"
                             onClick={() => {
                               const win = window.open();
                               win.document.write(`<iframe src="${profileData.resume}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                             }}
                             className="px-6 py-4 bg-white text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-tighter hover:bg-blue-600 hover:text-white transition-all shadow-md active:scale-95"
                           >
                              Full View PDF
                           </button>
                           <button type="button" onClick={() => setProfileData(prev => ({...prev, resume: ''}))} className="px-4 py-4 bg-red-500/20 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all">
                              <FiTrash2 size={16} />
                           </button>
                        </div>
                      )}
                      {profileData.resumeLink && (
                         <a href={profileData.resumeLink} target="_blank" rel="noreferrer" className="px-6 py-4 bg-blue-600/20 text-blue-400 rounded-2xl font-black text-[11px] uppercase border border-blue-400/30 hover:bg-blue-600 hover:text-white transition-all">
                            Test Web Link
                         </a>
                      )}
                      {!profileData.resume && !profileData.resumeLink && (
                         <p className="text-[10px] text-slate-500 italic">Please provide at least one resume node for talent analysis.</p>
                      )}
                   </div>
                </div>

                {/* Social Links & Skills */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                         <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                           <FiLink className="text-blue-500" /> Professional Links
                         </h4>
                         <div className="space-y-4">
                            <div className="relative">
                               <FiLinkedin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                               <input type="url" placeholder="LinkedIn Profile URL" value={profileData.linkedin} onChange={(e) => setProfileData({...profileData, linkedin: e.target.value})}
                                 className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none transition-all font-semibold text-xs"
                               />
                            </div>
                            <div className="relative">
                               <FiGithub className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                               <input type="url" placeholder="GitHub Profile URL" value={profileData.github} onChange={(e) => setProfileData({...profileData, github: e.target.value})}
                                 className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none transition-all font-semibold text-xs"
                               />
                            </div>
                         </div>
                      </div>
                      <div className="space-y-6">
                         <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                           <FiZap className="text-amber-500" /> Skills
                         </h4>
                         <textarea value={profileData.skills} onChange={(e) => setProfileData({...profileData, skills: e.target.value})}
                           placeholder="Enter skills separated by commas (e.g. React, JavaScript, UI Design)"
                           className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none transition-all font-semibold text-xs min-h-[100px] leading-relaxed"
                         ></textarea>
                      </div>
                   </div>
                </div>

                {/* Education */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                   <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                         Education
                      </h3>
                      <button type="button" onClick={() => addArrayItem('education')} className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all">
                         <FiPlus size={18} />
                      </button>
                   </div>
                   
                   <div className="space-y-4">
                      {profileData.education.map((edu, idx) => (
                         <div key={idx} className="group p-5 bg-slate-50 border border-slate-200 rounded-2xl relative">
                            <button type="button" onClick={() => removeArrayItem(idx, 'education')} className="absolute -top-2 -right-2 w-7 h-7 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md">
                               <FiTrash2 size={12} />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                               <input type="text" placeholder="School / University" value={edu.school} onChange={(e) => handleArrayChange(idx, 'school', e.target.value, 'education')} className="p-3 bg-white border border-slate-100 rounded-lg font-semibold text-xs outline-none" />
                               <input type="text" placeholder="Degree / Course" value={edu.degree} onChange={(e) => handleArrayChange(idx, 'degree', e.target.value, 'education')} className="p-3 bg-white border border-slate-100 rounded-lg font-semibold text-xs outline-none" />
                               <input type="text" placeholder="Year" value={edu.year} onChange={(e) => handleArrayChange(idx, 'year', e.target.value, 'education')} className="p-3 bg-white border border-slate-100 rounded-lg font-semibold text-xs outline-none" />
                            </div>
                         </div>
                      ))}
                   </div>
                </div>

                {/* Work Experience */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                   <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-bold text-slate-900">Work Experience</h3>
                      <button type="button" onClick={() => addArrayItem('experience')} className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all">
                         <FiPlus size={18} />
                      </button>
                   </div>
                   
                   <div className="space-y-4">
                      {profileData.experience.map((exp, idx) => (
                         <div key={idx} className="group p-6 bg-slate-50 border border-slate-200 rounded-2xl relative space-y-4">
                            <button type="button" onClick={() => removeArrayItem(idx, 'experience')} className="absolute -top-2 -right-2 w-7 h-7 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md">
                               <FiTrash2 size={12} />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                               <input type="text" placeholder="Company Name" value={exp.company} onChange={(e) => handleArrayChange(idx, 'company', e.target.value, 'experience')} className="p-3 bg-white border border-slate-100 rounded-lg font-semibold text-xs" />
                               <input type="text" placeholder="Your Role" value={exp.role} onChange={(e) => handleArrayChange(idx, 'role', e.target.value, 'experience')} className="p-3 bg-white border border-slate-100 rounded-lg font-semibold text-xs" />
                               <input type="text" placeholder="Duration (e.g. June 2022 - Present)" value={exp.duration} onChange={(e) => handleArrayChange(idx, 'duration', e.target.value, 'experience')} className="p-3 bg-white border border-slate-100 rounded-lg font-semibold text-xs" />
                            </div>
                            <textarea placeholder="Job responsibilities and achievements..." value={exp.description} onChange={(e) => handleArrayChange(idx, 'description', e.target.value, 'experience')} className="w-full p-3 bg-white border border-slate-100 rounded-lg font-semibold text-xs min-h-[80px]" />
                         </div>
                      ))}
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'professional' && user?.role === 'recruiter' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                 <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                   <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
                         <FiBriefcase size={20} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Company Information</h3>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-500 ml-1">Company Name</label>
                         <input type="text" value={profileData.company.name} onChange={(e) => setProfileData({...profileData, company: {...profileData.company, name: e.target.value}})}
                           className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none transition-all font-semibold text-sm"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-500 ml-1">Website URL</label>
                         <input type="url" value={profileData.company.website} onChange={(e) => setProfileData({...profileData, company: {...profileData.company, website: e.target.value}})}
                           className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none transition-all font-semibold text-sm"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-500 ml-1">Industry</label>
                         <input type="text" value={profileData.company.industry} onChange={(e) => setProfileData({...profileData, company: {...profileData.company, industry: e.target.value}})}
                           className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none transition-all font-semibold text-sm"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-500 ml-1">Number of Employees</label>
                         <select value={profileData.company.employeeCount} onChange={(e) => setProfileData({...profileData, company: {...profileData.company, employeeCount: e.target.value}})}
                           className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none transition-all font-semibold text-sm appearance-none cursor-pointer"
                         >
                            <option value="">Select size</option>
                            <option value="1-10">1-10 employees</option>
                            <option value="11-50">11-50 employees</option>
                            <option value="51-200">51-200 employees</option>
                            <option value="201-500">201-500 employees</option>
                            <option value="501+">501+ employees</option>
                         </select>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 ml-1">Company Description</label>
                      <textarea value={profileData.company.description} onChange={(e) => setProfileData({...profileData, company: {...profileData.company, description: e.target.value}})}
                         className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl min-h-[140px] focus:bg-white focus:border-blue-600 outline-none transition-all font-semibold text-sm leading-relaxed"
                         placeholder="Briefly describe your company's mission and operations..."
                      ></textarea>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6 animate-in fade-in duration-300 pb-12">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                   <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-50">
                      <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg">
                         <FiHexagon size={20} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">Security Credentials</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">Protect your account by regularly rotating your password.</p>
                      </div>
                   </div>

                   <div className="space-y-6 max-w-xl">
                      <div className="space-y-2 group">
                         <label className="text-xs font-bold text-slate-500 ml-1 group-focus-within:text-blue-600 transition-colors">Current Password</label>
                         <input type="password" required value={passwordData.currentPassword} onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                           className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-medium"
                           placeholder="••••••••"
                         />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                         <div className="space-y-2 group">
                            <label className="text-xs font-bold text-slate-500 ml-1 group-focus-within:text-blue-600 transition-colors">New Password</label>
                            <input type="password" required value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-medium"
                              placeholder="Minimum 6 characters"
                            />
                         </div>
                         <div className="space-y-2 group">
                            <label className="text-xs font-bold text-slate-500 ml-1 group-focus-within:text-blue-600 transition-colors">Confirm New Password</label>
                            <input type="password" required value={passwordData.confirmPassword} onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all outline-none font-medium"
                              placeholder="Match your new password"
                            />
                         </div>
                      </div>

                      <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 flex gap-4 mt-6">
                        <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center shrink-0">
                          <FiZap size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-amber-900 mb-1">Security Recommendation</p>
                          <p className="text-xs text-amber-700 font-medium leading-relaxed">Use a combination of letters, numbers, and special characters for a stronger password.</p>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
