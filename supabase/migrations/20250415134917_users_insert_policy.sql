-- Allow unauthenticated (anonymous) users to insert rows into the users table
-- Only if they are NOT trying to create an administrator

-- Policy for unauthenticated insert (public)
CREATE POLICY "Allow public insert to users if not ADMINISTRATOR" ON public.users
  FOR INSERT
  TO public
  WITH CHECK (
    role IS DISTINCT FROM 'ADMINISTRATOR'
  );
