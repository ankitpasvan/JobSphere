import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { mockInterviewAPI } from '../../services/api';
import {
  FiPlay, FiSend, FiUser, FiCpu, FiAward, FiTrendingUp,
  FiCheckCircle, FiArrowLeft, FiStar, FiAlertCircle, FiZap, FiTrash2
} from 'react-icons/fi';

/* ---------- Role quick-select options ---------- */
const PRESET_ROLES = [
  { label: 'Frontend Developer', icon: '⚛️' },
  { label: 'Backend Developer', icon: '🛠️' },
  { label: 'DSA', icon: '📊' },
  { label: 'Machine Learning', icon: '🤖' },
  { label: 'Full Stack Developer', icon: '🔥' },
  { label: 'System Design', icon: '🏗️' },
];

/* ---------- Score badge colour ---------- */
const scoreBadge = (score) => {
  if (score >= 8) return 'bg-emerald-100 text-emerald-700';
  if (score >= 5) return 'bg-amber-100 text-amber-700';
  return 'bg-rose-100 text-rose-700';
};

/* ================================================
   MAIN COMPONENT
================================================ */
const MockInterview = () => {
  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  /* ---- Global phase: setup | loading | interview | summary ---- */
  const [phase, setPhase] = useState('setup');

  /* ---- Setup ---- */
  const [jobRole, setJobRole] = useState('');
  const [customRole, setCustomRole] = useState('');

  /* ---- Interview state ---- */
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionNumber, setQuestionNumber] = useState(1);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* ---- Conversation log for display + context ---- */
  const [chatLog, setChatLog] = useState([]);
  // Each entry: { type: 'question'|'answer'|'feedback', content, score?, feedback?, improvement?, questionNumber }

  /* ---- Evaluation state for current answer ---- */
  const [currentFeedback, setCurrentFeedback] = useState(null); // null = unevaluated

  /* ---- Final result ---- */
  const [finalResult, setFinalResult] = useState(null);

  /* ---- History ---- */
  const [history, setHistory] = useState([]);

  useEffect(() => { fetchHistory(); }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, currentFeedback, currentQuestion]);

  const fetchHistory = async () => {
    try {
      const resp = await mockInterviewAPI.getMySessions();
      setHistory(resp.data.sessions || []);
    } catch { /* silently ignore */ }
  };

  /* ---- Load Past Session into Analytics Dashboard ---- */
  const loadPastSession = (session) => {
    const rebuildLog = [];
    (session.results || []).forEach((r, i) => {
      const qNum = i + 1;
      rebuildLog.push({ type: 'question', content: r.question, questionNumber: qNum });
      rebuildLog.push({ type: 'answer', content: r.answer, questionNumber: qNum });
      rebuildLog.push({ type: 'feedback', score: r.score, feedback: r.feedback, improvement: r.improvement, questionNumber: qNum });
    });
    
    setChatLog(rebuildLog);
    setFinalResult({
      finalScore: session.overallScore || 0,
      finalSummary: session.summary || 'Summary data not generated for this older session.'
    });
    setPhase('summary');
  };

  /* ---- Delete Past Session ---- */
  const handleDeleteSession = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this mock interview? This cannot be undone.")) return;
    try {
      await mockInterviewAPI.deleteSession(id);
      toast.success("Session deleted successfully.");
      if (phase === 'summary') setPhase('setup');
      fetchHistory();
    } catch (err) {
      toast.error("Failed to delete session.");
    }
  };

  /* ---- Start interview ---- */
  const handleStart = async () => {
    const role = jobRole === 'custom' ? customRole.trim() : jobRole;
    if (!role) return toast.error('Please select or enter a job role.');

    setPhase('loading');
    try {
      const resp = await mockInterviewAPI.startInterview({ jobRole: role });
      const question = resp.data.firstQuestion;

      setChatLog([{ type: 'question', content: question, questionNumber: 1 }]);
      setCurrentQuestion(question);
      setQuestionNumber(1);
      setCurrentFeedback(null);
      setAnswer('');
      setPhase('interview');
    } catch (err) {
      setPhase('setup');
      toast.error(err.response?.data?.message || 'Failed to start interview. Check your API key.');
    }
  };

  /* ---- Submit answer ---- */
  const handleSubmit = async () => {
    if (!answer.trim()) return toast.error('Please write your answer first.');

    setSubmitting(true);

    // Add answer to chat
    const answerEntry = { type: 'answer', content: answer.trim(), questionNumber };
    setChatLog(prev => [...prev, answerEntry]);

    // Build history context to send to backend
    const historyForAPI = chatLog
      .reduce((acc, entry, idx, arr) => {
        if (entry.type === 'question') {
          const answerEntry = arr[idx + 1];
          if (answerEntry?.type === 'answer') {
            acc.push({ question: entry.content, answer: answerEntry.content });
          }
        }
        return acc;
      }, []);

    try {
      const resp = await mockInterviewAPI.nextQuestion({
        jobRole: jobRole === 'custom' ? customRole.trim() : jobRole,
        conversationHistory: historyForAPI,
        currentQuestion,
        answer: answer.trim(),
        questionNumber
      });

      const fb = resp.data.feedback;

      // Show feedback bubble
      const feedbackEntry = {
        type: 'feedback',
        score: fb.score,
        feedback: fb.feedback,
        improvement: fb.improvement,
        questionNumber
      };
      setChatLog(prev => [...prev, feedbackEntry]);
      setCurrentFeedback(fb);

      setAnswer('');

      if (fb.isComplete) {
        // Save session in background
        const allAnswers = [...historyForAPI, { question: currentQuestion, answer: answerEntry.content }];
        try {
          await mockInterviewAPI.saveSession({
            jobRole: jobRole === 'custom' ? customRole.trim() : jobRole,
            conversationHistory: allAnswers.map((t, i) => ({
              ...t,
              score: i === allAnswers.length - 1 ? fb.score : chatLog.find(e => e.type === 'feedback' && e.questionNumber === i + 1)?.score || 0,
              feedback: '',
              improvement: ''
            })),
            overallScore: fb.finalScore || 0,
            finalSummary: fb.finalSummary || ''
          });
        } catch { /* non-critical */ }

        setFinalResult(fb);
        setTimeout(() => setPhase('summary'), 1200);
        fetchHistory();
      } else {
        // Next question
        const nextQ = fb.nextQuestion;
        setTimeout(() => {
          setChatLog(prev => [...prev, { type: 'question', content: nextQ, questionNumber: fb.questionNumber + 1 }]);
          setCurrentQuestion(nextQ);
          setQuestionNumber(fb.questionNumber + 1);
          setCurrentFeedback(null);
          textareaRef.current?.focus();
        }, 600);
      }
    } catch (err) {
      // Remove answer from chat on error
      setChatLog(prev => prev.filter(e => e !== answerEntry));
      toast.error(err.response?.data?.message || 'Error processing your answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* =====================================================
     RENDERS
  ===================================================== */

  /* ---- SETUP SCREEN ---- */
  if (phase === 'setup') return (
    <div className="pb-20">
      <div className="max-w-5xl mx-auto">

        {/* Header - Simplified */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full text-xs font-bold text-blue-600 uppercase tracking-widest mb-6">
            <FiCpu size={12} /> AI Interviewer — Talent Bridge
          </div>
          <p className="text-slate-500 font-medium max-w-lg mx-auto">
            A real AI interviewer will ask you 5 questions, score each answer, and give you a final performance summary.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">

          {/* LEFT: Setup Card */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Select your interview role</h2>

            {/* Preset roles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {PRESET_ROLES.map(r => (
                <button
                  key={r.label}
                  onClick={() => setJobRole(r.label)}
                  className={`flex items-center gap-2 p-3 rounded-2xl border-2 font-semibold text-sm transition-all text-left ${
                    jobRole === r.label
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-blue-200 hover:bg-blue-50/50'
                  }`}
                >
                  <span className="text-xl">{r.icon}</span>
                  <span className="text-xs font-bold leading-tight">{r.label}</span>
                </button>
              ))}
            </div>

            {/* Custom role */}
            <div className="mb-8">
              <button
                onClick={() => setJobRole('custom')}
                className={`text-xs font-bold mb-3 flex items-center gap-2 ${jobRole === 'custom' ? 'text-blue-600' : 'text-slate-400 hover:text-blue-500'}`}
              >
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${jobRole === 'custom' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                  {jobRole === 'custom' && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                </span>
                Enter a custom role
              </button>
              {jobRole === 'custom' && (
                <input
                  type="text"
                  autoFocus
                  value={customRole}
                  onChange={e => setCustomRole(e.target.value)}
                  placeholder="e.g. iOS Developer, DevOps Engineer..."
                  className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-sm font-medium border border-slate-100"
                  onKeyDown={e => e.key === 'Enter' && handleStart()}
                />
              )}
            </div>

            <button
              onClick={handleStart}
              disabled={!jobRole || (jobRole === 'custom' && !customRole.trim())}
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FiPlay size={16} /> Start Interview
            </button>

            <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200 flex items-start gap-4">
               <div className="w-12 h-12 rounded-full bg-emerald-200 flex items-center justify-center shrink-0 shadow-inner">
                  <span className="text-2xl">🧠</span>
               </div>
               <div>
                  <p className="text-sm font-black text-emerald-900 mb-1 tracking-tight">Unlock AI Verified Status</p>
                  <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                     Score <strong className="font-black bg-emerald-200 px-1 py-0.5 rounded">40/50 or higher</strong> to earn the permanent AI Verified Badge on your job applications. Recruiters actively headhunt candidates with this badge on Talent Bridge!
                  </p>
               </div>
            </div>
          </div>

          {/* RIGHT: History */}
          <div className="space-y-4">
            <div className="bg-slate-900 rounded-3xl p-6 text-white">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Your Sessions</p>
              <p className="text-5xl font-bold">{history.length}</p>
              {history.length > 0 && (
                <p className="text-xs text-emerald-400 font-bold mt-2">
                  Avg score: {(history.reduce((a, b) => a + (b.overallScore || 0), 0) / history.length).toFixed(0)}/50
                </p>
              )}
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Recent</p>
              {history.length === 0 && <p className="text-xs text-slate-400 italic">No sessions yet.</p>}
              <div className="space-y-3">
                {history.slice(0, 4).map((s, i) => (
                  <div key={i} onClick={() => loadPastSession(s)} className="flex items-center justify-between cursor-pointer group hover:bg-slate-50 p-2 -mx-2 rounded-xl transition-all border border-transparent hover:border-slate-100 active:scale-95">
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{s.jobRole}</p>
                      <p className="text-[10px] text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                         {s.overallScore}/50
                       </span>
                       <button onClick={(e) => handleDeleteSession(e, s._id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100 hidden group-hover:block">
                         <FiTrash2 size={14} />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  /* ---- LOADING SCREEN ---- */
  if (phase === 'loading') return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
      <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-8" />
      <h2 className="text-xl font-bold mb-2">Preparing your interview...</h2>
      <p className="text-slate-400 text-sm font-medium">AI interviewer is getting ready</p>
    </div>
  );

  /* ---- INTERVIEW SCREEN ---- */
  if (phase === 'interview') return (
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 bg-[#f4f7fe] z-[60] flex flex-col animate-in fade-in duration-500">
      
      {/* Premium Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-6">
           <button
             onClick={() => { if (window.confirm('Exit the interview? Your progress will be lost.')) { setPhase('setup'); setChatLog([]); } }}
             className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all border border-slate-100 shadow-sm"
           >
             <FiArrowLeft size={20} />
           </button>
           <div className="hidden md:block">
              <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">{jobRole === 'custom' ? customRole : jobRole}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Professional Assessment Session</p>
           </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
           <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none">
                Phase {questionNumber} / 5
              </span>
           </div>
           <div className="flex gap-1">
             {[1, 2, 3, 4, 5].map(n => (
               <div
                 key={n}
                 className={`h-1 rounded-full transition-all duration-500 ${
                   n < questionNumber ? 'w-6 bg-emerald-500' :
                   n === questionNumber ? 'w-10 bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]' : 'w-4 bg-slate-200'
                 }`}
               />
             ))}
           </div>
        </div>
      </div>

      {/* Dynamic Conversation Stage */}
      <div className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-10 pb-12">
          {chatLog.map((entry, idx) => {
            const isQuestion = entry.type === 'question';
            const isAnswer = entry.type === 'answer';
            const isFeedback = entry.type === 'feedback';

            if (isQuestion) return (
              <div key={idx} className="flex items-start gap-4 animate-in slide-in-from-left-4 fade-in duration-500">
                <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg border border-slate-700 select-none">
                  <FiCpu size={20} />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] ml-1">Interviewer Request</p>
                  <div className="bg-white rounded-[24px] rounded-tl-none p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
                    <p className="text-slate-800 font-bold leading-relaxed text-[15px]">{entry.content}</p>
                  </div>
                </div>
              </div>
            );

            if (isAnswer) return (
              <div key={idx} className="flex items-start gap-4 flex-row-reverse animate-in slide-in-from-right-4 fade-in duration-500">
                <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20 border border-blue-400 select-none">
                  <FiUser size={20} />
                </div>
                <div className="flex-1 space-y-2 text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mr-1">Candidate Submission</p>
                  <div className="bg-slate-900 text-white rounded-[24px] rounded-tr-none p-6 shadow-xl border border-slate-800 inline-block text-left relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500" />
                    <p className="font-medium leading-relaxed text-[15px] opacity-90">{entry.content}</p>
                  </div>
                </div>
              </div>
            );

            if (isFeedback) return (
              <div key={idx} className="flex items-start gap-4 animate-in zoom-in-95 fade-in duration-500">
                <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-200">
                  <FiTrendingUp size={20} />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="bg-white rounded-[32px] rounded-tl-none border border-slate-100 shadow-xl overflow-hidden group">
                    <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance Insight</span>
                       <span className={`text-xs font-black px-4 py-1.5 rounded-full shadow-sm border ${scoreBadge(entry.score)}`}>
                         {entry.score} / 10 Points
                       </span>
                    </div>
                    <div className="p-6 grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                          <FiCheckCircle size={10} /> Competency Review
                        </p>
                        <p className="text-sm text-slate-700 font-medium leading-relaxed italic border-l-2 border-emerald-100 pl-3">{entry.feedback}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                          <FiZap size={10} /> Optimization Points
                        </p>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed border-l-2 border-amber-100 pl-3">{entry.improvement}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );

            return null;
          })}

          {submitting && (
            <div className="flex items-start gap-4 animate-pulse">
              <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg border border-slate-800">
                <FiCpu size={20} className="animate-spin duration-slow" />
              </div>
              <div className="bg-white rounded-[24px] rounded-tl-none p-5 shadow-sm border border-slate-100 flex items-center gap-3">
                <div className="flex gap-1">
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                </div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Evaluating Response...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} className="h-10" />
        </div>
      </div>

      {/* Tactical Input Dock */}
      <div className="bg-white/80 backdrop-blur-2xl border-t border-slate-200 p-6 z-20">
        <div className="max-w-3xl mx-auto relative group">
          {!currentFeedback && !submitting ? (
             <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-500">
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    autoFocus
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { 
                        e.preventDefault(); 
                        handleSubmit(); 
                      }
                    }}
                    placeholder="Provide your professional insight here..."
                    rows={1}
                    className="w-full p-6 pr-24 bg-slate-50 border-2 border-slate-100 rounded-[30px] outline-none focus:border-blue-500 focus:bg-white text-[15px] font-bold text-slate-900 placeholder:text-slate-400 resize-none transition-all shadow-inner custom-scrollbar min-h-[80px]"
                  />
                  <div className="absolute right-3 bottom-3">
                    <button
                      onClick={handleSubmit}
                      disabled={!answer.trim() || submitting}
                      className="h-14 w-14 bg-slate-900 text-white rounded-[24px] flex items-center justify-center shadow-xl hover:bg-blue-600 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-30 disabled:translate-y-0 disabled:shadow-none group"
                    >
                      <FiSend size={20} className="group-hover:rotate-12 transition-transform" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-6 px-4">
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                     <span className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">ENTER</span> to Submit
                   </p>
                   <div className="w-1 h-1 bg-slate-200 rounded-full" />
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                     <span className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">SHIFT + ENTER</span> for Multi-line
                   </p>
                </div>
             </div>
          ) : !submitting && (
            <div className="flex justify-center py-4 animate-in zoom-in-95 duration-500">
               <div className="p-1 pb-1.5 bg-emerald-500 rounded-full animate-bounce">
                  <div className="p-4 bg-emerald-600 text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-lg flex items-center gap-3">
                     <FiStar /> Evaluation Synchronized — Next Matrix Ready
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );


  /* ---- SUMMARY SCREEN ---- */
  if (phase === 'summary' && finalResult) return (
    <div className="min-h-screen bg-[#f8faff] pt-20 pb-16 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-100">
            <FiAward size={36} className="text-emerald-500" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Interview Complete!</h1>
          <p className="text-slate-500 font-medium">Here's your verified analytical breakdown across all 5 questions.</p>
        </div>

        {/* Dynamic AI Verified Alert */}
        {finalResult.finalScore >= 40 && (
          <div className="mb-8 p-5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-3xl border border-emerald-400 shadow-xl shadow-emerald-500/20 flex flex-col md:flex-row items-center gap-5 text-white animate-[fadeUp_0.5s_ease]">
            <div className="w-16 h-16 bg-white flex items-center justify-center rounded-2xl text-4xl shrink-0 shadow-inner">🧠</div>
            <div className="text-center md:text-left">
               <h3 className="text-xl font-black tracking-tight mb-1">AI Verified Badge Unlocked!</h3>
               <p className="text-sm text-emerald-100 font-medium leading-relaxed">Congratulations, amazing performance! This verified badge will now be permanently displayed to recruiters when you apply for jobs.</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Main Score Radial */}
          <div className="bg-white border border-slate-100 rounded-3xl p-8 flex flex-col items-center justify-center shadow-lg overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 transition-opacity group-hover:opacity-100" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-2 w-full text-center">Overall Performance Metrics</p>
            
            <div className="relative w-48 h-48 flex items-center justify-center mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                <circle 
                  cx="50" cy="50" r="45" fill="none" 
                  stroke={finalResult.finalScore >= 40 ? '#10b981' : finalResult.finalScore >= 25 ? '#f59e0b' : '#ef4444'} 
                  strokeWidth="10" 
                  strokeDasharray={`${(finalResult.finalScore / 50) * 283} 283`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-slate-900 tracking-tighter">{finalResult.finalScore}</span>
                <span className="text-sm font-bold text-slate-400">out of 50</span>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-3 text-center">
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                 <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Accuracy</p>
                 <p className="text-xl text-slate-900 font-black">{Math.round((finalResult.finalScore / 50) * 100)}%</p>
               </div>
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                 <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Status</p>
                 <p className={`text-base font-black mt-1 uppercase tracking-wider ${finalResult.finalScore >= 40 ? 'text-emerald-500' : 'text-amber-500'}`}>
                   {finalResult.finalScore >= 40 ? 'Pass' : 'Review'}
                 </p>
               </div>
            </div>
          </div>

          {/* Detailed Question Analysis Bars */}
          <div className="bg-white border border-slate-100 rounded-3xl p-8 flex flex-col justify-between shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-indigo-400 to-purple-500 opacity-0 transition-opacity group-hover:opacity-100" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-2 w-full">Question Consistency Analysis</p>
            
            <div className="space-y-6 flex-1 w-full mt-2">
              {chatLog.filter(e => e.type === 'feedback').map((e, i) => (
                <div key={i} className="w-full">
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-xs font-bold text-slate-700">Question {e.questionNumber}</p>
                    <p className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 text-center min-w-[36px]">{e.score} pts</p>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                    <div 
                      className={`h-full rounded-full ${e.score >= 8 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : e.score >= 5 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-rose-400 to-rose-500'}`}
                      style={{ width: `${(e.score / 10) * 100}%`, transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Deep Dive Summary */}
        {finalResult.finalSummary && (
          <div className="bg-white border border-slate-100 rounded-3xl p-8 mb-8 shadow-lg">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FiTrendingUp size={16} /> Technical Summary & Recommendations
            </p>
            <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 text-slate-700 text-sm font-medium leading-relaxed whitespace-pre-line">
              {finalResult.finalSummary}
            </div>
          </div>
        )}

        {/* Exact Answers Printout Section */}
        <div className="space-y-6 mb-10">
          <p className="text-lg font-black text-slate-900 tracking-tight">Detailed Answer Review</p>
          {chatLog.filter(e => e.type === 'feedback').map((fb, i) => {
             const qObj = chatLog.find(c => c.type === 'question' && c.questionNumber === fb.questionNumber);
             const aObj = chatLog.find(c => c.type === 'answer' && c.questionNumber === fb.questionNumber);
             
             if (!qObj || !aObj) return null; // safety check for partial loads

             return (
               <div key={i} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col gap-5 hover:shadow-md transition-shadow">
                 <div className="flex justify-between items-start gap-4 pb-4 border-b border-slate-50">
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><FiCpu size={10} className="text-blue-500"/> AI Question {fb.questionNumber}</p>
                      <p className="text-sm font-bold text-slate-800 leading-relaxed">{qObj.content}</p>
                    </div>
                    <span className={`text-xs font-black px-3 py-1.5 rounded-full shrink-0 ${scoreBadge(fb.score)} border ${fb.score >= 8 ? 'border-emerald-200' : fb.score >= 5 ? 'border-amber-200' : 'border-rose-200'}`}>
                       {fb.score}/10 pts
                    </span>
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1"><FiUser size={10} /> What you submitted</p>
                    <div className="text-sm font-medium text-slate-700 bg-[#f8faff] p-5 rounded-2xl border border-blue-100/50 shadow-inner">
                       "{aObj.content}"
                    </div>
                 </div>
                 <div className="grid sm:grid-cols-2 gap-4 mt-2">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1.5 flex items-center gap-1"><FiCheckCircle size={10} /> Feedback</p>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">{fb.feedback}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1.5 flex items-center gap-1"><FiAlertCircle size={10} /> Improve Next Time</p>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">{fb.improvement}</p>
                    </div>
                 </div>
               </div>
             )
          })}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => {
              setPhase('setup');
              setChatLog([]);
              setFinalResult(null);
              setCurrentFeedback(null);
              setAnswer('');
            }}
            className="flex-1 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
          >
            <FiPlay size={16} /> Start New Interview
          </button>
          <button
            onClick={() => navigate('/candidate/dashboard')}
            className="flex-1 py-4 bg-white/10 text-white font-bold rounded-2xl hover:bg-white/20 transition-all border border-white/10 active:scale-95"
          >
            Back to Dashboard
          </button>
        </div>

      </div>
    </div>
  );

  return null;
};

export default MockInterview;
