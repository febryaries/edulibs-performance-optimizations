-- Migration to replace domain_id with curricular_area_id in disciplines table
-- and drop the domains table

-- Step 1: Add curricular_area_id column to disciplines table
ALTER TABLE public.disciplines 
ADD COLUMN curricular_area_id integer REFERENCES public.curricular_areas(id);

-- Step 2: Copy values from domain_id to curricular_area_id
UPDATE public.disciplines
SET curricular_area_id = domain_id;

-- Step 3: Drop the foreign key constraint on domain_id
ALTER TABLE public.disciplines
DROP CONSTRAINT IF EXISTS disciplines_domain_id_fkey;

-- Step 4: Drop the domain_id column from disciplines
ALTER TABLE public.disciplines
DROP COLUMN domain_id;

-- Step 5: Drop the domains table
DROP TABLE public.domains;

-- Add comment explaining the change
COMMENT ON COLUMN public.disciplines.curricular_area_id IS 'Reference to the curricular area this discipline belongs to (replaced domain_id)';
