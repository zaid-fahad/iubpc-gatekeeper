import React, { useState, useEffect } from 'react';
import { signUpAdmin, signInAdmin, resetPassword, updateUserPassword } from '../api/auth';
import { 
  Mail, Lock, Clock, ArrowRight, Users, CheckCircle2, KeyRound
} from 'lucide-react';

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot' | 'reset'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    // Check if URL hash or search params contain type=recovery or password reset token
    const hash = window.location.hash;
    const search = window.location.search;
    if (hash.includes('type=recovery') || search.includes('type=recovery')) {
      setMode('reset');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (mode === 'signup') {
        const { error } = await signUpAdmin(email, password, fullName);
        if (error) throw error;
        alert("Account created! Log in once you've been added to the 'admins' table.");
        setMode('login');
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) throw error;
        setSuccessMsg(`Password reset link sent to ${email}. Please check your email inbox!`);
      } else if (mode === 'reset') {
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }
        const { error } = await updateUserPassword(password);
        if (error) throw error;
        setSuccessMsg("Password updated successfully! Redirecting to portals...");
        setTimeout(() => {
          window.location.href = '/events';
        }, 1500);
      } else {
        const { error } = await signInAdmin(email, password);
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 animate-in fade-in">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex p-5 rounded-3xl bg-slate-900/50 border border-slate-800 shadow-lg">
            <img src="/transparent_logo.webp" alt="Logo" className="w-20 h-20 object-contain animate-pulse" />
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">IUBPC Gatekeeper</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
            {mode === 'reset' ? 'Set New Password' : mode === 'forgot' ? 'Reset Password Credentials' : 'Event Attendee Tracking'}
          </p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-800 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden text-center">
          {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[10px] font-black uppercase">{error}</div>}
          {successMsg && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-[11px] font-bold flex items-center gap-2 text-left">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            {mode === 'signup' && (
              <div className="relative animate-in slide-in-from-top-2 duration-300">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input type="text" placeholder="FULL NAME" className="w-full px-6 pl-12 py-4.5 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-green-500 text-white outline-none transition-all placeholder:text-slate-700 font-bold text-xs" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
            )}

            {mode !== 'reset' && (
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input type="email" placeholder="EMAIL ADDRESS" className="w-full px-6 pl-12 py-4.5 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-green-500 text-white outline-none transition-all placeholder:text-slate-700 font-bold text-xs" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  type="password" 
                  placeholder={mode === 'reset' ? "NEW PASSWORD (MIN 6 CHARS)" : "PASSWORD"} 
                  className="w-full px-6 pl-12 py-4.5 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-green-500 text-white outline-none transition-all placeholder:text-slate-700 font-bold text-xs" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
              </div>
            )}

            <button disabled={loading} className="w-full py-4.5 bg-green-500 text-slate-950 font-black rounded-2xl shadow-lg active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest transition-transform text-xs">
              {loading ? <Clock className="animate-spin" size={20}/> : (
                <>
                  {mode === 'signup' ? 'REGISTER' : mode === 'forgot' ? 'SEND RESET LINK' : mode === 'reset' ? 'UPDATE PASSWORD' : 'LOGIN'} 
                  <ArrowRight size={18}/>
                </>
              )}
            </button>

            <div className="space-y-2 pt-2 text-center">
              {mode === 'login' && (
                <>
                  <button type="button" onClick={() => { setMode('forgot'); setError(''); setSuccessMsg(''); }} className="block w-full text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:text-slate-300 transition-colors">
                    Forgot Password?
                  </button>
                  <button type="button" onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); }} className="block w-full text-slate-600 text-[9px] font-black uppercase tracking-widest hover:text-white transition-colors">
                    Register New Account
                  </button>
                </>
              )}

              {(mode === 'signup' || mode === 'forgot' || mode === 'reset') && (
                <button type="button" onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }} className="w-full text-slate-600 text-[9px] font-black uppercase tracking-widest hover:text-white transition-colors">
                  Back to Login
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
