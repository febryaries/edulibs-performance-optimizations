-- Migration: Cached helpers and RLS policy updates for performance
-- Date: 2025-08-14

-- 1) Cached current user id for initplan caching
create or replace function public.current_uid()
returns uuid
language sql
stable
set search_path = public
as $$
  select (select auth.uid());
$$;
revoke all on function public.current_uid() from public;
grant execute on function public.current_uid() to authenticated;

-- 2) Cached role checks that avoid per-row auth.uid() calls
create or replace function public.is_admin_cached()
returns boolean
language sql
stable
set search_path = public
as $$
  select is_admin(public.current_uid());
$$;
revoke all on function public.is_admin_cached() from public;
grant execute on function public.is_admin_cached() to authenticated;

create or replace function public.is_moderator_cached()
returns boolean
language sql
stable
set search_path = public
as $$
  select is_moderator(public.current_uid());
$$;
revoke all on function public.is_moderator_cached() from public;
grant execute on function public.is_moderator_cached() to authenticated;

create or replace function public.is_evaluator_cached()
returns boolean
language sql
stable
set search_path = public
as $$
  select is_evaluator(public.current_uid());
$$;
revoke all on function public.is_evaluator_cached() from public;
grant execute on function public.is_evaluator_cached() to authenticated;

create or replace function public.is_formator_cached()
returns boolean
language sql
stable
set search_path = public
as $$
  select is_formator(public.current_uid());
$$;
revoke all on function public.is_formator_cached() from public;
grant execute on function public.is_formator_cached() to authenticated;

create or replace function public.is_student_cached()
returns boolean
language sql
stable
set search_path = public
as $$
  select is_student(public.current_uid());
$$;
revoke all on function public.is_student_cached() from public;
grant execute on function public.is_student_cached() to authenticated;

-- 3) SECURITY DEFINER helper to check resource ownership by current user
create or replace function public.is_resource_owned_by_current_user(p_resource_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.resources r
    where r.id = p_resource_id
      and r.author_id = public.current_uid()
  );
$$;
revoke all on function public.is_resource_owned_by_current_user(uuid) from public;
grant execute on function public.is_resource_owned_by_current_user(uuid) to authenticated;

-- 4) Update resource_competency policies to use cached helpers
DO $$
BEGIN
  -- SELECT policy (ensure it uses cached helpers)
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'resource_competency'
      AND policyname = 'Allow Select Resource Competency if Can Access Resource'
  ) THEN
    EXECUTE $SQL$
      ALTER POLICY "Allow Select Resource Competency if Can Access Resource"
      ON public.resource_competency
      USING (
        EXISTS (
          SELECT 1
          FROM public.resources r
          WHERE r.id = resource_competency.resource_id
          AND (
            public.is_admin_cached()
            OR public.is_moderator_cached()
            OR (
              public.is_evaluator_cached()
              AND (
                r.evaluator_id = public.current_uid()
                OR r.id = ANY(public.user_evaluated_resource_ids())
              )
            )
            OR (
              public.is_formator_cached()
              AND is_resource_in_formator_group(public.current_uid(), r.author_id)
            )
            OR (
              public.is_student_cached()
              AND r.author_id = public.current_uid()
            )
          )
        )
      );
    $SQL$;
  END IF;

  -- Student INSERT policy
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'resource_competency'
      AND policyname = 'Student Insert Owned Resource Competency'
  ) THEN
    EXECUTE $SQL$
      ALTER POLICY "Student Insert Owned Resource Competency"
      ON public.resource_competency
      WITH CHECK (
        public.is_student_cached()
        AND public.is_resource_owned_by_current_user(resource_id)
      );
    $SQL$;
  END IF;

  -- Student UPDATE policy
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'resource_competency'
      AND policyname = 'Student Update Owned Resource Competency'
  ) THEN
    EXECUTE $SQL$
      ALTER POLICY "Student Update Owned Resource Competency"
      ON public.resource_competency
      USING (
        public.is_student_cached()
        AND public.is_resource_owned_by_current_user(resource_id)
      )
      WITH CHECK (
        public.is_student_cached()
        AND public.is_resource_owned_by_current_user(resource_id)
      );
    $SQL$;
  END IF;

  -- Student DELETE policy
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'resource_competency'
      AND policyname = 'Student Delete Owned Resource Competency'
  ) THEN
    EXECUTE $SQL$
      ALTER POLICY "Student Delete Owned Resource Competency"
      ON public.resource_competency
      USING (
        public.is_student_cached()
        AND public.is_resource_owned_by_current_user(resource_id)
      );
    $SQL$;
  END IF;
END $$;
