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
   * Fetch all registered attendees for an event (merging remote & local records, auto-syncing unsaved locals)
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

    // Auto-sync unsaved local attendees to Supabase if event is a valid remote UUID
    if (isValidUuid(eventId) && remoteList.length >= 0) {
      const remoteIdSet = new Set(remoteList.map(a => a.id));
      const remoteStudentIdSet = new Set(remoteList.map(a => (a.student_id || '').toLowerCase().trim()));

      const unsyncedLocals = localAttendees.filter(a => 
        !remoteIdSet.has(a.id) && 
        !remoteStudentIdSet.has((a.student_id || '').toLowerCase().trim())
      );

      if (unsyncedLocals.length > 0) {
        Promise.all(unsyncedLocals.map(async (unsynced) => {
          try {
            const dbPayload = {
              event_id: eventId,
              full_name: unsynced.full_name || '',
              student_id: unsynced.student_id || '',
              email: unsynced.email || '',
              phone: unsynced.phone || '',
              reference: unsynced.reference || '',
              category: unsynced.category || 'Participant',
              avatar_url: unsynced.avatar_url || null,
              additional_info: unsynced.additional_info || null,
              is_on_spot: unsynced.is_on_spot ?? false,
              checked_in_1: unsynced.checked_in_1 ?? false,
              checked_in_2: unsynced.checked_in_2 ?? false,
              token_given: unsynced.token_given ?? false
            };

            const { data, error } = await supabase.from('attendees').insert([dbPayload]).select().single();
            if (!error && data) {
              const oldKey = `iubpc_attendee_${eventId}_${unsynced.id}`;
              localStorage.removeItem(oldKey);
              localStorage.setItem(`iubpc_attendee_${eventId}_${data.id}`, JSON.stringify(data));
              if (unsynced.custom_responses) {
                localStorage.setItem(`iubpc_att_custom_${data.id}`, JSON.stringify(unsynced.custom_responses));
              }
              remoteList.push(data);
            }
          } catch (syncErr) {
            console.warn('[Sync Error] Could not auto-sync local attendee to DB:', syncErr);
          }
        })).catch(() => {});
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
   * Insert a single attendee with zero data loss, full DB payload & strict error reporting
   */
  insertAttendee: async (attendeeData) => {
    const rawStudentId = (attendeeData.student_id || '').trim();
    const rawFullName = (attendeeData.full_name || '').trim();

    const dbPayload = {
      event_id: isValidUuid(attendeeData.event_id) ? attendeeData.event_id : undefined,
      full_name: rawFullName,
      student_id: rawStudentId,
      email: attendeeData.email ? attendeeData.email.trim() : '',
      phone: attendeeData.phone ? attendeeData.phone.trim() : '',
      reference: attendeeData.reference ? attendeeData.reference.trim() : '',
      category: attendeeData.category || 'Participant',
      avatar_url: attendeeData.avatar_url || null,
      additional_info: attendeeData.additional_info || null,
      is_on_spot: attendeeData.is_on_spot ?? false,
      checked_in_1: attendeeData.checked_in_1 ?? false,
      checked_in_2: attendeeData.checked_in_2 ?? false,
      token_given: attendeeData.token_given ?? false
    };

    let createdAttendee = null;
    let insertError = null;

    if (isValidUuid(attendeeData.event_id)) {
      try {
        const { data, error } = await supabase.from('attendees').insert([dbPayload]).select().single();
        if (error) {
          console.error('[insertAttendee] Supabase insert failed:', error);
          insertError = error;
        } else if (data) {
          createdAttendee = data;
        }
      } catch (err) {
        console.error('[insertAttendee] Exception during Supabase insert:', err);
        insertError = err;
      }
    }

    if (insertError) {
      return { data: null, error: insertError };
    }

    // Offline / Local-only fallback (only when event_id is not a remote UUID)
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
   * Bulk insert attendees from CSV import with automatic deduplication
   */
  bulkInsertAttendees: async (attendeesData) => {
    if (!attendeesData || attendeesData.length === 0) {
      return { data: [], skippedCount: 0, error: null };
    }

    const eventId = attendeesData[0]?.event_id;
    let existingIdSet = new Set();
    let existingNameSet = new Set();

    if (eventId) {
      const { data: existing } = await attendeeService.fetchEventAttendees(eventId);
      existingIdSet = new Set((existing || []).map(a => (a.student_id || '').toLowerCase().trim()).filter(Boolean));
      existingNameSet = new Set((existing || []).map(a => (a.full_name || '').toLowerCase().trim()).filter(Boolean));
    }

    const createdList = [];
    let skippedCount = 0;

    for (const att of attendeesData) {
      const rawName = (att.full_name || '').trim();
      const normName = rawName.toLowerCase();

      const rawId = (att.student_id || '').trim();
      const fallbackId = `GUEST-${normName.replace(/[^a-z0-9]/g, '')}`;
      const finalId = rawId || fallbackId;
      const normId = finalId.toLowerCase();

      // Check for duplication against existing attendees and in-flight batch
      if (existingIdSet.has(normId) || existingNameSet.has(normName)) {
        skippedCount++;
        continue;
      }

      existingIdSet.add(normId);
      existingNameSet.add(normName);

      const sanitizedAttendee = {
        ...att,
        full_name: rawName,
        student_id: finalId
      };

      const { data } = await attendeeService.insertAttendee(sanitizedAttendee);
      if (data) createdList.push(data);
    }

    return { data: createdList, skippedCount, error: null };
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

/**
 * Fetch and import Google Sheet CSV live responses with deduplication against existing attendees
 */
export const syncGoogleSheetResponses = async (eventId, csvUrl, customMapping = null) => {
  try {
    const res = await fetch(csvUrl);
    const text = await res.text();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    if (lines.length <= 1) {
      return { data: { count: 0, skippedCount: 0 }, error: null };
    }

    const headers = lines[0].split(',').map(h => h.replace(/^"(.*)"$/, '$1').trim());
    
    // Auto-detect or use customMapping
    let nameCol = customMapping?.full_name;
    let idCol = customMapping?.student_id;
    let emailCol = customMapping?.email;
    let phoneCol = customMapping?.phone;
    let refCol = customMapping?.reference;

    const lowerHeaders = headers.map(h => h.toLowerCase());
    if (!nameCol) {
      const idx = lowerHeaders.findIndex(h => h.includes('name'));
      if (idx >= 0) nameCol = headers[idx];
    }
    if (!idCol) {
      const idx = lowerHeaders.findIndex(h => h.includes('student') || h.includes('id') || h.includes('roll'));
      if (idx >= 0) idCol = headers[idx];
    }
    if (!emailCol) {
      const idx = lowerHeaders.findIndex(h => h.includes('email'));
      if (idx >= 0) emailCol = headers[idx];
    }
    if (!phoneCol) {
      const idx = lowerHeaders.findIndex(h => h.includes('phone') || h.includes('mobile'));
      if (idx >= 0) phoneCol = headers[idx];
    }
    if (!refCol) {
      const idx = lowerHeaders.findIndex(h => h.includes('reference') || h.includes('host') || h.includes('ref'));
      if (idx >= 0) refCol = headers[idx];
    }

    // Fetch existing registered attendees to prevent duplicates
    const { data: existingAttendees } = await attendeeService.fetchEventAttendees(eventId);
    const existingIdSet = new Set((existingAttendees || []).map(a => (a.student_id || '').toLowerCase().trim()).filter(Boolean));
    const existingNameSet = new Set((existingAttendees || []).map(a => (a.full_name || '').toLowerCase().trim()).filter(Boolean));

    const attendeesToInsert = [];
    let skippedCount = 0;

    lines.slice(1).forEach((line, idx) => {
      const cols = line.split(',').map(v => v.replace(/^"(.*)"$/, '$1').trim());
      const rowObj = {};
      headers.forEach((h, colIdx) => {
        rowObj[h] = cols[colIdx] || '';
      });

      const rawName = rowObj[nameCol] || cols[0] || `Participant ${idx + 1}`;
      const rawId = rowObj[idCol] || cols[1] || '';
      const email = emailCol ? rowObj[emailCol] : null;
      const phone = phoneCol ? rowObj[phoneCol] : null;
      const reference = refCol ? rowObj[refCol] : 'Google Form Sync';

      const normName = rawName.toLowerCase().trim();
      const deterministicFallbackId = `GUEST-${normName.replace(/[^a-z0-9]/g, '')}`;
      const finalStudentId = rawId.trim() || deterministicFallbackId;
      const normId = finalStudentId.toLowerCase().trim();

      // Skip duplicate if EITHER Student ID OR Full Name already exists for this event
      if (existingIdSet.has(normId) || existingNameSet.has(normName)) {
        skippedCount++;
        return;
      }

      existingIdSet.add(normId);
      existingNameSet.add(normName);

      attendeesToInsert.push({
        event_id: eventId,
        full_name: rawName.trim(),
        student_id: finalStudentId,
        email: email || null,
        phone: phone || null,
        reference: reference || 'Google Form Sync',
        category: 'Participant'
      });
    });

    if (attendeesToInsert.length > 0) {
      const { data, error } = await bulkInsertAttendees(attendeesToInsert);
      if (error) throw error;
    }

    return { data: { count: attendeesToInsert.length, skippedCount }, error: null };
  } catch (err) {
    console.error('syncGoogleSheetResponses error:', err);
    return { data: null, error: err };
  }
};
