import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const GateActBtn = ({ label, active, onClick, icon, color }) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-300 active:scale-[0.97] ${active ? 'border-transparent shadow-xl' : 'bg-slate-950/40 border-slate-800/80 text-slate-500'}`} 
    style={active ? { backgroundColor: color, color: '#000' } : {}}
  >
    <div className="flex items-center gap-4">
      <div className={`p-2 rounded-xl ${active ? 'bg-black/10' : 'bg-slate-800'}`}>{icon}</div>
      <span className="font-black text-sm tracking-tight uppercase italic">{label}</span>
    </div>
    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${active ? 'border-black/20 bg-black/10' : 'border-slate-800'}`}>
        {active && <CheckCircle2 size={16}/>}
    </div>
  </button>
);

export default GateActBtn;
