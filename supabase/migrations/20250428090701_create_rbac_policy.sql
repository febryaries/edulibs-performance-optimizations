-- ==========================================
-- ESTABLISH DEFAULT DENY APPROACH
-- ==========================================

-- Enable Row Level Security on all tables (creates default deny access)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educational_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curricular_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipline_class ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specific_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;


-- Send "previous data" on change for realtime subscriptions
ALTER TABLE public.users REPLICA IDENTITY FULL;
ALTER TABLE public.resources REPLICA IDENTITY FULL;
ALTER TABLE public.comments REPLICA IDENTITY FULL;
ALTER TABLE public.groups REPLICA IDENTITY FULL;
ALTER TABLE public.resource_evaluations REPLICA IDENTITY FULL;

-- ==========================================
-- PUBLIC (UNAUTHENTICATED) POLICIES
-- ==========================================

-- Account creation
CREATE POLICY "Allow public to create first user" ON public.users
  FOR INSERT TO anon
  WITH CHECK (
    NOT EXISTS (SELECT 1 FROM public.users)
  );


-- ==========================================
-- PRIVATE (AUTHENTICATED) POLICIES
-- ==========================================

-- ==========================================
-- TABLE USERS 
-- ==========================================

-- 'ADMINISTRATOR', 
CREATE POLICY "Admin Full Access"
ON public.users
FOR ALL
USING (is_admin(auth.uid()));

-- 'MODERATOR', 
CREATE POLICY "Moderator Read Access"
ON public.users
FOR SELECT
USING (is_moderator(auth.uid()));

CREATE POLICY "Moderator Update Non-Admin Users"
ON public.users
FOR UPDATE
USING (
  is_moderator(auth.uid()) 
  AND public.users.role IS DISTINCT FROM 'ADMINISTRATOR'
)
WITH CHECK (
  is_moderator(auth.uid()) 
  AND public.users.role IS DISTINCT FROM 'ADMINISTRATOR'
);


CREATE POLICY "Moderator Delete Non-Admin Users"
ON public.users
FOR DELETE
USING (
  is_moderator(auth.uid())
  AND public.users.role IS DISTINCT FROM 'ADMINISTRATOR'
);


-- 'FORMATOR', 
-- First, create the policy for formators (full access to all users)
CREATE POLICY "Formator Full Access"
ON public.users
FOR SELECT
USING (
  is_formator(auth.uid())
);

CREATE POLICY "Formator Update Own Profile"
ON public.users
FOR UPDATE
USING (is_formator(auth.uid()) AND id = auth.uid())
WITH CHECK (is_formator(auth.uid()) AND id = auth.uid());


-- 'EVALUATOR', 
CREATE POLICY "Evaluator Read Access"
ON public.users
FOR SELECT
USING (is_evaluator(auth.uid()));

CREATE POLICY "Evaluator Update Own Profile"
ON public.users
FOR UPDATE
USING (is_evaluator(auth.uid()) AND id = auth.uid())
WITH CHECK (is_evaluator(auth.uid()) AND id = auth.uid());

-- 'STUDENT'

CREATE POLICY "Student Read Access"
ON public.users
FOR SELECT
USING (is_student(auth.uid()));

CREATE POLICY "Student Update Own Profile"
ON public.users
FOR UPDATE
USING (is_student(auth.uid()) AND id = auth.uid())
WITH CHECK (is_student(auth.uid()) AND id = auth.uid());



-- ==========================================
-- TABLE EDUCATION LEVELS
-- ==========================================

-- 'ADMINISTRATOR', 

CREATE POLICY "Admin Full Access on Educational Levels"
ON public.educational_levels
FOR ALL
USING (is_admin(auth.uid()));

-- 'MODERATOR', 
-- 'FORMATOR', 
-- 'EVALUATOR', 
-- 'STUDENT'

CREATE POLICY "Read Access for Non-Admin Roles on Educational Levels"
ON public.educational_levels
FOR SELECT
USING (
  is_moderator(auth.uid())
  OR is_formator(auth.uid())
  OR is_evaluator(auth.uid())
  OR is_student(auth.uid())
);


-- ==========================================
-- TABLE CLASSES
-- ==========================================

-- 'ADMINISTRATOR', 

CREATE POLICY "Admin Full Access on Classes"
ON public.classes
FOR ALL
USING (is_admin(auth.uid()));

-- 'MODERATOR', 
-- 'FORMATOR', 
-- 'EVALUATOR', 
-- 'STUDENT'

CREATE POLICY "Read Access for Non-Admin Roles on Classes"
ON public.classes
FOR SELECT
USING (
  is_moderator(auth.uid())
  OR is_formator(auth.uid())
  OR is_evaluator(auth.uid())
  OR is_student(auth.uid())
);


-- ==========================================
-- TABLE CURRICULAR AREAS
-- ==========================================

-- 'ADMINISTRATOR', 

CREATE POLICY "Admin Full Access on Curricular Areas"
ON public.curricular_areas
FOR ALL
USING (is_admin(auth.uid()));

-- 'MODERATOR', 
-- 'FORMATOR', 
-- 'EVALUATOR', 
-- 'STUDENT'

CREATE POLICY "Read Access for Non-Admin Roles on Curricular Areas"
ON public.curricular_areas
FOR SELECT
USING (
  is_moderator(auth.uid())
  OR is_formator(auth.uid())
  OR is_evaluator(auth.uid())
  OR is_student(auth.uid())
);


-- ==========================================
-- TABLE DOMAINS
-- ==========================================

-- 'ADMINISTRATOR', 

CREATE POLICY "Admin Full Access on Domains"
ON public.domains
FOR ALL
USING (is_admin(auth.uid()));

-- 'MODERATOR', 
-- 'FORMATOR', 
-- 'EVALUATOR', 
-- 'STUDENT'

CREATE POLICY "Read Access for Non-Admin Roles on Domains"
ON public.domains
FOR SELECT
USING (
  is_moderator(auth.uid())
  OR is_formator(auth.uid())
  OR is_evaluator(auth.uid())
  OR is_student(auth.uid())
);


-- ==========================================
-- TABLE DISCIPLINES
-- ==========================================

-- 'ADMINISTRATOR', 

CREATE POLICY "Admin Full Access on Disciplines"
ON public.disciplines
FOR ALL
USING (is_admin(auth.uid()));

-- 'MODERATOR', 
-- 'FORMATOR', 
-- 'EVALUATOR', 
-- 'STUDENT'

CREATE POLICY "Read Access for Non-Admin Roles on Disciplines"
ON public.disciplines
FOR SELECT
USING (
  is_moderator(auth.uid())
  OR is_formator(auth.uid())
  OR is_evaluator(auth.uid())
  OR is_student(auth.uid())
);


-- ==========================================
-- TABLE DISCIPLINE-CLASS
-- ==========================================

-- 'ADMINISTRATOR', 

CREATE POLICY "Admin Full Access on Discipline-Class"
ON public.discipline_class
FOR ALL
USING (is_admin(auth.uid()));

-- 'MODERATOR', 
-- 'FORMATOR', 
-- 'EVALUATOR', 
-- 'STUDENT'

CREATE POLICY "Read Access for Non-Admin Roles on Discipline-Class"
ON public.discipline_class
FOR SELECT
USING (
  is_moderator(auth.uid())
  OR is_formator(auth.uid())
  OR is_evaluator(auth.uid())
  OR is_student(auth.uid())
);


-- ==========================================
-- TABLE GENERAL COMPETENCIES
-- ==========================================

-- 'ADMINISTRATOR', 

CREATE POLICY "Admin Full Access on General Competencies"
ON public.general_competencies
FOR ALL
USING (is_admin(auth.uid()));

-- 'MODERATOR', 
-- 'FORMATOR', 
-- 'EVALUATOR', 
-- 'STUDENT'

CREATE POLICY "Read Access for Non-Admin Roles on General Competencies"
ON public.general_competencies
FOR SELECT
USING (
  is_moderator(auth.uid())
  OR is_formator(auth.uid())
  OR is_evaluator(auth.uid())
  OR is_student(auth.uid())
);


-- ==========================================
-- TABLE SPECIFIC COMPETENCIES
-- ==========================================

-- 'ADMINISTRATOR', 

CREATE POLICY "Admin Full Access on Specific Competencies"
ON public.specific_competencies
FOR ALL
USING (is_admin(auth.uid()));

-- 'MODERATOR', 
-- 'FORMATOR', 
-- 'EVALUATOR', 
-- 'STUDENT'

CREATE POLICY "Read Access for Non-Admin Roles on Specific Competencies"
ON public.specific_competencies
FOR SELECT
USING (
  is_moderator(auth.uid())
  OR is_formator(auth.uid())
  OR is_evaluator(auth.uid())
  OR is_student(auth.uid())
);

-- ==========================================
-- TABLE RESOURCES
-- ==========================================

-- 'ADMINISTRATOR', 

CREATE POLICY "Admin Full Access on Resources"
ON public.resources
FOR ALL
USING (is_admin(auth.uid()));

-- 'MODERATOR', 

CREATE POLICY "Moderator Select All Resources"
ON public.resources
FOR SELECT
USING (is_moderator(auth.uid()));

CREATE POLICY "Moderator Update Evaluator ID in Review Resources"
ON public.resources
FOR UPDATE
USING (
  is_moderator(auth.uid())
  AND public.resources.status = 'IN_REVIEW'
)
WITH CHECK (
  is_moderator(auth.uid())
  AND public.resources.status = 'IN_REVIEW'
);


-- 'FORMATOR', 
CREATE POLICY "Formator Select Resources of Owned Groups"
ON public.resources
FOR SELECT
USING (
  is_formator(auth.uid())
  AND is_resource_in_formator_group(auth.uid(), author_id)
);

-- 'EVALUATOR', 
CREATE POLICY "Evaluator Select Assigned Resources"
ON public.resources
FOR SELECT
USING (
  is_evaluator(auth.uid())
  AND (
    evaluator_id = auth.uid()
    OR is_evaluator_of_resource(auth.uid(), id)
  )
);

-- 'STUDENT'
CREATE POLICY "Student Insert Own Resources"
ON public.resources
FOR INSERT
WITH CHECK (is_student(auth.uid()) AND author_id = auth.uid());

CREATE POLICY "Student Select Resources"                
ON public.resources                                     
FOR SELECT                                              
USING (                                                 
  is_student(auth.uid())                                
  AND (                                                 
    public.resources.author_id = auth.uid()             
  )                                                     
);

CREATE POLICY "Student Update Own Editable Resources"
ON public.resources
FOR UPDATE
USING (
  is_student(auth.uid())
  AND (
    public.resources.author_id = auth.uid()
    AND is_resource_editable(public.resources.status) -- Check BEFORE
  )
)
WITH CHECK (
  is_student(auth.uid())
  AND public.resources.author_id = auth.uid() -- Only ownership check AFTER
);


CREATE POLICY "Student Delete Own Editable Resources"
ON public.resources
FOR DELETE
USING (
  is_student(auth.uid())
  AND (
    public.resources.author_id = auth.uid()
    AND is_resource_editable(public.resources.status)
  )
);


-- ==========================================
-- TABLE RESOURCE_COMPETENCIES
-- ==========================================

-- 'ADMINISTRATOR', 

CREATE POLICY "Admin Full Access on Resource Competencies"
ON public.resource_competencies
FOR ALL
USING (is_admin(auth.uid()));

-- 'MODERATOR', 
-- 'FORMATOR', 
-- 'EVALUATOR', 
CREATE POLICY "Allow Select Resource Competencies if Can Access Resource"
ON public.resource_competencies
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.resources r
    WHERE r.id = resource_competencies.resource_id
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
      )
    )
  )
);



-- 'STUDENT'

CREATE POLICY "Student Insert Owned Resource Competencies"
ON public.resource_competencies
FOR INSERT
WITH CHECK (
  is_student(auth.uid()) 
  AND is_resource_owned_by_user(resource_id, auth.uid())
);

CREATE POLICY "Student Update Owned Resource Competencies"
ON public.resource_competencies
FOR UPDATE
USING (
  is_student(auth.uid()) 
  AND is_resource_owned_by_user(resource_id, auth.uid())
)
WITH CHECK (
  is_student(auth.uid()) 
  AND is_resource_owned_by_user(resource_id, auth.uid())
);

CREATE POLICY "Student Delete Owned Resource Competencies"
ON public.resource_competencies
FOR DELETE
USING (
  is_student(auth.uid()) 
  AND is_resource_owned_by_user(resource_id, auth.uid())
);


-- ==========================================
-- TABLE GROUPS
-- ==========================================

-- 'ADMINISTRATOR'
CREATE POLICY "Admin Full Access on Groups"
ON public.groups
FOR ALL
USING (is_admin(auth.uid()));

-- 'MODERATOR'
CREATE POLICY "Moderator Select All Groups"
ON public.groups
FOR SELECT
USING (is_moderator(auth.uid()));

-- 'FORMATOR'
CREATE POLICY "Formator Insert Groups"
ON public.groups
FOR INSERT
WITH CHECK (is_formator(auth.uid()));

CREATE POLICY "Formator Select Own Groups"
ON public.groups
FOR SELECT
USING (
  is_formator(auth.uid())
  AND created_by = auth.uid()
);

CREATE POLICY "Formator Update Own Groups"
ON public.groups
FOR UPDATE
USING (
  is_formator(auth.uid())
  AND created_by = auth.uid()
)
WITH CHECK (
  is_formator(auth.uid())
  AND created_by = auth.uid()
);

CREATE POLICY "Formator Delete Own Groups"
ON public.groups
FOR DELETE
USING (
  is_formator(auth.uid())
  AND created_by = auth.uid()
);

-- 'STUDENT'
CREATE POLICY "Student Select Member Groups"
ON public.groups
FOR SELECT
USING (
  is_student(auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = public.groups.id
      AND gm.user_id = auth.uid()
  )
);

-- ==========================================
-- TABLE GROUP MEMBERS
-- ==========================================

-- 'ADMINISTRATOR'
CREATE POLICY "Admin Full Access on Group Members"
ON public.group_members
FOR ALL
USING (is_admin(auth.uid()));

-- 'MODERATOR'
CREATE POLICY "Moderator Select All Group Members"
ON public.group_members
FOR SELECT
USING (is_moderator(auth.uid()));

-- 'FORMATOR'
CREATE POLICY "Formator Manage Group Members"
ON public.group_members
FOR ALL
USING (
  is_formator(auth.uid())
  AND can_access_group(public.group_members.group_id, auth.uid())
)
WITH CHECK (
  is_formator(auth.uid())
  AND can_access_group(public.group_members.group_id, auth.uid())
);

-- 'STUDENT'
CREATE POLICY "Student Select Own Group Memberships"
ON public.group_members
FOR SELECT
USING (
  is_student(auth.uid())
  AND can_access_group(public.group_members.group_id, auth.uid())
);

-- ==========================================
-- TABLE RESOURCE_EVALUATIONS
-- ==========================================

-- Enable RLS first
ALTER TABLE public.resource_evaluations ENABLE ROW LEVEL SECURITY;

-- 'ADMINISTRATOR'
CREATE POLICY "Admin Full Access on Resource Evaluations"
ON public.resource_evaluations
FOR ALL
USING (is_admin(auth.uid()));

-- 'MODERATOR'
CREATE POLICY "Moderator Select All Resource Evaluations"
ON public.resource_evaluations
FOR SELECT
USING (is_moderator(auth.uid()));

-- 'FORMATOR'
CREATE POLICY "Formator Select Resource Evaluations of Owned Groups"
ON public.resource_evaluations
FOR SELECT
USING (
  is_formator(auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.resources r
    WHERE r.id = resource_evaluations.resource_id
    AND is_resource_in_formator_group(auth.uid(), r.author_id)
  )
);

-- 'EVALUATOR'
CREATE POLICY "Evaluator Select Own Resource Evaluations"
ON public.resource_evaluations
FOR SELECT
USING (
  is_evaluator(auth.uid())
  AND (
    evaluator_id = auth.uid()
    OR is_user_assigned_evaluator(resource_id, auth.uid())
  )
);

CREATE POLICY "Evaluator Insert Resource Evaluations on In Review Resources"
ON public.resource_evaluations
FOR INSERT
WITH CHECK (
  is_evaluator(auth.uid())
  AND is_resource_in_review(resource_id)
  AND is_user_assigned_evaluator(resource_id, auth.uid())
);

CREATE POLICY "Evaluator Update Own Resource Evaluations"
ON public.resource_evaluations
FOR UPDATE
USING (
  is_evaluator(auth.uid())
  AND evaluator_id = auth.uid()
)
WITH CHECK (
  is_evaluator(auth.uid())
  AND evaluator_id = auth.uid()
);

CREATE POLICY "Evaluator Delete Own Resource Evaluations"
ON public.resource_evaluations
FOR DELETE
USING (
  is_evaluator(auth.uid())
  AND evaluator_id = auth.uid()
);

-- 'STUDENT'
CREATE POLICY "Student Select Resource Evaluations for Own Resources"
ON public.resource_evaluations
FOR SELECT
USING (
  is_student(auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.resources r
    WHERE r.id = resource_evaluations.resource_id
    AND r.author_id = auth.uid()
  )
);


-- ==========================================
-- TABLE NOTIFICATIONS
-- ==========================================

-- SELECT their own notifications
CREATE POLICY "User Select Own Notifications"
ON public.notifications
FOR SELECT
USING (
  auth.uid() = user_id
);

-- UPDATE their own notifications
CREATE POLICY "User Update Own Notifications"
ON public.notifications
FOR UPDATE
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);

-- DELETE their own notifications
CREATE POLICY "User Delete Own Notifications"
ON public.notifications
FOR DELETE
USING (
  auth.uid() = user_id
);
