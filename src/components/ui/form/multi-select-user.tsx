"use client"

import { useMemo, useState } from "react"
import { useUsersController, useUsersCrud } from "@/hooks/use-controllers"
import { PaginationParams, QueryFilter } from "@/lib/query-controller"
import { SearchableDropdown } from "@/components/ui/searchable-dropdown"
import { Avatar } from "@/components/ui/avatar"

interface User {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  avatar_url: string | null
  education_level?: {
    name: string
  } | null
}

interface MultiSelectUserProps {
  value: User[];
  onChange: (users: User[]) => void;
  placeholder?: string;
  disabled?: boolean;
  filters?: QueryFilter[]
}

export function MultiSelectUser({ value, onChange, filters, placeholder = "Adaugă din listă sau adaugă unul nou", disabled = false }: Omit<MultiSelectUserProps, 'options'>) {
  const pageSize = 100 // Large enough for most use cases

  // Use the useUsersCrud hook to get the React Query hooks
  const usersController = useUsersController()

  // Custom render function for user items
  const renderUserItem = (user: any, isSelected: boolean) => {
    const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || '';
    const initials = name ? name.charAt(0).toUpperCase() : '?';

    return (
      <div className="flex items-center gap-3 w-full">
        <div className="flex items-center justify-center w-5">
          {isSelected ? (
            <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          ) : (
            <div className="w-4 h-4 border border-gray-300 rounded"></div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Avatar
            size="32"
            src={user.avatar_url}
            alt={name}
            initials={initials}
            variant={user.avatar_url ? "populated" : "empty"}
          />
          <div>
            <div className="text-sm font-medium">{name}</div>
            <div className="text-xs text-gray-500">{user.email}</div>
          </div>
        </div>
      </div>
    );
  };

  const memoizedFilters = useMemo(() => filters, [filters]);

  // // console.log("[LOG] RENDER MULTI USER")

  return (
    <SearchableDropdown
      filterKey="multi-select-users-dropdown"
      fetchHook={(params) => usersController.getPaginatedData(params)}
      placeholder={placeholder}
      valueField="id"
      labelField="email"
      avatarField="avatar_url"
      mode="multiple"
      onChange={onChange as any}
      filters={memoizedFilters}
      value={value}
      disabled={disabled}
      searchColumns={["first_name", "last_name", "email"]}
      pageSize={pageSize}
      renderItem={renderUserItem}
      emptyMessage="Niciun utilizator găsit"
    />
  )
}
