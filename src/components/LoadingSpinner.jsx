import React from 'react';
import { getPortalSettings } from '../utils/portalSettings';

const LoadingSpinner = ({ message = "Loading", inline = false }) => {
  const settings = getPortalSettings();

  if (inline) {
    return (
      <div className="flex items-center justify-center gap-2.5 p-4 text-slate-400 font-mono text-xs">
        <div className="w-4 h-4 rounded-full border-2 border-slate-700 border-t-purple-500 animate-spin shrink-0"></div>
        <span className="font-semibold">{message}...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center space-y-5 p-6 text-center transition-colors bg-slate-950 text-white">
      
      {/* MINIMAL CLEAN BRAND LOGO & ELEGANT SPINNER */}
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center p-2.5 bg-slate-900 border border-slate-800/80 shadow-sm">
          <img 
            src={settings?.logoUrl || '/transparent_logo.webp'} 
            alt="Logo" 
            className="w-full h-full object-contain"
            onError={(e) => { e.target.src = '/transparent_logo.webp'; }}
          />
        </div>
        <div className="absolute -inset-1.5 rounded-3xl border-2 border-slate-800 border-t-purple-500 animate-spin"></div>
      </div>

      {/* MINIMAL CLEAN TYPOGRAPHY */}
      <div className="space-y-1">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white">
          {settings?.portalTitle || 'IUBPC Gatekeeper'}
        </h2>
        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.2em] flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
          <span>{message}</span>
        </p>
      </div>

    </div>
  );
};

export default LoadingSpinner;
