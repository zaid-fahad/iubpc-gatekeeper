-- Add columns to admins table
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'volunteer' CHECK (role IN ('admin', 'volunteer'));
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing admins to have the 'admin' role
UPDATE public.admins SET role = 'admin' WHERE role IS NULL OR role = 'volunteer';

-- Enable RLS (if not already enabled)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Policies for admins table
-- Allow anyone to select admins (needed for auth check)
CREATE POLICY "Allow select for all admins" ON public.admins FOR SELECT USING (true);

-- Only admins can manage (insert/update/delete) other admins/volunteers
CREATE POLICY "Only super admins can manage admins" 
ON public.admins 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE email = auth.jwt() ->> 'email' 
    AND role = 'admin' 
    AND is_active = true
  )
);
