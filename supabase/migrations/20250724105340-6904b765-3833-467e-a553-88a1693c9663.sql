-- First, remove the overly permissive policies on reports table
DROP POLICY IF EXISTS "Allow public insert" ON public.reports;
DROP POLICY IF EXISTS "Allow public read" ON public.reports;
DROP POLICY IF EXISTS "Allow public update" ON public.reports;

-- Create secure policies that require authentication (for future implementation)
-- For now, we'll allow access only through server-side operations
CREATE POLICY "Allow service role access" ON public.reports
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Restrict public access - only allow reading specific reports by email for now
CREATE POLICY "Allow read by email" ON public.reports
FOR SELECT 
TO anon
USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Fix the function search path issue
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;