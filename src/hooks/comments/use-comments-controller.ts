"use client";

import { CommentsController } from '@/queries/comments-controller';
import { useSupabaseBrowser } from '@/utils/supabase/client';

export function useCommentsController() {
  const supabase = useSupabaseBrowser();
  return new CommentsController(supabase);
}
