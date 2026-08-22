import { useState, useEffect } from 'react';
import { fetchEventById, createEvent, updateEvent } from '../api/events';

/**
 * Domain hook for managing event creation & editing form state, theme configs, dynamic questions, and save actions.
 */
export function useEventForm(eventId, navigate) {
  const isEditing = Boolean(eventId);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [formError, setFormError] = useState('');

  const [eventData, setEventData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    is_active: true,
    allow_on_spot: true,
    registration_type: 'custom_form',
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

  useEffect(() => {
    if (!eventId) return;
    const loadEvent = async () => {
      try {
        setLoading(true);
        const { data } = await fetchEventById(eventId);
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
            form_schema: data.form_schema || [],
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
  }, [eventId]);

  const updateEventData = (field, value) => {
    setEventData(prev => ({ ...prev, [field]: value }));
  };

  const updateThemeConfig = (field, value) => {
    setEventData(prev => ({
      ...prev,
      theme_config: { ...prev.theme_config, [field]: value }
    }));
  };

  const updateFormSchema = (newSchema) => {
    setEventData(prev => ({ ...prev, form_schema: newSchema }));
  };

  const saveEvent = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setFormError('');
    if (!eventData.title.trim()) {
      setFormError('Please enter an event title');
      return false;
    }

    setSaving(true);
    try {
      const payload = {
        title: eventData.title.trim(),
        date: `${eventData.date} ${eventData.time}`,
        is_active: eventData.is_active,
        allow_on_spot: eventData.allow_on_spot,
        registration_type: eventData.registration_type,
        google_form_url: eventData.google_form_url.trim(),
        google_sheet_csv_url: eventData.google_sheet_csv_url.trim(),
        form_schema: eventData.form_schema,
        theme_config: eventData.theme_config
      };

      if (isEditing) {
        await updateEvent(eventId, payload);
      } else {
        await createEvent(payload);
      }

      if (navigate) navigate('/events');
      return true;
    } catch (err) {
      console.error('Failed to save event:', err);
      setFormError(err.message || 'Failed to save event');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    isEditing,
    loading,
    saving,
    eventData,
    formError,
    copiedLink,
    setCopiedLink,
    updateEventData,
    updateThemeConfig,
    updateFormSchema,
    saveEvent
  };
}
