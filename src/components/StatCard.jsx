import React from 'react';

const StatCard = ({ label, value, color = 'bg-slate-900', char = 'S' }) => {
  return (
    <div className={`${color} border border-slate-800 p-7 sm:p-8 rounded-[2rem] shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all`}>
      <p className="text-3xl sm:text-4xl font-black text-white italic relative z-10 leading-none tracking-tighter">
        {value}
      </p>
      <p className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest mt-3 relative z-10 italic">
        {label}
      </p>
      {/* BACKGROUND WATERMARK LETTER (VISIBLE IN BOTH LIGHT & DARK MODE) */}
      <div className="absolute -bottom-4 -right-4 text-white/10 text-8xl font-black italic leading-none pointer-events-none select-none font-mono stat-card-watermark">
        {char}
      </div>
    </div>
  );
};

export default StatCard;
