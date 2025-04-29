-- Utility functions for role checks and other database operations

-- Function to check if a user is an administrator
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid) 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.users WHERE id = uid AND role = 'ADMINISTRATOR');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user is a moderator
CREATE OR REPLACE FUNCTION public.is_moderator(uid uuid) 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.users WHERE id = uid AND role = 'MODERATOR');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user is a formator
CREATE OR REPLACE FUNCTION public.is_formator(uid uuid) 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.users WHERE id = uid AND role = 'FORMATOR');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user is an evaluator
CREATE OR REPLACE FUNCTION public.is_evaluator(uid uuid) 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.users WHERE id = uid AND role = 'EVALUATOR');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user is a student
CREATE OR REPLACE FUNCTION public.is_student(uid uuid) 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.users WHERE id = uid AND role = 'STUDENT');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.is_user_owned_by_formator(my_uid uuid, target_uid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    -- User is in a group created by me
    SELECT 1 
    FROM public.group_members gm
    JOIN public.groups g ON g.id = gm.group_id
    WHERE gm.user_id = target_uid AND g.created_by = my_uid
  )
  OR my_uid = target_uid; -- or user is their own profile
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_resource_editable(status text)
RETURNS boolean AS $$
BEGIN
  RETURN status IN ('DRAFT', 'CONFORMABLE', 'UNCONFORMABLE');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.is_resource_in_formator_group(my_uid uuid, resource_author_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.group_members gm
    JOIN public.groups g ON gm.group_id = g.id
    WHERE g.created_by = my_uid
      AND gm.user_id = resource_author_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_evaluator_of_resource(my_uid uuid, resource_id_param uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.resource_evaluations
    WHERE resource_evaluations.resource_id = resource_id_param
      AND evaluator_id = my_uid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_resource_owned_by_user(resource_id uuid, uid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.resources
    WHERE id = resource_id
    AND author_id = uid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_group_owned_by_user(group_id uuid, uid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.groups
    WHERE id = group_id
    AND created_by = uid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_user_member_of_group(group_id_param uuid, uid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_members.group_id = group_id_param
      AND user_id = uid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.can_access_group(group_id_param uuid, uid_param uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.groups
    WHERE id = group_id_param
      AND (
        is_admin(uid_param)
        OR is_moderator(uid_param)
        OR (is_formator(uid_param) AND created_by = uid_param)
        OR (
          is_student(uid_param)
          AND EXISTS (
            SELECT 1
            FROM public.group_members
            WHERE group_members.group_id = group_id_param
              AND group_members.user_id = uid_param
          )
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.is_resource_in_review(resource_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.resources
    WHERE id = resource_id
    AND status = 'IN_REVIEW'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.is_user_assigned_evaluator(resource_id_param uuid, uid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.resources
    WHERE resources.id = resource_id_param
      AND evaluator_id = uid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.is_resource_editable(status public.resource_status)
RETURNS boolean AS $$
BEGIN
  RETURN status IN ('DRAFT', 'CONFORMABLE', 'UNCONFORMABLE');
END;
$$ LANGUAGE plpgsql IMMUTABLE;




-- -- Function to handle new user creation
-- CREATE OR REPLACE FUNCTION public.handle_new_user() 
-- RETURNS trigger AS $$
-- DECLARE
--   existing_user_count INTEGER;
-- BEGIN
--   -- Get the count BEFORE we try to insert
--   SELECT count(*) INTO existing_user_count FROM public.users;
  
--   -- Determine role based on existing users
--   IF existing_user_count = 0 THEN
--     -- First user becomes admin
--     INSERT INTO public.users (id, email, role, status)
--     VALUES (new.id, new.email, 'ADMINISTRATOR', 'ACTIVE');
--   ELSE
--     -- Regular user
--     INSERT INTO public.users (id, email, role, status)
--     VALUES (new.id, new.email, 'STUDENT', 'ACTIVE');
--   END IF;
  
--   RETURN new;
-- EXCEPTION WHEN OTHERS THEN
--   -- Log the error (optional)
--   RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
--   RETURN new; -- still allow the auth.users insert to succeed
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update resource status based on evaluation
CREATE OR REPLACE FUNCTION public.update_resource_status()
RETURNS trigger AS $$
BEGIN
  IF new.status = 'CONFORMABLE' THEN
    UPDATE public.resources SET status = 'CONFORMABLE' WHERE id = new.resource_id;
  ELSIF new.status = 'UNCONFORMABLE' THEN
    UPDATE public.resources SET status = 'UNCONFORMABLE' WHERE id = new.resource_id;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger the function every time a resource evaluation is created or updated
CREATE TRIGGER on_resource_evaluation_change
  AFTER INSERT OR UPDATE ON public.resource_evaluations
  FOR EACH ROW EXECUTE PROCEDURE public.update_resource_status();
