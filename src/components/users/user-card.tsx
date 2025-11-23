"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

interface UserCardProps {
  user: any;
  onClick?: () => void;
}

// Helper function to get status styles
function getStatusStyles(status: string): string {
  switch (status.toLowerCase()) {
    case "active":
    case "activ":
      return "bg-green-50 text-green-700 border border-green-200";
    case "inactive":
    case "inactiv":
      return "bg-gray-50 text-gray-700 border border-gray-200";
    case "suspended":
    case "suspendat":
      return "bg-red-50 text-red-700 border border-red-200";
    case "invited":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    default:
      return "bg-gray-50 text-gray-700 border border-gray-200";
  }
}

// Generate color from string
const getColorFromString = (str: string) => {
  const colors = [
    "#4F7FFF",
    "#4CAF50",
    "#FF9800",
    "#E91E63",
    "#9C27B0",
    "#3F51B5",
  ];
  const index = str.charCodeAt(0) % colors.length;
  return colors[index];
};

// Generate initials from name
const getInitials = (
  firstName?: string | null,
  lastName?: string | null,
  email?: string
) => {
  const fullName = `${firstName || ""} ${lastName || ""}`.trim() || email || "";
  return fullName
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export function UserCard({ user, onClick }: UserCardProps) {
  if (!user) return null;

  const firstName = user.first_name || "";
  const lastName = user.last_name || "";
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") || user.email || "Unknown";
  const initials = getInitials(firstName, lastName, user.email);
  const color = getColorFromString(user.id);
  const status = user.status || "activ";
  const role = user.role || "N/A";

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
            style={{ backgroundColor: color }}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{fullName}</h3>
            <p className="text-sm text-gray-600 truncate">{user.email}</p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Status:</span>
            <div
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles(
                status
              )}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
            </div>
          </div>

          {/* Role */}
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Rol:</span>
            <span className="font-medium capitalize">{role.toLowerCase()}</span>
          </div>

          {/* Date */}
          {user.created_at && (
            <div className="flex items-center justify-between text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Data:</span>
              </div>
              <span>
                {format(new Date(user.created_at), "dd MMM yyyy", {
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
