import { supabase } from '../lib/supabase';

export const fetchEvents = async () => {
  return supabase.from('events').select('*').order('date', { ascending: false });
};

export const createEvent = async (eventData) => {
  return supabase.from('events').insert([eventData]);
};

export const fetchEventById = async (id) => {
  return supabase.from('events').select('*').eq('id', id).single();
};
