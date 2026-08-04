import { supabase } from './client';

/**
 * Authentication & Staff Administration Service
 */
export const authService = {
  /**
   * Register a new admin/staff user
   */
  signUp: async (email, password, fullName) => {
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
  },

  /**
   * Sign in with email and password
   */
  signIn: async (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  },

  /**
   * Sign out current session
   */
  signOut: async () => {
    return supabase.auth.signOut();
  },

  /**
   * Fetch current active auth session
   */
  getSession: async () => {
    return supabase.auth.getSession();
  },

  /**
   * Check staff/admin authorization role and status
   */
  checkAdminStatus: async (email) => {
    return supabase.from('admins').select('*').eq('email', email).maybeSingle();
  },

  /**
   * Fetch all registered staff operators
   */
  fetchAllUsers: async () => {
    return supabase.from('admins').select('*').order('role', { ascending: true });
  },

  /**
   * Fetch unassigned auth accounts needing role creation
   */
  fetchUnassignedUsers: async () => {
    return supabase.rpc('get_unassigned_auth_users');
  },

  /**
   * Insert new operator into admin database
   */
  addUser: async (userData) => {
    return supabase.from('admins').insert([userData]);
  },

  /**
   * Update operator details
   */
  updateUser: async (email, updates) => {
    return supabase.from('admins').update(updates).eq('email', email);
  },

  /**
   * Remove operator account
   */
  removeUser: async (email) => {
    return supabase.from('admins').delete().eq('email', email);
  },

  /**
   * Send password reset recovery email
   */
  resetPassword: async (email) => {
    let redirectUrl = `${window.location.origin}/login`;
    try {
      const siteUrl = import.meta.env.VITE_SITE_URL;
      if (siteUrl && siteUrl.trim().length > 0) {
        redirectUrl = `${siteUrl.trim().replace(/\/$/, '')}/login`;
      }
    } catch {}

    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
  },

  /**
   * Direct admin password reset via RPC
   */
  adminSetUserPassword: async (email, newPassword) => {
    return supabase.rpc('admin_set_user_password', {
      target_email: email,
      new_password: newPassword
    });
  },

  /**
   * Update password for currently signed-in user
   */
  updateUserPassword: async (newPassword) => {
    return supabase.auth.updateUser({ password: newPassword });
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Named function exports for direct imports and backwards compatibility
export const signUpAdmin = authService.signUp;
export const signInAdmin = authService.signIn;
export const signOut = authService.signOut;
export const getSession = authService.getSession;
export const checkAdminStatus = authService.checkAdminStatus;
export const fetchAllUsers = authService.fetchAllUsers;
export const fetchUnassignedUsers = authService.fetchUnassignedUsers;
export const addUser = authService.addUser;
export const updateUser = authService.updateUser;
export const removeUser = authService.removeUser;
export const resetPassword = authService.resetPassword;
export const adminSetUserPassword = authService.adminSetUserPassword;
export const updateUserPassword = authService.updateUserPassword;
export const onAuthStateChange = authService.onAuthStateChange;
