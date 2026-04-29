-- Drop the existing function first because we are changing the return type
DROP FUNCTION IF EXISTS public.get_unassigned_auth_users();

-- Re-create get_unassigned_auth_users to return full_name from metadata
CREATE OR REPLACE FUNCTION public.get_unassigned_auth_users()
RETURNS TABLE (email TEXT, full_name TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Check if the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admins 
    WHERE email = auth.jwt() ->> 'email' 
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
  WHERE u.email NOT IN (SELECT a.email FROM public.admins a)
  ORDER BY u.email ASC;
END;
$$;
