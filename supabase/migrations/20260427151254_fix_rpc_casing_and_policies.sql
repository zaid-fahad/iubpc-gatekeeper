-- Ensure we have a select policy for admin checks
DROP POLICY IF EXISTS "Enable read access for all users" ON public.admins;
CREATE POLICY "Enable read access for all users" ON public.admins FOR SELECT USING (true);

-- Update the RPC to handle case-insensitive email matching
DROP FUNCTION IF EXISTS public.get_unassigned_auth_users();

CREATE OR REPLACE FUNCTION public.get_unassigned_auth_users()
RETURNS TABLE (email TEXT, full_name TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Check if the calling user is an admin (Case-insensitive)
  IF NOT EXISTS (
    SELECT 1 FROM public.admins 
    WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')
    AND role = 'admin' 
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Access Denied: You must be an active admin to perform this action.';
  END IF;

  RETURN QUERY
  SELECT 
    u.email::TEXT,
    COALESCE(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', '')::TEXT as full_name
  FROM auth.users u
  WHERE LOWER(u.email) NOT IN (SELECT LOWER(a.email) FROM public.admins a)
  ORDER BY u.email ASC;
END;
$$;
