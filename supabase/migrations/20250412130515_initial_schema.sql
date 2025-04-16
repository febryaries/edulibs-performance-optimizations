-- Custom types
CREATE TYPE public.resource_status AS ENUM ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'CONFORMABLE', 'UNCONFORMABLE');
CREATE TYPE public.user_role AS ENUM ('ADMINISTRATOR', 'MODERATOR', 'FORMATOR', 'EVALUATOR', 'STUDENT');
CREATE TYPE public.user_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE public.group_member_role AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
CREATE TYPE public.evaluation_status AS ENUM ('CONFORMABLE', 'UNCONFORMABLE');

-- USERS
CREATE TABLE public.users (
  id            uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  username      text NOT NULL,
  first_name    text,
  last_name     text,
  email         text,
  avatar_url    text,
  role          user_role DEFAULT 'STUDENT'::public.user_role,
  status        user_status DEFAULT 'ACTIVE'::public.user_status,
  created_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.users IS 'Profile data for each user.';
COMMENT ON COLUMN public.users.id IS 'References the internal Supabase Auth user.';

-- EDUCATIONAL LEVELS
CREATE TABLE public.educational_levels (
  id            serial PRIMARY KEY,
  name          text NOT NULL UNIQUE,
  parent_id     integer REFERENCES public.educational_levels(id) DEFAULT NULL,
  number        integer NOT NULL,
  created_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.educational_levels IS 'Educational levels like Primary, Secondary, etc.';

-- CLASSES
CREATE TABLE public.classes (
  id            serial PRIMARY KEY,
  name          text NOT NULL,
  level_id      integer NOT NULL REFERENCES public.educational_levels(id),
  number        integer NOT NULL,
  created_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.classes IS 'School classes/grades.';

-- CURRICULAR AREAS
CREATE TABLE public.curricular_areas (
  id            serial PRIMARY KEY,
  name          text NOT NULL UNIQUE,
  created_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.curricular_areas IS 'Curricular areas grouping disciplines.';

-- DOMAINS
CREATE TABLE public.domains (
  id            serial PRIMARY KEY,
  name          text NOT NULL UNIQUE,
  created_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.domains IS 'Knowledge domains.';

-- DISCIPLINES
CREATE TABLE public.disciplines (
  id            serial PRIMARY KEY,
  name          text NOT NULL,
  domain_id     integer REFERENCES public.domains(id),
  created_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.disciplines IS 'Academic disciplines/subjects.';

-- DISCIPLINE_CLASS
CREATE TABLE public.discipline_class (
  id            serial PRIMARY KEY,
  code          text,
  area_id       integer NOT NULL REFERENCES public.curricular_areas(id),
  class_id      integer NOT NULL REFERENCES public.classes(id),
  discipline_id integer NOT NULL REFERENCES public.disciplines(id),
  created_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(class_id, discipline_id)
);
COMMENT ON TABLE public.discipline_class IS 'Relationship between disciplines and classes.';

-- GENERAL COMPETENCIES
CREATE TABLE public.general_competencies (
  id            serial PRIMARY KEY,
  name          text NOT NULL,
  discipline_id integer NOT NULL REFERENCES public.disciplines(id),
  level_id      integer NOT NULL REFERENCES public.educational_levels(id),
  number        integer NOT NULL,
  created_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.general_competencies IS 'General competencies for each discipline.';

-- SPECIFIC COMPETENCIES
create table public.specific_competencies (
  id            serial primary key,
  name          text not null,
  class_id      integer not null references public.classes(id),
  competency_id integer not null references public.general_competencies(id),
  number        text,
  internal_code text,
  created_at    timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at    timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table public.specific_competencies is 'Specific competencies for each general competency.';

-- RESOURCES
CREATE TABLE public.resources (
  id            uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  title         text NOT NULL,
  description   text,
  url           text,
  type          text,
  is_public     boolean DEFAULT false,
  status        resource_status DEFAULT 'DRAFT'::public.resource_status,
  user_id       uuid REFERENCES public.users NOT NULL,
  author_id     uuid REFERENCES public.users,
  mentor_id     uuid REFERENCES public.users,
  created_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.resources IS 'Educational resources created by users.';

-- RESOURCE_COMPETENCIES
create table public.resource_competencies (
  id                    serial primary key,
  resource_id           uuid references public.resources not null,
  specific_competency_id integer references public.specific_competencies not null,
  created_at            timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at            timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(resource_id, specific_competency_id)
);
comment on table public.resource_competencies is 'Relationship between resources and specific competencies.';

-- RESOURCE TAGS
CREATE TABLE public.resource_tags (
  id            serial PRIMARY KEY,
  resource_id   uuid REFERENCES public.resources NOT NULL,
  tag           text NOT NULL,
  created_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(resource_id, tag)
);
COMMENT ON TABLE public.resource_tags IS 'Tags for resources.';

-- GROUPS
CREATE TABLE public.groups (
  id            uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  name          text NOT NULL,
  description   text,
  created_by    uuid REFERENCES public.users NOT NULL,
  created_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.groups IS 'User groups for collaboration.';

-- GROUP MEMBERS
CREATE TABLE public.group_members (
  id            serial PRIMARY KEY,
  group_id      uuid REFERENCES public.groups NOT NULL,
  user_id       uuid REFERENCES public.users NOT NULL,
  role          group_member_role DEFAULT 'MEMBER'::public.group_member_role,
  created_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(group_id, user_id)
);
COMMENT ON TABLE public.group_members IS 'Members of groups.';

-- GROUP RESOURCES
CREATE TABLE public.group_resources (
  id            serial PRIMARY KEY,
  group_id      uuid REFERENCES public.groups NOT NULL,
  resource_id   uuid REFERENCES public.resources NOT NULL,
  created_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(group_id, resource_id)
);
COMMENT ON TABLE public.group_resources IS 'Resources shared with groups.';

-- COMMENTS
CREATE TABLE public.comments (
  id            uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  content       text NOT NULL,
  resource_id   uuid REFERENCES public.resources NOT NULL,
  user_id       uuid REFERENCES public.users NOT NULL,
  created_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.comments IS 'Comments on resources.';

-- RESOURCE EVALUATIONS
create table public.resource_evaluations (
  id                      uuid default extensions.uuid_generate_v4() primary key,
  resource_id             uuid references public.resources not null,
  user_id                 uuid references public.users not null,
  concordance_comment     text,
  relevance_comment       text,
  accessibility_comment   text,
  correctness_comment     text,
  value_comment           text,
  quality_comment         text,
  feedback                text,
  status                  evaluation_status,
  created_at              timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at              timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(resource_id, user_id)
);
comment on table public.resource_evaluations is 'Detailed evaluations of resources by evaluators.';
comment on column public.resource_evaluations.concordance_comment is 'Comments on alignment with curriculum';
comment on column public.resource_evaluations.relevance_comment is 'Comments on relevance to the subject';
comment on column public.resource_evaluations.accessibility_comment is 'Comments on accessibility to students';
comment on column public.resource_evaluations.correctness_comment is 'Comments on factual correctness';
comment on column public.resource_evaluations.value_comment is 'Comments on educational value';
comment on column public.resource_evaluations.quality_comment is 'Comments on design and presentation quality';
comment on column public.resource_evaluations.status is 'Overall evaluation status (CONFORMABLE or UNCONFORMABLE)';

-- USER FAVORITES
CREATE TABLE public.user_favorites (
  id            serial PRIMARY KEY,
  user_id       uuid REFERENCES public.users NOT NULL,
  resource_id   uuid REFERENCES public.resources NOT NULL,
  created_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, resource_id)
);
COMMENT ON TABLE public.user_favorites IS 'User favorite resources.';

-- Enable Row Level Security on all tables
alter table public.users enable row level security;
alter table public.educational_levels enable row level security;
alter table public.classes enable row level security;
alter table public.curricular_areas enable row level security;
alter table public.domains enable row level security;
alter table public.disciplines enable row level security;
alter table public.discipline_class enable row level security;
alter table public.general_competencies enable row level security;
alter table public.specific_competencies enable row level security;
alter table public.resources enable row level security;
alter table public.resource_competencies enable row level security;
alter table public.resource_tags enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_resources enable row level security;
alter table public.comments enable row level security;
alter table public.resource_evaluations enable row level security;
alter table public.user_favorites enable row level security;


-- Column-level privileges for users table
-- First, revoke the table-level UPDATE privilege from authenticated users
REVOKE UPDATE ON TABLE public.users FROM authenticated;

-- Grant column-level UPDATE privileges for profile fields that users can update themselves
GRANT UPDATE (username, first_name, last_name, avatar_url) ON TABLE public.users TO authenticated;

-- ADMINISTRATOR can update all fields
GRANT UPDATE ON TABLE public.users TO anon, authenticated;

-- FORMATOR can update user roles and status
GRANT UPDATE (role, status) ON TABLE public.users TO authenticated;
