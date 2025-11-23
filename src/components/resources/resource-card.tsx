"use client";

import { Resource } from "@/hooks/use-controllers";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Calendar, GraduationCap, Tag } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

interface ResourceCardProps {
  resource: Resource;
  onClick?: () => void;
}

const statusColors = {
  DRAFT: "bg-gray-100 text-gray-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  IN_REVIEW: "bg-yellow-100 text-yellow-800",
  CONFORMABLE: "bg-green-100 text-green-800",
  UNCONFORMABLE: "bg-red-100 text-red-800",
};

const statusLabels = {
  DRAFT: "Ciornă",
  SUBMITTED: "Spre evaluare",
  IN_REVIEW: "În evaluare",
  CONFORMABLE: "Conform",
  UNCONFORMABLE: "Neconform",
};

export function ResourceCard({ resource, onClick }: ResourceCardProps) {
  if (!resource) return null;

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (!firstName && !lastName) return "?";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header: Title + Status */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base line-clamp-2 flex-1">
            {resource.title}
          </h3>
          <Badge
            className={`${
              statusColors[resource.status as keyof typeof statusColors]
            } shrink-0`}
          >
            {statusLabels[resource.status as keyof typeof statusLabels]}
          </Badge>
        </div>

        {/* Discipline + Class */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />
            <span>{resource.discipline?.name || "—"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4" />
            <span>
              Clasa {resource.class?.name?.replace(/^Clasa\s+/i, "") || "—"}
            </span>
          </div>
        </div>

        {/* Competency (if exists) */}
        {resource.specific_competencies &&
          resource.specific_competencies.length > 0 && (
            <div className="flex items-start gap-1.5 text-sm text-gray-600">
              <Tag className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="line-clamp-2">
                {resource.specific_competencies
                  .map((sc: any) => sc.competency?.name)
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </div>
          )}

        {/* Author + Evaluator */}
        <div className="flex items-center gap-4">
          {/* Author */}
          {resource.author && (
            <div className="flex items-center gap-2">
              <Avatar
                size="32"
                variant="01"
                initials={getInitials(
                  resource.author.first_name,
                  resource.author.last_name
                )}
              />
              <span className="text-sm text-gray-600">
                {resource.author.first_name} {resource.author.last_name}
              </span>
            </div>
          )}

          {/* Evaluator (if exists) */}
          {resource.evaluator && (
            <div className="flex items-center gap-2">
              <Avatar
                size="32"
                variant="04"
                initials={getInitials(
                  resource.evaluator.first_name,
                  resource.evaluator.last_name
                )}
              />
              <span className="text-sm text-gray-600">
                {resource.evaluator.first_name} {resource.evaluator.last_name}
              </span>
            </div>
          )}
        </div>

        {/* Date */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>
            {format(new Date(resource.created_at), "d MMM yyyy", {
              locale: ro,
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
