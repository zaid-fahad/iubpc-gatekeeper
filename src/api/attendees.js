import { supabase } from '../lib/supabase';

export const fetchEventAttendees = async (eventId) => {
  return supabase.from('attendees').select('*').eq('event_id', eventId).order('created_at', { ascending: false });
};

export const searchAttendee = async (eventId, query) => {
  return supabase.from('attendees').select('*').eq('event_id', eventId).or(`student_id.eq.${query},email.eq.${query}`).maybeSingle();
};

export const updateAttendeeStatus = async (id, field, value) => {
  return supabase.from('attendees').update({ [field]: value }).eq('id', id);
};

export const insertEntryLog = async (logData) => {
  return supabase.from('entry_logs').insert(logData);
};

export const fetchEventLogs = async (eventId, limit = 1000) => {
  return supabase
    .from('entry_logs')
    .select(`
      *,
      attendee:attendees (full_name, student_id)
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .limit(limit);
};

export const fetchAttendeeLogs = async (attendeeId) => {
  return supabase
    .from('entry_logs')
    .select('*')
    .eq('attendee_id', attendeeId)
    .order('created_at', { ascending: false });
};

export const insertAttendee = async (attendeeData) => {
  return supabase.from('attendees').insert(attendeeData);
};

export const bulkInsertAttendees = async (attendeesData) => {
  return supabase.from('attendees').insert(attendeesData);
};
