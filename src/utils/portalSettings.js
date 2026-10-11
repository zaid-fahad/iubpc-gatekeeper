const SETTINGS_KEY = 'gatekeeper_portal_settings';

export const DEFAULT_PORTAL_SETTINGS = {
  orgName: 'Independent University, Bangladesh (IUB)',
  portalTitle: 'IUBPC GateKeeper',
  logoUrl: '/transparent_logo.webp',
  themeMode: 'dark', // 'dark' | 'light'
  primaryColor: '#9333ea',
  secondaryColor: '#4f46e5',
  accentColor: '#10b981'
};

// HSL color utilities for taste-crafted palette generation
const hexToHsl = (hex = '#9333ea') => {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
      case gNorm: h = (bNorm - rNorm) / d + 2; break;
      case bNorm: h = (rNorm - gNorm) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const hslToHex = ({ h, s, l }) => {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n, k = (n + h / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  const toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
};

/**
 * Generate 2 distinct, human-crafted theme palettes (Dark & Light) from user brand colors
 */
export const generateThemePalettes = (userPrimary, userSecondary, userAccent) => {
  const p = hexToHsl(userPrimary || '#9333ea');
  const s = hexToHsl(userSecondary || '#4f46e5');
  const a = hexToHsl(userAccent || '#10b981');

  return {
    dark: {
      bgPrimary: '#090d16',
      bgSurface: '#0f172a',
      bgSurfaceHover: '#1e293b',
      borderColor: '#1e293b',
      textPrimary: '#f8fafc',
      textSecondary: '#cbd5e1',
      textMuted: '#64748b',
      brandPrimary: hslToHex({ h: p.h, s: Math.max(p.s, 65), l: Math.max(p.l, 55) }),
      brandSecondary: hslToHex({ h: s.h, s: Math.max(s.s, 65), l: Math.max(s.l, 55) }),
      brandAccent: hslToHex({ h: a.h, s: Math.max(a.s, 65), l: Math.max(a.l, 55) })
    },
    light: {
      bgPrimary: '#ffffff',
      bgSurface: '#ffffff',
      bgSurfaceHover: '#f8fafc',
      borderColor: '#e2e8f0',
      textPrimary: '#0f172a',
      textSecondary: '#334155',
      textMuted: '#64748b',
      brandPrimary: hslToHex({ h: p.h, s: Math.max(p.s, 60), l: Math.min(p.l, 40) }),
      brandSecondary: hslToHex({ h: s.h, s: Math.max(s.s, 60), l: Math.min(s.l, 38) }),
      brandAccent: hslToHex({ h: a.h, s: Math.max(a.s, 60), l: Math.min(a.l, 38) })
    }
  };
};

/**
 * Retrieve saved portal settings from localStorage
 */
export const getPortalSettings = () => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      return { ...DEFAULT_PORTAL_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Failed to parse portal settings from localStorage:', e);
  }
  return DEFAULT_PORTAL_SETTINGS;
};

/**
 * Save new portal settings to localStorage & apply theme
 */
export const savePortalSettings = (newSettings) => {
  try {
    const updated = { ...getPortalSettings(), ...newSettings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    applyPortalSettings(updated);
    window.dispatchEvent(new Event('portal_settings_changed'));
    return updated;
  } catch (e) {
    console.error('Failed to save portal settings:', e);
    return DEFAULT_PORTAL_SETTINGS;
  }
};

/**
 * Reset settings to system default
 */
export const resetPortalSettings = () => {
  try {
    localStorage.removeItem(SETTINGS_KEY);
    applyPortalSettings(DEFAULT_PORTAL_SETTINGS);
    window.dispatchEvent(new Event('portal_settings_changed'));
    return DEFAULT_PORTAL_SETTINGS;
  } catch (e) {
    console.error('Failed to reset portal settings:', e);
    return DEFAULT_PORTAL_SETTINGS;
  }
};

/**
 * Apply dynamic theme mode & colors to DOM root element
 */
export const applyPortalSettings = (settings = getPortalSettings()) => {
  const root = document.documentElement;
  const isLight = settings.themeMode === 'light';

  // Toggle theme mode class
  if (isLight) {
    root.classList.add('light-mode');
    root.classList.remove('dark');
  } else {
    root.classList.remove('light-mode');
    root.classList.add('dark');
  }

  // Generate palettes for light & dark mode
  const palettes = generateThemePalettes(settings.primaryColor, settings.secondaryColor, settings.accentColor);
  const activePalette = isLight ? palettes.light : palettes.dark;

  // Set computed CSS Variables on :root
  root.style.setProperty('--bg-primary', activePalette.bgPrimary);
  root.style.setProperty('--bg-surface', activePalette.bgSurface);
  root.style.setProperty('--bg-surface-hover', activePalette.bgSurfaceHover);
  root.style.setProperty('--border-color', activePalette.borderColor);
  root.style.setProperty('--text-primary', activePalette.textPrimary);
  root.style.setProperty('--text-secondary', activePalette.textSecondary);
  root.style.setProperty('--text-muted', activePalette.textMuted);
  root.style.setProperty('--primary-color', activePalette.brandPrimary);
  root.style.setProperty('--secondary-color', activePalette.brandSecondary);
  root.style.setProperty('--accent-color', activePalette.brandAccent);
};
