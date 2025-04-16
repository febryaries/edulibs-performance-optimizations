-- Add discipline_id to resources table
ALTER TABLE public.resources 
ADD COLUMN discipline_id integer REFERENCES public.disciplines(id);

-- Add link column to resources table
ALTER TABLE public.resources 
ADD COLUMN link text;

-- Add comment for the new columns
COMMENT ON COLUMN public.resources.discipline_id IS 'Reference to the discipline this resource belongs to';
COMMENT ON COLUMN public.resources.link IS 'External link to the resource content';
