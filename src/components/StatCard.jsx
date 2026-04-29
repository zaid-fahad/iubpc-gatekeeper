import React from 'react';

const StatCard = ({ label, value, color, char }) => (
    <div className={`${color} border border-slate-800 p-8 rounded-[2rem] shadow-xl relative overflow-hidden group hover:border-slate-600 transition-all`}>
        <p className="text-4xl font-black text-white italic relative z-10 leading-none tracking-tighter">{value}</p>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-3 relative z-10 italic">{label}</p>
        <div className="absolute -bottom-4 -right-4 text-white/5 text-8xl font-black italic leading-none pointer-events-none">{char}</div>
    </div>
);

export default StatCard;
