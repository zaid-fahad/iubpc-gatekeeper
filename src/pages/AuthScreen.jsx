import React, { useState } from 'react';
import { signUpAdmin, signInAdmin } from '../api/auth';
import { 
  ShieldCheck, Mail, Lock, Clock, ArrowRight, Users 
} from 'lucide-react';

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        const { error } = await signUpAdmin(email, password, fullName);
        if (error) throw error;
        alert("Account created! Log in once you've been added to the 'admins' table.");
        setIsSignUp(false);
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 italic animate-in fade-in">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex p-5 rounded-3xl bg-green-500/10 border border-green-500/20 shadow-lg">
            <ShieldCheck className="w-10 h-10 text-green-400 animate-pulse" />
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">Gate Keeper</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Event Attendee Tracking</p>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-800 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden text-center">
          {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[10px] font-black uppercase">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            {isSignUp && (
              <div className="relative animate-in slide-in-from-top-2 duration-300">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input type="text" placeholder="FULL NAME" className="w-full px-6 pl-12 py-4.5 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-green-500 text-white outline-none transition-all placeholder:text-slate-700 font-bold uppercase" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <input type="email" placeholder="EMAIL ADDRESS" className="w-full px-6 pl-12 py-4.5 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-green-500 text-white outline-none transition-all placeholder:text-slate-700 font-bold uppercase" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <input type="password" placeholder="PASSWORD" className="w-full px-6 pl-12 py-4.5 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-green-500 text-white outline-none transition-all placeholder:text-slate-700 font-bold" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button disabled={loading} className="w-full py-4.5 bg-green-500 text-slate-950 font-black rounded-2xl shadow-lg active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest italic transition-transform">
              {loading ? <Clock className="animate-spin" size={20}/> : <>{isSignUp ? 'REGISTER' : 'LOGIN'} <ArrowRight size={18}/></>}
            </button>
            <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="w-full text-slate-600 text-[9px] font-black uppercase tracking-widest hover:text-white transition-colors text-center">
              {isSignUp ? "Authenticate Credentials" : "Register New Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
