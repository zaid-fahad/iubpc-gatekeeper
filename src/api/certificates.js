import { supabase } from './client';

/**
 * Certificate Management & Verification Service
 * Supports Supabase database with persistent LocalStorage schema caching to suppress 404 console errors
 */
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
    // If schema was previously detected as missing, read directly from localStorage without making network calls
    if (isTemplateTableMissing) {
      const local = localStorage.getItem(`iubpc_cert_tmpl_${eventId}`);
      return { data: local ? JSON.parse(local) : null, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('certificate_templates')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle();

      if (error) {
        markTemplateMissing();
        const local = localStorage.getItem(`iubpc_cert_tmpl_${eventId}`);
        return { data: local ? JSON.parse(local) : null, error: null };
      }

      if (!data) {
        const local = localStorage.getItem(`iubpc_cert_tmpl_${eventId}`);
        if (local) return { data: JSON.parse(local), error: null };
      }

      return { data, error: null };
    } catch (err) {
      markTemplateMissing();
      const local = localStorage.getItem(`iubpc_cert_tmpl_${eventId}`);
      return { data: local ? JSON.parse(local) : null, error: null };
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

    if (isTemplateTableMissing) {
      return { 
        data: { id: id || `local_${event_id}`, event_id, ...payload }, 
        error: null 
      };
    }

    try {
      // Check if template exists for this event in Supabase
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

      if (targetId) {
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
  getOrCreateCertificate: async (eventId, attendeeId, templateId = null) => {
    const localCertKey = `iubpc_cert_${eventId}_${attendeeId}`;
    const localCert = localStorage.getItem(localCertKey);
    if (localCert) {
      return JSON.parse(localCert);
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
      status: 'issued'
    };

    localStorage.setItem(localCertKey, JSON.stringify(newCertData));

    if (!isCertificatesTableMissing) {
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
          .insert([newCertData])
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
  bulkGetOrCreateCertificates: async (eventId, attendeeIds, templateId = null) => {
    const certs = [];
    for (const attendeeId of attendeeIds) {
      try {
        const cert = await certificateService.getOrCreateCertificate(eventId, attendeeId, templateId);
        certs.push(cert);
      } catch (err) {
        console.error(`Failed to issue cert for attendee ${attendeeId}:`, err);
      }
    }
    return certs;
  },

  /**
   * Public Verification Lookup by Certificate Number
   */
  verifyCertificate: async (certNumber) => {
    const searchCertNum = certNumber.trim().toUpperCase();

    if (!isCertificatesTableMissing) {
      try {
        const { data, error } = await supabase
          .from('certificates')
          .select(`
            *,
            attendee:attendees (full_name, student_id, email, category),
            event:events (title, date)
          `)
          .eq('certificate_number', searchCertNum)
          .maybeSingle();

        if (!error && data) return { data, error: null };
      } catch (err) {
        markCertificatesMissing();
      }
    }

    // Search local storage fallback keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('iubpc_cert_')) {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          if (item?.certificate_number === searchCertNum) {
            return { data: item, error: null };
          }
        } catch {}
      }
    }

    return { data: null, error: 'Certificate verification record not found.' };
  },

  /**
   * Fetch all certificates for an event
   */
  fetchCertificatesByEvent: async (eventId) => {
    if (isCertificatesTableMissing) return { data: [], error: null };
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
