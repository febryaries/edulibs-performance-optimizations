"use client";

import { CurricularAreasController } from '@/queries/curricular-areas-controller';
import { useSupabaseBrowser } from '@/utils/supabase/client';

export function useCurricularAreasController() {
  const supabase = useSupabaseBrowser();
  return new CurricularAreasController(supabase);
}
