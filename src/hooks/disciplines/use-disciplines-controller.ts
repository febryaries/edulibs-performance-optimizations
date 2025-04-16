"use client";

import { DisciplinesController } from '@/queries/disciplines-controller';
import { useSupabaseBrowser } from '@/utils/supabase/client';

export function useDisciplinesController() {
  const supabase = useSupabaseBrowser();
  return new DisciplinesController(supabase);
}
