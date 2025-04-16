"use client"

import { useState, useRef, useEffect } from "react"
import { X, Search, Check } from "lucide-react"
import { useUsers } from "@/hooks/users/use-users"
import type { UserRow } from "@/queries/users-controller";

interface MultiSelectUserProps {
  value: UserRow[];
  onChange: (users: UserRow[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MultiSelectUser({ value, onChange, placeholder = "Adaugă din listă sau adaugă unul nou", disabled = false }: Omit<MultiSelectUserProps, 'options'>) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pageSize = 100 // Large enough for most use cases

  // Fetch users from the database (paginated, filtered)
  const { data, isLoading } = useUsers({ pageSize, page: 1, search: searchTerm })
  const users: UserRow[] = data?.data || []

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const getInitials = (user: UserRow) => {
    const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  const getRandomColor = (name: string) => {
    const colors = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-red-500", "bg-teal-500"]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  const handleToggleUser = (user: UserRow) => {
    const isSelected = value.some((selectedUser) => selectedUser.id === user.id)
    if (isSelected) {
      onChange(value.filter((selectedUser) => selectedUser.id !== user.id))
    } else {
      onChange([...value, user])
    }
  }

  const handleRemoveUser = (userId: string) => {
    onChange(value.filter((user) => user.id !== userId))
  }

  // Group users by education level
  const groupedUsers: { [level: string]: UserRow[] } = {}
  users.forEach((user) => {
    // If you have a joined education_level, change this accordingly
    // @ts-expect-error: education_level may be joined in some queries
    const level = user.education_level?.name || "Fără nivel"
    if (!groupedUsers[level]) groupedUsers[level] = []
    groupedUsers[level].push(user)
  })

  // Filter users by search term
  const filteredUsers = Object.keys(groupedUsers).reduce<{ [level: string]: UserRow[] }>((acc, level) => {
    acc[level] = groupedUsers[level].filter((user) => {
      const searchTermLower = searchTerm.toLowerCase()
      const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
      return name.toLowerCase().includes(searchTermLower) || (user.email?.toLowerCase().includes(searchTermLower) ?? false)
    })
    return acc
  }, {})

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      {/* Input field */}
      <div
        className="border rounded-md p-2 bg-white cursor-text flex items-center flex-wrap gap-1 min-h-[44px]"
        onClick={() => !disabled && setIsOpen(true)}
      >
        {!isOpen && value.length > 0 ? (
          // Show selected users when closed
          <>
            {value.map((user) => (
              <div key={user.id} className="flex items-center gap-2 bg-gray-100 rounded-md pl-2 pr-1 py-1">
                <div
                  className={`w-6 h-6 rounded-full ${getRandomColor(user.username)} flex items-center justify-center text-white text-xs font-medium`}
                >
                  {getInitials(user)}
                </div>
                <span className="text-sm">{user.email}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveUser(user.id)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={disabled}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <input
              type="text"
              className="flex-1 min-w-[120px] outline-none text-sm"
              placeholder={placeholder}
              onClick={() => setIsOpen(true)}
              readOnly
              disabled={disabled}
            />
          </>
        ) : (
          // Show search input when open
          <div className="flex items-center w-full">
            <Search size={16} className="text-gray-400 mr-2" />
            <input
              type="text"
              className="flex-1 outline-none text-sm"
              placeholder="Căutare"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus={isOpen}
              disabled={disabled}
            />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-80 overflow-auto">
          {Object.keys(filteredUsers).map((level) =>
            filteredUsers[level].length > 0 ? (
              <div className="p-2" key={level}>
                <div className="flex items-center gap-1 text-xs font-medium text-gray-500 px-2 py-1">
                  <div className="w-1 h-1 rounded-full bg-gray-500"></div>
                  <span>{level}</span>
                </div>
                <div className="space-y-1 mt-1">
                  {filteredUsers[level].map((user) => {
                    const isSelected = value.some((selectedUser) => selectedUser.id === user.id)
                    return (
                      <button
                        key={user.id}
                        type="button"
                        className="flex items-center gap-3 w-full p-2 hover:bg-gray-100 rounded-md text-left"
                        onClick={() => handleToggleUser(user)}
                      >
                        <div className="flex items-center justify-center w-5">
                          {isSelected ? (
                            <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center">
                              <Check size={12} className="text-white" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 border border-gray-300 rounded"></div>
                          )}
                        </div>
                        <div
                          className={`w-8 h-8 rounded-full ${getRandomColor(user.username)} flex items-center justify-center text-white font-medium`}
                        >
                          {getInitials(user)}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{user.first_name} {user.last_name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null
          )}
          {/* No users found */}
          {Object.values(filteredUsers).every((arr) => arr.length === 0) && (
            <div className="p-4 text-center text-gray-500">Niciun utilizator găsit</div>
          )}
        </div>
      )}
    </div>
  )
}
