-- Migration to add indexes for optimizing specific competencies and disciplines queries

-- Indexes for specific_competencies table
CREATE INDEX IF NOT EXISTS specific_competencies_class_id_idx ON public.specific_competencies(class_id);
CREATE INDEX IF NOT EXISTS specific_competencies_competency_id_idx ON public.specific_competencies(competency_id);
CREATE INDEX IF NOT EXISTS specific_competencies_id_idx ON public.specific_competencies(id);

-- Indexes for general_competencies table
CREATE INDEX IF NOT EXISTS general_competencies_discipline_id_idx ON public.general_competencies(discipline_id);
CREATE INDEX IF NOT EXISTS general_competencies_level_id_idx ON public.general_competencies(level_id);

-- Indexes for disciplines table
CREATE INDEX IF NOT EXISTS disciplines_curricular_area_id_idx ON public.disciplines(curricular_area_id);
CREATE INDEX IF NOT EXISTS disciplines_name_idx ON public.disciplines(name);

-- Indexes for classes table
CREATE INDEX IF NOT EXISTS classes_level_id_idx ON public.classes(level_id);

-- Add comments explaining the purpose of these indexes
COMMENT ON INDEX public.specific_competencies_class_id_idx IS 'Index for optimizing joins between specific_competencies and classes';
COMMENT ON INDEX public.specific_competencies_competency_id_idx IS 'Index for optimizing joins between specific_competencies and general_competencies';
COMMENT ON INDEX public.specific_competencies_id_idx IS 'Index for optimizing sorting and filtering by id';

COMMENT ON INDEX public.general_competencies_discipline_id_idx IS 'Index for optimizing joins between general_competencies and disciplines';
COMMENT ON INDEX public.general_competencies_level_id_idx IS 'Index for optimizing joins between general_competencies and educational_levels';

COMMENT ON INDEX public.disciplines_curricular_area_id_idx IS 'Index for optimizing joins between disciplines and curricular_areas';
COMMENT ON INDEX public.disciplines_name_idx IS 'Index for searching disciplines by name';

COMMENT ON INDEX public.classes_level_id_idx IS 'Index for optimizing joins between classes and educational_levels';
