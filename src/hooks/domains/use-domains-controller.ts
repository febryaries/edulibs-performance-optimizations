"use client";

import { DomainsController } from '@/queries/domains-controller';
import { useSupabaseBrowser } from '@/utils/supabase/client';

export function useDomainsController() {
  const supabase = useSupabaseBrowser();
  return new DomainsController(supabase);
}
