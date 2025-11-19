import React from 'react';
import { Page, UserRole } from '../types';
import { IconHome, IconSermon, IconEvent, IconMeeting, IconPrayer, IconAdmin, IconSearch, IconSun, IconMoon, IconArrowLeft } from './Icons';

interface NavigationProps {
  activePage: Page;
  setPage: (page: Page) => void;
  role: UserRole | null;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  canGoBack: boolean;
  goBack: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ activePage, setPage, role, onLogout, darkMode, setDarkMode, canGoBack, goBack }) => {

  const navItems = [
    { page: Page.HOME, icon: <IconHome className="w-6 h-6" />, label: 'Home' },
    { page: Page.SERMONS, icon: <IconSermon className="w-6 h-6" />, label: 'Sermons' },
    { page: Page.EVENTS, icon: <IconEvent className="w-6 h-6" />, label: 'Events' },
    { page: Page.MEETINGS, icon: <IconMeeting className="w-6 h-6" />, label: 'Meet' },
    { page: Page.PRAYER, icon: <IconPrayer className="w-6 h-6" />, label: 'Prayer' },
  ];
  
  const pageTitles: Record<Page, string> = {
    [Page.HOME]: 'Home',
    [Page.SERMONS]: 'Sermons',
    [Page.EVENTS]: 'Events',
    [Page.MEETINGS]: 'Meetings',
    [Page.PRAYER]: 'Prayer Wall',
    [Page.ADMIN]: 'Admin Dashboard',
    [Page.SEARCH]: 'Search',
  };

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between bg-white dark:bg-slate-900/80 dark:border-b dark:border-slate-800 backdrop-blur-md shadow-md px-8 py-4 sticky top-0 z-50">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setPage(Page.HOME)}>
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">M</div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">1000 Micro Church</h1>
        </div>

        <nav className="flex items-center space-x-6">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => setPage(item.page)}
              className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                activePage === item.page ? 'text-primary-600 dark:text-primary-500' : 'text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-500'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <button onClick={() => setDarkMode(!darkMode)} className="text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-500">
             {darkMode ? <IconSun className="w-5 h-5" /> : <IconMoon className="w-5 h-5" />}
          </button>
          <button onClick={() => setPage(Page.SEARCH)} className="text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-500">
             <IconSearch className="w-5 h-5" />
          </button>
          
          {role ? (
             <div className="flex items-center gap-2">
                <button onClick={() => setPage(Page.ADMIN)} className="text-sm font-semibold text-primary-700 dark:text-primary-500 hover:underline">
                  Dashboard ({role})
                </button>
                <button onClick={onLogout} className="text-xs text-red-500">Logout</button>
             </div>
          ) : (
            <button onClick={() => setPage(Page.ADMIN)} className="text-sm text-slate-500 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-500">
              Admin Login
            </button>
          )}
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-lg z-50 pb-safe">
        <div className="flex justify-around items-center py-3">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => setPage(item.page)}
              className={`flex flex-col items-center space-y-1 ${
                activePage === item.page ? 'text-primary-600 dark:text-primary-500' : 'text-slate-400 dark:text-slate-400'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
           <button
             onClick={() => setDarkMode(!darkMode)}
             className="flex flex-col items-center space-y-1 text-slate-400 dark:text-slate-400"
          >
             {darkMode ? <IconSun className="w-6 h-6" /> : <IconMoon className="w-6 h-6" />}
            <span className="text-[10px] font-medium">Theme</span>
          </button>
        </div>
      </div>
      
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white dark:bg-slate-900/80 backdrop-blur-md p-4 shadow-sm flex justify-between items-center sticky top-0 z-40 dark:border-b dark:border-slate-800">
          <div className="w-10">
            {canGoBack && activePage !== Page.HOME && (
              <button onClick={goBack} className="text-slate-600 dark:text-slate-300"><IconArrowLeft className="w-6 h-6" /></button>
            )}
          </div>
          <span className="font-bold text-primary-600 dark:text-primary-500 text-center">{activePage === Page.HOME ? '1000 Micro Church' : pageTitles[activePage]}</span>
          <div className="w-10 flex justify-end">
            <button onClick={() => setPage(Page.SEARCH)}>
              <IconSearch className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>
      </div>
    </>
  );
};

export default Navigation;