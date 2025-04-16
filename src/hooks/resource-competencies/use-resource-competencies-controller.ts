"use client";

import { ResourceCompetenciesController } from '@/queries/resource-competencies-controller';
import { useSupabaseBrowser } from '@/utils/supabase/client';

export function useResourceCompetenciesController() {
  const supabase = useSupabaseBrowser();
  return new ResourceCompetenciesController(supabase);
}
