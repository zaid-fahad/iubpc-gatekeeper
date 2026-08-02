import React, { useState } from 'react';
import { X, Settings, Shield, Lock, Trash2, RefreshCw } from 'lucide-react';

export const ExampleGlassModal = ({ isOpen, onClose, item }) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-blue-500/10 via-slate-900 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Settings size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight italic">
                {item.title || 'Item Settings'}
              </h3>
              <p className="text-slate-400 font-mono text-xs">{item.subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-white rounded-xl bg-slate-950/60 border border-slate-800">
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-2">
            <span className="text-xs font-black uppercase text-slate-200 tracking-wider">Configuration</span>
            <p className="text-[10px] text-slate-400">Modify properties for this item using high-contrast controls.</p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button onClick={onClose} className="px-5 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
