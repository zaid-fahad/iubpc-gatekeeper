import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { fetchEventById } from '../api/events';
import { insertAttendee } from '../api/attendees';
import { LoadingSpinner, Footer } from '../components';
import { generateConfirmationPDF } from '../utils/confirmationPdfGenerator';
import { 
  CheckCircle2, UserPlus, FileText, Sparkles, UserCheck, ShieldCheck, 
  AlertCircle, Upload, Trash2, Calendar, Clock, MapPin, ArrowRight, Check,
  Mail, Phone, User, Hash, FileCheck, Layers, Info, Award, HelpCircle, Heart, Code2, Globe
} from 'lucide-react';

const PublicEventRegistrationPage = () => {
  const { eventId } = useParams();
  const [eventObj, setEventObj] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedAttendee, setSubmittedAttendee] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  const [participantType, setParticipantType] = useState('student'); // 'student' | 'guest'
  const [formData, setFormData] = useState({
    full_name: '',
    student_id: '',
    email: '',
    phone: '',
    reference: '',
    avatar_url: ''
  });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [customResponses, setCustomResponses] = useState({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const loadEvent = async () => {
      setLoading(true);
      try {
        const { data } = await fetchEventById(eventId);
        if (data) {
          setEventObj(data);
        }
      } catch (err) {
        console.error('Failed to load public registration event:', err);
      } finally {
        setLoading(false);
      }
    };
    loadEvent();
  }, [eventId]);

  const handleInputChange = (fieldKey, value) => {
    setFormData({ ...formData, [fieldKey]: value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Profile photo size must be less than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setFormData(prev => ({ ...prev, avatar_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setAvatarPreview('');
    setFormData(prev => ({ ...prev, avatar_url: '' }));
  };

  const handleCheckboxChange = (fieldKey, optionText, isChecked) => {
    setCustomResponses(prev => {
      const currentList = Array.isArray(prev[fieldKey]) ? prev[fieldKey] : [];
      const updatedList = isChecked 
        ? [...currentList, optionText] 
        : currentList.filter(item => item !== optionText);
      return { ...prev, [fieldKey]: updatedList };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.full_name.trim()) {
      setFormError('Full Name is required.');
      return;
    }

    if (participantType === 'student' && !formData.student_id.trim()) {
      setFormError('Student ID / Roll No is required for Students/Members.');
      return;
    }

    if (participantType === 'guest' && !formData.reference.trim()) {
      setFormError('Reference Person / Host contact is required for Guests.');
      return;
    }

    let finalStudentId = formData.student_id.trim();
    if (!finalStudentId && participantType === 'guest') {
      finalStudentId = `GUEST-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    try {
      setSubmitting(true);
      const attendeePayload = {
        event_id: eventId,
        full_name: formData.full_name.trim(),
        student_id: finalStudentId,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        reference: formData.reference.trim() || null,
        avatar_url: formData.avatar_url.trim() || null,
        category: participantType === 'guest' ? 'Guest Visitor' : 'Participant',
        custom_responses: Object.keys(customResponses).length > 0 ? customResponses : null
      };

      const { data: newAttendee, error } = await insertAttendee(attendeePayload);
      if (error) throw error;

      const registered = newAttendee || {
        ...attendeePayload,
        id: `att_${Date.now()}`
      };

      setSubmittedAttendee(registered);

      // Generate QR Code
      const qrData = `${window.location.origin}/verify/${registered.student_id}`;
      const dataUrl = await QRCode.toDataURL(qrData, { width: 250, margin: 1 });
      setQrCodeUrl(dataUrl);

    } catch (err) {
      console.error('Registration failed:', err);
      setFormError(`Registration failed: ${err.message || 'Error creating record'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!eventObj) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-white">Event Registration Unavailable</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">The event ID provided could not be found or public registration is currently closed.</p>
      </div>
    );
  }

  const theme = eventObj.theme_config || {
    primary_color: '#9333ea',
    secondary_color: '#4f46e5',
    accent_color: '#10b981',
    banner_url: '',
    bg_url: '',
    bg_color: '#090d16'
  };

  const schema = eventObj.form_schema || [];

  return (
    <div 
      className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden flex flex-col justify-between selection:bg-purple-500 selection:text-white"
      style={{ backgroundColor: theme.bg_color || '#090d16', backgroundImage: theme.bg_url ? `url(${theme.bg_url})` : 'none' }}
    >
      {/* AMBIENT BACKGROUND GLOWS */}
      <div 
        className="fixed top-0 left-1/4 -translate-x-1/2 w-[600px] h-[350px] rounded-full blur-[160px] opacity-25 pointer-events-none"
        style={{ backgroundColor: theme.primary_color }}
      />
      <div 
        className="fixed bottom-0 right-1/4 translate-x-1/2 w-[500px] h-[300px] rounded-full blur-[140px] opacity-20 pointer-events-none"
        style={{ backgroundColor: theme.secondary_color || theme.primary_color }}
      />

      {/* TOP EVENT WEBPAGE NAVIGATION BAR */}
      <header className="sticky top-0 z-50 w-full bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 p-2 flex items-center justify-center shadow-lg">
              <img src="/transparent_logo.webp" alt="IUBPC Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>Independent University, Bangladesh</span>
              </h1>
              <p className="text-[11px] text-slate-400">Department of Computer Science & Engineering</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-medium bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full">
              <Award size={14} className="text-amber-400" />
              <span>Official Event Registration</span>
            </span>
          </div>
        </div>
      </header>

      {/* FULL-WIDTH HERO BANNER SECTION */}
      <div className="w-full relative border-b border-slate-800/80 overflow-hidden bg-slate-900">
        {theme.banner_url ? (
          <div className="w-full h-64 sm:h-80 md:h-96 relative overflow-hidden group">
            <img 
              src={theme.banner_url} 
              alt={eventObj.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/20" />
          </div>
        ) : (
          <div 
            className="w-full h-56 sm:h-72 relative p-8 flex flex-col justify-end text-left overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${theme.primary_color}40, ${theme.secondary_color || theme.primary_color}20)` }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          </div>
        )}

        {/* OVERLAID HERO TEXT CONTENT CARD */}
        <div className="max-w-6xl mx-auto px-4 sm:px-8 relative z-10 -mt-20 sm:-mt-28 pb-8 text-left">
          <div className="space-y-4 bg-slate-950/85 backdrop-blur-xl border border-slate-800/80 p-6 sm:p-8 rounded-3xl shadow-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white shadow-lg" style={{ backgroundColor: theme.primary_color }}>
              <Sparkles size={14} />
              <span>Open for Registration</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              {eventObj.title}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Join us for an exciting event at Independent University, Bangladesh. Fill in your details below to secure your entry pass.
            </p>

            {/* EVENT QUICK METRICS */}
            <div className="flex flex-wrap gap-3 pt-2 text-xs font-medium">
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-slate-200 shadow-sm">
                <Calendar size={16} className="text-purple-400" />
                <span>{eventObj.date || 'TBA'}</span>
              </div>

              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-slate-200 shadow-sm">
                <Clock size={16} className="text-emerald-400" />
                <span>{eventObj.time || '10:00 AM'}</span>
              </div>

              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-slate-200 shadow-sm">
                <MapPin size={16} className="text-blue-400" />
                <span>IUB Campus, Dhaka</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN RESPONSIVE LAYOUT */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-10 sm:py-14 flex-1">
        {submittedAttendee ? (
          /* REGISTRATION SUCCESS PAGE CARD */
          <div className="max-w-2xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-8 shadow-2xl backdrop-blur-xl">
            <div 
              className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-white shadow-2xl"
              style={{ backgroundColor: theme.accent_color || '#10b981' }}
            >
              <CheckCircle2 size={44} />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white">Registration Confirmed!</h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                You are registered for <strong className="text-white">{eventObj.title}</strong>. Your official entry pass is ready.
              </p>
            </div>

            {/* PASS PREVIEW BADGE */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 max-w-md mx-auto text-left shadow-inner">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[11px] font-medium text-slate-500 uppercase block">Participant</span>
                  <p className="text-xl font-bold text-white mt-0.5">{submittedAttendee.full_name}</p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    {submittedAttendee.category}
                  </span>
                </div>
                {qrCodeUrl && (
                  <img src={qrCodeUrl} alt="QR Code" className="w-20 h-20 rounded-xl border border-slate-800 bg-white p-1 shadow-md" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[11px] text-slate-500 uppercase block">Registration Code</span>
                  <span className="text-slate-200 font-bold font-mono mt-0.5 block">{submittedAttendee.student_id}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 uppercase block">Host / Reference</span>
                  <span className="text-emerald-400 font-bold mt-0.5 block">{submittedAttendee.reference || 'Verified'}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 max-w-md mx-auto">
              <button
                onClick={() => generateConfirmationPDF(submittedAttendee, eventObj.title)}
                className="w-full py-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-xl transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2"
                style={{ backgroundColor: theme.primary_color }}
              >
                <FileText size={18} />
                <span>Download Entry Pass (PDF)</span>
              </button>
            </div>
          </div>
        ) : (
          /* RESPONSIVE DUAL COLUMN REGISTRATION FORM */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start text-left">
            
            {/* LEFT COLUMN: REGISTRATION FORM (8 COLUMNS ON DESKTOP) */}
            <div className="lg:col-span-8 space-y-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {formError && (
                  <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl text-xs text-red-400 flex items-center gap-3">
                    <AlertCircle size={18} className="shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* STEP 1: PARTICIPANT TYPE */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4 backdrop-blur-md">
                  <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Registration Category</h3>
                      <p className="text-xs text-slate-400">Select your registration role for this event</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setParticipantType('student')}
                      className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${participantType === 'student' ? 'bg-purple-600/15 border-purple-500 text-white shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                    >
                      <div className="flex items-center gap-3">
                        <UserCheck size={18} className={participantType === 'student' ? 'text-purple-400' : 'text-slate-500'} />
                        <div>
                          <span className="text-xs font-bold block">Student / Member</span>
                          <span className="text-[11px] text-slate-400 block">Requires Student ID</span>
                        </div>
                      </div>
                      {participantType === 'student' && <Check size={16} className="text-purple-400" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setParticipantType('guest')}
                      className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${participantType === 'guest' ? 'bg-emerald-600/15 border-emerald-500 text-white shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                    >
                      <div className="flex items-center gap-3">
                        <ShieldCheck size={18} className={participantType === 'guest' ? 'text-emerald-400' : 'text-slate-500'} />
                        <div>
                          <span className="text-xs font-bold block">Guest / Visitor</span>
                          <span className="text-[11px] text-slate-400 block">Requires Host Reference</span>
                        </div>
                      </div>
                      {participantType === 'guest' && <Check size={16} className="text-emerald-400" />}
                    </button>
                  </div>
                </div>

                {/* STEP 2: PERSONAL INFORMATION */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-5 backdrop-blur-md">
                  <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Personal Information</h3>
                      <p className="text-xs text-slate-400">Fill in your identity details for event pass verification</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-slate-300 block mb-1.5">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        placeholder="e.g. Tanvir Ahmed"
                        required
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-3.5 text-xs text-white outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1.5">
                        {participantType === 'student' ? 'Student ID / Roll No *' : 'Student ID (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={formData.student_id}
                        onChange={(e) => handleInputChange('student_id', e.target.value)}
                        placeholder={participantType === 'guest' ? 'Auto-generated if empty' : 'e.g. 2020101'}
                        required={participantType === 'student'}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-3.5 text-xs text-white font-mono outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1.5">
                        {participantType === 'guest' ? 'Reference Person / Host *' : 'Reference Person / Host (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={formData.reference}
                        onChange={(e) => handleInputChange('reference', e.target.value)}
                        placeholder={participantType === 'guest' ? 'e.g. Dr. Rahman (Faculty Host)' : 'Optional Host Name'}
                        required={participantType === 'guest'}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-3.5 text-xs text-white outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1.5">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-3.5 text-xs text-white font-mono outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1.5">
                        Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="01700000000"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-3.5 text-xs text-white font-mono outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* PROFILE PHOTO UPLOADER */}
                  <div className="space-y-2 pt-3 border-t border-slate-800/80">
                    <label className="text-xs font-medium text-slate-300 block">
                      Profile Photo (Optional)
                    </label>

                    {avatarPreview ? (
                      <div className="flex items-center gap-4 p-4 bg-slate-950 border border-slate-800 rounded-xl">
                        <img src={avatarPreview} alt="Preview" className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow-md" />
                        <div className="flex-1 truncate">
                          <span className="text-xs font-semibold text-white block">Photo Selected</span>
                          <span className="text-[11px] text-emerald-400 font-mono">Will be printed on pass</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-5 bg-slate-950 border border-dashed border-slate-800 hover:border-purple-500/50 rounded-xl cursor-pointer transition-all group">
                        <Upload size={20} className="text-slate-500 group-hover:text-purple-400 transition-colors mb-1" />
                        <span className="text-xs font-medium text-slate-300">Click to Upload Profile Photo</span>
                        <span className="text-[11px] text-slate-500 mt-0.5">JPG, PNG or WEBP (Max 5MB)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* STEP 3: DYNAMIC EVENT QUESTIONS */}
                {schema.length > 0 && (
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-5 backdrop-blur-md">
                    <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                        3
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">Event Questionnaire</h3>
                        <p className="text-xs text-slate-400">Additional questions provided by event organizers</p>
                      </div>
                    </div>

                    <div className="space-y-5 pt-2">
                      {schema.map((field, fieldIdx) => {
                        const fieldKey = field.id || field.name || field.label || `custom_${fieldIdx}`;
                        const lowerKey = (field.name || field.label || '').toLowerCase();

                        if (lowerKey.includes('full_name') || lowerKey.includes('student_id') || lowerKey.includes('email') || lowerKey.includes('phone') || lowerKey.includes('reference') || lowerKey.includes('roll')) {
                          return null;
                        }

                        return (
                          <div key={fieldKey} className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-300 block">
                              {field.label || field.name} {field.required && <span className="text-red-400">*</span>}
                            </label>

                            {field.type === 'select' ? (
                              <select
                                value={customResponses[fieldKey] || ''}
                                onChange={(e) => setCustomResponses(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                                required={field.required}
                                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-3.5 text-xs text-white outline-none"
                              >
                                <option value="">Select Option...</option>
                                {(field.options || []).map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : field.type === 'radio' ? (
                              <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
                                {(field.options || []).map(opt => (
                                  <label key={opt} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-900 text-xs text-slate-300 cursor-pointer transition-colors">
                                    <input
                                      type="radio"
                                      name={`public_radio_${fieldKey}`}
                                      value={opt}
                                      checked={customResponses[fieldKey] === opt}
                                      onChange={() => setCustomResponses(prev => ({ ...prev, [fieldKey]: opt }))}
                                      className="accent-purple-500"
                                    />
                                    <span>{opt}</span>
                                  </label>
                                ))}
                              </div>
                            ) : field.type === 'checkbox' ? (
                              <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
                                {(field.options || []).map(opt => {
                                  const selectedList = Array.isArray(customResponses[fieldKey]) ? customResponses[fieldKey] : [];
                                  const isChecked = selectedList.includes(opt);
                                  return (
                                    <label key={opt} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-900 text-xs text-slate-300 cursor-pointer transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => handleCheckboxChange(fieldKey, opt, e.target.checked)}
                                        className="accent-purple-500 rounded"
                                      />
                                      <span>{opt}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            ) : field.type === 'textarea' ? (
                              <textarea
                                value={customResponses[fieldKey] || ''}
                                onChange={(e) => setCustomResponses(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                                placeholder={field.placeholder || ''}
                                required={field.required}
                                rows={3}
                                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-3.5 text-xs text-white outline-none resize-none"
                              />
                            ) : (
                              <input
                                type={field.type || 'text'}
                                value={customResponses[fieldKey] || ''}
                                onChange={(e) => setCustomResponses(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                                placeholder={field.placeholder || ''}
                                required={field.required}
                                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-3.5 text-xs text-white outline-none"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SUBMIT BUTTON */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-xl transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ backgroundColor: theme.primary_color }}
                  >
                    <UserPlus size={16} />
                    <span>{submitting ? 'Submitting Registration...' : 'Complete Event Registration'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* RIGHT COLUMN: EVENT INFORMATION SIDEBAR (4 COLUMNS ON DESKTOP) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* VENUE & SCHEDULE CARD */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4 backdrop-blur-md">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
                  <Info size={14} className="text-purple-400" />
                  <span>Event Overview</span>
                </h4>

                <div className="space-y-3.5 text-xs text-slate-300">
                  <div className="flex items-start gap-3">
                    <Calendar size={16} className="text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white block">Event Date</span>
                      <span className="text-slate-400">{eventObj.date || 'To be announced'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white block">Event Time</span>
                      <span className="text-slate-400">{eventObj.time || '10:00 AM'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white block">Venue Location</span>
                      <span className="text-slate-400">Independent University, Bangladesh (IUB)</span>
                      <span className="text-[11px] text-slate-500 block">Plot 16 Block B, Bashundhara R/A, Dhaka</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* REGISTRATION HELP CARD */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3 backdrop-blur-md">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <HelpCircle size={14} className="text-emerald-400" />
                  <span>Registration Guidelines</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-400 list-disc pl-4 leading-relaxed">
                  <li>Please ensure your name and ID match your university record.</li>
                  <li>Guest visitors must specify a faculty host or reference person.</li>
                  <li>Download your PDF Entry Pass upon completion for gate entry.</li>
                </ul>
              </div>

              {/* BRANDING MINI CARD */}
              <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl text-center space-y-1 shadow-sm">
                <span className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                  <span>IUBPC Gatekeeper System</span>
                </span>
                <span className="text-[11px] text-slate-500 block">Department of Computer Science & Engineering</span>
              </div>

            </div>

          </div>
        )}
      </main>

      {/* SHARED FOOTER COMPONENT */}
      <Footer />
    </div>
  );
};

export default PublicEventRegistrationPage;
