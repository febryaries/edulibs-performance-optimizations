-- Add missing fields to resources table
ALTER TABLE public.resources
  ADD COLUMN durata text,
  ADD COLUMN comentarii text;

-- Add comments for the new columns
COMMENT ON COLUMN public.resources.durata IS 'Duration of the educational resource';
COMMENT ON COLUMN public.resources.comentarii IS 'Comments about the educational resource';