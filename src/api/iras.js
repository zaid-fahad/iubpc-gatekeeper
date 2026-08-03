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
 * Resilient fetch wrapper that tries local Vite proxy first, direct URL, and CORS proxy fallbacks.
 */
export const irasFetch = async (targetUrl, options = {}) => {
  const proxyUrl = targetUrl
    .replace('https://iras-auth.pages.dev/api', '/api/iras-auth')
    .replace('https://irastools.pages.dev/api', '/api/iras-student');

  const strategies = [
    proxyUrl,
    targetUrl,
    `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`
  ];

  let lastError = null;
  for (const url of strategies) {
    try {
      const res = await fetch(url, options);
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        return res;
      }
    } catch (err) {
      console.warn(`CORS strategy failed for ${url}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error(`CORS or connection error trying to reach ${targetUrl}`);
};

/**
 * Authenticate against IRAS Login API (https://iras-auth.pages.dev/api/login)
 */
export const loginToIras = async (studentId, password) => {
  const targetUrl = 'https://iras-auth.pages.dev/api/login';

  const res = await irasFetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ studentId, password })
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`IRAS Auth failed (${res.status}): ${errText || res.statusText}`);
  }

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }

  // Robustly extract token across array, object, or string schemas
  let token = null;
  let expiresAt = Date.now() + (24 * 60 * 60 * 1000); // Default 24h

  if (typeof data === 'string') {
    token = data;
  } else if (data && typeof data === 'object') {
    // Handle response format: { data: [{ access_token: "...", expires: "..." }], message: "Success" }
    const item = Array.isArray(data) 
      ? data[0] 
      : (Array.isArray(data.data) ? data.data[0] : data.data || data);

    token = item?.access_token || item?.token || item?.accessToken || item?.idToken || item?.auth_token || (typeof item === 'string' ? item : null);

    if (item?.expires) {
      const parsedTime = new Date(item.expires).getTime();
      if (!isNaN(parsedTime)) expiresAt = parsedTime;
    } else if (item?.expires_in || item?.expiresIn) {
      expiresAt = Date.now() + ((item.expires_in || item.expiresIn) * 1000);
    }
  }
  
  if (!token || typeof token !== 'string') {
    console.error("Unrecognized IRAS Login payload:", data);
    throw new Error('Could not extract access_token from IRAS Login response.');
  }

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
