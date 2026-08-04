import { supabase } from './client';

/**
 * Event Management Service
 */
export const eventService = {
  /**
   * Fetch all registered events sorted by date
   */
  fetchEvents: async () => {
    return supabase.from('events').select('*').order('date', { ascending: false });
  },

  /**
   * Fetch single event details by ID
   */
  fetchEventById: async (id) => {
    return supabase.from('events').select('*').eq('id', id).single();
  },

  /**
   * Create a new event
   */
  createEvent: async (eventData) => {
    return supabase.from('events').insert([eventData]);
  },

  /**
   * Update existing event details
   */
  updateEvent: async (id, updates) => {
    return supabase.from('events').update(updates).eq('id', id);
  },

  /**
   * Delete an event
   */
  deleteEvent: async (id) => {
    return supabase.from('events').delete().eq('id', id);
  }
};

// Named function exports for backwards compatibility
export const fetchEvents = eventService.fetchEvents;
export const fetchEventById = eventService.fetchEventById;
export const createEvent = eventService.createEvent;
export const updateEvent = eventService.updateEvent;
export const deleteEvent = eventService.deleteEvent;
