import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { interviewAPI } from '../services/api';
import { FiMic, FiVideo, FiMonitor, FiLogOut, FiShield, FiUser, FiFileText, FiActivity, FiMessageSquare, FiMicOff, FiVideoOff } from 'react-icons/fi';
import io from 'socket.io-client';
import { getSocketBaseUrl } from '../utils/urlConfig';

const InterviewRoom = () => {
  const { interviewId } = useParams();
  const { user } = useAuth();
  const [interviewData, setInterviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const socketRef = useRef();
  const peerRef = useRef();
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const candidateQueue = useRef([]);

  useEffect(() => {
    const fetchData = async () => {
       try {
          const resp = await interviewAPI.getInterviewById(interviewId);
          setInterviewData(resp.data.interview);
       } catch (err) {
          console.error("Critical: Interview Data Sync Failed", err);
       } finally {
          setLoading(false);
       }
    };
    fetchData();

    const socketBaseUrl = getSocketBaseUrl();
    socketRef.current = io(socketBaseUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      path: '/socket.io/',
      autoConnect: true
    });

    // Add connection error handlers
    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected successfully:', socketRef.current.id);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    const startCall = async () => {
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(localStream);
        if (localVideoRef.current) localVideoRef.current.srcObject = localStream;

        // Wait for socket connection before joining room
        const joinRoom = () => {
          if (socketRef.current.connected) {
            socketRef.current.emit('join-room', interviewId);
          } else {
            socketRef.current.once('connect', () => {
              socketRef.current.emit('join-room', interviewId);
            });
          }
        };
        joinRoom();

        // Handle successful join and check for existing participants
        socketRef.current.on('joined-room', ({ participantCount }) => {
           console.log('Successfully joined room. Participants:', participantCount);
           // If we joined and there's already someone there (participantCount > 1) 
           // and we are the recruiter, initiate the call.
           if (participantCount > 1 && user?.role === 'recruiter' && !peerRef.current) {
              console.log('Participant already in room. Proactively initiating call...');
              initiateCall(localStream);
           }
        });

        socketRef.current.on('user-connected', (userId) => {
          console.log('New peer connected:', userId);
          // If a new user joins and we are the recruiter, initiate the call.
          if (user?.role === 'recruiter' && !peerRef.current) {
            initiateCall(localStream);
          }
        });

        socketRef.current.on('offer', async ({ offer }) => {
          console.log('Received offer');
          if (peerRef.current && peerRef.current.signalingState !== 'stable') {
            return;
          }
          const peer = createPeer(localStream);
          peerRef.current = peer;
          await peer.setRemoteDescription(new RTCSessionDescription(offer));
          
          // Process queued candidates
          while(candidateQueue.current.length > 0) {
            const candidate = candidateQueue.current.shift();
            await peer.addIceCandidate(new RTCIceCandidate(candidate));
          }

          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socketRef.current.emit('answer', { answer, roomId: interviewId });
        });

        socketRef.current.on('answer', async ({ answer }) => {
          console.log('Received answer');
          if (peerRef.current && peerRef.current.signalingState === 'have-local-offer') {
            await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
            // Process queued candidates
            while(candidateQueue.current.length > 0) {
              const candidate = candidateQueue.current.shift();
              await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
          }
        });

        socketRef.current.on('ice-candidate', async ({ candidate }) => {
          if (peerRef.current && peerRef.current.remoteDescription) {
            try {
              await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.error("Error adding ice candidate:", e);
            }
          } else {
            candidateQueue.current.push(candidate);
          }
        });

        socketRef.current.on('user-disconnected', (userId) => {
          console.log('Peer disconnected:', userId);
          setRemoteStream(null);
          if (peerRef.current) {
             peerRef.current.close();
             peerRef.current = null;
          }
        });
      } catch (err) {
        console.error("Failed to get local stream or connect:", err);
      }
    };

    startCall();

    return () => {
      console.log('Cleaning up interview room...');
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (socketRef.current) {
        // Only emit if socket is connected
        if (socketRef.current.connected) {
          socketRef.current.emit('leave-room', interviewId);
        }
        // Remove all listeners before disconnect
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      }
      if (peerRef.current) {
        peerRef.current.close();
      }
      candidateQueue.current = [];
    };
  }, [interviewId]);

  // Handle setting remote stream to video element when it becomes available
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const initiateCall = async (localStream) => {
    console.log('Initiating call...');
    const peer = createPeer(localStream);
    peerRef.current = peer;
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socketRef.current.emit('offer', { offer, roomId: interviewId });
  };

  const createPeer = (localStream) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    localStream.getTracks().forEach(track => peer.addTrack(track, localStream));

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current.emit('ice-candidate', { candidate: e.candidate, roomId: interviewId });
      }
    };

    peer.ontrack = (e) => {
      console.log('Received remote track');
      setRemoteStream(e.streams[0]);
    };

    return peer;
  };

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks()[0].enabled = !stream.getVideoTracks()[0].enabled;
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans text-slate-700 overflow-hidden">
      
      {/* Professional Header */}
      <div className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-50 shadow-sm">
        <div className="flex items-center gap-8">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">TB</div>
              <h1 className="font-bold text-sm tracking-tight text-slate-900">Virtual Interview <span className="text-slate-400 font-normal ml-2">| Session ID: {interviewId?.slice(-8)}</span></h1>
           </div>
           
           <div className="hidden lg:flex items-center gap-4 pl-6 border-l border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${remoteStream ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                 {remoteStream ? 'Connection: Stable' : 'Awaiting Participant...'}
              </div>
              <div className="flex items-center gap-2">
                 <FiShield className="text-blue-500" /> End-to-End Encrypted
              </div>
           </div>
        </div>
        
        <div className="flex items-center gap-6">
           <div className="flex flex-col items-end mr-2">
              <p className="text-xs font-bold text-slate-900">{user?.name}</p>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{user?.role} Access</p>
           </div>
           
           <Link 
             to={user?.role === 'recruiter' ? '/recruiter/dashboard' : '/candidate/dashboard'} 
             className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border border-rose-200 flex items-center gap-2"
           >
              Leave Session <FiLogOut size={14} />
           </Link>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
         {/* Main Video Viewport */}
         <div className="flex-1 flex flex-col relative bg-slate-100 p-6">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
               {/* Remote Participant Video */}
               <div className="relative bg-white rounded-[32px] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-200 group transition-all duration-500">
                  {remoteStream ? (
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50">
                       <div className="relative">
                          <div className="w-20 h-20 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-6"></div>
                          <FiUser className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] text-slate-300" size={32} />
                       </div>
                       <p className="text-sm font-bold text-slate-400">Waiting for participant to join...</p>
                       <p className="text-[11px] text-slate-300 mt-2 uppercase tracking-widest">Connection Pending</p>
                    </div>
                  )}
                  <div className="absolute bottom-6 left-6 px-4 py-2 bg-slate-900/10 backdrop-blur-md rounded-2xl border border-white/20 text-[10px] font-bold uppercase tracking-widest text-slate-900">
                     {user?.role === 'recruiter' ? 'Candidate' : 'Recruiter'} Feed
                  </div>
               </div>

               {/* Local Self Video */}
               <div className="relative bg-white rounded-[32px] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-200 group">
                  {isVideoOff ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                       <FiVideoOff size={48} className="text-slate-700" />
                    </div>
                  ) : (
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
                  )}
                  
                  <div className="absolute bottom-6 left-6 px-4 py-2 bg-slate-900/10 backdrop-blur-md rounded-2xl border border-white/20 text-[10px] font-bold uppercase tracking-widest text-slate-900">
                     You (Self View)
                  </div>
                  
                  {/* Floating Video Controls */}
                  <div className="absolute bottom-6 right-6 flex gap-3">
                     <button 
                       onClick={toggleMute}
                       className={`w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-md transition-all shadow-lg ${isMuted ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-white/90 text-slate-700 hover:bg-white border border-slate-200'}`}
                       title={isMuted ? 'Unmute' : 'Mute'}
                     >
                        {isMuted ? <FiMicOff size={18} /> : <FiMic size={18} />}
                     </button>
                     <button 
                       onClick={toggleVideo}
                       className={`w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-md transition-all shadow-lg ${isVideoOff ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-white/90 text-slate-700 hover:bg-white border border-slate-200'}`}
                       title={isVideoOff ? 'Start Video' : 'Stop Video'}
                     >
                        {isVideoOff ? <FiVideoOff size={18} /> : <FiVideo size={18} />}
                     </button>
                  </div>
               </div>
            </div>

            {/* Context Floating Card */}
            <div className="absolute top-10 left-10 p-5 bg-white/80 backdrop-blur-xl rounded-[24px] shadow-2xl shadow-slate-200/50 border border-slate-100 pointer-events-none transition-all duration-300">
               <div className="flex items-center gap-3 mb-3">
                  <div className="px-2 py-0.5 bg-blue-50 text-[10px] font-black text-blue-600 uppercase tracking-widest rounded-md">Live Session</div>
                  <div className="text-[10px] font-bold text-slate-400">Started 12:00 PM</div>
               </div>
               <h2 className="text-lg font-black text-slate-900 mb-1">{interviewData?.job?.title || 'Loading Interview...'}</h2>
               <p className="text-xs text-slate-500 font-medium">
                  {user?.role === 'recruiter' ? `Candidate: ${interviewData?.candidate?.name}` : `Hiring Manager: ${interviewData?.recruiter?.name || 'Recruiter'}`}
               </p>
            </div>
         </div>

         {/* Side Briefing Node (Metadata) */}
         <div className="w-80 bg-white border-l border-slate-200 flex flex-col overflow-y-auto hidden lg:flex p-8">
            <h2 className="text-[11px] font-bold uppercase text-slate-400 tracking-[0.2em] mb-10 flex items-center gap-2">
               <FiActivity size={16} className="text-blue-600" /> Session Intelligence
            </h2>

            {/* Candidate Identity Card */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 mb-8 shadow-sm">
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-[18px] bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-200">
                     {interviewData?.candidate?.name?.[0] || 'C'}
                  </div>
                  <div>
                     <p className="text-slate-900 font-black text-sm">{interviewData?.candidate?.name}</p>
                     <p className="text-[10px] text-slate-400 font-bold tracking-tight">Applicant Record Verified</p>
                  </div>
               </div>
               
               {user?.role === 'recruiter' && (
                 <a 
                   href={interviewData?.candidate?.profile?.resume} 
                   target="_blank" 
                   rel="noreferrer"
                   className="w-full py-3.5 bg-white text-slate-700 hover:bg-slate-50 rounded-2xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-slate-200 shadow-sm"
                 >
                    View Resume <FiFileText />
                 </a>
               )}
            </div>

            {/* Profile Insights */}
            <div className="space-y-8">
               <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-3">Position Context</p>
                  <p className="text-xs font-bold text-slate-700 leading-relaxed">{interviewData?.job?.title || 'Synchronizing...'}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{interviewData?.job?.company}</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-3">Core Competencies</p>
                  <div className="flex flex-wrap gap-2">
                     {interviewData?.candidate?.profile?.skills?.map((skill, i) => (
                       <span key={i} className="px-3 py-1 bg-white text-slate-600 text-[10px] font-bold rounded-xl border border-slate-200 shadow-sm">{skill}</span>
                     )) || <p className="text-xs italic text-slate-300">Awaiting profile data...</p>}
                  </div>
               </div>
            </div>

            {/* Evaluation Node for Interviewer */}
            {user?.role === 'recruiter' && (
              <div className="mt-auto pt-10">
                 <div className="p-6 bg-blue-600 rounded-[28px] text-white shadow-xl shadow-blue-200">
                    <p className="text-[10px] font-bold uppercase text-blue-100 tracking-wider mb-4 flex items-center gap-2">
                       <FiMessageSquare /> Live Observations
                    </p>
                    <textarea 
                       placeholder="Enter candidate feedback here..." 
                       className="w-full bg-blue-700/50 border-none outline-none text-xs text-white placeholder:text-blue-300 min-h-[140px] resize-none p-3 rounded-xl mb-3"
                    ></textarea>
                    <button className="w-full py-3 bg-white text-blue-600 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-colors shadow-lg">Save Observation</button>
                 </div>
              </div>
            )}
         </div>
      </div>

      {/* Connectivity Status Bar */}
      <div className="h-8 bg-white flex items-center justify-center gap-10 border-t border-slate-200 px-6">
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Session Active</span>
         </div>
         <div className="flex items-center gap-2">
            <FiShield size={12} className="text-blue-600" />
            <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">WebRTC Secured Link</span>
         </div>
         <span className="text-[9px] font-bold uppercase text-slate-300 tracking-tighter hidden sm:inline">Professional Interview Environment v5.2</span>
      </div>
      
      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default InterviewRoom;
