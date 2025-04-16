"use client";

import { ResourceTagsController } from '@/queries/resource-tags-controller';
import { useSupabaseBrowser } from '@/utils/supabase/client';

export function useResourceTagsController() {
  const supabase = useSupabaseBrowser();
  return new ResourceTagsController(supabase);
}
