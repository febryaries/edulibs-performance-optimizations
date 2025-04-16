-- Add evaluator_id to resource_evaluations table
ALTER TABLE public.resource_evaluations
ADD COLUMN evaluator_id uuid REFERENCES users(id);

COMMENT ON COLUMN public.resource_evaluations.evaluator_id IS 'ID of the evaluator who performed the evaluation';