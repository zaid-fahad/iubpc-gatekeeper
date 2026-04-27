import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from '../api/auth';
import { fetchEvents as fetchEventsApi, createEvent } from '../api/events';
import { 
  ShieldCheck, LogOut, PlusCircle, BarChart3, Zap, X 
} from 'lucide-react';

const AdminDashboard = () => {
  const [events, setEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '' });
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const fetchEvents = async () => {
      const { data } = await fetchEventsApi();
      if (isMounted) {
        setEvents(data || []);
      }
    };
    fetchEvents();
    return () => { isMounted = false; };
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const { error } = await createEvent(newEvent);
    if (!error) { 
      setShowEventModal(false); 
      setNewEvent({ title: '', date: '' }); 
      // Re-fetch events after creation
      const { data } = await fetchEventsApi();
      setEvents(data || []);
    }
    else alert("Creation Failure: " + error.message);
  };

  return (
    <div className="max-w-4xl mx-auto min-h-screen pb-32 italic">
      <header className="px-6 py-10 flex items-center justify-between sticky top-0 bg-slate-950/50 backdrop-blur-xl z-50 animate-in fade-in duration-700 italic">
        <div className="flex items-center gap-5 italic leading-none">
          <div className="w-14 h-14 bg-green-500 rounded-[1.8rem] flex items-center justify-center text-slate-950 shadow-[0_0_20px_rgba(34,197,94,0.3)] italic"><ShieldCheck size={32}/></div>
          <div><h1 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none italic">IUBPC</h1><p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mt-2 italic leading-none">Event Attendee Tracker</p></div>
        </div>
        <button onClick={() => signOut()} className="p-4 bg-slate-900 rounded-[1.5rem] border border-slate-800 text-red-500 hover:bg-red-500/10 transition-all active:scale-90 shadow-xl italic"><LogOut size={22}/></button>
      </header>

      <main className="p-6 space-y-12 italic">
        <div className="flex justify-between items-center px-2 italic">
           <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter italic">Event Registry</h2>
           <button onClick={() => setShowEventModal(true)} className="px-7 py-4 bg-green-500 text-slate-950 rounded-2xl font-black text-xs italic flex items-center gap-2 shadow-2xl shadow-green-500/20 active:scale-95 transition-all italic"><PlusCircle size={18}/> NEW </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 italic pb-20">
          {events.map(ev => (
            <div key={ev.id} className="bg-slate-900/80 border border-slate-800 p-10 rounded-[3.5rem] space-y-8 shadow-2xl relative overflow-hidden group hover:border-green-500/30 transition-all duration-500 animate-in slide-in-from-bottom-6 italic">
               <div className="flex justify-between items-start italic relative z-10">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border italic transition-all ${ev.is_active ? 'bg-green-500/10 text-green-500 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-slate-950 text-slate-700 border-slate-800 opacity-50'}`}>{ev.is_active ? 'ACTIVE' : 'OFFLINE'}</span>
                  <button onClick={() => navigate(`/event/${ev.id}/analytics`)} className="p-2 bg-slate-950 rounded-xl text-slate-600 hover:text-blue-400 transition-all active:scale-90 italic shadow-xl"><BarChart3 size={20}/></button>
               </div>
               <div className="space-y-1 italic relative z-10">
                   <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter leading-none group-hover:text-green-400 transition-colors duration-500 italic">{ev.title}</h3>
                   <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] italic">{ev.date}</p>
               </div>
               <div className="pt-2 flex flex-col gap-3 relative z-10 italic">
                  <button onClick={() => navigate(`/event/${ev.id}/gate`)} className="w-full py-5 bg-green-500 text-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all italic shadow-lg shadow-green-500/5 border-b-4 border-green-700 italic">ENGAGE GATE LOGIC</button>
                  <div className="flex gap-2 italic">
                    <button onClick={() => navigate(`/event/${ev.id}/guests`)} className="flex-1 py-4 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all italic shadow-lg">PERSONNEL</button>
                    <button onClick={() => navigate(`/event/${ev.id}/analytics`)} className="flex-1 py-4 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all italic shadow-lg">METRICS</button>
                  </div>
               </div>
               <Zap className="absolute -top-10 -left-10 opacity-0 group-hover:opacity-[0.03] text-green-500 transition-all duration-1000 group-hover:rotate-12 italic pointer-events-none" size={250} />
            </div>
          ))}
          {events.length === 0 && <div className="col-span-full py-40 text-center opacity-10 font-black italic uppercase tracking-[1em] text-sm">Deployment Array Null</div>}
        </div>
      </main>
      {showEventModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 text-center bg-slate-950/90 backdrop-blur-xl italic animate-in fade-in duration-300 italic">
            <form onSubmit={handleCreate} className="relative bg-slate-900 border border-slate-800 rounded-[3rem] p-12 w-full max-w-lg space-y-8 shadow-2xl text-left italic">
                <div className="flex justify-between items-center italic"><h2 className="text-3xl font-black italic text-white tracking-tighter uppercase leading-none italic">New Deployment</h2><X className="text-slate-600 cursor-pointer hover:text-white transition-colors italic" onClick={() => setShowEventModal(false)} /></div>
                <div className="space-y-5 italic text-left">
                    <div className="space-y-2 italic"><label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-1 italic">Identifier</label><input value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} placeholder="e.g. ALPHA_SYNC_24" required className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-sm font-bold text-white outline-none focus:ring-1 focus:ring-green-500 shadow-inner italic uppercase tracking-widest" /></div>
                    <div className="space-y-2 italic"><label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-1 italic">Timestamp</label><input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} required className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-sm text-white font-bold outline-none shadow-inner italic" /></div>
                </div>
                <button className="w-full py-5 bg-green-500 text-slate-950 font-black rounded-2xl uppercase tracking-widest shadow-2xl shadow-green-500/20 active:scale-95 transition-all border-b-4 border-green-700 italic">INITIATE LAUNCH</button>
            </form>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
