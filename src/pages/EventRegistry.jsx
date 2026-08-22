import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchEvents as fetchEventsApi, createEvent, updateEvent, deleteEvent } from '../api/events';
import { 
  Plus, Calendar, BarChart3, Users, Search, Filter, 
  LayoutGrid, List, X, RefreshCw, CheckCircle2, ArrowRight, Tag, Eye,
  ChevronLeft, ChevronRight, Clock, Pencil, Trash2, ShieldCheck, ToggleLeft, ToggleRight, Award
} from 'lucide-react';
import { StatCard, CompactDatePicker, CustomTimePicker } from '../components';

const EventRegistry = ({ userRole }) => {
  const [events, setEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [newEvent, setNewEvent] = useState({ 
    title: '', 
    date: new Date().toISOString().split('T')[0], 
    time: '10:00',
    is_active: true,
    allow_on_spot: true
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

  const openCreateModal = () => {
    navigate('/events/new');
  };

  const openEditModal = (eventObj) => {
    navigate(`/events/${eventObj.id}/edit`);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title.trim()) {
      showToast("Please enter an event title.", 'error');
      return;
    }

    setProcessing(true);

    const formattedDate = newEvent.time 
      ? `${newEvent.date} ${newEvent.time}` 
      : newEvent.date;

    const payload = {
      title: newEvent.title.trim(),
      date: formattedDate,
      is_active: newEvent.is_active,
      allow_on_spot: newEvent.allow_on_spot
    };

    let result;
    if (editingEventId) {
      result = await updateEvent(editingEventId, payload);
    } else {
      result = await createEvent(payload);
    }

    if (!result.error) { 
      setShowEventModal(false); 
      setEditingEventId(null);
      setNewEvent({ 
        title: '', 
        date: new Date().toISOString().split('T')[0], 
        time: '10:00',
        is_active: true,
        allow_on_spot: true
      }); 
      await fetchEvents();
      showToast(editingEventId ? "Event updated successfully." : "Event created successfully.");
    } else {
      showToast("Action failed: " + result.error.message, 'error');
    }
    setProcessing(false);
  };

  const handleDeleteEvent = async (eventObj) => {
    if (!window.confirm(`Are you sure you want to delete "${eventObj.title}"? This cannot be undone.`)) {
      return;
    }
    setProcessing(true);
    const { error } = await deleteEvent(eventObj.id);
    if (!error) {
      await fetchEvents();
      showToast("Event deleted successfully.");
    } else {
      showToast("Delete failed: " + error.message, 'error');
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
              onClick={openCreateModal} 
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
                      onClick={() => navigate(`/events/${ev.id}/analytics`)} 
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
                  onClick={() => navigate(`/events/${ev.id}/gate`)} 
                  disabled={!ev.is_active}
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <span>Start Check-In Gate</span>
                  <ArrowRight size={14} />
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate(`/events/${ev.id}/kiosk`)}
                    disabled={!ev.is_active}
                    className="flex-1 py-2.5 px-3 bg-slate-950 border border-slate-800 hover:border-slate-700 text-blue-400 hover:text-blue-300 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-h-[44px]"
                  >
                    <span>Kiosk Mode</span>
                  </button>
                  <button 
                    onClick={() => navigate(`/events/${ev.id}/guests`)} 
                    className="flex-1 py-2.5 px-3 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 min-h-[44px]"
                  >
                    <Users size={13} />
                    <span>Attendees</span>
                  </button>
                  {isAdmin && (
                    <>
                      <button 
                        onClick={() => openEditModal(ev)} 
                        className="py-2.5 px-3 bg-slate-950 border border-slate-800 hover:border-blue-500/50 text-slate-300 hover:text-blue-400 rounded-lg text-xs font-medium transition-all flex items-center justify-center min-h-[44px]"
                        title="Edit Event"
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteEvent(ev)} 
                        className="py-2.5 px-3 bg-slate-950 border border-slate-800 hover:border-red-500/50 text-red-400 hover:text-red-300 rounded-lg text-xs font-medium transition-all flex items-center justify-center min-h-[44px]"
                        title="Delete Event"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
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
                      onClick={() => navigate(`/events/${ev.id}/gate`)}
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
                        onClick={() => navigate(`/events/${ev.id}/guests`)}
                        className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition-all min-h-[36px]"
                      >
                        Attendees
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => openEditModal(ev)}
                            className="p-2 bg-slate-950 border border-slate-800 hover:border-blue-500/50 text-slate-300 hover:text-blue-400 rounded-lg text-xs transition-all min-h-[36px]"
                            title="Edit Event"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(ev)}
                            className="p-2 bg-slate-950 border border-slate-800 hover:border-red-500/50 text-red-400 hover:text-red-300 rounded-lg text-xs transition-all min-h-[36px]"
                            title="Delete Event"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
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

      {/* CREATE / EDIT EVENT MODAL */}
      {showEventModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <form onSubmit={handleSaveEvent} className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-lg space-y-6 shadow-2xl text-left flex flex-col max-h-[92vh] overflow-y-auto">
            
            {/* MODAL HEADER */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5 tracking-tight">
                  <Calendar size={22} className="text-blue-500" />
                  {editingEventId ? 'Edit Event Details' : 'Create New Event'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">Configure event title, schedule date, start time, and kiosk settings.</p>
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

            {/* FORM INPUTS */}
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

              {/* KIOSK ON-SPOT REGISTRATION TOGGLE */}
              <div className="flex items-center justify-between bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                <div className="space-y-0.5">
                  <span className="text-xs sm:text-sm text-slate-200 font-bold block flex items-center gap-1.5">
                    <Users size={14} className="text-purple-400" />
                    Kiosk On-Spot Registration
                  </span>
                  <span className={`text-[11px] sm:text-xs font-semibold ${newEvent.allow_on_spot ? 'text-purple-400' : 'text-slate-400'}`}>
                    {newEvent.allow_on_spot ? 'Enabled — Guests can register on kiosk' : 'Disabled — Only pre-registered list permitted'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setNewEvent(prev => ({ ...prev, allow_on_spot: !prev.allow_on_spot }))}
                  className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${newEvent.allow_on_spot ? 'bg-purple-600' : 'bg-slate-800'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${newEvent.allow_on_spot ? 'translate-x-7' : 'translate-x-0'}`}
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
                <span>{editingEventId ? 'Save Changes' : 'Publish Event'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default EventRegistry;
