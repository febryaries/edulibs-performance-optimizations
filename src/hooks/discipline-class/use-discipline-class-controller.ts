"use client";

import { DisciplineClassController } from '@/queries/discipline-class-controller';
import { useSupabaseBrowser } from '@/utils/supabase/client';

export function useDisciplineClassController() {
  const supabase = useSupabaseBrowser();
  return new DisciplineClassController(supabase);
}
