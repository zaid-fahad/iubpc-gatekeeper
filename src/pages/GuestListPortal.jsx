import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, UserPlus, Upload, Search, Download, Clock, X } from 'lucide-react';
import Papa from 'papaparse';
import { fetchEventById } from '../api/events';
import { fetchEventAttendees, insertAttendee, bulkInsertAttendees } from '../api/attendees';
import LoadingSpinner from '../components/LoadingSpinner';

const GuestListPortal = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', sid: '', img: '' });

  const fetchAttendees = useCallback(async () => {
    setLoading(true);
    const { data } = await fetchEventAttendees(eventId);
    setAttendees(data || []);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    const loadData = async () => {
      const { data: eventData, error: eError } = await fetchEventById(eventId);
      if (eError || !eventData) {
        navigate('/');
        return;
      }
      setEvent(eventData);
      await fetchAttendees();
    };
    loadData();
  }, [eventId, navigate, fetchAttendees]);

  const handleManualAdd = async (e) => {
    e.preventDefault();
    const { error } = await insertAttendee({ event_id: eventId, full_name: form.name, email: form.email, student_id: form.sid, avatar_url: form.img || null });
    if (!error) { setShowAdd(false); setForm({ name:'', email:'', sid:'', img:'' }); fetchAttendees(); }
    else alert(error.message);
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, { header: true, skipEmptyLines: true, complete: async (res) => {
      const data = res.data.filter(r => r.student_id).map(r => ({ event_id: eventId, full_name: r.name || 'Anonymous', email: r.email || '', student_id: r.student_id, avatar_url: r.image_link || null }));
      const { error } = await bulkInsertAttendees(data);
      if (!error) fetchAttendees();
      else alert(error.message);
    }});
  };

  const downloadTemplate = () => {
    try {
      const csvData = "name,email,student_id,image_link\nSample Name,sample@iub.edu.bd,2120000,https://i.pravatar.cc/150";
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

  const filtered = attendees.filter(a => 
    a.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.student_id?.includes(searchTerm) ||
    a.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!event && loading) return <LoadingSpinner />;

  return (
    <div className="fixed inset-0 bg-slate-950 z-[110] flex flex-col overflow-hidden animate-in fade-in duration-300 italic">
      <header className="p-6 flex items-center justify-between bg-slate-900 border-b border-slate-800 shrink-0 shadow-2xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 active:scale-90 transition-all"><ChevronLeft size={20}/></button>
          <div><h2 className="text-xl font-black italic text-white uppercase truncate max-w-[150px] lg:max-w-md leading-none italic">{event?.title}</h2><p className="text-[10px] font-black text-purple-400 tracking-[0.2em] uppercase mt-1 italic leading-none">Database Hub</p></div>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setShowAdd(true)} className="p-3 bg-slate-800 text-green-400 rounded-2xl border border-slate-700 active:scale-90 shadow-lg transition-all"><UserPlus size={20}/></button>
            <label className="p-3 bg-green-500 text-slate-950 rounded-2xl cursor-pointer hover:bg-green-400 transition-all active:scale-90 flex items-center justify-center border-b-2 border-green-700 shadow-xl">
                <Upload size={20} /><input type="file" className="hidden" accept=".csv" onChange={handleCsvUpload} />
            </label>
        </div>
      </header>
      <div className="p-6 bg-slate-900/50 border-b border-slate-800 space-y-4 shrink-0 italic shadow-xl">
        <div className="relative max-w-md mx-auto group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-green-500 transition-colors" size={18} />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-4 pl-12 rounded-2xl text-sm font-bold text-white shadow-inner outline-none italic placeholder:text-slate-800" placeholder="Search by name, ID or email..." />
        </div>
        <div className="flex justify-between items-center px-1 italic max-w-6xl mx-auto">
            <button onClick={downloadTemplate} className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5 hover:text-white transition-colors italic leading-none"><Download size={12}/> Get Template</button>
            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest italic leading-none">{attendees.length} Units Logged</span>
        </div>
      </div>
      <main className="flex-1 overflow-y-auto p-6 bg-slate-950/20">
        {loading ? (
          <div className="py-20 flex justify-center opacity-10"><Clock className="animate-spin" size={40}/></div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="lg:hidden grid grid-cols-1 gap-3 max-w-2xl mx-auto pb-40">
              {filtered.map(row => (
                <div key={row.id} className="bg-slate-900 border border-slate-800 p-6 rounded-[2.8rem] flex items-center justify-between group hover:border-slate-700 transition-all shadow-xl relative overflow-hidden italic">
                  <div className="flex items-center gap-5 relative z-10">
                    <img src={row.avatar_url || `https://ui-avatars.com/api/?name=${row.full_name}&background=0f172a&color=fff`} className="w-16 h-16 rounded-3xl border-2 border-slate-950 object-cover bg-slate-800 shadow-md" />
                    <div><p className="text-base font-black text-white italic leading-none truncate max-w-[150px] uppercase tracking-tighter">{row.full_name}</p><p className="text-[10px] font-bold text-slate-600 uppercase mt-2 tracking-tight italic">ID: {row.student_id}</p></div>
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
                      <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Personnel</th>
                      <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Contact & ID</th>
                      <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Entry 1</th>
                      <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Token</th>
                      <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Entry 2</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filtered.map(row => (
                      <tr key={row.id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <img src={row.avatar_url || `https://ui-avatars.com/api/?name=${row.full_name}&background=0f172a&color=fff`} className="w-12 h-12 rounded-2xl border border-slate-950 object-cover bg-slate-800" />
                            <span className="text-sm font-black text-white uppercase tracking-tight">{row.full_name}</span>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="space-y-1">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{row.student_id}</p>
                            <p className="text-[9px] font-medium text-slate-600 lowercase">{row.email}</p>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        {!loading && filtered.length === 0 && <div className="text-center py-20 opacity-20 italic font-black uppercase text-xs tracking-[0.5em]">No Data Mapped</div>}
      </main>
      {showAdd && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl animate-in zoom-in duration-300 italic">
            <form onSubmit={handleManualAdd} className="relative bg-slate-900 border border-slate-800 rounded-[3.5rem] p-10 w-full max-w-md space-y-6 shadow-2xl text-left italic">
                <div className="flex justify-between items-center italic"><h2 className="text-3xl font-black italic text-white tracking-tighter uppercase leading-none italic">Direct Intake</h2><X className="text-slate-500 cursor-pointer hover:text-white transition-colors italic" onClick={() => setShowAdd(false)} /></div>
                <div className="space-y-4 italic">
                    <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="FULL IDENTITY" required className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-sm font-bold text-white outline-none focus:ring-1 focus:ring-green-500/50 shadow-inner italic uppercase tracking-widest" />
                    <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="EMAIL ADDRESS" required className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-sm font-bold text-white outline-none focus:ring-1 focus:ring-green-500/50 shadow-inner italic uppercase tracking-widest" />
                    <input value={form.sid} onChange={e => setForm({...form, sid: e.target.value})} placeholder="STUDENT ID" required className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-sm font-bold text-white outline-none focus:ring-1 focus:ring-green-500/50 shadow-inner italic uppercase tracking-widest" />
                    <input value={form.img} onChange={e => setForm({...form, img: e.target.value})} placeholder="IMAGE URL" className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-sm font-bold text-white outline-none focus:ring-1 focus:ring-green-500/50 shadow-inner italic uppercase tracking-widest" />
                </div>
                <button className="w-full py-5 bg-green-500 text-slate-950 font-black rounded-2xl uppercase tracking-widest shadow-xl shadow-green-500/20 active:scale-95 transition-all border-b-4 border-green-700 italic">AUTHORIZE UNIT</button>
            </form>
        </div>
      )}
    </div>
  );
};

export default GuestListPortal;
