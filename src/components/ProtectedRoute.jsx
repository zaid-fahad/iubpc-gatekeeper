import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import { ShieldAlert } from 'lucide-react';
import { signOut } from '../api/auth';

export const ProtectedRoute = ({ children, user, isAdmin, loading }) => {
  const location = useLocation();

  if (loading) return <LoadingSpinner />;
  
  if (!user) {
    // Save the current location to redirect back after login
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 italic animate-in fade-in duration-1000">
        <div className="bg-slate-900 border border-slate-800 p-12 rounded-[3.5rem] text-center max-w-sm space-y-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)] animate-in zoom-in duration-500 shadow-red-500/5">
          <div className="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center justify-center mx-auto text-red-500 shadow-[0_0_40px_rgba(239,68,68,0.1)]">
            <ShieldAlert size={48} className="animate-pulse" />
          </div>
          <div className="space-y-3">
              <h2 className="text-3xl font-black text-white uppercase italic leading-none tracking-tighter">ACCESS DENIED</h2>
              <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] leading-relaxed">Account <b>{user.email}</b><br/>DOES NOT HAVE PERMISSION TO ACCESS THIS SECTION</p>
          </div>
          <button 
            onClick={signOut} 
            className="w-full py-5 bg-slate-950 text-slate-400 hover:text-white rounded-2xl font-black uppercase tracking-[0.3em] active:scale-95 transition-all text-[9px] italic border border-slate-800 shadow-xl"
          >
            SIGN OUT
          </button>
        </div>
      </div>
    );
  }

  return children;
};
