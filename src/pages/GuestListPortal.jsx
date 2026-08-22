import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, UserPlus, Search, Download, Clock, X, Pencil, Trash2, Award, Sparkles, FileArchive, FileText, Eye, CheckCircle2, QrCode, LayoutGrid, List } from 'lucide-react';
import { fetchEventById } from '../api/events';
import { fetchEventAttendees, updateAttendee, deleteAttendee } from '../api/attendees';
import { LoadingSpinner, CertificateGeneratorModal, PassGeneratorModal, AddAttendeeModal } from '../components';
import { generateConfirmationPDF } from '../utils/confirmationPdfGenerator';

const GuestListPortal = ({ userRole }) => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const isAdmin = userRole === 'admin';
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [showAdd, setShowAdd] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [editingAttendee, setEditingAttendee] = useState(null);
  const [viewingAttendee, setViewingAttendee] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', sid: '', phone: '', ref: '' });

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
    fetchEventById(eventId).then(({ data }) => setEvent(data));
    fetchAttendees();
  }, [eventId, fetchAttendees]);

  // Filter attendees
  const filtered = attendees.filter(a => {
    const matchesSearch = 
      a.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.reference?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'checked_in') return a.checked_in_1 || a.checked_in_2;
    if (statusFilter === 'pending') return !a.checked_in_1 && !a.checked_in_2;
    if (statusFilter === 'token') return a.token_given;
    if (statusFilter === 'gift') return a.checked_in_2;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans italic">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.history.state?.idx > 0 ? navigate(-1) : navigate('/events')} 
            className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all active:scale-95 shadow-lg"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl lg:text-3xl font-black italic text-white uppercase tracking-tighter italic leading-none">{event?.title}</h2>
            <p className="text-purple-400 text-[9px] font-black uppercase tracking-[0.3em] mt-2 italic">Attendee Database & Pass Generator</p>
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

          <button
            onClick={() => setShowPassModal(true)}
            className="px-4 py-2.5 bg-slate-900 text-emerald-400 hover:text-emerald-300 rounded-xl border border-emerald-500/30 hover:border-emerald-500/60 active:scale-95 shadow-lg transition-all font-black text-[9px] uppercase tracking-widest flex items-center gap-2"
            title="Export Registration Passes (Multi-Page PDF / ZIP Archive)"
          >
            <FileText size={16}/> 
            <span>Export Passes {selectedIds.length > 0 ? `(${selectedIds.length} Selected)` : ''}</span>
          </button>

          <button onClick={() => setShowAdd(true)} className="px-4 py-2.5 bg-slate-800 text-green-400 rounded-xl border border-slate-700 active:scale-95 shadow-lg transition-all font-black text-[9px] uppercase tracking-widest flex items-center gap-2"><UserPlus size={16}/> Add Attendee / On-Spot</button>
        </div>
      </header>

      {/* FILTER & TOOLBAR WITH TABLE/GRID VIEW TOGGLE */}
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
            {/* VIEW MODE TOGGLE BUTTONS */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button 
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-all flex items-center justify-center ${viewMode === 'table' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                title="Table List View"
              >
                <List size={15} />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all flex items-center justify-center ${viewMode === 'grid' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                title="Card Grid View"
              >
                <LayoutGrid size={15} />
              </button>
            </div>

            <span className="text-[9px] font-black text-purple-400 uppercase tracking-[0.2em] italic leading-none">{filtered.length} Displayed</span>
          </div>
        </div>
      </div>

      <main className="italic pb-20">
        {loading ? (
          <div className="py-20 flex justify-center opacity-10"><Clock className="animate-spin" size={40}/></div>
        ) : (
          <>
            {/* VIEW MODE A: GRID VIEW */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto pb-40">
                {filtered.map(row => (
                  <div key={row.id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(row.id)} 
                          onChange={() => toggleSelect(row.id)} 
                          className="w-5 h-5 accent-purple-500 rounded cursor-pointer shrink-0" 
                        />
                        <img src={row.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.full_name)}&background=0f172a&color=fff`} className="w-12 h-12 rounded-2xl border border-slate-950 object-cover bg-slate-800 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-white uppercase tracking-tight truncate max-w-[140px]">{row.full_name}</p>
                          <p className="text-[10px] font-mono text-slate-400">ID: {row.student_id}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <div className={`w-3 h-3 rounded-full ${row.checked_in_1 ? 'bg-green-500' : 'bg-slate-800'}`}></div>
                        <div className={`w-3 h-3 rounded-full ${row.token_given ? 'bg-purple-500' : 'bg-slate-800'}`}></div>
                        <div className={`w-3 h-3 rounded-full ${row.checked_in_2 ? 'bg-blue-500' : 'bg-slate-800'}`}></div>
                      </div>
                    </div>

                    {/* ROW ACTION BAR (VIEW, EDIT, DELETE) */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-1.5">
                      <button onClick={() => setViewingAttendee(row)} className="p-2 bg-slate-950 border border-slate-800 hover:border-purple-500 text-purple-400 rounded-xl transition-all" title="View Attendee Profile & Export Documents">
                        <Eye size={15} />
                      </button>

                      {isAdmin && (
                        <>
                          <button onClick={() => openEditModal(row)} className="p-2 bg-slate-950 border border-slate-800 hover:border-blue-500 text-blue-400 rounded-xl transition-all" title="Edit Attendee">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDeleteAttendee(row)} className="p-2 bg-slate-950 border border-slate-800 hover:border-red-500 text-red-400 rounded-xl transition-all" title="Delete Attendee">
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VIEW MODE B: TABLE LIST VIEW */}
            {viewMode === 'table' && (
              <div className="max-w-6xl mx-auto pb-40">
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
                        <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
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
                              <img src={row.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.full_name)}&background=0f172a&color=fff`} className="w-12 h-12 rounded-2xl border border-slate-950 object-cover bg-slate-800" />
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
                          <td className="p-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setViewingAttendee(row)}
                                className="p-2 bg-slate-950 border border-slate-800 hover:border-purple-500/50 text-purple-400 hover:text-purple-300 rounded-xl transition-all"
                                title="View Attendee Profile & Form Responses"
                              >
                                <Eye size={15} />
                              </button>

                              {isAdmin && (
                                <>
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
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
        {!loading && filtered.length === 0 && <div className="text-center py-20 opacity-20 italic font-black uppercase text-xs tracking-[0.5em]">No attendees found</div>}
      </main>

      {/* VIEW ATTENDEE PROFILE MODAL WITH PASS & CERTIFICATE EXPORT BUTTONS */}
      {viewingAttendee && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl animate-in zoom-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-lg space-y-6 shadow-2xl text-left">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <img src={viewingAttendee.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewingAttendee.full_name)}&background=0f172a&color=fff`} className="w-12 h-12 rounded-2xl border border-slate-800 object-cover" />
                <div>
                  <h3 className="text-base font-bold text-white uppercase">{viewingAttendee.full_name}</h3>
                  <span className="text-xs font-mono text-purple-400">{viewingAttendee.student_id}</span>
                </div>
              </div>
              <X className="text-slate-500 cursor-pointer hover:text-white" onClick={() => setViewingAttendee(null)} />
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Email</span>
                  <span className="text-slate-200 font-bold">{viewingAttendee.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Phone</span>
                  <span className="text-slate-200 font-bold">{viewingAttendee.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Reference</span>
                  <span className="text-emerald-400 font-bold">{viewingAttendee.reference || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Category</span>
                  <span className="text-purple-400 font-bold">{viewingAttendee.category || 'Participant'}</span>
                </div>
              </div>

              {/* CUSTOM RESPONSES DISPLAY */}
              {viewingAttendee.custom_responses && Object.keys(viewingAttendee.custom_responses).length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Custom Form Responses</span>
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 max-h-40 overflow-y-auto">
                    {Object.entries(viewingAttendee.custom_responses).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center text-[11px] border-b border-slate-900 pb-1">
                        <span className="text-slate-400 font-medium">{k}:</span>
                        <span className="text-white font-bold">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* DOCUMENT EXPORT BUTTONS INSIDE VIEW MODAL */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => generateConfirmationPDF(viewingAttendee, event?.title)}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <FileText size={15} />
                <span>Export Pass PDF</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => {
                    setSelectedIds([viewingAttendee.id]);
                    setShowCertModal(true);
                    setViewingAttendee(null);
                  }}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Award size={15} />
                  <span>Export Certificate PDF</span>
                </button>
              )}

              <button
                onClick={() => setViewingAttendee(null)}
                className="py-3 px-4 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNIFIED ADD ATTENDEE / ON-SPOT REGISTRATION MODAL */}
      <AddAttendeeModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        event={event}
        onAttendeeAdded={() => fetchAttendees()}
        isOnSpotDefault={false}
      />

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

      {/* PASS BATCH GENERATOR MODAL */}
      <PassGeneratorModal
        isOpen={showPassModal}
        onClose={() => setShowPassModal(false)}
        eventId={eventId}
        eventTitle={event?.title || 'Event'}
        attendees={attendees}
        selectedIds={selectedIds}
      />
    </div>
  );
};

export default GuestListPortal;
