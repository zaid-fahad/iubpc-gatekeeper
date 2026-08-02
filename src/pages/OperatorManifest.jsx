import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchAllUsers, addUser, updateUser, removeUser, fetchUnassignedUsers, resetPassword } from '../api/auth';
import { 
  ShieldCheck, Users, UserPlus, Trash2, ToggleLeft, ToggleRight, Search, Filter, 
  ShieldAlert, UserSearch, Key, RefreshCw, Plus, UserCheck, ChevronUp, Settings, X, Shield, Lock, Sliders, CheckCircle2, UserX
} from 'lucide-react';
import StatCard from '../components/StatCard';

const OperatorManifest = () => {
  const [users, setUsers] = useState([]);
  const [unassignedUsers, setUnassignedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingUnassigned, setFetchingUnassigned] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [processingId, setProcessingId] = useState(null);
  
  // Pending user role selections: { [email]: 'volunteer' | 'admin' }
  const [pendingRoles, setPendingRoles] = useState({});
  // Toggle for manual inline add form
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [newUser, setNewUser] = useState({ full_name: '', email: '', role: 'volunteer' });

  // Selected staff member for Actions Modal
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'danger'

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data } = await fetchAllUsers();
    setUsers(data || []);
    setLoading(false);
  }, []);

  const getUnassigned = useCallback(async () => {
    setFetchingUnassigned(true);
    try {
      const { data, error } = await fetchUnassignedUsers();
      if (error) {
        console.error("RPC Error:", error);
      } else {
        setUnassignedUsers(data || []);
      }
    } catch (err) {
      console.error("Critical Fetch Error:", err);
    } finally {
      setFetchingUnassigned(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    getUnassigned();
  }, [fetchUsers, getUnassigned]);

  // Keep selectedStaff synced with updated users list
  useEffect(() => {
    if (selectedStaff) {
      const updated = users.find(u => u.email === selectedStaff.email);
      if (updated) {
        setSelectedStaff(updated);
      }
    }
  }, [users]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setProcessingId('manual-create');
    const { error } = await addUser(newUser);
    if (!error) {
        setNewUser({ full_name: '', email: '', role: 'volunteer' });
        setShowManualAdd(false);
        await Promise.all([fetchUsers(), getUnassigned()]);
    } else {
      alert("User Creation Failure: " + error.message);
    }
    setProcessingId(null);
  };

  const handleAuthorizePending = async (pendingUser) => {
    const roleToAssign = pendingRoles[pendingUser.email] || 'volunteer';
    setProcessingId(pendingUser.email);
    const { error } = await addUser({
      full_name: pendingUser.full_name || '',
      email: pendingUser.email,
      role: roleToAssign
    });

    if (!error) {
      await Promise.all([fetchUsers(), getUnassigned()]);
    } else {
      alert("Authorization Failed: " + error.message);
    }
    setProcessingId(null);
  };

  const handleToggleActive = async (user) => {
    setProcessingId(user.email);
    const { error } = await updateUser(user.email, { is_active: !user.is_active });
    if (!error) {
      await fetchUsers();
    }
    setProcessingId(null);
  };

  const handleRoleChange = async (email, newRole) => {
    setProcessingId(email);
    const { error } = await updateUser(email, { role: newRole });
    if (!error) {
        await fetchUsers();
    } else {
        alert("Role Update Failure: " + error.message);
    }
    setProcessingId(null);
  };

  const handleResetPassword = async (email) => {
    if (window.confirm(`Send password reset email to ${email}?`)) {
        setProcessingId(email);
        const { error } = await resetPassword(email);
        if (!error) {
            alert("Password reset link sent to staff email.");
        } else {
            alert("Dispatch Failure: " + error.message);
        }
        setProcessingId(null);
    }
  };

  const handleDeleteUser = async (email) => {
    if (window.confirm(`Are you sure you want to remove ${email} from staff?`)) {
        setProcessingId(email);
        const { error } = await removeUser(email);
        if (!error) {
            setSelectedStaff(null);
            await fetchUsers();
        } else {
            alert("Delete Failure: " + error.message);
        }
        setProcessingId(null);
    }
  };

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.is_active).length,
      admins: users.filter(u => u.role === 'admin').length,
      volunteers: users.filter(u => u.role === 'volunteer').length,
      pending: unassignedUsers.length
    };
  }, [users, unassignedUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            u.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
            <Users className="text-blue-500" size={32} />
            Staff & Operator Manifest
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
            Authorize new registrations, manage roles, and control access permissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={getUnassigned}
            disabled={fetchingUnassigned}
            className="px-4 py-3 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-xl disabled:opacity-50"
          >
            <RefreshCw size={14} className={fetchingUnassigned ? "animate-spin text-blue-500" : ""} />
            {fetchingUnassigned ? "Syncing..." : "Re-Scan Auth"}
          </button>
          <button 
            onClick={() => setShowManualAdd(!showManualAdd)} 
            className="px-5 py-3 bg-blue-500 text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-2xl shadow-blue-500/20 active:scale-95 transition-all w-fit hover:bg-blue-400"
          >
            {showManualAdd ? <ChevronUp size={16}/> : <Plus size={16}/>}
            {showManualAdd ? "Close Add Form" : "Add Custom Staff"}
          </button>
        </div>
      </header>

      {/* STATS SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Staff" value={stats.total} color="bg-slate-900/40" char="S" />
        <StatCard label="Active Staff" value={stats.active} color="bg-green-500/5" char="A" />
        <StatCard label="Administrators" value={stats.admins} color="bg-blue-500/5" char="M" />
        <StatCard label="Pending Approval" value={stats.pending} color={stats.pending > 0 ? "bg-amber-500/10 text-amber-500" : "bg-slate-900/40"} char="P" />
      </div>

      {/* INLINE MANUAL ADD STAFF FORM (IF TOGGLED) */}
      {showManualAdd && (
        <form onSubmit={handleCreateUser} className="bg-slate-900/90 border border-blue-500/30 p-6 rounded-2xl space-y-4 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <UserPlus className="text-blue-500" size={18} />
              <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Direct Staff Registration</h3>
            </div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Bypass auth sign-up screen</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
              <input 
                value={newUser.full_name} 
                onChange={e => setNewUser({...newUser, full_name: e.target.value})} 
                placeholder="FIRST LAST" 
                required 
                className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs font-bold text-white outline-none focus:ring-1 focus:ring-blue-500 shadow-inner uppercase tracking-wider" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Email Address</label>
              <input 
                type="email" 
                value={newUser.email} 
                onChange={e => setNewUser({...newUser, email: e.target.value})} 
                placeholder="name@iub.edu.bd" 
                required 
                className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs font-bold text-white outline-none focus:ring-1 focus:ring-blue-500 shadow-inner uppercase tracking-wider" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Staff Role</label>
              <select 
                value={newUser.role} 
                onChange={e => setNewUser({...newUser, role: e.target.value})} 
                className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs font-bold text-white outline-none focus:ring-1 focus:ring-blue-500 shadow-inner uppercase tracking-wider cursor-pointer"
              >
                <option value="volunteer">Volunteer (Check-in Only)</option>
                <option value="admin">Administrator (Full Access)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => setShowManualAdd(false)}
              className="px-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Cancel
            </button>
            <button 
              disabled={processingId === 'manual-create'}
              className="px-6 py-2.5 bg-blue-500 text-slate-950 font-black rounded-xl text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-400 transition-all flex items-center gap-2"
            >
              {processingId === 'manual-create' ? <RefreshCw size={14} className="animate-spin" /> : <UserCheck size={14} />}
              CREATE & AUTHORIZE STAFF
            </button>
          </div>
        </form>
      )}

      {/* SECTION 1: PENDING USER REGISTRATIONS TABLE LIST */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-black">
              <UserSearch size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white uppercase tracking-tight italic">Pending User Registrations</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${unassignedUsers.length > 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-500'}`}>
                  {unassignedUsers.length} PENDING
                </span>
              </div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                Users who registered via the auth screen awaiting authorization
              </p>
            </div>
          </div>
        </div>

        {unassignedUsers.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <th className="p-4">User Details</th>
                  <th className="p-4">Email Address</th>
                  <th className="p-4">Assign Role</th>
                  <th className="p-4 text-right">Authorization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-bold">
                {unassignedUsers.map((pending) => {
                  const selectedRole = pendingRoles[pending.email] || 'volunteer';
                  const isProcessing = processingId === pending.email;

                  return (
                    <tr key={pending.email} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:border-amber-500/40 group-hover:text-amber-400 transition-all">
                            <Users size={16} />
                          </div>
                          <div>
                            <span className="text-white font-black uppercase tracking-tight block">
                              {pending.full_name || 'REGISTERED USER'}
                            </span>
                            <span className="text-[9px] text-amber-500/80 font-mono uppercase tracking-widest">Awaiting Role</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300 font-mono text-xs">{pending.email}</td>
                      <td className="p-4">
                        <select 
                          value={selectedRole}
                          onChange={(e) => setPendingRoles({ ...pendingRoles, [pending.email]: e.target.value })}
                          className="bg-slate-950 border border-slate-800 text-xs text-white p-2 rounded-lg font-bold uppercase tracking-wider outline-none focus:ring-1 focus:ring-amber-500/40 cursor-pointer"
                        >
                          <option value="volunteer" className="bg-slate-900 text-blue-400">Volunteer (Check-in)</option>
                          <option value="admin" className="bg-slate-900 text-green-400">Administrator (Full)</option>
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleAuthorizePending(pending)}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-amber-500 text-slate-950 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all active:scale-95 shadow-lg shadow-amber-500/10 inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isProcessing ? <RefreshCw size={12} className="animate-spin" /> : <UserCheck size={14} />}
                          Approve Staff Access
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-center space-y-2">
            <div className="flex justify-center text-slate-700">
              <UserCheck size={28} />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No pending user registrations</p>
            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider max-w-md mx-auto">
              New signups from the login screen will automatically appear in this table list for authorization.
            </p>
          </div>
        )}
      </section>

      {/* SECTION 2: ACTIVE STAFF ROSTER TABLE LIST */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center font-black">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight italic">Active Staff Roster</h3>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                Authorized operators and system administrators
              </p>
            </div>
          </div>

          {/* CONTROLS (SEARCH & FILTER) */}
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative w-full sm:w-64 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={14} />
              <input 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-800 p-2.5 pl-9 rounded-xl text-xs font-bold text-white shadow-inner outline-none placeholder:text-slate-600 focus:ring-1 focus:ring-blue-500/30 transition-all" 
                placeholder="Search staff..." 
              />
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
              <Filter size={12} className="text-slate-500 ml-2" />
              {["all", "admin", "volunteer"].map(role => (
                <button 
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${roleFilter === role ? 'bg-blue-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* STAFF TABLE LIST */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-400">
                <th className="p-4">Staff Member</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4">Access Status</th>
                <th className="p-4 text-right">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-bold">
              {filteredUsers.map((u) => {
                return (
                  <tr key={u.id || u.email} className={`hover:bg-slate-800/40 transition-colors group ${!u.is_active ? 'opacity-60 bg-slate-950/20' : ''}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${u.role === 'admin' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'}`}>
                          {u.role === 'admin' ? <ShieldCheck size={18}/> : <Users size={18}/>}
                        </div>
                        <div>
                          <span className={`font-black uppercase tracking-tight block ${!u.is_active ? 'text-slate-500 line-through' : 'text-white'}`}>
                            {u.full_name || 'STAFF MEMBER'}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                            ID: {u.id ? u.id.slice(0, 8) : 'ACTIVE'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300 font-mono text-xs">{u.email}</td>
                    <td className="p-4">
                      <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest border ${u.role === 'admin' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                        {u.role === 'admin' ? 'ADMINISTRATOR' : 'VOLUNTEER'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${u.is_active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-red-500'}`}></span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${u.is_active ? 'text-green-400' : 'text-red-400'}`}>
                          {u.is_active ? 'ACTIVE' : 'REVOKED'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => { setSelectedStaff(u); setActiveTab('general'); }}
                        className="px-4 py-2 bg-slate-950 border border-slate-800 hover:border-blue-500/40 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all inline-flex items-center gap-2 active:scale-95 shadow-lg group-hover:border-slate-700"
                      >
                        <Settings size={14} className="text-blue-500 group-hover:rotate-45 transition-transform duration-300" />
                        Manage Staff
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredUsers.length === 0 && !loading && (
            <div className="p-12 border-t border-slate-800 text-center">
              <ShieldAlert size={36} className="mx-auto text-slate-700 mb-3" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No active staff members found matching criteria.</p>
              <button 
                onClick={() => { setSearchTerm(""); setRoleFilter("all"); }}
                className="mt-3 text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-white transition-all"
              >
                Reset Search Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* STAFF ACTIONS MANAGEMENT MODAL */}
      {selectedStaff && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl text-left overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* GLOW ACCENT HEADER */}
            <div className={`p-6 border-b border-slate-800 flex items-center justify-between relative overflow-hidden ${selectedStaff.role === 'admin' ? 'bg-gradient-to-r from-green-500/10 via-slate-900 to-slate-900' : 'bg-gradient-to-r from-blue-500/10 via-slate-900 to-slate-900'}`}>
              <div className="flex items-center gap-4 relative z-10">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xl ${selectedStaff.role === 'admin' ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-blue-500/20 border-blue-500/30 text-blue-400'}`}>
                  {selectedStaff.role === 'admin' ? <ShieldCheck size={26} /> : <Users size={26} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight italic">
                      {selectedStaff.full_name || 'STAFF MEMBER'}
                    </h3>
                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border ${selectedStaff.role === 'admin' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                      {selectedStaff.role}
                    </span>
                  </div>
                  <p className="text-slate-400 font-mono text-xs mt-0.5">{selectedStaff.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStaff(null)} 
                className="p-2.5 text-slate-400 hover:text-white rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all relative z-10"
              >
                <X size={18} />
              </button>
            </div>

            {/* MODAL NAVIGATION TABS */}
            <div className="flex border-b border-slate-800 bg-slate-950/50 p-1.5 px-6 gap-2">
              <button
                onClick={() => setActiveTab('general')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'general' ? 'bg-slate-800 text-white shadow-md border border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Sliders size={13} />
                General Management
              </button>
              <button
                onClick={() => setActiveTab('danger')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'danger' ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-md' : 'text-slate-500 hover:text-red-400'}`}
              >
                <UserX size={13} />
                Danger Zone
              </button>
            </div>

            {/* MODAL BODY CONTENT */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
              {activeTab === 'general' ? (
                <>
                  {/* ROLE ASSIGNMENT CARD */}
                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-inner">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-2 text-slate-200">
                        <Shield size={16} className="text-blue-500" />
                        <span className="text-xs font-black uppercase tracking-wider">Access Permission Role</span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">System Privileges</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => handleRoleChange(selectedStaff.email, 'volunteer')}
                        disabled={processingId === selectedStaff.email}
                        className={`p-3 rounded-xl border text-left transition-all relative ${selectedStaff.role === 'volunteer' ? 'bg-blue-500/10 border-blue-500/40 text-blue-400 shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black uppercase tracking-wider">Volunteer</span>
                          {selectedStaff.role === 'volunteer' && <CheckCircle2 size={14} className="text-blue-500" />}
                        </div>
                        <p className="text-[9px] text-slate-500 leading-tight">Check-in and manifest verification only.</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRoleChange(selectedStaff.email, 'admin')}
                        disabled={processingId === selectedStaff.email}
                        className={`p-3 rounded-xl border text-left transition-all relative ${selectedStaff.role === 'admin' ? 'bg-green-500/10 border-green-500/40 text-green-400 shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black uppercase tracking-wider">Admin</span>
                          {selectedStaff.role === 'admin' && <CheckCircle2 size={14} className="text-green-500" />}
                        </div>
                        <p className="text-[9px] text-slate-500 leading-tight">Full administrative & operator permissions.</p>
                      </button>
                    </div>
                  </div>

                  {/* ACCOUNT ACCESS CONTROL CARD */}
                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-inner">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-2 text-slate-200">
                        <Lock size={16} className={selectedStaff.is_active ? "text-green-500" : "text-red-500"} />
                        <span className="text-xs font-black uppercase tracking-wider">Account Active Status</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${selectedStaff.is_active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${selectedStaff.is_active ? 'text-green-400' : 'text-red-400'}`}>
                          {selectedStaff.is_active ? 'ACTIVE' : 'REVOKED'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleActive(selectedStaff)}
                      disabled={processingId === selectedStaff.email}
                      className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 border shadow-lg ${selectedStaff.is_active ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500 hover:text-slate-950' : 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500 hover:text-slate-950'}`}
                    >
                      {selectedStaff.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      {selectedStaff.is_active ? 'Revoke System Access' : 'Grant Active System Access'}
                    </button>
                  </div>

                  {/* PASSWORD RESET DISPATCH CARD */}
                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-inner">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-2 text-slate-200">
                        <Key size={16} className="text-amber-500" />
                        <span className="text-xs font-black uppercase tracking-wider">Password Credentials</span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono">SUPABASE AUTH</span>
                    </div>
                    <button
                      onClick={() => handleResetPassword(selectedStaff.email)}
                      disabled={processingId === selectedStaff.email}
                      className="w-full py-3 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-amber-500/40 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
                    >
                      {processingId === selectedStaff.email ? <RefreshCw size={14} className="animate-spin" /> : <Key size={14} />}
                      Dispatch Password Reset Email
                    </button>
                  </div>
                </>
              ) : (
                /* DANGER ZONE TAB */
                <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-2xl space-y-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
                    <ShieldAlert size={26} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-red-400 uppercase tracking-wider">Delete Staff Profile</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 max-w-xs mx-auto leading-relaxed">
                      Permanently removes <span className="text-white font-mono">{selectedStaff.email}</span> from operator manifest database.
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteUser(selectedStaff.email)}
                    disabled={processingId === selectedStaff.email}
                    className="w-full py-3 bg-red-500 text-slate-950 hover:bg-red-400 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-red-500/20"
                  >
                    {processingId === selectedStaff.email ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={16} />}
                    CONFIRM PERMANENT DELETION
                  </button>
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
              <button
                onClick={() => setSelectedStaff(null)}
                className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Close Management Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorManifest;
