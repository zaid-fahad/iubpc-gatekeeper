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
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`,
  });
};

export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};
