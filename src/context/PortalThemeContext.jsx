import React, { createContext, useContext, useState, useEffect } from 'react';
import { getPortalSettings, savePortalSettings, applyPortalSettings } from '../utils/portalSettings';

const PortalThemeContext = createContext({
  settings: getPortalSettings(),
  isLightMode: false,
  updateSettings: () => {},
  resetSettings: () => {}
});

export function PortalThemeProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const initial = getPortalSettings();
    applyPortalSettings(initial);
    return initial;
  });

  const isLightMode = settings.themeMode === 'light';

  useEffect(() => {
    applyPortalSettings(settings);

    const handleSettingsChange = (e) => {
      const updated = e.detail || getPortalSettings();
      setSettings(updated);
      applyPortalSettings(updated);
    };

    window.addEventListener('portal_settings_changed', handleSettingsChange);
    return () => {
      window.removeEventListener('portal_settings_changed', handleSettingsChange);
    };
  }, [settings]);

  const updateSettings = (newSettings) => {
    const saved = savePortalSettings(newSettings);
    setSettings(saved);
    applyPortalSettings(saved);
  };

  const resetSettings = () => {
    const saved = savePortalSettings({});
    setSettings(saved);
    applyPortalSettings(saved);
  };

  return (
    <PortalThemeContext.Provider value={{ settings, isLightMode, updateSettings, resetSettings }}>
      {children}
    </PortalThemeContext.Provider>
  );
}

export function usePortalTheme() {
  const context = useContext(PortalThemeContext);
  if (!context) {
    throw new Error('usePortalTheme must be used within a PortalThemeProvider');
  }
  return context;
}
