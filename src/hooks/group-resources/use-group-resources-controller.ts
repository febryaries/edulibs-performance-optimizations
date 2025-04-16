"use client";

import { GroupResourcesController } from '@/queries/group-resources-controller';
import { useSupabaseBrowser } from '@/utils/supabase/client';

export function useGroupResourcesController() {
  const supabase = useSupabaseBrowser();
  return new GroupResourcesController(supabase);
}
