"use client";

import { GroupsController } from '@/queries/groups-controller';
import { useSupabaseBrowser } from '@/utils/supabase/client';

export function useGroupsController() {
  const supabase = useSupabaseBrowser();
  return new GroupsController(supabase);
}
