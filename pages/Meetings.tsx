import React, { useState, useEffect, useRef } from 'react';
import { Meeting } from '../types';
import { IconVideo, IconVideoOff, IconMic, IconMicOff, IconScreenShare, IconStopScreenShare } from '../components/Icons';

interface MeetingsPageProps {
  userName: string;
  meetings: Meeting[];
}

const Meetings: React.FC<MeetingsPageProps> = ({ userName, meetings }) => {
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [isInWaitingRoom, setIsInWaitingRoom] = useState(false);
  const [isHost, setIsHost] = useState(false); 
  
  // WebRTC / Media State
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<{user: string, text: string}[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [participants, setParticipants] = useState(['Pastor John', 'Sarah', 'Mike']);

  // PiP Resize State
  const [pipDimensions, setPipDimensions] = useState({ width: 280, height: 158 }); // approx 16:9
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{ startX: number, startY: number, startWidth: number, startHeight: number } | null>(null);

  // Join Logic
  const handleJoin = (meeting: Meeting) => {
    const isUserHost = userName.toLowerCase().includes('admin') || meeting.host === 'Pastor John'; 
    setIsHost(isUserHost);
    
    if (!isUserHost) {
      setIsInWaitingRoom(true);
      setTimeout(() => setIsInWaitingRoom(false), 3000); 
    }
    setActiveMeeting(meeting);
    startCamera();
  };

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (err) {
      console.error("Error accessing media", err);
    }
  };

  const toggleScreenShare = async () => {
    if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        setScreenStream(null);
    } else {
        try {
            const s = await navigator.mediaDevices.getDisplayMedia({ video: true });
            setScreenStream(s);
            if (screenShareRef.current) screenShareRef.current.srcObject = s;
            s.getVideoTracks()[0].onended = () => {
                setScreenStream(null);
            };
        } catch (err) {
            console.error("Error sharing screen", err);
        }
    }
  };

  const handleLeave = () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    if (screenStream) screenStream.getTracks().forEach(t => t.stop());
    setStream(null);
    setScreenStream(null);
    setActiveMeeting(null);
    setIsInWaitingRoom(false);
    setPipDimensions({ width: 280, height: 158 });
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    setMessages([...messages, { user: 'Me', text: inputMsg }]);
    setInputMsg('');
  };
  
  // Stream Management
  useEffect(() => {
      if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
      }
      if (screenShareRef.current && screenStream) {
          screenShareRef.current.srcObject = screenStream;
      }
  }, [stream, screenStream, isInWaitingRoom, activeMeeting]);

  // Auto-scroll Chat
  useEffect(() => {
    if (chatOpen && chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatOpen]);

  // Resize Logic (PiP)
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startWidth: pipDimensions.width,
        startHeight: pipDimensions.height
    };
  };

  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          if (!isResizing || !resizeRef.current) return;
          
          // Dragging top-left corner logic
          const deltaX = resizeRef.current.startX - e.clientX;
          const deltaY = resizeRef.current.startY - e.clientY;

          const newWidth = Math.max(200, Math.min(600, resizeRef.current.startWidth + deltaX));
          const newHeight = Math.max(112, Math.min(450, resizeRef.current.startHeight + deltaY));

          setPipDimensions({ width: newWidth, height: newHeight });
      };

      const handleMouseUp = () => {
          setIsResizing(false);
          resizeRef.current = null;
      };

      if (isResizing) {
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp);
      }
      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      };
  }, [isResizing]);

  // Grid Calculation
  const getTotalParticipants = () => participants.length + 1; // +1 for Me
  const getGridClass = () => {
      const count = getTotalParticipants();
      if (count <= 1) return "grid-cols-1 max-w-5xl"; // Focused single view
      if (count === 2) return "grid-cols-1 md:grid-cols-2 max-w-6xl";
      if (count <= 4) return "grid-cols-2 max-w-6xl";
      if (count <= 6) return "grid-cols-2 md:grid-cols-3 max-w-7xl";
      if (count <= 9) return "grid-cols-3 max-w-[1600px]";
      return "grid-cols-3 md:grid-cols-4 max-w-[1800px]";
  };

  // ---- WAITING ROOM VIEW ----
  if (isInWaitingRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">Waiting for Host</h2>
          <p className="text-slate-400">Please wait, the meeting host will let you in soon.</p>
        </div>
      </div>
    );
  }

  // ---- ACTIVE MEETING VIEW ----
  if (activeMeeting) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col text-white">
        {/* Header */}
        <div className="h-14 border-b border-slate-700 flex items-center justify-between px-4 bg-slate-800 shrink-0">
            <div className="font-semibold truncate pr-2 flex items-center">
                {activeMeeting.title} 
                <span className="text-xs font-normal text-slate-400 px-2 py-0.5 bg-slate-700 rounded ml-2 whitespace-nowrap hidden sm:inline-block">
                    {participants.length + 1} active
                </span>
            </div>
            <button className="md:hidden text-sm px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded transition" onClick={() => setChatOpen(!chatOpen)}>Chat</button>
        </div>

        {/* Main Stage */}
        <div className="flex-1 flex overflow-hidden relative">
            {/* Video Area */}
            <div className={`flex-1 bg-black relative flex items-center justify-center p-4 transition-all w-full overflow-y-auto custom-scrollbar`}>
                
                {/* Screen Share View or Grid View */}
                {screenStream ? (
                     <div className="relative w-full h-full group flex items-center justify-center bg-neutral-900 overflow-hidden rounded-lg">
                        <video ref={screenShareRef} autoPlay playsInline className="w-full h-full object-contain" />
                        
                        {/* Screen Share Overlay - Appears on hover */}
                        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                            <div className="bg-slate-800/60 p-8 rounded-2xl border border-white/10 backdrop-blur-md flex flex-col items-center shadow-2xl transform scale-95 group-hover:scale-100 transition-transform duration-300">
                                <div className="mb-6 text-center">
                                    <div className="w-16 h-16 bg-primary-500/20 text-primary-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                         <IconScreenShare className="w-8 h-8" />
                                    </div>
                                    <p className="text-white text-2xl font-bold tracking-wide mb-2">You are currently screen sharing</p>
                                    <p className="text-slate-300 text-sm">This window is hidden from your audience</p>
                                </div>
                                <button 
                                    onClick={toggleScreenShare}
                                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-red-600/30 transition-all flex items-center gap-3 transform hover:scale-105 ring-4 ring-transparent hover:ring-red-600/20"
                                >
                                    <IconStopScreenShare className="w-5 h-5" />
                                    Stop Sharing
                                </button>
                            </div>
                        </div>
                     </div>
                ) : (
                    /* Adaptive Grid View with strict 16:9 Aspect Ratio */
                    <div className={`grid gap-4 w-full mx-auto ${getGridClass()} items-center content-center`}>
                        {/* Local User */}
                        <div className="relative bg-slate-800 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 w-full aspect-video group">
                             <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${cameraOn ? '' : 'hidden'}`} />
                             {!cameraOn && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                                    <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg text-white">{userName.charAt(0)}</div>
                                </div>
                             )}
                             <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1 text-xs rounded-md truncate max-w-[80%] font-medium shadow-sm">Me {isHost ? '(Host)' : ''}</div>
                             <div className="absolute top-3 right-3 bg-slate-900/50 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                {micOn ? <div className="w-2 h-2 bg-green-500 rounded-full"></div> : <IconMicOff className="w-3 h-3 text-red-400"/>}
                             </div>
                        </div>
                        {/* Dummy Participants */}
                         {participants.map((p, i) => (
                            <div key={i} className="relative bg-slate-800 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 w-full aspect-video group flex items-center justify-center">
                                <img src={`https://picsum.photos/600/400?random=${i + 10}`} alt="participant" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1 text-xs rounded-md truncate max-w-[80%] font-medium shadow-sm">{p}</div>
                            </div>
                         ))}
                    </div>
                )}

                {/* Resizable PiP for Local User when Screen Sharing */}
                {screenStream && (
                    <div 
                        className="absolute bottom-6 right-6 bg-slate-800 border-2 border-slate-600 rounded-xl shadow-2xl overflow-hidden z-30 group"
                        style={{ width: pipDimensions.width, height: pipDimensions.height }}
                    >
                        {/* Resize Handle (Top-Left) */}
                        <div 
                            className="absolute top-0 left-0 w-8 h-8 cursor-nwse-resize z-40 flex items-center justify-center bg-black/30 hover:bg-primary-500/80 transition-colors rounded-br-xl backdrop-blur-sm"
                            onMouseDown={startResize}
                            title="Drag to resize"
                        >
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-80 text-white">
                                 <path d="M15 3h6v6M9 21H3v-6" />
                             </svg>
                        </div>

                         <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover pointer-events-none" />
                         <div className="absolute bottom-2 left-2 text-[10px] bg-black/60 px-2 py-0.5 rounded text-white/90 font-medium backdrop-blur-md">Me</div>
                    </div>
                )}
            </div>

            {/* Chat Sidebar */}
            {chatOpen && (
                <div className="w-full md:w-80 bg-slate-800 border-l border-slate-700 flex flex-col absolute inset-0 md:static z-40 shadow-xl">
                    <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/95 backdrop-blur">
                        <span className="font-bold text-sm uppercase tracking-wider text-slate-400">Chat</span>
                        <button onClick={() => setChatOpen(false)} className="md:hidden text-slate-400 hover:text-white transition">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-800/50">
                        {messages.length === 0 && (
                            <div className="text-center text-slate-500 text-sm mt-10">No messages yet. Say hi!</div>
                        )}
                        {messages.map((m, i) => (
                            <div key={i} className={`flex flex-col animate-fade-in ${m.user === 'Me' ? 'items-end' : 'items-start'}`}>
                                <span className="text-xs text-slate-400 mb-1 px-1">{m.user}</span>
                                <div className={`p-2.5 rounded-lg text-sm max-w-[85%] shadow-sm ${m.user === 'Me' ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-slate-700 text-slate-200 rounded-tl-none'}`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={sendMessage} className="p-4 border-t border-slate-700 bg-slate-800">
                        <div className="relative">
                            <input 
                               type="text" 
                               value={inputMsg} 
                               onChange={e => setInputMsg(e.target.value)} 
                               className="w-full bg-slate-900 border border-slate-600 rounded-full pl-4 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder-slate-500"
                               placeholder="Type a message..."
                            />
                            <button type="submit" disabled={!inputMsg.trim()} className="absolute right-1.5 top-1.5 p-1.5 bg-primary-600 text-white rounded-full hover:bg-primary-500 disabled:opacity-50 disabled:hover:bg-primary-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>

        {/* Controls Footer */}
        <div className="h-20 bg-slate-800 border-t border-slate-700 flex items-center justify-center gap-4 px-6 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] relative z-50">
            <button onClick={() => setMicOn(!micOn)} className={`p-4 rounded-full transition-all shadow-lg transform active:scale-95 ${micOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500 text-white hover:bg-red-600'}`} title={micOn ? "Mute Microphone" : "Unmute Microphone"}>
                {micOn ? <IconMic className="w-5 h-5" /> : <IconMicOff className="w-5 h-5" />}
            </button>
            <button onClick={() => setCameraOn(!cameraOn)} className={`p-4 rounded-full transition-all shadow-lg transform active:scale-95 ${cameraOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500 text-white hover:bg-red-600'}`} title={cameraOn ? "Turn Camera Off" : "Turn Camera On"}>
                {cameraOn ? <IconVideo className="w-5 h-5" /> : <IconVideoOff className="w-5 h-5" />}
            </button>
            <button onClick={toggleScreenShare} className={`p-4 rounded-full transition-all shadow-lg transform active:scale-95 ${screenStream ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-slate-700 hover:bg-slate-600 text-white'}`} title={screenStream ? "Stop Sharing" : "Share Screen"}>
                {screenStream ? <IconStopScreenShare className="w-5 h-5" /> : <IconScreenShare className="w-5 h-5" />}
            </button>
            <button onClick={() => setChatOpen(!chatOpen)} className={`p-4 rounded-full transition-all shadow-lg transform active:scale-95 hidden md:block relative ${chatOpen ? 'bg-primary-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`} title="Chat">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                 {!chatOpen && <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-800 animate-pulse"></span>}
            </button>
            <div className="w-px h-10 bg-slate-700 mx-2"></div>
            <button onClick={handleLeave} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold shadow-lg transform hover:scale-105 transition-all text-sm tracking-wide">
                End Call
            </button>
        </div>
      </div>
    );
  }

  // ---- MEETING LIST VIEW ----
  return (
    <div className="container mx-auto p-6 max-w-4xl animate-fade-in">
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-slate-800">Micro Gatherings</h2>
          <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow hover:bg-primary-700 transition flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Schedule New
          </button>
      </div>

      {meetings.length === 0 ? (
         <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-slate-300">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
               <IconVideo className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">No Scheduled Meetings</h3>
            <p className="text-slate-500 mt-1">Check back later or ask an admin to schedule one.</p>
         </div>
      ) : (
        <div className="space-y-4">
            {meetings.map(meeting => (
                <div key={meeting.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md transition group">
                    <div className="flex gap-4 items-center w-full md:w-auto">
                        <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <IconVideo className="w-6 h-6 transform" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 group-hover:text-primary-600 transition-colors">{meeting.title}</h3>
                            <div className="flex flex-wrap items-center text-slate-500 text-sm mt-1 gap-x-4 gap-y-1">
                                <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> {meeting.startTime}</span>
                                <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> {meeting.host}</span>
                                <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> {meeting.participants} waiting</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button 
                        onClick={() => alert(`Link copied: https://1000micro.church/meet/${meeting.id}`)}
                        className="flex-1 md:flex-none border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition"
                        >
                            Copy Link
                        </button>
                        <button 
                        onClick={() => handleJoin(meeting)}
                        className="flex-1 md:flex-none bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow hover:bg-primary-700 hover:shadow-lg transition transform active:scale-95"
                        >
                            Join Now
                        </button>
                    </div>
                </div>
            ))}
        </div>
      )}
      
      <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          <div>
            <h4 className="font-bold text-blue-900">Tech Tip</h4>
            <p className="text-blue-800 text-sm mt-1">For the best experience, use a headset to avoid echo and ensure your camera is positioned at eye level.</p>
          </div>
      </div>
    </div>
  );
};

export default Meetings;