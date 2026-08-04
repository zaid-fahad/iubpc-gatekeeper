import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const CompactDatePicker = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedDateObj = useMemo(() => {
    if (!value) return new Date();
    const parts = value.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    return new Date();
  }, [value]);

  const [viewDate, setViewDate] = useState(selectedDateObj);

  useEffect(() => {
    setViewDate(selectedDateObj);
  }, [selectedDateObj]);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleSelectDay = (day) => {
    const year = viewDate.getFullYear();
    const month = String(viewDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    onChange(`${year}-${month}-${dayStr}`);
    setIsOpen(false);
  };

  const setOffsetDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    onChange(`${year}-${month}-${dayStr}`);
    setViewDate(d);
    setIsOpen(false);
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const formattedDisplay = useMemo(() => {
    return selectedDateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, [selectedDateObj]);

  return (
    <div className="relative space-y-2">
      {/* SINGLE CLEAN DATEPICKER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-950 border border-slate-800 hover:border-purple-500/50 p-3.5 pl-4 rounded-xl text-xs sm:text-sm text-white font-mono flex items-center justify-between transition-colors min-h-[48px]"
      >
        <div className="flex items-center gap-2.5">
          <Calendar size={16} className="text-purple-400" />
          <span>{formattedDisplay}</span>
        </div>
        <span className="text-[10px] uppercase font-sans tracking-wider text-slate-500 font-bold bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
          Change
        </span>
      </button>

      {/* QUICK PRESET BUTTONS */}
      <div className="flex items-center gap-1.5 pt-0.5">
        <span className="text-[11px] text-slate-500 font-medium">Preset:</span>
        <button
          type="button"
          onClick={() => setOffsetDate(0)}
          className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-medium transition-all"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => setOffsetDate(1)}
          className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-medium transition-all"
        >
          Tomorrow
        </button>
        <button
          type="button"
          onClick={() => setOffsetDate(7)}
          className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-medium transition-all"
        >
          +7 Days
        </button>
      </div>

      {/* COMPACT POPOVER CALENDAR */}
      {isOpen && (
        <div className="absolute top-14 left-0 z-[250] bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3 w-64 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <button 
              type="button" 
              onClick={handlePrevMonth}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {monthNames[month]} {year}
            </span>
            <button 
              type="button" 
              onClick={handleNextMonth}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-slate-500">
            <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <span key={`empty-${i}`} className="p-1"></span>
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isSelected = 
                selectedDateObj.getFullYear() === year && 
                selectedDateObj.getMonth() === month && 
                selectedDateObj.getDate() === dayNum;

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`p-1.5 rounded-lg text-xs transition-all ${isSelected ? 'bg-purple-600 text-white font-extrabold shadow-sm' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompactDatePicker;
