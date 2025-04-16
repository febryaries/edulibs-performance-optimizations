-- Add education_level_id to users table
ALTER TABLE public.users
ADD COLUMN education_level_id integer REFERENCES educational_levels(id);
