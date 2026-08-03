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

import { getValidIrasToken, irasFetch } from './iras';

/**
 * Fetches student details from official Student Info API.
 * Endpoint: https://irastools.pages.dev/api/student/${studentId}
 */
export const fetchStudentInfoFromExternalApi = async (studentId) => {
  // Obtain valid token (auto-login if token is missing or expired)
  const rawToken = await getValidIrasToken();
  const cleanToken = rawToken.replace(/^Bearer\s+/i, '').trim();

  const targetUrl = `https://irastools.pages.dev/api/student/${studentId}`;

  // Try clean raw token first, then Bearer token format
  const authHeaders = [
    cleanToken,
    `Bearer ${cleanToken}`
  ];

  let res = null;
  let lastErr = null;
  let responseData = null;

  for (const authValue of authHeaders) {
    try {
      res = await irasFetch(targetUrl, {
        headers: {
          'Authorization': authValue,
          'Content-Type': 'application/json'
        }
      });
      
      const json = await res.json().catch(() => null);

      if (res.ok && json && json.data) {
        responseData = json.data;
        break;
      }

      if (json && json.error) {
        lastErr = new Error(`Student API Error: ${json.error}`);
      } else if (res && !res.ok) {
        lastErr = new Error(`Student API error (Status ${res.status}).`);
      }
    } catch (e) {
      lastErr = e;
    }
  }

  if (!responseData) {
    throw lastErr || new Error(`Unable to fetch student info for ID ${studentId}.`);
  }

  const data = responseData;

  const deptInfo = [
    data.departmentName ? `Dept: ${data.departmentName}` : null,
    data.firstMajor ? `Major: ${data.firstMajor}` : null,
    data.bloodGroup ? `Blood: ${data.bloodGroup}` : null
  ].filter(Boolean).join(' | ');

  return {
    student_id: data.studentId || studentId,
    full_name: data.studentName || `Student (${studentId})`,
    email: data.email || `${studentId}@iub.edu.bd`,
    phone: data.cellPhone || '',
    additional_info: deptInfo
  };
};
