import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchEvents as fetchEventsApi } from '../api/events';
import { fetchAllUsers } from '../api/auth';
import StatCard from '../components/StatCard';
import { Calendar, Zap, ArrowRight, ShieldCheck, Users } from 'lucide-react';

const DashboardOverview = ({ userRole }) => {
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isAdmin = userRole === 'admin';

  const fetchData = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    const { data: eventsData } = await fetchEventsApi();
    setEvents(eventsData || []);

    if (isAdmin) {
      const { data: usersData } = await fetchAllUsers();
      setUsers(usersData || []);
    }
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    const init = async () => {
      await fetchData();
    };
    init();
  }, [fetchData]);

  const activeEvents = events.filter(e => e.is_active).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 italic">
      <header className="italic">
        <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter italic">Operational Overview</h2>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2 italic">Real-time system status and metrics</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 italic">
        <StatCard label="Active Deployments" value={activeEvents} color="bg-slate-900/50" char="A" />
        <StatCard label="Total Events" value={events.length} color="bg-slate-900/50" char="E" />
        {isAdmin ? (
          <StatCard label="Field Operators" value={users.length} color="bg-slate-900/50" char="O" />
        ) : (
          <StatCard label="System Status" value="ONLINE" color="bg-green-500/10" char="S" />
        )}
      </div>

      <div className="space-y-6 italic">
        <div className="flex justify-between items-end px-2 italic">
          <div>
            <h3 className="text-xl font-black italic text-white uppercase tracking-tighter italic">Recent Deployments</h3>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1 italic">Latest operations in the registry</p>
          </div>
          <button 
            onClick={() => navigate('/events')}
            className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-green-500 hover:text-white transition-all italic"
          >
            View Registry <ArrowRight size={12}/>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 italic">
          {events.slice(0, 3).map(ev => (
            <div 
              key={ev.id} 
              onClick={() => navigate(`/event/${ev.id}/gate`)}
              className="bg-slate-900/40 border border-slate-800/50 p-5 rounded-2xl flex items-center justify-between group hover:border-green-500/30 transition-all cursor-pointer italic"
            >
              <div className="flex items-center gap-4 italic">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${ev.is_active ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-slate-950 border-slate-800 text-slate-700'}`}>
                  <Calendar size={20}/>
                </div>
                <div className="italic">
                  <h4 className="text-base font-black italic text-white uppercase tracking-tight group-hover:text-green-400 transition-colors italic">{ev.title}</h4>
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-0.5 italic">{ev.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 italic">
                <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${ev.is_active ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-slate-950 text-slate-800 border-slate-900'}`}>
                  {ev.is_active ? 'ACTIVE' : 'OFFLINE'}
                </span>
                <ArrowRight size={16} className="text-slate-800 group-hover:text-green-500 group-hover:translate-x-1 transition-all italic" />
              </div>
            </div>
          ))}
          {events.length === 0 && !loading && (
            <div className="p-10 border-2 border-dashed border-slate-900 rounded-3xl text-center italic">
              <p className="text-slate-600 font-black uppercase tracking-widest text-[10px] italic">No active deployments found in registry</p>
            </div>
          )}
        </div>
      </div>
      
      {isAdmin && (
        <div className="bg-blue-500/5 border border-blue-500/10 p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 italic">
          <div className="flex items-center gap-5 italic text-center md:text-left">
            <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg shadow-blue-500/20 italic">
              <Users size={28}/>
            </div>
            <div className="italic">
              <h4 className="text-xl font-black italic text-white uppercase tracking-tighter italic">Operator Management</h4>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">Authorize and manage field personnel privileges</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/operators')}
            className="px-6 py-3 bg-blue-500 text-slate-950 font-black rounded-xl text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/10 active:scale-95 transition-all italic"
          >
            Manage Personnel
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;
