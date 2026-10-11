import React from 'react';

const Footer = ({ className = "" }) => {
  return (
    <footer className={`w-full py-8 px-6 sm:px-8 border-t border-slate-800/50 mt-auto bg-slate-900/30 backdrop-blur-xl transition-all ${className}`}>
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        
        {/* PROMOTIONAL BRAND LOGO & TITLE */}
        <div className="flex flex-col items-center justify-center gap-2.5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shrink-0 transition-transform hover:scale-105 duration-300">
            <img src="/transparent_logo.webp" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-black uppercase tracking-[0.35em] text-white text-xs sm:text-sm footer-brand-title">
            IUBPC Gatekeeper
          </span>
        </div>

        {/* CREDITS & COPYRIGHT */}
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">
          Powered by IUBPC Dev Team <span className="text-purple-400/60 mx-1.5 font-black">&bull;</span> Dev: <strong className="text-emerald-400 font-black">Zaid Fahad</strong>
        </p>

      </div>
    </footer>
  );
};

export default Footer;
