import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp, Users, Award, ShieldCheck, History, BarChart3, Clock } from 'lucide-react';
import { fetchEventById } from '../api/events';
import { fetchEventAttendees, fetchEventLogs } from '../api/attendees';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';

const EventAnalytics = () => {
    const { id: eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [attendees, setAttendees] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
      const loadData = async () => {
        const { data: eventData, error: eError } = await fetchEventById(eventId);
        if (eError || !eventData) {
          navigate('/');
          return;
        }
        setEvent(eventData);

        const [aRes, lRes] = await Promise.all([
            fetchEventAttendees(eventId),
            fetchEventLogs(eventId)
        ]);

        if (aRes.data) setAttendees(aRes.data);
        if (lRes.data) setLogs(lRes.data);
        
        setLoading(false);
      };
      loadData();
    }, [eventId, navigate]);

    const stats = useMemo(() => {
        const total = attendees.length;
        const c1 = attendees.filter(r => r.checked_in_1).length;
        const tokens = attendees.filter(r => r.token_given).length;
        const c2 = attendees.filter(r => r.checked_in_2).length;
        
        return { 
            total, c1, tokens, c2,
            c1Pct: total ? Math.round((c1/total)*100) : 0,
            tokenPct: total ? Math.round((tokens/total)*100) : 0,
            c2Pct: total ? Math.round((c2/total)*100) : 0
        };
    }, [attendees]);

    const timelineData = useMemo(() => {
        if (!logs.length) return [];
        
        // Group by 30-min intervals
        const groups = {};
        logs.forEach(log => {
            const date = new Date(log.created_at);
            const hour = date.getHours();
            const min = date.getMinutes() < 30 ? '00' : '30';
            const slot = `${hour}:${min}`;
            groups[slot] = (groups[slot] || 0) + 1;
        });

        return Object.entries(groups)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([slot, count]) => ({ slot, count }));
    }, [logs]);

    const maxTimelineCount = Math.max(...timelineData.map(d => d.count), 1);

    const leaderboard = useMemo(() => {
        const counts = {};
        logs.forEach(log => {
            if (log.admin_email) {
                counts[log.admin_email] = (counts[log.admin_email] || 0) + 1;
            }
        });
        return Object.entries(counts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
    }, [logs]);

    if (loading) return <LoadingSpinner />;

    return (
      <div className="space-y-8 animate-in fade-in duration-700 italic">
        <header className="flex justify-between items-end italic">
          <div className="flex items-center gap-4 italic">
            <button 
              onClick={() => navigate('/events')}
              className="p-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-all active:scale-95 italic shadow-lg"
            >
              <ChevronLeft size={20}/>
            </button>
            <div>
                <h2 className="text-2xl lg:text-3xl font-black italic text-white uppercase tracking-tighter italic leading-none">{event.title}</h2>
                <p className="text-blue-400 text-[9px] font-black uppercase tracking-[0.3em] mt-2 italic">Impact Intelligence Dashboard</p>
            </div>
          </div>
        </header>

        <main className="space-y-6 pb-24 italic">
            {/* TOP STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Manifest" value={stats.total} color="bg-slate-900" char="T" />
                <StatCard label="Initial Entry" value={stats.c1} color="bg-green-500/5" char="E" />
                <StatCard label="Token Grant" value={stats.tokens} color="bg-purple-500/5" char="G" />
                <StatCard label="Final Clearance" value={stats.c2} color="bg-blue-500/5" char="C" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* CONVERSION FUNNEL */}
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] shadow-xl space-y-8">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2"><TrendingUp size={14}/> Conversion Funnel</h4>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span>Entry Rate</span>
                                <span className="text-green-500">{stats.c1Pct}%</span>
                            </div>
                            <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                <div className="h-full bg-green-500 transition-all duration-1000 shadow-[0_0_10px_rgba(34,197,94,0.3)]" style={{ width: `${stats.c1Pct}%` }}></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span>Gift Delivery</span>
                                <span className="text-purple-500">{stats.tokenPct}%</span>
                            </div>
                            <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                <div className="h-full bg-purple-500 transition-all duration-1000 shadow-[0_0_10px_rgba(168,85,247,0.3)]" style={{ width: `${stats.tokenPct}%` }}></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span>Success Rate</span>
                                <span className="text-blue-500">{stats.c2Pct}%</span>
                            </div>
                            <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                <div className="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.3)]" style={{ width: `${stats.c2Pct}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ACTIVITY TIMELINE CHART */}
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] shadow-xl flex flex-col">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 mb-8"><BarChart3 size={14}/> Intake Density</h4>
                    <div className="flex-1 flex items-end gap-2 h-40 pb-2">
                        {timelineData.length > 0 ? timelineData.map((d, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                                <div className="absolute -top-6 bg-slate-800 text-[8px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{d.count} actions</div>
                                <div 
                                    className="w-full bg-blue-500/20 group-hover:bg-blue-500 transition-all rounded-t-lg border-t border-x border-blue-500/30" 
                                    style={{ height: `${(d.count / maxTimelineCount) * 100}%` }}
                                ></div>
                                <span className="text-[7px] font-black text-slate-700 uppercase tracking-tighter rotate-45 mt-2">{d.slot}</span>
                            </div>
                        )) : (
                            <div className="flex-1 flex items-center justify-center opacity-10 text-[10px] uppercase font-black tracking-widest">No activity recorded</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ADMIN LEADERBOARD */}
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] shadow-xl space-y-6">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2"><ShieldCheck size={14}/> Operator Manifest</h4>
                    <div className="space-y-3">
                        {leaderboard.length > 0 ? leaderboard.map(([email, count], i) => (
                            <div key={i} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between group hover:border-blue-500/50 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 text-[10px] font-black">{i + 1}</div>
                                    <p className="text-[10px] font-bold text-slate-300 truncate max-w-[150px] uppercase">{email}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-white italic">{count}</p>
                                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">Actions</p>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10 opacity-10 uppercase text-[9px] font-black tracking-widest">No Operator Data</div>
                        )}
                    </div>
                </div>

                {/* RECENT FEED */}
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] shadow-xl space-y-6">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2"><History size={14}/> Event Stream</h4>
                    <div className="space-y-3">
                        {logs.length > 0 ? logs.slice(0, 5).map(h => (
                            <div key={h.id} className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 flex flex-col gap-1">
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[180px]">
                                        {(h.attendee?.full_name || h.attendees?.full_name || 'Unit')} 
                                        <span className="text-blue-500"> → {h.action_type.replaceAll('_', ' ')}</span>
                                    </p>
                                    <div className="flex items-center gap-1.5 text-slate-700">
                                        <Clock size={10}/>
                                        <span className="text-[8px] font-black uppercase">{new Date(h.created_at).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                                {h.admin_email && <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest truncate">OP: {h.admin_email}</p>}
                            </div>
                        )) : (
                            <div className="text-center py-10 opacity-10 uppercase text-[9px] font-black tracking-widest">No logs detected</div>
                        )}
                    </div>
                </div>
            </div>
        </main>
      </div>
    );
  };

export default EventAnalytics;
