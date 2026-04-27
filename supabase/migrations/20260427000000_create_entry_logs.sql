-- Create entry_logs table
CREATE TABLE IF NOT EXISTS public.entry_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendee_id UUID NOT NULL REFERENCES public.attendees(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    status BOOLEAN NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.entry_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (Allowing authenticated users for now as it's an admin app)
CREATE POLICY "Allow authenticated users to insert logs" 
ON public.entry_logs FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to select logs" 
ON public.entry_logs FOR SELECT 
TO authenticated 
USING (true);
