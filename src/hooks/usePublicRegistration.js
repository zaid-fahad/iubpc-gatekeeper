import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { fetchEventById } from '../api/events';
import { insertAttendee } from '../api/attendees';

/**
 * Deep domain hook for managing public event registration state and submission logic.
 */
export function usePublicRegistration(eventId) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eventObj, setEventObj] = useState(null);
  const [formError, setFormError] = useState('');
  const [participantType, setParticipantType] = useState('student');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [submittedAttendee, setSubmittedAttendee] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [answers, setAnswers] = useState({});
  const [formData, setFormData] = useState({
    fullName: '',
    studentId: '',
    email: '',
    phone: '',
    department: '',
    batch: '',
    guestReference: '',
    guestOrganization: ''
  });

  useEffect(() => {
    let mounted = true;
    async function loadEvent() {
      if (!eventId) {
        setLoading(false);
        return;
      }
      try {
        const data = await fetchEventById(eventId);
        if (mounted) setEventObj(data);
      } catch (err) {
        console.error('Failed to load event:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadEvent();
    return () => { mounted = false; };
  }, [eventId]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAnswerChange = (questionLabel, value) => {
    setAnswers(prev => ({ ...prev, [questionLabel]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Photo size must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
      setPhotoBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const submitRegistration = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setFormError('');
    if (!formData.fullName.trim()) {
      setFormError('Please enter your full name');
      return false;
    }

    let finalId = formData.studentId.trim();
    if (participantType === 'guest') {
      const rand = Math.floor(1000 + Math.random() * 9000);
      finalId = `GUEST-${rand}`;
    } else if (!finalId) {
      setFormError('Student ID is required for student registration');
      return false;
    }

    setSubmitting(true);
    try {
      const payload = {
        event_id: eventId,
        full_name: formData.fullName.trim(),
        student_id: finalId,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        department: formData.department.trim() || null,
        batch: formData.batch.trim() || null,
        category: participantType === 'student' ? 'Student' : 'Guest',
        reference: participantType === 'guest' ? formData.guestReference.trim() : null,
        organization: participantType === 'guest' ? formData.guestOrganization.trim() : null,
        photo_url: photoBase64,
        custom_answers: answers,
        registration_date: new Date().toISOString()
      };

      const result = await insertAttendee(payload);
      const qrData = JSON.stringify({
        id: result?.id || finalId,
        student_id: finalId,
        event_id: eventId,
        name: formData.fullName
      });
      const qrUrl = await QRCode.toDataURL(qrData);

      setQrCodeUrl(qrUrl);
      setSubmittedAttendee(result || payload);
      return true;
    } catch (err) {
      console.error('Registration failed:', err);
      setFormError(err.message || 'Failed to submit registration. Please try again.');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
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
  };
}
