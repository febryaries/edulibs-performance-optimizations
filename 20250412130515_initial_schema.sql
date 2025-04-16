-- Custom types
create type public.resource_status as enum ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'CONFORMABLE', 'UNCONFORMABLE');
create type public.user_role as enum ('ADMINISTRATOR', 'MODERATOR', 'FORMATOR', 'EVALUATOR', 'STUDENT');
create type public.user_status as enum ('ACTIVE', 'INACTIVE', 'SUSPENDED');
create type public.group_member_role as enum ('OWNER', 'ADMIN', 'MEMBER');
create type public.evaluation_status as enum ('CONFORMABLE', 'UNCONFORMABLE');

-- USERS
create table public.users (
  id            uuid references auth.users not null primary key,
  username      text not null,
  first_name    text,
  last_name     text,
  email         text,
  avatar_url    text,
  role          user_role default 'STUDENT'::public.user_role,
  status        user_status default 'ACTIVE'::public.user_status,
  created_at    timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at    timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table public.users is 'Profile data for each user.';
comment on column public.users.id is 'References the internal Supabase Auth user.';

-- EDUCATIONAL LEVELS
create table public.educational_levels (
  id            serial primary key,
  name          text not null unique,
  parent_id     integer references public.educational_levels(id) default null,
  number        integer not null,
  created_at    timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at    timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table public.educational_levels is 'Educational levels like Primary, Secondary, etc.';

-- CLASSES
create table public.classes (
  id            serial primary key,
  name          text not null,
  level_id      integer not null references public.educational_levels(id),
  number        integer not null,
  created_at    timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at    timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table public.classes is 'School classes/grades.';

-- CURRICULAR AREAS
create table public.curricular_areas (
  id            serial primary key,
  name          text not null unique,
  created_at    timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at    timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table public.curricular_areas is 'Curricular areas grouping disciplines.';

-- DOMAINS
create table public.domains (
  id            serial primary key,
  name          text not null unique,
  created_at    timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at    timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table public.domains is 'Knowledge domains.';

-- DISCIPLINES
create table public.disciplines (
  id            serial primary key,
  name          text not null,
  domain_id     integer references public.domains(id),
  created_at    timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at    timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table public.disciplines is 'Academic disciplines/subjects.';

-- DISCIPLINE_CLASS
create table public.discipline_class (
  id            serial primary key,
  code          text,
  area_id       integer not null references public.curricular_areas(id),
  class_id      integer not null references public.classes(id),
  discipline_id integer not null references public.disciplines(id),
  created_at    timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at    timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(class_id, discipline_id)
);
comment on table public.discipline_class is 'Relationship between disciplines and classes.';

-- GENERAL COMPETENCIES
create table public.general_competencies (
  id            serial primary key,
  name          text not null,
  discipline_id integer not null references public.disciplines(id),
  level_id      integer not null references public.educational_levels(id),
  number        integer not null,
  created_at    timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at    timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table public.general_competencies is 'General competencies for each discipline.';

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
create table public.resources (
  id                uuid default extensions.uuid_generate_v4() primary key,
  title             text not null,
  description       text,
  content           text,
  duration          integer, -- Duration in minutes
  other_aspects     text,
  status            resource_status default 'DRAFT'::public.resource_status,
  user_id           uuid references public.users not null,
  author_id         uuid references public.users,
  mentor_id         uuid references public.users,
  discipline_id     integer references public.disciplines,
  educational_level_id integer references public.educational_levels,
  class_id          integer references public.classes,
  is_public         boolean default false,
  created_at        timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at        timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table public.resources is 'Educational resources created by users.';
comment on column public.resources.duration is 'Duration in minutes';
comment on column public.resources.author_id is 'The author of the resource, if different from the user who created it';
comment on column public.resources.mentor_id is 'The mentor who supervised the resource creation';

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

-- TAGS
create table public.tags (
  id            serial primary key,
  name          text not null unique,
  created_at    timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at    timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table public.tags is 'Tags for resources.';

-- RESOURCE_TAGS
create table public.resource_tags (
  id            serial primary key,
  resource_id   uuid references public.resources not null,
  tag_id        integer references public.tags not null,
  created_at    timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at    timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(resource_id, tag_id)
);
comment on table public.resource_tags is 'Relationship between resources and tags.';

-- GROUPS
create table public.groups (
  id            uuid default extensions.uuid_generate_v4() primary key,
  name          text not null,
  description   text,
  created_by    uuid references public.users not null,
  created_at    timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at    timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table public.groups is 'User groups for collaboration.';

-- GROUP_MEMBERS
create table public.group_members (
  id            serial primary key,
  group_id      uuid references public.groups not null,
  user_id       uuid references public.users not null,
  role          group_member_role default 'MEMBER'::public.group_member_role,
  created_at    timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at    timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(group_id, user_id)
);
comment on table public.group_members is 'Members of groups with their roles.';

-- GROUP_RESOURCES
create table public.group_resources (
  id            serial primary key,
  group_id      uuid references public.groups not null,
  resource_id   uuid references public.resources not null,
  created_at    timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at    timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(group_id, resource_id)
);
comment on table public.group_resources is 'Resources shared with groups.';

-- COMMENTS
create table public.comments (
  id            uuid default extensions.uuid_generate_v4() primary key,
  content       text not null,
  resource_id   uuid references public.resources not null,
  user_id       uuid references public.users not null,
  parent_id     uuid references public.comments,
  created_at    timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at    timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table public.comments is 'Comments on resources.';

-- RESOURCE_EVALUATIONS
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

-- USER_FAVORITES
create table public.user_favorites (
  id            serial primary key,
  user_id       uuid references public.users not null,
  resource_id   uuid references public.resources not null,
  created_at    timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, resource_id)
);
comment on table public.user_favorites is 'Resources marked as favorites by users.';

-- Secure the tables
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
alter table public.tags enable row level security;
alter table public.resource_tags enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_resources enable row level security;
alter table public.comments enable row level security;
alter table public.resource_evaluations enable row level security;
alter table public.user_favorites enable row level security;

-- RLS Policies

-- ADMIN can do anything
create policy "Allow admin full access to all tables" on public.users for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'ADMINISTRATOR')
);

-- Users policies
create policy "Allow read access to all users" on public.users for select using (true);

-- Column-level privileges for users table
-- First, revoke the table-level UPDATE privilege from authenticated users
revoke update on table public.users from authenticated;

-- Grant column-level UPDATE privileges for profile fields that users can update themselves
grant update (username, first_name, last_name, avatar_url) on table public.users to authenticated;

-- ADMINISTRATOR can update all fields
grant update on table public.users to anon, authenticated;

-- FORMATOR can update user roles and status
grant update (role, status) on table public.users to authenticated;
create policy "Allow FORMATOR to update user roles and status" on public.users 
for update to authenticated
using (
  exists (select 1 from public.users where id = auth.uid() and role = 'FORMATOR')
) 
with check (
  exists (select 1 from public.users where id = auth.uid() and role = 'FORMATOR')
);

-- FORMATOR can add users
create policy "Allow FORMATOR to add users" on public.users for insert with check (
  exists (select 1 from public.users where id = auth.uid() and role = 'FORMATOR')
);

-- Everyone can read educational data
create policy "Allow read access to educational levels" on public.educational_levels for select using (true);
create policy "Allow read access to classes" on public.classes for select using (true);
create policy "Allow read access to curricular areas" on public.curricular_areas for select using (true);
create policy "Allow read access to domains" on public.domains for select using (true);
create policy "Allow read access to disciplines" on public.disciplines for select using (true);
create policy "Allow read access to discipline_class" on public.discipline_class for select using (true);
create policy "Allow read access to general competencies" on public.general_competencies for select using (true);
create policy "Allow read access to specific competencies" on public.specific_competencies for select using (true);

-- Resources policies
create policy "Allow read access to public resources" on public.resources for select using (
  status = 'CONFORMABLE' and is_public = true
);

create policy "Allow read access to own resources" on public.resources for select using (
  user_id = auth.uid() or author_id = auth.uid() or mentor_id = auth.uid()
);

create policy "Allow read access to group resources" on public.resources for select using (
  exists (
    select 1 from public.group_resources gr
    join public.group_members gm on gr.group_id = gm.group_id
    where gr.resource_id = resources.id and gm.user_id = auth.uid()
  )
);

-- FORMATOR can view resources created by users in their groups
create policy "Allow FORMATOR to view group members' resources" on public.resources for select using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'FORMATOR'
    and exists (
      select 1 from public.group_members gm1
      join public.group_members gm2 on gm1.group_id = gm2.group_id
      where gm1.user_id = auth.uid() and gm2.user_id = resources.user_id
    )
  )
);

-- EVALUATOR can view any resource
create policy "Allow EVALUATOR to view any resource" on public.resources for select using (
  exists (select 1 from public.users where id = auth.uid() and role = 'EVALUATOR')
);

-- STUDENT can create resources
create policy "Allow any authenticated user to create resources" on public.resources for insert with check (
  auth.uid() = user_id
);

-- Column-level privileges for resources table
-- First, revoke the table-level UPDATE privilege
revoke update on table public.resources from authenticated;

-- Grant column-level UPDATE privileges for fields that resource owners can update in DRAFT state
grant update (title, description, content, duration, other_aspects, discipline_id, educational_level_id, class_id, is_public) 
on table public.resources to authenticated;

-- User can edit resources while in DRAFT
create policy "Allow update access to own draft resources" on public.resources for update using (
  auth.uid() = user_id and status = 'DRAFT'
);

create policy "Allow update access to own unconformable resources" on public.resources for update using (
  auth.uid() = user_id and status = 'UNCONFORMABLE'
);

-- Grant column-level UPDATE privilege for status field
grant update (status) on table public.resources to authenticated;

-- User can delete resources they own
create policy "Allow delete access to own resources" on public.resources for delete using (
  auth.uid() = user_id
);

-- Resource competencies policies
create policy "Allow read access to resource competencies" on public.resource_competencies for select using (true);
create policy "Allow insert access to own resource competencies" on public.resource_competencies for insert with check (
  exists (select 1 from public.resources where id = resource_id and user_id = auth.uid() and status in ('DRAFT', 'UNCONFORMABLE'))
);
create policy "Allow update access to own resource competencies" on public.resource_competencies for update using (
  exists (select 1 from public.resources where id = resource_id and user_id = auth.uid() and status in ('DRAFT', 'UNCONFORMABLE'))
);
create policy "Allow delete access to own resource competencies" on public.resource_competencies for delete using (
  exists (select 1 from public.resources where id = resource_id and user_id = auth.uid() and status in ('DRAFT', 'UNCONFORMABLE'))
);

-- Tags policies
create policy "Allow read access to tags" on public.tags for select using (true);
create policy "Allow insert access to tags" on public.tags for insert with check (auth.role() = 'authenticated');

-- Resource tags policies
create policy "Allow read access to resource tags" on public.resource_tags for select using (true);
create policy "Allow insert access to own resource tags" on public.resource_tags for insert with check (
  exists (select 1 from public.resources where id = resource_id and user_id = auth.uid() and status in ('DRAFT', 'UNCONFORMABLE'))
);
create policy "Allow delete access to own resource tags" on public.resource_tags for delete using (
  exists (select 1 from public.resources where id = resource_id and user_id = auth.uid() and status in ('DRAFT', 'UNCONFORMABLE'))
);

-- Groups policies
create policy "Allow read access to groups" on public.groups for select using (true);

-- FORMATOR can create/update/delete groups
create policy "Allow FORMATOR to manage groups" on public.groups for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'FORMATOR')
);

create policy "Allow insert access to groups" on public.groups for insert with check (auth.uid() = created_by);
create policy "Allow update access to own groups" on public.groups for update using (auth.uid() = created_by);
create policy "Allow delete access to own groups" on public.groups for delete using (auth.uid() = created_by);

-- Group members policies
create policy "Allow read access to group members" on public.group_members for select using (true);

-- FORMATOR can add/delete users from groups
create policy "Allow FORMATOR to manage group members" on public.group_members for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'FORMATOR')
);

create policy "Allow group owners to manage members" on public.group_members for all using (
  exists (select 1 from public.groups where id = group_id and created_by = auth.uid())
);
create policy "Allow users to leave groups" on public.group_members for delete using (user_id = auth.uid());

-- Group resources policies
create policy "Allow read access to group resources" on public.group_resources for select using (true);
create policy "Allow group owners to manage resources" on public.group_resources for all using (
  exists (select 1 from public.groups where id = group_id and created_by = auth.uid())
);
create policy "Allow resource owners to share with groups" on public.group_resources for insert with check (
  exists (select 1 from public.resources where id = resource_id and user_id = auth.uid())
);
create policy "Allow resource owners to unshare with groups" on public.group_resources for delete using (
  exists (select 1 from public.resources where id = resource_id and user_id = auth.uid())
);

-- Comments policies
create policy "Allow read access to comments" on public.comments for select using (true);
create policy "Allow insert access to comments" on public.comments for insert with check (auth.uid() = user_id);
create policy "Allow update access to own comments" on public.comments for update using (auth.uid() = user_id);
create policy "Allow delete access to own comments" on public.comments for delete using (auth.uid() = user_id);

-- Resource evaluations policies
create policy "Allow read access to evaluations" on public.resource_evaluations for select using (true);

-- STUDENT can view reviews of their resources (already covered by "Allow read access to evaluations")

-- EVALUATOR can review any resource
create policy "Allow EVALUATOR to create evaluations" on public.resource_evaluations for insert with check (
  exists (select 1 from public.users where id = auth.uid() and role = 'EVALUATOR')
);
create policy "Allow EVALUATOR to update evaluations" on public.resource_evaluations for update using (
  exists (select 1 from public.users where id = auth.uid() and role = 'EVALUATOR')
);
create policy "Allow EVALUATOR to delete evaluations" on public.resource_evaluations for delete using (
  exists (select 1 from public.users where id = auth.uid() and role = 'EVALUATOR')
);

-- User favorites policies
create policy "Allow read access to own favorites" on public.user_favorites for select using (user_id = auth.uid());
create policy "Allow insert access to own favorites" on public.user_favorites for insert with check (user_id = auth.uid());
create policy "Allow delete access to own favorites" on public.user_favorites for delete using (user_id = auth.uid());

-- Send "previous data" on change for realtime subscriptions
alter table public.users replica identity full;
alter table public.resources replica identity full;
alter table public.comments replica identity full;
alter table public.groups replica identity full;
alter table public.resource_evaluations replica identity full;

-- Function to handle new user creation
create function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.users (id, username, email, role)
  values (new.id, new.email, new.email, 'STUDENT');
  
  -- First user becomes admin
  if (select count(*) from auth.users) = 1 then
    update public.users set role = 'ADMINISTRATOR' where id = new.id;
  end if;
  
  return new;
end;
$$ language plpgsql security definer set search_path = auth, public;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update resource status based on evaluation
create function public.update_resource_status() 
returns trigger as $$
begin
  -- If evaluation status is set to CONFORMABLE, update resource status
  if new.status = 'CONFORMABLE' then
    update public.resources
    set status = 'CONFORMABLE'
    where id = new.resource_id;
  -- If evaluation status is set to UNCONFORMABLE, update resource status
  elsif new.status = 'UNCONFORMABLE' then
    update public.resources
    set status = 'UNCONFORMABLE'
    where id = new.resource_id;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time an evaluation is created or updated
create trigger on_evaluation_status_change
  after insert or update of status on public.resource_evaluations
  for each row execute procedure public.update_resource_status();

-- Set up realtime subscriptions
begin; 
  -- remove the realtime publication
  drop publication if exists supabase_realtime; 

  -- re-create the publication but don't enable it for any tables
  create publication supabase_realtime;  
commit;

-- Add tables to the publication
alter publication supabase_realtime add table public.resources;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.users;
alter publication supabase_realtime add table public.groups;
alter publication supabase_realtime add table public.group_members;
alter publication supabase_realtime add table public.resource_evaluations;