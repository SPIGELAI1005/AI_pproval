
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAIPanelOpen?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onAIPanelOpen }) => {
  const { effectiveTheme, toggleTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {/* Header */}
      <header className="glass glass-highlight sticky top-0 z-50 flex justify-between items-center px-4 md:px-8 border-b shrink-0 h-16">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex items-center">
            <span className={`text-xl font-extrabold tracking-tighter transition-colors ${isDark ? 'text-slate-100' : 'ui-heading'}`}>
              Webasto
            </span>
          </div>
          <div className={`h-4 w-px hidden sm:block transition-colors ${isDark ? 'bg-slate-600' : 'bg-slate-300'}`}></div>
          <h1 className={`text-sm font-semibold tracking-tight hidden sm:flex items-center gap-2 uppercase tracking-[0.1em] transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Deviation <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-md text-[10px] font-black shadow-lg shadow-emerald-500/20">AI:PPROVAL</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3 md:gap-6">
          {/* I A:M Q Button */}
          <button
            onClick={() => {
              if (onAIPanelOpen) onAIPanelOpen();
            }}
            className={`flex items-center gap-2 px-3 py-2 sm:px-4 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 relative z-10 flex-shrink-0 ${
              isDark
                ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 hover:from-emerald-500/30 hover:to-emerald-600/30 text-emerald-400 border border-emerald-500/30'
                : 'bg-gradient-to-r from-emerald-500/15 to-emerald-600/15 hover:from-emerald-500/25 hover:to-emerald-600/25 text-emerald-600 border border-emerald-500/20'
            } shadow-lg shadow-emerald-500/20`}
            title="Open I A:M Q - AI Intelligence Layer"
          >
            <div className="h-6 w-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-emerald-500/30 flex-shrink-0">
              <i className="fa-solid fa-comment-dots text-sm scale-x-[-1]"></i>
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider hidden sm:block whitespace-nowrap">
              I&nbsp;&nbsp;A:M&nbsp;&nbsp;Q
            </span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
              isDark 
                ? 'bg-slate-700/50 hover:bg-slate-700 text-amber-400 hover:text-amber-300' 
                : 'bg-slate-100/50 hover:bg-slate-200 text-slate-600 hover:text-slate-800'
            }`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          >
            <i className={`fa-solid ${isDark ? 'fa-sun' : 'fa-moon'} text-sm`}></i>
          </button>

          <div className={`flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1.5 rounded-full transition-all duration-300 cursor-pointer group hover:scale-105 ${
            isDark 
              ? 'hover:bg-white/10' 
              : 'hover:bg-white/40'
          }`}>
            <div className={`h-7 w-7 rounded-full bg-gradient-to-tr flex items-center justify-center border shrink-0 transition-all group-hover:scale-110 ${
              isDark 
                ? 'from-slate-700 to-slate-600 border-slate-500' 
                : 'from-slate-200 to-slate-100 border-white'
            }`}>
              <i className={`fa-solid fa-user text-[10px] transition-colors ${isDark ? 'text-slate-300' : 'text-slate-500'}`}></i>
            </div>
            <span className={`text-xs font-bold hidden xs:block transition-colors ${
              isDark 
                ? 'text-slate-300 group-hover:text-slate-100' 
                : 'text-slate-700 group-hover:text-slate-900'
            }`}>
              George Neacsu
            </span>
          </div>
          <button className={`text-[10px] font-black uppercase tracking-widest transition-colors whitespace-nowrap hover:scale-105 ${
            isDark 
              ? 'text-slate-400 hover:text-red-400' 
              : 'text-slate-400 hover:text-red-500'
          }`}>
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className={`w-20 xl:w-64 ${isDark ? 'glass-dark' : 'glass'} p-4 hidden md:flex flex-col gap-2 border-r shrink-0 transition-all duration-500 ${
          isDark ? 'border-slate-700/50' : 'border-slate-200/40'
        }`}>
          <div className="px-3 py-4 mb-4">
             <div className={`h-1.5 w-12 rounded-full transition-colors ${isDark ? 'bg-white/20' : 'bg-white/20'}`}></div>
          </div>
          
          <nav className="space-y-1.5 flex-1">
            <NavItem icon="fa-gauge-high" label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} isDark={isDark} />
            <NavItem icon="fa-plus" label="New Deviation" active={activeTab === 'new'} onClick={() => setActiveTab('new')} isDark={isDark} />
            <NavItem icon="fa-inbox" label="Approvals" badge="3" active={activeTab === 'approvals'} onClick={() => setActiveTab('approvals')} isDark={isDark} />
            <NavItem icon="fa-shield-halved" label="Compliance" active={activeTab === 'compliance'} onClick={() => setActiveTab('compliance')} isDark={isDark} />
            <NavItem icon="fa-archive" label="Archive" active={activeTab === 'archive'} onClick={() => setActiveTab('archive')} isDark={isDark} />
            <div className={`pt-4 mt-4 border-t transition-colors ${isDark ? 'border-white/5' : 'border-white/5'}`}>
               <NavItem icon="fa-circle-question" label="FAQ & Support" active={activeTab === 'faq'} onClick={() => setActiveTab('faq')} isDark={isDark} />
               <NavItem icon="fa-sliders" label="Admin" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} isDark={isDark} />
            </div>
          </nav>

          <div className="mt-auto px-2 xl:px-4 py-6">
             <div className={`p-3 xl:p-4 rounded-2xl border backdrop-blur-sm transition-all hover:scale-105 ${
               isDark 
                 ? 'bg-white/5 border-white/5 hover:bg-white/10' 
                 : 'bg-white/5 border-white/5 hover:bg-white/10'
             }`}>
                <div className="flex items-center gap-2 mb-2">
                   <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                   <span className={`text-[9px] xl:text-[10px] font-black uppercase tracking-widest transition-colors ${
                     isDark ? 'text-white/40' : 'text-white/40'
                   }`}>
                     System
                   </span>
                </div>
                <p className={`text-[10px] xl:text-[11px] font-medium truncate transition-colors ${
                  isDark ? 'text-white/60' : 'text-white/60'
                }`}>
                  All nodes operational
                </p>
             </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className={`flex-1 overflow-x-hidden relative transition-colors ${
          isDark ? 'bg-slate-900/50' : 'bg-slate-50/50'
        }`}>
          <div className="p-4 md:p-8 xl:p-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick, badge, isDark }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-3 xl:px-4 py-2.5 xl:py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
      active
        ? (isDark
            ? 'bg-white/14 text-white shadow-[0_6px_22px_rgba(0,0,0,0.30)] backdrop-blur-sm border border-white/12'
            : 'bg-white/70 text-slate-900 shadow-[0_10px_26px_rgba(0,0,0,0.10)] backdrop-blur-sm border border-slate-200/50')
        : (isDark
            ? 'text-white/70 hover:text-white hover:bg-white/8 border border-transparent'
            : 'text-slate-700 hover:text-slate-900 hover:bg-white/50 border border-transparent')
    }`}
  >
    <div className="flex items-center gap-3 xl:gap-3.5">
      <div className={`relative flex items-center justify-center w-5 h-5 transition-all ${active ? 'scale-110' : 'group-hover:scale-105'}`}>
        <i
          className={`fa-solid ${icon} text-sm transition-all ${
            active
              ? 'text-emerald-500 dark:text-emerald-400'
              : isDark
                ? 'text-white/60 group-hover:text-white/90'
                : 'text-slate-500 group-hover:text-slate-800'
          }`}
        ></i>
        {active && (
          <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-sm"></div>
        )}
      </div>
      <span className="font-bold text-xs uppercase tracking-wider hidden xl:block transition-all">
        {label}
      </span>
    </div>
    {badge && (
      <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-emerald-500/30 animate-pulse">
        {badge}
      </span>
    )}
    {active && (
      <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
    )}
    {/* Liquid glass hover (specular highlight + shimmer sweep) */}
    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
      {/* soft glass brighten */}
      <div className={`absolute inset-0 rounded-xl ${isDark ? 'bg-gradient-to-r from-white/0 via-white/12 to-white/0' : 'bg-gradient-to-r from-white/0 via-white/45 to-white/0'}`}></div>
      {/* specular highlight */}
      <div className={`absolute inset-0 rounded-xl ${isDark ? 'bg-[radial-gradient(140px_50px_at_22%_12%,rgba(255,255,255,0.30),transparent_65%)]' : 'bg-[radial-gradient(140px_50px_at_22%_12%,rgba(255,255,255,0.65),transparent_65%)]'}`}></div>
      {/* shimmer sweep (clipped by overflow-hidden on button) */}
      <div className={`absolute -inset-[70%] ${isDark ? 'bg-gradient-to-r from-transparent via-white/18 to-transparent' : 'bg-gradient-to-r from-transparent via-white/35 to-transparent'} rotate-12 translate-x-[-45%] group-hover:translate-x-[45%] transition-transform duration-700`}></div>
    </div>
  </button>
);

export default Layout;
