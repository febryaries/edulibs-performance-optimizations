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

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, username, email, role)
  VALUES (new.id, new.email, new.email, 'STUDENT');
  
  -- First user becomes admin
  IF (SELECT count(*) FROM auth.users) = 1 THEN
    UPDATE public.users SET role = 'ADMINISTRATOR' WHERE id = new.id;
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = auth, public;

-- Function to update resource status based on evaluation
CREATE OR REPLACE FUNCTION public.update_resource_status() 
RETURNS trigger AS $$
BEGIN
  IF new.status = 'CONFORMABLE' THEN
    UPDATE public.resources SET status = 'CONFORMABLE' WHERE id = new.resource_id;
  ELSE
    UPDATE public.resources SET status = 'UNCONFORMABLE' WHERE id = new.resource_id;
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger the function every time a resource evaluation is created or updated
CREATE TRIGGER on_resource_evaluation_change
  AFTER INSERT OR UPDATE ON public.resource_evaluations
  FOR EACH ROW EXECUTE PROCEDURE public.update_resource_status();
