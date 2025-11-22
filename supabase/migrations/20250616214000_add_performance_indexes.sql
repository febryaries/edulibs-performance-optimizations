-- Migration to add performance indexes for resources, users, group_members, and groups tables

-- Resources table indexes
-- Index on user_id for faster lookups of resources by user
CREATE INDEX IF NOT EXISTS resources_user_id_idx ON public.resources(user_id);

-- Index on status for filtering resources by status
CREATE INDEX IF NOT EXISTS resources_status_idx ON public.resources(status);

-- Index on discipline_id for filtering resources by discipline
CREATE INDEX IF NOT EXISTS resources_discipline_id_idx ON public.resources(discipline_id);

-- Index on class_id for filtering resources by class
CREATE INDEX IF NOT EXISTS resources_class_id_idx ON public.resources(class_id);

-- Index on mentor_id for filtering resources by mentor
CREATE INDEX IF NOT EXISTS resources_mentor_id_idx ON public.resources(mentor_id);

-- Index on evaluator_id for filtering resources by evaluator
CREATE INDEX IF NOT EXISTS resources_evaluator_id_idx ON public.resources(evaluator_id);

-- Index on created_at for sorting resources by creation date
CREATE INDEX IF NOT EXISTS resources_created_at_idx ON public.resources(created_at DESC);

-- Full text search index on aggregate field for text search
CREATE INDEX IF NOT EXISTS resources_aggregate_idx ON public.resources USING gin(to_tsvector('romanian', COALESCE(aggregate, '')));

-- Users table indexes
-- Index on role for filtering users by role
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users(role);

-- Index on status for filtering users by status
CREATE INDEX IF NOT EXISTS users_status_idx ON public.users(status);

-- Index on email for searching users by email
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);

-- Combined index on first_name and last_name for name searches
CREATE INDEX IF NOT EXISTS users_name_idx ON public.users(first_name, last_name);

-- Group_members table indexes
-- Index on user_id for faster lookups of group memberships by user
CREATE INDEX IF NOT EXISTS group_members_user_id_idx ON public.group_members(user_id);

-- Index on group_id for faster lookups of members in a group
CREATE INDEX IF NOT EXISTS group_members_group_id_idx ON public.group_members(group_id);

-- Index on role for filtering group members by role
CREATE INDEX IF NOT EXISTS group_members_role_idx ON public.group_members(role);

-- Groups table indexes
-- Index on created_by for filtering groups by creator
CREATE INDEX IF NOT EXISTS groups_created_by_idx ON public.groups(created_by);

-- Index on name for searching groups by name
CREATE INDEX IF NOT EXISTS groups_name_idx ON public.groups(name);

-- Index on created_at for sorting groups by creation date
CREATE INDEX IF NOT EXISTS groups_created_at_idx ON public.groups(created_at DESC);

-- Add comments explaining the purpose of these indexes
COMMENT ON INDEX public.resources_user_id_idx IS 'Index for faster lookups of resources by user';
COMMENT ON INDEX public.resources_status_idx IS 'Index for filtering resources by status';
COMMENT ON INDEX public.resources_discipline_id_idx IS 'Index for filtering resources by discipline';
COMMENT ON INDEX public.resources_class_id_idx IS 'Index for filtering resources by class';
COMMENT ON INDEX public.resources_mentor_id_idx IS 'Index for filtering resources by mentor';
COMMENT ON INDEX public.resources_evaluator_id_idx IS 'Index for filtering resources by evaluator';
COMMENT ON INDEX public.resources_created_at_idx IS 'Index for sorting resources by creation date';
COMMENT ON INDEX public.resources_aggregate_idx IS 'Full text search index on aggregate field';

COMMENT ON INDEX public.users_role_idx IS 'Index for filtering users by role';
COMMENT ON INDEX public.users_status_idx IS 'Index for filtering users by status';
COMMENT ON INDEX public.users_email_idx IS 'Index for searching users by email';
COMMENT ON INDEX public.users_name_idx IS 'Combined index on first_name and last_name for name searches';

COMMENT ON INDEX public.group_members_user_id_idx IS 'Index for faster lookups of group memberships by user';
COMMENT ON INDEX public.group_members_group_id_idx IS 'Index for faster lookups of members in a group';
COMMENT ON INDEX public.group_members_role_idx IS 'Index for filtering group members by role';

COMMENT ON INDEX public.groups_created_by_idx IS 'Index for filtering groups by creator';
COMMENT ON INDEX public.groups_name_idx IS 'Index for searching groups by name';
COMMENT ON INDEX public.groups_created_at_idx IS 'Index for sorting groups by creation date';
