"use client";

import { SpecificCompetenciesController } from '@/queries/specific-competencies-controller';
import { useSupabaseBrowser } from '@/utils/supabase/client';

export function useSpecificCompetenciesController() {
  const supabase = useSupabaseBrowser();
  return new SpecificCompetenciesController(supabase);
}
