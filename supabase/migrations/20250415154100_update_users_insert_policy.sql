-- Migration: Update public insert policy for users to allow ADMINISTRATOR only if table is empty

-- Drop the old policy if it exists
DROP POLICY IF EXISTS "Allow public insert to users if not ADMINISTRATOR" ON public.users;

-- Create the updated policy
CREATE POLICY "Allow public insert to users if not ADMINISTRATOR" ON public.users
  FOR INSERT
  TO public
  WITH CHECK (
    role IS DISTINCT FROM 'ADMINISTRATOR'
    OR (
      role = 'ADMINISTRATOR'
      AND NOT EXISTS (SELECT 1 FROM public.users)
    )
  );
