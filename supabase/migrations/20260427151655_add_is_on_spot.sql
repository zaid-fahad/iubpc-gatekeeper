ALTER TABLE public.attendees 
ADD COLUMN IF NOT EXISTS is_on_spot BOOLEAN DEFAULT false;
