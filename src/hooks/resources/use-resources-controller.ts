"use client";

import { ResourcesController } from '@/queries/resources-controller';
import { useSupabaseBrowser } from '@/utils/supabase/client';

export function useResourcesController() {
  const supabase = useSupabaseBrowser();
  return new ResourcesController(supabase);
}
