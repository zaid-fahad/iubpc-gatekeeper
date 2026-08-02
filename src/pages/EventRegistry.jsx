import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchEvents as fetchEventsApi, createEvent } from '../api/events';
import { 
  Plus, Calendar, BarChart3, Users, Search, Filter, 
  LayoutGrid, List, X, RefreshCw, CheckCircle2, ArrowRight, Tag, Eye, ToggleLeft, ToggleRight
} from 'lucide-react';
import StatCard from '../components/StatCard';

const EventRegistry = ({ userRole }) => {
  const [events, setEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ 
    title: '', 
    date: new Date().toISOString().split('T')[0], 
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
    const { error } = await createEvent({
      title: newEvent.title.trim(),
      date: newEvent.date,
      is_active: newEvent.is_active
    });

    if (!error) { 
      setShowEventModal(false); 
      setNewEvent({ 
        title: '', 
        date: new Date().toISOString().split('T')[0], 
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

      {/* UPGRADED CREATE EVENT MODAL WITH LIVE PREVIEW */}
      {showEventModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <form onSubmit={handleCreateEvent} className="relative bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 w-full max-w-lg space-y-5 shadow-2xl text-left flex flex-col max-h-[90vh] overflow-y-auto">
            
            {/* MODAL HEADER */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                  <Calendar size={18} className="text-blue-500" />
                  Create New Event
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Set up event portal details and gate status.</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowEventModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* FORM INPUTS */}
            <div className="space-y-4 text-xs">
              {/* EVENT NAME */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                  <Tag size={13} className="text-slate-400" />
                  Event Name
                </label>
                <input 
                  value={newEvent.title} 
                  onChange={e => setNewEvent({...newEvent, title: e.target.value})} 
                  placeholder="e.g. Annual Programming Contest 2026" 
                  required 
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-xs text-white outline-none focus:border-blue-500 transition-colors min-h-[44px]" 
                />
              </div>

              {/* EVENT DATE */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-400" />
                  Event Date
                </label>
                <input 
                  type="date" 
                  value={newEvent.date} 
                  onChange={e => setNewEvent({...newEvent, date: e.target.value})} 
                  required 
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-xs text-white outline-none focus:border-blue-500 transition-colors min-h-[44px]" 
                />
              </div>

              {/* INITIAL GATE STATUS TOGGLE */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-medium">Initial Gate Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewEvent({...newEvent, is_active: true})}
                    className={`p-3 rounded-xl border text-left transition-all ${newEvent.is_active ? 'bg-green-500/10 border-green-500/40 text-green-400 font-semibold' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs">Active Gate</span>
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-normal">Check-in portal open immediately.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewEvent({...newEvent, is_active: false})}
                    className={`p-3 rounded-xl border text-left transition-all ${!newEvent.is_active ? 'bg-slate-800 border-slate-700 text-white font-semibold' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs">Offline / Draft</span>
                      <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-normal">Gate portal kept inactive for now.</p>
                  </button>
                </div>
              </div>

              {/* LIVE CARD PREVIEW SECTION */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                  <Eye size={13} className="text-blue-500" />
                  <span className="font-medium">Live Event Card Preview</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${newEvent.is_active ? 'bg-green-500' : 'bg-slate-500'}`}></span>
                      <span className={`text-[11px] ${newEvent.is_active ? 'text-green-400 font-medium' : 'text-slate-400'}`}>
                        {newEvent.is_active ? 'Active Gate' : 'Offline'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">PREVIEW</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {newEvent.title.trim() || 'Untitled Event'}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{newEvent.date}</p>
                  </div>
                  <div className="pt-1">
                    <button 
                      type="button"
                      disabled={!newEvent.is_active}
                      className="w-full py-2 px-3 bg-green-600 text-white rounded-lg text-xs font-medium disabled:opacity-40 disabled:bg-slate-800 disabled:text-slate-500 flex items-center justify-center gap-1.5"
                    >
                      <span>Start Check-In Gate</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button 
                type="button"
                onClick={() => setShowEventModal(false)}
                className="px-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-all min-h-[44px]"
              >
                Cancel
              </button>
              <button 
                disabled={processing}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-xs transition-all shadow-md flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                {processing ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={14} />}
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
