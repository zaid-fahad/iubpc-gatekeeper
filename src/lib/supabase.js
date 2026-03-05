// --- Supabase Configuration ---
/**
 * Safely accessing environment variables.
 * In a Vite environment, these are populated at build time.
 */
const getEnv = (key) => {
  try {
    return import.meta.env[key] || "";
  } catch {
    return "";
  }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);

const IUB_DOMAIN = "@iub.edu.bd";