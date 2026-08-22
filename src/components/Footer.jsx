import React from 'react';

const Footer = ({ className = "" }) => {
  return (
    <footer className={`w-full p-8 border-t border-slate-800/50 mt-auto bg-slate-900/30 backdrop-blur-xl ${className}`}>
      <div className="flex flex-col items-center gap-4 transition-all">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <img src="/transparent_logo.webp" alt="Logo" className="w-full h-full object-contain shadow-lg" />
          </div>
          <span className="text-sm font-black uppercase tracking-[0.4em] text-white">
            IUBPC Gatekeeper
          </span>
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
          powered by IUBPC Dev Team — Developer: <span className="text-green-400 font-black">Zaid Fahad</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
