import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  QrCode, Users, Phone, Mail, X, ChevronLeft, IdCard, CheckCircle2, 
  UserCheck, Ticket, ScanLine, Search, History, Clock, UserPlus, 
  TrendingUp, AlertCircle, Sparkles, Pencil, Trash2, ShieldCheck
} from 'lucide-react';
import { fetchEventById } from '../api/events';
import { fetchEventAttendees, updateAttendeeStatus, insertEntryLog, fetchEventLogs, fetchAttendeeLogs, insertAttendee, updateAttendee, deleteAttendee } from '../api/attendees';
import { getSession } from '../api/auth';
import { GateActionButton, LoadingSpinner, StatCard } from '../components';
import { supabase } from '../lib/supabase';

const GateControl = ({ userRole }) => {
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

  // Admin Attendee Management States
  const isAdmin = userRole === 'admin';
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', sid: '', phone: '', info: '', ref: '', isGuest: false });
  const [addError, setAddError] = useState("");
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [pendingAttendee, setPendingAttendee] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', sid: '', email: '', phone: '', ref: '', info: '' });

  const openEditAttendeeModal = () => {
    if (!member) return;
    setEditForm({
      name: member.full_name || '',
      sid: member.student_id || '',
      email: member.email || '',
      phone: member.phone || '',
      ref: member.reference || '',
      info: member.additional_info || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateAttendee = async (e) => {
    e.preventDefault();
    if (!member || !editForm.name.trim()) return;

    const updates = {
      full_name: editForm.name.trim(),
      student_id: editForm.sid.trim(),
      email: editForm.email.trim() || null,
      phone: editForm.phone.trim() || null,
      reference: editForm.ref.trim() || null,
      additional_info: editForm.info.trim() || null
    };

    const { error } = await updateAttendee(member.id, updates);
    if (!error) {
      const updatedMember = { ...member, ...updates };
      setMember(updatedMember);
      setAttendees(prev => prev.map(a => a.id === member.id ? updatedMember : a));
      setShowEditModal(false);
    } else {
      setError("Failed to update attendee: " + error.message);
    }
  };

  const handleDeleteAttendee = async () => {
    if (!member) return;
    if (!window.confirm(`Are you sure you want to delete "${member.full_name}" (${member.student_id})? This will delete all entry records for this attendee.`)) {
      return;
    }

    const { error } = await deleteAttendee(member.id);
    if (!error) {
      setAttendees(prev => prev.filter(a => a.id !== member.id));
      setMember(null);
    } else {
      setError("Failed to delete attendee: " + error.message);
    }
  };

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
        const QrScanner = window.Html5Qrcode;
        if (readerEl && QrScanner) {
          try {
            const html5QrCode = new QrScanner("gate-reader");
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
    const query = searchInput.trim().toLowerCase();
    if (!query) return attendees;
    return attendees.filter(a => 
      a.full_name?.toLowerCase().includes(query) || 
      a.student_id?.toLowerCase().includes(query) || 
      a.email?.toLowerCase().includes(query) ||
      a.reference?.toLowerCase().includes(query) ||
      a.phone?.toLowerCase().includes(query) ||
      a.additional_info?.toLowerCase().includes(query)
    );
  }, [attendees, searchInput]);

  const selectMember = async (m) => {
    setMember(m);
    setError("");
    const { data } = await fetchAttendeeLogs(m.id);
    setAttendeeHistory(data || []);
  };

  const updateStatus = async (field, val) => {
    if (!member) return;
    const { error: err } = await updateAttendeeStatus(member.id, field, val);
    if (!err) {
      await insertEntryLog({
        attendee_id: member.id,
        event_id: eventId,
        action_type: field,
        status: val,
        admin_email: adminEmail
      });

      setAttendees(prev => prev.map(a => a.id === member.id ? { ...a, [field]: val } : a));
      setMember(prev => prev ? { ...prev, [field]: val } : null);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddError("");

    if (!addForm.name.trim()) {
      setAddError("Full Name is required.");
      return;
    }

    const studentId = addForm.isGuest 
      ? `GUEST-${Math.floor(100000 + Math.random() * 900000)}` 
      : addForm.sid.trim();

    if (!addForm.isGuest && !studentId) {
      setAddError("Student ID is required for student registration.");
      return;
    }

    const email = addForm.email.trim() || `${studentId.toLowerCase()}@onspot.local`;

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
      reference: addForm.ref ? addForm.ref.trim() : null,
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
      setAddError(error?.message || "Failed to add attendee.");
    }
  };

  const handlePromptAction = async (checkIn) => {
    if (!pendingAttendee) return;
    if (checkIn) {
      await updateAttendeeStatus(pendingAttendee.id, 'checked_in_1', true);
      await insertEntryLog({
        attendee_id: pendingAttendee.id,
        event_id: eventId,
        action_type: 'checked_in_1',
        status: true,
        admin_email: adminEmail
      });
      selectMember({ ...pendingAttendee, checked_in_1: true });
    } else {
      selectMember(pendingAttendee);
    }
    setShowPromptModal(false);
    setPendingAttendee(null);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 italic selection:bg-green-500/30 selection:text-slate-950 pb-20">
      
      {/* HEADER BAR (RETAINED INTACT) */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/events')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            title="Back to Events"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{event?.title}</h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Event Gate Control & Check-In Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate(`/events/${eventId}/kiosk`)}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all min-h-[44px]"
          >
            <IdCard size={15} className="text-purple-400" />
            <span>Launch Kiosk</span>
          </button>
        </div>
      </header>

      {/* MAIN 2-COLUMN LAYOUT: LEFT (SEARCH + LIST) vs TOP RIGHT (QUICK STATS + LOGS) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT SIDE: SEARCH BAR WITH BESIDE BUTTONS & ATTENDEE LIST (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* SEARCH BAR WITH BESIDE ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-center">
            {/* SEARCH INPUT */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                value={searchInput} 
                onChange={e => setSearchInput(e.target.value)} 
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filtered.length > 0) {
                      selectMember(filtered[0]);
                    } else if (searchInput.trim()) {
                      setError(`No attendee matching "${searchInput}" found.`);
                    }
                  }
                }}
                placeholder="Search name, ID, email, or reference (Press Enter to open)..." 
                className="w-full bg-slate-900 border border-slate-800 focus:border-green-500 focus:ring-1 focus:ring-green-500/50 p-3.5 pl-10 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none transition-colors min-h-[46px]" 
              />
              {searchInput && (
                <button 
                  onClick={() => setSearchInput('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* ACTION BUTTONS DIRECTLY BESIDE SEARCH BAR */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button 
                onClick={() => showScanner ? stopScanner() : setShowScanner(true)}
                className={`flex-1 sm:flex-none px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-h-[46px] shadow-sm ${showScanner ? 'bg-red-600 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}`}
              >
                {showScanner ? <X size={16}/> : <QrCode size={16}/>}
                <span>{showScanner ? 'Close Scanner' : 'Scan QR'}</span>
              </button>

              <button 
                onClick={() => setShowAddModal(true)}
                className="flex-1 sm:flex-none px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-h-[46px] shadow-sm"
              >
                <UserPlus size={16} />
                <span>On-Spot Reg</span>
              </button>
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

          {/* ATTENDEE LIST CARD */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm min-h-[450px]">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium pb-2 border-b border-slate-800/80">
              <span>Attendee List ({filtered.length})</span>
              <span>Click item to manage</span>
            </div>

            <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
              {filtered.length > 0 ? filtered.slice(0, 80).map(m => (
                <button 
                  key={m.id} 
                  onClick={() => selectMember(m)} 
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between group ${member?.id === m.id ? 'bg-blue-600/10 border-blue-500/50 shadow-sm' : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img 
                        src={m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.full_name)}&background=0f172a&color=cbd5e1`} 
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
                            On-Spot
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${m.checked_in_1 ? 'bg-green-500' : 'bg-slate-800'}`} title="Checked In"></div>
                      <div className={`w-2 h-2 rounded-full ${m.token_given ? 'bg-purple-500' : 'bg-slate-800'}`} title="Food Token"></div>
                      <div className={`w-2 h-2 rounded-full ${m.checked_in_2 ? 'bg-blue-500' : 'bg-slate-800'}`} title="Gift"></div>
                    </div>
                  </div>
                </button>
              )) : (
                <div className="text-center py-16 text-xs text-slate-500">No matching attendees found</div>
              )}
            </div>
          </div>
        </div>

        {/* TOP RIGHT SIDE: QUICK STATS ANALYTICS + LIVE ENTRY LOGS (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* QUICK STATS ANALYTICS BLOCK */}
          <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-blue-500" />
                Event Quick Stats
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-bold">
                {stats.percent}% Checked In
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total Registered" value={stats.total} color="bg-slate-950/60" char="R" />
              <StatCard label="Checked In" value={stats.checkedIn} color="bg-green-500/10 border-green-500/20" char="C" />
              <StatCard label="Remaining" value={stats.remaining} color="bg-slate-950/60" char="P" />
              <StatCard label="On-Spot Reg" value={stats.onSpot} color="bg-purple-500/10 border-purple-500/20" char="S" />
            </div>

            {/* CHECK-IN PROGRESS BAR */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Overall Progress</span>
                <span className="font-mono text-white font-medium">{stats.checkedIn} / {stats.total}</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="bg-gradient-to-r from-green-600 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.percent}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* LIVE RECENT ACTIVITY LOGS */}
          <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl space-y-3 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock size={14} className="text-purple-400" />
              Live Entry Timeline
            </h3>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {globalHistory.length > 0 ? globalHistory.slice(0, 15).map(log => (
                <div key={log.id} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-white">{log.attendee?.full_name || 'Attendee'}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {log.action_type === 'checked_in_1' ? 'Gate Entry' : log.action_type === 'token_given' ? 'Food Token' : 'Gift Swag'} &bull; {log.status ? 'Granted' : 'Revoked'}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )) : (
                <p className="text-center py-6 text-xs text-slate-500">No recent entry activity</p>
              )}
            </div>
          </div>

        </div>

      </main>

      {/* BOTTOM DRAWER MODAL (SLIDES UP ON ATTENDEE SELECTION) */}
      {member && (
        <div className="fixed inset-0 z-[300] flex flex-col justify-end bg-slate-950/80 backdrop-blur-md p-0 sm:p-4 overflow-hidden animate-in fade-in duration-200">
          <div className="w-full max-w-5xl mx-auto bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
            
            {/* DRAWER TOP BAR WITH CLOSE BUTTON & ADMIN ACTIONS */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">Attendee Check-In Management</h3>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <>
                    <button
                      onClick={openEditAttendeeModal}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-blue-600/20 text-slate-300 hover:text-blue-400 border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                      title="Edit Attendee Info"
                    >
                      <Pencil size={15} />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      onClick={handleDeleteAttendee}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-red-600/20 text-slate-300 hover:text-red-400 border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                      title="Delete Attendee"
                    >
                      <Trash2 size={15} />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </>
                )}
                <button 
                  onClick={() => setMember(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="Close Drawer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* DRAWER BODY: LEFT HALF (INFO) vs RIGHT HALF (CHECKBOXES) */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* LEFT HALF: ATTENDEE DETAILS */}
                <div className="md:col-span-6 space-y-4 border-b md:border-b-0 md:border-r border-slate-800 pb-6 md:pb-0 md:pr-6">
                  <div className="flex items-start gap-4">
                    <img 
                      src={member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name)}&background=0f172a&color=cbd5e1`} 
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-slate-700 object-cover shadow-md shrink-0" 
                      alt={member.full_name}
                    />
                    <div className="space-y-1">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide border ${member.is_on_spot ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}>
                        {member.is_on_spot ? 'On-Spot Reg' : 'Pre-Registered'}
                      </span>
                      <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{member.full_name}</h2>
                      <p className="text-xs font-mono text-green-400 font-medium">ID: {member.student_id}</p>
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2 text-xs">
                    {member.email && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5"><Mail size={13} /> Email</span>
                        <span className="text-slate-200 font-mono truncate max-w-[220px]">{member.email}</span>
                      </div>
                    )}
                    {member.phone && (
                      <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
                        <span className="text-slate-400 flex items-center gap-1.5"><Phone size={13} /> Phone</span>
                        <span className="text-slate-200 font-mono">{member.phone}</span>
                      </div>
                    )}
                    {member.reference && (
                      <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
                        <span className="text-slate-400">Reference / Host</span>
                        <span className="text-purple-400 font-medium">{member.reference}</span>
                      </div>
                    )}
                    {member.additional_info && (
                      <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
                        <span className="text-slate-400">Info</span>
                        <span className="text-slate-300">{member.additional_info}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT HALF: CHECK-IN ACTION CHECKBOXES */}
                <div className="md:col-span-6 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gate Check-In Actions</h4>
                  
                  <div className="space-y-3">
                    {/* GATE 1 ENTRY CHECKBOX */}
                    <GateActionButton
                      label="Gate Entry Check-In"
                      active={!!member.checked_in_1}
                      onClick={() => updateStatus('checked_in_1', !member.checked_in_1)}
                      icon={<UserCheck size={20}/>}
                      color="#22c55e"
                    />

                    {/* MEAL / FOOD TOKEN CHECKBOX */}
                    <GateActionButton
                      label="Meal / Food Token"
                      active={!!member.token_given}
                      onClick={() => updateStatus('token_given', !member.token_given)}
                      icon={<Ticket size={20}/>}
                      color="#a855f7"
                    />

                    {/* GIFT / SWAG KIT CHECKBOX */}
                    <GateActionButton
                      label="Gift / Swag Kit"
                      active={!!member.checked_in_2}
                      onClick={() => updateStatus('checked_in_2', !member.checked_in_2)}
                      icon={<CheckCircle2 size={20}/>}
                      color="#3b82f6"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* STICKY FOOTER */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 shrink-0">
              <button
                onClick={() => setMember(null)}
                className="w-full py-3 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all min-h-[44px]"
              >
                Done & Close Drawer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ON-SPOT REGISTRATION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-purple-400" />
                <h3 className="text-base font-bold text-white">On-Spot Registration</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            {addError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="flex items-center justify-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddForm(prev => ({ ...prev, isGuest: false }))}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${!addForm.isGuest ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setAddForm(prev => ({ ...prev, isGuest: true }))}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${addForm.isGuest ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  Guest / Visitor
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-medium">Full Name *</label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={e => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name..."
                    required
                    className="w-full mt-1 bg-slate-950 border border-slate-800 p-3 rounded-xl text-white outline-none focus:border-purple-500 min-h-[44px]"
                  />
                </div>

                {!addForm.isGuest && (
                  <div>
                    <label className="text-slate-300 font-medium">Student ID *</label>
                    <input
                      type="text"
                      value={addForm.sid}
                      onChange={e => setAddForm(prev => ({ ...prev, sid: e.target.value }))}
                      placeholder="e.g. 2020101"
                      required
                      className="w-full mt-1 bg-slate-950 border border-slate-800 p-3 rounded-xl text-white font-mono outline-none focus:border-purple-500 min-h-[44px]"
                    />
                  </div>
                )}

                <div>
                  <label className="text-slate-300 font-medium">{addForm.isGuest ? 'Reference Person / Host *' : 'Reference Person / Host (Optional)'}</label>
                  <input
                    type="text"
                    value={addForm.ref}
                    onChange={e => setAddForm(prev => ({ ...prev, ref: e.target.value }))}
                    placeholder="e.g. Dr. Rahman (Faculty Host)"
                    required={addForm.isGuest}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 p-3 rounded-xl text-white outline-none focus:border-purple-500 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium">Email (Optional)</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={e => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@example.com"
                    className="w-full mt-1 bg-slate-950 border border-slate-800 p-3 rounded-xl text-white font-mono outline-none focus:border-purple-500 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium">Phone (Optional)</label>
                  <input
                    type="text"
                    value={addForm.phone}
                    onChange={e => setAddForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Phone number..."
                    className="w-full mt-1 bg-slate-950 border border-slate-800 p-3 rounded-xl text-white font-mono outline-none focus:border-purple-500 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-all min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-all min-h-[44px]"
                >
                  Register On-Spot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSTANT CHECK-IN PROMPT MODAL */}
      {showPromptModal && pendingAttendee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-md p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Attendee Registered</h3>
              <p className="text-xs text-slate-400">
                <span className="text-white font-semibold">{pendingAttendee.full_name}</span> has been added. Would you like to check them in right now?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handlePromptAction(false)}
                className="flex-1 py-3 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-xs font-medium transition-all min-h-[44px]"
              >
                No, Just Register
              </button>
              <button
                onClick={() => handlePromptAction(true)}
                className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-semibold transition-all min-h-[44px]"
              >
                Yes, Check In Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN EDIT ATTENDEE MODAL */}
      {showEditModal && member && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-left">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Pencil size={16} className="text-blue-400" />
                Edit Attendee Details
              </h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateAttendee} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium">Full Name *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full mt-1 bg-slate-950 border border-slate-800 p-3 rounded-xl text-white outline-none focus:border-blue-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium">Student ID *</label>
                <input
                  type="text"
                  value={editForm.sid}
                  onChange={e => setEditForm(prev => ({ ...prev, sid: e.target.value }))}
                  required
                  className="w-full mt-1 bg-slate-950 border border-slate-800 p-3 rounded-xl text-white font-mono outline-none focus:border-blue-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 p-3 rounded-xl text-white font-mono outline-none focus:border-blue-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium">Phone</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 p-3 rounded-xl text-white font-mono outline-none focus:border-blue-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium">Reference Person / Host</label>
                <input
                  type="text"
                  value={editForm.ref}
                  onChange={e => setEditForm(prev => ({ ...prev, ref: e.target.value }))}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 p-3 rounded-xl text-white outline-none focus:border-blue-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium">Additional Info</label>
                <input
                  type="text"
                  value={editForm.info}
                  onChange={e => setEditForm(prev => ({ ...prev, info: e.target.value }))}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 p-3 rounded-xl text-white outline-none focus:border-blue-500 min-h-[44px]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-xs font-medium min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold min-h-[44px]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default GateControl;
