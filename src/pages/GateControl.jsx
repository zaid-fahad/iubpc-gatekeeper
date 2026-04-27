import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QrCode, X, ChevronLeft, IdCard, CheckCircle2, UserCheck, Ticket, ScanLine } from 'lucide-react';
import { fetchEventById } from '../api/events';
import { searchAttendee, updateAttendeeStatus } from '../api/attendees';
import GateActBtn from '../components/GateActBtn';
import LoadingSpinner from '../components/LoadingSpinner';

const GateControl = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [member, setMember] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    const loadEvent = async () => {
      const { data, error } = await fetchEventById(eventId);
      if (error || !data) {
        navigate('/');
        return;
      }
      setEvent(data);
      setLoading(false);
    };
    loadEvent();
  }, [eventId, navigate]);

  const searchMember = async (query) => {
    const q = (query || searchInput).trim();
    if (!q) return;

    const { data: attendee, error: aError } = await searchAttendee(eventId, q);

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
    const { error } = await updateAttendeeStatus(member.id, field, isActivating);
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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col overflow-y-auto italic animate-in fade-in">
      <header className="p-6 flex items-center gap-4 bg-slate-900 border-b border-slate-800 shrink-0 shadow-2xl">
        <button onClick={() => navigate('/')} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-slate-500 active:scale-90 transition-colors"><ChevronLeft size={20}/></button>
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

export default GateControl;
