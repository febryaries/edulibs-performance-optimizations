-- Migration: Fix resource status trigger to not set UNCONFORMABLE on IN_PROGRESS

-- Drop the old trigger and function if they exist
DROP TRIGGER IF EXISTS on_resource_evaluation_change ON public.resource_evaluations;
DROP FUNCTION IF EXISTS public.update_resource_status;

-- Create new function: only set resource status if evaluation is finalized (CONFORMABLE or UNCONFORMABLE)
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

-- Re-create the trigger
CREATE TRIGGER on_resource_evaluation_change
  AFTER INSERT OR UPDATE ON public.resource_evaluations
  FOR EACH ROW EXECUTE PROCEDURE public.update_resource_status();
