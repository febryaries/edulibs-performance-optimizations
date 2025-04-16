-- Migration: Remove trigger and function for user creation in users table

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user;
