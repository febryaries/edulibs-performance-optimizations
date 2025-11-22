-- Migration: Group-based resource set helper and policy update
-- Date: 2025-08-14

-- SECURITY DEFINER helper: all resource IDs linked to groups the current user belongs to
create or replace function public.resource_ids_in_user_groups()
returns uuid[]
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(array_agg(gr.resource_id), '{}')
  from public.group_resources gr
  where gr.group_id = ANY(public.user_group_ids());
$$;

revoke all on function public.resource_ids_in_user_groups() from public;
grant execute on function public.resource_ids_in_user_groups() to authenticated;

-- Update the resource_competency SELECT policy to use the fixed resource-id set for group access
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
              AND r.id = ANY(public.resource_ids_in_user_groups())
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
END $$;
