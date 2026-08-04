import React, { useState, useMemo } from 'react';
import { Clock, X } from 'lucide-react';

const CustomTimePicker = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Parse time value (e.g. "10:00" or "18:30")
  const { hour12, minute, period } = useMemo(() => {
    if (!value) return { hour12: 10, minute: '00', period: 'AM' };
    const parts = value.split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1] || '00';
    if (isNaN(h)) h = 10;
    const p = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return { hour12: h12, minute: m, period: p };
  }, [value]);

  const updateTime = (newH12, newMin, newPeriod) => {
    let h24 = newH12;
    if (newPeriod === 'PM' && newH12 < 12) h24 += 12;
    if (newPeriod === 'AM' && newH12 === 12) h24 = 0;
    const hStr = String(h24).padStart(2, '0');
    onChange(`${hStr}:${newMin}`);
  };

  const formattedDisplay = `${hour12}:${minute} ${period}`;

  const timePresets = [
    { label: '9 AM', time: '09:00' },
    { label: '10 AM', time: '10:00' },
    { label: '2 PM', time: '14:00' },
    { label: '6 PM', time: '18:00' },
  ];

  return (
    <div className="relative space-y-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-950 border border-slate-800 hover:border-emerald-500/50 p-3.5 pl-4 rounded-xl text-xs sm:text-sm text-white font-mono flex items-center justify-between transition-colors min-h-[48px]"
      >
        <div className="flex items-center gap-2.5">
          <Clock size={16} className="text-emerald-400" />
          <span className="font-bold">{formattedDisplay}</span>
        </div>
        <span className="text-[10px] uppercase font-sans tracking-wider text-slate-500 font-bold bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
          Change
        </span>
      </button>

      {/* QUICK PRESETS */}
      <div className="flex items-center gap-1.5 pt-0.5">
        <span className="text-[11px] text-slate-500 font-medium">Quick:</span>
        {timePresets.map(p => (
          <button
            key={p.time}
            type="button"
            onClick={() => onChange(p.time)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border ${value === p.time ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold' : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* TIME PICKER POPOVER */}
      {isOpen && (
        <div className="absolute top-14 left-0 z-[250] bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-4 w-64 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={14} className="text-emerald-400" /> Select Start Time
            </span>
            <button 
              type="button" 
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X size={14} />
            </button>
          </div>

          {/* HOURS & MINUTES GRID */}
          <div className="space-y-3">
            {/* AM / PM TOGGLE */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => updateTime(hour12, minute, 'AM')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${period === 'AM' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => updateTime(hour12, minute, 'PM')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${period === 'PM' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                PM
              </button>
            </div>

            {/* HOUR SELECTOR */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Hour</span>
              <div className="grid grid-cols-6 gap-1 text-center text-xs">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => updateTime(h, minute, period)}
                    className={`py-1.5 rounded-lg font-mono text-xs transition-all ${hour12 === h ? 'bg-emerald-600 text-white font-extrabold shadow-sm' : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800'}`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* MINUTE SELECTOR */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Minute</span>
              <div className="grid grid-cols-4 gap-1 text-center text-xs">
                {['00', '15', '30', '45'].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => updateTime(hour12, m, period)}
                    className={`py-1.5 rounded-lg font-mono text-xs transition-all ${minute === m ? 'bg-emerald-600 text-white font-extrabold shadow-sm' : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800'}`}
                  >
                    :{m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomTimePicker;
