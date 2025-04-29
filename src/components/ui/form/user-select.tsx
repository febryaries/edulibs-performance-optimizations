"use client"

import { useMemo } from "react"
import { Check } from "lucide-react"
import { SearchableDropdown } from "@/components/ui/searchable-dropdown"
import { Avatar } from "@/components/ui/avatar"
import { AvatarImage, AvatarFallback } from "@/components/ui/avatar-components"
import { useUsersCrud } from "@/hooks/use-controllers"
import { QueryFilter } from "@/lib/query-controller"

interface UserSelectProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  required?: boolean
}

interface User {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  avatar_url: string | null
}

export function UserSelect({
  value,
  onChange,
  placeholder = "Selectează un utilizator",
  label,
  error,
  disabled = false,
  required = false,
}: UserSelectProps) {
  // Use the paginated hook from users CRUD
  const { useList } = useUsersCrud();

  const usersFilter: QueryFilter[] = useMemo(() => {
    return [{
      column: 'status',
      operator: 'eq',
      value: "ACTIVE",
    }];
  }, []);

  return (
    <div className="w-full">
      {label && (
        <label className="block mb-1 text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <SearchableDropdown
        useQueryHook={useList}
        value={value}
        onChange={(e) => onChange(e.id)}
        valueField="id"
        labelField="email"
        placeholder={placeholder}
        disabled={disabled}
        error={error}
        searchColumns={[ "first_name", "last_name", "email"]}
        filters={usersFilter}
        renderItem={(user: any, isSelected: boolean) => {
          // Defensive: fallback to empty string for missing fields
          const firstName = user?.first_name ?? "";
          const lastName = user?.last_name ?? "";
          const fullName = [firstName, lastName].filter(Boolean).join(" ") || user.email;
          return (
            <div className="flex items-center gap-2 w-full">
              <Avatar className="h-6 w-6">
                <AvatarImage src={user?.avatar_url || undefined} />
                <AvatarFallback>{fullName ? fullName[0]?.toUpperCase() : "U"}</AvatarFallback>
              </Avatar>
              <span>{fullName}</span>
              <span className="text-xs text-gray-400 ml-1">{user?.email || 'N/A'}</span>
              {isSelected && <Check className="ml-auto h-4 w-4" />}
            </div>
          );
        }}
      />
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}

