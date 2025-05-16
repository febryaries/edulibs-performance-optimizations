-- Enable RLS on the resource_competency table
ALTER TABLE public.resource_competency ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- ADMINISTRATOR POLICIES
-- ==========================================

CREATE POLICY "Admin Full Access on Resource Competency"
ON public.resource_competency
FOR ALL
USING (is_admin(auth.uid()));

-- ==========================================
-- MODERATOR, FORMATOR, EVALUATOR POLICIES
-- ==========================================

CREATE POLICY "Allow Select Resource Competency if Can Access Resource"
ON public.resource_competency
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.resources r
    WHERE r.id = resource_competency.resource_id
    AND (
      -- Admins
      is_admin(auth.uid())
      
      -- Moderators can see everything
      OR is_moderator(auth.uid())
      
      -- Evaluators: assigned directly or through evaluations
      OR (
        is_evaluator(auth.uid()) 
        AND (
          r.evaluator_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.resource_evaluations
            WHERE resource_id = r.id
              AND evaluator_id = auth.uid()
          )
        )
      )
      
      -- Formators: can see if resource belongs to group members
      OR (
        is_formator(auth.uid()) 
        AND is_resource_in_formator_group(auth.uid(), r.author_id)
      )
      
      -- Students: if the resource is theirs
      OR (
        is_student(auth.uid())
        AND r.author_id = auth.uid()
      )
    )
  )
);

-- ==========================================
-- STUDENT POLICIES
-- ==========================================

CREATE POLICY "Student Insert Owned Resource Competency"
ON public.resource_competency
FOR INSERT
WITH CHECK (
  is_student(auth.uid()) 
  AND is_resource_owned_by_user(resource_id, auth.uid())
);

CREATE POLICY "Student Update Owned Resource Competency"
ON public.resource_competency
FOR UPDATE
USING (
  is_student(auth.uid()) 
  AND is_resource_owned_by_user(resource_id, auth.uid())
)
WITH CHECK (
  is_student(auth.uid()) 
  AND is_resource_owned_by_user(resource_id, auth.uid())
);

CREATE POLICY "Student Delete Owned Resource Competency"
ON public.resource_competency
FOR DELETE
USING (
  is_student(auth.uid()) 
  AND is_resource_owned_by_user(resource_id, auth.uid())
);