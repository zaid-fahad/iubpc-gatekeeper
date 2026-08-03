import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchEvents as fetchEventsApi, createEvent } from '../api/events';
import { 
  Plus, Calendar, BarChart3, Users, Search, Filter, 
  LayoutGrid, List, X, RefreshCw, CheckCircle2, ArrowRight, Tag, Eye,
  ChevronLeft, ChevronRight, Clock
} from 'lucide-react';
import StatCard from '../components/StatCard';

// Small & Compact Custom DatePicker Component
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

// Custom Interactive Time Picker Component
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

const EventRegistry = ({ userRole }) => {
  const [events, setEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ 
    title: '', 
    date: new Date().toISOString().split('T')[0], 
    time: '10:00',
    is_active: true 
  });
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'offline'
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
  const [toast, setToast] = useState(null);
  const [processing, setProcessing] = useState(false);

  const navigate = useNavigate();
  const isAdmin = userRole === 'admin';

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const { data } = await fetchEventsApi();
    setEvents(data || []);
    setLoading(false);
  }, []);

  const handleRefresh = async () => {
    setFetching(true);
    await fetchEvents();
    setFetching(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Listen for Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowEventModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);



  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title.trim()) {
      showToast("Please enter an event title.", 'error');
      return;
    }

    setProcessing(true);

    const formattedDate = newEvent.time 
      ? `${newEvent.date} ${newEvent.time}` 
      : newEvent.date;

    const { error } = await createEvent({
      title: newEvent.title.trim(),
      date: formattedDate,
      is_active: newEvent.is_active
    });

    if (!error) { 
      setShowEventModal(false); 
      setNewEvent({ 
        title: '', 
        date: new Date().toISOString().split('T')[0], 
        time: '10:00',
        is_active: true 
      }); 
      await fetchEvents();
      showToast("Event created successfully.");
    } else {
      showToast("Creation failed: " + error.message, 'error');
    }
    setProcessing(false);
  };

  const stats = useMemo(() => {
    return {
      total: events.length,
      active: events.filter(e => e.is_active).length,
      offline: events.filter(e => !e.is_active).length
    };
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchesSearch = e.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            e.date?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
                            (statusFilter === 'active' && e.is_active) || 
                            (statusFilter === 'offline' && !e.is_active);
      return matchesSearch && matchesStatus;
    });
  }, [events, searchTerm, statusFilter]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-16 text-slate-100">
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-[300] px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-3 border ${toast.type === 'success' ? 'bg-slate-900 border-green-500/40 text-green-400' : 'bg-slate-900 border-red-500/40 text-red-400'}`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-slate-500 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 sm:pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Calendar className="text-blue-500" size={26} />
            Events
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Manage event portals, check-in gates, and attendee lists.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={handleRefresh}
            disabled={fetching}
            className="p-2.5 sm:px-3.5 sm:py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-2 transition-all disabled:opacity-50 min-h-[44px]"
            title="Refresh Events"
          >
            <RefreshCw size={14} className={fetching ? "animate-spin text-blue-500" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {isAdmin && (
            <button 
              onClick={() => setShowEventModal(true)} 
              className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all shadow-md min-h-[44px]"
            >
              <Plus size={15}/>
              <span>Create Event</span>
            </button>
          )}
        </div>
      </header>

      {/* STATS SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Total Events" value={stats.total} color="bg-slate-900/40" char="E" />
        <StatCard label="Active Portals" value={stats.active} color="bg-green-500/5" char="A" />
        <StatCard label="Offline Events" value={stats.offline} color="bg-slate-900/40" char="O" />
      </div>

      {/* CONTROLS BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/40 border border-slate-800 p-3 sm:p-4 rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
          <input 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="w-full bg-slate-950 border border-slate-800 p-2.5 pl-9 rounded-lg text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500 transition-colors min-h-[44px]" 
            placeholder="Search events by title or date..." 
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5">
          {/* STATUS FILTER */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {["all", "active", "offline"].map(status => (
              <button 
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded text-xs capitalize transition-all min-h-[36px] ${statusFilter === status ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* VIEW MODE TOGGLE */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 sm:p-2 rounded transition-all min-h-[36px] min-w-[36px] flex items-center justify-center ${viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-1.5 sm:p-2 rounded transition-all min-h-[36px] min-w-[36px] flex items-center justify-center ${viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Table List View"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* EVENTS DISPLAY AREA */}
      {viewMode === 'grid' ? (
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredEvents.map(ev => (
            <div 
              key={ev.id} 
              className="bg-slate-900/60 border border-slate-800 p-5 sm:p-6 rounded-xl space-y-4 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${ev.is_active ? 'bg-green-500' : 'bg-slate-500'}`}></span>
                    <span className={`text-xs font-medium ${ev.is_active ? 'text-green-400' : 'text-slate-400'}`}>
                      {ev.is_active ? 'Active Gate' : 'Offline'}
                    </span>
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => navigate(`/event/${ev.id}/analytics`)} 
                      className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                      title="View Analytics"
                    >
                      <BarChart3 size={16}/>
                    </button>
                  )}
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {ev.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-1 font-mono">
                    <Calendar size={13} className="text-slate-500" />
                    <span>{ev.date}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-2 border-t border-slate-800/80">
                <button 
                  onClick={() => navigate(`/event/${ev.id}/gate`)} 
                  disabled={!ev.is_active}
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <span>Start Check-In Gate</span>
                  <ArrowRight size={14} />
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate(`/event/${ev.id}/kiosk`)}
                    disabled={!ev.is_active}
                    className="flex-1 py-2.5 px-3 bg-slate-950 border border-slate-800 hover:border-slate-700 text-blue-400 hover:text-blue-300 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-h-[44px]"
                  >
                    <span>Kiosk Mode</span>
                  </button>
                  <button 
                    onClick={() => navigate(`/event/${ev.id}/guests`)} 
                    className="flex-1 py-2.5 px-3 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 min-h-[44px]"
                  >
                    <Users size={13} />
                    <span>Attendees</span>
                  </button>
                  {isAdmin && (
                    <button 
                      onClick={() => navigate(`/event/${ev.id}/analytics`)} 
                      className="flex-1 py-2.5 px-3 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 min-h-[44px]"
                    >
                      <BarChart3 size={13} />
                      <span>Analytics</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-xs font-medium text-slate-400">
                <th className="p-3.5">Event Name</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Gate Portal</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs font-medium">
              {filteredEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3.5 font-semibold text-white">{ev.title}</td>
                  <td className="p-3.5 text-slate-300 font-mono">{ev.date}</td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${ev.is_active ? 'bg-green-500' : 'bg-slate-500'}`}></span>
                      <span className={ev.is_active ? 'text-green-400' : 'text-slate-400'}>
                        {ev.is_active ? 'Active' : 'Offline'}
                      </span>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <button
                      onClick={() => navigate(`/event/${ev.id}/gate`)}
                      disabled={!ev.is_active}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed inline-flex items-center gap-1 min-h-[36px]"
                    >
                      <span>Check-In Gate</span>
                      <ArrowRight size={12} />
                    </button>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => navigate(`/event/${ev.id}/guests`)}
                        className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition-all min-h-[36px]"
                      >
                        Attendees
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => navigate(`/event/${ev.id}/analytics`)}
                          className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition-all min-h-[36px]"
                        >
                          Analytics
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* EMPTY STATE */}
      {filteredEvents.length === 0 && !loading && (
        <div className="p-8 sm:p-12 border border-dashed border-slate-800 rounded-xl text-center space-y-2">
          <Calendar size={36} className="mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-semibold text-slate-300">No events found</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search or status filter parameters.' : 'Create your first event to start check-in gates.'}
          </p>
        </div>
      )}

      {/* UPGRADED CREATE EVENT MODAL WITH DESKTOP TYPOGRAPHY, SINGLE DATEPICKER & TIME FIELD */}
      {showEventModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <form onSubmit={handleCreateEvent} className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-lg space-y-6 shadow-2xl text-left flex flex-col max-h-[92vh] overflow-y-auto">
            
            {/* MODAL HEADER */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5 tracking-tight">
                  <Calendar size={22} className="text-blue-500" />
                  Create New Event
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">Configure event title, schedule date, start time, and gate status.</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowEventModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                title="Close Modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM INPUTS WITH ENHANCED DESKTOP TYPOGRAPHY */}
            <div className="space-y-5 text-xs sm:text-sm">
              
              {/* EVENT NAME */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm text-slate-200 font-bold flex items-center gap-2">
                  <Tag size={15} className="text-blue-400" />
                  Event Title *
                </label>
                <input 
                  value={newEvent.title} 
                  onChange={e => setNewEvent({...newEvent, title: e.target.value})} 
                  placeholder="e.g. Annual Programming Contest 2026" 
                  required 
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 p-3.5 sm:p-4 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-600 outline-none transition-colors min-h-[48px]" 
                />
              </div>

              {/* DATE & TIME GRID ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* SINGLE DATEPICKER */}
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm text-slate-200 font-bold flex items-center gap-2">
                    <Calendar size={15} className="text-purple-400" />
                    Event Date *
                  </label>
                  <CompactDatePicker 
                    value={newEvent.date} 
                    onChange={(newDate) => setNewEvent({ ...newEvent, date: newDate })} 
                  />
                </div>

                {/* EVENT START TIME FIELD */}
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm text-slate-200 font-bold flex items-center gap-2">
                    <Clock size={15} className="text-emerald-400" />
                    Start Time *
                  </label>
                  <CustomTimePicker 
                    value={newEvent.time} 
                    onChange={(newTime) => setNewEvent({ ...newEvent, time: newTime })} 
                  />
                </div>
              </div>

              {/* INITIAL GATE STATUS SWITCH TOGGLE */}
              <div className="flex items-center justify-between bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                <div className="space-y-0.5">
                  <span className="text-xs sm:text-sm text-slate-200 font-bold block">Gate Status</span>
                  <span className={`text-[11px] sm:text-xs font-semibold ${newEvent.is_active ? 'text-green-400' : 'text-slate-400'}`}>
                    {newEvent.is_active ? 'Active — Check-in open immediately' : 'Offline — Gate kept inactive'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setNewEvent(prev => ({ ...prev, is_active: !prev.is_active }))}
                  className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${newEvent.is_active ? 'bg-green-500' : 'bg-slate-800'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${newEvent.is_active ? 'translate-x-7' : 'translate-x-0'}`}
                  />
                </button>
              </div>

              {/* LIVE EVENT CARD PREVIEW */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-slate-400 text-xs sm:text-sm">
                  <Eye size={15} className="text-blue-500" />
                  <span className="font-semibold">Live Event Preview</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${newEvent.is_active ? 'bg-green-500' : 'bg-slate-500'}`}></span>
                      <span className={newEvent.is_active ? 'text-green-400 font-semibold' : 'text-slate-400'}>
                        {newEvent.is_active ? 'Active Gate' : 'Offline'}
                      </span>
                    </div>
                    <span className="text-slate-400 font-mono text-xs flex items-center gap-1">
                      <Clock size={13} className="text-slate-500" />
                      {newEvent.date} at {newEvent.time || '10:00'}
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-extrabold text-white truncate">
                    {newEvent.title.trim() || 'Untitled Event'}
                  </h4>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button 
                type="button"
                onClick={() => setShowEventModal(false)}
                className="px-5 py-3 bg-slate-950 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[44px]"
              >
                Cancel
              </button>
              <button 
                disabled={processing}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 min-h-[44px]"
              >
                {processing ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={16} />}
                <span>Publish Event</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default EventRegistry;
