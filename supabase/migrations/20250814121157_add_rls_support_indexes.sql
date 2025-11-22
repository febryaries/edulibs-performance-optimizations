-- Migration: Add indexes to support RLS predicates and common joins
-- Purpose: Reduce statement timeouts by ensuring policies that touch
--          resource_evaluations, group_resources and related joins are backed by indexes.
-- Date: 2025-08-14

-- Safe drop of an obsolete/mistaken index (column was renamed to author_id)
DO $$
BEGIN
  IF to_regclass('public.resources_user_id_idx') IS NOT NULL THEN
    EXECUTE 'DROP INDEX IF EXISTS public.resources_user_id_idx';
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Do not fail the migration if drop fails
  RAISE NOTICE 'Skipping drop of resources_user_id_idx: %', SQLERRM;
END $$;

-- Indexes for resource_evaluations used in RLS policies and joins
CREATE INDEX IF NOT EXISTS resource_evaluations_resource_id_idx
  ON public.resource_evaluations(resource_id);

CREATE INDEX IF NOT EXISTS resource_evaluations_evaluator_id_idx
  ON public.resource_evaluations(evaluator_id);

-- Composite index can speed EXISTS with both conditions
CREATE INDEX IF NOT EXISTS resource_evaluations_resource_id_evaluator_id_idx
  ON public.resource_evaluations(resource_id, evaluator_id);

COMMENT ON INDEX public.resource_evaluations_resource_id_idx IS 'Supports RLS EXISTS checks joining resources -> resource_evaluations by resource_id';
COMMENT ON INDEX public.resource_evaluations_evaluator_id_idx IS 'Supports RLS checks for evaluator-owned evaluations';
COMMENT ON INDEX public.resource_evaluations_resource_id_evaluator_id_idx IS 'Speeds combined predicates on (resource_id, evaluator_id)';

-- Indexes for group_resources, often used in access checks and joins
CREATE INDEX IF NOT EXISTS group_resources_group_id_idx
  ON public.group_resources(group_id);

CREATE INDEX IF NOT EXISTS group_resources_resource_id_idx
  ON public.group_resources(resource_id);

COMMENT ON INDEX public.group_resources_group_id_idx IS 'Speeds lookups of resources by group in access checks';
COMMENT ON INDEX public.group_resources_resource_id_idx IS 'Speeds lookups of groups by resource in access checks';

-- Ensure join-table for competencies is indexed regardless of singular/plural naming
-- Prefer plural table name, but add IF NOT EXISTS for safety in mixed environments
CREATE INDEX IF NOT EXISTS resource_competencies_resource_id_idx
  ON public.resource_competencies(resource_id);

CREATE INDEX IF NOT EXISTS resource_competencies_specific_competency_id_idx
  ON public.resource_competencies(specific_competency_id);

COMMENT ON INDEX public.resource_competencies_resource_id_idx IS 'Join support index resources <-> resource_competencies (resource_id)';
COMMENT ON INDEX public.resource_competencies_specific_competency_id_idx IS 'Join support index resource_competencies <-> specific_competencies';

-- If a legacy singular table exists, index it as well (no-op if absent)
DO $$
BEGIN
  IF to_regclass('public.resource_competency') IS NOT NULL THEN
    -- Always ensure resource_id index exists
    BEGIN
      EXECUTE 'CREATE INDEX IF NOT EXISTS resource_competency_resource_id_idx ON public.resource_competency(resource_id)';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipping resource_competency_resource_id_idx: %', SQLERRM;
    END;

    -- Some environments have specific_competency_id, others have competency_id
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'resource_competency' 
        AND column_name = 'specific_competency_id'
    ) THEN
      BEGIN
        EXECUTE 'CREATE INDEX IF NOT EXISTS resource_competency_specific_competency_id_idx ON public.resource_competency(specific_competency_id)';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipping resource_competency_specific_competency_id_idx: %', SQLERRM;
      END;
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'resource_competency' 
        AND column_name = 'competency_id'
    ) THEN
      BEGIN
        EXECUTE 'CREATE INDEX IF NOT EXISTS resource_competency_competency_id_idx ON public.resource_competency(competency_id)';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipping resource_competency_competency_id_idx: %', SQLERRM;
      END;
    ELSE
      RAISE NOTICE 'resource_competency has neither specific_competency_id nor competency_id; no competency FK index created.';
    END IF;
  END IF;
END $$;

-- Optional: ensure resources.author_id index exists (already added in a previous migration, but safe to assert)
CREATE INDEX IF NOT EXISTS resources_author_id_idx ON public.resources(author_id);

-- Done
