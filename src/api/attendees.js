import { supabase } from './client';

/**
 * Attendee Management Service
 */
export const attendeeService = {
  /**
   * Fetch all registered attendees for an event
   */
  fetchEventAttendees: async (eventId) => {
    return supabase
      .from('attendees')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });
  },

  /**
   * Search attendee by Student ID or Email
   */
  searchAttendee: async (eventId, query) => {
    return supabase
      .from('attendees')
      .select('*')
      .eq('event_id', eventId)
      .or(`student_id.eq.${query},email.eq.${query}`)
      .maybeSingle();
  },

  /**
   * Update specific gate status field (checked_in_1, checked_in_2, token_given)
   */
  updateAttendeeStatus: async (id, field, value) => {
    return supabase.from('attendees').update({ [field]: value }).eq('id', id);
  },

  /**
   * Insert a single attendee
   */
  insertAttendee: async (attendeeData) => {
    return supabase.from('attendees').insert(attendeeData).select();
  },

  /**
   * Bulk insert attendees from CSV import
   */
  bulkInsertAttendees: async (attendeesData) => {
    return supabase.from('attendees').insert(attendeesData);
  },

  /**
   * Update attendee details
   */
  updateAttendee: async (id, updates) => {
    return supabase.from('attendees').update(updates).eq('id', id);
  },

  /**
   * Delete attendee and associated entry logs
   */
  deleteAttendee: async (id) => {
    await supabase.from('entry_logs').delete().eq('attendee_id', id);
    return supabase.from('attendees').delete().eq('id', id);
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
    return supabase.from('entry_logs').insert(logData);
  },

  /**
   * Fetch entry logs for an event with joined attendee info
   */
  fetchEventLogs: async (eventId, limit = 1000) => {
    return supabase
      .from('entry_logs')
      .select(`
        *,
        attendee:attendees (full_name, student_id)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .limit(limit);
  },

  /**
   * Fetch log history for specific attendee
   */
  fetchAttendeeLogs: async (attendeeId) => {
    return supabase
      .from('entry_logs')
      .select('*')
      .eq('attendee_id', attendeeId)
      .order('created_at', { ascending: false });
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
