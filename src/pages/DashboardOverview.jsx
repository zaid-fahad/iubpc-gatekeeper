import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchEvents as fetchEventsApi } from '../api/events';
import { fetchAllUsers } from '../api/auth';
import { StatCard } from '../components';
import { 
  Calendar, ArrowRight, Users, RefreshCw, CheckCircle2, 
  Play, ShieldCheck, LayoutDashboard, Plus, ArrowUpRight, Activity
} from 'lucide-react';

const DashboardOverview = ({ userRole }) => {
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);

  const navigate = useNavigate();
  const isAdmin = userRole === 'admin';

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: eventsData } = await fetchEventsApi();
    setEvents(eventsData || []);

    if (isAdmin) {
      const { data: usersData } = await fetchAllUsers();
      setUsers(usersData || []);
    }
    setLoading(false);
  }, [isAdmin]);

  const handleRefresh = async () => {
    setFetching(true);
    await fetchData();
    setFetching(false);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeEvents = useMemo(() => events.filter(e => e.is_active), [events]);
  const latestActiveEvent = useMemo(() => activeEvents[0] || null, [activeEvents]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-16 text-slate-100">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 sm:pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <LayoutDashboard className="text-blue-500" size={26} />
            Dashboard
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Real-time gatekeeper system metrics, active portals, and quick actions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={handleRefresh}
            disabled={fetching}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-2 transition-all disabled:opacity-50 min-h-[44px]"
            title="Refresh Dashboard"
          >
            <RefreshCw size={14} className={fetching ? "animate-spin text-blue-500" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* METRICS SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Active Portals" value={activeEvents.length} color="bg-green-500/5" char="A" />
        <StatCard label="Total Events" value={events.length} color="bg-slate-900/40" char="E" />
        {isAdmin ? (
          <StatCard label="Staff Members" value={users.length} color="bg-blue-500/5" char="S" />
        ) : (
          <StatCard label="System Status" value="Online" color="bg-green-500/5" char="O" />
        )}
        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Gate System</span>
            <span className="flex items-center gap-1.5 text-green-400 text-[10px] font-bold">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Operational
            </span>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">Ready</p>
        </div>
      </div>

      {/* QUICK ACTION HUB */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* LAUNCH GATE CHECK-IN */}
          <button
            onClick={() => {
              if (latestActiveEvent) {
                navigate(`/events/${latestActiveEvent.id}/gate`);
              } else {
                navigate('/events');
              }
            }}
            className="bg-green-600/10 hover:bg-green-600/20 border border-green-500/30 p-4 rounded-xl text-left transition-all group flex flex-col justify-between min-h-[100px] shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center border border-green-500/30">
                <Play size={18} className="fill-green-400" />
              </div>
              <ArrowUpRight size={16} className="text-green-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-green-400 transition-colors">
                Launch Check-In Gate
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {latestActiveEvent ? `Open gate for "${latestActiveEvent.title}"` : 'Select an active event portal'}
              </p>
            </div>
          </button>

          {/* MANAGE EVENTS */}
          <button
            onClick={() => navigate('/events')}
            className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl text-left transition-all group flex flex-col justify-between min-h-[100px] shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <Calendar size={18} />
              </div>
              <ArrowUpRight size={16} className="text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                Event Registry
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Create and manage event portals</p>
            </div>
          </button>

          {/* STAFF OPERATORS (FOR ADMIN) / SYSTEM HEALTH */}
          {isAdmin ? (
            <button
              onClick={() => navigate('/operators')}
              className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl text-left transition-all group flex flex-col justify-between min-h-[100px] shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                  <Users size={18} />
                </div>
                <ArrowUpRight size={16} className="text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                  Staff Manifest
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Manage operator roles & permissions</p>
              </div>
            </button>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl flex flex-col justify-between min-h-[100px]">
              <div className="w-9 h-9 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center border border-green-500/20">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Operator Session Active</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Standard staff gate control access</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RECENT EVENTS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Active & Recent Events</h3>
            <p className="text-xs text-slate-400 mt-0.5">Latest event check-in portals in the system</p>
          </div>
          <button 
            onClick={() => navigate('/events')}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all min-h-[36px]"
          >
            <span>View All Events</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.slice(0, 4).map(ev => (
            <div 
              key={ev.id} 
              className="bg-slate-900/60 border border-slate-800 p-4 sm:p-5 rounded-xl space-y-4 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${ev.is_active ? 'bg-green-500' : 'bg-slate-500'}`}></span>
                    <span className={`text-xs font-medium ${ev.is_active ? 'text-green-400' : 'text-slate-400'}`}>
                      {ev.is_active ? 'Active Gate' : 'Offline'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">{ev.date}</span>
                </div>
                <h4 className="text-base font-bold text-white tracking-tight">
                  {ev.title}
                </h4>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button 
                  onClick={() => navigate(`/events/${ev.id}/gate`)}
                  disabled={!ev.is_active}
                  className="flex-1 py-2.5 px-3 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-h-[40px]"
                >
                  <span>Start Check-In</span>
                  <ArrowRight size={13} />
                </button>
                <button 
                  onClick={() => navigate(`/events/${ev.id}/guests`)}
                  className="py-2.5 px-3 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 min-h-[40px]"
                >
                  <span>Attendees</span>
                </button>
              </div>
            </div>
          ))}

          {events.length === 0 && !loading && (
            <div className="col-span-full p-8 border border-dashed border-slate-800 rounded-xl text-center space-y-2">
              <Calendar size={32} className="mx-auto text-slate-600" />
              <p className="text-xs font-medium text-slate-400">No active events found.</p>
            </div>
          )}
        </div>
      </div>

      {/* ADMIN STAFF ACCESS BANNER */}
      {isAdmin && (
        <div className="bg-slate-900/60 border border-slate-800 p-5 sm:p-6 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Users size={22} />
            </div>
            <div>
              <h4 className="text-base font-bold text-white tracking-tight">Staff Operator Management</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {users.length} total registered operator accounts in the system.
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/operators')}
            className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-xs transition-all shadow-md flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <span>Manage Staff</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;
