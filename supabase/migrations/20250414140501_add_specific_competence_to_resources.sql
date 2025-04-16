-- Add specific_competency_id to resources table
ALTER TABLE public.resources 
ADD COLUMN specific_competency_id integer references public.specific_competencies;

-- Add comment for the new columns
COMMENT ON COLUMN public.resources.specific_competency_id IS 'Reference to the specific competence this resource belongs to';
