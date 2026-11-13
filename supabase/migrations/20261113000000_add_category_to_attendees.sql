-- Add category column to attendees table
ALTER TABLE public.attendees 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Participant';

-- Create index on category for query performance
CREATE INDEX IF NOT EXISTS idx_attendees_category ON public.attendees(category);
