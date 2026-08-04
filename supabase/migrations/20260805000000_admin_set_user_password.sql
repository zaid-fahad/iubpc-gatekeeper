-- Migration: Add RPC function to allow Admins to set a new password directly for a user
CREATE OR REPLACE FUNCTION public.admin_set_user_password(target_email TEXT, new_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
  -- Check if the calling user is an active admin in public.admins
  IF NOT EXISTS (
    SELECT 1 FROM public.admins a
    WHERE LOWER(TRIM(a.email)) = LOWER(TRIM(auth.jwt() ->> 'email'))
    AND a.role = 'admin' 
    AND a.is_active = true
  ) THEN
    RAISE EXCEPTION 'Access Denied: You must be an active admin to perform direct password resets.';
  END IF;

  -- Validate password length
  IF LENGTH(new_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters long.';
  END IF;

  -- Update encrypted password in auth.users
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = NOW()
  WHERE LOWER(TRIM(email)) = LOWER(TRIM(target_email));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User email % not found in authentication system.', target_email;
  END IF;

  RETURN TRUE;
END;
$$;
