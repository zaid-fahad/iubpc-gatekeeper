import React, { useState, useEffect } from 'react';
import { 
  getIrasConfig, saveIrasConfig, getCachedIrasTokenInfo, loginToIras 
} from '../api/iras';
import { 
  Key, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, X, Lock, UserCheck, Server
} from 'lucide-react';

const IrasApiConfig = () => {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [tokenInfo, setTokenInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    const config = getIrasConfig();
    if (config.studentId) setStudentId(config.studentId);
    if (config.password) setPassword(config.password);
    setTokenInfo(getCachedIrasTokenInfo());
  }, []);

  const handleSaveAndTest = async (e) => {
    e.preventDefault();
    if (!studentId.trim() || !password.trim()) {
      showToast('Please provide both IRAS Student ID and Password.', 'error');
      return;
    }

    setLoading(true);
    try {
      // Save config to storage
      saveIrasConfig(studentId.trim(), password.trim());
      
      // Test login & fetch fresh token
      const newTokenInfo = await loginToIras(studentId.trim(), password.trim());
      setTokenInfo(newTokenInfo);

      showToast('Successfully authenticated with IRAS API and cached token.', 'success');
    } catch (err) {
      console.error('IRAS Auth Error:', err);
      showToast(`Authentication failed: ${err.message}`, 'error');
    }
    setLoading(false);
  };

  const handleClear = () => {
    localStorage.removeItem('iubpc_iras_config');
    localStorage.removeItem('iubpc_iras_token');
    setStudentId('');
    setPassword('');
    setTokenInfo(null);
    showToast('IRAS API configuration and cached token cleared.', 'success');
  };

  const isTokenValid = tokenInfo?.token && tokenInfo?.expiresAt && Date.now() < tokenInfo.expiresAt;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-16 text-slate-100 max-w-3xl">
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-[300] px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-3 border ${toast.type === 'success' ? 'bg-slate-900 border-green-500/40 text-green-400' : 'bg-slate-900 border-red-500/40 text-red-400'}`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-slate-500 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* HEADER */}
      <header className="border-b border-slate-800 pb-5 sm:pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Server className="text-blue-500" size={26} />
          IRAS Student API Settings
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Configure authentication credentials to fetch student details during kiosk check-ins.
        </p>
      </header>

      {/* TOKEN STATUS CARD */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 sm:p-6 rounded-2xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={20} className={isTokenValid ? 'text-green-400' : 'text-slate-500'} />
            <div>
              <h3 className="text-sm font-semibold text-white">IRAS Connection Status</h3>
              <p className="text-xs text-slate-400 mt-0.5">Automated token authentication lifecycle</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${isTokenValid ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
            {isTokenValid ? 'Token Active & Valid' : 'Not Connected'}
          </span>
        </div>

        {isTokenValid && (
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-300">
              <span>Auth Token:</span>
              <span className="text-blue-400 truncate max-w-[240px]">
                {tokenInfo.token.slice(0, 16)}...{tokenInfo.token.slice(-8)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400 border-t border-slate-800/80 pt-2 text-[11px]">
              <span>Expires At:</span>
              <span className="text-slate-200">{new Date(tokenInfo.expiresAt).toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* CONFIGURATION FORM */}
      <form onSubmit={handleSaveAndTest} className="bg-slate-900/60 border border-slate-800 p-5 sm:p-6 rounded-2xl space-y-5 shadow-sm">
        <div className="space-y-1 border-b border-slate-800 pb-3">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Key size={18} className="text-blue-500" />
            IRAS API Credentials
          </h2>
          <p className="text-xs text-slate-400">
            Saved credentials will be used to automatically refresh authentication tokens when needed.
          </p>
        </div>

        <div className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium flex items-center gap-1.5">
              <UserCheck size={14} className="text-slate-400" />
              IRAS Service Student / User ID
            </label>
            <input 
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g. 2430825"
              required
              className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500 transition-colors min-h-[44px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium flex items-center gap-1.5">
              <Lock size={14} className="text-slate-400" />
              IRAS Password
            </label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter IRAS password..."
              required
              className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500 transition-colors min-h-[44px]"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-medium transition-all min-h-[44px]"
          >
            Clear Settings
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition-all shadow-md flex items-center justify-center gap-2 min-h-[44px]"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={15} />}
            <span>Test Connection & Save Token</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default IrasApiConfig;
