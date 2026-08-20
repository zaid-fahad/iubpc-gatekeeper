import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchEvents, fetchTemplateByEvent, fetchEventAttendees } from '../api';
import { StatCard, LoadingSpinner, CertificateGeneratorModal } from '../components';
import { 
  Award, Sparkles, Calendar, Search, ArrowRight, ShieldCheck, 
  Layers, Users, LayoutGrid, List, ChevronRight, FileArchive 
} from 'lucide-react';

const CertificatesModule = ({ userRole }) => {
  const navigate = useNavigate();
  const isAdmin = userRole === 'admin';

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [eventDataMap, setEventDataMap] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [verifySearchTerm, setVerifySearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  const [activeCertModalEvent, setActiveCertModalEvent] = useState(null);
  const [activeCertModalAttendees, setActiveCertModalAttendees] = useState([]);

  // Fetch all events and their certificate template status
  const loadCertificatesData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: eventsList } = await fetchEvents();
      if (!eventsList) return;

      setEvents(eventsList);

      // Fetch template & attendee count per event
      const map = {};
      for (const ev of eventsList) {
        const [{ data: tmpl }, { data: attendees }] = await Promise.all([
          fetchTemplateByEvent(ev.id),
          fetchEventAttendees(ev.id)
        ]);

        map[ev.id] = {
          hasTemplate: !!tmpl,
          template: tmpl,
          attendees: attendees || [],
          attendeeCount: attendees?.length || 0,
          checkedInCount: attendees?.filter(a => a.checked_in_1 || a.checked_in_2).length || 0
        };
      }
      setEventDataMap(map);
    } catch (err) {
      console.error('Failed to load certificates module:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCertificatesData();
  }, [loadCertificatesData]);

  // Open Batch Certificate Generator for an event
  const openGeneratorModal = (ev, e) => {
    if (e) e.stopPropagation();
    const data = eventDataMap[ev.id];
    setActiveCertModalEvent(ev);
    setActiveCertModalAttendees(data?.attendees || []);
  };

  // Direct Verification Redirect
  const handleVerifySearch = (e) => {
    e.preventDefault();
    if (!verifySearchTerm.trim()) return;
    navigate(`/certificate/${verifySearchTerm.trim().toUpperCase()}`);
  };

  const filteredEvents = events.filter(ev => 
    ev.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalTemplates = Object.values(eventDataMap).filter(d => d.hasTemplate).length;
  const totalCheckedIn = Object.values(eventDataMap).reduce((acc, curr) => acc + curr.checkedInCount, 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans italic">
      {/* MODULE HEADER */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <Award className="text-purple-400" size={28} />
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase italic tracking-tight">
              Certificates Module
            </h1>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Visual Certificate Design, Template Management, Batch Generation & Public Verification Engine
          </p>
        </div>

        {/* VERIFICATION QUICK LOOKUP */}
        <form onSubmit={handleVerifySearch} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
            <input
              type="text"
              value={verifySearchTerm}
              onChange={(e) => setVerifySearchTerm(e.target.value)}
              placeholder="Verify Cert ID (e.g. CERT-2026-X8A2)..."
              className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl p-2.5 pl-9 text-xs text-white outline-none font-mono placeholder:text-slate-600"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-purple-600/20"
          >
            <span>Verify</span>
            <ArrowRight size={14} />
          </button>
        </form>
      </header>

      {/* OVERVIEW METRICS STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Calendar size={22} className="text-purple-400" />}
          label="Total Events"
          value={events.length}
        />
        <StatCard
          icon={<Layers size={22} className="text-emerald-400" />}
          label="Configured Templates"
          value={totalTemplates}
        />
        <StatCard
          icon={<ShieldCheck size={22} className="text-blue-400" />}
          label="Eligible Attendees"
          value={totalCheckedIn}
        />
      </div>

      {/* EVENT CERTIFICATES MANAGEMENT LIST */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white uppercase italic tracking-tight">
              Event Certificate Templates
            </h2>
            <p className="text-xs text-slate-400">
              Click an event row/card to manage its attendees and generate certificates
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* VIEW SWITCHER */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Grid View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Table View"
              >
                <List size={15} />
              </button>
            </div>

            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={15} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search events..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 pl-9 text-xs text-white outline-none"
              />
            </div>
          </div>
        </div>

        {viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEvents.map((ev) => {
              const data = eventDataMap[ev.id] || {};
              const hasTemplate = data.hasTemplate;

              return (
                <div
                  key={ev.id}
                  onClick={() => navigate(`/events/${ev.id}/guests`)}
                  className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-5 space-y-4 transition-all shadow-lg flex flex-col justify-between cursor-pointer group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${hasTemplate ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}>
                        {hasTemplate ? 'Template Ready' : 'No Template'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                        <Calendar size={13} /> {ev.date}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-purple-300 transition-colors flex items-center justify-between">
                      <span>{ev.title}</span>
                      <ChevronRight size={18} className="text-slate-600 group-hover:text-purple-400 transition-colors" />
                    </h3>
                    <p className="text-xs text-slate-400">
                      {data.attendeeCount} Registered • <span className="text-purple-400 font-bold">{data.checkedInCount} Checked-In</span>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-2" onClick={e => e.stopPropagation()}>
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/events/${ev.id}/certificate-designer`);
                        }}
                        className="flex-1 py-2.5 px-3 bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[40px]"
                      >
                        <Award size={15} />
                        <span>{hasTemplate ? 'Edit Template' : 'Design Layout'}</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => openGeneratorModal(ev, e)}
                      className="flex-1 py-2.5 px-3 bg-slate-950 border border-slate-800 hover:border-slate-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 min-h-[40px]"
                    >
                      <FileArchive size={15} className="text-purple-400" />
                      <span>Export Certs</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABLE LIST VIEW */
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-xs font-medium text-slate-400">
                  <th className="p-4">Event Name</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Template Status</th>
                  <th className="p-4">Attendees</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs font-medium">
                {filteredEvents.map((ev) => {
                  const data = eventDataMap[ev.id] || {};
                  const hasTemplate = data.hasTemplate;

                  return (
                    <tr 
                      key={ev.id} 
                      onClick={() => navigate(`/events/${ev.id}/guests`)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="p-4 font-bold text-white group-hover:text-purple-300 transition-colors">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-purple-400" />
                          <span>{ev.title}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300 font-mono">{ev.date}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${hasTemplate ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}>
                          {hasTemplate ? 'Ready' : 'No Template'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300">
                        {data.attendeeCount} Registered (<span className="text-purple-400 font-bold">{data.checkedInCount} Checked-In</span>)
                      </td>
                      <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/events/${ev.id}/guests`);
                            }}
                            className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs transition-all flex items-center gap-1 min-h-[36px]"
                          >
                            <Users size={13} />
                            <span>Attendees</span>
                          </button>

                          {isAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/events/${ev.id}/certificate-designer`);
                              }}
                              className="px-3 py-1.5 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 text-purple-300 rounded-xl text-xs transition-all flex items-center gap-1 min-h-[36px]"
                              title="Design Certificate Template"
                            >
                              <Award size={13} />
                              <span>{hasTemplate ? 'Edit' : 'Design'}</span>
                            </button>
                          )}

                          <button
                            onClick={(e) => openGeneratorModal(ev, e)}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 min-h-[36px]"
                          >
                            <FileArchive size={13} />
                            <span>Export</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CERTIFICATE GENERATOR MODAL */}
      {activeCertModalEvent && (
        <CertificateGeneratorModal
          isOpen={!!activeCertModalEvent}
          onClose={() => setActiveCertModalEvent(null)}
          eventId={activeCertModalEvent.id}
          eventTitle={activeCertModalEvent.title}
          attendees={activeCertModalAttendees}
        />
      )}
    </div>
  );
};

export default CertificatesModule;
