
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50">
      {/* Header */}
      <header className="h-16 glass sticky top-0 z-50 flex justify-between items-center px-4 md:px-8 border-b border-white/40 shrink-0">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex items-center">
            <span className="text-xl font-extrabold tracking-tighter text-[#00305d]">Webasto</span>
          </div>
          <div className="h-4 w-px bg-slate-300 hidden sm:block"></div>
          <h1 className="text-sm font-semibold tracking-tight text-slate-500 hidden sm:flex items-center gap-2 uppercase tracking-[0.1em]">
            Deviation <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-md text-[10px] font-black">AI:PPROVAL</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3 md:gap-6">
          <div className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1.5 rounded-full hover:bg-white/40 transition-colors cursor-pointer group">
            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 flex items-center justify-center border border-white shrink-0">
              <i className="fa-solid fa-user text-[10px] text-slate-500"></i>
            </div>
            <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 hidden xs:block">George Neacsu</span>
          </div>
          <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors whitespace-nowrap">
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-20 xl:w-64 glass-dark p-4 hidden md:flex flex-col gap-2 border-r border-white/10 shrink-0 transition-all duration-500">
          <div className="px-3 py-4 mb-4">
             <div className="h-1.5 w-12 bg-white/20 rounded-full"></div>
          </div>
          
          <nav className="space-y-2">
            <NavItem icon="fa-gauge-high" label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <NavItem icon="fa-plus" label="New Deviation" active={activeTab === 'new'} onClick={() => setActiveTab('new')} />
            <NavItem icon="fa-inbox" label="Approvals" badge="3" active={activeTab === 'approvals'} onClick={() => setActiveTab('approvals')} />
            <NavItem icon="fa-shield-check" label="Compliance" active={activeTab === 'compliance'} onClick={() => setActiveTab('compliance')} />
            <NavItem icon="fa-archive" label="Archive" active={activeTab === 'archive'} onClick={() => setActiveTab('archive')} />
            <div className="pt-6 mt-6 border-t border-white/5">
               <NavItem icon="fa-sliders" label="Admin" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />
            </div>
          </nav>

          <div className="mt-auto px-2 xl:px-4 py-6">
             <div className="p-3 xl:p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                   <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                   <span className="text-[9px] xl:text-[10px] font-black text-white/40 uppercase tracking-widest">System</span>
                </div>
                <p className="text-[10px] xl:text-[11px] font-medium text-white/60 truncate">All nodes operational</p>
             </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-slate-50/50">
          <div className="h-full p-4 md:p-8 xl:p-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick, badge }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-3 xl:px-4 py-3 rounded-2xl transition-all duration-300 group relative ${
      active 
        ? 'bg-white/10 text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]' 
        : 'text-white/40 hover:text-white hover:bg-white/5'
    }`}
  >
    <div className="flex items-center gap-3.5">
      <i className={`fa-solid ${icon} w-5 text-center text-sm ${active ? 'text-emerald-400' : 'opacity-60 group-hover:opacity-100'}`}></i>
      <span className="font-bold text-xs uppercase tracking-widest hidden xl:block">{label}</span>
    </div>
    {badge && (
      <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-emerald-500/20">
        {badge}
      </span>
    )}
    {active && (
      <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-emerald-400 rounded-full"></div>
    )}
  </button>
);

export default Layout;
