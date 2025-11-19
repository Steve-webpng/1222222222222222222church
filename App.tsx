import React, { useState, useEffect, useRef } from 'react';
import Navigation from './components/Navigation';
import { Page, UserRole, Sermon, Event, PrayerRequest, Meeting, SlideshowImage } from './types';
import { getVerseOfDay, seedSermons, seedEvents, generatePrayerResponse } from './services/geminiService';
import Meetings from './pages/Meetings';
import { IconSearch, IconTrash, IconPlus, IconX, IconMapPin, IconChevronLeft, IconChevronRight, IconShare, IconArrowUp, IconList, IconCalendar, IconChartBar, IconLoader, IconArrowLeft } from './components/Icons';

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

const HomePage = ({ verse, setPage, slideshowImages, verseLoading }: { verse: { text: string; ref: string } | null, setPage: (page: Page) => void, slideshowImages: SlideshowImage[], verseLoading: boolean }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const prevSlide = () => setCurrentIndex(i => (i === 0 ? slideshowImages.length - 1 : i - 1));
    const nextSlide = () => {
        if (slideshowImages.length > 0) {
            setCurrentIndex(i => (i === slideshowImages.length - 1 ? 0 : i + 1));
        }
    };
    
    useEffect(() => {
        if (slideshowImages.length > 1) {
            const timer = setTimeout(nextSlide, 5000);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, slideshowImages.length]);

    return (
        <div className="animate-fade-in">
          {slideshowImages.length > 0 ? (
            <div className="relative w-full h-[60vh] overflow-hidden bg-slate-900 shadow-lg md:rounded-b-3xl">
                {slideshowImages.map((slide, slideIndex) => (
                    <div key={slide.id} className={`absolute top-0 left-0 w-full h-full transition-opacity duration-1000 ${slideIndex === currentIndex ? 'opacity-100' : 'opacity-0'}`}>
                        <img src={slide.url} alt={slide.caption || 'Slideshow image'} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 p-8 md:p-12 text-white">
                            <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">{slide.caption || 'Welcome Home'}</h1>
                            <p className="text-lg md:text-xl opacity-90 max-w-2xl drop-shadow-md">Connecting 1000 micro churches across the globe.</p>
                        </div>
                    </div>
                ))}
                {slideshowImages.length > 1 && (
                    <>
                        <button onClick={prevSlide} className="absolute top-1/2 left-4 -translate-y-1/2 bg-black/40 p-2 rounded-full text-white hover:bg-black/60 transition z-10"><IconChevronLeft className="w-6 h-6" /></button>
                        <button onClick={nextSlide} className="absolute top-1/2 right-4 -translate-y-1/2 bg-black/40 p-2 rounded-full text-white hover:bg-black/60 transition z-10"><IconChevronRight className="w-6 h-6" /></button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {slideshowImages.map((_, i) => <div key={i} onClick={() => setCurrentIndex(i)} className={`w-2 h-2 rounded-full cursor-pointer transition ${i === currentIndex ? 'bg-white' : 'bg-white/50'}`}></div>)}
                        </div>
                    </>
                )}
            </div>
          ) : (
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-20 px-6 text-center md:rounded-b-3xl shadow-lg">
                <h1 className="text-4xl md:text-6xl font-bold mb-4">Welcome Home</h1>
                <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">Connecting 1000 micro churches across the globe in one unified digital spirit.</p>
            </div>
          )}

          <div className="container mx-auto px-6 -mt-16 md:-mt-10">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-md text-center max-w-3xl mx-auto relative z-10">
              <h2 className="text-primary-600 dark:text-primary-500 font-bold tracking-wider uppercase text-xs mb-2">Verse of the Day</h2>
              {verseLoading ? <div className="animate-pulse h-10 bg-slate-100 dark:bg-slate-700 rounded w-3/4 mx-auto"></div> : verse ? (
                 <>
                    <blockquote className="text-xl md:text-2xl font-serif text-slate-700 dark:text-slate-200 italic mb-4">"{verse.text}"</blockquote>
                    <cite className="text-slate-500 dark:text-slate-400 font-semibold not-italic">— {verse.ref}</cite>
                 </>
              ) : <p className="text-slate-500">Could not load verse.</p>}
            </div>
          </div>
          <div className="container mx-auto px-6 py-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
             <div onClick={() => setPage(Page.SERMONS)} className="cursor-pointer bg-white dark:bg-slate-800 p-6 rounded-xl shadow hover:shadow-lg transition border-t-4 border-primary-500">
                <h3 className="text-xl font-bold mb-2 dark:text-slate-100">Latest Sermons</h3>
                <p className="text-slate-600 dark:text-slate-300">Catch up on the latest teachings from our network pastors.</p>
             </div>
             <div onClick={() => setPage(Page.EVENTS)} className="cursor-pointer bg-white dark:bg-slate-800 p-6 rounded-xl shadow hover:shadow-lg transition border-t-4 border-primary-500">
                <h3 className="text-xl font-bold mb-2 dark:text-slate-100">Upcoming Events</h3>
                <p className="text-slate-600 dark:text-slate-300">Join us for fellowship, worship nights, and community outreach.</p>
             </div>
             <div onClick={() => setPage(Page.PRAYER)} className="cursor-pointer bg-white dark:bg-slate-800 p-6 rounded-xl shadow hover:shadow-lg transition border-t-4 border-primary-500">
                <h3 className="text-xl font-bold mb-2 dark:text-slate-100">Prayer Wall</h3>
                <p className="text-slate-600 dark:text-slate-300">Share your burdens and let the community pray for you.</p>
             </div>
          </div>
        </div>
    );
};


const SermonsPage = ({ sermons, openVideoModal, handleShare }: { sermons: Sermon[], openVideoModal: (url: string) => void, handleShare: (title: string, text: string, url: string) => void }) => {
    const [filterSeries, setFilterSeries] = useState('All');
    const [filterSpeaker, setFilterSpeaker] = useState('All');
    
    const seriesOptions = ['All', ...Array.from(new Set(sermons.map(s => s.series).filter(Boolean)))];
    const speakerOptions = ['All', ...Array.from(new Set(sermons.map(s => s.speaker)))];
    
    const filteredSermons = sermons.filter(sermon => {
        const seriesMatch = filterSeries === 'All' || sermon.series === filterSeries;
        const speakerMatch = filterSpeaker === 'All' || sermon.speaker === filterSpeaker;
        return seriesMatch && speakerMatch;
    });

    return (
        <div className="container mx-auto p-6 animate-fade-in pb-20">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6">Sermon Library</h2>
            <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border dark:border-slate-700">
                <select value={filterSeries} onChange={e => setFilterSeries(e.target.value)} className="w-full md:w-1/2 bg-slate-100 dark:bg-slate-700 border-none rounded-lg p-2 text-sm">
                    {seriesOptions.map(s => <option key={s}>{s}</option>)}
                </select>
                <select value={filterSpeaker} onChange={e => setFilterSpeaker(e.target.value)} className="w-full md:w-1/2 bg-slate-100 dark:bg-slate-700 border-none rounded-lg p-2 text-sm">
                    {speakerOptions.map(s => <option key={s}>{s}</option>)}
                </select>
            </div>
            {filteredSermons.length === 0 ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-10">No sermons match your criteria.</p>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSermons.map(sermon => (
                    <div key={sermon.id} className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden flex flex-col h-full group">
                    <img src={sermon.imageUrl} alt={sermon.title} className="w-full h-48 object-cover" />
                    <div className="p-6 flex-1 flex flex-col">
                        <span className="text-xs font-bold text-primary-600 dark:text-primary-500 mb-2">{sermon.date} {sermon.series && `• ${sermon.series}`}</span>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{sermon.title}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{sermon.speaker}</p>
                        <p className="text-slate-600 dark:text-slate-300 text-sm flex-1 line-clamp-3">{sermon.description}</p>
                        <div className="flex gap-2 mt-4">
                            <button onClick={() => handleShare(sermon.title, sermon.description, window.location.href)} className="w-12 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 py-2 rounded font-medium hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center">
                               <IconShare className="w-4 h-4" />
                            </button>
                            {sermon.videoUrl ? (
                                <button onClick={() => openVideoModal(sermon.videoUrl!)} className="flex-1 bg-primary-600 text-white py-2 rounded font-medium hover:bg-primary-700">
                                    Watch Now
                                </button>
                            ) : (
                                <button className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 py-2 rounded font-medium cursor-not-allowed">
                                    Video Unavailable
                                </button>
                            )}
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            )}
        </div>
    );
};
  
const EventsPage = ({ events, handleShare }: { events: Event[], handleShare: (title: string, text: string, url:string) => void }) => {
    const [view, setView] = useState<'list' | 'calendar'>('list');
    const [currentDate, setCurrentDate] = useState(new Date());

    const renderCalendar = () => {
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const days = Array.from({ length: firstDay }, () => null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
      
      const eventsByDay = events.reduce((acc, event) => {
        try {
          const eventDate = new Date(event.date);
          if (eventDate.getMonth() === month && eventDate.getFullYear() === year) {
            const day = eventDate.getDate();
            if (!acc[day]) acc[day] = [];
            acc[day].push(event);
          }
        } catch(e) { /* ignore invalid dates */ }
        return acc;
      }, {} as Record<number, Event[]>);

      return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => setCurrentDate(new Date(year, month - 1))}><IconChevronLeft className="w-5 h-5"/></button>
                <h3 className="font-bold text-lg">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => setCurrentDate(new Date(year, month + 1))}><IconChevronRight className="w-5 h-5"/></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 dark:text-slate-400 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {days.map((day, i) => (
                    <div key={i} className={`p-1 h-24 border dark:border-slate-700 rounded-md overflow-y-auto ${day ? '' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                        {day && <span className="font-bold text-sm">{day}</span>}
                        {day && eventsByDay[day] && eventsByDay[day].map(event => (
                            <div key={event.id} className="text-xs bg-primary-100 dark:bg-primary-700/50 p-1 rounded mt-1 truncate">{event.title}</div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
      );
    };

    return (
        <div className="container mx-auto p-6 animate-fade-in pb-20 max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Community Events</h2>
                <div className="flex gap-1 bg-slate-200 dark:bg-slate-700 p-1 rounded-lg">
                    <button onClick={() => setView('list')} className={`p-1 rounded ${view === 'list' ? 'bg-white dark:bg-slate-600' : ''}`}><IconList className="w-5 h-5" /></button>
                    <button onClick={() => setView('calendar')} className={`p-1 rounded ${view === 'calendar' ? 'bg-white dark:bg-slate-600' : ''}`}><IconCalendar className="w-5 h-5" /></button>
                </div>
            </div>

            {events.length === 0 ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-10">No events have been scheduled.</p>
            ) : view === 'list' ? (
            <div className="space-y-4">
                {events.map(event => (
                <div key={event.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm flex flex-col md:flex-row gap-6 items-start">
                    <div className="bg-primary-50 dark:bg-slate-700 text-primary-700 dark:text-primary-400 p-4 rounded-lg text-center min-w-[100px]">
                        <span className="block text-2xl font-bold">{new Date(event.date).toLocaleDateString(undefined, { day: 'numeric' })}</span>
                        <span className="text-xs uppercase tracking-wide">{new Date(event.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{event.title}</h3>
                        <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm mt-1 mb-3">
                            <span>📍 {event.location}</span>
                            <span className="mx-2">•</span>
                            <span>📅 {new Date(event.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">{event.description}</p>
                    </div>
                    <div className="flex gap-2">
                        {!event.location.toLowerCase().includes('online') &&
                            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`} target="_blank" rel="noopener noreferrer" className="bg-white dark:bg-slate-700 border-2 border-primary-600 text-primary-600 px-4 py-2 rounded-full font-semibold hover:bg-primary-50 dark:hover:bg-slate-600 transition flex items-center gap-2">
                                <IconMapPin className="w-4 h-4" /> Map
                            </a>
                        }
                        <button onClick={() => handleShare(event.title, `${event.description}\n📅 ${event.date}\n📍 ${event.location}`, window.location.href)} className="bg-primary-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-primary-700 transition flex items-center gap-2">
                            <IconShare className="w-4 h-4" /> Share
                        </button>
                    </div>
                </div>
                ))}
            </div>
            ) : renderCalendar()}
        </div>
    );
};

const PrayerPage = ({ prayers, handlePrayerSubmit, setPrayers, addToast }: { prayers: PrayerRequest[], handlePrayerSubmit: (name: string, content: string) => void, setPrayers: React.Dispatch<React.SetStateAction<PrayerRequest[]>>, addToast: (msg: string) => void }) => {
    const [name, setName] = useState('');
    const [content, setContent] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [prayedFor, setPrayedFor] = useStickyState<string[]>('prayedForIds', []);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handlePrayerSubmit(name, content);
      setName('');
      setContent('');
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    };

    const handlePrayClick = (id: string) => {
        if(prayedFor.includes(id)) return;
        setPrayers(prev => prev.map(p => p.id === id ? { ...p, prayerCount: p.prayerCount + 1 } : p));
        setPrayedFor(prev => [...prev, id]);
        addToast("Thank you for praying!");
    };

    const approvedPrayers = prayers.filter(p => p.status === 'APPROVED').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
      <div className="container mx-auto p-6 animate-fade-in pb-20 max-w-5xl grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow sticky top-24">
              <h3 className="text-xl font-bold mb-4 dark:text-slate-100">Request Prayer</h3>
              {submitted ? (
                 <div className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 p-4 rounded mb-4 text-sm">
                    Prayer submitted! It will appear once approved.
                 </div>
              ) : null}
              <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Your Name</label>
                    <input required value={name} onChange={e=>setName(e.target.value)} className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded p-2 text-sm" placeholder="John Doe" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Prayer Request</label>
                    <textarea required value={content} onChange={e=>setContent(e.target.value)} className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded p-2 text-sm h-32" placeholder="How can we pray for you?" />
                 </div>
                 <button className="w-full bg-primary-600 text-white py-2 rounded font-bold hover:bg-primary-700">Submit Request</button>
              </form>
           </div>
        </div>
        <div className="md:col-span-2 space-y-6">
           <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Community Prayer Wall</h2>
           {prayers.filter(p => p.status === 'PENDING' && p.aiResponse).length > 0 && prayers.filter(p => p.status === 'PENDING').map(p => (
             <div key={p.id} className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-6 rounded-r-xl opacity-80">
               <div className="flex justify-between items-start mb-2">
                 <h4 className="font-bold text-slate-800 dark:text-slate-200">{p.name} <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded ml-2">Pending Review</span></h4>
                 <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(p.date).toLocaleDateString()}</span>
               </div>
               <p className="text-slate-700 dark:text-slate-300 mb-3">"{p.content}"</p>
               {p.aiResponse && (
                  <div className="bg-white dark:bg-slate-700/50 p-3 rounded border border-yellow-100 dark:border-yellow-800/50 text-sm text-slate-600 dark:text-slate-300 italic">
                     <span className="font-bold not-italic text-primary-600 dark:text-primary-500 text-xs block mb-1">Automated Encouragement:</span>
                     "{p.aiResponse}"
                  </div>
               )}
             </div>
           ))}
           {approvedPrayers.length === 0 && <p className="text-slate-500 italic dark:text-slate-400">No approved prayer requests yet. Be the first.</p>}
           {approvedPrayers.map(p => (
             <div key={p.id} className="bg-white dark:bg-slate-800 border-l-4 border-primary-500 p-6 rounded-r-xl shadow-sm">
               <div className="flex justify-between items-start mb-2">
                 <h4 className="font-bold text-slate-800 dark:text-slate-100">{p.name}</h4>
                 <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(p.date).toLocaleDateString()}</span>
               </div>
               <p className="text-slate-700 dark:text-slate-300 mb-3">"{p.content}"</p>
               <button onClick={() => handlePrayClick(p.id)} disabled={prayedFor.includes(p.id)} className={`text-xs flex items-center gap-1 font-semibold px-3 py-1 rounded-full transition ${prayedFor.includes(p.id) ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v7.333z"/></svg>
                  {prayedFor.includes(p.id) ? 'Prayed' : 'Pray for this'} ({p.prayerCount})
               </button>
             </div>
           ))}
        </div>
      </div>
    );
};

const AdminPage = (props: any) => {
    const { userRole, handleLogin, prayers, setPrayers, sermons, setSermons, events, setEvents, meetings, setMeetings, verse, setVerse, slideshowImages, setSlideshowImages, addToast } = props;
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'DASH' |'SL' | 'SM' | 'EV' | 'MT' | 'PR' | 'SET'>('DASH');

    const [newSermon, setNewSermon] = useState<Partial<Sermon>>({series: ''});
    const [newEvent, setNewEvent] = useState<Partial<Event>>({date: new Date().toISOString().slice(0, 16)});
    const [newMeeting, setNewMeeting] = useState<Partial<Meeting>>({});
    const [newVerse, setNewVerse] = useState({text: verse?.text || '', ref: verse?.ref || ''});
    const [newSlide, setNewSlide] = useState<Partial<SlideshowImage>>({});
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [seeding, setSeeding] = useState(false);


    const handleAuth = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === '12345678') { handleLogin(UserRole.ADMIN); setError(''); } 
        else { setError('Invalid Password'); }
    };

    if (!userRole) {
        return (
            <div className="flex items-center justify-center h-[80vh] bg-primary-50 dark:bg-slate-900/50">
                <form onSubmit={handleAuth} className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg w-96">
                    <h2 className="text-2xl font-bold mb-6 text-center dark:text-slate-100">Staff Login</h2>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded p-3 mb-4" placeholder="Enter Password" />
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    <button className="w-full bg-primary-600 text-white py-3 rounded font-bold">Login</button>
                </form>
            </div>
        );
    }
    
    const approvePrayer = (id: string) => { setPrayers(prayers.map((p: PrayerRequest) => p.id === id ? { ...p, status: 'APPROVED' } : p)); addToast('Prayer approved!'); };
    const deletePrayer = (id: string) => { setPrayers(prayers.filter((p: PrayerRequest) => p.id !== id)); addToast('Prayer deleted.'); };
    const addSermon = (e: React.FormEvent) => {
        e.preventDefault(); if (!newSermon.title) return;
        setSermons([{ id: Date.now().toString(), title: newSermon.title!, speaker: newSermon.speaker || 'TBD', date: newSermon.date || new Date().toLocaleDateString(), description: newSermon.description || '', imageUrl: newSermon.imageUrl || `https://picsum.photos/400/250?random=${Date.now()}`, videoUrl: newSermon.videoUrl, series: newSermon.series }, ...sermons]);
        setNewSermon({series: ''}); addToast('Sermon published.');
    };
    const deleteSermon = (id: string) => { setSermons(sermons.filter((s: Sermon) => s.id !== id)); addToast('Sermon deleted.'); };
    const addEvent = (e: React.FormEvent) => {
        e.preventDefault(); if (!newEvent.title) return;
        setEvents([{ id: Date.now().toString(), title: newEvent.title!, date: newEvent.date || new Date().toISOString(), location: newEvent.location || 'Online', description: newEvent.description || '' }, ...events]);
        setNewEvent({date: new Date().toISOString().slice(0, 16)}); addToast('Event created.');
    };
    const deleteEvent = (id: string) => { setEvents(events.filter((e: Event) => e.id !== id)); addToast('Event deleted.'); };
    const addMeeting = (e: React.FormEvent) => {
        e.preventDefault(); if (!newMeeting.title) return;
        setMeetings([{ id: Date.now().toString(), title: newMeeting.title!, host: newMeeting.host || 'Admin', startTime: newMeeting.startTime || 'TBD', description: newMeeting.description || '', participants: 0 }, ...meetings]);
        setNewMeeting({}); addToast('Meeting scheduled.');
    };
    const deleteMeeting = (id: string) => { setMeetings(meetings.filter((m: Meeting) => m.id !== id)); addToast('Meeting deleted.'); };
    const updateVerse = () => { setVerse({ text: newVerse.text, ref: newVerse.ref }); addToast("Verse updated!"); };
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setNewSlide({ ...newSlide, url: result });
                setImagePreview(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const addSlide = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newSlide.url) {
          alert('Please select an image to upload.');
          return;
      }
      setSlideshowImages([{ id: Date.now().toString(), url: newSlide.url, caption: newSlide.caption }, ...slideshowImages]);
      setNewSlide({});
      setImagePreview(null);
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
      addToast('Slide added.');
    };
    const deleteSlide = (id: string) => { setSlideshowImages(slideshowImages.filter((s: SlideshowImage) => s.id !== id)); addToast('Slide deleted.'); };

    const handleSeed = async (type: 'sermons' | 'events') => {
        setSeeding(true);
        if (type === 'sermons') setSermons(await seedSermons());
        if (type === 'events') setEvents(await seedEvents());
        setSeeding(false);
        addToast(`Seeded ${type} successfully.`);
    };
    
    return (
        <div className="container mx-auto p-6 pb-20">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-8">Admin Dashboard</h2>
            <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/4"><div className="space-y-2 sticky top-24">
                    {(['DASH', 'SL', 'SM', 'EV', 'MT', 'PR', 'SET'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-left px-4 py-2 rounded text-sm font-bold transition ${activeTab === tab ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-slate-700'}`}>
                           {tab === 'DASH' ? 'Dashboard' : tab === 'SL' ? 'Slideshow' : tab === 'PR' ? 'Prayers' : tab === 'SM' ? 'Sermons' : tab === 'EV' ? 'Events' : tab === 'MT' ? 'Meetings' : 'Settings'}
                        </button>
                    ))}
                </div></div>
                <div className="md:w-3/4">
                {activeTab === 'DASH' && <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
                        <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400">Total Sermons</h4>
                        <p className="text-4xl font-bold">{sermons.length}</p>
                    </div>
                     <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
                        <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400">Total Events</h4>
                        <p className="text-4xl font-bold">{events.length}</p>
                    </div>
                     <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
                        <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400">Pending Prayers</h4>
                        <p className="text-4xl font-bold">{prayers.filter((p:PrayerRequest) => p.status === 'PENDING').length}</p>
                    </div>
                </div>}

                {activeTab === 'SL' && <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
                        <h3 className="font-bold text-xl mb-4">Add Slideshow Image</h3>
                        <form onSubmit={addSlide} className="space-y-4">
                            <input placeholder="Caption (Optional)" value={newSlide.caption || ''} onChange={e => setNewSlide({...newSlide, caption: e.target.value})} className="w-full border p-2 rounded text-sm bg-transparent dark:border-slate-600" />
                            <div>
                               <label className="w-full text-center cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium py-2 px-4 rounded-lg inline-block">
                                  Choose Image
                                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                               </label>
                            </div>
                            {imagePreview && (
                                <div className="mt-4">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Image Preview</p>
                                    <img src={imagePreview} alt="Preview" className="w-full max-w-xs h-auto object-cover rounded-lg shadow-md" />
                                </div>
                            )}
                            <button className="w-full bg-primary-600 text-white py-2 rounded font-bold">Add Image</button>
                        </form>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {slideshowImages.map((s: SlideshowImage) => <div key={s.id} className="bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm relative group">
                        <img src={s.url} alt={s.caption || 'slide'} className="w-full h-24 object-cover rounded" />
                        <p className="text-xs truncate mt-2 px-1">{s.caption || 'No Caption'}</p>
                        <button onClick={() => deleteSlide(s.id)} className="absolute top-3 right-3 text-white bg-red-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition"><IconTrash className="w-3 h-3" /></button>
                      </div>)}
                    </div>
                </div>}

                {activeTab === 'SM' && <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
                        <h3 className="font-bold text-xl mb-4">Add Sermon</h3>
                        <form onSubmit={addSermon} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input placeholder="Title" value={newSermon.title || ''} onChange={e => setNewSermon({...newSermon, title: e.target.value})} className="w-full border p-2 rounded text-sm bg-transparent dark:border-slate-600" />
                            <input placeholder="Speaker" value={newSermon.speaker || ''} onChange={e => setNewSermon({...newSermon, speaker: e.target.value})} className="w-full border p-2 rounded text-sm bg-transparent dark:border-slate-600" />
                            <input placeholder="Series (e.g. Gospel of John)" value={newSermon.series || ''} onChange={e => setNewSermon({...newSermon, series: e.target.value})} className="w-full border p-2 rounded text-sm bg-transparent dark:border-slate-600" />
                            <input placeholder="Date" value={newSermon.date || ''} onChange={e => setNewSermon({...newSermon, date: e.target.value})} className="w-full border p-2 rounded text-sm bg-transparent dark:border-slate-600" />
                            <input placeholder="Image URL" value={newSermon.imageUrl || ''} onChange={e => setNewSermon({...newSermon, imageUrl: e.target.value})} className="w-full border p-2 rounded text-sm bg-transparent dark:border-slate-600" />
                            <input placeholder="Video URL (e.g. YouTube)" value={newSermon.videoUrl || ''} onChange={e => setNewSermon({...newSermon, videoUrl: e.target.value})} className="w-full border p-2 rounded text-sm bg-transparent dark:border-slate-600" />
                            <textarea placeholder="Description" value={newSermon.description || ''} onChange={e => setNewSermon({...newSermon, description: e.target.value})} className="w-full border p-2 rounded text-sm md:col-span-2 bg-transparent dark:border-slate-600" />
                            <button className="w-full bg-primary-600 text-white py-2 rounded font-bold md:col-span-2">Publish Sermon</button>
                        </form>
                    </div>
                    {sermons.map((s: Sermon) => <div key={s.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex justify-between items-center"><div><p className="font-bold">{s.title}</p><p className="text-xs text-slate-500 dark:text-slate-400">{s.speaker} | {s.date}</p></div><button onClick={() => deleteSermon(s.id)} className="text-red-500 p-2"><IconTrash className="w-4 h-4" /></button></div>)}
                </div>}

                {activeTab === 'EV' && <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6"><h3 className="font-bold text-xl mb-4">Add Event</h3>
                        <form onSubmit={addEvent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input placeholder="Title" value={newEvent.title || ''} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full border p-2 rounded text-sm bg-transparent dark:border-slate-600" />
                            <input type="datetime-local" value={newEvent.date || ''} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full border p-2 rounded text-sm bg-transparent dark:border-slate-600" />
                            <input placeholder="Location" value={newEvent.location || ''} onChange={e => setNewEvent({...newEvent, location: e.target.value})} className="w-full border p-2 rounded text-sm md:col-span-2 bg-transparent dark:border-slate-600" />
                            <textarea placeholder="Description" value={newEvent.description || ''} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="w-full border p-2 rounded text-sm md:col-span-2 bg-transparent dark:border-slate-600" />
                            <button className="w-full bg-primary-600 text-white py-2 rounded font-bold md:col-span-2">Create Event</button>
                        </form>
                    </div>
                    {events.map((e: Event) => <div key={e.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex justify-between items-center"><div><p className="font-bold">{e.title}</p><p className="text-xs text-slate-500 dark:text-slate-400">{e.location} | {e.date}</p></div><button onClick={() => deleteEvent(e.id)} className="text-red-500 p-2"><IconTrash className="w-4 h-4" /></button></div>)}
                </div>}

                {activeTab === 'MT' && <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6"><h3 className="font-bold text-xl mb-4">Schedule Meeting</h3>
                        <form onSubmit={addMeeting} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <input placeholder="Title" value={newMeeting.title || ''} onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} className="w-full border p-2 rounded text-sm bg-transparent dark:border-slate-600" />
                           <input placeholder="Host Name" value={newMeeting.host || ''} onChange={e => setNewMeeting({...newMeeting, host: e.target.value})} className="w-full border p-2 rounded text-sm bg-transparent dark:border-slate-600" />
                           <input placeholder="Start Time" value={newMeeting.startTime || ''} onChange={e => setNewMeeting({...newMeeting, startTime: e.target.value})} className="w-full border p-2 rounded text-sm md:col-span-2 bg-transparent dark:border-slate-600" />
                           <textarea placeholder="Description" value={newMeeting.description || ''} onChange={e => setNewMeeting({...newMeeting, description: e.target.value})} className="w-full border p-2 rounded text-sm md:col-span-2 bg-transparent dark:border-slate-600" />
                           <button className="w-full bg-primary-600 text-white py-2 rounded font-bold md:col-span-2">Schedule</button>
                        </form>
                    </div>
                    {meetings.map((m: Meeting) => <div key={m.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex justify-between items-center"><div><p className="font-bold">{m.title}</p><p className="text-xs text-slate-500 dark:text-slate-400">Host: {m.host} | {m.startTime}</p></div><button onClick={() => deleteMeeting(m.id)} className="text-red-500 p-2"><IconTrash className="w-4 h-4" /></button></div>)}
                </div>}

                {activeTab === 'PR' && <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden"><div className="p-4 border-b dark:border-slate-700"><h3 className="font-bold">Prayer Requests</h3></div><div className="overflow-x-auto"><table className="w-full text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-700 uppercase"><tr><th className="p-4 text-left">Name</th><th className="p-4 text-left">Content</th><th className="p-4 text-left">Status</th><th className="p-4 text-left">Action</th></tr></thead>
                    <tbody>{prayers.map((p: PrayerRequest) => <tr key={p.id} className="border-t dark:border-slate-700"><td className="p-4">{p.name}</td><td className="p-4 max-w-xs truncate">{p.content}</td><td className="p-4"><span className={`px-2 py-1 rounded text-xs ${p.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status}</span></td><td className="p-4 flex gap-2">{p.status === 'PENDING' && <button onClick={() => approvePrayer(p.id)}>Approve</button>}<button onClick={() => deletePrayer(p.id)}>Delete</button></td></tr>)}</tbody>
                </table></div></div>}

                {activeTab === 'SET' && <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 space-y-6">
                    <div><h3 className="font-bold mb-2">Verse of the Day</h3><textarea className="w-full border rounded p-2 text-sm bg-transparent dark:border-slate-600" value={newVerse.text} onChange={(e) => setNewVerse({...newVerse, text: e.target.value})} /><input className="w-full border rounded p-2 text-sm mt-2 bg-transparent dark:border-slate-600" placeholder="Reference" value={newVerse.ref} onChange={(e) => setNewVerse({...newVerse, ref: e.target.value})} /><button onClick={updateVerse} className="mt-2 bg-primary-600 text-white px-4 py-2 rounded text-sm font-bold">Save Verse</button></div>
                    <div className="pt-6 border-t dark:border-slate-700"><h4 className="font-bold mb-2">Development Tools</h4><div className="flex gap-2">
                        <button onClick={() => handleSeed('sermons')} disabled={seeding} className="bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded text-xs flex items-center gap-1 disabled:opacity-50">{seeding && <IconLoader className="w-3 h-3"/>}Seed Sermons</button>
                        <button onClick={() => handleSeed('events')} disabled={seeding} className="bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded text-xs flex items-center gap-1 disabled:opacity-50">{seeding && <IconLoader className="w-3 h-3"/>}Seed Events</button>
                    </div></div>
                </div>}
                </div>
            </div>
        </div>
    );
};

const SearchPage = ({ sermons, events, meetings, setPage }: { sermons: Sermon[], events: Event[], meetings: Meeting[], setPage: (page: Page) => void }) => {
    const [searchQuery, setSearchQuery] = useState('');
    
    const highlightText = (text: string, query: string) => {
        if (!query) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return <>{parts.map((part, i) => (part.toLowerCase() === query.toLowerCase() ? <mark key={i} className="bg-primary-100 dark:bg-primary-700/50 text-primary-700 dark:text-primary-300 rounded px-1">{part}</mark> : part))}</>;
    };

    const results = !searchQuery ? [] : [...sermons.map(s => ({...s, type: 'SERMON' as const})), ...events.map(e => ({...e, type: 'EVENT' as const})), ...meetings.map(m => ({...m, type: 'MEETING' as const, description: `Host: ${m.host}`}))]
        .map(item => ({...item, score: (item.title.toLowerCase().includes(searchQuery.toLowerCase()) ? 2 : 0) + (item.description.toLowerCase().includes(searchQuery.toLowerCase()) ? 1 : 0)}))
        .filter(item => item.score > 0).sort((a,b) => b.score - a.score);

    return (
        <div className="container mx-auto p-6 pb-20 max-w-3xl">
            <div className="relative mb-8">
                <IconSearch className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                <input autoFocus type="text" placeholder="Search sermons, events, meetings..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 text-lg border dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl" />
            </div>
            <div className="space-y-4">{results.map(r => (
                <div key={`${r.type}-${r.id}`} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm cursor-pointer" onClick={() => { if (r.type === 'SERMON') setPage(Page.SERMONS); if (r.type === 'EVENT') setPage(Page.EVENTS); if (r.type === 'MEETING') setPage(Page.MEETINGS);}}>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded mb-1 inline-block ${r.type === 'SERMON' ? 'bg-blue-100 text-blue-700' : r.type === 'EVENT' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{r.type}</span>
                    <h3 className="font-bold text-lg dark:text-slate-100">{highlightText(r.title, searchQuery)}</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">{highlightText(r.description, searchQuery)}</p>
                </div>
            ))}</div>
        </div>
    );
};

const initialSlideshowImages: SlideshowImage[] = [
    { id: '1', url: 'https://images.unsplash.com/photo-1507692049484-3a5f6d70a255?q=80&w=2070&auto=format&fit=crop', caption: 'Gathered in Worship' },
    { id: '2', url: 'https://images.unsplash.com/photo-1543825122-38634563a55a?q=80&w=2070&auto=format&fit=crop', caption: 'Community Fellowship' },
    { id: '3', url: 'https://images.unsplash.com/photo-1518018863046-562b7b51b279?q=80&w=1943&auto=format&fit=crop', caption: 'Hearing the Word' },
];

// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
  const [pageHistory, setPageHistory] = useState<Page[]>([Page.HOME]);
  const currentPage = pageHistory[pageHistory.length - 1];
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [verse, setVerse] = useStickyState<{text: string, ref: string} | null>('verse', null);
  const [verseLoading, setVerseLoading] = useState(false);
  
  const [sermons, setSermons] = useStickyState<Sermon[]>('sermons', []);
  const [events, setEvents] = useStickyState<Event[]>('events', []);
  const [meetings, setMeetings] = useStickyState<Meeting[]>('meetings', []);
  const [prayers, setPrayers] = useStickyState<PrayerRequest[]>('prayers', []);
  const [slideshowImages, setSlideshowImages] = useStickyState<SlideshowImage[]>('slideshowImages', initialSlideshowImages);
  const [videoModal, setVideoModal] = useState<{open: boolean, url: string | null}>({open: false, url: null});
  const [darkMode, setDarkMode] = useStickyState<boolean>('darkMode', false);
  const [toasts, setToasts] = useState<{id: number, message: string}[]>([]);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);
  
  const setPage = (page: Page) => {
      setPageHistory(prev => [...prev, page]);
      window.scrollTo(0, 0);
  };
  const goBack = () => setPageHistory(prev => prev.slice(0, -1));

  useEffect(() => {
    if (!verse) {
        setVerseLoading(true);
        getVerseOfDay().then(v => setVerse({ text: v.verse, ref: v.reference })).finally(() => setVerseLoading(false));
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const addToast = (message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, {id, message}]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const handleShare = async (title: string, text: string, url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(`${title} - ${url}`);
      addToast("Link copied to clipboard!");
    }
  };

  const handlePrayerSubmit = async (name: string, content: string) => {
    const newPrayer: PrayerRequest = { id: Date.now().toString(), name, content, status: 'PENDING', date: new Date().toISOString(), prayerCount: 0 };
    setPrayers(prev => [newPrayer, ...prev]);
    const response = await generatePrayerResponse(content);
    setPrayers(prev => prev.map(p => p.id === newPrayer.id ? { ...p, aiResponse: response } : p));
  };

  const handleLogin = (role: UserRole) => { setUserRole(role); setPage(Page.ADMIN); };
  const openVideoModal = (url: string) => {
      const videoId = url.includes('youtu.be') ? url.split('/').pop()?.split('?')[0] : new URL(url).searchParams.get('v');
      setVideoModal({ open: true, url: `https://www.youtube.com/embed/${videoId}` });
  }

  const pageProps = {
    [Page.HOME]: { verse, setPage, slideshowImages, verseLoading },
    [Page.SERMONS]: { sermons, openVideoModal, handleShare },
    [Page.EVENTS]: { events, handleShare },
    [Page.MEETINGS]: { meetings, handleShare },
    [Page.PRAYER]: { prayers, handlePrayerSubmit, setPrayers, addToast },
    [Page.ADMIN]: { userRole, handleLogin, prayers, setPrayers, sermons, setSermons, events, setEvents, meetings, setMeetings, verse, setVerse, slideshowImages, setSlideshowImages, addToast },
    [Page.SEARCH]: { sermons, events, meetings, setPage },
  };

  const renderPage = () => {
    if (currentPage === Page.HOME) return <HomePage {...pageProps[Page.HOME]} />;
    if (currentPage === Page.SERMONS) return <SermonsPage {...pageProps[Page.SERMONS]} />;
    if (currentPage === Page.EVENTS) return <EventsPage {...pageProps[Page.EVENTS]} />;
    if (currentPage === Page.MEETINGS) return <Meetings {...pageProps[Page.MEETINGS]} />;
    if (currentPage === Page.PRAYER) return <PrayerPage {...pageProps[Page.PRAYER]} />;
    if (currentPage === Page.ADMIN) return <AdminPage {...pageProps[Page.ADMIN]} />;
    if (currentPage === Page.SEARCH) return <SearchPage {...pageProps[Page.SEARCH]} />;
    return <HomePage {...pageProps[Page.HOME]} />;
  };

  return (
    <div className="min-h-screen bg-primary-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200">
      <Navigation activePage={currentPage} setPage={setPage} role={userRole} onLogout={() => setUserRole(null)} darkMode={darkMode} setDarkMode={setDarkMode} canGoBack={pageHistory.length > 1} goBack={goBack} />
      <main className="pb-20 md:pb-0">{renderPage()}</main>

      {/* Toast Notifications */}
      <div className="fixed bottom-24 md:bottom-6 right-6 z-[150] space-y-2">
          {toasts.map(toast => (
              <div key={toast.id} className="bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in-up">
                  {toast.message}
              </div>
          ))}
      </div>
      
      {/* Back to Top Button */}
      {showBackToTop && (
        <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="fixed bottom-24 md:bottom-6 left-6 z-[150] w-12 h-12 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 transition">
            <IconArrowUp className="w-6 h-6" />
        </button>
      )}

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