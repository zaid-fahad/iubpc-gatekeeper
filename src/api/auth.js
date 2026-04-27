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
  return supabase.from('admins').select('email').eq('email', email).maybeSingle();
};

export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};
