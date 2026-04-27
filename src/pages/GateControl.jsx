import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QrCode, X, ChevronLeft, IdCard, CheckCircle2, UserCheck, Ticket, ScanLine, Search, History, Clock } from 'lucide-react';
import { fetchEventById } from '../api/events';
import { fetchEventAttendees, updateAttendeeStatus, insertEntryLog, fetchEventLogs, fetchAttendeeLogs } from '../api/attendees';
import { getSession } from '../api/auth';
import GateActBtn from '../components/GateActBtn';
import LoadingSpinner from '../components/LoadingSpinner';

const GateControl = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [member, setMember] = useState(null);
  const [error, setError] = useState("");
  const [globalHistory, setGlobalHistory] = useState([]);
  const [attendeeHistory, setAttendeeHistory] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      const { data: eventData, error: eError } = await fetchEventById(eventId);
      if (eError || !eventData) {
        navigate('/');
        return;
      }
      setEvent(eventData);

      const { data: { session } } = await getSession();
      if (session?.user?.email) setAdminEmail(session.user.email);

      const { data: attendeesData } = await fetchEventAttendees(eventId);
      setAttendees(attendeesData || []);

      const { data: logsData } = await fetchEventLogs(eventId);
      setGlobalHistory(logsData || []);

      setLoading(false);
    };
    loadData();
  }, [eventId, navigate]);

  const filtered = attendees.filter(a => 
    a.full_name?.toLowerCase().includes(searchInput.toLowerCase()) || 
    a.student_id?.includes(searchInput) ||
    a.email?.toLowerCase().includes(searchInput.toLowerCase())
  );

  const selectMember = async (m) => {
    setMember(m);
    setError("");
    setSearchInput("");
    if (showScanner) stopScanner();
    
    // Fetch individual history
    const { data: logs } = await fetchAttendeeLogs(m.id);
    setAttendeeHistory(logs || []);
  };

  const updateStatus = async (field) => {
    if (!member) return;
    const isActivating = !member[field];
    
    // 1. Update DB Status
    const { error: uError } = await updateAttendeeStatus(member.id, field, isActivating);
    if (uError) {
        setError("Update failed.");
        console.error("Status Update Error:", uError);
        return;
    }

    // 2. Insert Log
    const { error: logError } = await insertEntryLog({
        attendee_id: member.id,
        event_id: eventId,
        action_type: field,
        status: isActivating,
        admin_email: adminEmail
    });
    if (logError) console.error("Log Insert Error:", logError);

    // 3. Update Local State
    const updatedMember = { ...member, [field]: isActivating };
    setMember(updatedMember);
    setAttendees(prev => prev.map(a => a.id === member.id ? updatedMember : a));

    // 4. Refresh Logs
    const { data: gLogs } = await fetchEventLogs(eventId);
    setGlobalHistory(gLogs || []);
    const { data: aLogs } = await fetchAttendeeLogs(member.id);
    setAttendeeHistory(aLogs || []);
  };

  const startScanner = () => {
    setShowScanner(true);
    setTimeout(() => {
        const html5QrCode = new window.Html5Qrcode("gate-reader");
        html5QrCodeRef.current = html5QrCode;
        html5QrCode.start({ facingMode: "environment" }, { fps: 25, qrbox: 250 }, (text) => {
            const found = attendees.find(a => a.student_id === text || a.id === text);
            if (found) selectMember(found);
            else setError("Identity not recognized.");
        }, () => {}).catch(() => setError("Camera connection failed."));
    }, 100);
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current?.isScanning) html5QrCodeRef.current.stop().then(() => { html5QrCodeRef.current.clear(); setShowScanner(false); });
    else setShowScanner(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-in fade-in duration-700 italic">
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
            <p className="text-green-500 text-[9px] font-black uppercase tracking-[0.3em] mt-2 italic">Control Matrix</p>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px] h-[calc(100vh-220px)] overflow-hidden">
        {/* LEFT PANEL: SEARCH & LIST (lg: col-span-5) */}
        <div className="lg:col-span-5 border border-slate-800 flex flex-col bg-slate-900/40 rounded-3xl overflow-hidden">
          <div className="p-4 space-y-3 shrink-0">
            <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-700" size={16} />
                  <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search manifest..." className="w-full bg-slate-950 border border-slate-800 p-3.5 pl-10 rounded-xl text-xs font-bold text-white shadow-inner outline-none focus:ring-1 focus:ring-green-500/50 transition-all italic" />
                </div>
                <button onClick={() => showScanner ? stopScanner() : startScanner()} className={`p-3.5 rounded-xl border transition-all ${showScanner ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-slate-950 border-slate-800 text-green-500 shadow-xl'}`}>{showScanner ? <X size={20}/> : <QrCode size={20}/>}</button>
            </div>
            {showScanner && <div className="aspect-video bg-black rounded-xl overflow-hidden border-2 border-slate-800 relative shadow-2xl animate-in zoom-in"><div id="gate-reader" className="w-full h-full"></div></div>}
            {error && <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-red-400 text-[8px] font-black text-center uppercase italic">{error}</div>}
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-12 space-y-2">
            {filtered.length > 0 ? filtered.slice(0, 50).map(m => (
              <button key={m.id} onClick={() => selectMember(m)} className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between group ${member?.id === m.id ? 'bg-green-500 border-green-400 shadow-lg' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}`}>
                <div className="flex items-center gap-3">
                  <img src={m.avatar_url || `https://ui-avatars.com/api/?name=${m.full_name}&background=000&color=fff`} className="w-8 h-8 rounded-lg border-2 border-slate-950 object-cover" />
                  <div>
                    <p className={`text-[11px] font-black uppercase tracking-tight leading-none ${member?.id === m.id ? 'text-slate-950' : 'text-white'}`}>{m.full_name}</p>
                    <p className={`text-[8px] font-bold uppercase mt-1 ${member?.id === m.id ? 'text-slate-800' : 'text-slate-600'}`}>{m.student_id}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${m.checked_in_1 ? 'bg-green-500 border border-slate-950' : 'bg-slate-800'}`}></div>
                  <div className={`w-1.5 h-1.5 rounded-full ${m.token_given ? 'bg-purple-500 border border-slate-950' : 'bg-slate-800'}`}></div>
                  <div className={`w-1.5 h-1.5 rounded-full ${m.checked_in_2 ? 'bg-blue-500 border border-slate-950' : 'bg-slate-800'}`}></div>
                </div>
              </button>
            )) : <div className="text-center py-10 opacity-20 uppercase text-[9px] font-black tracking-widest">No Matches Found</div>}
          </div>
        </div>

        {/* RIGHT PANEL: DETAIL VIEW & LOGS (lg: col-span-7) */}
        <div className="hidden lg:flex lg:col-span-7 flex-col overflow-hidden bg-slate-950/40 border border-slate-800/50 rounded-3xl relative">
          {!member ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 opacity-20 text-center">
              <ScanLine size={60} className="mb-4" />
              <h3 className="text-xl font-black uppercase tracking-[0.2em]">Ready for Intake</h3>
              <p className="text-[10px] font-bold mt-2 uppercase tracking-widest">Select an identity from the manifest</p>
              
              <div className="mt-12 w-full max-w-xs space-y-3 text-left">
                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2"><History size={12}/> Live Feed</h4>
                {globalHistory.length > 0 ? globalHistory.slice(0, 4).map(h => (
                  <div key={h.id} className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/50 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[150px]">
                        {(h.attendee?.full_name || h.attendees?.full_name || 'Unit')} 
                        <span className="text-green-500"> → {h.action_type.replaceAll('_', ' ')}</span>
                      </p>
                      <span className="text-[7px] font-black text-slate-700 uppercase">{new Date(h.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                )) : <p className="text-[9px] font-bold text-slate-800 uppercase text-center py-4 border border-dashed border-slate-900 rounded-xl">No logs detected</p>}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-8 space-y-8 animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <img src={member.avatar_url || `https://ui-avatars.com/api/?name=${member.full_name}&background=000&color=fff`} className="w-24 h-24 rounded-2xl border-4 border-slate-900 object-cover bg-slate-800 shadow-2xl" />
                    {member.checked_in_1 && <div className="absolute -top-1.5 -right-1.5 bg-green-500 p-2 rounded-full border-4 border-slate-950 shadow-lg"><CheckCircle2 size={12} className="text-black" /></div>}
                  </div>
                  <div>
                    <h3 className="text-3xl font-black italic text-white leading-none uppercase tracking-tighter">{member.full_name}</h3>
                    <div className="flex items-center gap-3 mt-3">
                      <p className="text-[11px] font-black text-green-500 tracking-[0.2em] uppercase flex items-center gap-1.5"><IdCard size={14}/> ID: {member.student_id}</p>
                      <span className="w-1 h-1 rounded-full bg-slate-800"></span>
                      <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{member.email}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <GateActBtn label="Gate Entry Log" active={member.checked_in_1} onClick={() => updateStatus('checked_in_1')} icon={<UserCheck size={18}/>} color="#4ADE80" />
                  <GateActBtn label="Token Grant" active={member.token_given} onClick={() => updateStatus('token_given')} icon={<Ticket size={18}/>} color="#D8B4FE" />
                  <GateActBtn label="2nd Entry" active={member.checked_in_2} onClick={() => updateStatus('checked_in_2')} icon={<ScanLine size={18}/>} color="#93C5FD" />
                </div>

                <div className="space-y-3">
                  <h4 className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] ml-1 flex items-center gap-2"><Clock size={12}/> Activity Timeline</h4>
                  <div className="space-y-2">
                    {attendeeHistory.length > 0 ? attendeeHistory.map(h => (
                      <div key={h.id} className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/50 flex justify-between items-center group hover:bg-slate-900/60 transition-all">
                        <div className="flex items-center gap-3">
                          <div className={`w-1.5 h-1.5 rounded-full ${h.status ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tight leading-none">{h.action_type.replaceAll('_', ' ')} <span className="text-[8px] text-slate-600 ml-1.5 font-medium">{h.status ? 'ACTIVATED' : 'REVERSED'}</span></p>
                            {h.admin_email && <p className="text-[7px] font-black text-slate-700 uppercase mt-1 tracking-widest leading-none">Operator: {h.admin_email}</p>}
                          </div>
                        </div>
                        <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">{new Date(h.created_at).toLocaleTimeString()}</span>
                      </div>
                    )) : <div className="text-center py-6 opacity-10 uppercase text-[8px] font-black tracking-widest border-2 border-dashed border-slate-800 rounded-2xl">No history</div>}
                  </div>
                </div>
            </div>
          )}
        </div>
      </main>

      {/* MOBILE MEMBER DRAWER */}
      {member && (
        <div className="lg:hidden fixed inset-0 z-[200] flex flex-col justify-end animate-in fade-in duration-300 italic">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setMember(null)}></div>
            <div className="relative bg-slate-900 rounded-t-3xl border-t border-slate-800 p-8 pt-4 pb-12 shadow-2xl animate-in slide-in-from-bottom-full duration-500 flex flex-col items-center max-h-[85vh] overflow-y-auto">
                <div className="w-12 h-1 bg-slate-800 rounded-full mb-8 shrink-0" onClick={() => setMember(null)}></div>
                <div className="w-full max-w-sm space-y-6">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <img src={member.avatar_url || `https://ui-avatars.com/api/?name=${member.full_name}&background=000&color=fff`} className="w-16 h-16 rounded-xl border-4 border-slate-950 object-cover bg-slate-800 shadow-2xl" />
                            {member.checked_in_1 && <div className="absolute -top-1 -right-1 bg-green-500 p-1.5 rounded-full border-4 border-slate-900 shadow-lg"><CheckCircle2 size={10} className="text-black" /></div>}
                        </div>
                        <div>
                            <h3 className="text-xl font-black italic text-white leading-tight uppercase tracking-tighter">{member.full_name}</h3>
                            <p className="text-[9px] font-black text-slate-500 tracking-[0.2em] uppercase mt-1 italic flex items-center gap-1.5 leading-none"><IdCard size={12} className="text-green-500" /> ID: {member.student_id}</p>
                        </div>
                    </div>
                    <div className="space-y-2.5">
                        <GateActBtn label="Gate Entry Log" active={member.checked_in_1} onClick={() => updateStatus('checked_in_1')} icon={<UserCheck size={16}/>} color="#4ADE80" />
                        <GateActBtn label="Token Grant" active={member.token_given} onClick={() => updateStatus('token_given')} icon={<Ticket size={16}/>} color="#D8B4FE" />
                        <GateActBtn label="2nd Entry" active={member.checked_in_2} onClick={() => updateStatus('checked_in_2')} icon={<ScanLine size={16}/>} color="#93C5FD" />
                    </div>

                    <div className="space-y-3 pt-4">
                        <h4 className="text-[9px] font-black text-slate-700 uppercase tracking-widest ml-2">Recent Activity</h4>
                        {attendeeHistory.length > 0 ? attendeeHistory.slice(0, 3).map(h => (
                          <div key={h.id} className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                                <p className="text-[10px] font-bold text-slate-500 uppercase">{h.action_type.replaceAll('_', ' ')}</p>
                                <span className="text-[9px] font-black text-slate-800">{new Date(h.created_at).toLocaleTimeString()}</span>
                            </div>
                            {h.admin_email && <p className="text-[7px] font-black text-slate-700 uppercase tracking-tighter truncate">BY: {h.admin_email}</p>}
                          </div>
                        )) : <p className="text-[9px] font-bold text-slate-800 uppercase text-center py-2">No activity</p>}
                    </div>

                    <button onClick={() => setMember(null)} className="w-full py-5 bg-slate-950 text-slate-600 hover:text-white font-black uppercase tracking-widest text-[10px] rounded-2xl border border-slate-800 active:scale-95 transition-all mt-4 italic shadow-lg">Dismiss Session</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default GateControl;
