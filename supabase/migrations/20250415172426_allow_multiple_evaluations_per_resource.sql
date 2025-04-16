-- Migration: Allow multiple evaluations per resource by removing unique constraint
ALTER TABLE resource_evaluations DROP CONSTRAINT IF EXISTS resource_evaluations_resource_id_user_id_key;
-- Optionally, you can add a partial unique index if you want to enforce uniqueness only for certain statuses (not done here)
