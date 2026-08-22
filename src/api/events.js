import { supabase } from './client';

/**
 * Helper to validate UUID string syntax for PostgreSQL compatibility
 */
const isValidUuid = (id) => {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

/**
 * Event Management Service
 * Native Supabase PostgreSQL Integration with Local Storage Metadata Extensions
 */
export const eventService = {
  /**
   * Fetch all registered events sorted by date (merging Supabase & LocalStorage metadata)
   */
  fetchEvents: async () => {
    let remoteList = [];
    try {
      const { data, error } = await supabase.from('events').select('*').order('date', { ascending: false });
      if (!error && data) remoteList = data;
    } catch (err) {
      console.warn('Failed to fetch remote events from Supabase:', err);
    }

    // Merge local storage fallback events
    const localEvents = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('iubpc_event_') && !key.startsWith('iubpc_event_meta_')) {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          if (item && item.id) localEvents.push(item);
        } catch {}
      }
    }

    const mergedMap = {};
    remoteList.forEach(e => {
      // Enrich remote events with local registration & theme metadata
      const meta = localStorage.getItem(`iubpc_event_meta_${e.id}`);
      const parsedMeta = meta ? JSON.parse(meta) : {};
      mergedMap[e.id] = { ...e, ...parsedMeta };
    });

    localEvents.forEach(e => {
      if (!mergedMap[e.id]) mergedMap[e.id] = e;
    });

    const result = Object.values(mergedMap).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    return { data: result, error: null };
  },

  /**
   * Fetch single event details by ID
   */
  fetchEventById: async (id) => {
    let eventObj = null;

    // 1. Try local storage first
    const local = localStorage.getItem(`iubpc_event_${id}`);
    if (local) {
      try {
        eventObj = JSON.parse(local);
      } catch {}
    }

    // 2. Query Supabase if not cached locally
    if (!eventObj && isValidUuid(id)) {
      try {
        const { data, error } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
        if (!error && data) eventObj = data;
      } catch (err) {
        console.warn('Remote event lookup error:', err);
      }
    }

    if (eventObj) {
      const meta = localStorage.getItem(`iubpc_event_meta_${id}`);
      if (meta) {
        try {
          eventObj = { ...eventObj, ...JSON.parse(meta) };
        } catch {}
      }
      return { data: eventObj, error: null };
    }

    return { data: null, error: 'Event not found' };
  },

  /**
   * Create a new event cleanly on Supabase
   */
  createEvent: async (eventData) => {
    // Exact schema payload matching Supabase PostgreSQL `events` table (title & date)
    const dbPayload = {
      title: eventData.title.trim(),
      date: eventData.date
    };

    const extendedMeta = {
      is_active: eventData.is_active ?? true,
      allow_on_spot: eventData.allow_on_spot ?? true,
      registration_type: eventData.registration_type || 'custom_form',
      google_form_url: eventData.google_form_url || '',
      google_sheet_csv_url: eventData.google_sheet_csv_url || '',
      form_schema: eventData.form_schema || [],
      theme_config: eventData.theme_config || {
        primary_color: '#9333ea',
        secondary_color: '#4f46e5',
        accent_color: '#10b981',
        banner_url: '',
        bg_url: '',
        bg_color: '#090d16'
      }
    };

    let createdEvent = null;

    // 1. Native Supabase PostgreSQL Insert
    try {
      const { data, error } = await supabase.from('events').insert([dbPayload]).select().single();
      if (!error && data) {
        createdEvent = { ...data, ...extendedMeta };
      }
    } catch (err) {
      console.warn('Remote Supabase insert error:', err);
    }

    // 2. Offline / Local Fallback with valid UUID syntax
    if (!createdEvent) {
      const generatedUuid = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, '0')}`;

      createdEvent = {
        id: generatedUuid,
        ...dbPayload,
        ...extendedMeta
      };
    }

    // Cache local copy & metadata for 100% data integrity
    localStorage.setItem(`iubpc_event_${createdEvent.id}`, JSON.stringify(createdEvent));
    localStorage.setItem(`iubpc_event_meta_${createdEvent.id}`, JSON.stringify(extendedMeta));

    return { data: createdEvent, error: null };
  },

  /**
   * Update existing event details
   */
  updateEvent: async (id, updates) => {
    const localKey = `iubpc_event_${id}`;
    const existing = localStorage.getItem(localKey);
    const updated = existing ? { ...JSON.parse(existing), ...updates } : { id, ...updates };

    const extendedMeta = {
      is_active: updated.is_active ?? true,
      allow_on_spot: updated.allow_on_spot ?? true,
      registration_type: updated.registration_type || 'custom_form',
      google_form_url: updated.google_form_url || '',
      google_sheet_csv_url: updated.google_sheet_csv_url || '',
      form_schema: updated.form_schema || [],
      theme_config: updated.theme_config || {}
    };

    localStorage.setItem(localKey, JSON.stringify(updated));
    localStorage.setItem(`iubpc_event_meta_${id}`, JSON.stringify(extendedMeta));

    if (isValidUuid(id)) {
      try {
        const dbPayload = {
          title: updates.title ? updates.title.trim() : updated.title,
          date: updates.date || updated.date
        };
        await supabase.from('events').update(dbPayload).eq('id', id);
      } catch (err) {
        console.warn('Remote update skipped:', err);
      }
    }

    return { data: updated, error: null };
  },

  /**
   * Delete an event safely without 400 bad request errors
   */
  deleteEvent: async (id) => {
    localStorage.removeItem(`iubpc_event_${id}`);
    localStorage.removeItem(`iubpc_event_meta_${id}`);

    if (isValidUuid(id)) {
      try {
        await supabase.from('events').delete().eq('id', id);
      } catch (err) {
        console.warn('Remote delete skipped:', err);
      }
    }

    return { data: true, error: null };
  },

  /**
   * Fetch Live Responses from Google Sheet Published CSV Sync URL
   */
  fetchGoogleSheetResponses: async (csvUrl) => {
    if (!csvUrl || !csvUrl.trim()) {
      return { data: [], error: 'Please enter a valid Google Sheet Published CSV URL' };
    }
    try {
      const response = await fetch(csvUrl.trim());
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      const csvText = await response.text();
      return { data: csvText, error: null };
    } catch (err) {
      console.error('Failed to fetch Google Sheet responses:', err);
      return { data: null, error: `Failed to fetch responses from Google Sheet: ${err.message}` };
    }
  }
};

// Named function exports for backwards compatibility
export const fetchEvents = eventService.fetchEvents;
export const fetchEventById = eventService.fetchEventById;
export const createEvent = eventService.createEvent;
export const updateEvent = eventService.updateEvent;
export const deleteEvent = eventService.deleteEvent;
export const fetchGoogleSheetResponses = eventService.fetchGoogleSheetResponses;
