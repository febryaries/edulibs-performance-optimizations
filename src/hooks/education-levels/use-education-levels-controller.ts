"use client";

import { EducationLevelsController } from '@/queries/education-levels-controller';
import { useSupabaseBrowser } from '@/utils/supabase/client';

export function useEducationLevelsController() {
  const supabase = useSupabaseBrowser();
  return new EducationLevelsController(supabase);
}
