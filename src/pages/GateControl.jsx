import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  QrCode, Users, Phone, Mail, X, ChevronLeft, IdCard, CheckCircle2, 
  UserCheck, Ticket, ScanLine, Search, History, Clock, UserPlus, 
  TrendingUp, AlertCircle, Sparkles
} from 'lucide-react';
import { fetchEventById } from '../api/events';
import { fetchEventAttendees, updateAttendeeStatus, insertEntryLog, fetchEventLogs, fetchAttendeeLogs, insertAttendee } from '../api/attendees';
import { getSession } from '../api/auth';
import GateActBtn from '../components/GateActBtn';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';
import { supabase } from '../lib/supabase';

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
    let isMounted = true;

    const loadData = async () => {
      const { data: eventData, error: eError } = await fetchEventById(eventId);
      if (!isMounted) return;
      
      if (eError || !eventData) {
        navigate('/events');
        return;
      }
      setEvent(eventData);

      const { data: { session } } = await getSession();
      if (isMounted && session?.user?.email) setAdminEmail(session.user.email);

      const { data: attendeesData } = await fetchEventAttendees(eventId);
      if (isMounted) setAttendees(attendeesData || []);

      const { data: logsData } = await fetchEventLogs(eventId);
      if (isMounted) {
        setGlobalHistory(logsData || []);
        setLoading(false);
      }
    };
    loadData();

    return () => {
      isMounted = false;
    };
  }, [eventId, navigate]);

  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`gate_control_${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendees',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAttendees((prev) => {
              if (prev.find(a => a.id === payload.new.id)) return prev;
              return [payload.new, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            setAttendees((prev) => 
              prev.map(a => a.id === payload.new.id ? { ...a, ...payload.new } : a)
            );
            setMember((prevMember) => {
              if (prevMember && prevMember.id === payload.new.id) {
                return { ...prevMember, ...payload.new };
              }
              return prevMember;
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'entry_logs',
          filter: `event_id=eq.${eventId}`
        },
        async (payload) => {
          const { data: fullLog } = await supabase
            .from('entry_logs')
            .select('*, attendee:attendees(full_name, student_id)')
            .eq('id', payload.new.id)
            .single();

          if (fullLog) {
            setGlobalHistory((prev) => [fullLog, ...prev]);
            
            setMember((prevMember) => {
              if (prevMember && prevMember.id === payload.new.attendee_id) {
                setAttendeeHistory((prevHist) => [fullLog, ...prevHist]);
              }
              return prevMember;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  // Robust Html5Qrcode Scanner initialization
  useEffect(() => {
    if (showScanner) {
      setError("");
      const timer = setTimeout(() => {
        const readerEl = document.getElementById("gate-reader");
        if (readerEl && window.Html5Qrcode) {
          try {
            const html5QrCode = new window.Html5Qrcode("gate-reader");
            html5QrCodeRef.current = html5QrCode;
            html5QrCode.start(
              { facingMode: "environment" }, 
              { fps: 25, qrbox: 250 }, 
              (text) => {
                const found = attendees.find(a => a.student_id === text || a.id === text);
                if (found) {
                  selectMember(found);
                  stopScanner();
                } else {
                  setError(`Attendee not recognized (${text}).`);
                }
              }, 
              () => {}
            ).catch((err) => {
              console.error("Camera start error:", err);
              setError("Camera access failed. Please grant camera permissions.");
            });
          } catch (e) {
            console.error("Html5Qrcode init error:", e);
            setError("QR Scanner failed to initialize.");
          }
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [showScanner, attendees]);

  const stopScanner = () => {
    if (html5QrCodeRef.current?.isScanning) {
      html5QrCodeRef.current.stop().then(() => {
        html5QrCodeRef.current.clear();
        setShowScanner(false);
      }).catch(() => setShowScanner(false));
    } else {
      setShowScanner(false);
    }
  };

  // Quick stats analytics calculations
  const stats = useMemo(() => {
    const total = attendees.length;
    const checkedIn = attendees.filter(a => a.checked_in_1).length;
    const remaining = Math.max(0, total - checkedIn);
    const onSpot = attendees.filter(a => a.is_on_spot).length;
    const percent = total > 0 ? Math.round((checkedIn / total) * 100) : 0;
    const foodTokens = attendees.filter(a => a.token_given).length;
    const gifts = attendees.filter(a => a.checked_in_2).length;

    return { total, checkedIn, remaining, onSpot, percent, foodTokens, gifts };
  }, [attendees]);

  const filtered = useMemo(() => {
    return attendees.filter(a => 
      a.full_name?.toLowerCase().includes(searchInput.toLowerCase()) || 
      a.student_id?.includes(searchInput) ||
      a.email?.toLowerCase().includes(searchInput.toLowerCase())
    );
  }, [attendees, searchInput]);

  const selectMember = async (m) => {
    setMember(m);
    setError("");
    setSearchInput("");
    if (showScanner) stopScanner();
    
    const { data: logs } = await fetchAttendeeLogs(m.id);
    setAttendeeHistory(logs || []);
  };

  const updateStatus = async (field, overrideMember = null) => {
    const currentMember = overrideMember || member;
    if (!currentMember) return;
    const isActivating = !currentMember[field];
    
    const { error: uError } = await updateAttendeeStatus(currentMember.id, field, isActivating);
    if (uError) {
      setError("Update failed.");
      console.error("Status Update Error:", uError);
      return;
    }

    const { error: logError } = await insertEntryLog({
      attendee_id: currentMember.id,
      event_id: eventId,
      action_type: field,
      status: isActivating,
      admin_email: adminEmail
    });
    if (logError) console.error("Log Insert Error:", logError);

    const updatedMember = { ...currentMember, [field]: isActivating };
    if (!overrideMember) setMember(updatedMember);
    setAttendees(prev => prev.map(a => a.id === currentMember.id ? updatedMember : a));

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
    
    const studentId = addForm.isGuest && !addForm.sid 
      ? `GUEST-${Date.now().toString().slice(-6)}` 
      : addForm.sid;
    
    const email = addForm.email || (addForm.isGuest ? `guest-${Date.now()}@internal.com` : "");

    const isDuplicate = attendees.some(a => 
      (email && a.email?.toLowerCase() === email.toLowerCase()) || 
      (studentId && a.student_id === studentId)
    );

    if (isDuplicate) {
      setAddError("Attendee is already registered for this event.");
      return;
    }

    const { data, error } = await insertAttendee({ 
      event_id: eventId, 
      full_name: addForm.name, 
      email: email, 
      student_id: studentId,
      phone: addForm.phone,
      additional_info: addForm.info,
      reference: addForm.isGuest ? addForm.ref : null,
      is_on_spot: true
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
      const updatedAttendee = { ...pendingAttendee, checked_in_1: true };
      selectMember(updatedAttendee);
    } else {
      selectMember(pendingAttendee);
    }
    
    setShowPromptModal(false);
    setPendingAttendee(null);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-16 text-slate-100">
      {/* HEADER BAR */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 sm:pb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/events')}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Back to Events"
          >
            <ChevronLeft size={20}/>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {event.title}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${event.is_active ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                {event.is_active ? 'Active Gate' : 'Offline'}
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5 font-mono">
              Event Date: {event.date}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate(`/event/${eventId}/kiosk`)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-md min-h-[44px]"
            title="Launch Self Check-In Kiosk"
          >
            <UserCheck size={15}/>
            <span>Kiosk Mode</span>
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-md min-h-[44px]"
          >
            <UserPlus size={15}/>
            <span>On-Spot Reg</span>
          </button>
          <button 
            onClick={() => showScanner ? stopScanner() : setShowScanner(true)}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all min-h-[44px] ${showScanner ? 'bg-red-600 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}`}
          >
            {showScanner ? <X size={15}/> : <QrCode size={15}/>}
            <span>{showScanner ? 'Close Scanner' : 'Scan QR'}</span>
          </button>
        </div>
      </header>

      {/* QUICK STATS ANALYTICS BAR */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Total Registered" value={stats.total} color="bg-slate-900/40" char="R" />
          
          {/* CHECKED IN CARD WITH % BADGE */}
          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Checked In</span>
              <span className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-bold">
                {stats.percent}%
              </span>
            </div>
            <p className="text-2xl font-bold text-white tracking-tight">{stats.checkedIn}</p>
          </div>

          <StatCard label="Remaining" value={stats.remaining} color="bg-slate-900/40" char="P" />
          <StatCard label="On-Spot Reg" value={stats.onSpot} color="bg-purple-500/5" char="S" />
        </div>

        {/* CHECK-IN PROGRESS BAR */}
        <div className="bg-slate-900/40 border border-slate-800 p-3 sm:p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <TrendingUp size={14} className="text-blue-500" />
              Check-In Completion Rate
            </span>
            <span className="text-slate-400 font-mono">
              {stats.checkedIn} / {stats.total} Checked In ({stats.percent}%)
            </span>
          </div>
          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="bg-gradient-to-r from-green-600 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.percent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* MAIN CHECK-IN INTERFACE */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        {/* LEFT PANEL: SEARCH & ATTENDEES LIST (lg: col-span-5) */}
        <div className="lg:col-span-5 border border-slate-800 flex flex-col bg-slate-900/40 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 space-y-3 shrink-0 border-b border-slate-800">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                <input 
                  value={searchInput} 
                  onChange={e => setSearchInput(e.target.value)} 
                  placeholder="Search name, ID, or email..." 
                  className="w-full bg-slate-950 border border-slate-800 p-3 pl-10 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500 transition-colors min-h-[44px]" 
                />
              </div>
            </div>

            {/* QR CAMERA SCANNER CONTAINER */}
            {showScanner && (
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 space-y-2 shadow-xl animate-in zoom-in duration-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-green-400 font-medium flex items-center gap-1.5">
                    <QrCode size={14} /> Camera Scanner Active
                  </span>
                  <button 
                    onClick={stopScanner}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="aspect-video bg-black rounded-lg overflow-hidden border border-slate-800 relative">
                  <div id="gate-reader" className="w-full h-full"></div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/30 text-red-400 text-xs text-center flex items-center justify-center gap-1.5">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* ATTENDEE SCROLL LIST */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[550px]">
            {filtered.length > 0 ? filtered.slice(0, 50).map(m => (
              <button 
                key={m.id} 
                onClick={() => selectMember(m)} 
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between group ${member?.id === m.id ? 'bg-blue-600/10 border-blue-500/50 shadow-sm' : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={m.avatar_url || `https://ui-avatars.com/api/?name=${m.full_name}&background=0f172a&color=cbd5e1`} 
                      className={`w-10 h-10 rounded-lg border object-cover ${member?.id === m.id ? 'border-blue-500/40' : 'border-slate-800'}`} 
                      alt=""
                    />
                    {m.checked_in_1 && (
                      <div className="absolute -top-1 -right-1 p-0.5 rounded-full bg-green-500 text-slate-950 border border-slate-950">
                        <CheckCircle2 size={10} />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${member?.id === m.id ? 'text-blue-400' : 'text-white group-hover:text-blue-300'}`}>
                      {m.full_name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[11px] text-slate-400 font-mono">{m.student_id}</p>
                      {m.is_on_spot && (
                        <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400">
                          Spot
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${m.checked_in_1 ? 'bg-green-500' : 'bg-slate-800'}`} title="Checked In"></div>
                  <div className={`w-2 h-2 rounded-full ${m.token_given ? 'bg-purple-500' : 'bg-slate-800'}`} title="Food Token"></div>
                  <div className={`w-2 h-2 rounded-full ${m.checked_in_2 ? 'bg-blue-500' : 'bg-slate-800'}`} title="Gift"></div>
                </div>
              </button>
            )) : (
              <div className="text-center py-12 text-xs text-slate-500">No matching attendees found</div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: SELECTED ATTENDEE & LIVE TIMELINE (lg: col-span-7) */}
        <div className="hidden lg:flex lg:col-span-7 flex-col bg-slate-900/40 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-sm">
          {!member ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <ScanLine size={48} className="text-slate-600 mb-2" />
              <h3 className="text-base font-semibold text-white">Ready for Gate Check-In</h3>
              <p className="text-xs text-slate-400 max-w-xs">Select an attendee from the list or scan a QR code to record gate check-in status.</p>
              
              <div className="mt-8 w-full max-w-sm space-y-2 text-left pt-4 border-t border-slate-800">
                <h4 className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <History size={13} className="text-blue-500"/> Live Activity Feed
                </h4>
                {globalHistory.length > 0 ? globalHistory.slice(0, 4).map(h => (
                  <div key={h.id} className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">
                      {(h.attendee?.full_name || h.attendees?.full_name || 'Attendee')}
                      <span className="text-green-400 font-normal"> → {h.action_type.replaceAll('_', ' ')}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{new Date(h.created_at).toLocaleTimeString()}</span>
                  </div>
                )) : (
                  <p className="text-xs text-slate-500 text-center py-4 border border-dashed border-slate-800 rounded-xl">No logs recorded yet</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 space-y-6 animate-in fade-in duration-300">
              {/* MEMBER PROFILE CARD */}
              <div className="flex items-start gap-4 bg-slate-950 border border-slate-800 p-5 rounded-xl">
                <div className="relative shrink-0">
                  <img 
                    src={member.avatar_url || `https://ui-avatars.com/api/?name=${member.full_name}&background=0f172a&color=cbd5e1`} 
                    className="w-20 h-20 rounded-xl border border-slate-800 object-cover" 
                    alt="" 
                  />
                  {member.checked_in_1 && (
                    <div className="absolute -top-1.5 -right-1.5 bg-green-500 p-1 rounded-full text-slate-950 border border-slate-950">
                      <CheckCircle2 size={12} />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">{member.full_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${member.is_on_spot ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}>
                        {member.is_on_spot ? 'On-Spot Reg' : 'Pre-Registered'}
                      </span>
                      {member.reference && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-400">
                          Ref: {member.reference}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-slate-500">Student ID</p>
                      <p className="font-mono text-green-400 font-medium flex items-center gap-1">
                        <IdCard size={13}/> {member.student_id}
                      </p>
                    </div>
                    {member.phone && (
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-slate-500">Phone</p>
                        <p className="font-mono text-slate-300 flex items-center gap-1">
                          <Phone size={13} className="text-purple-400"/> {member.phone}
                        </p>
                      </div>
                    )}
                    <div className="col-span-2 space-y-0.5">
                      <p className="text-[10px] text-slate-500">Email</p>
                      <p className="text-slate-300 flex items-center gap-1 truncate">
                        <Mail size={13} className="text-blue-400"/> {member.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ADDITIONAL NOTES IF AVAILABLE */}
              {member.additional_info && (
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs space-y-1">
                  <span className="text-[10px] text-slate-500 font-medium">Notes / Department Info</span>
                  <p className="text-slate-300 leading-relaxed">{member.additional_info}</p>
                </div>
              )}

              {/* GATE ACTION BUTTONS */}
              <div className="grid grid-cols-3 gap-3">
                <GateActBtn label="Check In" active={member.checked_in_1} onClick={() => updateStatus('checked_in_1')} icon={<UserCheck size={18}/>} color="#4ADE80" />
                <GateActBtn label="Food Token" active={member.token_given} onClick={() => updateStatus('token_given')} icon={<Ticket size={18}/>} color="#D8B4FE" />
                <GateActBtn label="Gift" active={member.checked_in_2} onClick={() => updateStatus('checked_in_2')} icon={<ScanLine size={18}/>} color="#93C5FD" />
              </div>

              {/* ACTIVITY LOGS */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Clock size={13} className="text-slate-500"/> Attendee Activity History
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {attendeeHistory.length > 0 ? attendeeHistory.map(h => (
                    <div key={h.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${h.status ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <div>
                          <p className="font-semibold text-slate-200">
                            {h.action_type.replaceAll('_', ' ')}
                            <span className="text-[10px] text-slate-500 ml-1.5 font-normal">{h.status ? 'ACTIVATED' : 'REVERSED'}</span>
                          </p>
                          {h.admin_email && <p className="text-[10px] text-slate-500">Staff: {h.admin_email}</p>}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{new Date(h.created_at).toLocaleTimeString()}</span>
                    </div>
                  )) : (
                    <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">No previous actions recorded</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MOBILE MEMBER DRAWER */}
      {member && (
        <div className="lg:hidden fixed inset-0 z-[200] flex flex-col justify-end animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setMember(null)}></div>
          <div className="relative bg-slate-900 rounded-t-2xl border-t border-slate-800 p-5 pt-4 pb-8 shadow-2xl animate-in slide-in-from-bottom-full duration-300 flex flex-col max-h-[85vh] overflow-y-auto text-xs space-y-4">
            <div className="w-10 h-1 bg-slate-800 rounded-full mx-auto shrink-0" onClick={() => setMember(null)}></div>
            
            <div className="flex items-center gap-3">
              <img 
                src={member.avatar_url || `https://ui-avatars.com/api/?name=${member.full_name}&background=0f172a&color=cbd5e1`} 
                className="w-14 h-14 rounded-xl border border-slate-800 object-cover" 
                alt=""
              />
              <div>
                <h3 className="text-base font-bold text-white">{member.full_name}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{member.student_id}</p>
                {member.reference && (
                  <p className="text-[10px] text-purple-400 font-medium mt-0.5">Ref: {member.reference}</p>
                )}
              </div>
            </div>

            {member.additional_info && (
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-medium">Notes</span>
                <p className="text-slate-300 text-xs">{member.additional_info}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-800">
              <GateActBtn label="Check In" active={member.checked_in_1} onClick={() => updateStatus('checked_in_1')} icon={<UserCheck size={16}/>} color="#4ADE80" />
              <GateActBtn label="Food Token" active={member.token_given} onClick={() => updateStatus('token_given')} icon={<Ticket size={16}/>} color="#D8B4FE" />
              <GateActBtn label="Gift" active={member.checked_in_2} onClick={() => updateStatus('checked_in_2')} icon={<ScanLine size={16}/>} color="#93C5FD" />
            </div>

            <button 
              onClick={() => setMember(null)} 
              className="w-full py-3 bg-slate-950 text-slate-300 rounded-xl border border-slate-800 text-xs font-medium min-h-[44px]"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* ON-SPOT REGISTRATION MODAL WITH ALL ORIGINAL FORM FIELDS RESTORED */}
      {showAddModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <form onSubmit={handleManualAdd} className="relative bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 w-full max-w-md space-y-4 shadow-2xl text-left text-xs flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                  <UserPlus size={18} className="text-purple-400" />
                  On-Spot Registration
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Register a new attendee or guest at the gate.</p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            {addError && (
              <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/30 text-red-400 text-xs text-center">
                {addError}
              </div>
            )}

            {/* GUEST / PRE-REGISTERED TOGGLE */}
            <div 
              className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors" 
              onClick={() => setAddForm({...addForm, isGuest: !addForm.isGuest})}
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg ${addForm.isGuest ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <UserPlus size={14} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Guest Registration</p>
                  <p className="text-[10px] text-slate-400">Enable for external guests / non-students</p>
                </div>
              </div>
              <div className={`w-9 h-5 rounded-full relative transition-colors ${addForm.isGuest ? 'bg-purple-600' : 'bg-slate-800'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${addForm.isGuest ? 'left-4' : 'left-0.5'}`}></div>
              </div>
            </div>

            {/* FORM FIELDS SCROLL AREA */}
            <div className="space-y-3 overflow-y-auto pr-1">
              {/* FULL NAME */}
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Full Name (Mandatory)</label>
                <input 
                  value={addForm.name} 
                  onChange={e => setAddForm({...addForm, name: e.target.value})} 
                  placeholder="e.g. Alex Vance" 
                  required 
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs text-white outline-none focus:border-purple-500 min-h-[40px]" 
                />
              </div>

              {/* STUDENT ID & PHONE */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Student ID {!addForm.isGuest && "(Required)"}</label>
                  <input 
                    value={addForm.sid} 
                    onChange={e => setAddForm({...addForm, sid: e.target.value})} 
                    placeholder={addForm.isGuest ? "Auto-generated if blank" : "e.g. 2020101"} 
                    required={!addForm.isGuest} 
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs text-white outline-none focus:border-purple-500 min-h-[40px]" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Phone (Optional)</label>
                  <input 
                    value={addForm.phone} 
                    onChange={e => setAddForm({...addForm, phone: e.target.value})} 
                    placeholder="+880..." 
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs text-white outline-none focus:border-purple-500 min-h-[40px]" 
                  />
                </div>
              </div>

              {/* EMAIL ADDRESS */}
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Email Address (Optional)</label>
                <input 
                  value={addForm.email} 
                  onChange={e => setAddForm({...addForm, email: e.target.value})} 
                  placeholder="alex@iub.edu.bd" 
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs text-white outline-none focus:border-purple-500 min-h-[40px]" 
                />
              </div>

              {/* REFERENCE / ORG (MANDATORY FOR GUEST) */}
              {addForm.isGuest && (
                <div className="space-y-1 animate-in fade-in duration-200">
                  <label className="text-purple-400 font-medium">Reference / Organization (Mandatory)</label>
                  <input 
                    value={addForm.ref} 
                    onChange={e => setAddForm({...addForm, ref: e.target.value})} 
                    placeholder="e.g. Guest of Dean / Club VIP" 
                    required={addForm.isGuest} 
                    className="w-full bg-slate-950 border border-purple-500/40 p-2.5 rounded-lg text-xs text-white outline-none focus:border-purple-500 min-h-[40px]" 
                  />
                </div>
              )}

              {/* ADDITIONAL INFO / NOTES */}
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Additional Info / Notes (Optional)</label>
                <textarea 
                  value={addForm.info} 
                  onChange={e => setAddForm({...addForm, info: e.target.value})} 
                  placeholder="e.g. Department, VIP Guest notes, etc." 
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs text-white outline-none focus:border-purple-500 min-h-[60px] resize-none" 
                />
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-300 rounded-lg text-xs font-medium min-h-[40px]"
              >
                Cancel
              </button>
              <button 
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg text-xs transition-all shadow-md min-h-[40px]"
              >
                Add Attendee
              </button>
            </div>
          </form>
        </div>
      )}

      {/* POST-REGISTRATION PROMPT MODAL */}
      {showPromptModal && pendingAttendee && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm text-center space-y-4 shadow-2xl text-xs">
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-400 border border-green-500/20">
              <UserCheck size={24} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Registration Complete</h3>
              <p className="text-xs text-slate-400 mt-0.5">{pendingAttendee.full_name}</p>
            </div>
            <p className="text-slate-300">Would you like to check in this attendee now?</p>
            
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => handlePromptDecision(false)}
                className="flex-1 py-2.5 bg-slate-950 border border-slate-800 text-slate-300 rounded-lg text-xs font-medium min-h-[44px]"
              >
                Not Now
              </button>
              <button 
                onClick={() => handlePromptDecision(true)}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <CheckCircle2 size={14} /> Check In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GateControl;
