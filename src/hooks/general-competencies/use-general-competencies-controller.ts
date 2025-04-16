"use client";

import { GeneralCompetenciesController } from '@/queries/general-competencies-controller';
import { useSupabaseBrowser } from '@/utils/supabase/client';

export function useGeneralCompetenciesController() {
  const supabase = useSupabaseBrowser();
  return new GeneralCompetenciesController(supabase);
}
