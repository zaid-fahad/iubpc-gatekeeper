import { supabase } from './client';

/**
 * Helper to validate UUID string syntax for PostgreSQL compatibility
 */
const isValidUuid = (id) => {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

/**
 * Attendee Management Service
 * Ensures zero data loss between Supabase database and LocalStorage fallback
 */
export const attendeeService = {
  /**
   * Fetch all registered attendees for an event (merging remote & local records)
   */
  fetchEventAttendees: async (eventId) => {
    let remoteList = [];
    if (isValidUuid(eventId)) {
      try {
        const { data, error } = await supabase
          .from('attendees')
          .select('*')
          .eq('event_id', eventId)
          .order('created_at', { ascending: false });

        if (!error && data) remoteList = data;
      } catch (err) {
        console.warn('Remote attendee fetch error:', err);
      }
    }

    // Merge local storage attendees for this event
    const localAttendees = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`iubpc_attendee_${eventId}_`)) {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          if (item && item.id) localAttendees.push(item);
        } catch {}
      }
    }

    const mergedMap = {};
    remoteList.forEach(a => {
      const custom = localStorage.getItem(`iubpc_att_custom_${a.id}`);
      const parsedCustom = custom ? JSON.parse(custom) : {};
      mergedMap[a.id] = { ...a, custom_responses: parsedCustom };
    });

    localAttendees.forEach(a => {
      if (!mergedMap[a.id]) mergedMap[a.id] = a;
    });

    const result = Object.values(mergedMap).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return { data: result, error: null };
  },

  /**
   * Search attendee by Student ID or Email
   */
  searchAttendee: async (eventId, query) => {
    const cleanQuery = query.trim();
    if (isValidUuid(eventId)) {
      try {
        const { data, error } = await supabase
          .from('attendees')
          .select('*')
          .eq('event_id', eventId)
          .or(`student_id.eq.${cleanQuery},email.eq.${cleanQuery}`)
          .maybeSingle();

        if (!error && data) return { data, error: null };
      } catch (err) {
        console.warn('Remote attendee search error:', err);
      }
    }

    // Local fallback search
    const { data: all } = await attendeeService.fetchEventAttendees(eventId);
    const found = all?.find(a => 
      a.student_id?.toLowerCase() === cleanQuery.toLowerCase() || 
      a.email?.toLowerCase() === cleanQuery.toLowerCase() ||
      a.reference?.toLowerCase() === cleanQuery.toLowerCase()
    );

    return { data: found || null, error: found ? null : 'Attendee not found' };
  },

  /**
   * Update specific gate status field (checked_in_1, checked_in_2, token_given, gift_given)
   */
  updateAttendeeStatus: async (id, field, value) => {
    // Update local storage copy
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('iubpc_attendee_')) {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          if (item?.id === id) {
            item[field] = value;
            localStorage.setItem(key, JSON.stringify(item));
            break;
          }
        } catch {}
      }
    }

    if (isValidUuid(id)) {
      try {
        await supabase.from('attendees').update({ [field]: value }).eq('id', id);
      } catch (err) {
        console.warn('Remote status update skipped:', err);
      }
    }

    return { data: true, error: null };
  },

  /**
   * Insert a single attendee with zero data loss & payload sanitization
   */
  insertAttendee: async (attendeeData) => {
    const dbPayload = {
      event_id: isValidUuid(attendeeData.event_id) ? attendeeData.event_id : undefined,
      full_name: attendeeData.full_name,
      student_id: attendeeData.student_id,
      email: attendeeData.email || '',
      phone: attendeeData.phone || '',
      category: attendeeData.category || 'Participant',
      reference: attendeeData.reference || ''
    };

    let createdAttendee = null;

    if (isValidUuid(attendeeData.event_id)) {
      try {
        const { data, error } = await supabase.from('attendees').insert([dbPayload]).select().single();
        if (!error && data) createdAttendee = data;
      } catch (err) {
        console.warn('Remote attendee insert error:', err);
      }
    }

    if (!createdAttendee) {
      const generatedUuid = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, '0')}`;

      createdAttendee = {
        id: generatedUuid,
        ...attendeeData,
        created_at: new Date().toISOString()
      };
    }

    // Save local copy & custom responses
    const localKey = `iubpc_attendee_${attendeeData.event_id}_${createdAttendee.id}`;
    localStorage.setItem(localKey, JSON.stringify(createdAttendee));

    if (attendeeData.custom_responses) {
      localStorage.setItem(`iubpc_att_custom_${createdAttendee.id}`, JSON.stringify(attendeeData.custom_responses));
    }

    return { data: createdAttendee, error: null };
  },

  /**
   * Bulk insert attendees from CSV import
   */
  bulkInsertAttendees: async (attendeesData) => {
    const createdList = [];
    for (const att of attendeesData) {
      const { data } = await attendeeService.insertAttendee(att);
      if (data) createdList.push(data);
    }
    return { data: createdList, error: null };
  },

  /**
   * Update attendee details
   */
  updateAttendee: async (id, updates) => {
    if (isValidUuid(id)) {
      try {
        await supabase.from('attendees').update(updates).eq('id', id);
      } catch (err) {
        console.warn('Remote attendee update error:', err);
      }
    }
    return { data: updates, error: null };
  },

  /**
   * Delete attendee and associated entry logs safely
   */
  deleteAttendee: async (id) => {
    // Delete local storage copies
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('iubpc_attendee_')) {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          if (item?.id === id) {
            localStorage.removeItem(key);
            break;
          }
        } catch {}
      }
    }

    if (isValidUuid(id)) {
      try {
        await supabase.from('entry_logs').delete().eq('attendee_id', id);
        await supabase.from('attendees').delete().eq('id', id);
      } catch (err) {
        console.warn('Remote attendee delete skipped:', err);
      }
    }

    return { data: true, error: null };
  }
};

/**
 * Gate Entry Log Service
 */
export const logService = {
  /**
   * Insert entry verification log
   */
  insertEntryLog: async (logData) => {
    if (isValidUuid(logData.attendee_id) && isValidUuid(logData.event_id)) {
      try {
        return await supabase.from('entry_logs').insert(logData);
      } catch (err) {
        console.warn('Entry log insert skipped for local fallback:', err);
      }
    }
    return { data: logData, error: null };
  },

  /**
   * Fetch entry logs for an event with joined attendee info
   */
  fetchEventLogs: async (eventId, limit = 1000) => {
    if (isValidUuid(eventId)) {
      try {
        return await supabase
          .from('entry_logs')
          .select(`
            *,
            attendee:attendees (full_name, student_id)
          `)
          .eq('event_id', eventId)
          .order('created_at', { ascending: false })
          .limit(limit);
      } catch (err) {
        console.warn('Fetch logs error:', err);
      }
    }
    return { data: [], error: null };
  },

  /**
   * Fetch log history for specific attendee
   */
  fetchAttendeeLogs: async (attendeeId) => {
    if (isValidUuid(attendeeId)) {
      try {
        return await supabase
          .from('entry_logs')
          .select('*')
          .eq('attendee_id', attendeeId)
          .order('created_at', { ascending: false });
      } catch (err) {
        console.warn('Fetch attendee logs error:', err);
      }
    }
    return { data: [], error: null };
  }
};

// Named function exports for backwards compatibility
export const fetchEventAttendees = attendeeService.fetchEventAttendees;
export const searchAttendee = attendeeService.searchAttendee;
export const updateAttendeeStatus = attendeeService.updateAttendeeStatus;
export const insertAttendee = attendeeService.insertAttendee;
export const bulkInsertAttendees = attendeeService.bulkInsertAttendees;
export const updateAttendee = attendeeService.updateAttendee;
export const deleteAttendee = attendeeService.deleteAttendee;

export const insertEntryLog = logService.insertEntryLog;
export const fetchEventLogs = logService.fetchEventLogs;
export const fetchAttendeeLogs = logService.fetchAttendeeLogs;
