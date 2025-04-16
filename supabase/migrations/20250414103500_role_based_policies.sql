-- Role-based policies for all tables

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Send "previous data" on change for realtime subscriptions
ALTER TABLE public.users REPLICA IDENTITY FULL;
ALTER TABLE public.resources REPLICA IDENTITY FULL;
ALTER TABLE public.comments REPLICA IDENTITY FULL;
ALTER TABLE public.groups REPLICA IDENTITY FULL;
ALTER TABLE public.resource_evaluations REPLICA IDENTITY FULL;

-- ==========================================
-- ADMINISTRATOR POLICIES
-- ==========================================

-- Admin can do anything on all tables
CREATE POLICY "Allow admin full access to users" ON public.users FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Allow admin full access to resources" ON public.resources FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Allow admin full access to resource_tags" ON public.resource_tags FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Allow admin full access to resource_evaluations" ON public.resource_evaluations FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Allow admin full access to comments" ON public.comments FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Allow admin full access to groups" ON public.groups FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Allow admin full access to group_members" ON public.group_members FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Allow admin full access to group_resources" ON public.group_resources FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Allow admin full access to user_favorites" ON public.user_favorites FOR ALL USING (public.is_admin(auth.uid()));

-- ==========================================
-- MODERATOR POLICIES
-- ==========================================

-- Moderators can view all data
CREATE POLICY "Allow moderator read access to all data" ON public.users FOR SELECT USING (public.is_moderator(auth.uid()));
CREATE POLICY "Allow moderator read access to all resources" ON public.resources FOR SELECT USING (public.is_moderator(auth.uid()));
CREATE POLICY "Allow moderator read access to all resource_tags" ON public.resource_tags FOR SELECT USING (public.is_moderator(auth.uid()));
CREATE POLICY "Allow moderator read access to all resource_evaluations" ON public.resource_evaluations FOR SELECT USING (public.is_moderator(auth.uid()));
CREATE POLICY "Allow moderator read access to all comments" ON public.comments FOR SELECT USING (public.is_moderator(auth.uid()));
CREATE POLICY "Allow moderator read access to all groups" ON public.groups FOR SELECT USING (public.is_moderator(auth.uid()));
CREATE POLICY "Allow moderator read access to all group_members" ON public.group_members FOR SELECT USING (public.is_moderator(auth.uid()));
CREATE POLICY "Allow moderator read access to all group_resources" ON public.group_resources FOR SELECT USING (public.is_moderator(auth.uid()));

-- Moderators can manage resources and comments
CREATE POLICY "Allow moderator to manage resources" ON public.resources FOR UPDATE USING (public.is_moderator(auth.uid()));
CREATE POLICY "Allow moderator to manage comments" ON public.comments FOR ALL USING (public.is_moderator(auth.uid()));

-- ==========================================
-- FORMATOR POLICIES
-- ==========================================

-- FORMATOR can update user roles and status
CREATE POLICY "Allow FORMATOR to update user roles and status" ON public.users 
FOR UPDATE USING (public.is_formator(auth.uid()));

-- FORMATOR can add users
CREATE POLICY "Allow FORMATOR to add users" ON public.users FOR INSERT WITH CHECK (public.is_formator(auth.uid()));

-- FORMATOR can manage groups
CREATE POLICY "Allow FORMATOR to manage groups" ON public.groups FOR ALL USING (public.is_formator(auth.uid()));

-- FORMATOR can manage group members
CREATE POLICY "Allow FORMATOR to manage group members" ON public.group_members FOR ALL USING (public.is_formator(auth.uid()));

-- FORMATOR can view resources created by users in their groups
CREATE POLICY "Allow FORMATOR to view group members' resources" ON public.resources FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND public.is_formator(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.group_members gm1
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid() AND gm2.user_id = resources.user_id
    )
  )
);

-- ==========================================
-- EVALUATOR POLICIES
-- ==========================================

-- EVALUATOR can review any resource
CREATE POLICY "Allow EVALUATOR to create evaluations" ON public.resource_evaluations FOR INSERT WITH CHECK (public.is_evaluator(auth.uid()));
CREATE POLICY "Allow EVALUATOR to update evaluations" ON public.resource_evaluations FOR UPDATE USING (public.is_evaluator(auth.uid()));
CREATE POLICY "Allow EVALUATOR to delete evaluations" ON public.resource_evaluations FOR DELETE USING (public.is_evaluator(auth.uid()));

-- ==========================================
-- STUDENT POLICIES
-- ==========================================

-- Allow users to update their own profile
CREATE POLICY "Allow users to update own profile" ON public.users 
FOR UPDATE USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- Resources policies
CREATE POLICY "Allow read access to public resources" ON public.resources FOR SELECT USING (
  status = 'CONFORMABLE' AND is_public = true
);

CREATE POLICY "Allow read access to own resources" ON public.resources FOR SELECT USING (
  user_id = auth.uid() OR author_id = auth.uid() OR mentor_id = auth.uid()
);

CREATE POLICY "Allow read access to group resources" ON public.resources FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.group_resources gr
    JOIN public.group_members gm ON gr.group_id = gm.group_id
    WHERE gr.resource_id = resources.id AND gm.user_id = auth.uid()
  )
);

-- Allow users to create and manage their own resources
CREATE POLICY "Allow users to create resources" ON public.resources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to update own resources" ON public.resources FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow users to delete own resources" ON public.resources FOR DELETE USING (auth.uid() = user_id);

-- Resource tags policies
CREATE POLICY "Allow read access to resource tags" ON public.resource_tags FOR SELECT USING (true);
CREATE POLICY "Allow insert access to own resource tags" ON public.resource_tags FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.resources WHERE id = resource_id AND user_id = auth.uid() AND status IN ('DRAFT', 'UNCONFORMABLE'))
);
CREATE POLICY "Allow delete access to own resource tags" ON public.resource_tags FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.resources WHERE id = resource_id AND user_id = auth.uid() AND status IN ('DRAFT', 'UNCONFORMABLE'))
);

-- Groups policies
CREATE POLICY "Allow read access to groups" ON public.groups FOR SELECT USING (true);
CREATE POLICY "Allow insert access to groups" ON public.groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Allow update access to own groups" ON public.groups FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Allow delete access to own groups" ON public.groups FOR DELETE USING (auth.uid() = created_by);

-- Group members policies
CREATE POLICY "Allow read access to group members" ON public.group_members FOR SELECT USING (true);
CREATE POLICY "Allow group owners to manage members" ON public.group_members FOR ALL USING (
  EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND created_by = auth.uid())
);
CREATE POLICY "Allow users to leave groups" ON public.group_members FOR DELETE USING (user_id = auth.uid());

-- Group resources policies
CREATE POLICY "Allow read access to group resources" ON public.group_resources FOR SELECT USING (true);
CREATE POLICY "Allow group owners to manage resources" ON public.group_resources FOR ALL USING (
  EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND created_by = auth.uid())
);
CREATE POLICY "Allow resource owners to share with groups" ON public.group_resources FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.resources WHERE id = resource_id AND user_id = auth.uid())
);
CREATE POLICY "Allow resource owners to unshare with groups" ON public.group_resources FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.resources WHERE id = resource_id AND user_id = auth.uid())
);

-- Comments policies
CREATE POLICY "Allow read access to comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Allow insert access to comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow update access to own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow delete access to own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Resource evaluations policies
CREATE POLICY "Allow read access to evaluations" ON public.resource_evaluations FOR SELECT USING (true);

-- User favorites policies
CREATE POLICY "Allow read access to own favorites" ON public.user_favorites FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Allow insert access to own favorites" ON public.user_favorites FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Allow delete access to own favorites" ON public.user_favorites FOR DELETE USING (user_id = auth.uid());

-- ==========================================
-- GENERAL PUBLIC ACCESS POLICIES
-- ==========================================

-- Everyone can read users
CREATE POLICY "Allow read access to all users" ON public.users FOR SELECT USING (true);

-- Everyone can read educational data
CREATE POLICY "Allow read access to educational levels" ON public.educational_levels FOR SELECT USING (true);
CREATE POLICY "Allow read access to classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Allow read access to curricular areas" ON public.curricular_areas FOR SELECT USING (true);
CREATE POLICY "Allow read access to domains" ON public.domains FOR SELECT USING (true);
CREATE POLICY "Allow read access to disciplines" ON public.disciplines FOR SELECT USING (true);
CREATE POLICY "Allow read access to discipline_class" ON public.discipline_class FOR SELECT USING (true);
CREATE POLICY "Allow read access to general competencies" ON public.general_competencies FOR SELECT USING (true);
CREATE POLICY "Allow read access to specific competencies" ON public.specific_competencies FOR SELECT USING (true);
