-- Custom types
CREATE TYPE public.resource_status AS ENUM ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'CONFORMABLE', 'UNCONFORMABLE');
CREATE TYPE public.user_role AS ENUM ('ADMINISTRATOR', 'MODERATOR', 'FORMATOR', 'EVALUATOR', 'STUDENT');
CREATE TYPE public.user_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED','INVITED');
CREATE TYPE public.group_member_role AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
CREATE TYPE public.evaluation_status AS ENUM ('CONFORMABLE', 'UNCONFORMABLE', 'IN_PROGRESS');
CREATE TYPE public.notification_status AS ENUM ('READ', 'UNREAD');

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

-- USERS
CREATE TABLE public.users (
  id            uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  first_name    text,
  last_name     text,
  email         text,
  avatar_url    text,
  role          user_role DEFAULT 'STUDENT'::public.user_role,
  status        user_status DEFAULT 'ACTIVE'::public.user_status,
  education_level_id integer REFERENCES public.educational_levels(id),
  created_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.users IS 'Profile data for each user.';
COMMENT ON COLUMN public.users.id IS 'References the internal Supabase Auth user.';
COMMENT ON COLUMN public.users.education_level_id IS 'Reference to the educational level of the user';



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
  serial_number serial unique,
  title         text NOT NULL,
  description   text,
  url           text,
  type          text,
  is_public     boolean DEFAULT false,
  status        resource_status DEFAULT 'DRAFT'::public.resource_status,
  user_id       uuid REFERENCES public.users NOT NULL,
  author_id     uuid REFERENCES public.users,
  mentor_id     uuid REFERENCES public.users,
  evaluator_id  uuid REFERENCES public.users,
  discipline_id integer REFERENCES public.disciplines,
  specific_competency_id integer REFERENCES public.specific_competencies,
  class_id      integer REFERENCES public.classes,
  link          text,
  durata        text,
  comentarii    text,
  aggregate     text,
  created_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON COLUMN resources.serial_number IS 'Unique sequential number of the resource in the system';
COMMENT ON TABLE public.resources IS 'Educational resources created by users.';
COMMENT ON COLUMN public.resources.discipline_id IS 'Reference to the discipline this resource belongs to';
COMMENT ON COLUMN public.resources.link IS 'External link to the resource content';
COMMENT ON COLUMN public.resources.specific_competency_id IS 'Reference to the specific competence this resource belongs to';
COMMENT ON COLUMN public.resources.class_id IS 'Reference to the class this resource belongs to';
COMMENT ON COLUMN public.resources.aggregate IS 'Aggregated text content for resource search and filtering';
COMMENT ON COLUMN public.resources.evaluator_id IS 'Reference to the evaluator who evaluated this resource';

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
  evaluator_id            uuid references public.users not null,
  concordance_comment     text,
  relevance_comment       text,
  accessibility_comment   text,
  correctness_comment     text,
  value_comment           text,
  quality_comment         text,
  specific_competence_comment text,
  description_comment     text,
  duration_comment        text,
  link_comment            text,
  comment_comment         text,
  feedback                text,
  status                  evaluation_status,
  concordance_ok          boolean default false,
  relevance_ok            boolean default false,
  accessibility_ok        boolean default false,
  correctness_ok          boolean default false,
  value_ok                boolean default false,
  quality_ok              boolean default false,
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
COMMENT ON COLUMN public.resource_evaluations.specific_competence_comment IS 'Comments on the specific competence field';
COMMENT ON COLUMN public.resource_evaluations.description_comment IS 'Comments on the description field';
COMMENT ON COLUMN public.resource_evaluations.duration_comment IS 'Comments on the duration field';
COMMENT ON COLUMN public.resource_evaluations.link_comment IS 'Comments on the link field';
COMMENT ON COLUMN public.resource_evaluations.comment_comment IS 'General comments';
COMMENT ON COLUMN public.resource_evaluations.concordance_ok IS 'Indicates if the resource meets concordance criteria';
COMMENT ON COLUMN public.resource_evaluations.relevance_ok IS 'Indicates if the resource meets relevance criteria';
COMMENT ON COLUMN public.resource_evaluations.accessibility_ok IS 'Indicates if the resource meets accessibility criteria';
COMMENT ON COLUMN public.resource_evaluations.correctness_ok IS 'Indicates if the resource meets correctness criteria';
COMMENT ON COLUMN public.resource_evaluations.value_ok IS 'Indicates if the resource meets value criteria';
COMMENT ON COLUMN public.resource_evaluations.quality_ok IS 'Indicates if the resource meets quality criteria';

ALTER TABLE resource_evaluations DROP CONSTRAINT IF EXISTS resource_evaluations_resource_id_user_id_key;

-- USER FAVORITES
CREATE TABLE public.user_favorites (
  id            serial PRIMARY KEY,
  user_id       uuid REFERENCES public.users NOT NULL,
  resource_id   uuid REFERENCES public.resources NOT NULL,
  created_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, resource_id)
);
COMMENT ON TABLE public.user_favorites IS 'User favorite resources.';

-- Create notifications table
CREATE TABLE public.notifications (
  id            uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  title         text NOT NULL,
  description   text,
  user_id       uuid REFERENCES public.users(id) NOT NULL,
  created_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at    timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  status        notification_status DEFAULT 'UNREAD'::public.notification_status NOT NULL
);

-- Add comments
COMMENT ON TABLE public.notifications IS 'User notifications for system events and updates';
COMMENT ON COLUMN public.notifications.id IS 'Unique identifier for the notification';
COMMENT ON COLUMN public.notifications.title IS 'Short title of the notification';
COMMENT ON COLUMN public.notifications.description IS 'Detailed description of the notification';
COMMENT ON COLUMN public.notifications.user_id IS 'User who should receive this notification';
COMMENT ON COLUMN public.notifications.created_at IS 'Timestamp when the notification was created';
COMMENT ON COLUMN public.notifications.updated_at IS 'Timestamp when the notification was last updated';
COMMENT ON COLUMN public.notifications.status IS 'Status of the notification: READ or UNREAD';

-- Create index on user_id for faster lookups
CREATE INDEX notifications_user_id_idx ON public.notifications(user_id);

-- Create index on status for filtering
CREATE INDEX notifications_status_idx ON public.notifications(status);

-- Create index on created_at for sorting
CREATE INDEX notifications_created_at_idx ON public.notifications(created_at DESC);