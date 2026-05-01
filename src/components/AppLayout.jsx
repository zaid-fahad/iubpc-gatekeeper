import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { signOut } from '../api/auth';
import { 
  ShieldCheck, LogOut, LayoutDashboard, Calendar, Users, Zap, ChevronLeft, Menu, X
} from 'lucide-react';

const AppLayout = ({ children, userRole }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAdmin = userRole === 'admin';
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    
    ...(isAdmin ? [{ to: '/', icon: <LayoutDashboard size={20}/>, label: 'Overview' },{ to: '/operators', icon: <Users size={20}/>, label: 'Staff' }] : []),
    { to: '/events', icon: <Calendar size={20}/>, label: 'Events' },
  ];

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row italic">
      {/* MOBILE HEADER */}
      <header className="md:hidden flex items-center justify-between p-4 bg-slate-900/50 border-b border-slate-800/50 backdrop-blur-xl sticky top-0 z-[100] italic">
        <div className="flex items-center gap-3 italic">
            <button onClick={toggleMobileMenu} className="p-2 -ml-2 text-slate-400 hover:text-white transition-all italic">
                <Menu size={20}/>
            </button>
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-slate-950 shadow-lg shadow-green-500/20 italic">
                <ShieldCheck size={18}/>
            </div>
            <h1 className="text-base font-black italic tracking-tighter text-white uppercase italic">IUBPC</h1>
        </div>
        <button onClick={handleSignOut} className="p-2 bg-slate-800 rounded-lg text-red-500 italic active:scale-90 transition-all">
            <LogOut size={16}/>
        </button>
      </header>

      {/* MOBILE SIDE NAV DRAWER (OVERLAY) */}
      <div 
        className={`md:hidden fixed inset-0 z-[200] transition-all duration-300 ${isMobileMenuOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}
      >
        <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
        ></div>
        <aside className={`absolute inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 shadow-2xl flex flex-col transition-transform duration-500 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} italic`}>
            <div className="p-6 flex items-center justify-between italic border-b border-slate-800/50">
                <div className="flex items-center gap-3 italic">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-slate-950 italic">
                        <ShieldCheck size={18}/>
                    </div>
                    <div>
                        <h1 className="text-lg font-black italic tracking-tighter text-white uppercase leading-none italic">IUBPC</h1>
                        <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest mt-1 italic">
                            {isAdmin ? 'ADMIN' : 'STAFF'}
                        </p>
                    </div>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-600 hover:text-white italic">
                    <X size={18}/>
                </button>
            </div>

            <nav className="flex-1 px-3 space-y-1.5 mt-4 italic">
                {navItems.map(item => (
                    <NavLink 
                        key={item.to}
                        to={item.to} 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={({ isActive }) => `flex items-center gap-3 px-5 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? 'bg-green-500 text-slate-950 shadow-lg shadow-green-500/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    >
                        {React.cloneElement(item.icon, { size: 18 })}
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-5 mt-auto italic border-t border-slate-800/50">
                <button 
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all italic border border-transparent hover:border-red-500/20"
                >
                    <LogOut size={18}/>
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside className={`hidden md:flex ${isCollapsed ? 'md:w-20' : 'md:w-64'} md:h-screen md:sticky md:top-0 bg-slate-900/50 border-r border-slate-800/50 backdrop-blur-xl z-[100] flex-col transition-all duration-500 ease-in-out italic`}>
        <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} italic relative`}>
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-slate-950 shadow-[0_0_15px_rgba(34,197,94,0.3)] shrink-0 italic">
            <ShieldCheck size={22}/>
          </div>
          {!isCollapsed && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300 overflow-hidden">
              <h1 className="text-xl font-black italic tracking-tighter text-white uppercase leading-none italic whitespace-nowrap">IUBPC</h1>
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mt-1.5 italic leading-none whitespace-nowrap">
                {isAdmin ? 'ADMIN' : 'STAFF'}
              </p>
            </div>
          )}
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full items-center justify-center text-slate-400 hover:text-white transition-all z-[110]"
          >
            <ChevronLeft size={12} className={`transition-transform duration-500 ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1.5 mt-4 italic">
          {navItems.map(item => (
            <NavLink 
              key={item.to}
              to={item.to} 
              className={({ isActive }) => `flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-5'} py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? 'bg-green-500 text-slate-950 shadow-lg shadow-green-500/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
              title={item.label}
            >
              {React.cloneElement(item.icon, { size: 18, className: 'shrink-0' })}
              {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300 overflow-hidden whitespace-nowrap">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-5 mt-auto italic">
          <button 
            onClick={handleSignOut}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-5'} py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all active:scale-95 italic border border-transparent hover:border-red-500/20`}
            title="Sign Out Session"
          >
            <LogOut size={18} className="shrink-0"/>
            {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300 overflow-hidden whitespace-nowrap">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen relative italic overflow-x-hidden">
        <div className="max-w-[1600px] mx-auto p-4 md:p-10 pb-32 md:pb-12 italic">
          {children}
        </div>
        
        {/* Decorative Element */}
        <div className="fixed bottom-0 right-0 pointer-events-none opacity-[0.02] p-12 italic hidden md:block">
            <Zap size={400} className="text-green-500" />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
