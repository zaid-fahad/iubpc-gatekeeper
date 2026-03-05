import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import { 
  Search, QrCode, CheckCircle2, Ticket, UserCheck, 
  Phone, Mail, IdCard, X, AlertCircle, ScanLine, 
  History, UserX, Clock, Trash2, Zap, Camera, 
  LayoutDashboard, Users, PlusCircle, Settings, 
  LogOut, User as UserIcon, ArrowRight, ShieldCheck,
  FileText, Edit3, Calendar, ChevronLeft, Home,
  UserPlus, ShieldAlert, Lock, Upload, Image as ImageIcon,
  Download, BarChart3, PieChart, Info, ChevronDown
} from 'lucide-react';

// --- Supabase Configuration ---
const getEnv = (key) => {
  try {
    return (import.meta).env[key] || "";
  } catch {
    return "";
  }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Shared UI Components ---

const LoadingSpinner = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-6 text-center p-6 italic animate-in fade-in">
    <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-b-2 border-green-500 animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-t-2 border-purple-500 animate-spin-slow"></div>
        <Zap className="absolute inset-0 m-auto text-green-500 animate-pulse" size={28} />
    </div>
    <div className="space-y-1">
        <p className="text-slate-400 font-black text-xs uppercase tracking-[0.5em]">Synchronizing</p>
        <p className="text-slate-800 text-[8px] uppercase tracking-widest font-black">Secure Terminal v4.0</p>
    </div>
  </div>
);

const GateActBtn = ({ label, active, onClick, icon, color }) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-300 active:scale-[0.97] ${active ? 'border-transparent shadow-xl' : 'bg-slate-950/40 border-slate-800/80 text-slate-500'}`} 
    style={active ? { backgroundColor: color, color: '#000' } : {}}
  >
    <div className="flex items-center gap-4">
      <div className={`p-2 rounded-xl ${active ? 'bg-black/10' : 'bg-slate-800'}`}>{icon}</div>
      <span className="font-black text-sm tracking-tight uppercase italic">{label}</span>
    </div>
    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${active ? 'border-black/20 bg-black/10' : 'border-slate-800'}`}>
        {active && <CheckCircle2 size={16}/>}
    </div>
  </button>
);

// --- Auth Component ---

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Account created! Log in once you've been added to the 'admins' table.");
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 italic animate-in fade-in">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex p-5 rounded-3xl bg-green-500/10 border border-green-500/20 shadow-lg">
            <ShieldCheck className="w-10 h-10 text-green-400 animate-pulse" />
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">Root Gateway</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Access Restricted Terminal</p>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-800 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden text-center">
          {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[10px] font-black uppercase">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <input type="email" placeholder="ADMIN EMAIL" className="w-full px-6 pl-12 py-4.5 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-green-500 text-white outline-none transition-all placeholder:text-slate-700 font-bold uppercase" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <input type="password" placeholder="PASSWORD" className="w-full px-6 pl-12 py-4.5 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-green-500 text-white outline-none transition-all placeholder:text-slate-700 font-bold" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button disabled={loading} className="w-full py-4.5 bg-green-500 text-slate-950 font-black rounded-2xl shadow-lg active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest italic transition-transform">
              {loading ? <Clock className="animate-spin" size={20}/> : <>{isSignUp ? 'REGISTER' : 'LOGIN'} <ArrowRight size={18}/></>}
            </button>
            <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="w-full text-slate-600 text-[9px] font-black uppercase tracking-widest hover:text-white transition-colors text-center">
              {isSignUp ? "Authenticate Credentials" : "Deploy New Identity"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Gate Control (Bottom Drawer Focused) ---

const GateControl = ({ event, onBack }) => {
  const [searchInput, setSearchInput] = useState("");
  const [member, setMember] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const html5QrCodeRef = useRef(null);

  const searchMember = async (query) => {
    const q = (query || searchInput).trim();
    if (!q) return;

    const { data: attendee, error: aError } = await supabase
        .from('attendees')
        .select('*')
        .eq('event_id', event.id)
        .or(`student_id.eq.${q},email.eq.${q}`)
        .maybeSingle();

    if (aError || !attendee) { 
        setError("Identity not recognized."); 
        setMember(null); 
        return; 
    }

    setMember(attendee);
    setError("");
    if (showScanner) stopScanner();
  };

  const updateStatus = async (field) => {
    if (!member) return;
    const isActivating = !member[field];
    const { error } = await supabase.from('attendees').update({ [field]: isActivating }).eq('id', member.id);
    if (!error) {
        setMember({ ...member, [field]: isActivating });
        setHistory(prev => [{ name: member.full_name, id: member.student_id, action: field, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
    }
  };

  const startScanner = () => {
    setShowScanner(true);
    setTimeout(() => {
        const html5QrCode = new window.Html5Qrcode("gate-reader");
        html5QrCodeRef.current = html5QrCode;
        html5QrCode.start({ facingMode: "environment" }, { fps: 25, qrbox: 250 }, (text) => {
            setSearchInput(text);
            searchMember(text);
        }, () => {}).catch(() => setError("Camera connection failed."));
    }, 100);
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current?.isScanning) html5QrCodeRef.current.stop().then(() => { html5QrCodeRef.current.clear(); setShowScanner(false); });
    else setShowScanner(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col overflow-y-auto italic animate-in fade-in">
      <header className="p-6 flex items-center gap-4 bg-slate-900 border-b border-slate-800 shrink-0 shadow-2xl">
        <button onClick={onBack} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-slate-500 active:scale-90 transition-colors"><ChevronLeft size={20}/></button>
        <div>
          <h2 className="text-xl font-black italic text-white leading-tight uppercase truncate max-w-[200px]">{event.title}</h2>
          <p className="text-[9px] font-black text-green-500 tracking-[0.3em] uppercase">Control Matrix</p>
        </div>
      </header>

      <main className="p-6 space-y-6 max-w-md mx-auto w-full pb-32">
        <div className="flex gap-2">
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchMember()} placeholder="Scan or type ID..." className="flex-1 bg-slate-900 border border-slate-800 p-5 rounded-[1.5rem] outline-none text-sm font-bold text-white shadow-inner" />
            <button onClick={() => showScanner ? stopScanner() : startScanner()} className={`p-5 rounded-[1.5rem] border transition-all ${showScanner ? 'bg-red-500/10 border-red-500/20 text-red-500 shadow-lg' : 'bg-slate-900 border-slate-800 text-green-500 shadow-xl active:scale-90'}`}>{showScanner ? <X/> : <QrCode/>}</button>
        </div>

        {showScanner && <div className="aspect-square bg-black rounded-[2.5rem] overflow-hidden border-4 border-slate-800 relative shadow-2xl animate-in zoom-in"><div id="gate-reader" className="w-full h-full"></div></div>}

        {error && <div className="bg-red-500/10 p-5 rounded-2xl border border-red-500/20 text-red-400 text-[10px] font-black text-center uppercase animate-in slide-in-from-top-2 italic">{error}</div>}

        {history.length > 0 && (
          <div className="pt-4 space-y-3 pb-12">
            <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-2 italic">Operation Log</h4>
            {history.map((h, i) => (
              <div key={i} className="bg-slate-900/40 p-5 rounded-[1.8rem] border border-slate-800/50 flex justify-between items-center opacity-70 group hover:opacity-100 transition-opacity">
                <p className="text-[12px] font-bold text-slate-300 italic uppercase leading-none">{h.name} <span className="text-[9px] not-italic text-slate-600 block mt-1 uppercase tracking-tighter">{h.action}</span></p>
                <span className="text-[10px] font-black text-slate-600 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800">{h.time}</span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MEMBER BOTTOM DRAWER */}
      {member && (
        <div className="fixed inset-0 z-[200] flex flex-col justify-end animate-in fade-in duration-300 italic">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setMember(null)}></div>
            <div className="relative bg-slate-900 rounded-t-[4rem] border-t border-slate-800 p-10 pt-5 pb-14 shadow-2xl animate-in slide-in-from-bottom-full duration-500 flex flex-col items-center">
                <div className="w-16 h-1.5 bg-slate-800 rounded-full mb-10 hover:bg-slate-700 transition-colors" onClick={() => setMember(null)}></div>
                <div className="w-full max-w-md space-y-8 animate-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <img src={member.avatar_url || `https://ui-avatars.com/api/?name=${member.full_name}&background=000&color=fff`} className="w-24 h-24 rounded-[2.5rem] border-4 border-slate-950 object-cover bg-slate-800 shadow-2xl" />
                            {member.checked_in_1 && <div className="absolute -top-1 -right-1 bg-green-500 p-2 rounded-full border-4 border-slate-900 shadow-lg"><CheckCircle2 size={12} className="text-black" /></div>}
                        </div>
                        <div>
                            <h3 className="text-3xl font-black italic text-white leading-tight uppercase tracking-tighter italic">{member.full_name}</h3>
                            <p className="text-[11px] font-black text-slate-500 tracking-[0.2em] uppercase mt-2 italic flex items-center gap-2 leading-none">
                                <IdCard size={14} className="text-green-500" /> ID: {member.student_id}
                            </p>
                            <p className="text-[9px] font-bold text-slate-700 mt-1 truncate max-w-[150px] uppercase italic">{member.email}</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <GateActBtn label="Gate Entry Log" active={member.checked_in_1} onClick={() => updateStatus('checked_in_1')} icon={<UserCheck size={18}/>} color="#4ADE80" />
                        <GateActBtn label="Token Grant" active={member.token_given} onClick={() => updateStatus('token_given')} icon={<Ticket size={18}/>} color="#D8B4FE" />
                        <GateActBtn label="2nd Entry" active={member.checked_in_2} onClick={() => updateStatus('checked_in_2')} icon={<ScanLine size={18}/>} color="#93C5FD" />
                    </div>
                    <button onClick={() => setMember(null)} className="w-full py-5 bg-slate-950 text-slate-600 hover:text-white font-black uppercase tracking-widest text-[10px] rounded-2xl border border-slate-800 active:scale-95 transition-all mt-4 italic shadow-lg">Dismiss Session</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

// --- Analytics / Guest Portal ---

const EventAnalytics = ({ event, onBack }) => {
    const [stats, setStats] = useState({ total: 0, c1: 0, tokens: 0, c2: 0 });
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
      const fetchStats = async () => {
        const { data } = await supabase.from('attendees').select('*').eq('event_id', event.id);
        if (data) setStats({ total: data.length, c1: data.filter(r => r.checked_in_1).length, tokens: data.filter(r => r.token_given).length, c2: data.filter(r => r.checked_in_2).length });
        setLoading(false);
      };
      fetchStats();
    }, [event.id]);
  
    return (
      <div className="fixed inset-0 bg-slate-950 z-[120] flex flex-col overflow-y-auto animate-in slide-in-from-right duration-400 italic">
        <header className="p-6 flex items-center gap-4 bg-slate-900 border-b border-slate-800 shadow-2xl shrink-0">
          <button onClick={onBack} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 active:scale-90 transition-colors"><ChevronLeft size={20}/></button>
          <div><h2 className="text-xl font-black italic text-white uppercase truncate max-w-[200px] leading-none">{event.title}</h2><p className="text-[9px] font-black text-blue-400 tracking-[0.3em] uppercase italic mt-1">Impact Intelligence</p></div>
        </header>
        <main className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto w-full pb-24">
            <StatCard label="Total Population" value={stats.total} color="bg-slate-900" char="T" />
            <StatCard label="Gate Conversion" value={stats.c1} color="bg-green-500/5" char="G" />
            <StatCard label="Gift Deliveries" value={stats.tokens} color="bg-purple-500/5" char="D" />
            <StatCard label="Final Clearance" value={stats.c2} color="bg-blue-500/5" char="F" />
        </main>
      </div>
    );
  };
  
const StatCard = ({ label, value, color, char }) => (
    <div className={`${color} border border-slate-800 p-10 rounded-[3.5rem] shadow-xl relative overflow-hidden group hover:border-slate-600 transition-all`}>
        <p className="text-6xl font-black text-white italic relative z-10 leading-none tracking-tighter">{value}</p>
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-4 relative z-10 italic">{label}</p>
        <div className="absolute -bottom-6 -right-6 text-white/5 text-[10rem] font-black italic leading-none pointer-events-none">{char}</div>
    </div>
);

const GuestListPortal = ({ event, onBack }) => {
  const [attendees, setAttendees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', sid: '', img: '' });

  const fetchAttendees = async () => {
    setLoading(true);
    const { data } = await supabase.from('attendees').select('*').eq('event_id', event.id).order('created_at', { ascending: false });
    setAttendees(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAttendees(); }, [event.id]);

  const handleManualAdd = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('attendees').insert({ event_id: event.id, full_name: form.name, email: form.email, student_id: form.sid, avatar_url: form.img || null });
    if (!error) { setShowAdd(false); setForm({ name:'', email:'', sid:'', img:'' }); fetchAttendees(); }
    else alert(error.message);
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, { header: true, skipEmptyLines: true, complete: async (res) => {
      const data = res.data.filter(r => r.student_id).map(r => ({ event_id: event.id, full_name: r.name || 'Anonymous', email: r.email || '', student_id: r.student_id, avatar_url: r.image_link || null }));
      const { error } = await supabase.from('attendees').insert(data);
      if (!error) fetchAttendees();
      else alert(error.message);
    }});
  };

  // FIXED: Simplified CSV download using standard Blob and temporary Link
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

  const filtered = attendees.filter(a => a.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || a.student_id?.includes(searchTerm));

  return (
    <div className="fixed inset-0 bg-slate-950 z-[110] flex flex-col overflow-hidden animate-in fade-in duration-300 italic">
      <header className="p-6 flex items-center justify-between bg-slate-900 border-b border-slate-800 shrink-0 shadow-2xl">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 active:scale-90 transition-all"><ChevronLeft size={20}/></button>
          <div><h2 className="text-xl font-black italic text-white uppercase truncate max-w-[150px] leading-none italic">{event.title}</h2><p className="text-[10px] font-black text-purple-400 tracking-[0.2em] uppercase mt-1 italic leading-none">Database Hub</p></div>
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
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-4 pl-12 rounded-2xl text-sm font-bold text-white shadow-inner outline-none italic placeholder:text-slate-800" placeholder="Filter manifest..." />
        </div>
        <div className="flex justify-between items-center px-1 italic">
            <button onClick={downloadTemplate} className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5 hover:text-white transition-colors italic leading-none"><Download size={12}/> Get Template</button>
            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest italic leading-none">{attendees.length} Units Logged</span>
        </div>
      </div>
      <main className="flex-1 overflow-y-auto p-6 bg-slate-950/20">
        <div className="grid grid-cols-1 gap-3 max-w-2xl mx-auto pb-40">
          {loading ? <div className="py-20 flex justify-center opacity-10"><Clock className="animate-spin" size={40}/></div> : filtered.map(row => (
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
          {!loading && filtered.length === 0 && <div className="text-center py-20 opacity-20 italic font-black uppercase text-xs tracking-[0.5em]">No Data Mapped</div>}
        </div>
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

// --- Admin Dashboard ---

const AdminDashboard = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [gateEvent, setGateEvent] = useState(null);
  const [activeGuestList, setActiveGuestList] = useState(null);
  const [activeAnalytics, setActiveAnalytics] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '' });

  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('*').order('date', { ascending: false });
    setEvents(data || []);
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('events').insert([newEvent]);
    if (!error) { setShowEventModal(false); setNewEvent({ title: '', date: '' }); fetchEvents(); }
    else alert("Creation Failure: " + error.message);
  };

  if (gateEvent) return <GateControl event={gateEvent} onBack={() => setGateEvent(null)} />;
  if (activeGuestList) return <GuestListPortal event={activeGuestList} onBack={() => setActiveGuestList(null)} />;
  if (activeAnalytics) return <EventAnalytics event={activeAnalytics} onBack={() => setActiveAnalytics(null)} />;

  return (
    <div className="max-w-4xl mx-auto min-h-screen pb-32 italic">
      <header className="px-6 py-10 flex items-center justify-between sticky top-0 bg-slate-950/50 backdrop-blur-xl z-50 animate-in fade-in duration-700 italic">
        <div className="flex items-center gap-5 italic leading-none">
          <div className="w-14 h-14 bg-green-500 rounded-[1.8rem] flex items-center justify-center text-slate-950 shadow-[0_0_20px_rgba(34,197,94,0.3)] italic"><ShieldCheck size={32}/></div>
          <div><h1 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none italic italic italic italic italic">IUBPC</h1><p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mt-2 italic leading-none">Event Attendee Tracker</p></div>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="p-4 bg-slate-900 rounded-[1.5rem] border border-slate-800 text-red-500 hover:bg-red-500/10 transition-all active:scale-90 shadow-xl italic"><LogOut size={22}/></button>
      </header>

      <main className="p-6 space-y-12 italic">
        <div className="flex justify-between items-center px-2 italic">
           <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter italic">Event Registry</h2>
           <button onClick={() => setShowEventModal(true)} className="px-7 py-4 bg-green-500 text-slate-950 rounded-2xl font-black text-xs italic flex items-center gap-2 shadow-2xl shadow-green-500/20 active:scale-95 transition-all italic"><PlusCircle size={18}/> NEW </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 italic pb-20">
          {events.map(ev => (
            <div key={ev.id} className="bg-slate-900/80 border border-slate-800 p-10 rounded-[3.5rem] space-y-8 shadow-2xl relative overflow-hidden group hover:border-green-500/30 transition-all duration-500 animate-in slide-in-from-bottom-6 italic">
               <div className="flex justify-between items-start italic relative z-10">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border italic transition-all ${ev.is_active ? 'bg-green-500/10 text-green-500 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-slate-950 text-slate-700 border-slate-800 opacity-50'}`}>{ev.is_active ? 'ACTIVE' : 'OFFLINE'}</span>
                  <button onClick={() => setActiveAnalytics(ev)} className="p-2 bg-slate-950 rounded-xl text-slate-600 hover:text-blue-400 transition-all active:scale-90 italic shadow-xl"><BarChart3 size={20}/></button>
               </div>
               <div className="space-y-1 italic relative z-10">
                   <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter leading-none group-hover:text-green-400 transition-colors duration-500 italic italic">{ev.title}</h3>
                   <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] italic italic">{ev.date}</p>
               </div>
               <div className="pt-2 flex flex-col gap-3 relative z-10 italic">
                  <button onClick={() => setGateEvent(ev)} className="w-full py-5 bg-green-500 text-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all italic shadow-lg shadow-green-500/5 border-b-4 border-green-700 italic">ENGAGE GATE LOGIC</button>
                  <div className="flex gap-2 italic">
                    <button onClick={() => setActiveGuestList(ev)} className="flex-1 py-4 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all italic shadow-lg">PERSONNEL</button>
                    <button onClick={() => setActiveAnalytics(ev)} className="flex-1 py-4 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all italic shadow-lg">METRICS</button>
                  </div>
               </div>
               <Zap className="absolute -top-10 -left-10 opacity-0 group-hover:opacity-[0.03] text-green-500 transition-all duration-1000 group-hover:rotate-12 italic pointer-events-none" size={250} />
            </div>
          ))}
          {events.length === 0 && <div className="col-span-full py-40 text-center opacity-10 font-black italic uppercase tracking-[1em] text-sm">Deployment Array Null</div>}
        </div>
      </main>
      {showEventModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 text-center bg-slate-950/90 backdrop-blur-xl italic animate-in fade-in duration-300 italic">
            <form onSubmit={handleCreate} className="relative bg-slate-900 border border-slate-800 rounded-[3rem] p-12 w-full max-w-lg space-y-8 shadow-2xl text-left italic">
                <div className="flex justify-between items-center italic italic"><h2 className="text-3xl font-black italic text-white tracking-tighter uppercase leading-none italic italic">New Deployment</h2><X className="text-slate-600 cursor-pointer hover:text-white transition-colors italic italic" onClick={() => setShowEventModal(false)} /></div>
                <div className="space-y-5 italic italic text-left">
                    <div className="space-y-2 italic italic"><label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-1 italic italic">Identifier</label><input value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} placeholder="e.g. ALPHA_SYNC_24" required className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-sm font-bold text-white outline-none focus:ring-1 focus:ring-green-500 shadow-inner italic italic uppercase tracking-widest" /></div>
                    <div className="space-y-2 italic italic"><label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-1 italic italic">Timestamp</label><input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} required className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-sm text-white font-bold outline-none shadow-inner italic italic" /></div>
                </div>
                <button className="w-full py-5 bg-green-500 text-slate-950 font-black rounded-2xl uppercase tracking-widest shadow-2xl shadow-green-500/20 active:scale-95 transition-all border-b-4 border-green-700 italic italic">INITIATE LAUNCH</button>
            </form>
        </div>
      )}
    </div>
  );
};

// --- Main App Root ---

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Optimized Auth Sequence
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
        try {
            // Step 1: Immediate Session Check
            const { data: { session } } = await supabase.auth.getSession();
            if (session && isMounted) {
                const email = session.user.email || "";
                setUser(session.user);
                
                // Step 2: Immediate Admin Check
                const { data: adminCheck } = await supabase.from('admins').select('email').eq('email', email).maybeSingle();
                if (isMounted) setIsAdmin(!!adminCheck);
            }
        } catch (err) {
            console.error("Critical Auth Fault:", err);
        } finally {
            if (isMounted) setLoading(false);
        }
    };

    initialize();

    // Step 3: Global Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (session) {
        setUser(session.user);
        const email = session.user.email || "";
        const { data: adminCheck } = await supabase.from('admins').select('email').eq('email', email).maybeSingle();
        if (isMounted) {
          setIsAdmin(!!adminCheck);
          setLoading(false);
        }
      } else {
        if (isMounted) {
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
        }
      }
    });

    // Safety timeout to clear stuck spinner (rare Supabase network delay)
    const safety = setTimeout(() => { if (isMounted && loading) setLoading(false); }, 5000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(safety);
    };
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!user) return <AuthScreen />;
  
  if (!isAdmin) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 italic animate-in fade-in duration-1000">
      <div className="bg-slate-900 border border-slate-800 p-12 rounded-[3.5rem] text-center max-w-sm space-y-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)] animate-in zoom-in duration-500 shadow-red-500/5">
        <div className="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center justify-center mx-auto text-red-500 shadow-[0_0_40px_rgba(239,68,68,0.1)]">
          <ShieldAlert size={48} className="animate-pulse" />
        </div>
        <div className="space-y-3">
            <h2 className="text-3xl font-black text-white uppercase italic leading-none tracking-tighter">ACCESS DENIED</h2>
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] leading-relaxed">Identity <b>{user.email}</b><br/>UNAUTHORIZED FOR ROOT ACCESS</p>
        </div>
        <button 
          onClick={() => supabase.auth.signOut()} 
          className="w-full py-5 bg-slate-950 text-slate-400 hover:text-white rounded-2xl font-black uppercase tracking-[0.3em] active:scale-95 transition-all text-[9px] italic border border-slate-800 shadow-xl"
        >
          RELINQUISH CONTROL
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden selection:bg-green-500/30 selection:text-slate-950 italic">
      <AdminDashboard user={user} />
    </div>
  );
}