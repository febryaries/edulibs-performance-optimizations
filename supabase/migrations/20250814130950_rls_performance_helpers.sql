-- Migration: RLS performance helpers and policy rewrites
-- Date: 2025-08-14

-- 1) Helper functions to avoid per-row heavy joins in RLS
--    SECURITY DEFINER to bypass RLS on referenced tables.
--    STABLE and wrapped (select auth.uid()) to enable initplans.

create or replace function public.user_group_ids()
returns uuid[]
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(array_agg(gm.group_id), '{}')
  from public.group_members gm
  where gm.user_id = (select auth.uid());
$$;

revoke all on function public.user_group_ids() from public;
grant execute on function public.user_group_ids() to authenticated;

create or replace function public.user_evaluated_resource_ids()
returns uuid[]
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(array_agg(re.resource_id), '{}')
  from public.resource_evaluations re
  where re.evaluator_id = (select auth.uid());
$$;

revoke all on function public.user_evaluated_resource_ids() from public;
grant execute on function public.user_evaluated_resource_ids() to authenticated;

-- 2) Rewrite resource_competency SELECT policy to use helpers and cached uid
--    Only if the policy exists (safety across environments)

DO $$
BEGIN
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
            -- Admins
            is_admin((select auth.uid()))

            -- Moderators can see everything
            OR is_moderator((select auth.uid()))

            -- Evaluators: assigned directly or through evaluations
            OR (
              is_evaluator((select auth.uid()))
              AND (
                r.evaluator_id = (select auth.uid())
                OR r.id = ANY(public.user_evaluated_resource_ids())
              )
            )

            -- Formators: can see if resource belongs to group members
            OR (
              is_formator((select auth.uid()))
              AND is_resource_in_formator_group((select auth.uid()), r.author_id)
            )

            -- Students: if the resource is theirs
            OR (
              is_student((select auth.uid()))
              AND r.author_id = (select auth.uid())
            )
          )
        )
      );
    $SQL$;
  END IF;
END $$;
