import { createClient } from "@supabase/supabase-js";
import { Database } from "../database.types";

export const createAdminClient = async () => {
  // Use the service role key for admin operations
  // This key should ONLY be used in server-side code
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
};