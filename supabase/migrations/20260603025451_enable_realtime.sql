-- Enable Realtime for attendees and entry_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.entry_logs;
