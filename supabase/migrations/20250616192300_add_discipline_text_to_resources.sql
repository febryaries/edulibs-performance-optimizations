-- Migration to add discipline_text field to resources table

-- Step 1: Add discipline_text column to resources table
ALTER TABLE public.resources 
ADD COLUMN discipline_text text;

-- Add comment explaining the field
COMMENT ON COLUMN public.resources.discipline_text IS 'Text representation of the discipline this resource belongs to';
