import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchEventById, createEvent, updateEvent } from '../api/events';
import { syncGoogleSheetResponses } from '../api/attendees';
import { 
  Calendar, Clock, FileText, Globe, FileSpreadsheet, Plus, Trash2, 
  ArrowLeft, Check, Copy, ExternalLink, RefreshCw, Upload, Download, 
  Share2, ChevronUp, ChevronDown, CheckCircle2, AlertCircle, HelpCircle, Eye, ChevronRight, Lock, X, Layers
} from 'lucide-react';
import { CompactDatePicker, CustomTimePicker, LoadingSpinner, CsvFieldMapperModal } from '../components';

const CreateEditEventPage = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Event Data State
  const [eventData, setEventData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    is_active: true,
    allow_on_spot: true,
    registration_type: 'custom_form', // 'custom_form' | 'google_form' | 'csv_upload' | 'none'
    google_form_url: '',
    google_sheet_csv_url: '',
    form_schema: [
      { id: 'f1', name: 'full_name', label: 'Full Name', type: 'text', required: true, options: [] },
      { id: 'f2', name: 'student_id', label: 'Student ID / Roll', type: 'text', required: true, options: [] },
      { id: 'f3', name: 'email', label: 'Email Address', type: 'email', required: false, options: [] },
      { id: 'f4', name: 'phone', label: 'Phone Number', type: 'tel', required: false, options: [] },
      { id: 'f5', name: 'reference', label: 'Reference Person / Host', type: 'text', required: true, options: [] }
    ],
    theme_config: {
      primary_color: '#9333ea',
      secondary_color: '#4f46e5',
      accent_color: '#10b981',
      banner_url: '',
      bg_url: '',
      bg_color: '#090d16'
    }
  });

  // How-To Collapsible Visibility State
  const [showHowToForm, setShowHowToForm] = useState(false);
  const [showHowToGoogle, setShowHowToGoogle] = useState(false);
  const [showHowToCsv, setShowHowToCsv] = useState(false);
  const [showHowToTheme, setShowHowToTheme] = useState(false);

  // Modals & Importers & Sync Previews
  const [showCsvMapper, setShowCsvMapper] = useState(false);
  const [syncingGoogle, setSyncingGoogle] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState(null);
  const [showGooglePreviewModal, setShowGooglePreviewModal] = useState(false);
  const [googlePreviewData, setGooglePreviewData] = useState([]);
  const [loadingGooglePreview, setLoadingGooglePreview] = useState(false);
  const [googleHeaders, setGoogleHeaders] = useState([]);
  const [googleMapping, setGoogleMapping] = useState({
    full_name: '',
    student_id: '',
    reference: '',
    email: '',
    phone: ''
  });

  // Load existing event data if editing
  useEffect(() => {
    if (!id) return;
    const loadEvent = async () => {
      try {
        setLoading(true);
        const { data } = await fetchEventById(id);
        if (data) {
          let dateStr = new Date().toISOString().split('T')[0];
          let timeStr = '10:00';
          if (data.date) {
            const parts = data.date.split(' ');
            if (parts[0]) dateStr = parts[0];
            if (parts[1]) timeStr = parts[1];
          }

          setEventData({
            title: data.title || '',
            date: dateStr,
            time: timeStr,
            is_active: data.is_active ?? true,
            allow_on_spot: data.allow_on_spot ?? true,
            registration_type: data.registration_type || 'custom_form',
            google_form_url: data.google_form_url || '',
            google_sheet_csv_url: data.google_sheet_csv_url || '',
            form_schema: data.form_schema ? data.form_schema.flatMap(f => {
              const labelLower = (f.label || '').toLowerCase();
              const nameLower = (f.name || '').toLowerCase();
              if (labelLower.includes('email / phone') || labelLower.includes('email/phone')) {
                return [
                  { id: 'f3', name: 'email', label: 'Email Address', type: 'email', required: false, options: [] },
                  { id: 'f4', name: 'phone', label: 'Phone Number', type: 'tel', required: false, options: [] },
                  { id: 'f5', name: 'reference', label: 'Reference Person / Host', type: 'text', required: true, options: [] }
                ];
              }
              if (nameLower === 'reference' || labelLower.includes('reference')) {
                return [{ ...f, label: 'Reference Person / Host', required: true }];
              }
              return [f];
            }) : [
              { id: 'f1', name: 'full_name', label: 'Full Name', type: 'text', required: true, options: [] },
              { id: 'f2', name: 'student_id', label: 'Student ID / Roll', type: 'text', required: true, options: [] },
              { id: 'f3', name: 'email', label: 'Email Address', type: 'email', required: false, options: [] },
              { id: 'f4', name: 'phone', label: 'Phone Number', type: 'tel', required: false, options: [] },
              { id: 'f5', name: 'reference', label: 'Reference Person / Host', type: 'text', required: true, options: [] }
            ],
            theme_config: data.theme_config || {
              primary_color: '#9333ea',
              secondary_color: '#4f46e5',
              accent_color: '#10b981',
              banner_url: '',
              bg_url: '',
              bg_color: '#090d16'
            }
          });
        }
      } catch (err) {
        console.error('Failed to load event:', err);
      } finally {
        setLoading(false);
      }
    };
    loadEvent();
  }, [id]);

  // Form Field Builder Actions
  const addFormField = () => {
    const newId = `f_${Date.now()}`;
    const newField = {
      id: newId,
      name: `field_${eventData.form_schema.length + 1}`,
      label: 'New Question',
      type: 'text',
      required: false,
      options: ['Option 1', 'Option 2']
    };
    setEventData({ ...eventData, form_schema: [...eventData.form_schema, newField] });
  };

  const removeFormField = (fieldId) => {
    setEventData({
      ...eventData,
      form_schema: eventData.form_schema.filter(f => f.id !== fieldId)
    });
  };

  const updateFormField = (fieldId, updates) => {
    setEventData({
      ...eventData,
      form_schema: eventData.form_schema.map(f => f.id === fieldId ? { ...f, ...updates } : f)
    });
  };

  const moveField = (index, direction) => {
    const newSchema = [...eventData.form_schema];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSchema.length) return;
    const temp = newSchema[index];
    newSchema[index] = newSchema[targetIndex];
    newSchema[targetIndex] = temp;
    setEventData({ ...eventData, form_schema: newSchema });
  };

  const addFieldOption = (fieldId) => {
    setEventData({
      ...eventData,
      form_schema: eventData.form_schema.map(f => {
        if (f.id === fieldId) {
          const currentOpts = f.options || [];
          return { ...f, options: [...currentOpts, `Option ${currentOpts.length + 1}`] };
        }
        return f;
      })
    });
  };

  const updateFieldOption = (fieldId, optIndex, newValue) => {
    setEventData({
      ...eventData,
      form_schema: eventData.form_schema.map(f => {
        if (f.id === fieldId) {
          const opts = [...(f.options || [])];
          opts[optIndex] = newValue;
          return { ...f, options: opts };
        }
        return f;
      })
    });
  };

  const removeFieldOption = (fieldId, optIndex) => {
    setEventData({
      ...eventData,
      form_schema: eventData.form_schema.map(f => {
        if (f.id === fieldId) {
          const opts = (f.options || []).filter((_, idx) => idx !== optIndex);
          return { ...f, options: opts };
        }
        return f;
      })
    });
  };

  // Export / Import JSON Schema
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(eventData.form_schema, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${eventData.title.toLowerCase().replace(/\s+/g, '_')}_form_schema.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (Array.isArray(parsed)) {
          setEventData({ ...eventData, form_schema: parsed });
        } else {
          alert('Invalid schema JSON file format.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Save Event Action
  const handleSave = async () => {
    if (!eventData.title.trim()) {
      alert('Event Title is required.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: eventData.title.trim(),
        date: `${eventData.date} ${eventData.time}:00`,
        is_active: eventData.is_active,
        allow_on_spot: eventData.allow_on_spot,
        registration_type: eventData.registration_type,
        google_form_url: eventData.google_form_url.trim(),
        google_sheet_csv_url: eventData.google_sheet_csv_url.trim(),
        form_schema: eventData.form_schema,
        theme_config: eventData.theme_config
      };

      if (isEditing) {
        const { error } = await updateEvent(id, payload);
        if (error) throw error;
      } else {
        const { data, error } = await createEvent(payload);
        if (error) throw error;
        if (data && data[0]) {
          navigate(`/events/${data[0].id}/edit`);
        }
      }

      alert(`Event ${isEditing ? 'updated' : 'created'} successfully!`);
    } catch (err) {
      console.error('Failed to save event:', err);
      alert(`Save failed: ${err.message || 'Error saving event'}`);
    } finally {
      setSaving(false);
    }
  };

  // Google Sheet Live Sync & Preview
  const handlePreviewGoogleSync = async () => {
    if (!eventData.google_sheet_csv_url) {
      alert('Please enter a published Google Sheet CSV URL first.');
      return;
    }

    try {
      setLoadingGooglePreview(true);
      setShowGooglePreviewModal(true);

      const response = await fetch(eventData.google_sheet_csv_url);
      const csvText = await response.text();
      const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);

      if (lines.length > 0) {
        const headers = lines[0].split(',').map(h => h.replace(/^"(.*)"$/, '$1').trim());
        setGoogleHeaders(headers);

        // Auto-detect column mappings based on header names
        const autoMap = { full_name: '', student_id: '', reference: '', email: '', phone: '' };
        headers.forEach(h => {
          const lower = h.toLowerCase();
          if (lower.includes('name') && !autoMap.full_name) autoMap.full_name = h;
          else if ((lower.includes('student') || lower.includes('id') || lower.includes('roll')) && !autoMap.student_id) autoMap.student_id = h;
          else if ((lower.includes('reference') || lower.includes('host') || lower.includes('ref')) && !autoMap.reference) autoMap.reference = h;
          else if (lower.includes('email') && !autoMap.email) autoMap.email = h;
          else if ((lower.includes('phone') || lower.includes('mobile')) && !autoMap.phone) autoMap.phone = h;
        });
        setGoogleMapping(autoMap);

        const rows = lines.slice(1, 10).map(line => {
          const vals = line.split(',').map(v => v.replace(/^"(.*)"$/, '$1').trim());
          const obj = {};
          headers.forEach((h, idx) => {
            obj[h || `Col_${idx + 1}`] = vals[idx] || '';
          });
          return obj;
        });
        setGooglePreviewData(rows);
      } else {
        setGooglePreviewData([]);
      }
    } catch (err) {
      console.error('Preview error:', err);
      setGooglePreviewData([]);
    } finally {
      setLoadingGooglePreview(false);
    }
  };

  const handleSyncGoogleResponses = async (customMap = null) => {
    if (!id) {
      alert('Please save the event first before syncing Google Sheet responses.');
      return;
    }
    if (!eventData.google_sheet_csv_url) {
      alert('Please provide a valid published Google Sheet CSV URL.');
      return;
    }

    const mapToUse = customMap || googleMapping;
    if (customMap && (!mapToUse.full_name || !mapToUse.student_id || !mapToUse.reference)) {
      alert('Please assign all mandatory column headers (Full Name, Student ID, Reference Person) before importing.');
      return;
    }

    try {
      setSyncingGoogle(true);
      const { data, error } = await syncGoogleSheetResponses(id, eventData.google_sheet_csv_url, mapToUse);
      if (error) throw error;
      const count = data?.count || 0;
      const skipped = data?.skippedCount || 0;
      setSyncSuccessMsg(`Synced ${count} new responses! (${skipped} duplicate records skipped)`);
    } catch (err) {
      console.error('Google Sheet Sync failed:', err);
      alert(`Sync failed: ${err.message || 'Error importing Google Sheet responses'}`);
    } finally {
      setSyncingGoogle(false);
    }
  };

  const publicRegUrl = `${window.location.origin}/register/${id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicRegUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 text-left pb-24 font-sans">
      {/* HEADER BAR */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/events')}
            className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white uppercase italic tracking-tight flex items-center gap-2">
              <span>{isEditing ? 'Edit Event Details' : 'Create New Event'}</span>
            </h1>
            <p className="text-xs text-slate-400">Configure schedule, registration intake, form schema, and visual theme in a single page</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {isEditing && eventData.registration_type === 'custom_form' && (
            <button
              onClick={() => navigate(`/register/${id}`)}
              className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Eye size={15} />
              <span>Preview Public Form</span>
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 min-h-[42px]"
          >
            <Check size={16} />
            <span>{saving ? 'Saving Event...' : (isEditing ? 'Update Event' : 'Create Event')}</span>
          </button>
        </div>
      </header>

      {/* SHARE & PUBLIC REGISTRATION LINK CARD (ONLY IF CUSTOM FORM INTAKE IS ACTIVE) */}
      {isEditing && eventData.registration_type === 'custom_form' && (
        <div className="bg-slate-900/90 border border-purple-500/30 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-400">
                <Share2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase italic tracking-tight">Public Event Registration Link</h3>
                <p className="text-xs text-slate-400">Share this link with attendees to collect event registrations</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 min-h-[38px]"
              >
                {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Registration Link'}</span>
              </button>

              <button
                onClick={() => window.open(publicRegUrl, '_blank')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[38px]"
              >
                <ExternalLink size={14} />
                <span>Open Registration Page</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-purple-300 truncate">
            {publicRegUrl}
          </div>
        </div>
      )}

      {/* SECTION 1: EVENT SCHEDULE & ACCESS CONTROL */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-400">
            <Calendar size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white uppercase italic tracking-tight">1. Event Schedule & Access Control</h3>
            <p className="text-xs text-slate-400">Set title, date, time, active status, and kiosk access rules</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Event Title *</label>
            <input
              type="text"
              value={eventData.title}
              onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
              placeholder="e.g. IUB Inter-University Programming Contest 2026"
              className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-3.5 text-sm text-white font-bold outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Event Date *</label>
              <CompactDatePicker
                value={eventData.date}
                onChange={(d) => setEventData({ ...eventData, date: d })}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Event Time *</label>
              <CustomTimePicker
                value={eventData.time}
                onChange={(t) => setEventData({ ...eventData, time: t })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Active Event Status</span>
                <span className="text-[10px] text-slate-400">Visible on active dashboard lists</span>
              </div>
              <input
                type="checkbox"
                checked={eventData.is_active}
                onChange={(e) => setEventData({ ...eventData, is_active: e.target.checked })}
                className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
              />
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Allow On-Spot Entry Kiosk</span>
                <span className="text-[10px] text-slate-400">Enable self-entry kiosk mode</span>
              </div>
              <input
                type="checkbox"
                checked={eventData.allow_on_spot}
                onChange={(e) => setEventData({ ...eventData, allow_on_spot: e.target.checked })}
                className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: REGISTRATION INTAKE OPTIONS & FORM BUILDER */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white uppercase italic tracking-tight">2. Registration Intake Options & Form Builder</h3>
            <p className="text-xs text-slate-400">Select intake mode and configure questions, Google Form link, or CSV column mapping</p>
          </div>
        </div>

        {/* REGISTRATION MODE LOCK NOTICE IN EDIT MODE */}
        {isEditing && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-400 flex items-center gap-3">
            <Lock size={18} className="shrink-0" />
            <div>
              <span className="font-bold block">Registration Mode Locked</span>
              <span className="text-[11px] text-amber-300/80">Registration intake mode cannot be changed after event creation to preserve attendee data and schema integrity.</span>
            </div>
          </div>
        )}

        {/* INTAKE MODE CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => {
              if (!isEditing) setEventData({ ...eventData, registration_type: 'custom_form' });
            }}
            className={`p-5 rounded-2xl border transition-all space-y-3 ${isEditing ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'} ${eventData.registration_type === 'custom_form' ? 'bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-500/10' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 w-fit">
                <FileText size={20} />
              </div>
              {isEditing && eventData.registration_type === 'custom_form' && <Lock size={14} className="text-purple-400" />}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Custom Form Maker</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Visual form builder + Option choices + JSON import/export</p>
            </div>
          </div>

          <div
            onClick={() => {
              if (!isEditing) setEventData({ ...eventData, registration_type: 'google_form' });
            }}
            className={`p-5 rounded-2xl border transition-all space-y-3 ${isEditing ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'} ${eventData.registration_type === 'google_form' ? 'bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-500/10' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 w-fit">
                <Globe size={20} />
              </div>
              {isEditing && eventData.registration_type === 'google_form' && <Lock size={14} className="text-blue-400" />}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Google Form Sync</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Link Google Form & live-sync responses via Google Sheet</p>
            </div>
          </div>

          <div
            onClick={() => {
              if (!isEditing) setEventData({ ...eventData, registration_type: 'csv_upload' });
            }}
            className={`p-5 rounded-2xl border transition-all space-y-3 ${isEditing ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'} ${eventData.registration_type === 'csv_upload' ? 'bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-500/10' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 w-fit">
                <FileSpreadsheet size={20} />
              </div>
              {isEditing && eventData.registration_type === 'csv_upload' && <Lock size={14} className="text-emerald-400" />}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Dynamic CSV Mapper</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Upload CSV file with dynamic header mapping wizard</p>
            </div>
          </div>
        </div>

        {/* MODE A: ENHANCED FORM MAKER */}
        {eventData.registration_type === 'custom_form' && (
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
              <div>
                <h4 className="text-sm font-bold text-white uppercase italic tracking-tight">Custom Registration Form Schema Builder</h4>
                <p className="text-xs text-slate-400">Design custom input questions, choice options, and export/import JSON schemas</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHowToForm(!showHowToForm)}
                  className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <HelpCircle size={14} />
                  <span>Form Maker How-To</span>
                </button>

                <button
                  onClick={handleExportJson}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download size={14} />
                  <span>Export JSON</span>
                </button>

                <label className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                  <Upload size={14} />
                  <span>Import JSON</span>
                  <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
                </label>
              </div>
            </div>

            {/* HOW-TO GUIDE */}
            {showHowToForm && (
              <div className="p-4 bg-purple-950/30 border border-purple-500/30 rounded-2xl text-xs text-purple-200 space-y-2 font-mono">
                <h4 className="font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> How to Customize Form Questions & Option Choices
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                  <li><strong>Mandatory System Fields</strong>: <code>Full Name</code>, <code>Student ID</code>, and <code>Reference Person</code> are locked system fields.</li>
                  <li><strong>Choice Fields</strong>: For <code>Dropdown Select</code>, <code>Radio Choice</code>, or <code>Checkboxes</code>, click <code>+ Add Choice</code> to customize option items.</li>
                  <li><strong>Field Ordering</strong>: Use the <ChevronUp size={12} className="inline"/> and <ChevronDown size={12} className="inline"/> arrows to reorder questions.</li>
                </ul>
              </div>
            )}

            {/* FIELDS EDITOR LIST */}
            <div className="space-y-4">
              {eventData.form_schema.map((field, idx) => (
                <div key={field.id} className="p-5 bg-slate-900 border border-slate-800/80 rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => moveField(idx, 'up')}
                          disabled={idx === 0 || ['full_name', 'student_id', 'reference'].includes(field.name)}
                          className="p-1 text-slate-500 hover:text-white disabled:opacity-30"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          onClick={() => moveField(idx, 'down')}
                          disabled={['full_name', 'student_id', 'reference'].includes(field.name) || idx === eventData.form_schema.length - 1}
                          className="p-1 text-slate-500 hover:text-white disabled:opacity-30"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>

                      <span className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-bold font-mono text-slate-400 flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>

                      <div className="space-y-1 flex-1">
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateFormField(field.id, { label: e.target.value })}
                          className="bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg p-2 text-xs font-bold text-white outline-none w-full"
                          disabled={['full_name', 'student_id', 'reference'].includes(field.name)}
                        />
                        <span className="text-[10px] font-mono text-slate-500 block">Field Key: {field.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <select
                        value={field.type}
                        onChange={(e) => updateFormField(field.id, { type: e.target.value })}
                        className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none"
                        disabled={['full_name', 'student_id', 'reference'].includes(field.name)}
                      >
                        <option value="text">Short Text</option>
                        <option value="textarea">Long Paragraph</option>
                        <option value="number">Numeric Input</option>
                        <option value="phone">Phone Number</option>
                        <option value="select">Dropdown Select</option>
                        <option value="radio">Radio Choices</option>
                        <option value="checkbox">Checkboxes</option>
                      </select>

                      <label className="flex items-center gap-1.5 text-xs text-slate-400">
                        <input
                          type="checkbox"
                          checked={['full_name', 'student_id', 'reference'].includes(field.name) ? true : field.required}
                          onChange={(e) => updateFormField(field.id, { required: e.target.checked })}
                          disabled={['full_name', 'student_id', 'reference'].includes(field.name)}
                          className="accent-purple-600 rounded"
                        />
                        <span>Required</span>
                      </label>

                      {!['full_name', 'student_id', 'reference'].includes(field.name) && (
                        <button
                          onClick={() => removeFormField(field.id)}
                          className="p-2 text-slate-500 hover:text-red-400 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {['select', 'radio', 'checkbox'].includes(field.type) && (
                    <div className="pt-3 border-t border-slate-800/80 space-y-2 pl-9">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Configure Option Choices
                      </span>

                      <div className="flex flex-wrap gap-2">
                        {(field.options || []).map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => updateFieldOption(field.id, optIdx, e.target.value)}
                              className="bg-transparent text-xs text-white outline-none w-24 px-1"
                            />
                            <button
                              onClick={() => removeFieldOption(field.id, optIdx)}
                              className="text-slate-500 hover:text-red-400 p-0.5"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}

                        <button
                          onClick={() => addFieldOption(field.id)}
                          className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                        >
                          <Plus size={12} />
                          <span>Add Choice</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={addFormField}
                className="w-full py-3 bg-slate-900 border border-dashed border-slate-800 hover:border-purple-500/50 text-purple-400 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Plus size={16} />
                <span>Add New Form Question</span>
              </button>
            </div>
          </div>
        )}

        {/* MODE B: GOOGLE FORM SYNC WITH PREVIEW */}
        {eventData.registration_type === 'google_form' && (
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
              <div>
                <h4 className="text-sm font-bold text-white uppercase italic tracking-tight">Google Form Live Sync & Column Mapper</h4>
                <p className="text-xs text-slate-400">Connect Google Form responses to live-sync attendees automatically</p>
              </div>

              <button
                onClick={() => setShowHowToGoogle(!showHowToGoogle)}
                className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <HelpCircle size={14} />
                <span>Google Sheet Sync How-To</span>
              </button>
            </div>

            {showHowToGoogle && (
              <div className="p-4 bg-blue-950/30 border border-blue-500/30 rounded-2xl text-xs text-blue-200 space-y-2 font-mono">
                <h4 className="font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> How to Get Your Published Google Sheet CSV Sync URL
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
                  <li>Open your Google Form $\rightarrow$ Go to <strong>Responses</strong> tab $\rightarrow$ Click <strong>Link to Sheets</strong>.</li>
                  <li>Inside the Google Sheet, click <strong>File</strong> $\rightarrow$ <strong>Share</strong> $\rightarrow$ <strong>Publish to Web</strong>.</li>
                  <li>Select <strong>Entire Document</strong> $\rightarrow$ Choose <strong>Comma-separated values (.csv)</strong>.</li>
                  <li>Click <strong>Publish</strong> and copy the generated CSV URL into the box below!</li>
                </ol>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Google Form Link / Embed URL</label>
                <input
                  type="url"
                  value={eventData.google_form_url}
                  onChange={(e) => setEventData({ ...eventData, google_form_url: e.target.value })}
                  placeholder="https://docs.google.com/forms/d/e/.../viewform"
                  className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-xs text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Published Google Sheet CSV Sync URL (Live Responses)</label>
                <input
                  type="url"
                  value={eventData.google_sheet_csv_url}
                  onChange={(e) => setEventData({ ...eventData, google_sheet_csv_url: e.target.value })}
                  placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
                  className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-xs text-white outline-none font-mono"
                />
              </div>

              {syncSuccessMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>{syncSuccessMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePreviewGoogleSync}
                  disabled={loadingGooglePreview}
                  className="py-3 px-5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Eye size={16} className="text-blue-400" />
                  <span>{loadingGooglePreview ? 'Inspecting CSV Stream...' : 'Preview Live Sheet Data & Map Headers'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncGoogleResponses}
                  disabled={syncingGoogle}
                  className="py-3 px-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  <RefreshCw className={syncingGoogle ? 'animate-spin' : ''} size={16} />
                  <span>{syncingGoogle ? 'Syncing Responses...' : 'Sync All Live Responses'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODE C: CSV DYNAMIC MAPPER LAUNCHER & PREVIEW */}
        {eventData.registration_type === 'csv_upload' && (
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
              <div>
                <h4 className="text-sm font-bold text-white uppercase italic tracking-tight">Upload CSV with Dynamic Field Mapping</h4>
                <p className="text-xs text-slate-400">Map custom CSV headers to mandatory attendee fields with step-by-step wizard</p>
              </div>

              <button
                onClick={() => setShowHowToCsv(!showHowToCsv)}
                className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <HelpCircle size={14} />
                <span>CSV Importer How-To</span>
              </button>
            </div>

            {showHowToCsv && (
              <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl text-xs text-emerald-200 space-y-2 font-mono">
                <h4 className="font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> How to Import Attendee Rosters via CSV
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                  <li>Click <strong>Launch CSV Mapping Wizard & Live Preview</strong> below to upload your roster file.</li>
                  <li>Map columns to <strong>Full Name</strong> *, <strong>Student ID</strong> *, and <strong>Reference / Contact</strong> *.</li>
                  <li>Preview live table rows before importing records.</li>
                </ul>
              </div>
            )}

            <div className="space-y-4">
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3">
                <FileSpreadsheet size={36} className="mx-auto text-emerald-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">Dynamic CSV Header Mapper & Preview Wizard</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">Upload any CSV file and visually pair column headers with system attendee record fields</p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCsvMapper(true)}
                  className="py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20"
                >
                  Launch CSV Mapping Wizard & Live Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 3: VISUAL THEME CUSTOMIZER (ONLY SHOWN FOR CUSTOM FORM REGISTRATION) */}
      {eventData.registration_type === 'custom_form' && (
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-400">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase italic tracking-tight">3. Visual Theme Customizer</h3>
                <p className="text-xs text-slate-400">Customize brand color palette, hero banners, and background accents for public registration pages</p>
              </div>
            </div>

            <button
              onClick={() => setShowHowToTheme(!showHowToTheme)}
              className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <HelpCircle size={14} />
              <span>Theme Customizer How-To</span>
            </button>
          </div>

          {showHowToTheme && (
            <div className="p-4 bg-purple-950/30 border border-purple-500/30 rounded-2xl text-xs text-purple-200 space-y-2 font-mono">
              <h4 className="font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> How to Style Public Registration Pages
              </h4>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                <li><strong>Primary & Accent Colors</strong>: Pick brand hex codes to style buttons, header badges, and accent glows.</li>
                <li><strong>Hero Banner URL</strong>: Provide a high-res image link (e.g. 1920x1080) for header banner posters.</li>
              </ul>
            </div>
          )}

          <div className="space-y-6">
            {/* COLOR PALETTE PICKERS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Primary Brand Color</label>
                <div className="flex items-center gap-2 bg-slate-950 p-2 border border-slate-800 rounded-xl">
                  <input
                    type="color"
                    value={eventData.theme_config.primary_color || '#9333ea'}
                    onChange={(e) => setEventData({
                      ...eventData,
                      theme_config: { ...eventData.theme_config, primary_color: e.target.value }
                    })}
                    className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={eventData.theme_config.primary_color || '#9333ea'}
                    onChange={(e) => setEventData({
                      ...eventData,
                      theme_config: { ...eventData.theme_config, primary_color: e.target.value }
                    })}
                    className="bg-transparent text-xs text-white outline-none font-mono uppercase w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Secondary Accent Color</label>
                <div className="flex items-center gap-2 bg-slate-950 p-2 border border-slate-800 rounded-xl">
                  <input
                    type="color"
                    value={eventData.theme_config.secondary_color || '#4f46e5'}
                    onChange={(e) => setEventData({
                      ...eventData,
                      theme_config: { ...eventData.theme_config, secondary_color: e.target.value }
                    })}
                    className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={eventData.theme_config.secondary_color || '#4f46e5'}
                    onChange={(e) => setEventData({
                      ...eventData,
                      theme_config: { ...eventData.theme_config, secondary_color: e.target.value }
                    })}
                    className="bg-transparent text-xs text-white outline-none font-mono uppercase w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Success Badge Color</label>
                <div className="flex items-center gap-2 bg-slate-950 p-2 border border-slate-800 rounded-xl">
                  <input
                    type="color"
                    value={eventData.theme_config.accent_color || '#10b981'}
                    onChange={(e) => setEventData({
                      ...eventData,
                      theme_config: { ...eventData.theme_config, accent_color: e.target.value }
                    })}
                    className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={eventData.theme_config.accent_color || '#10b981'}
                    onChange={(e) => setEventData({
                      ...eventData,
                      theme_config: { ...eventData.theme_config, accent_color: e.target.value }
                    })}
                    className="bg-transparent text-xs text-white outline-none font-mono uppercase w-full"
                  />
                </div>
              </div>
            </div>

            {/* BANNERS & BACKGROUND URLS */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Header Banner Image URL</label>
                <input
                  type="url"
                  value={eventData.theme_config.banner_url || ''}
                  onChange={(e) => setEventData({
                    ...eventData,
                    theme_config: { ...eventData.theme_config, banner_url: e.target.value }
                  })}
                  placeholder="HTTPS://..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-3 text-xs text-white outline-none font-mono"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* BOTTOM ACTION BAR */}
      <div className="pt-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-xl shadow-purple-600/20 disabled:opacity-50 flex items-center gap-2"
        >
          <Check size={18} />
          <span>{saving ? 'Saving Event...' : (isEditing ? 'Update Event Settings' : 'Create & Save Event')}</span>
        </button>
      </div>

      {/* CSV MAPPER WIZARD MODAL */}
      <CsvFieldMapperModal
        isOpen={showCsvMapper}
        onClose={() => setShowCsvMapper(false)}
        eventId={id}
        onImportSuccess={() => alert('CSV Roster Imported successfully!')}
      />

      {/* GOOGLE FORM LIVE SYNC PREVIEW MODAL */}
      {showGooglePreviewModal && (
        <div className="fixed inset-0 z-[250] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 text-left max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-blue-400">
                  <Globe size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase italic tracking-tight">Google Form Live Sync Preview</h3>
                  <p className="text-xs text-slate-400 font-mono">Published Sheet CSV Data Inspection</p>
                </div>
              </div>
              <X className="text-slate-500 cursor-pointer hover:text-white" onClick={() => setShowGooglePreviewModal(false)} />
            </div>

            {loadingGooglePreview ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <RefreshCw size={24} className="animate-spin text-blue-400" />
                <span className="text-xs font-mono text-slate-400">Fetching CSV Response Stream...</span>
              </div>
            ) : googlePreviewData.length > 0 ? (
              <div className="space-y-5 text-xs font-mono">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 flex items-center justify-between">
                  <span className="font-bold">✓ Connected to Google Sheet CSV Stream</span>
                  <span className="bg-slate-950 px-2 py-0.5 rounded text-[11px]">{googlePreviewData.length} Sample Rows</span>
                </div>

                {/* GOOGLE FORM COLUMN MAPPER GRID */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 font-sans">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Layers size={14} className="text-blue-400" />
                    <span>Pair Google Sheet Headers with Attendee Fields</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 block mb-1">Full Name <span className="text-red-400">*</span></label>
                      <select
                        value={googleMapping.full_name}
                        onChange={(e) => setGoogleMapping({ ...googleMapping, full_name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                      >
                        <option value="">Select Column...</option>
                        {googleHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-400 block mb-1">Student ID / Roll No <span className="text-red-400">*</span></label>
                      <select
                        value={googleMapping.student_id}
                        onChange={(e) => setGoogleMapping({ ...googleMapping, student_id: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                      >
                        <option value="">Select Column...</option>
                        {googleHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-400 block mb-1">Reference Person / Host <span className="text-red-400">*</span></label>
                      <select
                        value={googleMapping.reference}
                        onChange={(e) => setGoogleMapping({ ...googleMapping, reference: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                      >
                        <option value="">Select Column...</option>
                        {googleHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-400 block mb-1">Email Address (Optional)</label>
                      <select
                        value={googleMapping.email}
                        onChange={(e) => setGoogleMapping({ ...googleMapping, email: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                      >
                        <option value="">Select Column...</option>
                        {googleHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block">Live Response Preview</span>
                  <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950 max-h-48">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-bold uppercase">
                          {Object.keys(googlePreviewData[0] || {}).map(col => (
                            <th key={col} className="p-3 whitespace-nowrap">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {googlePreviewData.map((row, rIdx) => (
                          <tr key={rIdx} className="border-b border-slate-800/50 hover:bg-slate-900/40">
                            {Object.values(row).map((val, cIdx) => (
                              <td key={cIdx} className="p-3 whitespace-nowrap text-slate-200">{String(val || '')}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <AlertCircle size={32} className="mx-auto text-amber-400" />
                <p className="text-xs font-bold text-white">No response data retrieved yet.</p>
                <p className="text-[11px]">Make sure your Google Sheet is published as CSV via File $\rightarrow$ Share $\rightarrow$ Publish to Web.</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowGooglePreviewModal(false)}
                className="flex-1 py-3 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-xs font-medium"
              >
                Close Preview
              </button>
              <button
                onClick={() => { setShowGooglePreviewModal(false); handleSyncGoogleResponses(googleMapping); }}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-widest"
              >
                Import All Responses Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateEditEventPage;
