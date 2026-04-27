import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { 
  signOut, 
  getSession, 
  checkAdminStatus, 
  onAuthStateChange 
} from './api/auth';
import { ShieldAlert } from 'lucide-react';

// Components
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import AuthScreen from './pages/AuthScreen';
import AdminDashboard from './pages/AdminDashboard';
import GateControl from './pages/GateControl';
import GuestListPortal from './pages/GuestListPortal';
import EventAnalytics from './pages/EventAnalytics';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
        try {
            const { data: { session } } = await getSession();
            if (session && isMounted) {
                const email = session.user.email || "";
                setUser(session.user);
                
                const { data: adminCheck } = await checkAdminStatus(email);
                if (isMounted) setIsAdmin(!!adminCheck);
            }
        } catch (err) {
            console.error("Critical Auth Fault:", err);
        } finally {
            if (isMounted) setLoading(false);
        }
    };

    initialize();

    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (session) {
        setUser(session.user);
        const email = session.user.email || "";
        const { data: adminCheck } = await checkAdminStatus(email);
        if (isMounted) {
          setIsAdmin(!!adminCheck);
          setLoading(false);
        }
      } else {
        if (isMounted) {
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
        }
      }
    });

    const safety = setTimeout(() => { if (isMounted && loading) setLoading(false); }, 5000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(safety);
    };
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden selection:bg-green-500/30 selection:text-slate-950 italic">
        <Routes>
          <Route 
            path="/login" 
            element={!user ? <AuthScreen /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/" 
            element={
              user ? (
                isAdmin ? <AdminDashboard /> : <AccessDenied user={user} />
              ) : <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/event/:id/gate" 
            element={user && isAdmin ? <GateControl /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/event/:id/guests" 
            element={user && isAdmin ? <GuestListPortal /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/event/:id/analytics" 
            element={user && isAdmin ? <EventAnalytics /> : <Navigate to="/login" replace />} 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

const AccessDenied = ({ user }) => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 italic animate-in fade-in duration-1000">
    <div className="bg-slate-900 border border-slate-800 p-12 rounded-[3.5rem] text-center max-w-sm space-y-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)] animate-in zoom-in duration-500 shadow-red-500/5">
      <div className="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center justify-center mx-auto text-red-500 shadow-[0_0_40px_rgba(239,68,68,0.1)]">
        <ShieldAlert size={48} className="animate-pulse" />
      </div>
      <div className="space-y-3">
          <h2 className="text-3xl font-black text-white uppercase italic leading-none tracking-tighter">ACCESS DENIED</h2>
          <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] leading-relaxed">Identity <b>{user.email}</b><br/>UNAUTHORIZED FOR ROOT ACCESS</p>
      </div>
      <button 
        onClick={() => signOut()} 
        className="w-full py-5 bg-slate-950 text-slate-400 hover:text-white rounded-2xl font-black uppercase tracking-[0.3em] active:scale-95 transition-all text-[9px] italic border border-slate-800 shadow-xl"
      >
        RELINQUISH CONTROL
      </button>
    </div>
  </div>
);
