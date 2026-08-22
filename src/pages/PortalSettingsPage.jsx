import React, { useState, useEffect } from 'react';
import { 
  Settings, Building2, Image as ImageIcon, Palette, Moon, Sun, 
  Check, RefreshCw, CheckCircle2, AlertCircle, Shield, Sparkles, Layers
} from 'lucide-react';
import { 
  getPortalSettings, savePortalSettings, resetPortalSettings, applyPortalSettings, 
  generateThemePalettes, DEFAULT_PORTAL_SETTINGS 
} from '../utils/portalSettings';

const PortalSettingsPage = ({ userRole }) => {
  const [settings, setSettings] = useState(getPortalSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    // Apply settings on initial load
    applyPortalSettings(settings);
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    const updated = savePortalSettings(settings);
    setSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm('Reset all portal organization name, logo, colors, and theme to system defaults?')) {
      const reset = resetPortalSettings();
      setSettings(reset);
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  };

  // Generate live palettes based on user colors
  const livePalettes = generateThemePalettes(settings.primaryColor, settings.secondaryColor, settings.accentColor);

  return (
    <div className="space-y-8 text-left pb-24 font-sans animate-in fade-in duration-500 max-w-5xl mx-auto">
      {/* PAGE HEADER */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-400">
            <Settings size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase italic tracking-tight flex items-center gap-2">
              <span>Portal System Settings</span>
            </h1>
            <p className="text-xs text-slate-400">Customize organization name, logo branding, color palette, and dark/light appearance theme</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw size={15} />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-purple-600/20"
          >
            <Check size={16} />
            <span>Save Settings</span>
          </button>
        </div>
      </header>

      {/* FEEDBACK BADGES */}
      {savedSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-mono flex items-center gap-2 shadow-lg animate-in fade-in">
          <CheckCircle2 size={18} />
          <span>Portal settings & theme customizer changes saved successfully!</span>
        </div>
      )}

      {resetSuccess && (
        <div className="p-4 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-2xl text-xs font-mono flex items-center gap-2 shadow-lg animate-in fade-in">
          <RefreshCw size={18} />
          <span>Portal settings reset to system default branding and dark theme.</span>
        </div>
      )}

      {/* SECTION 1: ORGANIZATION & PORTAL BRANDING */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400">
            <Building2 size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white uppercase italic tracking-tight">1. Organization & Portal Identity</h3>
            <p className="text-xs text-slate-400">Configure institution organization name, portal header title, and custom logo image</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Organization / University Name *</label>
              <input
                type="text"
                value={settings.orgName}
                onChange={(e) => setSettings({ ...settings, orgName: e.target.value })}
                placeholder="e.g. Independent University, Bangladesh (IUB)"
                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-3.5 text-sm text-white font-bold outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Portal Header Title *</label>
              <input
                type="text"
                value={settings.portalTitle}
                onChange={(e) => setSettings({ ...settings, portalTitle: e.target.value })}
                placeholder="e.g. IUBPC GateKeeper"
                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-3.5 text-sm text-white font-bold outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Logo Image URL</label>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <input
                type="text"
                value={settings.logoUrl}
                onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                placeholder="/transparent_logo.webp or https://domain.com/logo.png"
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-3 text-xs text-white font-mono outline-none w-full"
              />

              <div className="flex items-center gap-3 p-2 bg-slate-950 border border-slate-800 rounded-xl shrink-0">
                <div className="w-9 h-9 flex items-center justify-center p-1 bg-slate-900 rounded-lg">
                  <img
                    src={settings.logoUrl || DEFAULT_PORTAL_SETTINGS.logoUrl}
                    alt="Logo Preview"
                    className="w-full h-full object-contain"
                    onError={(e) => { e.target.src = DEFAULT_PORTAL_SETTINGS.logoUrl; }}
                  />
                </div>
                <span className="text-[11px] font-mono text-slate-400 pr-2">Logo Preview</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: BRAND COLOR PALETTE */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-400">
            <Palette size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white uppercase italic tracking-tight">2. Brand Color Palette Customizer</h3>
            <p className="text-xs text-slate-400">Set primary accent colors, highlight glows, and success badge indicators</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Primary Color */}
          <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Primary Brand Accent</label>
            <div className="flex items-center gap-3 bg-slate-900 p-2.5 border border-slate-800 rounded-xl">
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => {
                  const updated = { ...settings, primaryColor: e.target.value };
                  setSettings(updated);
                  applyPortalSettings(updated);
                }}
                className="w-9 h-9 rounded-lg border-0 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={settings.primaryColor}
                onChange={(e) => {
                  const updated = { ...settings, primaryColor: e.target.value };
                  setSettings(updated);
                  applyPortalSettings(updated);
                }}
                className="bg-transparent text-xs text-white outline-none font-mono uppercase w-full font-bold"
              />
            </div>
            <div className="h-2 rounded-full" style={{ backgroundColor: settings.primaryColor }}></div>
          </div>

          {/* Secondary Color */}
          <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Secondary Brand Color</label>
            <div className="flex items-center gap-3 bg-slate-900 p-2.5 border border-slate-800 rounded-xl">
              <input
                type="color"
                value={settings.secondaryColor}
                onChange={(e) => {
                  const updated = { ...settings, secondaryColor: e.target.value };
                  setSettings(updated);
                  applyPortalSettings(updated);
                }}
                className="w-9 h-9 rounded-lg border-0 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={settings.secondaryColor}
                onChange={(e) => {
                  const updated = { ...settings, secondaryColor: e.target.value };
                  setSettings(updated);
                  applyPortalSettings(updated);
                }}
                className="bg-transparent text-xs text-white outline-none font-mono uppercase w-full font-bold"
              />
            </div>
            <div className="h-2 rounded-full" style={{ backgroundColor: settings.secondaryColor }}></div>
          </div>

          {/* Accent Color */}
          <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Success / Highlight Accent</label>
            <div className="flex items-center gap-3 bg-slate-900 p-2.5 border border-slate-800 rounded-xl">
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) => {
                  const updated = { ...settings, accentColor: e.target.value };
                  setSettings(updated);
                  applyPortalSettings(updated);
                }}
                className="w-9 h-9 rounded-lg border-0 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={settings.accentColor}
                onChange={(e) => {
                  const updated = { ...settings, accentColor: e.target.value };
                  setSettings(updated);
                  applyPortalSettings(updated);
                }}
                className="bg-transparent text-xs text-white outline-none font-mono uppercase w-full font-bold"
              />
            </div>
            <div className="h-2 rounded-full" style={{ backgroundColor: settings.accentColor }}></div>
          </div>
        </div>

        {/* GENERATED DUAL-THEME PALETTE PREVIEW CARD */}
        <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 font-mono text-xs">
          <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers size={16} className="text-purple-400" />
            <span>Generated Theme Palettes (Calculated for Light & Dark Mode)</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dark Mode Swatches */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span className="text-purple-400 font-bold block text-[11px]">Dark Mode Generated Shades</span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg border border-slate-700" style={{ backgroundColor: livePalettes.dark.brandPrimary }} title={`Primary: ${livePalettes.dark.brandPrimary}`}></div>
                <div className="w-6 h-6 rounded-lg border border-slate-700" style={{ backgroundColor: livePalettes.dark.brandSecondary }} title={`Secondary: ${livePalettes.dark.brandSecondary}`}></div>
                <div className="w-6 h-6 rounded-lg border border-slate-700" style={{ backgroundColor: livePalettes.dark.brandAccent }} title={`Accent: ${livePalettes.dark.brandAccent}`}></div>
                <span className="text-[10px] text-slate-400">High contrast glowing neon tones</span>
              </div>
            </div>

            {/* Light Mode Swatches */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span className="text-amber-400 font-bold block text-[11px]">Light Mode Generated Shades</span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg border border-slate-700" style={{ backgroundColor: livePalettes.light.brandPrimary }} title={`Primary: ${livePalettes.light.brandPrimary}`}></div>
                <div className="w-6 h-6 rounded-lg border border-slate-700" style={{ backgroundColor: livePalettes.light.brandSecondary }} title={`Secondary: ${livePalettes.light.brandSecondary}`}></div>
                <div className="w-6 h-6 rounded-lg border border-slate-700" style={{ backgroundColor: livePalettes.light.brandAccent }} title={`Accent: ${livePalettes.light.brandAccent}`}></div>
                <span className="text-[10px] text-slate-400">Deep rich contrast brand shades</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: LIGHT / DARK THEME MODE */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white uppercase italic tracking-tight">3. Portal Appearance Mode (Dark / Light)</h3>
            <p className="text-xs text-slate-400">Toggle between Dark Mode theme and Light Mode visual workspace</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* DARK MODE CARD */}
          <div
            onClick={() => {
              const updated = { ...settings, themeMode: 'dark' };
              setSettings(updated);
              applyPortalSettings(updated);
            }}
            className={`p-6 rounded-2xl border cursor-pointer transition-all space-y-4 ${settings.themeMode === 'dark' ? 'bg-purple-500/10 border-purple-500 shadow-xl shadow-purple-500/10' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-400">
                <Moon size={24} />
              </div>
              {settings.themeMode === 'dark' && (
                <span className="px-3 py-1 bg-purple-600 text-white font-bold text-[10px] uppercase rounded-full tracking-wider">Active</span>
              )}
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Dark Mode (Obsidian Cyber)</h4>
              <p className="text-xs text-slate-400 mt-1">Deep dark obsidian background with glassmorphism cards, glowing borders, and high contrast typography.</p>
            </div>
          </div>

          {/* LIGHT MODE CARD */}
          <div
            onClick={() => {
              const updated = { ...settings, themeMode: 'light' };
              setSettings(updated);
              applyPortalSettings(updated);
            }}
            className={`p-6 rounded-2xl border cursor-pointer transition-all space-y-4 ${settings.themeMode === 'light' ? 'bg-amber-500/10 border-amber-500 shadow-xl shadow-amber-500/10' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400">
                <Sun size={24} />
              </div>
              {settings.themeMode === 'light' && (
                <span className="px-3 py-1 bg-amber-500 text-slate-950 font-bold text-[10px] uppercase rounded-full tracking-wider">Active</span>
              )}
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Light Mode (Clean Slate)</h4>
              <p className="text-xs text-slate-400 mt-1">Soft warm slate theme with light backdrop cards, dark typography, and deep brand contrast.</p>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM ACTION BAR */}
      <div className="pt-4 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="px-8 py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-xl shadow-purple-600/20 flex items-center gap-2"
        >
          <Check size={18} />
          <span>Save Portal Settings</span>
        </button>
      </div>
    </div>
  );
};

export default PortalSettingsPage;
