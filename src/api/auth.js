import { supabase } from '../lib/supabase';

export const signUpAdmin = async (email, password) => {
  return supabase.auth.signUp({ email, password });
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

export const addUser = async (userData) => {
  return supabase.from('admins').insert([userData]);
};

export const updateUser = async (email, updates) => {
  return supabase.from('admins').update(updates).eq('email', email);
};

export const removeUser = async (email) => {
  return supabase.from('admins').delete().eq('email', email);
};

export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};
