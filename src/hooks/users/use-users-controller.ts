"use client";

import { UsersController } from '@/queries/users-controller';
import { useSupabaseBrowser } from '@/utils/supabase/client';

export function useUsersController() {
  const supabase = useSupabaseBrowser();
  return new UsersController(supabase);
}
