-- Migration to add additional indexes based on complex query analysis

-- Index on resource_competency.resource_id for optimizing joins
CREATE INDEX IF NOT EXISTS resource_competency_resource_id_idx ON public.resource_competencies(resource_id);

-- Index on resource_competency.specific_competency_id for optimizing joins
CREATE INDEX IF NOT EXISTS resource_competency_specific_competency_id_idx ON public.resource_competencies(specific_competency_id);

-- Index on resources.author_id for optimizing joins with users table
CREATE INDEX IF NOT EXISTS resources_author_id_idx ON public.resources(author_id);

-- Add comments explaining the purpose of these indexes
COMMENT ON INDEX public.resource_competency_resource_id_idx IS 'Index for optimizing joins between resources and resource_competencies';
COMMENT ON INDEX public.resource_competency_specific_competency_id_idx IS 'Index for optimizing joins between resource_competencies and specific_competencies';
COMMENT ON INDEX public.resources_author_id_idx IS 'Index for optimizing joins with users table for author lookups';
