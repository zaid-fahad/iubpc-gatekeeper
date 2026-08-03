import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchEventById } from '../api/events';
import { fetchEventAttendees, updateAttendeeStatus, insertEntryLog, insertAttendee } from '../api/attendees';
import { getSession } from '../api/auth';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  CheckCircle2, XCircle, Calendar, Clock, 
  ArrowLeft, UserCheck, RefreshCw, IdCard, Delete, Keyboard, Smartphone, UserPlus, User, Users
} from 'lucide-react';

const SelfEntryKiosk = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentIdInput, setStudentIdInput] = useState('');
  const [activeAttendee, setActiveAttendee] = useState(null);
  const [resultStatus, setResultStatus] = useState(null); // 'success' | 'not_found' | 'already_checked_in'
  const [inputMode, setInputMode] = useState('keyboard'); // 'keyboard' | 'touch'
  const [allowOnSpot, setAllowOnSpot] = useState(true);
  const [showOnSpotForm, setShowOnSpotForm] = useState(false);
  const [onSpotTab, setOnSpotTab] = useState('student'); // 'student' | 'guest'
  const [onSpotData, setOnSpotData] = useState({ name: '', studentId: '', reference: '' });
  const [onSpotError, setOnSpotError] = useState('');
  const [submittingOnSpot, setSubmittingOnSpot] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [adminEmail, setAdminEmail] = useState('');
  const [processing, setProcessing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const inputRef = useRef(null);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Event and Attendees data
  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: eventData, error } = await fetchEventById(eventId);
    if (error || !eventData) {
      navigate('/events');
      return;
    }
    setEvent(eventData);

    const { data: { session } } = await getSession();
    if (session?.user?.email) setAdminEmail(session.user.email);

    const { data: attendeesData } = await fetchEventAttendees(eventId);
    setAttendees(attendeesData || []);
    setLoading(false);
  }, [eventId, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keep input auto-focused when in keyboard mode
  useEffect(() => {
    if (!loading && !activeAttendee && !resultStatus && inputMode === 'keyboard' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading, activeAttendee, resultStatus, inputMode]);

  // Reset Countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && (activeAttendee || resultStatus)) {
      resetKiosk();
    }
  }, [countdown, activeAttendee, resultStatus]);

  const resetKiosk = () => {
    setActiveAttendee(null);
    setResultStatus(null);
    setShowOnSpotForm(false);
    setOnSpotError('');
    setOnSpotData({ name: '', studentId: '', reference: '' });
    setStudentIdInput('');
    setCountdown(0);
    if (inputMode === 'keyboard' && inputRef.current) inputRef.current.focus();
  };

  const handleLookupAndCheckIn = async (e) => {
    if (e) e.preventDefault();
    const query = studentIdInput.trim();
    if (!query) return;

    setProcessing(true);

    const { data: freshAttendees } = await fetchEventAttendees(eventId);
    const list = freshAttendees || attendees;
    if (freshAttendees) setAttendees(freshAttendees);

    const found = list.find(a => 
      a.student_id?.toLowerCase() === query.toLowerCase() ||
      a.id === query ||
      a.email?.toLowerCase() === query.toLowerCase()
    );

    if (found) {
      setActiveAttendee(found);
      const wasAlreadyCheckedIn = found.checked_in_1;
      
      if (!wasAlreadyCheckedIn) {
        await updateAttendeeStatus(found.id, 'checked_in_1', true);
        await insertEntryLog({
          attendee_id: found.id,
          event_id: eventId,
          action_type: 'checked_in_1',
          status: true,
          admin_email: adminEmail || 'kiosk-terminal'
        });
        setResultStatus('success');
      } else {
        setResultStatus('already_checked_in');
      }

      setCountdown(5);
    } else {
      setActiveAttendee(null);
      setResultStatus('not_found');
      setOnSpotData(prev => ({ ...prev, studentId: query }));
      setCountdown(10); // Extra time to choose on-spot option
    }

    setProcessing(false);
  };

  // Handle On-Spot Registration Submission
  const handleOnSpotSubmit = async (e) => {
    e.preventDefault();
    setOnSpotError('');

    const name = onSpotData.name.trim();
    if (!name) {
      setOnSpotError('Please enter full name.');
      return;
    }

    let finalStudentId = '';
    let finalReference = null;

    if (onSpotTab === 'student') {
      finalStudentId = onSpotData.studentId.trim() || studentIdInput.trim();
      if (!finalStudentId) {
        setOnSpotError('Please enter Student ID.');
        return;
      }
    } else {
      finalReference = onSpotData.reference.trim();
      if (!finalReference) {
        setOnSpotError('Please enter reference person or host name.');
        return;
      }
      finalStudentId = `GUEST-${Date.now().toString().slice(-6)}`;
    }

    setSubmittingOnSpot(true);

    const { data, error } = await insertAttendee({
      event_id: eventId,
      full_name: name,
      student_id: finalStudentId,
      reference: finalReference,
      is_on_spot: true,
      checked_in_1: true
    });

    if (error || !data || !data[0]) {
      console.error("On-Spot Reg Error:", error);
      setOnSpotError('Registration failed. Please check with gate staff.');
      setSubmittingOnSpot(false);
      return;
    }

    const newMember = data[0];
    await insertEntryLog({
      attendee_id: newMember.id,
      event_id: eventId,
      action_type: 'checked_in_1',
      status: true,
      admin_email: adminEmail || 'kiosk-onspot'
    });

    setAttendees(prev => [newMember, ...prev]);
    setActiveAttendee(newMember);
    setResultStatus('success');
    setShowOnSpotForm(false);
    setCountdown(5);
    setSubmittingOnSpot(false);
  };

  // Touch Keypad press handler
  const handleKeypadPress = (val) => {
    if (val === 'backspace') {
      setStudentIdInput(prev => prev.slice(0, -1));
    } else if (val === 'clear') {
      setStudentIdInput('');
    } else {
      setStudentIdInput(prev => prev + val);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      {/* KIOSK TOP CONTROL BAR */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-4">
        <button 
          onClick={() => navigate(`/event/${eventId}/gate`)}
          className="px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all min-h-[44px]"
          title="Exit Kiosk Mode"
        >
          <ArrowLeft size={16} />
          <span>Exit Kiosk</span>
        </button>

        <div className="text-right font-mono text-xs">
          <div className="font-bold text-white flex items-center gap-1.5 justify-end text-sm">
            <Clock size={15} className="text-blue-500" />
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>
          <p className="text-slate-400">{currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
        </div>
      </header>

      {/* MAIN CONTAINER WITH CENTERED EVENT LOGO & NAME */}
      <main className="flex-1 flex flex-col items-center justify-center my-6">
        <div className="w-full max-w-xl space-y-6">
          
          {/* CENTERED EVENT LOGO & TITLE HEADER */}
          <div className="text-center space-y-3">
            <img 
              src="/transparent_logo.webp" 
              alt="IUBPC Logo" 
              className="w-20 h-20 object-contain mx-auto drop-shadow-lg" 
            />
            <div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {event?.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
                Self Check-In Portal &bull; IUBPC GateKeeper
              </p>
            </div>
          </div>

          {/* DEFAULT FORM STATE */}
          {!activeAttendee && resultStatus !== 'not_found' && (
            <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-5 shadow-xl text-center">
              
              {/* MODE SWITCHER: KEYBOARD VS TOUCH KEYPAD */}
              <div className="flex items-center justify-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={() => setInputMode('keyboard')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all min-h-[36px] ${inputMode === 'keyboard' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  <Keyboard size={14} />
                  <span>Keyboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('touch')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all min-h-[36px] ${inputMode === 'touch' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  <Smartphone size={14} />
                  <span>Touch Keypad</span>
                </button>
              </div>

              <p className="text-xs sm:text-sm text-slate-400">
                {inputMode === 'keyboard' ? 'Enter your Student ID below to complete your check-in.' : 'Tap your Student ID digits on the touch keypad below.'}
              </p>

              {/* INPUT DISPLAY */}
              <form onSubmit={handleLookupAndCheckIn} className="space-y-4">
                <div className="relative">
                  <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input
                    ref={inputRef}
                    type="text"
                    value={studentIdInput}
                    onChange={(e) => setStudentIdInput(e.target.value)}
                    placeholder="Enter Student ID (e.g. 2020101)..."
                    readOnly={inputMode === 'touch'}
                    disabled={processing}
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 p-4 pl-12 rounded-xl text-lg sm:text-xl font-mono text-white placeholder:text-slate-500 outline-none transition-colors min-h-[52px]"
                  />
                  {studentIdInput && (
                    <button
                      type="button"
                      onClick={() => setStudentIdInput('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* ON-SCREEN TOUCH KEYPAD (MODE: TOUCH) */}
                {inputMode === 'touch' && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'backspace'].map((key) => {
                        if (key === 'clear') {
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => handleKeypadPress('clear')}
                              className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-red-400 font-medium rounded-lg text-xs transition-all active:scale-95 min-h-[44px]"
                            >
                              Clear
                            </button>
                          );
                        }
                        if (key === 'backspace') {
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => handleKeypadPress('backspace')}
                              className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium rounded-lg text-xs transition-all active:scale-95 flex items-center justify-center min-h-[44px]"
                            >
                              <Delete size={16} />
                            </button>
                          );
                        }
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleKeypadPress(key)}
                            className="p-3.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white font-mono text-lg font-semibold rounded-lg transition-all active:scale-95 min-h-[44px]"
                          >
                            {key}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={processing || !studentIdInput.trim()}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
                >
                  {processing ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  <span>Check In Now</span>
                </button>
              </form>
            </div>
          )}

          {/* SUCCESSFUL / ALREADY CHECKED IN CONFIRMATION CARD */}
          {activeAttendee && (resultStatus === 'success' || resultStatus === 'already_checked_in') && (
            <div className="bg-slate-900 border border-green-500/30 p-6 sm:p-8 rounded-2xl space-y-5 shadow-xl text-center">
              <div className="relative inline-block mx-auto">
                <img 
                  src={activeAttendee.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeAttendee.full_name)}&background=0f172a&color=cbd5e1`} 
                  alt={activeAttendee.full_name}
                  className="w-24 h-24 rounded-2xl border-2 border-slate-700 object-cover mx-auto shadow-md"
                />
                <div className="absolute -bottom-1.5 -right-1.5 bg-green-500 text-slate-950 p-1.5 rounded-full border-2 border-slate-900 shadow-md">
                  <CheckCircle2 size={16} />
                </div>
              </div>

              <div className="space-y-1">
                <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide border ${resultStatus === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}>
                  {resultStatus === 'success' ? 'Check-In Confirmed' : 'Already Checked In'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{activeAttendee.full_name}</h2>
                <p className="text-sm font-mono text-green-400 font-medium flex items-center justify-center gap-1.5 pt-0.5">
                  <IdCard size={15} /> {activeAttendee.student_id?.startsWith('GUEST') ? 'Guest ID:' : 'Student ID:'} {activeAttendee.student_id}
                </p>
                {activeAttendee.reference && (
                  <p className="text-xs text-slate-400 font-medium">Ref: {activeAttendee.reference}</p>
                )}
              </div>

              {/* ATTENDEE BADGE DETAILS */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2.5 text-xs text-left">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Registration Type</span>
                  <span className={`font-medium px-2 py-0.5 rounded text-[11px] border ${activeAttendee.is_on_spot ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                    {activeAttendee.is_on_spot ? 'On-Spot Reg' : 'Pre-Registered'}
                  </span>
                </div>

                {activeAttendee.email && (
                  <div className="flex justify-between items-center border-t border-slate-800/80 pt-2">
                    <span className="text-slate-400">Email</span>
                    <span className="text-slate-200 font-mono truncate max-w-[200px]">{activeAttendee.email}</span>
                  </div>
                )}
              </div>

              {/* COUNTDOWN RESET PROGRESS BAR */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Resetting for next attendee...</span>
                  <span className="font-mono text-white font-semibold">{countdown}s</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="bg-green-500 h-full transition-all duration-1000 ease-linear"
                    style={{ width: `${(countdown / 5) * 100}%` }}
                  ></div>
                </div>
              </div>

              <button
                onClick={resetKiosk}
                className="w-full py-3 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-all min-h-[44px]"
              >
                Done (Check In Another Person)
              </button>
            </div>
          )}

          {/* NOT FOUND ERROR CARD & ON-SPOT REGISTRATION FORM */}
          {resultStatus === 'not_found' && (
            <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-5 shadow-xl text-center">
              {!showOnSpotForm ? (
                /* INITIAL NOT FOUND ALERT */
                <div className="space-y-5">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                    <XCircle size={40} />
                  </div>

                  <div className="space-y-1.5">
                    <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide bg-amber-500/10 border border-amber-500/30 text-amber-400">
                      ID Not Found
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">No Attendee Found</h2>
                    <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                      No record matching <span className="text-white font-mono font-bold">"{studentIdInput}"</span> was found.
                    </p>
                  </div>

                  {allowOnSpot && (
                    <div className="pt-3 border-t border-slate-800 space-y-3">
                      <p className="text-xs text-slate-300 font-medium">Not registered for this event yet?</p>
                      <button
                        type="button"
                        onClick={() => setShowOnSpotForm(true)}
                        className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-md min-h-[44px]"
                      >
                        <UserPlus size={16} />
                        <span>Register On-Spot Now</span>
                      </button>
                    </div>
                  )}

                  {/* COUNTDOWN RESET PROGRESS BAR */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Resetting...</span>
                      <span className="font-mono text-white font-semibold">{countdown}s</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className="bg-amber-500 h-full transition-all duration-1000 ease-linear"
                        style={{ width: `${(countdown / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <button
                    onClick={resetKiosk}
                    className="w-full py-3 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-all min-h-[44px]"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                /* ON-SPOT SELF REGISTRATION FORM (STUDENT & GUEST MODES) */
                <form onSubmit={handleOnSpotSubmit} className="space-y-4 text-left">
                  <div className="text-center space-y-1 pb-2 border-b border-slate-800">
                    <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
                      <UserPlus size={18} className="text-purple-400" />
                      On-Spot Self Registration
                    </h3>
                    <p className="text-xs text-slate-400">Select attendee type to register and check in</p>
                  </div>

                  {onSpotError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl font-medium text-center">
                      {onSpotError}
                    </div>
                  )}

                  {/* STUDENT VS GUEST TAB SWITCHER */}
                  <div className="flex items-center justify-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setOnSpotTab('student')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all min-h-[38px] ${onSpotTab === 'student' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    >
                      <User size={14} />
                      <span>Student</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOnSpotTab('guest')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all min-h-[38px] ${onSpotTab === 'guest' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    >
                      <Users size={14} />
                      <span>Guest / Visitor</span>
                    </button>
                  </div>

                  {/* STUDENT FORM FIELDS */}
                  {onSpotTab === 'student' ? (
                    <div className="space-y-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-300 font-medium">Student ID *</label>
                        <input
                          type="text"
                          value={onSpotData.studentId}
                          onChange={(e) => setOnSpotData(prev => ({ ...prev, studentId: e.target.value }))}
                          placeholder="e.g. 2020101"
                          required
                          className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 p-3 rounded-xl text-xs font-mono text-white placeholder:text-slate-600 outline-none min-h-[44px]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-slate-300 font-medium">Student Full Name *</label>
                        <input
                          type="text"
                          value={onSpotData.name}
                          onChange={(e) => setOnSpotData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter student full name..."
                          required
                          className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 p-3 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none min-h-[44px]"
                        />
                      </div>
                    </div>
                  ) : (
                    /* GUEST FORM FIELDS */
                    <div className="space-y-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-300 font-medium">Guest Full Name *</label>
                        <input
                          type="text"
                          value={onSpotData.name}
                          onChange={(e) => setOnSpotData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter guest full name..."
                          required
                          className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 p-3 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none min-h-[44px]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-slate-300 font-medium">Reference Person / Host *</label>
                        <input
                          type="text"
                          value={onSpotData.reference}
                          onChange={(e) => setOnSpotData(prev => ({ ...prev, reference: e.target.value }))}
                          placeholder="e.g. Dr. Rahman (Faculty Host)"
                          required
                          className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 p-3 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none min-h-[44px]"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowOnSpotForm(false)}
                      className="flex-1 py-3 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-all min-h-[44px]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingOnSpot}
                      className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-md min-h-[44px]"
                    >
                      {submittingOnSpot ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={15} />}
                      <span>Complete & Check In</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 pt-4 text-center text-xs text-slate-500 flex items-center justify-between">
        <span className="text-slate-400 font-medium">Self Check-In Kiosk</span>
        <span>IUBPC GateKeeper Terminal</span>
      </footer>
    </div>
  );
};

export default SelfEntryKiosk;
