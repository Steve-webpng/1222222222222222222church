import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import { Page, UserRole, Sermon, Event, PrayerRequest, Donation } from './types';
import { getVerseOfDay, seedSermons, seedEvents, generatePrayerResponse } from './services/geminiService';
import Meetings from './pages/Meetings';
import { IconSearch } from './components/Icons';

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

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [verse, setVerse] = useState<{text: string, ref: string} | null>(null);
  
  // Data States
  const [sermons, setSermons] = useStickyState<Sermon[]>('sermons', []);
  const [events, setEvents] = useStickyState<Event[]>('events', []);
  const [prayers, setPrayers] = useStickyState<PrayerRequest[]>('prayers', []);
  const [donations, setDonations] = useStickyState<Donation[]>('donations', []);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize Data
  useEffect(() => {
    const initData = async () => {
      const v = await getVerseOfDay();
      setVerse({ text: v.verse, ref: v.reference });

      if (sermons.length === 0) {
        const newSermons = await seedSermons();
        setSermons(newSermons);
      }
      if (events.length === 0) {
        const newEvents = await seedEvents();
        setEvents(newEvents);
      }
    };
    initData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handlers
  const handlePrayerSubmit = async (name: string, content: string) => {
    const newPrayer: PrayerRequest = {
      id: Date.now().toString(),
      name,
      content,
      status: 'PENDING',
      date: new Date().toISOString()
    };
    // Optimistic update
    setPrayers(prev => [newPrayer, ...prev]);
    
    // Get AI Response
    const response = await generatePrayerResponse(content);
    setPrayers(prev => prev.map(p => p.id === newPrayer.id ? { ...p, aiResponse: response } : p));
  };

  const handleDonation = (d: Donation) => {
    setDonations(prev => [...prev, d]);
  };

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    setCurrentPage(Page.ADMIN);
  };

  // Search Logic
  const getSearchResults = () => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    
    const sResults = sermons.map(s => ({
      id: s.id, type: 'SERMON', title: s.title, description: s.description,
      score: (s.title.toLowerCase().includes(q) ? 2 : 0) + (s.description.toLowerCase().includes(q) ? 1 : 0)
    }));
    
    const eResults = events.map(e => ({
      id: e.id, type: 'EVENT', title: e.title, description: e.description,
      score: (e.title.toLowerCase().includes(q) ? 2 : 0) + (e.description.toLowerCase().includes(q) ? 1 : 0)
    }));

    return [...sResults, ...eResults].filter(r => r.score > 0).sort((a, b) => b.score - a.score);
  };

  // --- PAGE RENDERERS ---

  const renderHome = () => (
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
         <div onClick={() => setCurrentPage(Page.SERMONS)} className="cursor-pointer bg-white p-6 rounded-xl shadow hover:shadow-lg transition border-t-4 border-blue-500">
            <h3 className="text-xl font-bold mb-2">Latest Sermons</h3>
            <p className="text-slate-600">Catch up on the latest teachings from our network pastors.</p>
         </div>
         <div onClick={() => setCurrentPage(Page.EVENTS)} className="cursor-pointer bg-white p-6 rounded-xl shadow hover:shadow-lg transition border-t-4 border-green-500">
            <h3 className="text-xl font-bold mb-2">Upcoming Events</h3>
            <p className="text-slate-600">Join us for fellowship, worship nights, and community outreach.</p>
         </div>
         <div onClick={() => setCurrentPage(Page.PRAYER)} className="cursor-pointer bg-white p-6 rounded-xl shadow hover:shadow-lg transition border-t-4 border-purple-500">
            <h3 className="text-xl font-bold mb-2">Prayer Wall</h3>
            <p className="text-slate-600">Share your burdens and let the community pray for you.</p>
         </div>
      </div>
    </div>
  );

  const renderSermons = () => (
    <div className="container mx-auto p-6 animate-fade-in pb-20">
      <h2 className="text-3xl font-bold text-slate-800 mb-6">Sermon Library</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sermons.map(sermon => (
          <div key={sermon.id} className="bg-white rounded-xl shadow overflow-hidden flex flex-col h-full">
            <img src={sermon.imageUrl} alt={sermon.title} className="w-full h-48 object-cover" />
            <div className="p-6 flex-1 flex flex-col">
              <span className="text-xs font-bold text-primary-600 mb-2">{sermon.date}</span>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{sermon.title}</h3>
              <p className="text-slate-500 text-sm mb-4">{sermon.speaker}</p>
              <p className="text-slate-600 text-sm flex-1 line-clamp-3">{sermon.description}</p>
              <button className="mt-4 w-full bg-slate-100 text-slate-700 py-2 rounded hover:bg-slate-200 font-medium">
                Watch / Listen
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="container mx-auto p-6 animate-fade-in pb-20 max-w-4xl">
      <h2 className="text-3xl font-bold text-slate-800 mb-6">Community Events</h2>
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
            <button className="bg-white border-2 border-primary-600 text-primary-600 px-6 py-2 rounded-full font-semibold hover:bg-primary-50 transition">
               RSVP
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPrayer = () => {
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
        {/* Left: Form */}
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

        {/* Right: Wall */}
        <div className="md:col-span-2 space-y-6">
           <h2 className="text-2xl font-bold text-slate-800">Community Prayer Wall</h2>
           {prayers.length === 0 && <p className="text-slate-500 italic">No prayer requests yet. Be the first.</p>}
           
           {/* Show User's Pending Requests immediately for feedback */}
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

  const renderGiving = () => {
    const [amount, setAmount] = useState('50');
    const [donorName, setDonorName] = useState('');
    const [email, setEmail] = useState('');
    const [success, setSuccess] = useState(false);

    const submitDonation = (e: React.FormEvent) => {
        e.preventDefault();
        handleDonation({ id: Date.now().toString(), name: donorName || 'Anonymous', email, amount: parseFloat(amount), date: new Date().toISOString() });
        setSuccess(true);
        setAmount('');
        setDonorName('');
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
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-slate-500">$</span>
                                <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="pl-8 w-full border border-slate-300 rounded p-2" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name (Optional)</label>
                            <input value={donorName} onChange={e=>setDonorName(e.target.value)} className="w-full border border-slate-300 rounded p-2" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                            <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="w-full border border-slate-300 rounded p-2" />
                        </div>
                        <button className="w-full bg-slate-800 text-white py-3 rounded-lg font-bold hover:bg-slate-900 shadow-lg">
                            Process Secure Donation
                        </button>
                    </form>
                )}
           </div>
        </div>
    );
  };

  const renderAdmin = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'PR' | 'SM' | 'DN'>('PR');

    const handleAuth = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === '12345678') {
            handleLogin(UserRole.ADMIN); // Default to Admin for this demo
            setError('');
        } else {
            setError('Invalid Password');
        }
    };

    if (!userRole) {
        return (
            <div className="flex items-center justify-center h-[80vh] bg-slate-50">
                <form onSubmit={handleAuth} className="bg-white p-8 rounded-xl shadow-lg w-96">
                    <h2 className="text-2xl font-bold mb-6 text-center">Staff Login</h2>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        className="w-full border border-slate-300 rounded p-3 mb-4" 
                        placeholder="Enter Password" 
                    />
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    <button className="w-full bg-primary-600 text-white py-3 rounded font-bold">Login</button>
                    <p className="text-xs text-center mt-4 text-slate-400">Hint: 12345678</p>
                </form>
            </div>
        );
    }

    // Helpers
    const approvePrayer = (id: string) => {
        setPrayers(prev => prev.map(p => p.id === id ? { ...p, status: 'APPROVED' } : p));
    };

    const deletePrayer = (id: string) => {
        setPrayers(prev => prev.filter(p => p.id !== id));
    };

    const exportCSV = (data: any[], filename: string) => {
        const headers = Object.keys(data[0] || {}).join(',');
        const rows = data.map(obj => Object.values(obj).join(',')).join('\n');
        const csv = `${headers}\n${rows}`;
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
    };

    return (
        <div className="container mx-auto p-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800">Dashboard</h2>
                <div className="flex gap-2 mt-4 md:mt-0">
                    <button onClick={() => setActiveTab('PR')} className={`px-4 py-2 rounded ${activeTab === 'PR' ? 'bg-primary-600 text-white' : 'bg-white'}`}>Prayers</button>
                    <button onClick={() => setActiveTab('SM')} className={`px-4 py-2 rounded ${activeTab === 'SM' ? 'bg-primary-600 text-white' : 'bg-white'}`}>Sermons</button>
                    <button onClick={() => setActiveTab('DN')} className={`px-4 py-2 rounded ${activeTab === 'DN' ? 'bg-primary-600 text-white' : 'bg-white'}`}>Donations</button>
                </div>
            </div>

            {activeTab === 'PR' && (
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="p-4 border-b flex justify-between items-center">
                        <h3 className="font-bold">Prayer Requests</h3>
                        <button onClick={() => exportCSV(prayers, 'prayers.csv')} className="text-sm text-primary-600 hover:underline">Export CSV</button>
                    </div>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Content</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {prayers.map(p => (
                                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                                    <td className="p-4">{new Date(p.date).toLocaleDateString()}</td>
                                    <td className="p-4 font-medium">{p.name}</td>
                                    <td className="p-4 max-w-xs truncate">{p.content}</td>
                                    <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${p.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status}</span></td>
                                    <td className="p-4 flex gap-2">
                                        {p.status === 'PENDING' && <button onClick={() => approvePrayer(p.id)} className="text-green-600 font-bold">Approve</button>}
                                        <button onClick={() => deletePrayer(p.id)} className="text-red-500">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'DN' && (
                 <div className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="p-4 border-b flex justify-between items-center">
                        <h3 className="font-bold">Donations</h3>
                        <button onClick={() => exportCSV(donations, 'donations.csv')} className="text-sm text-primary-600 hover:underline">Export CSV</button>
                    </div>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {donations.map(d => (
                                <tr key={d.id} className="border-t border-slate-100">
                                    <td className="p-4">{new Date(d.date).toLocaleDateString()}</td>
                                    <td className="p-4">{d.name}</td>
                                    <td className="p-4">{d.email}</td>
                                    <td className="p-4 font-bold">${d.amount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            )}

            {activeTab === 'SM' && (
                <div className="p-8 text-center text-slate-500">
                    Sermon management works similarly to Prayers (CRUD). Seeded by Gemini.
                    <div className="mt-4">
                        <button onClick={() => exportCSV(sermons, 'sermons.csv')} className="bg-slate-200 px-4 py-2 rounded">Export Sermons</button>
                    </div>
                </div>
            )}
        </div>
    );
  };

  const renderSearch = () => {
      const results = getSearchResults();

      return (
          <div className="container mx-auto p-6 pb-20 max-w-3xl">
              <div className="relative mb-8">
                  <IconSearch className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                  <input 
                     autoFocus
                     type="text" 
                     placeholder="Search sermons, events..." 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full pl-12 pr-4 py-3 text-lg border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
              </div>

              <div className="space-y-4">
                  {results.length === 0 && searchQuery && <p className="text-center text-slate-500">No results found.</p>}
                  
                  {results.map(r => (
                      <div key={r.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 hover:border-primary-300 transition cursor-pointer" onClick={() => setCurrentPage(r.type === 'SERMON' ? Page.SERMONS : Page.EVENTS)}>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded mb-1 inline-block ${r.type === 'SERMON' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                              {r.type}
                          </span>
                          <h3 className="font-bold text-lg text-slate-800">{r.title}</h3>
                          <p className="text-slate-600 text-sm line-clamp-2">{r.description}</p>
                      </div>
                  ))}
              </div>
          </div>
      )
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <Navigation 
        activePage={currentPage} 
        setPage={setCurrentPage} 
        role={userRole} 
        onLogout={() => setUserRole(null)} 
      />
      
      <main className="pb-20 md:pb-0">
        {currentPage === Page.HOME && renderHome()}
        {currentPage === Page.SERMONS && renderSermons()}
        {currentPage === Page.EVENTS && renderEvents()}
        {currentPage === Page.MEETINGS && <Meetings userName={userRole ? 'Admin Host' : 'Guest User'} />}
        {currentPage === Page.PRAYER && renderPrayer()}
        {currentPage === Page.GIVING && renderGiving()}
        {currentPage === Page.ADMIN && renderAdmin()}
        {currentPage === Page.SEARCH && renderSearch()}
      </main>
    </div>
  );
};

export default App;