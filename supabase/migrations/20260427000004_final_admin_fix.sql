-- 1. Clean up potential legacy naming from failed runs
DROP POLICY IF EXISTS "Public read for auth check" ON public.admins;
DROP POLICY IF EXISTS "Manage admins" ON public.admins;
DROP POLICY IF EXISTS "Only super admins can manage admins" ON public.admins;
DROP POLICY IF EXISTS "Allow select for all admins" ON public.admins;
DROP POLICY IF EXISTS "Allow select for auth check" ON public.admins;
DROP POLICY IF EXISTS "Allow select for all" ON public.admins;
DROP POLICY IF EXISTS "Admins can insert" ON public.admins;
DROP POLICY IF EXISTS "Admins can update" ON public.admins;
DROP POLICY IF EXISTS "Admins can delete" ON public.admins;

-- 2. Data repair
UPDATE public.admins SET role = 'admin' WHERE role IS NULL;
UPDATE public.admins SET is_active = true WHERE is_active IS NULL;

-- 3. Simple SELECT policy (Required for initial login verify)
CREATE POLICY "Select policy" ON public.admins FOR SELECT USING (true);

-- 4. Admin check function (Security Definer avoids recursion)
CREATE OR REPLACE FUNCTION public.check_is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins
    WHERE email = user_email
    AND role = 'admin'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Management policies (Using function)
CREATE POLICY "Admins can insert" ON public.admins FOR INSERT TO authenticated WITH CHECK (check_is_admin(auth.jwt() ->> 'email'));
CREATE POLICY "Admins can update" ON public.admins FOR UPDATE TO authenticated USING (check_is_admin(auth.jwt() ->> 'email'));
CREATE POLICY "Admins can delete" ON public.admins FOR DELETE TO authenticated USING (check_is_admin(auth.jwt() ->> 'email'));
