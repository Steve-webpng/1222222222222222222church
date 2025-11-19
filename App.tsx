import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import { Page, UserRole, Sermon, Event, PrayerRequest, Donation, Meeting } from './types';
import { getVerseOfDay, seedSermons, seedEvents, generatePrayerResponse } from './services/geminiService';
import Meetings from './pages/Meetings';
import { IconSearch, IconTrash, IconPlus, IconX, IconMapPin } from './components/Icons';

// Simple localStorage wrapper with error handling
const useStickyState = <T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    } catch (error) {
      console.warn(`Error parsing localStorage key "${key}":`, error);
      return defaultValue;
    }
  });
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);
  return [state, setState];
};

// --- PAGE COMPONENTS ---

const HomePage = ({ verse, setPage }: { verse: { text: string; ref: string } | null, setPage: (page: Page) => void }) => (
    <div className="animate-fade-in">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-20 px-6 text-center rounded-b-3xl shadow-lg">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">Welcome Home</h1>
        <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">Connecting 1000 micro churches across the globe in one unified digital spirit.</p>
      </div>
      <div className="container mx-auto px-6 -mt-10">
        <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-3xl mx-auto">
          <h2 className="text-primary-600 font-bold tracking-wider uppercase text-xs mb-2">Verse of the Day</h2>
          {verse ? (
             <>
                <blockquote className="text-xl md:text-2xl font-serif text-slate-700 italic mb-4">"{verse.text}"</blockquote>
                <cite className="text-slate-500 font-semibold not-italic">— {verse.ref}</cite>
             </>
          ) : <div className="animate-pulse h-10 bg-slate-100 rounded"></div>}
        </div>
      </div>
      <div className="container mx-auto px-6 py-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
         <div onClick={() => setPage(Page.SERMONS)} className="cursor-pointer bg-white p-6 rounded-xl shadow hover:shadow-lg transition border-t-4 border-blue-500">
            <h3 className="text-xl font-bold mb-2">Latest Sermons</h3>
            <p className="text-slate-600">Catch up on the latest teachings from our network pastors.</p>
         </div>
         <div onClick={() => setPage(Page.EVENTS)} className="cursor-pointer bg-white p-6 rounded-xl shadow hover:shadow-lg transition border-t-4 border-green-500">
            <h3 className="text-xl font-bold mb-2">Upcoming Events</h3>
            <p className="text-slate-600">Join us for fellowship, worship nights, and community outreach.</p>
         </div>
         <div onClick={() => setPage(Page.PRAYER)} className="cursor-pointer bg-white p-6 rounded-xl shadow hover:shadow-lg transition border-t-4 border-purple-500">
            <h3 className="text-xl font-bold mb-2">Prayer Wall</h3>
            <p className="text-slate-600">Share your burdens and let the community pray for you.</p>
         </div>
      </div>
    </div>
);

const SermonsPage = ({ sermons, openVideoModal }: { sermons: Sermon[], openVideoModal: (url: string) => void }) => (
    <div className="container mx-auto p-6 animate-fade-in pb-20">
      <h2 className="text-3xl font-bold text-slate-800 mb-6">Sermon Library</h2>
      {sermons.length === 0 ? (
        <p className="text-center text-slate-500 py-10">No sermons have been added yet. Please check back later.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sermons.map(sermon => (
            <div key={sermon.id} className="bg-white rounded-xl shadow overflow-hidden flex flex-col h-full">
              <img src={sermon.imageUrl} alt={sermon.title} className="w-full h-48 object-cover" />
              <div className="p-6 flex-1 flex flex-col">
                <span className="text-xs font-bold text-primary-600 mb-2">{sermon.date}</span>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{sermon.title}</h3>
                <p className="text-slate-500 text-sm mb-4">{sermon.speaker}</p>
                <p className="text-slate-600 text-sm flex-1 line-clamp-3">{sermon.description}</p>
                 {sermon.videoUrl ? (
                    <button onClick={() => openVideoModal(sermon.videoUrl!)} className="mt-4 w-full bg-primary-600 text-white py-2 rounded font-medium hover:bg-primary-700">
                        Watch Now
                    </button>
                 ) : (
                    <button className="mt-4 w-full bg-slate-100 text-slate-500 py-2 rounded font-medium cursor-not-allowed">
                        Video Unavailable
                    </button>
                 )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
);
  
const EventsPage = ({ events }: { events: Event[] }) => (
    <div className="container mx-auto p-6 animate-fade-in pb-20 max-w-4xl">
      <h2 className="text-3xl font-bold text-slate-800 mb-6">Community Events</h2>
      {events.length === 0 ? (
        <p className="text-center text-slate-500 py-10">No events have been scheduled. Please check back later.</p>
      ) : (
      <div className="space-y-4">
        {events.map(event => (
          <div key={event.id} className="bg-white p-6 rounded-xl shadow-sm flex flex-col md:flex-row gap-6 items-start">
            <div className="bg-primary-50 text-primary-700 p-4 rounded-lg text-center min-w-[100px]">
               <span className="block text-2xl font-bold">{event.date.split(',')[0]}</span>
               <span className="text-xs uppercase tracking-wide">Upcoming</span>
            </div>
            <div className="flex-1">
               <h3 className="text-xl font-bold text-slate-800">{event.title}</h3>
               <div className="flex items-center text-slate-500 text-sm mt-1 mb-3">
                  <span>📍 {event.location}</span>
                  <span className="mx-2">•</span>
                  <span>📅 {event.date}</span>
               </div>
               <p className="text-slate-600">{event.description}</p>
            </div>
            {!event.location.toLowerCase().includes('online') ? (
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`} target="_blank" rel="noopener noreferrer" className="bg-white border-2 border-primary-600 text-primary-600 px-4 py-2 rounded-full font-semibold hover:bg-primary-50 transition flex items-center gap-2">
                    <IconMapPin className="w-4 h-4" /> View Map
                </a>
            ) : (
                <button className="bg-primary-600 text-white px-6 py-2 rounded-full font-semibold">
                    Details
                </button>
            )}
          </div>
        ))}
      </div>
      )}
    </div>
);

const PrayerPage = ({ prayers, handlePrayerSubmit }: { prayers: PrayerRequest[], handlePrayerSubmit: (name: string, content: string) => void }) => {
    const [name, setName] = useState('');
    const [content, setContent] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handlePrayerSubmit(name, content);
      setName('');
      setContent('');
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    };

    const approvedPrayers = prayers.filter(p => p.status === 'APPROVED');

    return (
      <div className="container mx-auto p-6 animate-fade-in pb-20 max-w-5xl grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
           <div className="bg-white p-6 rounded-xl shadow sticky top-24">
              <h3 className="text-xl font-bold mb-4">Request Prayer</h3>
              {submitted ? (
                 <div className="bg-green-100 text-green-700 p-4 rounded mb-4 text-sm">
                    Prayer submitted! It will appear once approved. Check below for your AI-generated encouragement.
                 </div>
              ) : null}
              <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Your Name</label>
                    <input required value={name} onChange={e=>setName(e.target.value)} className="w-full border border-slate-300 rounded p-2 text-sm" placeholder="John Doe" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prayer Request</label>
                    <textarea required value={content} onChange={e=>setContent(e.target.value)} className="w-full border border-slate-300 rounded p-2 text-sm h-32" placeholder="How can we pray for you?" />
                 </div>
                 <button className="w-full bg-primary-600 text-white py-2 rounded font-bold hover:bg-primary-700">Submit Request</button>
              </form>
           </div>
        </div>
        <div className="md:col-span-2 space-y-6">
           <h2 className="text-2xl font-bold text-slate-800">Community Prayer Wall</h2>
           {prayers.length === 0 && <p className="text-slate-500 italic">No prayer requests yet. Be the first.</p>}
           {prayers.filter(p => p.status === 'PENDING').map(p => (
             <div key={p.id} className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-xl opacity-70">
               <div className="flex justify-between items-start mb-2">
                 <h4 className="font-bold text-slate-800">{p.name} <span className="text-xs bg-yellow-200 px-2 py-0.5 rounded text-yellow-800 ml-2">Pending Review</span></h4>
                 <span className="text-xs text-slate-500">{new Date(p.date).toLocaleDateString()}</span>
               </div>
               <p className="text-slate-700 mb-3">"{p.content}"</p>
               {p.aiResponse && (
                  <div className="bg-white p-3 rounded border border-yellow-100 text-sm text-slate-600 italic">
                     <span className="font-bold not-italic text-primary-600 text-xs block mb-1">Automated Encouragement:</span>
                     "{p.aiResponse}"
                  </div>
               )}
             </div>
           ))}
           {approvedPrayers.map(p => (
             <div key={p.id} className="bg-white border-l-4 border-primary-500 p-6 rounded-r-xl shadow-sm">
               <div className="flex justify-between items-start mb-2">
                 <h4 className="font-bold text-slate-800">{p.name}</h4>
                 <span className="text-xs text-slate-500">{new Date(p.date).toLocaleDateString()}</span>
               </div>
               <p className="text-slate-700 mb-3">"{p.content}"</p>
               <button className="text-xs text-slate-400 hover:text-primary-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v7.333z"/></svg>
                  Pray for this
               </button>
             </div>
           ))}
        </div>
      </div>
    );
};

const GivingPage = ({ handleDonation }: { handleDonation: (d: Donation) => void }) => {
    const [amount, setAmount] = useState('50');
    const [donorName, setDonorName] = useState('');
    const [email, setEmail] = useState('');
    const [success, setSuccess] = useState(false);

    const submitDonation = (e: React.FormEvent) => {
        e.preventDefault();
        handleDonation({ id: Date.now().toString(), name: donorName || 'Anonymous', email, amount: parseFloat(amount), date: new Date().toISOString() });
        setSuccess(true);
        setAmount(''); setDonorName(''); setEmail('');
        setTimeout(() => setSuccess(false), 5000);
    }

    return (
        <div className="container mx-auto p-6 animate-fade-in flex items-center justify-center min-h-[60vh]">
           <div className="bg-white w-full max-w-lg p-8 rounded-2xl shadow-xl">
                <h2 className="text-3xl font-bold text-center text-slate-800 mb-2">Give Generously</h2>
                <p className="text-center text-slate-500 mb-8">Support the 1000 Micro Church Network.</p>
                {success ? (
                    <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-xl text-center">
                        <h3 className="text-xl font-bold mb-2">Thank You!</h3>
                        <p>Your donation has been recorded.</p>
                    </div>
                ) : (
                    <form onSubmit={submitDonation} className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            {['25', '50', '100'].map(val => (
                                <button type="button" key={val} onClick={() => setAmount(val)} className={`py-3 rounded-lg border font-bold ${amount === val ? 'bg-primary-600 text-white border-primary-600' : 'border-slate-200 text-slate-600 hover:border-primary-500'}`}>
                                    ${val}
                                </button>
                            ))}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Custom Amount</label>
                            <div className="relative"><span className="absolute left-3 top-2 text-slate-500">$</span><input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="pl-8 w-full border border-slate-300 rounded p-2" /></div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name (Optional)</label>
                            <input value={donorName} onChange={e=>setDonorName(e.target.value)} className="w-full border border-slate-300 rounded p-2" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                            <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="w-full border border-slate-300 rounded p-2" />
                        </div>
                        <button className="w-full bg-slate-800 text-white py-3 rounded-lg font-bold hover:bg-slate-900 shadow-lg">Process Secure Donation</button>
                    </form>
                )}
           </div>
        </div>
    );
};

const AdminPage = (props: any) => {
    const { userRole, handleLogin, prayers, setPrayers, sermons, setSermons, events, setEvents, meetings, setMeetings, donations, verse, setVerse } = props;
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'SM' | 'EV' | 'MT' | 'PR' | 'DN' | 'SET'>('SM');

    const [newSermon, setNewSermon] = useState<Partial<Sermon>>({});
    const [newEvent, setNewEvent] = useState<Partial<Event>>({});
    const [newMeeting, setNewMeeting] = useState<Partial<Meeting>>({});
    const [newVerse, setNewVerse] = useState({text: verse?.text || '', ref: verse?.ref || ''});

    const handleAuth = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === '12345678') { handleLogin(UserRole.ADMIN); setError(''); } 
        else { setError('Invalid Password'); }
    };

    if (!userRole) {
        return (
            <div className="flex items-center justify-center h-[80vh] bg-slate-50">
                <form onSubmit={handleAuth} className="bg-white p-8 rounded-xl shadow-lg w-96">
                    <h2 className="text-2xl font-bold mb-6 text-center">Staff Login</h2>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-slate-300 rounded p-3 mb-4" placeholder="Enter Password" />
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    <button className="w-full bg-primary-600 text-white py-3 rounded font-bold">Login</button>
                </form>
            </div>
        );
    }
    
    const approvePrayer = (id: string) => setPrayers(prayers.map((p: PrayerRequest) => p.id === id ? { ...p, status: 'APPROVED' } : p));
    const deletePrayer = (id: string) => setPrayers(prayers.filter((p: PrayerRequest) => p.id !== id));
    const addSermon = (e: React.FormEvent) => {
        e.preventDefault(); if (!newSermon.title) return;
        setSermons([{ id: Date.now().toString(), title: newSermon.title!, speaker: newSermon.speaker || 'TBD', date: newSermon.date || new Date().toLocaleDateString(), description: newSermon.description || '', imageUrl: newSermon.imageUrl || `https://picsum.photos/400/250?random=${Date.now()}`, videoUrl: newSermon.videoUrl }, ...sermons]);
        setNewSermon({});
    };
    const deleteSermon = (id: string) => setSermons(sermons.filter((s: Sermon) => s.id !== id));
    const addEvent = (e: React.FormEvent) => {
        e.preventDefault(); if (!newEvent.title) return;
        setEvents([{ id: Date.now().toString(), title: newEvent.title!, date: newEvent.date || 'TBD', location: newEvent.location || 'Online', description: newEvent.description || '' }, ...events]);
        setNewEvent({});
    };
    const deleteEvent = (id: string) => setEvents(events.filter((e: Event) => e.id !== id));
    const addMeeting = (e: React.FormEvent) => {
        e.preventDefault(); if (!newMeeting.title) return;
        setMeetings([{ id: Date.now().toString(), title: newMeeting.title!, host: newMeeting.host || 'Admin', startTime: newMeeting.startTime || 'TBD', description: newMeeting.description || '', participants: 0 }, ...meetings]);
        setNewMeeting({});
    };
    const deleteMeeting = (id: string) => setMeetings(meetings.filter((m: Meeting) => m.id !== id));
    const updateVerse = () => { setVerse({ text: newVerse.text, ref: newVerse.ref }); alert("Verse updated!"); };
    
    return (
        <div className="container mx-auto p-6 pb-20">
            <h2 className="text-3xl font-bold text-slate-800 mb-8">Admin Dashboard</h2>
            <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/4"><div className="space-y-2 sticky top-24">
                    {(['SM', 'EV', 'MT', 'PR', 'DN', 'SET'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-left px-4 py-2 rounded text-sm font-bold ${activeTab === tab ? 'bg-primary-600 text-white' : 'bg-white hover:bg-slate-50'}`}>
                            {tab === 'PR' ? 'Prayers' : tab === 'SM' ? 'Sermons' : tab === 'EV' ? 'Events' : tab === 'MT' ? 'Meetings' : tab === 'DN' ? 'Donations' : 'Settings'}
                        </button>
                    ))}
                </div></div>
                <div className="md:w-3/4">
                {activeTab === 'SM' && <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow p-6">
                        <h3 className="font-bold text-xl mb-4">Add Sermon</h3>
                        <form onSubmit={addSermon} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input placeholder="Title" value={newSermon.title || ''} onChange={e => setNewSermon({...newSermon, title: e.target.value})} className="w-full border p-2 rounded text-sm" />
                            <input placeholder="Speaker" value={newSermon.speaker || ''} onChange={e => setNewSermon({...newSermon, speaker: e.target.value})} className="w-full border p-2 rounded text-sm" />
                            <input placeholder="Date" value={newSermon.date || ''} onChange={e => setNewSermon({...newSermon, date: e.target.value})} className="w-full border p-2 rounded text-sm" />
                            <input placeholder="Image URL" value={newSermon.imageUrl || ''} onChange={e => setNewSermon({...newSermon, imageUrl: e.target.value})} className="w-full border p-2 rounded text-sm" />
                            <input placeholder="Video URL (e.g. YouTube)" value={newSermon.videoUrl || ''} onChange={e => setNewSermon({...newSermon, videoUrl: e.target.value})} className="w-full border p-2 rounded text-sm md:col-span-2" />
                            <textarea placeholder="Description" value={newSermon.description || ''} onChange={e => setNewSermon({...newSermon, description: e.target.value})} className="w-full border p-2 rounded text-sm md:col-span-2" />
                            <button className="w-full bg-primary-600 text-white py-2 rounded font-bold md:col-span-2">Publish Sermon</button>
                        </form>
                    </div>
                    {sermons.map((s: Sermon) => <div key={s.id} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center"><div><p className="font-bold">{s.title}</p><p className="text-xs text-slate-500">{s.speaker} | {s.date}</p></div><button onClick={() => deleteSermon(s.id)} className="text-red-500 p-2"><IconTrash className="w-4 h-4" /></button></div>)}
                </div>}

                {activeTab === 'EV' && <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow p-6"><h3 className="font-bold text-xl mb-4">Add Event</h3>
                        <form onSubmit={addEvent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input placeholder="Title" value={newEvent.title || ''} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full border p-2 rounded text-sm" />
                            <input placeholder="Date" value={newEvent.date || ''} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full border p-2 rounded text-sm" />
                            <input placeholder="Location" value={newEvent.location || ''} onChange={e => setNewEvent({...newEvent, location: e.target.value})} className="w-full border p-2 rounded text-sm md:col-span-2" />
                            <textarea placeholder="Description" value={newEvent.description || ''} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="w-full border p-2 rounded text-sm md:col-span-2" />
                            <button className="w-full bg-primary-600 text-white py-2 rounded font-bold md:col-span-2">Create Event</button>
                        </form>
                    </div>
                    {events.map((e: Event) => <div key={e.id} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center"><div><p className="font-bold">{e.title}</p><p className="text-xs text-slate-500">{e.location} | {e.date}</p></div><button onClick={() => deleteEvent(e.id)} className="text-red-500 p-2"><IconTrash className="w-4 h-4" /></button></div>)}
                </div>}

                {activeTab === 'MT' && <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow p-6"><h3 className="font-bold text-xl mb-4">Schedule Meeting</h3>
                        <form onSubmit={addMeeting} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <input placeholder="Title" value={newMeeting.title || ''} onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} className="w-full border p-2 rounded text-sm" />
                           <input placeholder="Host Name" value={newMeeting.host || ''} onChange={e => setNewMeeting({...newMeeting, host: e.target.value})} className="w-full border p-2 rounded text-sm" />
                           <input placeholder="Start Time" value={newMeeting.startTime || ''} onChange={e => setNewMeeting({...newMeeting, startTime: e.target.value})} className="w-full border p-2 rounded text-sm md:col-span-2" />
                           <textarea placeholder="Description" value={newMeeting.description || ''} onChange={e => setNewMeeting({...newMeeting, description: e.target.value})} className="w-full border p-2 rounded text-sm md:col-span-2" />
                           <button className="w-full bg-primary-600 text-white py-2 rounded font-bold md:col-span-2">Schedule</button>
                        </form>
                    </div>
                    {meetings.map((m: Meeting) => <div key={m.id} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center"><div><p className="font-bold">{m.title}</p><p className="text-xs text-slate-500">Host: {m.host} | {m.startTime}</p></div><button onClick={() => deleteMeeting(m.id)} className="text-red-500 p-2"><IconTrash className="w-4 h-4" /></button></div>)}
                </div>}

                {activeTab === 'PR' && <div className="bg-white rounded-xl shadow overflow-hidden"><div className="p-4 border-b"><h3 className="font-bold">Prayer Requests</h3></div><table className="w-full text-sm">
                    <thead className="bg-slate-100 uppercase"><tr><th className="p-4 text-left">Name</th><th className="p-4 text-left">Content</th><th className="p-4 text-left">Status</th><th className="p-4 text-left">Action</th></tr></thead>
                    <tbody>{prayers.map((p: PrayerRequest) => <tr key={p.id} className="border-t"><td className="p-4">{p.name}</td><td className="p-4 max-w-xs truncate">{p.content}</td><td className="p-4"><span className={`px-2 py-1 rounded text-xs ${p.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status}</span></td><td className="p-4 flex gap-2">{p.status === 'PENDING' && <button onClick={() => approvePrayer(p.id)}>Approve</button>}<button onClick={() => deletePrayer(p.id)}>Delete</button></td></tr>)}</tbody>
                </table></div>}

                 {activeTab === 'DN' && <div className="bg-white rounded-xl shadow overflow-hidden"><div className="p-4 border-b"><h3 className="font-bold">Donations</h3></div><table className="w-full text-sm">
                    <thead className="bg-slate-50 uppercase"><tr><th className="p-4 text-left">Date</th><th className="p-4 text-left">Name</th><th className="p-4 text-left">Amount</th></tr></thead><tbody>{donations.map((d: Donation) => <tr key={d.id} className="border-t"><td className="p-4">{new Date(d.date).toLocaleDateString()}</td><td className="p-4">{d.name}</td><td className="p-4 font-bold">${d.amount}</td></tr>)}</tbody>
                 </table></div>}

                {activeTab === 'SET' && <div className="bg-white rounded-xl shadow p-6 space-y-6">
                    <div><h3 className="font-bold mb-2">Verse of the Day</h3><textarea className="w-full border rounded p-2 text-sm" value={newVerse.text} onChange={(e) => setNewVerse({...newVerse, text: e.target.value})} /><input className="w-full border rounded p-2 text-sm mt-2" placeholder="Reference" value={newVerse.ref} onChange={(e) => setNewVerse({...newVerse, ref: e.target.value})} /><button onClick={updateVerse} className="mt-2 bg-primary-600 text-white px-4 py-2 rounded text-sm font-bold">Save Verse</button></div>
                    <div className="pt-6 border-t"><h4 className="font-bold mb-2">Development Tools</h4><div className="flex gap-2">
                        <button onClick={async () => setSermons(await seedSermons())} className="bg-slate-200 px-3 py-1 rounded text-xs">Seed Sermons</button>
                        <button onClick={async () => setEvents(await seedEvents())} className="bg-slate-200 px-3 py-1 rounded text-xs">Seed Events</button>
                    </div></div>
                </div>}
                </div>
            </div>
        </div>
    );
};

const SearchPage = ({ sermons, events, meetings, setPage }: { sermons: Sermon[], events: Event[], meetings: Meeting[], setPage: (page: Page) => void }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const results = !searchQuery ? [] : [...sermons.map(s => ({...s, type: 'SERMON' as const})), ...events.map(e => ({...e, type: 'EVENT' as const})), ...meetings.map(m => ({...m, type: 'MEETING' as const, description: `Host: ${m.host}`}))]
        .map(item => ({...item, score: (item.title.toLowerCase().includes(searchQuery.toLowerCase()) ? 2 : 0) + (item.description.toLowerCase().includes(searchQuery.toLowerCase()) ? 1 : 0)}))
        .filter(item => item.score > 0).sort((a,b) => b.score - a.score);

    return (
        <div className="container mx-auto p-6 pb-20 max-w-3xl">
            <div className="relative mb-8">
                <IconSearch className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                <input autoFocus type="text" placeholder="Search sermons, events, meetings..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 text-lg border rounded-xl" />
            </div>
            <div className="space-y-4">{results.map(r => (
                <div key={`${r.type}-${r.id}`} className="bg-white p-4 rounded-lg shadow-sm" onClick={() => { if (r.type === 'SERMON') setPage(Page.SERMONS); if (r.type === 'EVENT') setPage(Page.EVENTS); if (r.type === 'MEETING') setPage(Page.MEETINGS);}}>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded mb-1 inline-block ${r.type === 'SERMON' ? 'bg-blue-100 text-blue-700' : r.type === 'EVENT' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{r.type}</span>
                    <h3 className="font-bold text-lg">{r.title}</h3>
                    <p className="text-slate-600 text-sm">{r.description}</p>
                </div>
            ))}</div>
        </div>
    );
};

// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [verse, setVerse] = useStickyState<{text: string, ref: string} | null>('verse', null);
  
  const [sermons, setSermons] = useStickyState<Sermon[]>('sermons', []);
  const [events, setEvents] = useStickyState<Event[]>('events', []);
  const [meetings, setMeetings] = useStickyState<Meeting[]>('meetings', []);
  const [prayers, setPrayers] = useStickyState<PrayerRequest[]>('prayers', []);
  const [donations, setDonations] = useStickyState<Donation[]>('donations', []);
  const [videoModal, setVideoModal] = useState<{open: boolean, url: string | null}>({open: false, url: null});

  useEffect(() => {
    if (!verse) getVerseOfDay().then(v => setVerse({ text: v.verse, ref: v.reference }));
  }, []); // eslint-disable-line

  const handlePrayerSubmit = async (name: string, content: string) => {
    const newPrayer: PrayerRequest = { id: Date.now().toString(), name, content, status: 'PENDING', date: new Date().toISOString() };
    setPrayers(prev => [newPrayer, ...prev]);
    const response = await generatePrayerResponse(content);
    setPrayers(prev => prev.map(p => p.id === newPrayer.id ? { ...p, aiResponse: response } : p));
  };

  const handleDonation = (d: Donation) => setDonations(prev => [...prev, d]);
  const handleLogin = (role: UserRole) => { setUserRole(role); setCurrentPage(Page.ADMIN); };
  const openVideoModal = (url: string) => {
      // Basic URL transformation for YouTube embeds
      const videoId = url.includes('youtu.be') ? url.split('/').pop() : new URL(url).searchParams.get('v');
      setVideoModal({ open: true, url: `https://www.youtube.com/embed/${videoId}` });
  }

  const pageProps = {
    [Page.HOME]: { verse, setPage: setCurrentPage },
    [Page.SERMONS]: { sermons, openVideoModal },
    [Page.EVENTS]: { events },
    [Page.MEETINGS]: { meetings },
    [Page.PRAYER]: { prayers, handlePrayerSubmit },
    [Page.GIVING]: { handleDonation },
    [Page.ADMIN]: { userRole, handleLogin, prayers, setPrayers, sermons, setSermons, events, setEvents, meetings, setMeetings, donations, verse, setVerse },
    [Page.SEARCH]: { sermons, events, meetings, setPage: setCurrentPage },
  };

  const renderPage = () => {
    if (currentPage === Page.HOME) return <HomePage {...pageProps[Page.HOME]} />;
    if (currentPage === Page.SERMONS) return <SermonsPage {...pageProps[Page.SERMONS]} />;
    if (currentPage === Page.EVENTS) return <EventsPage {...pageProps[Page.EVENTS]} />;
    if (currentPage === Page.MEETINGS) return <Meetings {...pageProps[Page.MEETINGS]} />;
    if (currentPage === Page.PRAYER) return <PrayerPage {...pageProps[Page.PRAYER]} />;
    if (currentPage === Page.GIVING) return <GivingPage {...pageProps[Page.GIVING]} />;
    if (currentPage === Page.ADMIN) return <AdminPage {...pageProps[Page.ADMIN]} />;
    if (currentPage === Page.SEARCH) return <SearchPage {...pageProps[Page.SEARCH]} />;
    return <HomePage {...pageProps[Page.HOME]} />;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <Navigation activePage={currentPage} setPage={setCurrentPage} role={userRole} onLogout={() => setUserRole(null)} />
      <main className="pb-20 md:pb-0">{renderPage()}</main>

      {videoModal.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center animate-fade-in" onClick={() => setVideoModal({open: false, url: null})}>
            <div className="bg-slate-900 p-4 rounded-xl shadow-2xl w-full max-w-4xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-end mb-2">
                    <button onClick={() => setVideoModal({open: false, url: null})} className="text-slate-400 hover:text-white"><IconX/></button>
                </div>
                <div className="aspect-video">
                    <iframe className="w-full h-full rounded-lg" src={videoModal.url || ''} title="Sermon Video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;