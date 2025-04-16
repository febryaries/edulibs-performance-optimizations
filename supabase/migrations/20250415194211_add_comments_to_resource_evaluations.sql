-- Migration: Add comment fields to resource_evaluations
ALTER TABLE public.resource_evaluations
  ADD COLUMN specific_competence_comment text,
  ADD COLUMN description_comment text,
  ADD COLUMN duration_comment text,
  ADD COLUMN link_comment text,
  ADD COLUMN comment_comment text;

COMMENT ON COLUMN public.resource_evaluations.specific_competence_comment IS 'Comments on the specific competence field';
COMMENT ON COLUMN public.resource_evaluations.description_comment IS 'Comments on the description field';
COMMENT ON COLUMN public.resource_evaluations.duration_comment IS 'Comments on the duration field';
COMMENT ON COLUMN public.resource_evaluations.link_comment IS 'Comments on the link field';
COMMENT ON COLUMN public.resource_evaluations.comment_comment IS 'General comments';
