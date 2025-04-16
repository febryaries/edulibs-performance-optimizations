/**
 * AUTH HOOKS
 * Create an auth hook to add a custom claim to the access token jwt.
 */

-- Create the auth hook function
-- https://supabase.com/docs/guides/auth/auth-hooks#hook-custom-access-token
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
  declare
    claims jsonb;
    user_role public.user_role;  -- Changed from app_role to user_role
  begin
    -- Check if the user is marked as admin in the profiles table
    select role into user_role from public.users where id = (event->>'user_id')::uuid;

    claims := event->'claims';

    if user_role is not null then
      -- Set the claim
      claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role::text));
    else 
      claims := jsonb_set(claims, '{user_role}', '"STUDENT"');
    end if;

    -- Update the 'claims' object in the original event
    event := jsonb_set(event, '{claims}', claims);

    -- Return the modified or original event
    return event;
  end;
$$;

grant usage on schema public to supabase_auth_admin;

grant execute
  on function public.custom_access_token_hook
  to supabase_auth_admin;

revoke execute
  on function public.custom_access_token_hook
  from authenticated, anon;

-- Grant access to the users table instead of user_roles
grant select
  on table public.users
to supabase_auth_admin;

-- Create policy for supabase_auth_admin to access users table
create policy "Allow auth admin to read users" ON public.users
as permissive for select
to supabase_auth_admin
using (true);