"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

interface GroupMemberCardProps {
  member: any;
  onClick?: () => void;
}

export function GroupMemberCard({ member, onClick }: GroupMemberCardProps) {
  if (!member) return null;

  const user = member.user;
  if (!user) return null;

  const firstName = user.first_name || "";
  const lastName = user.last_name || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Unknown";
  const initials = `${firstName?.[0] || ""}${
    lastName?.[0] || ""
  }`.toUpperCase();

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow mb-3"
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header: Avatar + Name */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar
            size="40"
            variant="01"
            initials={initials}
            className="shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{fullName}</h3>
            <p className="text-sm text-gray-600 truncate">{user.email}</p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          {/* Role */}
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Rol:</span>
            <span className="font-medium capitalize">
              {member.role?.toLowerCase() || "N/A"}
            </span>
          </div>

          {/* Date */}
          {member.created_at && (
            <div className="flex items-center justify-between text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Data:</span>
              </div>
              <span>
                {format(new Date(member.created_at), "dd MMM yyyy", {
                  locale: ro,
                })}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
