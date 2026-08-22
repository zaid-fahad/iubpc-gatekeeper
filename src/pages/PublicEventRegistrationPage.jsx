import React, { useState } from 'react';
import { useParams } from 'react';
import { 
  Calendar, Clock, MapPin, CheckCircle2, UserCheck, ShieldCheck, 
  Upload, FileText, Check, AlertCircle, Info, HelpCircle, ArrowLeft, Image as ImageIcon
} from 'lucide-react';
import { usePublicRegistration } from '../hooks/usePublicRegistration';
import { usePortalTheme } from '../context/PortalThemeContext';
import { generateConfirmationPDF } from '../utils/confirmationPdfGenerator';
import LoadingSpinner from '../components/LoadingSpinner';
import Footer from '../components/Footer';

export default function PublicEventRegistrationPage() {
  const { eventId } = useParams();
  const { settings, isLightMode } = usePortalTheme();
  const theme = settings;

  const {
    loading,
    submitting,
    eventObj,
    formError,
    participantType,
    setParticipantType,
    formData,
    handleInputChange,
    answers,
    handleAnswerChange,
    photoPreview,
    handlePhotoUpload,
    submittedAttendee,
    qrCodeUrl,
    submitRegistration
  } = usePublicRegistration(eventId);

  const [bannerError, setBannerError] = useState(false);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading event details..." />;
  }

  if (!eventObj) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-2xl font-bold">Event Not Found</h1>
        <p className="text-sm text-slate-400 max-w-sm">The event registration link may be invalid or expired.</p>
        <a href="/" className="px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-all">
          Return Home
        </a>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isLightMode ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'} flex flex-col font-sans selection:bg-purple-500 selection:text-white transition-colors duration-200`}>

      {/* TOP HEADER */}
      <header className={`border-b ${isLightMode ? 'bg-white/90 border-slate-200 shadow-2xs' : 'bg-slate-950/80 border-slate-800/80 backdrop-blur-md'} sticky top-0 z-40 px-4 sm:px-8 py-3.5`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-purple-500/30 bg-slate-900 flex items-center justify-center shadow-xs">
              <img 
                src={theme.logo_url || '/transparent_logo.webp'} 
                alt="Logo" 
                className="w-full h-full object-cover" 
                onError={(e) => { e.target.src = '/transparent_logo.webp'; }}
              />
            </div>
            <div>
              <span className={`text-xs font-bold ${isLightMode ? 'text-slate-900' : 'text-white'} tracking-tight block leading-none`}>
                {theme.portalTitle || 'IUBPC Gatekeeper'}
              </span>
              <span className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'} font-medium block mt-0.5`}>
                {theme.orgName || 'Independent University, Bangladesh'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Open</span>
            </span>
          </div>
        </div>
      </header>

      {/* INTEGRATED HERO TILE */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 pt-4 sm:pt-6">
        <div className={`rounded-3xl border ${isLightMode ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-slate-900/60 border-slate-800/80 backdrop-blur-md'} overflow-hidden`}>
          
          {/* BANNER GRAPHIC */}
          <div className="relative h-48 sm:h-64 md:h-80 w-full overflow-hidden bg-slate-950">
            {eventObj.banner_url && !bannerError ? (
              <img 
                src={eventObj.banner_url} 
                alt={eventObj.title} 
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                onError={() => setBannerError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-900/40 via-slate-950 to-emerald-900/30 flex flex-col items-center justify-center p-6 text-center">
                <ImageIcon size={48} className="text-purple-400/40 mb-2" />
                <span className="text-xs font-mono text-purple-300/60 uppercase tracking-widest">{eventObj.title}</span>
              </div>
            )}
            <div className={`absolute inset-0 bg-gradient-to-t ${isLightMode ? 'from-white via-white/40 to-transparent' : 'from-slate-950 via-slate-950/50 to-transparent'}`}></div>
          </div>

          {/* HERO TEXT & METRICS */}
          <div className="p-6 sm:p-8 -mt-16 sm:-mt-20 relative z-10 space-y-4">
            <h1 className={`text-2xl sm:text-4xl md:text-5xl font-black ${isLightMode ? 'text-slate-900' : 'text-white'} tracking-tight leading-tight`}>
              {eventObj.title}
            </h1>

            <p className={`text-xs sm:text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-300'} max-w-2xl leading-relaxed`}>
              Join us for an exciting event at Independent University, Bangladesh. Complete your registration details below to receive your official digital entry pass.
            </p>

            {/* EVENT METRICS */}
            <div className="flex flex-wrap gap-2.5 pt-1 text-xs font-medium">
              <div className={`flex items-center gap-2 ${isLightMode ? 'bg-purple-50 border-purple-200/80 text-purple-900' : 'bg-slate-800/80 border-slate-700/60 text-slate-200'} border px-3.5 py-1.5 rounded-xl shadow-xs`}>
                <Calendar size={14} className="text-purple-600" />
                <span>{eventObj.date || 'TBA'}</span>
              </div>

              <div className={`flex items-center gap-2 ${isLightMode ? 'bg-emerald-50 border-emerald-200/80 text-emerald-900' : 'bg-slate-800/80 border-slate-700/60 text-slate-200'} border px-3.5 py-1.5 rounded-xl shadow-xs`}>
                <Clock size={14} className="text-emerald-600" />
                <span>{eventObj.time || '10:00 AM'}</span>
              </div>

              <div className={`flex items-center gap-2 ${isLightMode ? 'bg-blue-50 border-blue-200/80 text-blue-900' : 'bg-slate-800/80 border-slate-700/60 text-slate-200'} border px-3.5 py-1.5 rounded-xl shadow-xs`}>
                <MapPin size={14} className="text-blue-600" />
                <span>IUB Campus, Dhaka</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MAIN TWO-COLUMN RESPONSIVE LAYOUT */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-4 sm:py-6 flex-1">
        {submittedAttendee ? (
          /* REGISTRATION SUCCESS PAGE CARD */
          <div className={`max-w-2xl mx-auto ${isLightMode ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800 backdrop-blur-xl shadow-2xl'} border rounded-3xl p-8 sm:p-12 text-center space-y-8`}>
            <div 
              className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-white shadow-2xl"
              style={{ backgroundColor: theme.accentColor || '#10b981' }}
            >
              <CheckCircle2 size={44} />
            </div>

            <div className="space-y-2">
              <h2 className={`text-3xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Registration Confirmed!</h2>
              <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'} max-w-md mx-auto`}>
                You are registered for <strong className={isLightMode ? 'text-slate-900' : 'text-white'}>{eventObj.title}</strong>. Your official entry pass is ready.
              </p>
            </div>

            {/* PASS PREVIEW BADGE */}
            <div className={`${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'} border rounded-2xl p-6 space-y-4 max-w-md mx-auto text-left shadow-inner`}>
              <div className={`flex items-center justify-between border-b ${isLightMode ? 'border-slate-200' : 'border-slate-800'} pb-4`}>
                <div>
                  <span className="text-[11px] font-medium text-slate-500 uppercase block">Participant</span>
                  <p className={`text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'} mt-0.5`}>{submittedAttendee.full_name}</p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                    {submittedAttendee.category}
                  </span>
                </div>
                {qrCodeUrl && (
                  <img src={qrCodeUrl} alt="QR Code" className="w-20 h-20 rounded-xl border border-slate-200 bg-white p-1 shadow-md" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[11px] text-slate-500 uppercase block">Registration Code</span>
                  <span className={`${isLightMode ? 'text-slate-900' : 'text-slate-200'} font-bold font-mono mt-0.5 block`}>{submittedAttendee.student_id}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 uppercase block">Host / Reference</span>
                  <span className="text-emerald-600 font-bold mt-0.5 block">{submittedAttendee.reference || 'Verified'}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 max-w-md mx-auto">
              <button
                onClick={() => generateConfirmationPDF(submittedAttendee, eventObj.title)}
                className="w-full py-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-xl transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2"
                style={{ backgroundColor: theme.primaryColor || '#9333ea' }}
              >
                <FileText size={18} />
                <span>Download Entry Pass (PDF)</span>
              </button>
            </div>
          </div>
        ) : (
          /* RESPONSIVE DUAL COLUMN REGISTRATION FORM */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start text-left">
            
            {/* LEFT COLUMN: REGISTRATION FORM (ORDER 2 ON MOBILE, ORDER 1 ON DESKTOP) */}
            <div className="order-2 lg:order-1 lg:col-span-8 space-y-8">
              <form onSubmit={submitRegistration} className="space-y-8">
                
                {formError && (
                  <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl text-xs text-red-400 flex items-center gap-3">
                    <AlertCircle size={18} className="shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* STEP 1: PARTICIPANT TYPE */}
                <div className={`p-6 sm:p-8 space-y-4 rounded-2xl border ${isLightMode ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/60 border-slate-800/80 backdrop-blur-md'}`}>
                  <div className={`flex items-center gap-3 border-b ${isLightMode ? 'border-slate-200' : 'border-slate-800/80'} pb-4`}>
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <div>
                      <h3 className={`text-base font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Registration Category</h3>
                      <p className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Select your registration role for this event</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setParticipantType('student')}
                      className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                        participantType === 'student'
                          ? (isLightMode ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-sm' : 'bg-purple-600/15 border-purple-500 text-white shadow-md')
                          : (isLightMode ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700')
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <UserCheck size={18} className={participantType === 'student' ? 'text-purple-500' : 'text-slate-400'} />
                        <div>
                          <span className={`text-xs font-bold block ${isLightMode && participantType !== 'student' ? 'text-slate-800' : ''}`}>Student / Member</span>
                          <span className={`text-[11px] block ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Requires Student ID</span>
                        </div>
                      </div>
                      {participantType === 'student' && <Check size={16} className="text-purple-500" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setParticipantType('guest')}
                      className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                        participantType === 'guest'
                          ? (isLightMode ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm' : 'bg-emerald-600/15 border-emerald-500 text-white shadow-md')
                          : (isLightMode ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700')
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <ShieldCheck size={18} className={participantType === 'guest' ? 'text-emerald-500' : 'text-slate-400'} />
                        <div>
                          <span className={`text-xs font-bold block ${isLightMode && participantType !== 'guest' ? 'text-slate-800' : ''}`}>Guest / Visitor</span>
                          <span className={`text-[11px] block ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Requires Host Reference</span>
                        </div>
                      </div>
                      {participantType === 'guest' && <Check size={16} className="text-emerald-500" />}
                    </button>
                  </div>
                </div>

                {/* STEP 2: PERSONAL INFORMATION */}
                <div className={`p-6 sm:p-8 space-y-5 rounded-2xl border ${isLightMode ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/60 border-slate-800/80 backdrop-blur-md'}`}>
                  <div className={`flex items-center gap-3 border-b ${isLightMode ? 'border-slate-200' : 'border-slate-800/80'} pb-4`}>
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 flex items-center justify-center text-xs font-bold">
                      2
                    </div>
                    <div>
                      <h3 className={`text-base font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Personal & Identification Details</h3>
                      <p className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Information will be printed on your digital entry pass</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className={`font-semibold ${isLightMode ? 'text-slate-800' : 'text-slate-300'}`}>Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Tanvir Ahmed"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border ${isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'} focus:outline-none focus:border-purple-500 transition-colors`}
                      />
                    </div>

                    {participantType === 'student' ? (
                      <div className="space-y-1.5">
                        <label className={`font-semibold ${isLightMode ? 'text-slate-800' : 'text-slate-300'}`}>Student / Member ID *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 2120000"
                          value={formData.studentId}
                          onChange={(e) => handleInputChange('studentId', e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border ${isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'} focus:outline-none focus:border-purple-500 transition-colors`}
                        />
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className={`font-semibold ${isLightMode ? 'text-slate-800' : 'text-slate-300'}`}>Host / Faculty Reference</label>
                        <input
                          type="text"
                          placeholder="e.g. Dr. Subrata Kumar Dey"
                          value={formData.guestReference}
                          onChange={(e) => handleInputChange('guestReference', e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border ${isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'} focus:outline-none focus:border-purple-500 transition-colors`}
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className={`font-semibold ${isLightMode ? 'text-slate-800' : 'text-slate-300'}`}>Email Address</label>
                      <input
                        type="email"
                        placeholder="e.g. tanvir@iub.edu.bd"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border ${isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'} focus:outline-none focus:border-purple-500 transition-colors`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`font-semibold ${isLightMode ? 'text-slate-800' : 'text-slate-300'}`}>Phone Number</label>
                      <input
                        type="tel"
                        placeholder="e.g. 01700000000"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border ${isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'} focus:outline-none focus:border-purple-500 transition-colors`}
                      />
                    </div>

                    {participantType === 'student' ? (
                      <>
                        <div className="space-y-1.5">
                          <label className={`font-semibold ${isLightMode ? 'text-slate-800' : 'text-slate-300'}`}>Department</label>
                          <input
                            type="text"
                            placeholder="e.g. CSE"
                            value={formData.department}
                            onChange={(e) => handleInputChange('department', e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border ${isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'} focus:outline-none focus:border-purple-500 transition-colors`}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className={`font-semibold ${isLightMode ? 'text-slate-800' : 'text-slate-300'}`}>Batch / Year</label>
                          <input
                            type="text"
                            placeholder="e.g. Batch 2024"
                            value={formData.batch}
                            onChange={(e) => handleInputChange('batch', e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border ${isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'} focus:outline-none focus:border-purple-500 transition-colors`}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-1.5">
                        <label className={`font-semibold ${isLightMode ? 'text-slate-800' : 'text-slate-300'}`}>Organization / Institution</label>
                        <input
                          type="text"
                          placeholder="e.g. BUET / Tech Corp"
                          value={formData.guestOrganization}
                          onChange={(e) => handleInputChange('guestOrganization', e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border ${isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'} focus:outline-none focus:border-purple-500 transition-colors`}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* STEP 3: CUSTOM QUESTIONNAIRE & PHOTO */}
                <div className={`p-6 sm:p-8 space-y-5 rounded-2xl border ${isLightMode ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/60 border-slate-800/80 backdrop-blur-md'}`}>
                  <div className={`flex items-center gap-3 border-b ${isLightMode ? 'border-slate-200' : 'border-slate-800/80'} pb-4`}>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center text-xs font-bold">
                      3
                    </div>
                    <div>
                      <h3 className={`text-base font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Additional Questionnaire & Photo</h3>
                      <p className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Event specific details and identification photo</p>
                    </div>
                  </div>

                  {/* PHOTO UPLOAD SEAM */}
                  <div className="space-y-2">
                    <label className={`font-semibold text-xs ${isLightMode ? 'text-slate-800' : 'text-slate-300'}`}>Participant Photo (Optional)</label>
                    <div className="flex items-center gap-4">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-slate-700" />
                      ) : (
                        <div className={`w-16 h-16 rounded-xl border border-dashed ${isLightMode ? 'border-slate-300 bg-slate-50 text-slate-400' : 'border-slate-800 bg-slate-950 text-slate-600'} flex items-center justify-center`}>
                          <Upload size={20} />
                        </div>
                      )}
                      <label className={`px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider cursor-pointer ${isLightMode ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50' : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'}`}>
                        <span>Upload Photo</span>
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  {/* DYNAMIC QUESTIONNAIRE SCHEMA */}
                  {Array.isArray(eventObj.form_schema) && eventObj.form_schema.length > 0 && (
                    <div className="space-y-4 pt-2 border-t border-slate-800/80">
                      {eventObj.form_schema.map((q, idx) => (
                        <div key={idx} className="space-y-1.5 text-xs">
                          <label className={`font-semibold ${isLightMode ? 'text-slate-800' : 'text-slate-300'}`}>
                            {q.label} {q.required && '*'}
                          </label>
                          {q.type === 'select' ? (
                            <select
                              required={q.required}
                              value={answers[q.label] || ''}
                              onChange={(e) => handleAnswerChange(q.label, e.target.value)}
                              className={`w-full px-4 py-3 rounded-xl border ${isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'} focus:outline-none focus:border-purple-500`}
                            >
                              <option value="">Select an option</option>
                              {q.options?.map((opt, i) => (
                                <option key={i} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : q.type === 'textarea' ? (
                            <textarea
                              required={q.required}
                              rows={3}
                              placeholder="Enter details..."
                              value={answers[q.label] || ''}
                              onChange={(e) => handleAnswerChange(q.label, e.target.value)}
                              className={`w-full px-4 py-3 rounded-xl border ${isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'} focus:outline-none focus:border-purple-500`}
                            />
                          ) : (
                            <input
                              type="text"
                              required={q.required}
                              placeholder="Enter answer..."
                              value={answers[q.label] || ''}
                              onChange={(e) => handleAnswerChange(q.label, e.target.value)}
                              className={`w-full px-4 py-3 rounded-xl border ${isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'} focus:outline-none focus:border-purple-500`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SUBMIT BUTTON */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-xl transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ backgroundColor: theme.primaryColor || '#9333ea' }}
                  >
                    <CheckCircle2 size={18} />
                    <span>{submitting ? 'Submitting Registration...' : 'Complete Event Registration'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* RIGHT COLUMN: EVENT INFORMATION SIDEBAR (ORDER 1 ON MOBILE, ORDER 2 ON DESKTOP) */}
            <div className="order-1 lg:order-2 lg:col-span-4 space-y-6">
              
              {/* VENUE & SCHEDULE CARD */}
              <div className={`p-6 space-y-4 rounded-2xl border ${isLightMode ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/60 border-slate-800/80 backdrop-blur-md'}`}>
                <h4 className={`text-xs font-bold ${isLightMode ? 'text-slate-900 border-slate-200' : 'text-white border-slate-800'} uppercase tracking-wider border-b pb-3 flex items-center gap-2`}>
                  <Info size={14} className="text-purple-500" />
                  <span>Event Overview</span>
                </h4>

                <div className="space-y-3.5 text-xs">
                  <div className="flex items-start gap-3">
                    <Calendar size={16} className="text-purple-500 shrink-0 mt-0.5" />
                    <div>
                      <span className={`font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'} block`}>Event Date</span>
                      <span className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>{eventObj.date || 'To be announced'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className={`font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'} block`}>Event Time</span>
                      <span className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>{eventObj.time || '10:00 AM'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <span className={`font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'} block`}>Venue Location</span>
                      <span className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>Independent University, Bangladesh (IUB)</span>
                      <span className={`text-[11px] ${isLightMode ? 'text-slate-500' : 'text-slate-500'} block`}>Plot 16 Block B, Bashundhara R/A, Dhaka</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* REGISTRATION HELP CARD */}
              <div className={`p-6 space-y-3 rounded-2xl border ${isLightMode ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/60 border-slate-800/80 backdrop-blur-md'}`}>
                <h4 className={`text-xs font-bold ${isLightMode ? 'text-slate-900' : 'text-white'} uppercase tracking-wider flex items-center gap-2`}>
                  <HelpCircle size={14} className="text-emerald-500" />
                  <span>Registration Guidelines</span>
                </h4>
                <ul className={`space-y-2 text-xs ${isLightMode ? 'text-slate-600' : 'text-slate-400'} list-disc pl-4 leading-relaxed`}>
                  <li>Please ensure your name and ID match your university record.</li>
                  <li>Guest visitors must specify a faculty host or reference person.</li>
                  <li>Download your PDF Entry Pass upon completion for gate entry.</li>
                </ul>
              </div>

              {/* BRANDING MINI CARD */}
              <div className={`p-4 ${isLightMode ? 'bg-gradient-to-r from-purple-500/5 via-emerald-500/5 to-blue-500/5 border-slate-200/80 shadow-xs' : 'bg-slate-950/80 border-slate-800/80 shadow-sm'} border rounded-2xl text-center space-y-1`}>
                <span className={`text-xs font-bold ${isLightMode ? 'text-slate-900' : 'text-white'} flex items-center justify-center gap-1.5`}>
                  <span>{theme.portalTitle || 'IUBPC Gatekeeper System'}</span>
                </span>
                <span className={`text-[11px] ${isLightMode ? 'text-slate-600' : 'text-slate-400'} block`}>
                  {theme.orgName || 'Department of Computer Science & Engineering'}
                </span>
              </div>

            </div>

          </div>
        )}
      </main>

      {/* SHARED FOOTER COMPONENT */}
      <Footer />
    </div>
  );
}
