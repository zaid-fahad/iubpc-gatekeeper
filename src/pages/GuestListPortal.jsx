import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, UserPlus, Upload, Search, Download, Clock, X, Pencil, Trash2, Award, Sparkles, FileArchive } from 'lucide-react';
import Papa from 'papaparse';
import { fetchEventById } from '../api/events';
import { fetchEventAttendees, insertAttendee, bulkInsertAttendees, updateAttendee, deleteAttendee } from '../api/attendees';
import { LoadingSpinner, CertificateGeneratorModal } from '../components';

const GuestListPortal = ({ userRole }) => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const isAdmin = userRole === 'admin';
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', sid: '', img: '', phone: '', ref: '' });

  const toggleSelectAll = (filteredList) => {
    if (selectedIds.length === filteredList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredList.map(a => a.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const [editingAttendee, setEditingAttendee] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', sid: '', phone: '', ref: '' });

  const openEditModal = (att) => {
    setEditingAttendee(att);
    setEditForm({
      name: att.full_name || '',
      email: att.email || '',
      sid: att.student_id || '',
      phone: att.phone || '',
      ref: att.reference || ''
    });
  };

  const handleUpdateAttendee = async (e) => {
    e.preventDefault();
    if (!editingAttendee || !editForm.name.trim()) return;

    const updates = {
      full_name: editForm.name.trim(),
      student_id: editForm.sid.trim(),
      email: editForm.email.trim() || null,
      phone: editForm.phone.trim() || null,
      reference: editForm.ref.trim() || null
    };

    const { error } = await updateAttendee(editingAttendee.id, updates);
    if (!error) {
      setAttendees(prev => prev.map(a => a.id === editingAttendee.id ? { ...a, ...updates } : a));
      setEditingAttendee(null);
    } else {
      alert("Failed to update attendee: " + error.message);
    }
  };

  const handleDeleteAttendee = async (att) => {
    if (!window.confirm(`Are you sure you want to delete "${att.full_name}" (${att.student_id})?`)) {
      return;
    }

    const { error } = await deleteAttendee(att.id);
    if (!error) {
      setAttendees(prev => prev.filter(a => a.id !== att.id));
    } else {
      alert("Failed to delete attendee: " + error.message);
    }
  };

  const fetchAttendees = useCallback(async () => {
    setLoading(true);
    const { data } = await fetchEventAttendees(eventId);
    setAttendees(data || []);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const { data: eventData } = await fetchEventById(eventId);
        if (!isMounted) return;
        setEvent(eventData || { id: eventId, title: 'Event Attendee Portal' });
        await fetchAttendees();
      } catch (err) {
        if (!isMounted) return;
        setEvent({ id: eventId, title: 'Event Attendee Portal' });
        await fetchAttendees();
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [eventId, fetchAttendees]);

  const handleManualAdd = async (e) => {
    e.preventDefault();
    
    // Pre-flight check for duplicates
    const isDuplicate = attendees.some(a => 
      (form.email && a.email?.toLowerCase() === form.email.toLowerCase()) || 
      (form.sid && a.student_id === form.sid)
    );

    if (isDuplicate) {
      alert("Attendee with this Email or Student ID already exists.");
      return;
    }

    const { error } = await insertAttendee({ 
      event_id: eventId, 
      full_name: form.name, 
      email: form.email, 
      student_id: form.sid, 
      avatar_url: form.img || null,
      phone: form.phone,
      reference: form.ref 
    });
    if (!error) { setShowAdd(false); setForm({ name:'', email:'', sid:'', img:'', phone:'', ref:'' }); fetchAttendees(); }
    else alert(error.message);
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, { header: true, skipEmptyLines: true, complete: async (res) => {
      const data = res.data.filter(r => r.student_id).map(r => ({ 
        event_id: eventId, 
        full_name: r.name || 'Anonymous', 
        email: r.email || '', 
        student_id: r.student_id, 
        avatar_url: r.image_link || null,
        phone: r.phone || null,
        reference: r.ref || r.reference || null
      }));
      const { error } = await bulkInsertAttendees(data);
      if (!error) fetchAttendees();
      else alert(error.message);
    }});
  };

  const downloadTemplate = () => {
    try {
      const csvData = "name,email,student_id,image_link,phone,ref\nSample Name,sample@iub.edu.bd,2120000,https://i.pravatar.cc/150,01700000000,N/A";
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "iubpc_template.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (e) {
      console.error("Download failed", e);
    }
  };

  const filtered = attendees.filter(a => {
    const matchesSearch = 
      a.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.student_id?.includes(searchTerm) ||
      a.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.phone?.includes(searchTerm);

    if (!matchesSearch) return false;

    if (statusFilter === 'checked_in') return a.checked_in_1 || a.checked_in_2;
    if (statusFilter === 'pending') return !a.checked_in_1 && !a.checked_in_2;
    if (statusFilter === 'token') return a.token_given;
    if (statusFilter === 'gift') return a.checked_in_2;

    return true;
  });

  if (!event && loading) return <LoadingSpinner />;

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
            <h2 className="text-2xl lg:text-3xl font-black italic text-white uppercase tracking-tighter italic leading-none">{event?.title}</h2>
            <p className="text-purple-400 text-[9px] font-black uppercase tracking-[0.3em] mt-2 italic">Attendee Database</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <button 
              onClick={() => navigate(`/events/${eventId}/certificate-designer`)} 
              className="px-4 py-2.5 bg-slate-900 text-purple-400 hover:text-purple-300 rounded-xl border border-purple-500/30 hover:border-purple-500/60 active:scale-95 shadow-lg transition-all font-black text-[9px] uppercase tracking-widest flex items-center gap-2"
              title="Design Certificate Template"
            >
              <Award size={16}/> Design Certificate
            </button>
          )}

          <button 
            onClick={() => setShowCertModal(true)} 
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl active:scale-95 shadow-lg shadow-purple-600/20 transition-all font-black text-[9px] uppercase tracking-widest flex items-center gap-2"
          >
            <FileArchive size={16}/> Generate Certificates {selectedIds.length > 0 ? `(${selectedIds.length} Selected)` : ''}
          </button>

          <button onClick={() => setShowAdd(true)} className="px-4 py-2.5 bg-slate-800 text-green-400 rounded-xl border border-slate-700 active:scale-95 shadow-lg transition-all font-black text-[9px] uppercase tracking-widest flex items-center gap-2"><UserPlus size={16}/> Add Attendee</button>
          <label className="px-4 py-2.5 bg-green-500 text-slate-950 rounded-xl cursor-pointer hover:bg-green-400 transition-all active:scale-95 flex items-center justify-center border-b-4 border-green-700 shadow-xl font-black text-[9px] uppercase tracking-widest gap-2 italic">
            <Upload size={16} /> Import CSV <input type="file" className="hidden" accept=".csv" onChange={handleCsvUpload} />
          </label>
        </div>
      </header>

      <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl space-y-4 italic shadow-xl">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center italic">
          <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-green-500 transition-colors" size={16} />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-3 pl-9 rounded-xl text-xs font-bold text-white shadow-inner outline-none italic placeholder:text-slate-700" placeholder="Search attendees..." />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs font-bold text-slate-300 outline-none cursor-pointer"
            >
              <option value="all">Filter: All Attendees ({attendees.length})</option>
              <option value="checked_in">Filter: Checked-In Only</option>
              <option value="pending">Filter: Pending Only</option>
              <option value="token">Filter: Token Issued</option>
              <option value="gift">Filter: Gift Collected</option>
            </select>
          </div>

          <div className="flex items-center gap-4 italic">
            <button onClick={downloadTemplate} className="text-[9px] font-black text-slate-200 hover:text-green-400 uppercase tracking-widest flex items-center gap-2 transition-all italic leading-none"><Download size={20}/> Get Template</button>
            <div className="h-3 w-px bg-slate-800"></div>
            <span className="text-[9px] font-black text-purple-400 uppercase tracking-[0.2em] italic leading-none">{filtered.length} Displayed</span>
          </div>
        </div>
      </div>

      <main className="italic pb-20">
        {loading ? (
          <div className="py-20 flex justify-center opacity-10"><Clock className="animate-spin" size={40}/></div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="lg:hidden grid grid-cols-1 gap-3 max-w-2xl mx-auto pb-40">
              {filtered.map(row => (
                <div key={row.id} className="bg-slate-900 border border-slate-800 p-6 rounded-[2.8rem] flex items-center justify-between group hover:border-slate-700 transition-all shadow-xl relative overflow-hidden italic">
                  <div className="flex items-center gap-4 relative z-10">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(row.id)} 
                      onChange={() => toggleSelect(row.id)} 
                      className="w-5 h-5 accent-purple-500 rounded cursor-pointer shrink-0" 
                    />
                    <img src={row.avatar_url || `https://ui-avatars.com/api/?name=${row.full_name}&background=0f172a&color=fff`} className="w-14 h-14 rounded-3xl border-2 border-slate-950 object-cover bg-slate-800 shadow-md shrink-0" />
                    <div>
                        <p className="text-base font-black text-white italic leading-none truncate max-w-[150px] uppercase tracking-tighter">{row.full_name}</p>
                        <p className="text-[10px] font-bold text-slate-600 uppercase mt-2 tracking-tight italic">ID: {row.student_id}</p>
                        {row.phone && <p className="text-[10px] font-bold text-green-500 uppercase tracking-tight italic mt-0.5">{row.phone}</p>}
                        {row.reference && <p className="text-[9px] font-black text-purple-500 uppercase tracking-widest mt-1 italic">Ref: {row.reference}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 items-end relative z-10 opacity-30 group-hover:opacity-100 transition-opacity">
                    <div className={`w-3.5 h-3.5 rounded-full shadow-lg ${row.checked_in_1 ? 'bg-green-500 shadow-green-500/20' : 'bg-slate-800 animate-pulse'}`}></div>
                    <div className={`w-3.5 h-3.5 rounded-full shadow-lg ${row.token_given ? 'bg-purple-500 shadow-purple-500/20' : 'bg-slate-800'}`}></div>
                    <div className={`w-3.5 h-3.5 rounded-full shadow-lg ${row.checked_in_2 ? 'bg-blue-500 shadow-blue-500/20' : 'bg-slate-800'}`}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden lg:block max-w-6xl mx-auto pb-40">
              <div className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/50 border-b border-slate-800">
                      <th className="p-6 w-12 text-center">
                        <input 
                          type="checkbox" 
                          checked={filtered.length > 0 && selectedIds.length === filtered.length} 
                          onChange={() => toggleSelectAll(filtered)} 
                          className="w-4 h-4 accent-purple-500 rounded cursor-pointer" 
                        />
                      </th>
                      <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Attendee</th>
                      <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Contact & ID</th>
                      <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Check-in 1</th>
                      <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Token</th>
                      <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Gift</th>
                      {isAdmin && <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filtered.map(row => (
                      <tr key={row.id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="p-6 w-12 text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.includes(row.id)} 
                            onChange={() => toggleSelect(row.id)} 
                            className="w-4 h-4 accent-purple-500 rounded cursor-pointer" 
                          />
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <img src={row.avatar_url || `https://ui-avatars.com/api/?name=${row.full_name}&background=0f172a&color=fff`} className="w-12 h-12 rounded-2xl border border-slate-950 object-cover bg-slate-800" />
                            <div>
                                <span className="text-sm font-black text-white uppercase tracking-tight block">{row.full_name}</span>
                                {row.reference && <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest mt-1 block">Ref: {row.reference}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{row.student_id}</p>
                            {row.phone && <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider">{row.phone}</p>}
                            <p className="text-xs font-medium text-slate-400 lowercase">{row.email}</p>
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <div className={`mx-auto w-3 h-3 rounded-full shadow-lg ${row.checked_in_1 ? 'bg-green-500 shadow-green-500/40' : 'bg-slate-800'}`}></div>
                        </td>
                        <td className="p-6 text-center">
                          <div className={`mx-auto w-3 h-3 rounded-full shadow-lg ${row.token_given ? 'bg-purple-500 shadow-purple-500/40' : 'bg-slate-800'}`}></div>
                        </td>
                        <td className="p-6 text-center">
                          <div className={`mx-auto w-3 h-3 rounded-full shadow-lg ${row.checked_in_2 ? 'bg-blue-500 shadow-blue-500/40' : 'bg-slate-800'}`}></div>
                        </td>
                        {isAdmin && (
                          <td className="p-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedIds([row.id]);
                                  setShowCertModal(true);
                                }}
                                className="p-2 bg-slate-950 border border-slate-800 hover:border-purple-500/50 text-purple-400 hover:text-purple-300 rounded-xl transition-all"
                                title="Export Single Certificate PDF"
                              >
                                <Award size={15} />
                              </button>
                              <button
                                onClick={() => openEditModal(row)}
                                className="p-2 bg-slate-950 border border-slate-800 hover:border-blue-500/50 text-slate-300 hover:text-blue-400 rounded-xl transition-all"
                                title="Edit Attendee"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteAttendee(row)}
                                className="p-2 bg-slate-950 border border-slate-800 hover:border-red-500/50 text-slate-300 hover:text-red-400 rounded-xl transition-all"
                                title="Delete Attendee"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        {!loading && filtered.length === 0 && <div className="text-center py-20 opacity-20 italic font-black uppercase text-xs tracking-[0.5em]">No attendees found</div>}
      </main>

      {/* MANUAL REGISTRATION MODAL */}
      {showAdd && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl animate-in zoom-in duration-300 italic">
            <form onSubmit={handleManualAdd} className="relative bg-slate-900 border border-slate-800 rounded-[3.5rem] p-10 w-full max-w-md space-y-6 shadow-2xl text-left italic">
                <div className="flex justify-between items-center italic"><h2 className="text-3xl font-black italic text-white tracking-tighter uppercase leading-none italic">Manual Registration</h2><X className="text-slate-500 cursor-pointer hover:text-white transition-colors italic" onClick={() => setShowAdd(false)} /></div>
                <div className="space-y-4 italic">
                    <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="FULL NAME" required className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-sm font-bold text-white outline-none focus:ring-1 focus:ring-green-500/50 shadow-inner italic uppercase tracking-widest" />
                    <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="EMAIL ADDRESS" required className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-sm font-bold text-white outline-none focus:ring-1 focus:ring-green-500/50 shadow-inner italic uppercase tracking-widest" />
                    <input value={form.sid} onChange={e => setForm({...form, sid: e.target.value})} placeholder="STUDENT ID" required className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-sm font-bold text-white outline-none focus:ring-1 focus:ring-green-500/50 shadow-inner italic uppercase tracking-widest" />
                    <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="PHONE NUMBER" className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-sm font-bold text-white outline-none focus:ring-1 focus:ring-green-500/50 shadow-inner italic uppercase tracking-widest" />
                    <input value={form.ref} onChange={e => setForm({...form, ref: e.target.value})} placeholder="REFERENCE (OPTIONAL)" className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-sm font-bold text-white outline-none focus:ring-1 focus:ring-green-500/50 shadow-inner italic uppercase tracking-widest" />
                    <input value={form.img} onChange={e => setForm({...form, img: e.target.value})} placeholder="IMAGE URL" className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-sm font-bold text-white outline-none focus:ring-1 focus:ring-green-500/50 shadow-inner italic uppercase tracking-widest" />
                </div>
                <button className="w-full py-5 bg-green-500 text-slate-950 font-black rounded-2xl uppercase tracking-widest shadow-xl shadow-green-500/20 active:scale-95 transition-all border-b-4 border-green-700 italic">CONFIRM ATTENDEE</button>
            </form>
        </div>
      )}

      {/* EDIT ATTENDEE MODAL */}
      {editingAttendee && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl animate-in zoom-in duration-300">
            <form onSubmit={handleUpdateAttendee} className="relative bg-slate-900 border border-slate-800 rounded-[3rem] p-8 sm:p-10 w-full max-w-md space-y-5 shadow-2xl text-left">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Pencil size={18} className="text-blue-400" />
                    Edit Attendee Details
                  </h2>
                  <X className="text-slate-500 cursor-pointer hover:text-white transition-colors" onClick={() => setEditingAttendee(null)} />
                </div>
                <div className="space-y-3.5 text-xs">
                    <div>
                      <label className="text-slate-300 font-medium">Full Name *</label>
                      <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="FULL NAME" required className="w-full mt-1 bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="text-slate-300 font-medium">Student ID *</label>
                      <input value={editForm.sid} onChange={e => setEditForm({...editForm, sid: e.target.value})} placeholder="STUDENT ID" required className="w-full mt-1 bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-xs font-mono text-white outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="text-slate-300 font-medium">Email Address</label>
                      <input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} placeholder="EMAIL ADDRESS" className="w-full mt-1 bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-xs font-mono text-white outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="text-slate-300 font-medium">Phone Number</label>
                      <input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="PHONE NUMBER" className="w-full mt-1 bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-xs font-mono text-white outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="text-slate-300 font-medium">Reference Person / Host</label>
                      <input value={editForm.ref} onChange={e => setEditForm({...editForm, ref: e.target.value})} placeholder="REFERENCE" className="w-full mt-1 bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500" />
                    </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setEditingAttendee(null)} className="flex-1 py-3 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-xs font-medium min-h-[44px]">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all min-h-[44px]">Save Changes</button>
                </div>
            </form>
        </div>
      )}

      {/* CERTIFICATE BATCH GENERATOR MODAL */}
      <CertificateGeneratorModal
        isOpen={showCertModal}
        onClose={() => setShowCertModal(false)}
        eventId={eventId}
        eventTitle={event?.title || 'Event'}
        attendees={attendees}
        selectedIds={selectedIds}
      />
    </div>
  );
};

export default GuestListPortal;
