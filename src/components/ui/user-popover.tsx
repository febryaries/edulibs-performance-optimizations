"use client";

import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { Avatar } from "./avatar";
import { Button } from "./button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function UserPopover() {
  const { user, logout } = useAuth();
  if (!user) return null;

  // Fallback initials if first/last name missing
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Avatar className="cursor-pointer">
          {initials || user.email?.[0]?.toUpperCase() || "U"}
        </Avatar>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="flex flex-col items-center py-6">
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
          onClick={logout}
        >
          <LogOut className="w-4 h-4 mr-2" /> Deconectează-te
        </Button>
      </PopoverContent>
    </Popover>
  );
}
