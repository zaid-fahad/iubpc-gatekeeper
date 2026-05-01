import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QrCode, X, ChevronLeft, IdCard, CheckCircle2, UserCheck, Ticket, ScanLine, Search, History, Clock, UserPlus } from 'lucide-react';
import { fetchEventById } from '../api/events';
import { fetchEventAttendees, updateAttendeeStatus, insertEntryLog, fetchEventLogs, fetchAttendeeLogs, insertAttendee } from '../api/attendees';
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

  // On-spot registration states
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', sid: '', phone: '', info: '', ref: '', isGuest: false });
  const [addError, setAddError] = useState("");
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [pendingAttendee, setPendingAttendee] = useState(null);

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

  const updateStatus = async (field, overrideMember = null) => {
    const currentMember = overrideMember || member;
    if (!currentMember) return;
    const isActivating = !currentMember[field];
    
    // 1. Update DB Status
    const { error: uError } = await updateAttendeeStatus(currentMember.id, field, isActivating);
    if (uError) {
        setError("Update failed.");
        console.error("Status Update Error:", uError);
        return;
    }

    // 2. Insert Log
    const { error: logError } = await insertEntryLog({
        attendee_id: currentMember.id,
        event_id: eventId,
        action_type: field,
        status: isActivating,
        admin_email: adminEmail
    });
    if (logError) console.error("Log Insert Error:", logError);

    // 3. Update Local State
    const updatedMember = { ...currentMember, [field]: isActivating };
    if (!overrideMember) setMember(updatedMember);
    setAttendees(prev => prev.map(a => a.id === currentMember.id ? updatedMember : a));

    // 4. Refresh Logs
    const { data: gLogs } = await fetchEventLogs(eventId);
    setGlobalHistory(gLogs || []);
    if (!overrideMember) {
      const { data: aLogs } = await fetchAttendeeLogs(currentMember.id);
      setAttendeeHistory(aLogs || []);
    }
  };

  const handleManualAdd = async (e) => {
    e.preventDefault();
    setAddError("");
    
    // For guests, we can auto-generate a placeholder student_id if it's empty to avoid UI issues
    const studentId = addForm.isGuest && !addForm.sid 
      ? `GUEST-${Date.now().toString().slice(-6)}` 
      : addForm.sid;
    
    const email = addForm.email || (addForm.isGuest ? `guest-${Date.now()}@internal.com` : "");

    // Pre-flight check for duplicates
    const isDuplicate = attendees.some(a => 
      (email && a.email?.toLowerCase() === email.toLowerCase()) || 
      (studentId && a.student_id === studentId)
    );

    if (isDuplicate) {
      setAddError("Identity already exists in manifest.");
      return;
    }

    const { data, error } = await insertAttendee({ 
      event_id: eventId, 
      full_name: addForm.name, 
      email: email, 
      student_id: studentId,
      phone: addForm.phone,
      additional_info: addForm.info,
      reference: addForm.isGuest ? addForm.ref : null
    });

    if (!error && data) {
      const newAttendee = data[0];
      setAttendees(prev => [newAttendee, ...prev]);
      setPendingAttendee(newAttendee);
      setShowAddModal(false);
      setAddForm({ name: '', email: '', sid: '', phone: '', info: '', ref: '', isGuest: false });
      setShowPromptModal(true);
    } else {
      setAddError(error?.message || "Registration failed. Check for duplicate ID.");
    }
  };

  const handlePromptDecision = async (authorize) => {
    if (!pendingAttendee) return;
    
    if (authorize) {
      await updateStatus('checked_in_1', pendingAttendee);
      // Re-fetch the updated attendee from the local state to ensure we have the check-in status
      const updatedAttendee = { ...pendingAttendee, checked_in_1: true };
      selectMember(updatedAttendee);
    } else {
      selectMember(pendingAttendee);
    }
    
    setShowPromptModal(false);
    setPendingAttendee(null);
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
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 text-purple-400 hover:text-purple-300 transition-all active:scale-95 shadow-xl"
                  title="On-spot Registration"
                >
                  <UserPlus size={20}/>
                </button>
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
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                      <p className="text-[11px] font-black text-green-500 tracking-[0.2em] uppercase flex items-center gap-1.5 shrink-0"><IdCard size={14}/> ID: {member.student_id}</p>
                      {member.phone && (
                        <>
                          <span className="hidden md:block w-1 h-1 rounded-full bg-slate-800"></span>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 shrink-0 italic"><History size={12} className="text-purple-500 rotate-90"/> {member.phone}</p>
                        </>
                      )}
                      <span className="hidden md:block w-1 h-1 rounded-full bg-slate-800"></span>
                      <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest shrink-0">{member.email}</p>
                    </div>
                    {member.reference && (
                      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full">
                        <span className="text-[8px] font-black text-purple-400 uppercase tracking-[0.2em]">REF: {member.reference}</span>
                      </div>
                    )}
                  </div>
                </div>

                {member.additional_info && (
                  <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl animate-in slide-in-from-left-2">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mb-2">Internal Brief</p>
                    <p className="text-[10px] font-bold text-slate-300 uppercase leading-relaxed italic">{member.additional_info}</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <GateActBtn label="Gate Entry" active={member.checked_in_1} onClick={() => updateStatus('checked_in_1')} icon={<UserCheck size={18}/>} color="#4ADE80" />
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
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <p className="text-[9px] font-black text-slate-500 tracking-[0.2em] uppercase italic flex items-center gap-1.5 leading-none"><IdCard size={12} className="text-green-500" /> ID: {member.student_id}</p>
                              {member.phone && <p className="text-[8px] font-bold text-slate-600 uppercase italic flex items-center gap-1.5 leading-none"><History size={10} className="text-purple-500 rotate-90"/> {member.phone}</p>}
                            </div>
                            {member.reference && (
                              <p className="text-[7px] font-black text-purple-400 uppercase tracking-widest mt-1.5 px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-md inline-block">REF: {member.reference}</p>
                            )}
                        </div>
                    </div>

                    {member.additional_info && (
                      <div className="bg-slate-950/50 border border-slate-800/50 p-4 rounded-2xl">
                        <p className="text-[7px] font-black text-slate-700 uppercase tracking-[0.3em] mb-1.5">Internal Brief</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed italic">{member.additional_info}</p>
                      </div>
                    )}
                    <div className="space-y-2.5">
                        <GateActBtn label="Gate Entry" active={member.checked_in_1} onClick={() => updateStatus('checked_in_1')} icon={<UserCheck size={16}/>} color="#4ADE80" />
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

      {/* ON-SPOT REGISTRATION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in zoom-in duration-300 italic">
            <form onSubmit={handleManualAdd} className="relative bg-slate-900 border border-slate-800 rounded-[3.5rem] p-10 w-full max-w-md space-y-6 shadow-2xl text-left italic">
                <div className="flex justify-between items-center italic">
                  <div>
                    <h2 className="text-3xl font-black italic text-white tracking-tighter uppercase leading-none italic">Direct Intake</h2>
                    <p className="text-[9px] font-black text-purple-500 uppercase tracking-[0.3em] mt-2">On-Spot Registration</p>
                  </div>
                  <X className="text-slate-500 cursor-pointer hover:text-white transition-colors italic" onClick={() => setShowAddModal(false)} />
                </div>
                {addError && <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20 text-red-400 text-[10px] font-black text-center uppercase italic">{addError}</div>}
                
                <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-2xl group cursor-pointer" onClick={() => setAddForm({...addForm, isGuest: !addForm.isGuest})}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${addForm.isGuest ? 'bg-purple-500 text-slate-950' : 'bg-slate-900 text-slate-600'}`}>
                      <UserPlus size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-tighter">Guest</p>
                      <p className="text-[8px] font-bold text-slate-600 uppercase">Only name is mandatory</p>
                    </div>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-all ${addForm.isGuest ? 'bg-purple-500' : 'bg-slate-800'}`}>
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${addForm.isGuest ? 'left-6' : 'left-1'}`}></div>
                  </div>
                </div>

                <div className="space-y-4 italic max-h-[60vh] overflow-y-auto px-1 pr-3 scrollbar-hide">
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-2">Full Identity</label>
                      <input value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} placeholder="NAME SURNAME" required className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-sm font-bold text-white outline-none focus:ring-1 focus:ring-purple-500/50 shadow-inner italic uppercase tracking-widest" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-2">Phone (Optional)</label>
                        <input value={addForm.phone} onChange={e => setAddForm({...addForm, phone: e.target.value})} placeholder="+880..." className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-sm font-bold text-white outline-none focus:ring-1 focus:ring-purple-500/50 shadow-inner italic uppercase tracking-widest" />
                      </div>
                      <div className={`space-y-1.5 transition-all ${addForm.isGuest ? 'opacity-40' : 'opacity-100'}`}>
                        <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-2">Student ID {!addForm.isGuest && "(MANDATORY)"}</label>
                        <input value={addForm.sid} onChange={e => setAddForm({...addForm, sid: e.target.value})} placeholder="0000000" required={!addForm.isGuest} className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-sm font-bold text-white outline-none focus:ring-1 focus:ring-purple-500/50 shadow-inner italic uppercase tracking-widest" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-2">Email Address (Optional)</label>
                      <input value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} placeholder="UNIT@IUB.EDU.BD" className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-sm font-bold text-white outline-none focus:ring-1 focus:ring-purple-500/50 shadow-inner italic uppercase tracking-widest" />
                    </div>

                    {addForm.isGuest && (
                      <div className="space-y-1.5 animate-in slide-in-from-top-2">
                        <label className="text-[8px] font-black text-purple-500 uppercase tracking-widest ml-2">Reference / Org (MANDATORY)</label>
                        <input value={addForm.ref} onChange={e => setAddForm({...addForm, ref: e.target.value})} placeholder="REF NAME / CLUB / UNIV" required={addForm.isGuest} className="w-full bg-slate-950 border border-purple-500/30 p-5 rounded-2xl text-sm font-bold text-white outline-none focus:ring-1 focus:ring-purple-500/50 shadow-inner italic uppercase tracking-widest" />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-2">Additional Info (Optional)</label>
                      <textarea value={addForm.info} onChange={e => setAddForm({...addForm, info: e.target.value})} placeholder="NOTES / ALLERGIES / DEPT..." className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-sm font-bold text-white outline-none focus:ring-1 focus:ring-purple-500/50 shadow-inner italic uppercase tracking-widest h-24 resize-none" />
                    </div>
                </div>
                <button className="w-full py-5 bg-purple-500 text-slate-950 font-black rounded-2xl uppercase tracking-widest shadow-xl shadow-purple-500/20 active:scale-95 transition-all border-b-4 border-purple-700 italic">Add Person</button>
            </form>
        </div>
      )}

      {/* POST-REGISTRATION PROMPT */}
      {showPromptModal && pendingAttendee && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-2xl animate-in zoom-in duration-300 italic">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 w-full max-w-sm text-center space-y-8 shadow-2xl italic">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20 text-green-500">
                <UserPlus size={40} />
              </div>
              <div>
                <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter leading-none">Person Registered</h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase mt-2 tracking-widest">{pendingAttendee.full_name}</p>
              </div>
            </div>
            
            <p className="text-[11px] font-bold text-slate-400 uppercase leading-relaxed tracking-tight">Authorize immediate gate entry for this person?</p>
            
            <div className="space-y-3">
              <button 
                onClick={() => handlePromptDecision(true)}
                className="w-full py-5 bg-green-500 text-slate-950 font-black rounded-2xl uppercase tracking-widest shadow-xl shadow-green-500/20 active:scale-95 transition-all border-b-4 border-green-700 italic flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} /> YES, AUTHORIZE
              </button>
              <button 
                onClick={() => handlePromptDecision(false)}
                className="w-full py-5 bg-slate-800 text-slate-400 hover:text-white font-black rounded-2xl uppercase tracking-widest active:scale-95 transition-all border border-slate-700 italic"
              >
                NOT NOW
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GateControl;

