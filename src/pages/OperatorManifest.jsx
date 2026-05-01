import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchAllUsers, addUser, updateUser, removeUser, fetchUnassignedUsers, resetPassword } from '../api/auth';
import { 
  ShieldCheck, X, Users, UserPlus, Trash2, ToggleLeft, ToggleRight, Search, Filter, ShieldAlert, UserSearch, Key, RefreshCw
} from 'lucide-react';
import StatCard from '../components/StatCard';

const OperatorManifest = () => {
  const [users, setUsers] = useState([]);
  const [unassignedUsers, setUnassignedUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ full_name: '', email: '', role: 'volunteer' });
  const [loading, setLoading] = useState(true);
  const [fetchingUnassigned, setFetchingUnassigned] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [processingId, setProcessingId] = useState(null);

  const fetchUsers = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    const { data } = await fetchAllUsers();
    setUsers(data || []);
    setLoading(false);
  }, []);

  const getUnassigned = useCallback(async () => {
    await Promise.resolve();
    setFetchingUnassigned(true);
    try {
      const { data, error } = await fetchUnassignedUsers();
      if (error) {
        console.error("RPC Error:", error);
        alert("Failed to fetch registered users: " + error.message);
      } else {
        console.log("Unassigned Users Data:", data);
        setUnassignedUsers(data || []);
      }
    } catch (err) {
      console.error("Critical Fetch Error:", err);
    } finally {
      setFetchingUnassigned(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchUsers();
    };
    init();
  }, [fetchUsers]);

  useEffect(() => {
    const initUnassigned = async () => {
      if (showUserModal) {
        await getUnassigned();
      }
    };
    initUnassigned();
  }, [showUserModal, getUnassigned]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const { error } = await addUser(newUser);
    if (!error) {
        setShowUserModal(false);
        setNewUser({ full_name: '', email: '', role: 'volunteer' });
        fetchUsers();
    } else alert("User Creation Failure: " + error.message);
  };

  const handleToggleActive = async (user) => {
    const { error } = await updateUser(user.email, { is_active: !user.is_active });
    if (!error) fetchUsers();
  };

  const handleRoleChange = async (email, newRole) => {
    setProcessingId(email);
    const { error } = await updateUser(email, { role: newRole });
    if (!error) {
        fetchUsers();
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
    if (window.confirm("Terminate this operator profile?")) {
        const { error } = await removeUser(email);
        if (!error) fetchUsers();
    }
  };

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.is_active).length,
      admins: users.filter(u => u.role === 'admin').length,
      volunteers: users.filter(u => u.role === 'volunteer').length
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            u.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 italic">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 italic">
        <div>
          <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter italic">Staff List</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2 italic">Manage staff permissions and access</p>
        </div>
        <button 
          onClick={() => setShowUserModal(true)} 
          className="px-6 py-3 bg-blue-500 text-slate-950 rounded-xl font-black text-[10px] italic flex items-center gap-2 shadow-2xl shadow-blue-500/20 active:scale-95 transition-all italic w-fit"
        >
          <UserPlus size={16}/> ADD STAFF
        </button>
      </header>

      {/* STATS SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 italic">
        <StatCard label="Total Staff" value={stats.total} color="bg-slate-900/40" char="S" />
        <StatCard label="Active Staff" value={stats.active} color="bg-green-500/5" char="A" />
        <StatCard label="Administrators" value={stats.admins} color="bg-blue-500/5" char="M" />
        <StatCard label="Volunteers" value={stats.volunteers} color="bg-slate-900/40" char="V" />
      </div>

      {/* CONTROLS */}
      <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center italic shadow-xl">
        <div className="relative w-full md:max-w-xs group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-blue-500 transition-colors" size={16} />
          <input 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="w-full bg-slate-950 border border-slate-800 p-3 pl-10 rounded-xl text-xs font-bold text-white shadow-inner outline-none italic placeholder:text-slate-800 focus:ring-1 focus:ring-blue-500/30 transition-all" 
            placeholder="Search staff members..." 
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto italic">
          <div className="flex items-center gap-2 text-[9px] font-black text-slate-600 uppercase tracking-widest italic leading-none">
            <Filter size={12}/> Filter:
          </div>
          <div className="flex gap-2 flex-1 md:flex-none">
            {["all", "admin", "volunteer"].map(role => (
              <button 
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${roleFilter === role ? 'bg-blue-500 text-slate-950 border-blue-400' : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-white'}`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 italic pb-20">
        {filteredUsers.map(u => (
          <div key={u.id} className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 transition-all italic shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-5 italic relative z-10">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${u.role === 'admin' ? 'bg-green-500/10 border-green-500/20 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-blue-500/10 border-blue-500/20 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]'}`}>
                {u.role === 'admin' ? <ShieldCheck size={22}/> : <Users size={22}/>}
              </div>
              <div className="italic">
                <div className="flex items-center gap-3 italic">
                    <h4 className={`text-base font-black italic uppercase tracking-tight italic ${!u.is_active ? 'text-slate-600' : 'text-white'}`}>{u.full_name || 'UNKNOWN STAFF'}</h4>
                    <select 
                        value={u.role} 
                        onChange={(e) => handleRoleChange(u.email, e.target.value)}
                        disabled={processingId === u.email}
                        className={`text-[7px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border bg-transparent outline-none cursor-pointer transition-all ${u.role === 'admin' ? 'text-green-500 border-green-500/20 hover:bg-green-500/10' : 'text-blue-500 border-blue-500/20 hover:bg-blue-500/10'}`}
                    >
                        <option value="admin" className="bg-slate-900 text-green-500">ADMIN</option>
                        <option value="volunteer" className="bg-slate-900 text-blue-500">VOLUNTEER</option>
                    </select>
                </div>
                <div className="flex items-center gap-3 mt-1 italic">
                  <span className={`text-[8px] font-black uppercase tracking-tight italic ${!u.is_active ? 'text-slate-700' : 'text-slate-500'}`}>{u.email}</span>
                  <span className="w-1 h-1 bg-slate-800 rounded-full italic"></span>
                  <span className={`text-[8px] font-black uppercase tracking-widest ${u.is_active ? 'text-green-500' : 'text-red-500'}`}>
                    {u.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 italic relative z-10">
              <button 
                onClick={() => handleResetPassword(u.email)} 
                title="Reset Password"
                disabled={processingId === u.email}
                className={`p-2 rounded-lg border border-slate-800 text-slate-500 hover:text-blue-500 hover:border-blue-500/30 transition-all active:scale-90 italic bg-slate-950 ${processingId === u.email ? 'animate-pulse' : ''}`}
              >
                {processingId === u.email ? <RefreshCw size={20} className="animate-spin" /> : <Key size={20}/>}
              </button>
              <button 
                onClick={() => handleToggleActive(u)} 
                title={u.is_active ? "Revoke Access" : "Grant Access"}
                className={`p-2 rounded-lg border transition-all active:scale-90 italic ${u.is_active ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'}`}
              >
                {u.is_active ? <ToggleRight size={20}/> : <ToggleLeft size={20}/>}
              </button>
              <button 
                onClick={() => handleDeleteUser(u.email)} 
                title="Remove Staff Member"
                className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-600 hover:text-red-500 hover:border-red-500/30 transition-all active:scale-90 italic shadow-xl"
              >
                <Trash2 size={20}/>
              </button>
            </div>
            {!u.is_active && <div className="absolute inset-0 bg-slate-950/20 backdrop-grayscale pointer-events-none"></div>}
          </div>
        ))}
        
        {filteredUsers.length === 0 && !loading && (
          <div className="p-20 border-2 border-dashed border-slate-900 rounded-[2.5rem] text-center italic">
            <ShieldAlert size={48} className="mx-auto text-slate-900 mb-4 italic" />
            <p className="text-slate-700 font-black uppercase tracking-[0.2em] text-[10px] italic">No staff members found matching your search.</p>
            <button 
                onClick={() => { setSearchTerm(""); setRoleFilter("all"); }}
                className="mt-4 text-[9px] font-black text-blue-500 uppercase tracking-widest hover:text-white transition-all italic"
            >
                Reset Search Parameters
            </button>
          </div>
        )}
      </div>

      {/* USER MANAGEMENT MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300 italic">
          <form onSubmit={handleCreateUser} className="relative bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 w-full max-w-md space-y-6 shadow-2xl text-left italic">
            <div className="flex justify-between items-center italic">
                <div className="flex items-center gap-3 italic">
                    <UserPlus className="text-blue-500" size={24} />
                    <h2 className="text-2xl font-black italic text-white tracking-tighter uppercase leading-none italic">Add Staff</h2>
                </div>
                <button type="button" onClick={() => setShowUserModal(false)} className="p-2 text-slate-600 hover:text-white transition-colors italic">
                    <X size={20} />
                </button>
            </div>
            <div className="space-y-4 italic text-left">
              {(unassignedUsers.length > 0 || fetchingUnassigned) ? (
                <div className="space-y-1.5 italic p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl animate-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <UserSearch size={14} className="text-blue-500" />
                    <label className="text-[9px] font-black uppercase tracking-widest text-blue-500 italic">Select from Registered Users</label>
                  </div>
                  <select 
                    onChange={e => {
                      if (e.target.value) {
                        const selectedUser = unassignedUsers.find(u => u.email === e.target.value);
                        setNewUser({
                          ...newUser, 
                          email: e.target.value,
                          full_name: selectedUser?.full_name || newUser.full_name
                        });
                      }
                    }}
                    disabled={fetchingUnassigned}
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-[10px] font-bold text-white outline-none focus:ring-1 focus:ring-blue-500 shadow-inner italic uppercase tracking-widest disabled:opacity-50"
                  >
                    <option value="">{fetchingUnassigned ? 'FETCHING USERS...' : '-- SELECT REGISTERED USER --'}</option>
                    {unassignedUsers.map(u => (
                      <option key={u.email} value={u.email}>
                        {u.full_name ? `${u.full_name.toUpperCase()} (${u.email})` : u.email}
                      </option>
                    ))}
                  </select>
                  <p className="text-[7px] text-slate-500 font-bold mt-2 uppercase tracking-tight">Users who signed up via the login screen but are not yet authorized.</p>
                </div>
              ) : (
                <div className="p-6 bg-slate-950/50 border border-slate-800/50 rounded-2xl text-center italic space-y-3">
                   <div className="flex flex-col items-center gap-2">
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">No pending auth registrations found.</p>
                     <button 
                       type="button"
                       onClick={getUnassigned}
                       className="text-[7px] font-black text-blue-500 hover:text-white uppercase tracking-[0.2em] transition-all"
                     >
                       [ RE-SCAN AUTH DATABASE ]
                     </button>
                   </div>
                   <p className="text-[7px] text-slate-700 font-bold uppercase tracking-tight leading-relaxed">
                     Ask volunteers to use the "Register" link on the login screen first. <br/>
                     Once they sign up, they will appear here for authorization.
                   </p>
                </div>
              )}

              <div className="space-y-1.5 italic relative">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-1 italic">Full Name</label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={16} />
                  <input value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} placeholder="FULL NAME" required className="w-full bg-slate-950 border border-slate-800 p-4 pl-12 rounded-xl text-xs font-bold text-white outline-none focus:ring-1 focus:ring-blue-500 shadow-inner italic uppercase tracking-widest" />
                </div>
              </div>
              <div className="space-y-1.5 italic relative">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-1 italic">Email Address</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={16} />
                  <input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="name@iub.edu.bd" required className="w-full bg-slate-950 border border-slate-800 p-4 pl-12 rounded-xl text-xs font-bold text-white outline-none focus:ring-1 focus:ring-blue-500 shadow-inner italic uppercase tracking-widest" />
                </div>
              </div>
              <div className="space-y-1.5 italic">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-1 italic">Role</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs font-bold text-white outline-none focus:ring-1 focus:ring-blue-500 shadow-inner italic uppercase tracking-widest appearance-none">
                  <option value="volunteer">Volunteer (Check-in Only)</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
              </div>
            </div>
            <button className="w-full py-4 bg-blue-500 text-slate-950 font-black rounded-xl uppercase tracking-widest shadow-2xl shadow-blue-500/20 active:scale-95 transition-all border-b-4 border-blue-700 italic text-[10px]">ADD STAFF MEMBER</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default OperatorManifest;
