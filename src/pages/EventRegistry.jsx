import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchEvents as fetchEventsApi, createEvent } from '../api/events';
import { 
  PlusCircle, BarChart3, Zap, X, Calendar
} from 'lucide-react';

const EventRegistry = ({ userRole }) => {
  const [events, setEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '' });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isAdmin = userRole === 'admin';

  const fetchEvents = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    const { data } = await fetchEventsApi();
    setEvents(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchEvents();
    };
    init();
  }, [fetchEvents]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    const { error } = await createEvent(newEvent);
    if (!error) { 
      setShowEventModal(false); 
      setNewEvent({ title: '', date: '' }); 
      fetchEvents();
    } else alert("Creation Failure: " + error.message);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Events List</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Manage and monitor all active events</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowEventModal(true)} 
            className="px-6 py-3 bg-green-500 text-slate-950 rounded-xl font-black text-[10px] flex items-center gap-2 shadow-2xl shadow-green-500/20 active:scale-95 transition-all"
          >
            <PlusCircle size={16}/> <span className="uppercase tracking-widest">New Event</span>
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        {events.map(ev => (
          <div key={ev.id} className="bg-slate-900/80 border border-slate-800 p-8 rounded-[2rem] space-y-6 shadow-2xl relative overflow-hidden group hover:border-green-500/30 transition-all duration-500">
            <div className="flex justify-between items-start relative z-10">
              <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${ev.is_active ? 'bg-green-500/10 text-green-500 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-slate-950 text-slate-700 border-slate-800 opacity-50'}`}>{ev.is_active ? 'ACTIVE' : 'OFFLINE'}</span>
              {isAdmin && <button onClick={() => navigate(`/event/${ev.id}/analytics`)} className="p-2 bg-slate-950 rounded-lg text-slate-600 hover:text-blue-400 transition-all active:scale-90 shadow-xl"><BarChart3 size={18}/></button>}
            </div>
            <div className="space-y-1 relative z-10">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none group-hover:text-green-400 transition-colors duration-500 italic">{ev.title}</h3>
              <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.2em]">{ev.date}</p>
            </div>
            <div className="pt-2 flex flex-col gap-2 relative z-10">
              <button onClick={() => navigate(`/event/${ev.id}/gate`)} className="w-full py-4 bg-green-500 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all shadow-lg shadow-green-500/5 border-b-4 border-green-700">START CHECK-IN</button>
              <div className="flex gap-2">
                <button onClick={() => navigate(`/event/${ev.id}/guests`)} className="flex-1 py-3 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg">ATTENDEES</button>
                {isAdmin && <button onClick={() => navigate(`/event/${ev.id}/analytics`)} className="flex-1 py-3 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg">ANALYTICS</button>}
              </div>
            </div>
            <Zap className="absolute -top-10 -left-10 opacity-0 group-hover:opacity-[0.03] text-green-500 transition-all duration-1000 group-hover:rotate-12 pointer-events-none" size={250} />
          </div>
        ))}
        {events.length === 0 && !loading && (
          <div className="md:col-span-2 p-24 border-2 border-dashed border-slate-900 rounded-[4rem] text-center">
            <Calendar size={64} className="mx-auto text-slate-900 mb-6" />
            <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-sm">No events found. Create a new event to begin.</p>
          </div>
        )}
      </div>

      {/* EVENT CREATION MODAL */}
      {showEventModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <form onSubmit={handleCreateEvent} className="relative bg-slate-900 border border-slate-800 rounded-[3rem] p-12 w-full max-w-lg space-y-8 shadow-2xl text-left">
            <div className="flex justify-between items-center"><h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none italic">New Event</h2><X className="text-slate-600 cursor-pointer hover:text-white transition-colors" onClick={() => setShowEventModal(false)} /></div>
            <div className="space-y-5 text-left">
              <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-1">Event Name</label><input value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} placeholder="e.g. Annual Gala 2026" required className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-sm font-bold text-white outline-none focus:ring-1 focus:ring-green-500 shadow-inner uppercase tracking-widest" /></div>
              <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-1">Event Date</label><input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} required className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-sm text-white font-bold outline-none shadow-inner" /></div>
            </div>
            <button className="w-full py-5 bg-green-500 text-slate-950 font-black rounded-2xl uppercase tracking-widest shadow-2xl shadow-green-500/20 active:scale-95 transition-all border-b-4 border-green-700">CREATE EVENT</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default EventRegistry;
