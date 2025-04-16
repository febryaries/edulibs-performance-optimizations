"use client";

import { ResourceEvaluationsController } from '@/queries/resource-evaluations-controller';
import { useSupabaseBrowser } from '@/utils/supabase/client';

export function useResourceEvaluationsController() {
  const supabase = useSupabaseBrowser();
  return new ResourceEvaluationsController(supabase);
}
