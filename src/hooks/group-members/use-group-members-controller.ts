"use client";

import { GroupMembersController } from '@/queries/group-members-controller';
import { useSupabaseBrowser } from '@/utils/supabase/client';

export function useGroupMembersController() {
  const supabase = useSupabaseBrowser();
  return new GroupMembersController(supabase);
}
