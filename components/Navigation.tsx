import React, { useState } from 'react';
import { Page, UserRole } from '../types';
import { IconHome, IconSermon, IconEvent, IconMeeting, IconPrayer, IconGiving, IconAdmin, IconSearch } from './Icons';

interface NavigationProps {
  activePage: Page;
  setPage: (page: Page) => void;
  role: UserRole | null;
  onLogout: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ activePage, setPage, role, onLogout }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const navItems = [
    { page: Page.HOME, icon: <IconHome className="w-6 h-6" />, label: 'Home' },
    { page: Page.SERMONS, icon: <IconSermon className="w-6 h-6" />, label: 'Sermons' },
    { page: Page.EVENTS, icon: <IconEvent className="w-6 h-6" />, label: 'Events' },
    { page: Page.MEETINGS, icon: <IconMeeting className="w-6 h-6" />, label: 'Meet' },
    { page: Page.PRAYER, icon: <IconPrayer className="w-6 h-6" />, label: 'Prayer' },
    { page: Page.GIVING, icon: <IconGiving className="w-6 h-6" />, label: 'Give' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(Page.SEARCH);
    // Search logic is handled in the Search Page via local storage or context access, 
    // for simplicity here we just navigate. A real app might pass the query string.
  };

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between bg-white shadow-md px-8 py-4 sticky top-0 z-50">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setPage(Page.HOME)}>
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">M</div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">1000 Micro Church</h1>
        </div>

        <nav className="flex items-center space-x-6">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => setPage(item.page)}
              className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                activePage === item.page ? 'text-primary-600' : 'text-slate-600 hover:text-primary-600'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <button onClick={() => setPage(Page.SEARCH)} className="text-slate-500 hover:text-primary-600">
             <IconSearch className="w-5 h-5" />
          </button>
          
          {role ? (
             <div className="flex items-center gap-2">
                <button onClick={() => setPage(Page.ADMIN)} className="text-sm font-semibold text-primary-700 hover:underline">
                  Dashboard ({role})
                </button>
                <button onClick={onLogout} className="text-xs text-red-500">Logout</button>
             </div>
          ) : (
            <button onClick={() => setPage(Page.ADMIN)} className="text-sm text-slate-500 hover:text-primary-600">
              Admin Login
            </button>
          )}
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-50 pb-safe">
        <div className="flex justify-around items-center py-3">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => setPage(item.page)}
              className={`flex flex-col items-center space-y-1 ${
                activePage === item.page ? 'text-primary-600' : 'text-slate-400'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
          <button
             onClick={() => setPage(Page.ADMIN)}
             className={`flex flex-col items-center space-y-1 ${activePage === Page.ADMIN ? 'text-primary-600' : 'text-slate-400'}`}
          >
            <IconAdmin className="w-6 h-6" />
            <span className="text-[10px] font-medium">Admin</span>
          </button>
        </div>
      </div>
      
      {/* Mobile Top Bar for Search/Brand */}
      <div className="md:hidden bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-40">
          <span className="font-bold text-primary-600">1000 Micro Church</span>
          <button onClick={() => setPage(Page.SEARCH)}>
            <IconSearch className="w-5 h-5 text-slate-500" />
          </button>
      </div>
    </>
  );
};

export default Navigation;