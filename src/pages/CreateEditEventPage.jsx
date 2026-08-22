import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchEventById, createEvent, updateEvent, fetchGoogleSheetResponses } from '../api/events';
import { CompactDatePicker, CustomTimePicker, LoadingSpinner, CsvFieldMapperModal } from '../components';
import { 
  Calendar, Clock, Award, Layers, Sparkles, Check, ArrowLeft, 
  HelpCircle, Palette, FileText, Download, Upload, Link, RefreshCw, 
  Plus, Trash2, Globe, FileSpreadsheet, Eye, ChevronRight, CheckCircle2,
  Share2, Copy, ChevronUp, ChevronDown, Move, Settings2, Sliders, ExternalLink, QrCode
} from 'lucide-react';
import Papa from 'papaparse';

const CreateEditEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'registration' | 'theme'
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

  // Modals & Importers
  const [showCsvMapper, setShowCsvMapper] = useState(false);
  const [syncingGoogle, setSyncingGoogle] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState(null);

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
    const newField = {
      id: `field_${Date.now()}`,
      name: `custom_field_${eventData.form_schema.length + 1}`,
      label: 'New Question / Field',
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
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 3 || targetIndex >= eventData.form_schema.length) return;

    const schema = [...eventData.form_schema];
    const [moved] = schema.splice(index, 1);
    schema.splice(targetIndex, 0, moved);
    setEventData({ ...eventData, form_schema: schema });
  };

  // Option Choices Editor for Select / Radio / Checkbox
  const addFieldOption = (fieldId) => {
    setEventData({
      ...eventData,
      form_schema: eventData.form_schema.map(f => {
        if (f.id === fieldId) {
          const opts = f.options || [];
          return { ...f, options: [...opts, `Option ${opts.length + 1}`] };
        }
        return f;
      })
    });
  };

  const updateFieldOption = (fieldId, optionIndex, newValue) => {
    setEventData({
      ...eventData,
      form_schema: eventData.form_schema.map(f => {
        if (f.id === fieldId) {
          const opts = [...(f.options || [])];
          opts[optionIndex] = newValue;
          return { ...f, options: opts };
        }
        return f;
      })
    });
  };

  const removeFieldOption = (fieldId, optionIndex) => {
    setEventData({
      ...eventData,
      form_schema: eventData.form_schema.map(f => {
        if (f.id === fieldId) {
          const opts = (f.options || []).filter((_, i) => i !== optionIndex);
          return { ...f, options: opts };
        }
        return f;
      })
    });
  };

  // JSON Schema Export & Import
  const handleExportJson = () => {
    const jsonStr = JSON.stringify({
      form_schema: eventData.form_schema,
      theme_config: eventData.theme_config
    }, null, 2);

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(eventData.title || 'event_form').replace(/[^a-zA-Z0-9]/g, '_')}_schema.json`;
    a.click();
  };

  const handleImportJson = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.form_schema) {
          setEventData(prev => ({
            ...prev,
            form_schema: parsed.form_schema,
            theme_config: parsed.theme_config || prev.theme_config
          }));
          alert('Form Schema & Theme imported successfully!');
        } else {
          alert('Invalid schema file format.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Copy Registration URL
  const publicRegUrl = `${window.location.origin}/register/${id || 'preview'}`;
  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicRegUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Google Sheet Direct Sync Response Importer
  const handleSyncGoogleResponses = async () => {
    if (!eventData.google_sheet_csv_url) {
      alert('Please enter a valid Google Sheet Published CSV Sync URL first.');
      return;
    }

    try {
      setSyncingGoogle(true);
      setSyncSuccessMsg(null);
      const { data: csvText, error } = await fetchGoogleSheetResponses(eventData.google_sheet_csv_url);
      if (error || !csvText) throw new Error(error || 'Empty response');

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          if (results.data && results.data.length > 0) {
            setSyncSuccessMsg(`Successfully parsed ${results.data.length} Google Form responses!`);
          }
        }
      });
    } catch (err) {
      console.error('Google Sheet Sync Error:', err);
      alert(`Failed to sync responses: ${err.message}`);
    } finally {
      setSyncingGoogle(false);
    }
  };

  // Save Event Handler
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!eventData.title.trim()) {
      alert('Please enter an event title.');
      return;
    }

    try {
      setSaving(true);
      const formattedDate = `${eventData.date} ${eventData.time}`;
      const payload = {
        title: eventData.title.trim(),
        date: formattedDate,
        is_active: eventData.is_active,
        allow_on_spot: eventData.allow_on_spot,
        registration_type: eventData.registration_type,
        google_form_url: eventData.google_form_url,
        google_sheet_csv_url: eventData.google_sheet_csv_url,
        form_schema: eventData.form_schema,
        theme_config: eventData.theme_config
      };

      if (isEditing) {
        await updateEvent(id, payload);
      } else {
        await createEvent(payload);
      }
      navigate('/events');
    } catch (err) {
      console.error('Failed to save event:', err);
      alert('Error saving event details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans italic max-w-5xl mx-auto pb-16">
      {/* PAGE HEADER */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/events')}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase italic tracking-tight flex items-center gap-2">
              <span>{isEditing ? 'Edit Event Manager' : 'Create New Event'}</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                FULL PAGE
              </span>
            </h1>
            <p className="text-xs text-slate-400">Configure event schedule, registration form intake, custom themes, and attendee setup</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
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
                <p className="text-xs text-slate-400">Share this link or QR code with attendees to collect registrations</p>
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

      {/* MULTI-TAB NAVIGATION */}
      <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveTab('basic')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'basic' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-400 hover:text-white'}`}
        >
          <Calendar size={15} />
          <span>1. Basic Schedule</span>
        </button>

        <button
          onClick={() => setActiveTab('registration')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'registration' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-400 hover:text-white'}`}
        >
          <FileText size={15} />
          <span>2. Form Maker & Intake</span>
        </button>

        <button
          onClick={() => setActiveTab('theme')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'theme' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-400 hover:text-white'}`}
        >
          <Palette size={15} />
          <span>3. Visual Theme & Colors</span>
        </button>
      </div>

      {/* TAB 1: BASIC DETAILS */}
      {activeTab === 'basic' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white uppercase italic tracking-tight">Event Details & Schedule</h3>
            <p className="text-xs text-slate-400">Configure event title, date, time, and active kiosk status</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Event Title *</label>
              <input
                type="text"
                value={eventData.title}
                onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                placeholder="e.g. IUB National Programming Contest 2026..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-3 text-xs text-white outline-none font-medium"
                required
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

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={() => setActiveTab('registration')}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <span>Next: Form Maker & Intake Options</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: REGISTRATION INTAKE OPTIONS & FORM MAKER */}
      {activeTab === 'registration' && (
        <div className="space-y-6">
          {/* INTAKE MODE CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              onClick={() => setEventData({ ...eventData, registration_type: 'custom_form' })}
              className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-3 ${eventData.registration_type === 'custom_form' ? 'bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-500/10' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
            >
              <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 w-fit">
                <FileText size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Custom Form Maker</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Visual form builder + Option choices + JSON import/export</p>
              </div>
            </div>

            <div
              onClick={() => setEventData({ ...eventData, registration_type: 'google_form' })}
              className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-3 ${eventData.registration_type === 'google_form' ? 'bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-500/10' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
            >
              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 w-fit">
                <Globe size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Google Form Sync</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Link Google Form & live-sync responses via Google Sheet</p>
              </div>
            </div>

            <div
              onClick={() => setEventData({ ...eventData, registration_type: 'csv_upload' })}
              className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-3 ${eventData.registration_type === 'csv_upload' ? 'bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-500/10' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
            >
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 w-fit">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Dynamic CSV Mapper</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Upload CSV file with dynamic header mapping wizard</p>
              </div>
            </div>
          </div>

          {/* MODE A: ENHANCED FORM MAKER */}
          {eventData.registration_type === 'custom_form' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white uppercase italic tracking-tight">Custom Registration Form Maker</h3>
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
                    className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Download size={14} />
                    <span>Export JSON</span>
                  </button>

                  <label className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
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
                    <li><strong>Mandatory Fields</strong>: <em>Full Name</em>, <em>Student ID</em>, and <em>Reference/Email</em> are automatically reserved.</li>
                    <li><strong>Choice Fields</strong>: For <code>Dropdown Select</code>, <code>Radio Choice</code>, or <code>Checkboxes</code>, click <code>+ Add Choice</code> to customize option items.</li>
                    <li><strong>Field Ordering</strong>: Use the <ChevronUp size={12} className="inline"/> and <ChevronDown size={12} className="inline"/> arrows to reorder questions.</li>
                  </ul>
                </div>
              )}

              {/* FIELDS EDITOR LIST */}
              <div className="space-y-4">
                {eventData.form_schema.map((field, idx) => (
                  <div key={field.id} className="p-5 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        {/* REORDER BUTTONS */}
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

                        <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-bold font-mono text-slate-400 flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>

                        <div className="space-y-1 flex-1">
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateFormField(field.id, { label: e.target.value })}
                            className="bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg p-2 text-xs font-bold text-white outline-none w-full"
                            disabled={['full_name', 'student_id', 'reference'].includes(field.name)}
                          />
                          <span className="text-[10px] font-mono text-slate-500 block">Field Key: {field.name}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <select
                          value={field.type}
                          onChange={(e) => updateFormField(field.id, { type: e.target.value })}
                          className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none"
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

                    {/* DYNAMIC OPTION CHIPS EDITOR FOR SELECT / RADIO / CHECKBOX */}
                    {['select', 'radio', 'checkbox'].includes(field.type) && (
                      <div className="pt-3 border-t border-slate-800/80 space-y-2 pl-9">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Configure Option Choices
                        </span>

                        <div className="flex flex-wrap gap-2">
                          {(field.options || []).map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
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
                            className="px-2.5 py-1 bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
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
                  className="w-full py-3 border-2 border-dashed border-slate-800 hover:border-purple-500/50 rounded-2xl text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center justify-center gap-2 transition-all bg-slate-950/40"
                >
                  <Plus size={16} />
                  <span>Add Custom Field</span>
                </button>
              </div>
            </div>
          )}

          {/* MODE B: GOOGLE FORM INTEGRATION */}
          {eventData.registration_type === 'google_form' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white uppercase italic tracking-tight">Google Form Integration & Live Sync</h3>
                  <p className="text-xs text-slate-400">Connect a Google Form and live-import response records via published Google Sheet CSV link</p>
                </div>

                <button
                  onClick={() => setShowHowToGoogle(!showHowToGoogle)}
                  className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <HelpCircle size={14} />
                  <span>Google Sheet Sync How-To</span>
                </button>
              </div>

              {/* HOW-TO GUIDE */}
              {showHowToGoogle && (
                <div className="p-4 bg-blue-950/30 border border-blue-500/30 rounded-2xl text-xs text-blue-200 space-y-2 font-mono">
                  <h4 className="font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> How to Get Your Published Google Sheet CSV Sync URL
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
                    <li>Open your Google Form $\rightarrow$ Go to <strong>Responses</strong> tab $\rightarrow$ Click <strong>Link to Sheets</strong>.</li>
                    <li>Inside the Google Sheet, click <strong>File</strong> $\rightarrow$ <strong>Share</strong> $\rightarrow$ <strong>Publish to Web</strong>.</li>
                    <li>Select <strong>Entire Document</strong> (or Response tab) $\rightarrow$ Choose <strong>Comma-separated values (.csv)</strong>.</li>
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
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-xs text-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Published Google Sheet CSV Sync URL (Live Responses)</label>
                  <input
                    type="url"
                    value={eventData.google_sheet_csv_url}
                    onChange={(e) => setEventData({ ...eventData, google_sheet_csv_url: e.target.value })}
                    placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-xs text-white outline-none font-mono"
                  />
                </div>

                {syncSuccessMsg && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-mono flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>{syncSuccessMsg}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSyncGoogleResponses}
                  disabled={syncingGoogle}
                  className="w-full py-3 px-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  <RefreshCw className={syncingGoogle ? 'animate-spin' : ''} size={16} />
                  <span>{syncingGoogle ? 'Syncing Responses from Google Sheet...' : 'Import Live Responses from Google Form/Sheet'}</span>
                </button>
              </div>
            </div>
          )}

          {/* MODE C: CSV DYNAMIC MAPPER LAUNCHER */}
          {eventData.registration_type === 'csv_upload' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white uppercase italic tracking-tight">Upload CSV with Dynamic Field Mapping</h3>
                  <p className="text-xs text-slate-400">Map custom CSV headers to mandatory attendee fields with step-by-step wizard</p>
                </div>

                <button
                  onClick={() => setShowHowToCsv(!showHowToCsv)}
                  className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <HelpCircle size={14} />
                  <span>CSV Mapping How-To</span>
                </button>
              </div>

              {/* HOW-TO GUIDE */}
              {showHowToCsv && (
                <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl text-xs text-emerald-200 space-y-2 font-mono">
                  <h4 className="font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> How Dynamic CSV Field Mapping Works
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                    <li>Click <code>Launch CSV Column Mapping Wizard</code> below.</li>
                    <li>Upload your spreadsheet (.csv).</li>
                    <li>Assign columns to mandatory fields: <strong>Full Name</strong>, <strong>Student ID</strong>, and <strong>Reference/Email</strong>.</li>
                  </ul>
                </div>
              )}

              {syncSuccessMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>{syncSuccessMsg}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowCsvMapper(true)}
                className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-600/20"
              >
                <FileSpreadsheet size={18} />
                <span>Launch CSV Column Mapping Wizard</span>
              </button>
            </div>
          )}

          <div className="pt-4 border-t border-slate-800 flex justify-between">
            <button
              onClick={() => setActiveTab('basic')}
              className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Back: Basic Schedule
            </button>

            <button
              onClick={() => setActiveTab('theme')}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <span>Next: Visual Theme & Colors</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: VISUAL THEME & COLORS */}
      {activeTab === 'theme' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white uppercase italic tracking-tight">Theme & Styling Customizer</h3>
              <p className="text-xs text-slate-400">Customize primary/secondary/accent colors and banner images for public registration views</p>
            </div>

            <button
              onClick={() => setShowHowToTheme(!showHowToTheme)}
              className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <HelpCircle size={14} />
              <span>Theme Design How-To</span>
            </button>
          </div>

          {/* HOW-TO GUIDE */}
          {showHowToTheme && (
            <div className="p-4 bg-purple-950/30 border border-purple-500/30 rounded-2xl text-xs text-purple-200 space-y-2 font-mono">
              <h4 className="font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> How Theme Customization Applies to Public Forms
              </h4>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                <li><strong>Primary Color</strong>: Sets main submit button & highlight glow effects on the public registration portal.</li>
                <li><strong>Secondary Color</strong>: Sets secondary badge borders & subtitles.</li>
                <li><strong>Accent Color</strong>: Sets verified indicators & status dots.</li>
                <li><strong>Banner URL</strong>: Displays header banner image on the public registration page.</li>
              </ul>
            </div>
          )}

          <div className="space-y-6">
            {/* COLOR PICKERS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-white block">Primary Color</span>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={eventData.theme_config.primary_color}
                    onChange={(e) => setEventData({
                      ...eventData,
                      theme_config: { ...eventData.theme_config, primary_color: e.target.value }
                    })}
                    className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-300">{eventData.theme_config.primary_color}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-white block">Secondary Color</span>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={eventData.theme_config.secondary_color}
                    onChange={(e) => setEventData({
                      ...eventData,
                      theme_config: { ...eventData.theme_config, secondary_color: e.target.value }
                    })}
                    className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-300">{eventData.theme_config.secondary_color}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-white block">Accent Color</span>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={eventData.theme_config.accent_color}
                    onChange={(e) => setEventData({
                      ...eventData,
                      theme_config: { ...eventData.theme_config, accent_color: e.target.value }
                    })}
                    className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-300">{eventData.theme_config.accent_color}</span>
                </div>
              </div>
            </div>

            {/* BANNER IMAGE & BACKGROUND URL */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Banner Image URL</label>
                <input
                  type="url"
                  value={eventData.theme_config.banner_url}
                  onChange={(e) => setEventData({
                    ...eventData,
                    theme_config: { ...eventData.theme_config, banner_url: e.target.value }
                  })}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-3 text-xs text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Background Image / Pattern URL</label>
                <input
                  type="url"
                  value={eventData.theme_config.bg_url}
                  onChange={(e) => setEventData({
                    ...eventData,
                    theme_config: { ...eventData.theme_config, bg_url: e.target.value }
                  })}
                  placeholder="https://example.com/bg.jpg"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-3 text-xs text-white outline-none font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-between">
            <button
              onClick={() => setActiveTab('registration')}
              className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Back: Form Maker
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-purple-600/20"
            >
              <Check size={16} />
              <span>{saving ? 'Saving...' : 'Save & Publish Event'}</span>
            </button>
          </div>
        </div>
      )}

      {/* CSV MAPPER MODAL */}
      <CsvFieldMapperModal
        isOpen={showCsvMapper}
        onClose={() => setShowCsvMapper(false)}
        onImportAttendees={() => setSyncSuccessMsg('CSV Attendees mapped successfully!')}
      />
    </div>
  );
};

export default CreateEditEventPage;
