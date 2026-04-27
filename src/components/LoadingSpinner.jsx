import React from 'react';
import { Zap } from 'lucide-react';

const LoadingSpinner = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-6 text-center p-6 italic animate-in fade-in">
    <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-b-2 border-green-500 animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-t-2 border-purple-500 animate-spin-slow"></div>
        <Zap className="absolute inset-0 m-auto text-green-500 animate-pulse" size={28} />
    </div>
    <div className="space-y-1">
        <p className="text-slate-400 font-black text-xs uppercase tracking-[0.5em]">Synchronizing</p>
        <p className="text-slate-800 text-[8px] uppercase tracking-widest font-black">Secure Terminal v4.0</p>
    </div>
  </div>
);

export default LoadingSpinner;
