import { supabase } from '../lib/supabase';

/**
 * Standard API Response Wrapper
 * Ensures consistent handling of Supabase responses across all services
 */
export const handleApiResponse = async (apiCall) => {
  try {
    const { data, error } = await apiCall();
    if (error) {
      console.error('[API Error]:', error.message || error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('[API Exception]:', err);
    return { data: null, error: err };
  }
};

export { supabase };
