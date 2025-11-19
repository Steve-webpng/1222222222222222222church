import React, { useState, useEffect, useRef } from 'react';
import { Meeting, LiveParticipant, ChatMessage } from '../types';
import { IconVideo, IconVideoOff, IconMic, IconMicOff, IconScreenShare, IconStopScreenShare, IconMoreVertical, IconUserX, IconSmile } from '../components/Icons';

interface MeetingsPageProps {
  meetings: Meeting[];
}

const Meetings: React.FC<MeetingsPageProps> = ({ meetings }) => {
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [joiningMeeting, setJoiningMeeting] = useState<Meeting | null>(null);
  const [userName, setUserName] = useState('');
  
  // WebRTC / Media State
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [activeReactionPicker, setActiveReactionPicker] = useState<string | null>(null);
  
  const [localUser, setLocalUser] = useState<LiveParticipant | null>(null);
  const [participants, setParticipants] = useState<LiveParticipant[]>([]);
  const [waitingRoom, setWaitingRoom] = useState<{id: string, name: string}[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // PiP Resize State
  const [pipDimensions, setPipDimensions] = useState({ width: 280, height: 158 });
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{ startX: number, startY: number, startWidth: number, startHeight: number } | null>(null);

  const EMOJI_REACTIONS = ['👍', '❤️', '😂', '🙏', '🎉'];

  // Join Logic
  const handleJoinClick = (meeting: Meeting) => {
    setJoiningMeeting(meeting);
  };

  const finalizeJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !joiningMeeting) return;

    const isHost = userName.toLowerCase() === joiningMeeting.host.toLowerCase();
    const user: LiveParticipant = { id: `user-${Date.now()}`, name: userName, isHost, muted: false };
    
    setLocalUser(user);
    setParticipants([user]);
    setActiveMeeting(joiningMeeting);
    setJoiningMeeting(null);
    await startCamera();

    // Simulate other users joining and entering waiting room
    if(isHost) {
      setTimeout(() => setWaitingRoom(prev => [...prev, {id: 'wait-1', name: 'Sarah'}]), 3000);
      setTimeout(() => setWaitingRoom(prev => [...prev, {id: 'wait-2', name: 'Mike'}]), 5000);
    } else {
       setTimeout(() => setParticipants(prev => [...prev, {id: 'host-1', name: joiningMeeting.host, isHost: true, muted: false}]), 2000);
    }
  };

  const admitUser = (id: string, name: string) => {
    setWaitingRoom(prev => prev.filter(p => p.id !== id));
    setParticipants(prev => [...prev, {id, name, isHost: false, muted: false}]);
  };
  const denyUser = (id: string) => setWaitingRoom(prev => prev.filter(p => p.id !== id));
  const removeUser = (id: string) => setParticipants(prev => prev.filter(p => p.id !== id));
  const toggleMuteUser = (id: string) => {
    setParticipants(prev => prev.map(p => p.id === id ? {...p, muted: !p.muted } : p));
    setActiveMenu(null);
  };

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (err) { console.error("Error accessing media", err); }
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
            s.getVideoTracks()[0].onended = () => setScreenStream(null);
        } catch (err) { console.error("Error sharing screen", err); }
    }
  };

  const handleLeave = () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    if (screenStream) screenStream.getTracks().forEach(t => t.stop());
    setStream(null); setScreenStream(null); setActiveMeeting(null); setLocalUser(null);
    setParticipants([]); setWaitingRoom([]); setPipDimensions({ width: 280, height: 158 });
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || !localUser) return;
    const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        user: localUser.name,
        text: inputMsg,
        reactions: {},
    };
    setMessages([...messages, newMessage]);
    setInputMsg('');
  };

  const handleReaction = (messageId: string, emoji: string) => {
    if (!localUser) return;
    const userName = localUser.name;

    setMessages(prevMessages => 
        prevMessages.map(msg => {
            if (msg.id === messageId) {
                const newReactions = { ...msg.reactions };
                const reactedUsers = newReactions[emoji] || [];

                if (reactedUsers.includes(userName)) {
                    // User is removing their reaction
                    newReactions[emoji] = reactedUsers.filter(u => u !== userName);
                    if (newReactions[emoji].length === 0) {
                        delete newReactions[emoji];
                    }
                } else {
                    // User is adding a reaction
                    newReactions[emoji] = [...reactedUsers, userName];
                }
                return { ...msg, reactions: newReactions };
            }
            return msg;
        })
    );
    setActiveReactionPicker(null);
  };
  
  useEffect(() => {
      if (videoRef.current && stream) videoRef.current.srcObject = stream;
      if (screenShareRef.current && screenStream) screenShareRef.current.srcObject = screenStream;
  }, [stream, screenStream, activeMeeting]);

  useEffect(() => {
    if (chatOpen && chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatOpen]);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsResizing(true);
    resizeRef.current = { startX: e.clientX, startY: e.clientY, startWidth: pipDimensions.width, startHeight: pipDimensions.height };
  };

  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          if (!isResizing || !resizeRef.current) return;
          const deltaX = e.clientX - resizeRef.current.startX;
          const newWidth = Math.max(200, Math.min(600, resizeRef.current.startWidth + deltaX));
          const newHeight = newWidth * (9/16); // Maintain aspect ratio
          setPipDimensions({ width: newWidth, height: newHeight });
      };
      const handleMouseUp = () => setIsResizing(false);
      if (isResizing) {
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp);
      }
      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      };
  }, [isResizing]);

  const getGridClass = () => {
      const count = participants.length;
      if (count <= 1) return "grid-cols-1 max-w-5xl";
      if (count === 2) return "grid-cols-1 md:grid-cols-2 max-w-6xl";
      if (count <= 4) return "grid-cols-2 max-w-6xl";
      if (count <= 6) return "grid-cols-2 md:grid-cols-3 max-w-7xl";
      if (count <= 9) return "grid-cols-3 max-w-[1600px]";
      return "grid-cols-3 md:grid-cols-4 max-w-[1800px]";
  };

  // ---- JOIN MODAL ----
  if (joiningMeeting) {
      return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
              <form onSubmit={finalizeJoin} className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Join Meeting</h2>
                  <p className="text-slate-500 mb-6">Enter your name to join "{joiningMeeting.title}".</p>
                  <input autoFocus required value={userName} onChange={e => setUserName(e.target.value)} placeholder="Your Name" className="w-full border border-slate-300 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-primary-500 outline-none" />
                  <div className="flex gap-2">
                     <button type="button" onClick={() => setJoiningMeeting(null)} className="w-full bg-slate-100 text-slate-700 py-3 rounded-lg font-bold hover:bg-slate-200">Cancel</button>
                     <button type="submit" className="w-full bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700">Join</button>
                  </div>
              </form>
          </div>
      )
  }

  // ---- ACTIVE MEETING VIEW ----
  if (activeMeeting && localUser) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col text-white">
        {/* Waiting Room Notification for Host */}
        {localUser.isHost && waitingRoom.length > 0 && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl p-4 w-full max-w-md z-50 animate-fade-in-down">
                <h4 className="font-bold text-sm mb-2 text-center">Waiting Room ({waitingRoom.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                    {waitingRoom.map(p => (
                        <div key={p.id} className="flex justify-between items-center bg-slate-700 p-2 rounded">
                            <span className="text-sm">{p.name}</span>
                            <div className="flex gap-2">
                                <button onClick={() => admitUser(p.id, p.name)} className="bg-green-600 text-white px-2 py-0.5 text-xs rounded hover:bg-green-700">Admit</button>
                                <button onClick={() => denyUser(p.id)} className="bg-red-600 text-white px-2 py-0.5 text-xs rounded hover:bg-red-700">Deny</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Header */}
        <div className="h-14 border-b border-slate-700 flex items-center justify-between px-4 bg-slate-800 shrink-0">
            <div className="font-semibold truncate pr-2 flex items-center">
                {activeMeeting.title} 
                <span className="text-xs font-normal text-slate-400 px-2 py-0.5 bg-slate-700 rounded ml-2 whitespace-nowrap hidden sm:inline-block">{participants.length} active</span>
            </div>
            <button className="md:hidden text-sm px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded transition" onClick={() => setChatOpen(!chatOpen)}>Chat</button>
        </div>

        {/* Main Stage */}
        <div className="flex-1 flex overflow-hidden relative">
            <div className={`flex-1 bg-black relative flex items-center justify-center p-4 transition-all w-full overflow-y-auto`}>
                {screenStream ? (
                     <div className="relative w-full h-full group flex items-center justify-center bg-neutral-900 overflow-hidden rounded-lg">
                        <video ref={screenShareRef} autoPlay playsInline className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                           <button onClick={toggleScreenShare} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold shadow-lg flex items-center gap-3">
                                <IconStopScreenShare className="w-5 h-5" /> Stop Sharing
                           </button>
                        </div>
                     </div>
                ) : (
                    <div className={`grid gap-4 w-full mx-auto ${getGridClass()} items-center content-center`}>
                         {participants.map((p) => (
                            <div key={p.id} className="relative bg-slate-800 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 w-full aspect-video group">
                                {p.id === localUser.id ? (
                                    <>
                                        <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${cameraOn ? '' : 'hidden'}`} />
                                        {!cameraOn && <div className="absolute inset-0 flex items-center justify-center bg-slate-800"><div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg text-white">{p.name.charAt(0)}</div></div>}
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800"><div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg text-white">{p.name.charAt(0)}</div></div>
                                )}
                                 <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1 text-xs rounded-md truncate max-w-[80%] font-medium shadow-sm">{p.name} {p.isHost ? '(Host)' : ''}</div>
                                 {(p.muted || (p.id === localUser.id && !micOn)) && 
                                    <div className="absolute top-3 right-3 bg-red-500/80 backdrop-blur-sm p-1.5 rounded-full"><IconMicOff className="w-3 h-3 text-white"/></div>
                                 }
                                 {localUser.isHost && p.id !== localUser.id && (
                                     <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setActiveMenu(activeMenu === p.id ? null : p.id)} className="p-1 rounded-full bg-black/50 hover:bg-black/80">
                                            <IconMoreVertical className="w-4 h-4 text-white" />
                                        </button>
                                        {activeMenu === p.id && (
                                            <div className="absolute right-0 top-8 bg-slate-700 rounded shadow-lg w-32 z-50" onMouseLeave={() => setActiveMenu(null)}>
                                                <button onClick={() => toggleMuteUser(p.id)} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-600 flex items-center gap-2">{p.muted ? <IconMic className="w-3 h-3" /> : <IconMicOff className="w-3 h-3" />} {p.muted ? 'Unmute' : 'Mute'}</button>
                                                <button onClick={() => removeUser(p.id)} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-600 flex items-center gap-2 text-red-400"><IconUserX className="w-3 h-3" /> Remove</button>
                                            </div>
                                        )}
                                     </div>
                                 )}
                            </div>
                         ))}
                    </div>
                )}
                {screenStream && (
                    <div className="absolute bottom-6 right-6 bg-slate-800 border-2 border-slate-600 rounded-xl shadow-2xl overflow-hidden z-30 group" style={{ width: pipDimensions.width, height: pipDimensions.height }}>
                        <div onMouseDown={startResize} className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-40 flex items-center justify-center bg-black/30 hover:bg-primary-500/80 transition-colors rounded-tl-xl opacity-0 group-hover:opacity-100"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-white"><path d="M15 3h6v6M9 21H3v-6" /></svg></div>
                         <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover pointer-events-none" />
                         <div className="absolute bottom-2 left-2 text-[10px] bg-black/60 px-2 py-0.5 rounded text-white/90 font-medium backdrop-blur-md">{localUser.name}</div>
                    </div>
                )}
            </div>
            {chatOpen && (
                <div className="w-full md:w-80 bg-slate-800 border-l border-slate-700 flex flex-col absolute inset-0 md:static z-40 shadow-xl">
                    <div className="p-4 border-b border-slate-700 flex justify-between items-center"><span className="font-bold text-sm uppercase">Chat</span><button onClick={() => setChatOpen(false)} className="md:hidden">X</button></div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {messages.map((m) => (
                          <div key={m.id} className={`flex flex-col group ${m.user === localUser.name ? 'items-end' : 'items-start'}`}>
                            <span className="text-xs text-slate-400 mb-1 px-2">{m.user}</span>
                            <div className="flex items-center gap-2">
                                {m.user === localUser.name && <button onClick={() => setActiveReactionPicker(activeReactionPicker === m.id ? null : m.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white"><IconSmile className="w-4 h-4"/></button>}
                                <div className={`p-2.5 rounded-lg text-sm relative ${m.user === localUser.name ? 'bg-primary-600' : 'bg-slate-700'}`}>
                                    {m.text}
                                    {activeReactionPicker === m.id && (
                                        <div className="absolute bottom-full mb-2 bg-slate-600 p-1 rounded-full flex gap-1 shadow-lg">
                                            {EMOJI_REACTIONS.map(emoji => (
                                                <button key={emoji} onClick={() => handleReaction(m.id, emoji)} className="p-1.5 rounded-full hover:bg-slate-500/50 text-xl">{emoji}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {m.user !== localUser.name && <button onClick={() => setActiveReactionPicker(activeReactionPicker === m.id ? null : m.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white"><IconSmile className="w-4 h-4"/></button>}
                            </div>
                            {Object.keys(m.reactions).length > 0 && (
                                <div className={`flex gap-1 mt-1 ${m.user === localUser.name ? 'pr-2' : 'pl-2'}`}>
                                    {Object.entries(m.reactions).map(([emoji, usersValue]) => {
                                      // FIX: Cast `usersValue` to `string[]` to fix type error where `users` was inferred as `unknown`.
                                      const users = usersValue as string[];
                                      return (
                                        <button key={emoji} onClick={() => handleReaction(m.id, emoji)}
                                          className={`px-1.5 py-0.5 text-xs rounded-full flex items-center gap-1 transition-colors ${users.includes(localUser.name) ? 'bg-primary-500/50 border border-primary-400 text-white' : 'bg-slate-600/70 border border-transparent hover:bg-slate-600'}`}>
                                          <span>{emoji}</span>
                                          <span>{users.length}</span>
                                        </button>
                                      );
                                    })}
                                </div>
                            )}
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={sendMessage} className="p-4 border-t border-slate-700"><input value={inputMsg} onChange={e => setInputMsg(e.target.value)} className="w-full bg-slate-900 border-slate-600 rounded-full pl-4 pr-10 py-2.5 text-sm" placeholder="Type..."/></form>
                </div>
            )}
        </div>
        <div className="h-20 bg-slate-800 border-t border-slate-700 flex items-center justify-center gap-4 px-6 shrink-0">
            <button onClick={() => setMicOn(!micOn)} className={`p-4 rounded-full ${micOn ? 'bg-slate-700' : 'bg-red-500'}`}><IconMic className={`w-5 h-5 ${!micOn && 'hidden'}`} /><IconMicOff className={`w-5 h-5 ${micOn && 'hidden'}`} /></button>
            <button onClick={() => setCameraOn(!cameraOn)} className={`p-4 rounded-full ${cameraOn ? 'bg-slate-700' : 'bg-red-500'}`}><IconVideo className={`w-5 h-5 ${!cameraOn && 'hidden'}`} /><IconVideoOff className={`w-5 h-5 ${cameraOn && 'hidden'}`} /></button>
            <button 
                onClick={toggleScreenShare} 
                className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold transition-colors ${screenStream ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
            >
                {screenStream ? <IconStopScreenShare className="w-5 h-5" /> : <IconScreenShare className="w-5 h-5" />}
                <span>{screenStream ? 'Stop Sharing' : 'Share Screen'}</span>
            </button>
            <button onClick={() => setChatOpen(!chatOpen)} className={`p-4 rounded-full hidden md:block ${chatOpen ? 'bg-primary-600' : 'bg-slate-700'}`}>Chat</button>
            <div className="w-px h-10 bg-slate-700 mx-2"></div>
            <button onClick={handleLeave} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold">End Call</button>
        </div>
      </div>
    );
  }

  // ---- MEETING LIST VIEW ----
  return (
    <div className="container mx-auto p-6 max-w-4xl animate-fade-in">
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-slate-800">Micro Gatherings</h2>
      </div>
      {meetings.length === 0 ? (
         <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-slate-300">
            <IconVideo className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">No Scheduled Meetings</h3>
            <p className="text-slate-500 mt-1">Ask an admin to schedule a new meeting.</p>
         </div>
      ) : (
        <div className="space-y-4">
            {meetings.map(meeting => (
                <div key={meeting.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start gap-4 hover:shadow-md transition group">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-800 group-hover:text-primary-600 transition-colors">{meeting.title}</h3>
                        <div className="flex flex-wrap items-center text-slate-500 text-sm mt-1 gap-x-4 gap-y-1">
                            <span>📅 {meeting.startTime}</span>
                            <span>Host: {meeting.host}</span>
                        </div>
                        <p className="text-slate-600 text-sm mt-3 line-clamp-2">{meeting.description}</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto self-center pt-4 md:pt-0">
                        <button 
                        onClick={() => alert(`Link copied: https://1000micro.church/meet/${meeting.id}`)}
                        className="flex-1 md:flex-none border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50"
                        >
                            Copy Link
                        </button>
                        <button 
                        onClick={() => handleJoinClick(meeting)}
                        className="flex-1 md:flex-none bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow hover:bg-primary-700"
                        >
                            Join Now
                        </button>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default Meetings;