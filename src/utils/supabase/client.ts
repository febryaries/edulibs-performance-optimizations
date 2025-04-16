import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/utils/database.types';
import type { TypedSupabaseClient } from '@/utils/supabase-types';
import { useMemo } from 'react';

let client: TypedSupabaseClient | undefined;

function getSupabaseBrowserClient() {
  if (client) {
    return client;
  }

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return client;
}

export function useSupabaseBrowser() {
  return useMemo(getSupabaseBrowserClient, []);
}

export const createClient = () => getSupabaseBrowserClient();