import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchAllUsers, addUser, updateUser, removeUser, fetchUnassignedUsers, resetPassword, adminSetUserPassword } from '../api/auth';
import { 
  Users, UserPlus, Search, Filter, Shield, Key, RefreshCw, Plus, 
  UserCheck, ChevronUp, Settings, X, Lock, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Check
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
  
  // Table Sorting State
  const [sortField, setSortField] = useState("full_name");
  const [sortDirection, setSortDirection] = useState("asc");

  // Toast Notification State
  const [toast, setToast] = useState(null);

  // Pending user role selections
  const [pendingRoles, setPendingRoles] = useState({});
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [newUser, setNewUser] = useState({ full_name: '', email: '', role: 'volunteer' });

  // Selected staff member for Actions Modal
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [directPassword, setDirectPassword] = useState('');
  const [showDirectPasswordInput, setShowDirectPasswordInput] = useState(false);

  const handleAdminDirectPasswordReset = async (e) => {
    e.preventDefault();
    if (!selectedStaff || !directPassword) return;
    if (directPassword.length < 6) {
      showToast("Password must be at least 6 characters long.", 'error');
      return;
    }
    setProcessingId(selectedStaff.email);
    const { error } = await adminSetUserPassword(selectedStaff.email, directPassword);
    if (!error) {
      showToast(`Successfully set new password for ${selectedStaff.email}.`);
      setDirectPassword('');
      setShowDirectPasswordInput(false);
    } else {
      showToast("Direct password reset failed: " + error.message, 'error');
    }
    setProcessingId(null);
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

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
        console.error("Fetch Error:", error);
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

  useEffect(() => {
    if (selectedStaff) {
      const updated = users.find(u => u.email === selectedStaff.email);
      if (updated) {
        setSelectedStaff(updated);
      }
    }
  }, [users]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedStaff(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setProcessingId('manual-create');
    const { error } = await addUser(newUser);
    if (!error) {
        setNewUser({ full_name: '', email: '', role: 'volunteer' });
        setShowManualAdd(false);
        await Promise.all([fetchUsers(), getUnassigned()]);
        showToast("Staff member added successfully.");
    } else {
      showToast("Could not add staff: " + error.message, 'error');
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
      showToast(`Approved ${pendingUser.email} as ${roleToAssign}.`);
    } else {
      showToast("Approval failed: " + error.message, 'error');
    }
    setProcessingId(null);
  };

  const handleToggleActive = async (user) => {
    setProcessingId(user.email);
    const nextStatus = !user.is_active;
    const { error } = await updateUser(user.email, { is_active: nextStatus });
    if (!error) {
      await fetchUsers();
      showToast(`Access ${nextStatus ? 'enabled' : 'disabled'} for ${user.email}.`);
    } else {
      showToast("Update error: " + error.message, 'error');
    }
    setProcessingId(null);
  };

  const handleRoleChange = async (email, newRole) => {
    setProcessingId(email);
    const { error } = await updateUser(email, { role: newRole });
    if (!error) {
        await fetchUsers();
        showToast(`Role updated to ${newRole} for ${email}.`);
    } else {
        showToast("Role update failed: " + error.message, 'error');
    }
    setProcessingId(null);
  };

  const handleResetPassword = async (email) => {
    if (window.confirm(`Send a password reset email to ${email}?`)) {
        setProcessingId(email);
        const { error } = await resetPassword(email);
        if (!error) {
            showToast(`Password reset link sent to ${email}.`);
        } else {
            showToast("Failed to send reset link: " + error.message, 'error');
        }
        setProcessingId(null);
    }
  };

  const handleDeleteUser = async (email) => {
    if (window.confirm(`Are you sure you want to remove ${email}?`)) {
        setProcessingId(email);
        const { error } = await removeUser(email);
        if (!error) {
            setSelectedStaff(null);
            await fetchUsers();
            showToast(`Removed ${email} from staff.`, 'info');
        } else {
            showToast("Failed to remove staff: " + error.message, 'error');
        }
        setProcessingId(null);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
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

  const filteredAndSortedUsers = useMemo(() => {
    let result = users.filter(u => {
      const matchesSearch = u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            u.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });

    result.sort((a, b) => {
      let valA = a[sortField] ?? '';
      let valB = b[sortField] ?? '';
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, searchTerm, roleFilter, sortField, sortDirection]);

  const getInitials = (name, email) => {
    if (name && name.trim().length > 0) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'ST';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16 text-slate-100">
      {/* TOAST BANNER */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[300] px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-3 border ${toast.type === 'success' ? 'bg-slate-900 border-green-500/40 text-green-400' : toast.type === 'error' ? 'bg-slate-900 border-red-500/40 text-red-400' : 'bg-slate-900 border-blue-500/40 text-blue-400'}`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-slate-500 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="text-blue-500" size={28} />
            Staff Management
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Manage team access permissions and authorize registered user accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={getUnassigned}
            disabled={fetchingUnassigned}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw size={13} className={fetchingUnassigned ? "animate-spin text-blue-500" : ""} />
            Sync Pending
          </button>
          <button 
            onClick={() => setShowManualAdd(!showManualAdd)} 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-all shadow-md"
          >
            {showManualAdd ? <ChevronUp size={14}/> : <Plus size={14}/>}
            {showManualAdd ? "Cancel" : "Add Staff Member"}
          </button>
        </div>
      </header>

      {/* STATS SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Staff" value={stats.total} color="bg-slate-900/40" char="S" />
        <StatCard label="Active Staff" value={stats.active} color="bg-green-500/5" char="A" />
        <StatCard label="Administrators" value={stats.admins} color="bg-blue-500/5" char="M" />
        <StatCard label="Pending Approval" value={stats.pending} color={stats.pending > 0 ? "bg-amber-500/10 text-amber-400" : "bg-slate-900/40"} char="P" />
      </div>

      {/* INLINE MANUAL ADD FORM */}
      {showManualAdd && (
        <form onSubmit={handleCreateUser} className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-white">Add New Staff Member</h3>
            <span className="text-xs text-slate-400">Direct creation</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Full Name</label>
              <input 
                value={newUser.full_name} 
                onChange={e => setNewUser({...newUser, full_name: e.target.value})} 
                placeholder="John Doe" 
                required 
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs text-white outline-none focus:border-blue-500 transition-colors" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Email Address</label>
              <input 
                type="email" 
                value={newUser.email} 
                onChange={e => setNewUser({...newUser, email: e.target.value})} 
                placeholder="john@iub.edu.bd" 
                required 
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs text-white outline-none focus:border-blue-500 transition-colors" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Role</label>
              <select 
                value={newUser.role} 
                onChange={e => setNewUser({...newUser, role: e.target.value})} 
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs text-white outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="volunteer">Volunteer (Check-in Only)</option>
                <option value="admin">Administrator (Full Access)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button 
              type="button" 
              onClick={() => setShowManualAdd(false)}
              className="px-3.5 py-2 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-medium transition-all"
            >
              Cancel
            </button>
            <button 
              disabled={processingId === 'manual-create'}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
            >
              {processingId === 'manual-create' ? <RefreshCw size={13} className="animate-spin" /> : <UserCheck size={13} />}
              Add Staff
            </button>
          </div>
        </form>
      )}

      {/* SECTION 1: PENDING REGISTRATIONS */}
      <section className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">Pending Registrations</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${unassignedUsers.length > 0 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400'}`}>
                {unassignedUsers.length} pending
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Users who registered through the sign-up form awaiting role approval.</p>
          </div>
        </div>

        {unassignedUsers.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-xs font-medium text-slate-400">
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Assign Role</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {unassignedUsers.map((pending) => {
                  const selectedRole = pendingRoles[pending.email] || 'volunteer';
                  const isProcessing = processingId === pending.email;
                  const initials = getInitials(pending.full_name, pending.email);

                  return (
                    <tr key={pending.email} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-semibold text-xs border border-slate-700">
                            {initials}
                          </div>
                          <span className="text-white font-medium">
                            {pending.full_name || 'Registered User'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-300 font-mono text-xs">{pending.email}</td>
                      <td className="p-3.5">
                        <select 
                          value={selectedRole}
                          onChange={(e) => setPendingRoles({ ...pendingRoles, [pending.email]: e.target.value })}
                          className="bg-slate-950 border border-slate-800 text-xs text-white p-1.5 rounded-lg outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="volunteer">Volunteer (Check-in)</option>
                          <option value="admin">Administrator (Full)</option>
                        </select>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleAuthorizePending(pending)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium rounded-lg text-xs transition-all inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isProcessing ? <RefreshCw size={12} className="animate-spin" /> : <UserCheck size={13} />}
                          Approve Staff
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 border border-dashed border-slate-800 rounded-lg text-center">
            <p className="text-xs text-slate-400">No pending user registrations at this time.</p>
          </div>
        )}
      </section>

      {/* SECTION 2: ACTIVE STAFF ROSTER */}
      <section className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-semibold text-white">Active Staff Roster</h2>
            <p className="text-xs text-slate-400 mt-0.5">Authorized team members and system administrators.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
              <input 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="bg-slate-950 border border-slate-800 p-2 pl-8.5 rounded-lg text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500 w-48 transition-colors" 
                placeholder="Search staff..." 
              />
            </div>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {["all", "admin", "volunteer"].map(role => (
                <button 
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-2.5 py-1 rounded text-xs capitalize transition-all ${roleFilter === role ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* STAFF TABLE LIST */}
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-xs font-medium text-slate-400">
                <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('full_name')}>
                  <div className="flex items-center gap-1">
                    Name
                    {sortField === 'full_name' ? (sortDirection === 'asc' ? <ArrowUp size={12} className="text-blue-500" /> : <ArrowDown size={12} className="text-blue-500" />) : <ArrowUpDown size={12} className="text-slate-600" />}
                  </div>
                </th>
                <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('email')}>
                  <div className="flex items-center gap-1">
                    Email
                    {sortField === 'email' ? (sortDirection === 'asc' ? <ArrowUp size={12} className="text-blue-500" /> : <ArrowDown size={12} className="text-blue-500" />) : <ArrowUpDown size={12} className="text-slate-600" />}
                  </div>
                </th>
                <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('role')}>
                  <div className="flex items-center gap-1">
                    Role
                    {sortField === 'role' ? (sortDirection === 'asc' ? <ArrowUp size={12} className="text-blue-500" /> : <ArrowDown size={12} className="text-blue-500" />) : <ArrowUpDown size={12} className="text-slate-600" />}
                  </div>
                </th>
                <th className="p-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('is_active')}>
                  <div className="flex items-center gap-1">
                    Status
                    {sortField === 'is_active' ? (sortDirection === 'asc' ? <ArrowUp size={12} className="text-blue-500" /> : <ArrowDown size={12} className="text-blue-500" />) : <ArrowUpDown size={12} className="text-slate-600" />}
                  </div>
                </th>
                <th className="p-3.5 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {filteredAndSortedUsers.map((u) => {
                const initials = getInitials(u.full_name, u.email);

                return (
                  <tr key={u.id || u.email} className={`hover:bg-slate-800/30 transition-colors ${!u.is_active ? 'opacity-60 bg-slate-950/20' : ''}`}>
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-medium text-xs border ${u.role === 'admin' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                          {initials}
                        </div>
                        <span className={`font-medium ${!u.is_active ? 'text-slate-400 line-through' : 'text-white'}`}>
                          {u.full_name || 'Staff Member'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-300 font-mono text-xs">{u.email}</td>
                    <td className="p-3.5">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border capitalize ${u.role === 'admin' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${u.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className={`text-xs ${u.is_active ? 'text-green-400' : 'text-red-400'}`}>
                          {u.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 text-right">
                      <button 
                        onClick={() => setSelectedStaff(u)}
                        className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition-all inline-flex items-center gap-1.5"
                      >
                        <Settings size={13} className="text-slate-400" />
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredAndSortedUsers.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No staff members found matching criteria.
            </div>
          )}
        </div>
      </section>

      {/* STAFF ACTIONS MODAL */}
      {selectedStaff && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            
            {/* MODAL HEADER */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">
                  {selectedStaff.full_name || 'Staff Management'}
                </h3>
                <p className="text-slate-400 font-mono text-xs mt-0.5">{selectedStaff.email}</p>
              </div>
              <button 
                onClick={() => setSelectedStaff(null)} 
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-5 space-y-4 text-xs">
              {/* ROLE ASSIGNMENT */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-200">Role & Access Level</span>
                  <span className="text-slate-400 capitalize">{selectedStaff.role}</span>
                </div>
                <select 
                  value={selectedStaff.role} 
                  onChange={(e) => handleRoleChange(selectedStaff.email, e.target.value)}
                  disabled={processingId === selectedStaff.email}
                  className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs text-white outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="volunteer">Volunteer (Check-in Only)</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
              </div>

              {/* ACCOUNT STATUS TOGGLE */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-200">Account Access</span>
                  <span className={selectedStaff.is_active ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
                    {selectedStaff.is_active ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <button
                  onClick={() => handleToggleActive(selectedStaff)}
                  disabled={processingId === selectedStaff.email}
                  className={`w-full py-2.5 rounded-lg font-medium text-xs flex items-center justify-center gap-2 border transition-all ${selectedStaff.is_active ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'}`}
                >
                  {selectedStaff.is_active ? 'Disable Access' : 'Enable Access'}
                </button>
              </div>

              {/* PASSWORD RESET OPTIONS */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                <span className="font-medium text-slate-200 block">Password Credentials</span>
                
                <div className="space-y-2">
                  <button
                    onClick={() => handleResetPassword(selectedStaff.email)}
                    disabled={processingId === selectedStaff.email}
                    className="w-full py-2.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all"
                  >
                    <Key size={13} />
                    Send Password Reset Link (Email)
                  </button>

                  {!showDirectPasswordInput ? (
                    <button
                      onClick={() => setShowDirectPasswordInput(true)}
                      className="w-full py-2.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600/20 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                      <Lock size={13} />
                      Set New Password Directly
                    </button>
                  ) : (
                    <form onSubmit={handleAdminDirectPasswordReset} className="space-y-2 pt-2 border-t border-slate-800">
                      <label className="text-[11px] text-slate-400 font-semibold block">Set New Password for {selectedStaff.email}:</label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={directPassword}
                          onChange={(e) => setDirectPassword(e.target.value)}
                          placeholder="Min 6 characters..."
                          required
                          minLength={6}
                          className="flex-1 bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                        />
                        <button
                          type="submit"
                          disabled={processingId === selectedStaff.email}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                        >
                          {processingId === selectedStaff.email ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowDirectPasswordInput(false); setDirectPassword(''); }}
                          className="px-2.5 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* REMOVE STAFF */}
              <div className="pt-2">
                <button
                  onClick={() => handleDeleteUser(selectedStaff.email)}
                  disabled={processingId === selectedStaff.email}
                  className="w-full py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 font-medium rounded-lg text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Trash2 size={13} />
                  Remove Staff Member
                </button>
              </div>
            </div>

            {/* FOOTER */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                onClick={() => setSelectedStaff(null)}
                className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorManifest;
