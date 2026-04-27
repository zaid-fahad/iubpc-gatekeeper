import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { fetchEventById } from '../api/events';
import { fetchEventAttendees } from '../api/attendees';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';

const EventAnalytics = () => {
    const { id: eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [stats, setStats] = useState({ total: 0, c1: 0, tokens: 0, c2: 0 });
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
      const loadData = async () => {
        const { data: eventData, error: eError } = await fetchEventById(eventId);
        if (eError || !eventData) {
          navigate('/');
          return;
        }
        setEvent(eventData);

        const { data: attendees } = await fetchEventAttendees(eventId);
        if (attendees) {
          setStats({ 
            total: attendees.length, 
            c1: attendees.filter(r => r.checked_in_1).length, 
            tokens: attendees.filter(r => r.token_given).length, 
            c2: attendees.filter(r => r.checked_in_2).length 
          });
        }
        setLoading(false);
      };
      loadData();
    }, [eventId, navigate]);
  
    if (loading) return <LoadingSpinner />;

    return (
      <div className="fixed inset-0 bg-slate-950 z-[120] flex flex-col overflow-y-auto animate-in slide-in-from-right duration-400 italic">
        <header className="p-6 flex items-center gap-4 bg-slate-900 border-b border-slate-800 shadow-2xl shrink-0">
          <button onClick={() => navigate('/')} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 active:scale-90 transition-colors"><ChevronLeft size={20}/></button>
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

export default EventAnalytics;
