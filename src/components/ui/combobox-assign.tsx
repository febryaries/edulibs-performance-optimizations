"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface User {
  id: string
  name: string
  email: string
  initials: string
  avatarColor: string
  category: string
}

export interface ComboboxAssignProps {
  users: User[]
  value?: User | null
  onChange?: (value: User | null) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  className?: string
}

export function ComboboxAssign({
  users,
  value,
  onChange,
  placeholder = "Nealocat",
  searchPlaceholder = "Caută utilizator",
  disabled = false,
  className,
}: ComboboxAssignProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Group users by category
  const groupedUsers = React.useMemo(() => {
    const filtered = searchQuery
      ? users.filter(
          (user) =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : users

    return filtered.reduce(
      (acc, user) => {
        if (!acc[user.category]) {
          acc[user.category] = []
        }
        acc[user.category].push(user)
        return acc
      },
      {} as Record<string, User[]>,
    )
  }, [users, searchQuery])

  // Handle click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  // Handle user selection
  const handleSelect = (user: User) => {
    onChange?.(user)
    setOpen(false)
    setSearchQuery("")
  }

  // Handle user removal
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.(null)
  }

  // Focus input when dropdown opens
  React.useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {/* Trigger button - shows either the placeholder or selected user */}
      <div
        className={cn(
          "flex h-10 w-full items-center rounded-t-radius-03 border border-border-default bg-bg-lightest px-3 py-2 text-sm",
          {
            "rounded-radius-03": !open,
            "border-b-0": open,
            "cursor-not-allowed opacity-50": disabled,
          },
        )}
        onClick={() => !disabled && setOpen(!open)}
      >
        {value ? (
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-text-inverted",
                  value.avatarColor,
                )}
              >
                {value.initials}
              </div>
              <span className="font-medium">{value.name}</span>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="ml-2 rounded-full p-1 text-text-lighter hover:bg-bg-light"
              aria-label="Remove selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex w-full items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-light">
              <Search className="h-4 w-4 text-text-lighter" />
            </div>
            <span className="text-text-lighter">{placeholder}</span>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className={cn(
            "absolute z-10 w-full rounded-b-radius-03 border border-t-0 border-border-default bg-bg-lightest shadow-md",
          )}
        >
          {/* Search input */}
          <div className="p-3 border-b border-border-light">
            <input
              ref={inputRef}
              type="text"
              className="w-full px-3 py-2 text-sm border-none outline-none bg-transparent"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* User list */}
          <div className="max-h-[320px] overflow-y-auto">
            {Object.keys(groupedUsers).length === 0 ? (
              <div className="p-4 text-center text-text-lighter">Nu s-au găsit utilizatori</div>
            ) : (
              Object.entries(groupedUsers).map(([category, categoryUsers]) => (
                <div key={category}>
                  {/* Category header */}
                  <div className="sticky top-0 bg-bg-light px-4 py-2 text-sm font-medium text-text-light">
                    {category}
                  </div>

                  {/* Users in this category */}
                  {categoryUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-bg-light cursor-pointer"
                      onClick={() => handleSelect(user)}
                    >
                      <input
                        type="checkbox"
                        checked={value?.id === user.id}
                        onChange={() => {}}
                        className="h-5 w-5 rounded-sm border-border-default text-bg-primary focus:ring-bg-primary"
                      />
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full text-text-inverted",
                          user.avatarColor,
                        )}
                      >
                        {user.initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-sm text-text-lighter">{user.email}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
