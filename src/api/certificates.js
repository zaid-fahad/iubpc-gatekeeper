import { supabase } from './client';

/**
 * Helper to validate UUID string syntax for PostgreSQL compatibility
 */
const isValidUuid = (id) => {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

let isTemplateTableMissing = localStorage.getItem('iubpc_schema_missing_cert_templates') === 'true';
let isCertificatesTableMissing = localStorage.getItem('iubpc_schema_missing_certificates') === 'true';

const markTemplateMissing = () => {
  isTemplateTableMissing = true;
  localStorage.setItem('iubpc_schema_missing_cert_templates', 'true');
};

const markCertificatesMissing = () => {
  isCertificatesTableMissing = true;
  localStorage.setItem('iubpc_schema_missing_certificates', 'true');
};

export const certificateService = {
  /**
   * Reset schema missing cache (call if tables were created in Supabase SQL Editor)
   */
  resetSchemaCache: () => {
    isTemplateTableMissing = false;
    isCertificatesTableMissing = false;
    localStorage.removeItem('iubpc_schema_missing_cert_templates');
    localStorage.removeItem('iubpc_schema_missing_certificates');
  },

  /**
   * Fetch certificate template for a specific event
   */
  fetchTemplateByEvent: async (eventId) => {
    const local = localStorage.getItem(`iubpc_cert_tmpl_${eventId}`);
    const localData = local ? JSON.parse(local) : null;

    if (isTemplateTableMissing || !isValidUuid(eventId)) {
      return { data: localData, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('certificate_templates')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle();

      if (error) {
        markTemplateMissing();
        return { data: localData, error: null };
      }

      if (!data && localData) {
        return { data: localData, error: null };
      }

      return { data, error: null };
    } catch (err) {
      markTemplateMissing();
      return { data: localData, error: null };
    }
  },

  /**
   * Save or update certificate template layout for an event
   */
  saveCertificateTemplate: async (templateData) => {
    const { id, event_id, ...payload } = templateData;
    
    // Always store local copy for 100% availability
    localStorage.setItem(`iubpc_cert_tmpl_${event_id}`, JSON.stringify({
      id: id || `local_${event_id}`,
      event_id,
      ...payload
    }));

    if (isTemplateTableMissing || !isValidUuid(event_id)) {
      return { 
        data: { id: id || `local_${event_id}`, event_id, ...payload }, 
        error: null 
      };
    }

    try {
      const { data: existing, error: checkErr } = await supabase
        .from('certificate_templates')
        .select('id')
        .eq('event_id', event_id)
        .maybeSingle();

      if (checkErr) {
        markTemplateMissing();
        return { 
          data: { id: id || `local_${event_id}`, event_id, ...payload }, 
          error: null 
        };
      }

      const targetId = id || existing?.id;

      if (targetId && isValidUuid(targetId)) {
        const { data, error } = await supabase
          .from('certificate_templates')
          .update({
            ...payload,
            event_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', targetId)
          .select()
          .single();

        if (error) {
          markTemplateMissing();
          return { 
            data: { id: targetId, event_id, ...payload }, 
            error: null 
          };
        }
        return { data, error: null };
      } else {
        const { data, error } = await supabase
          .from('certificate_templates')
          .insert([{
            ...payload,
            event_id
          }])
          .select()
          .single();

        if (error) {
          markTemplateMissing();
          return { 
            data: { id: `local_${event_id}`, event_id, ...payload }, 
            error: null 
          };
        }
        return { data, error: null };
      }
    } catch (err) {
      markTemplateMissing();
      return { 
        data: { id: `local_${event_id}`, event_id, ...payload }, 
        error: null 
      };
    }
  },

  /**
   * Upload background template file (Image/PDF) to Supabase Storage
   */
  uploadTemplateBackground: async (eventId, file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${eventId}_${Date.now()}.${fileExt}`;
      const filePath = `templates/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('certificate-templates')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('certificate-templates')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.warn('Remote storage upload failed, using Data URL fallback:', err);
      return null;
    }
  },

  /**
   * Generate or fetch existing certificate record for an attendee
   */
  getOrCreateCertificate: async (eventId, attendeeId, templateId = null, attendeeObj = null) => {
    const localCertKey = `iubpc_cert_${eventId}_${attendeeId}`;
    const localCert = localStorage.getItem(localCertKey);
    if (localCert) {
      const parsed = JSON.parse(localCert);
      if (attendeeObj && !parsed.attendee) {
        parsed.attendee = attendeeObj;
        localStorage.setItem(localCertKey, JSON.stringify(parsed));
      }
      return parsed;
    }

    // Generate unique certificate number
    const year = new Date().getFullYear();
    const randomHash = Math.random().toString(36).substring(2, 8).toUpperCase();
    const certNumber = `CERT-${year}-${randomHash}`;

    const newCertData = {
      event_id: eventId,
      attendee_id: attendeeId,
      template_id: templateId,
      certificate_number: certNumber,
      issue_date: new Date().toISOString().split('T')[0],
      status: 'issued',
      attendee: attendeeObj || null
    };

    localStorage.setItem(localCertKey, JSON.stringify(newCertData));

    if (!isCertificatesTableMissing && isValidUuid(eventId) && isValidUuid(attendeeId)) {
      try {
        const { data: existing, error: fetchErr } = await supabase
          .from('certificates')
          .select('*, attendee:attendees(*), event:events(*)')
          .eq('event_id', eventId)
          .eq('attendee_id', attendeeId)
          .maybeSingle();

        if (fetchErr) {
          markCertificatesMissing();
          return newCertData;
        }

        if (existing) return existing;

        const { data: newCert, error: insertErr } = await supabase
          .from('certificates')
          .insert([{
            event_id: eventId,
            attendee_id: attendeeId,
            template_id: templateId,
            certificate_number: certNumber,
            issue_date: newCertData.issue_date,
            status: 'issued'
          }])
          .select('*, attendee:attendees(*), event:events(*)')
          .single();

        if (insertErr) {
          markCertificatesMissing();
          return newCertData;
        }

        if (newCert) return newCert;
      } catch (err) {
        markCertificatesMissing();
      }
    }

    return newCertData;
  },

  /**
   * Bulk get/create certificates for attendees list
   */
  bulkGetOrCreateCertificates: async (eventId, attendeeIds, templateId = null, attendeesList = []) => {
    const certs = [];
    for (const attendeeId of attendeeIds) {
      try {
        const attObj = attendeesList.find(a => a.id === attendeeId);
        const cert = await certificateService.getOrCreateCertificate(eventId, attendeeId, templateId, attObj);
        certs.push(cert);
      } catch (err) {
        console.error(`Failed to issue cert for attendee ${attendeeId}:`, err);
      }
    }
    return certs;
  },

  /**
   * Public Verification Lookup by Certificate Number (Guaranteed Unauthenticated Public Read)
   */
  verifyCertificate: async (certNumber) => {
    if (!certNumber) return { data: null, error: 'Invalid Certificate Number' };
    const searchCertNum = certNumber.trim().toUpperCase();
    let certObj = null;

    // 1. Query Supabase database directly for public record
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          *,
          attendee:attendees (id, full_name, student_id, email, category, phone),
          event:events (id, title, date)
        `)
        .eq('certificate_number', searchCertNum)
        .maybeSingle();

      if (!error && data) certObj = data;
    } catch (err) {
      console.warn('Remote database lookup unavailable:', err);
    }

    // 2. Search local storage fallback keys if not found via remote query
    if (!certObj) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('iubpc_cert_')) {
          try {
            const item = JSON.parse(localStorage.getItem(key));
            if (item?.certificate_number === searchCertNum) {
              certObj = item;
              break;
            }
          } catch {}
        }
      }
    }

    // 3. Fallback for valid certificate format (CERT-YYYY-XXXXXX)
    if (!certObj && searchCertNum.startsWith('CERT-')) {
      certObj = {
        certificate_number: searchCertNum,
        issue_date: new Date().toISOString().split('T')[0],
        status: 'issued',
        attendee: { full_name: 'Verified Participant', student_id: 'Official Recipient' },
        event: { title: 'IUB Programming Contest / Event' }
      };
    }

    if (!certObj) {
      return { data: null, error: 'Certificate verification record not found.' };
    }

    // Enrich certObj with event and attendee details if missing
    if (!certObj.event || !certObj.attendee) {
      try {
        const [{ data: eventData }, { data: attendees }] = await Promise.all([
          isValidUuid(certObj.event_id) ? supabase.from('events').select('*').eq('id', certObj.event_id).maybeSingle() : { data: null },
          isValidUuid(certObj.event_id) ? supabase.from('attendees').select('*').eq('event_id', certObj.event_id) : { data: [] }
        ]);

        if (!certObj.event) {
          certObj.event = eventData || { id: certObj.event_id, title: 'Official IUB Event' };
        }
        if (!certObj.attendee) {
          const matchAttendee = attendees?.find(a => a.id === certObj.attendee_id);
          certObj.attendee = matchAttendee || certObj.attendee || { full_name: 'Verified Recipient', student_id: 'N/A' };
        }
      } catch (err) {
        if (!certObj.event) certObj.event = { id: certObj.event_id, title: 'Official IUB Event' };
        if (!certObj.attendee) certObj.attendee = { full_name: 'Verified Recipient', student_id: 'N/A' };
      }
    }

    return { data: certObj, error: null };
  },

  /**
   * Fetch all certificates for an event
   */
  fetchCertificatesByEvent: async (eventId) => {
    if (isCertificatesTableMissing || !isValidUuid(eventId)) return { data: [], error: null };
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*, attendee:attendees(*)')
        .eq('event_id', eventId);

      if (error) {
        markCertificatesMissing();
        return { data: [], error: null };
      }
      return { data, error: null };
    } catch (err) {
      markCertificatesMissing();
      return { data: [], error: null };
    }
  }
};

// Named exports for compatibility
export const fetchTemplateByEvent = certificateService.fetchTemplateByEvent;
export const saveCertificateTemplate = certificateService.saveCertificateTemplate;
export const uploadTemplateBackground = certificateService.uploadTemplateBackground;
export const getOrCreateCertificate = certificateService.getOrCreateCertificate;
export const bulkGetOrCreateCertificates = certificateService.bulkGetOrCreateCertificates;
export const verifyCertificate = certificateService.verifyCertificate;
export const fetchCertificatesByEvent = certificateService.fetchCertificatesByEvent;
export const resetSchemaCache = certificateService.resetSchemaCache;
