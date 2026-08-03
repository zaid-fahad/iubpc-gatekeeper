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
  return supabase.from('attendees').insert(attendeeData).select();
};

export const bulkInsertAttendees = async (attendeesData) => {
  return supabase.from('attendees').insert(attendeesData);
};

import { getValidIrasToken } from './iras';

/**
 * Fetches student details from official Student Info API.
 * Endpoint: https://irastools.pages.dev/api/student/${studentId}
 */
export const fetchStudentInfoFromExternalApi = async (studentId) => {
  // Obtain valid token (auto-login if token is missing or expired)
  const token = await getValidIrasToken();

  const res = await fetch(`https://irastools.pages.dev/api/student/${studentId}`, {
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error(`IRAS API Authentication Failed (401). Please check credentials in Settings.`);
    } else if (res.status === 404) {
      throw new Error(`Student ID ${studentId} not found in IRAS database (404).`);
    } else {
      throw new Error(`Student API error (HTTP Status ${res.status}).`);
    }
  }

  const json = await res.json();
  const data = json?.data;
  
  if (!data || !data.studentName) {
    throw new Error(`Student record not found for ID ${studentId}.`);
  }

  const deptInfo = [
    data.departmentName ? `Dept: ${data.departmentName}` : null,
    data.firstMajor ? `Major: ${data.firstMajor}` : null,
    data.bloodGroup ? `Blood: ${data.bloodGroup}` : null
  ].filter(Boolean).join(' | ');

  return {
    student_id: data.studentId || studentId,
    full_name: data.studentName,
    email: data.email || `${studentId}@iub.edu.bd`,
    phone: data.cellPhone || '',
    additional_info: deptInfo
  };
};
