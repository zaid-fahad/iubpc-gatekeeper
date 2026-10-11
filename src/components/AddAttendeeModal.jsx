import React, { useState, useEffect } from 'react';
import { X, UserPlus, Sparkles, CheckCircle2, AlertCircle, UserCheck, ShieldCheck, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { insertAttendee } from '../api/attendees';

const AddAttendeeModal = ({ isOpen, onClose, event, onAttendeeAdded, isOnSpotDefault = false }) => {
  const [participantType, setParticipantType] = useState('student'); // 'student' | 'guest'
  const [coreForm, setCoreForm] = useState({
    full_name: '',
    student_id: '',
    email: '',
    phone: '',
    reference: '',
    avatar_url: '',
    category: 'Participant',
    isOnSpot: isOnSpotDefault
  });

  const [avatarPreview, setAvatarPreview] = useState('');
  const [customResponses, setCustomResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Extract dynamic form schema from event
  const schemaFields = event?.form_schema || [];

  useEffect(() => {
    if (isOpen) {
      setParticipantType('student');
      setCoreForm({
        full_name: '',
        student_id: '',
        email: '',
        phone: '',
        reference: '',
        avatar_url: '',
        category: 'Participant',
        isOnSpot: isOnSpotDefault
      });
      setAvatarPreview('');
      setCustomResponses({});
      setErrorMessage('');
      setSubmitting(false);
    }
  }, [isOpen, isOnSpotDefault]);

  if (!isOpen) return null;

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Profile image size must be less than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setCoreForm(prev => ({ ...prev, avatar_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setAvatarPreview('');
    setCoreForm(prev => ({ ...prev, avatar_url: '' }));
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
    setErrorMessage('');

    if (!coreForm.full_name.trim()) {
      setErrorMessage('Full Name is required.');
      return;
    }

    if (participantType === 'student' && !coreForm.student_id.trim()) {
      setErrorMessage('Student ID / Roll No is required for Students/Members.');
      return;
    }

    if (participantType === 'guest' && !coreForm.reference.trim()) {
      setErrorMessage('Reference Person / Host contact is required for Guests.');
      return;
    }

    let finalStudentId = coreForm.student_id.trim();
    if (!finalStudentId && participantType === 'guest') {
      finalStudentId = `GUEST-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    try {
      setSubmitting(true);

      const attendeePayload = {
        event_id: event.id,
        full_name: coreForm.full_name.trim(),
        student_id: finalStudentId,
        email: coreForm.email.trim() || null,
        phone: coreForm.phone.trim() || null,
        reference: coreForm.reference.trim() || null,
        avatar_url: coreForm.avatar_url.trim() || null,
        category: participantType === 'guest' ? 'Guest Visitor' : 'Participant',
        is_on_spot: isOnSpotDefault,
        custom_responses: Object.keys(customResponses).length > 0 ? customResponses : null
      };

      const { data, error } = await insertAttendee(attendeePayload);

      if (error) {
        setErrorMessage(error.message || 'Failed to register attendee.');
        setSubmitting(false);
      } else {
        setSubmitting(false);
        if (onAttendeeAdded) onAttendeeAdded(data);
        onClose();
      }
    } catch (err) {
      console.error('Registration error:', err);
      setErrorMessage(err.message || 'Unknown error occurred.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 font-sans italic">
      <form 
        onSubmit={handleSubmit}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 text-left max-h-[90vh] overflow-y-auto"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-purple-400">
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tight leading-none">
                {isOnSpotDefault ? 'On-Spot Gate Registration' : 'Add New Attendee'}
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-1">{event?.title}</p>
            </div>
          </div>

          <X className="text-slate-500 cursor-pointer hover:text-white transition-colors" onClick={onClose} />
        </div>

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl text-xs text-red-400 flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* PARTICIPANT TYPE SELECTOR */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Participant Type
          </label>

          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setParticipantType('student')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${participantType === 'student' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <UserCheck size={15} />
              <span>Student / Member</span>
            </button>

            <button
              type="button"
              onClick={() => setParticipantType('guest')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${participantType === 'guest' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <ShieldCheck size={15} />
              <span>Guest / Visitor</span>
            </button>
          </div>
        </div>

        {/* CORE DISTINCT FIELDS: NAME, STUDENT ID, EMAIL, PHONE, REFERENCE */}
        <div className="space-y-3.5 text-xs font-mono">
          <div>
            <label className="text-slate-300 font-bold uppercase tracking-wider block mb-1">
              Full Name *
            </label>
            <input 
              value={coreForm.full_name} 
              onChange={e => setCoreForm({ ...coreForm, full_name: e.target.value })} 
              placeholder="ENTER FULL NAME" 
              required 
              className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 p-3.5 rounded-xl text-xs font-bold text-white outline-none uppercase" 
            />
          </div>

          <div>
            <label className="text-slate-300 font-bold uppercase tracking-wider block mb-1">
              {participantType === 'student' ? 'Student ID / Roll No *' : 'Student ID / Guest Code (Optional)'}
            </label>
            <input 
              value={coreForm.student_id} 
              onChange={e => setCoreForm({ ...coreForm, student_id: e.target.value })} 
              placeholder={participantType === 'guest' ? 'AUTO (GUEST-XXXX)' : 'E.G. 2010000'} 
              required={participantType === 'student'} 
              className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 p-3.5 rounded-xl text-xs font-bold text-white outline-none font-mono" 
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-bold uppercase tracking-wider block mb-1">
                Email Address
              </label>
              <input 
                value={coreForm.email} 
                onChange={e => setCoreForm({ ...coreForm, email: e.target.value })} 
                placeholder="USER@EXAMPLE.COM" 
                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 p-3.5 rounded-xl text-xs font-bold text-white outline-none lowercase font-mono" 
              />
            </div>

            <div>
              <label className="text-slate-300 font-bold uppercase tracking-wider block mb-1">
                Phone Number
              </label>
              <input 
                value={coreForm.phone} 
                onChange={e => setCoreForm({ ...coreForm, phone: e.target.value })} 
                placeholder="01700000000" 
                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 p-3.5 rounded-xl text-xs font-bold text-white outline-none font-mono" 
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-bold uppercase tracking-wider block mb-1">
              {participantType === 'guest' ? 'Reference Person / Host *' : 'Reference Person / Host (Optional)'}
            </label>
            <input 
              value={coreForm.reference} 
              onChange={e => setCoreForm({ ...coreForm, reference: e.target.value })} 
              placeholder={participantType === 'guest' ? 'REQUIRED FOR GUESTS' : 'OPTIONAL HOST / REF'} 
              required={participantType === 'guest'} 
              className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 p-3.5 rounded-xl text-xs font-bold text-white outline-none uppercase" 
            />
          </div>

          {/* IMAGE UPLOADER */}
          <div className="space-y-1.5 pt-1">
            <label className="text-slate-300 font-bold uppercase tracking-wider block">
              Profile Photo (Optional)
            </label>

            {avatarPreview ? (
              <div className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                <img src={avatarPreview} alt="Preview" className="w-12 h-12 rounded-xl object-cover border border-slate-700" />
                <div className="flex-1 truncate">
                  <span className="text-xs font-bold text-white block">Photo Attached</span>
                  <span className="text-[10px] text-emerald-400">Ready for Pass & Certificate</span>
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
              <label className="flex flex-col items-center justify-center p-4 bg-slate-950 border border-dashed border-slate-800 hover:border-purple-500/50 rounded-2xl cursor-pointer transition-all group">
                <Upload size={20} className="text-slate-500 group-hover:text-purple-400 transition-colors mb-1" />
                <span className="text-xs font-bold text-slate-300">Click to Upload Photo</span>
                <span className="text-[10px] text-slate-500 mt-0.5">JPG, PNG or WEBP (Max 5MB)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* DYNAMIC ADDITIONAL QUESTIONS FROM FORM SCHEMA */}
          {schemaFields.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <span className="text-xs font-black text-purple-400 uppercase tracking-widest block">
                Additional Event Questions ({schemaFields.length})
              </span>

              {schemaFields.map((field, fieldIdx) => {
                const fieldKey = field.id || field.name || field.label || `custom_${fieldIdx}`;
                const lowerKey = (field.name || field.label || '').toLowerCase();

                if (lowerKey.includes('full_name') || lowerKey.includes('student_id') || lowerKey.includes('email') || lowerKey.includes('phone') || lowerKey.includes('reference') || lowerKey.includes('roll')) {
                  return null;
                }

                return (
                  <div key={fieldKey} className="space-y-1">
                    <label className="text-slate-300 font-medium text-[11px] block">
                      {field.label || field.name} {field.required && <span className="text-red-400">*</span>}
                    </label>

                    {field.type === 'select' ? (
                      <select
                        value={customResponses[fieldKey] || ''}
                        onChange={e => setCustomResponses(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                        required={field.required}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 p-3 rounded-xl text-xs text-white outline-none"
                      >
                        <option value="">Select Option...</option>
                        {(field.options || []).map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'radio' ? (
                      <div className="space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
                        {(field.options || []).map(opt => (
                          <label key={opt} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="radio"
                              name={`radio_field_${fieldKey}`}
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
                      <div className="space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
                        {(field.options || []).map(opt => {
                          const selectedList = Array.isArray(customResponses[fieldKey]) ? customResponses[fieldKey] : [];
                          const isChecked = selectedList.includes(opt);
                          return (
                            <label key={opt} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
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
                        onChange={e => setCustomResponses(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                        placeholder={field.placeholder || ''}
                        required={field.required}
                        rows={2}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 p-3 rounded-xl text-xs text-white outline-none resize-none"
                      />
                    ) : (
                      <input
                        type={field.type || 'text'}
                        value={customResponses[fieldKey] || ''}
                        onChange={e => setCustomResponses(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                        placeholder={field.placeholder || ''}
                        required={field.required}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 p-3 rounded-xl text-xs text-white outline-none"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ON-SPOT REGISTRATION STATUS FLAG (CONTROLLED & DISABLED BY CONTEXT) */}
          <div className="pt-2">
            <label className="flex items-center gap-3 p-3.5 bg-slate-950 border border-slate-800 rounded-2xl cursor-not-allowed opacity-80">
              <input
                type="checkbox"
                checked={isOnSpotDefault}
                disabled
                className="w-4 h-4 accent-purple-500 rounded cursor-not-allowed"
              />
              <div>
                <span className="text-xs font-bold text-white block">
                  {isOnSpotDefault ? 'On-Spot Gate Registration Active' : 'Pre-Registration Entry Mode'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {isOnSpotDefault ? 'Automatically marked as On-Spot registration via Gate Control portal' : 'Added via Attendee Portal pre-registration list'}
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-3 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-all"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-xl shadow-purple-600/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {submitting ? 'Registering...' : (isOnSpotDefault ? 'REGISTER ON-SPOT' : 'ADD ATTENDEE')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddAttendeeModal;
