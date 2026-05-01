import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, TrendingUp, ShieldCheck, History, BarChart3, Clock, Download, FileText, AlertTriangle, UserCheck, UserPlus, Phone, Mail, IdCard, Tag, Settings2 } from 'lucide-react';
import { fetchEventById } from '../api/events';
import { fetchEventAttendees, fetchEventLogs } from '../api/attendees';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const EventAnalytics = () => {
    const { id: eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [attendees, setAttendees] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tokenThreshold, setTokenThreshold] = useState(() => {
        return parseInt(localStorage.getItem(`threshold_${eventId}`) || "500");
    });
    const [isEditingThreshold, setIsEditingThreshold] = useState(false);

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

    useEffect(() => {
        localStorage.setItem(`threshold_${eventId}`, tokenThreshold.toString());
    }, [tokenThreshold, eventId]);

    const stats = useMemo(() => {
        const total = attendees.length;
        const onSpot = attendees.filter(r => r.is_on_spot).length;
        const preReg = total - onSpot;
        const c1 = attendees.filter(r => r.checked_in_1).length;
        const tokens = attendees.filter(r => r.token_given).length;
        const c2 = attendees.filter(r => r.checked_in_2).length;
        
        return { 
            total, onSpot, preReg, c1, tokens, c2,
            c1Pct: total ? Math.round((c1/total)*100) : 0,
            tokenPct: total ? Math.round((tokens/total)*100) : 0,
            c2Pct: total ? Math.round((c2/total)*100) : 0
        };
    }, [attendees]);

    const tokenAlert = stats.tokens >= tokenThreshold * 0.9;

    const timelineData = useMemo(() => {
        if (!logs.length) return [];
        
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

    const handleExportExcel = () => {
        const headers = ["Full Name", "Student ID", "Email", "Phone", "Type", "Reference", "Entry 1", "Token", "Entry 2"];
        const rows = attendees.map(a => [
            a.full_name,
            a.student_id,
            a.email || "",
            a.phone || "",
            a.is_on_spot ? "On-Spot" : "Pre-Registered",
            a.reference || "",
            a.checked_in_1 ? "X" : "",
            a.token_given ? "X" : "",
            a.checked_in_2 ? "X" : ""
        ]);

        const csvContent = [headers, ...rows].map(e => e.map(val => `"${val}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${event.title}_manifest.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text(event.title, 14, 20);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`ANALYTICS REPORT | GENERATED: ${new Date().toLocaleString().toUpperCase()}`, 14, 28);
        
        // Summary Block
        doc.autoTable({
            startY: 35,
            head: [['METRIC', 'COUNT', 'PERCENTAGE']],
            body: [
                ['TOTAL MANIFEST', stats.total, '100%'],
                ['PRE-REGISTERED', stats.preReg, `${Math.round((stats.preReg/stats.total)*100)}%`],
                ['ON-SPOT REGISTERED', stats.onSpot, `${Math.round((stats.onSpot/stats.total)*100)}%`],
                ['INITIAL ENTRY (E1)', stats.c1, `${stats.c1Pct}%`],
                ['TOKEN GRANTED', stats.tokens, `${stats.tokenPct}%`],
                ['FINAL CLEARANCE (E2)', stats.c2, `${stats.c2Pct}%`]
            ],
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 8 }
        });

        // Attendee Details
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text("DETAILED UNIT MANIFEST", 14, doc.lastAutoTable.finalY + 15);

        const tableRows = attendees.map(a => [
            a.full_name.toUpperCase(),
            a.student_id,
            a.is_on_spot ? "SPOT" : "PRE",
            a.checked_in_1 ? "YES" : "NO",
            a.token_given ? "YES" : "NO",
            a.checked_in_2 ? "YES" : "NO"
        ]);

        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 20,
            head: [['NAME', 'ID', 'TYPE', 'E1', 'TKN', 'E2']],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
            styles: { fontSize: 7 }
        });

        doc.save(`${event.title}_full_report.pdf`);
    };

    if (loading) return <LoadingSpinner />;

    return (
      <div className="space-y-8 animate-in fade-in duration-700 italic">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 italic">
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
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={handleExportExcel} className="flex-1 md:flex-none px-4 py-3 bg-slate-900 border border-slate-800 text-slate-400 hover:text-green-400 rounded-xl transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest">
              <Download size={16}/> CSV EXPORT
            </button>
            <button onClick={handleExportPDF} className="flex-1 md:flex-none px-4 py-3 bg-slate-900 border border-slate-800 text-slate-400 hover:text-blue-400 rounded-xl transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest">
              <FileText size={16}/> PDF REPORT
            </button>
          </div>
        </header>

        <main className="space-y-6 pb-24 italic">
            {/* THRESHOLD ALERT */}
            {tokenAlert && (
              <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-[2rem] flex items-center justify-between animate-in slide-in-from-top-4">
                <div className="flex items-center gap-4 text-red-500">
                  <div className="p-3 bg-red-500/20 rounded-2xl border border-red-500/30">
                    <AlertTriangle size={24} className="animate-pulse" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em]">CRITICAL TOKEN CAPACITY</p>
                    <p className="text-[9px] font-bold uppercase opacity-80 mt-1 italic">Distribution reached {stats.tokenPct}% of threshold ({tokenThreshold} units)</p>
                  </div>
                </div>
              </div>
            )}

            {/* TOP STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative group">
                    <StatCard label="Total Manifest" value={stats.total} color="bg-slate-900" char="T" />
                    <div className="absolute -bottom-2 left-4 right-4 bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex justify-between opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0 shadow-2xl z-10">
                        <div className="flex flex-col">
                            <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Pre-Reg</span>
                            <span className="text-[10px] font-black text-blue-400 italic">{stats.preReg}</span>
                        </div>
                        <div className="flex flex-col text-right">
                            <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">On-Spot</span>
                            <span className="text-[10px] font-black text-purple-500 italic">{stats.onSpot}</span>
                        </div>
                    </div>
                </div>
                <StatCard label="Initial Entry" value={stats.c1} color="bg-green-500/5" char="E" />
                <div className="relative group">
                    <StatCard label="Token Grant" value={stats.tokens} color={tokenAlert ? "bg-red-500/10" : "bg-purple-500/5"} char="G" />
                    <div className="absolute top-4 right-4 flex flex-col items-end">
                      {isEditingThreshold ? (
                        <div className="flex flex-col items-end gap-1">
                             <input 
                                autoFocus
                                type="number" 
                                value={tokenThreshold} 
                                onBlur={() => setIsEditingThreshold(false)}
                                onKeyDown={e => e.key === 'Enter' && setIsEditingThreshold(false)}
                                onChange={e => setTokenThreshold(parseInt(e.target.value) || 0)}
                                className="w-20 bg-slate-950 border border-purple-500/50 rounded-lg p-2 text-[11px] font-black text-white outline-none shadow-xl"
                            />
                            <span className="text-[6px] font-black text-purple-400 uppercase tracking-widest">Press Enter</span>
                        </div>
                      ) : (
                        <button onClick={() => setIsEditingThreshold(true)} className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 group/btn">
                            <span className="text-[7px] font-black text-slate-600 group-hover/btn:text-purple-400 uppercase tracking-tighter transition-colors">Limit: {tokenThreshold}</span>
                            <Settings2 size={10} className="text-slate-700 group-hover/btn:text-purple-400 transition-colors" />
                        </button>
                      )}
                    </div>
                </div>
                <StatCard label="Final Clearance" value={stats.c2} color="bg-blue-500/5" char="C" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] shadow-xl flex flex-col">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 mb-8"><BarChart3 size={14}/> Intake Density</h4>
                    <div className="flex-1 flex items-end gap-2 h-40 pb-2">
                        {timelineData.length > 0 ? timelineData.map((d, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                                <div className="absolute -top-6 bg-slate-800 text-[8px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">{d.count} actions</div>
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

             {/* DETAILED ATTENDEE TABLE */}
            <div className="bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8">
                <div className="p-8 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                            <Users size={20} className="text-slate-500" />
                        </div>
                        <div>
                            <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Detailed Manifest</h4>
                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">Live database synchronization active</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 px-6 py-2 bg-slate-950 rounded-2xl border border-slate-800">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black text-blue-400 leading-none">{stats.preReg}</span>
                            <span className="text-[6px] font-black text-slate-600 uppercase mt-1">PRE-REG</span>
                        </div>
                        <div className="w-px h-6 bg-slate-800"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black text-purple-400 leading-none">{stats.onSpot}</span>
                            <span className="text-[6px] font-black text-slate-600 uppercase mt-1">ON-SPOT</span>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-950/50 border-b border-slate-800">
                                <th className="p-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">Personnel Identity</th>
                                <th className="p-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">Communications</th>
                                <th className="p-6 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Protocol</th>
                                <th className="p-6 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">E1</th>
                                <th className="p-6 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">TKN</th>
                                <th className="p-6 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">E2</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {attendees.map(a => (
                                <tr key={a.id} className="hover:bg-slate-800/20 transition-all group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl bg-slate-950 border flex items-center justify-center transition-all ${a.is_on_spot ? 'border-purple-500/30 text-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.1)]' : 'border-slate-800 text-slate-600'}`}>
                                                {a.is_on_spot ? <UserPlus size={18}/> : <UserCheck size={18}/>}
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors">{a.full_name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[8px] font-bold text-slate-600 uppercase flex items-center gap-1"><IdCard size={10}/> {a.student_id}</span>
                                                    {a.reference && <span className="text-[7px] font-black text-purple-400 uppercase tracking-widest px-1.5 py-0.5 bg-purple-500/10 rounded-md border border-purple-500/20">Ref: {a.reference}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-tighter"><Mail size={10} className="text-slate-600"/> {a.email || "---"}</p>
                                            {a.phone && <p className="text-[9px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-tighter"><Phone size={10} className="text-slate-600"/> {a.phone}</p>}
                                        </div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest transition-all ${a.is_on_spot ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                                            <Tag size={10}/>
                                            {a.is_on_spot ? "Spot" : "Pre"}
                                        </div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <div className={`mx-auto w-3 h-3 rounded-full border-2 transition-all ${a.checked_in_1 ? 'bg-green-500 border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-transparent border-slate-800'}`}></div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <div className={`mx-auto w-3 h-3 rounded-full border-2 transition-all ${a.token_given ? 'bg-purple-500 border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'bg-transparent border-slate-800'}`}></div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <div className={`mx-auto w-3 h-3 rounded-full border-2 transition-all ${a.checked_in_2 ? 'bg-blue-500 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.4)]' : 'bg-transparent border-slate-800'}`}></div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
        </main>
      </div>
    );
};

export default EventAnalytics;