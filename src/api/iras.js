const IRAS_CONFIG_KEY = 'iubpc_iras_config';
const IRAS_TOKEN_KEY = 'iubpc_iras_token';

/**
 * Get stored IRAS credentials
 */
export const getIrasConfig = () => {
  try {
    const raw = localStorage.getItem(IRAS_CONFIG_KEY);
    return raw ? JSON.parse(raw) : { studentId: '', password: '' };
  } catch (e) {
    return { studentId: '', password: '' };
  }
};

/**
 * Save IRAS credentials
 */
export const saveIrasConfig = (studentId, password) => {
  localStorage.setItem(IRAS_CONFIG_KEY, JSON.stringify({ studentId, password }));
  // Clear cached token when credentials are updated
  localStorage.removeItem(IRAS_TOKEN_KEY);
};

/**
 * Get cached IRAS token info
 */
export const getCachedIrasTokenInfo = () => {
  try {
    const raw = localStorage.getItem(IRAS_TOKEN_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

/**
 * Get cached IRAS token string if valid
 */
export const getCachedIrasToken = () => {
  const info = getCachedIrasTokenInfo();
  if (!info) return null;
  // Check token expiration with a 60-second buffer
  if (info.token && info.expiresAt && Date.now() < info.expiresAt - 60000) {
    return info.token;
  }
  return null;
};

/**
 * Authenticate against IRAS Login API (https://irastools.pages.dev/api/login)
 */
export const loginToIras = async (studentId, password) => {
  const res = await fetch('https://irastools.pages.dev/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ studentId, password })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`IRAS Auth failed (${res.status}): ${errText || res.statusText}`);
  }

  const data = await res.json();
  const token = data.access_token || data.token || data.data?.access_token || data.data?.token || (typeof data === 'string' ? data : null);
  
  if (!token) {
    throw new Error('No valid token returned from IRAS Login API.');
  }

  // Calculate expiration (default to 24 hours if not provided)
  const expiresInMs = (data.expires_in || 86400) * 1000;
  const expiresAt = Date.now() + expiresInMs;

  const tokenData = { token, expiresAt, savedAt: Date.now() };
  localStorage.setItem(IRAS_TOKEN_KEY, JSON.stringify(tokenData));

  return tokenData;
};

/**
 * Get valid IRAS Auth Token (returns cached token or auto-authenticates if expired)
 */
export const getValidIrasToken = async () => {
  const cached = getCachedIrasToken();
  if (cached) return cached;

  const { studentId, password } = getIrasConfig();
  if (!studentId || !password) {
    throw new Error('IRAS API Credentials not configured. Please configure in Settings -> IRAS API.');
  }

  const tokenData = await loginToIras(studentId, password);
  return tokenData.token;
};
