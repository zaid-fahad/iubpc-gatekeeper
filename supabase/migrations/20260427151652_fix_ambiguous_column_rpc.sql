-- Fix ambiguous column reference by qualifying table names
DROP FUNCTION IF EXISTS public.get_unassigned_auth_users();

CREATE OR REPLACE FUNCTION public.get_unassigned_auth_users()
RETURNS TABLE (email TEXT, full_name TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Check if the calling user is an admin (Qualify column name to avoid ambiguity)
  IF NOT EXISTS (
    SELECT 1 FROM public.admins a
    WHERE LOWER(TRIM(a.email)) = LOWER(TRIM(auth.jwt() ->> 'email'))
    AND a.role = 'admin' 
    AND a.is_active = true
  ) THEN
    RAISE EXCEPTION 'Access Denied: You must be an active admin to perform this action.';
  END IF;

  RETURN QUERY
  SELECT 
    u.email::TEXT,
    COALESCE(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', '')::TEXT as full_name
  FROM auth.users u
  WHERE u.email IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.admins a2
    WHERE LOWER(TRIM(a2.email)) = LOWER(TRIM(u.email))
  )
  ORDER BY u.email ASC;
END;
$$;
