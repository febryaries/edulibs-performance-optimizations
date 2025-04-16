"use client";

import { ClassesController } from '@/queries/classes-controller';
import { useSupabaseBrowser } from '@/utils/supabase/client';

export function useClassesController() {
  const supabase = useSupabaseBrowser();
  return new ClassesController(supabase);
}
