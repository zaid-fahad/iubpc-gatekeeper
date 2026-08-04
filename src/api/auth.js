import { supabase } from '../lib/supabase';

export const signUpAdmin = async (email, password, fullName) => {
  return supabase.auth.signUp({ 
    email, 
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  });
};

export const signInAdmin = async (email, password) => {
  return supabase.auth.signInWithPassword({ email, password });
};

export const signOut = async () => {
  return supabase.auth.signOut();
};

export const getSession = async () => {
  return supabase.auth.getSession();
};

export const checkAdminStatus = async (email) => {
  return supabase.from('admins').select('*').eq('email', email).maybeSingle();
};

export const fetchAllUsers = async () => {
  return supabase.from('admins').select('*').order('role', { ascending: true });
};

export const fetchUnassignedUsers = async () => {
  return supabase.rpc('get_unassigned_auth_users');
};

export const addUser = async (userData) => {
  return supabase.from('admins').insert([userData]);
};

export const updateUser = async (email, updates) => {
  return supabase.from('admins').update(updates).eq('email', email);
};

export const removeUser = async (email) => {
  return supabase.from('admins').delete().eq('email', email);
};

export const resetPassword = async (email) => {
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
};

export const adminSetUserPassword = async (email, newPassword) => {
  return supabase.rpc('admin_set_user_password', {
    target_email: email,
    new_password: newPassword
  });
};

export const updateUserPassword = async (newPassword) => {
  return supabase.auth.updateUser({ password: newPassword });
};

export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};
