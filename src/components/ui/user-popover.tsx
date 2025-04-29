"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUsersCrud } from "@/hooks/use-controllers";
import { signOutAction } from "@/lib/auth-actions";
import { useTransition } from "react";
import { useSupabaseBrowser } from "@/utils/supabase/client";

export function UserPopover() {
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const supabase = useSupabaseBrowser();
  
  // Always call hooks at the top level, regardless of conditions
  const { useById } = useUsersCrud();
  // Only pass the ID to useById if user exists
  const { data: userData } = useById(user?.id || '');
  
  // Return null after calling all hooks
  if (!user) return null;

  // Create initials and full name
  const initials = `${userData?.first_name?.[0] ?? ""}${userData?.last_name?.[0] ?? ""}`.toUpperCase();
  const fullName = `${userData?.first_name ?? ""} ${userData?.last_name ?? ""}`.trim();

  // Client-side wrapper for the server action
  const handleLogout = () => {
    startTransition(async () => {
      await supabase.auth.signOut({
        scope: 'local'
      });
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Avatar className="cursor-pointer">
          {initials || user.email?.[0]?.toUpperCase() || "U"}
        </Avatar>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0 bg-white">
        <div className="flex flex-col items-center py-6 bg-white">
          <Avatar className="w-16 h-16 text-2xl mb-2">
            {initials || user.email?.[0]?.toUpperCase() || "U"}
          </Avatar>
          <div
            className="mt-1"
            style={{
              fontFamily: 'var(--typography-font-family-body, Inter)',
              fontSize: 'var(--typography-font-size-small, 14px)',
              fontStyle: 'normal',
              fontWeight: 500,
              lineHeight: 'var(--typography-font-line-height-small, 20px)',
              textAlign: 'center',
              wordBreak: 'break-all',
            }}
          >
            {fullName || user.email}
          </div>
          <div
            style={{
              fontFamily: 'var(--typography-font-family-body, Inter)',
              fontSize: 'var(--typography-font-size-x-small, 12px)',
              fontStyle: 'normal',
              fontWeight: 400,
              lineHeight: 'var(--typography-font-line-height-x-small, 16px)',
              color: '#6B7280',
              marginTop: 2,
              textAlign: 'center',
              wordBreak: 'break-all',
            }}
          >
            {user.email}
          </div>
        </div>
        <div className="border-t" />
        <Button
          variant="ghost"
          className="w-full justify-start rounded-none font-medium text-base px-4 py-3"
          onClick={handleLogout}
          disabled={isPending}
        >
          <LogOut className="w-4 h-4 mr-2" /> {isPending ? "Se deconectează..." : "Deconectează-te"}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
