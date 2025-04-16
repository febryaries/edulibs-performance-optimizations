-- Add specific_competency_id to resources table
ALTER TABLE public.resources 
ADD COLUMN class_id integer references public.classes;

-- Add comment for the new columns
COMMENT ON COLUMN public.resources.class_id IS 'Reference to the class this resource belongs to';
