"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { PaginationParams } from "@/lib/query-controller"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { UsersController } from "@/queries/users-controller"
import { Avatar } from "@/components/ui/avatar"
import { AvatarImage, AvatarFallback } from "@/components/ui/avatar-components"
import { useSupabaseBrowser } from "@/utils/supabase/client"

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
  username: string
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
  // Refs to prevent re-renders
  const initialRenderRef = useRef(true)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // State
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'loadingMore' | 'error'>('idle')
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  
  // Create Supabase client and UsersController
  const supabase = useSupabaseBrowser()
  const usersController = new UsersController(supabase)

  // Initialize on first render
  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false
      if (value) {
        loadUserById(value)
      }
    }
  }, [])

  // Load users when search query changes
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (open) {
      searchTimeoutRef.current = setTimeout(() => {
        setPage(1)
        setUsers([])
        loadUsers(1, searchQuery)
      }, 300) // Debounce search
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, open])

  // Load more users when scrolling
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMore && loadingState !== 'loadingMore') {
      loadUsers(page + 1, searchQuery)
    }
  }

  // Load a single user by ID
  const loadUserById = async (userId: string) => {
    try {
      setLoadingState('loading')
      const user = await usersController.getUserById(userId)
      if (user) {
        setSelectedUser(user)
      }
      setLoadingState('idle')
    } catch (error) {
      console.error("Error loading user:", error)
      setLoadingState('error')
    }
  }

  // Load users with pagination
  const loadUsers = async (pageNumber: number, search: string) => {
    try {
      // Set appropriate loading state
      if (pageNumber === 1) {
        setLoadingState('loading')
      } else {
        setLoadingState('loadingMore')
      }
      
      // Create filters for search
      const filters = []
      if (search) {
        // Search across multiple fields
        filters.push({
          column: "username",
          operator: "ilike" as const,
          value: `%${search}%`,
        })
        
        // Also search by first_name
        filters.push({
          column: "first_name",
          operator: "ilike" as const,
          value: `%${search}%`,
        })
        
        // Also search by last_name
        filters.push({
          column: "last_name",
          operator: "ilike" as const,
          value: `%${search}%`,
        })
        
        // Also search by email
        filters.push({
          column: "email",
          operator: "ilike" as const,
          value: `%${search}%`,
        })
      }

      // Get users with pagination
      const result = await usersController.getUsers({
        pageSize: 10,
        cursor: pageNumber > 1 ? String(pageNumber) : undefined,
        filters,
        searchTerm: search,
        searchColumns: ["username", "first_name", "last_name", "email"]
      })

      // Update state based on results
      if (pageNumber === 1) {
        setUsers(result.data)
      } else {
        setUsers((prev) => [...prev, ...result.data])
      }

      setHasMore(result.data.length === 10)
      setTotalCount(result.count || 0)
      setPage(pageNumber)
      setLoadingState('idle')
    } catch (error) {
      console.error("Error loading users:", error)
      setLoadingState('error')
      
      // Show error in UI but don't reset users if we already have some
      if (users.length === 0) {
        // Set a placeholder error user to show in the UI
        setUsers([{
          id: "error",
          username: "error",
          first_name: null,
          last_name: null,
          email: null,
          avatar_url: null
        }])
      }
    }
  }

  const handleSelect = (user: User) => {
    setSelectedUser(user)
    onChange(user.id)
    setOpen(false)
  }

  const getUserDisplayName = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    return user.username || user.email || "Utilizator necunoscut"
  }

  const getUserInitials = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    }
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase()
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase()
    }
    return "UN"
  }

  const getUserEmail = (user: User) => {
    return user.email || ""
  }

  return (
    <div className="flex flex-col space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between",
              error ? "border-red-500" : "",
              !value && "text-muted-foreground"
            )}
            onClick={() => {
              if (!open && users.length === 0) {
                // Load users on first open
                loadUsers(1, searchQuery);
              }
            }}
          >
            {loadingState === 'loading' && !selectedUser ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <span>Se încarcă...</span>
              </div>
            ) : selectedUser ? (
              <div className="flex items-center gap-2">
                <Avatar size="32">
                  {selectedUser.avatar_url ? (
                    <AvatarImage src={selectedUser.avatar_url} />
                  ) : (
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                      {getUserInitials(selectedUser)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="truncate">{getUserDisplayName(selectedUser)}</span>
              </div>
            ) : (
              placeholder
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[300px]" align="start" sideOffset={5}>
          <Command>
            <CommandInput 
              placeholder="Caută utilizatori..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList onScroll={handleScroll} className="max-h-[300px] overflow-auto">
              <CommandEmpty>
                {loadingState === 'loading' ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : users.length === 1 && users[0].id === "error" ? (
                  <div className="flex flex-col items-center justify-center py-6 px-4">
                    <p className="text-sm text-red-500 mb-2">Eroare la încărcarea utilizatorilor</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => loadUsers(1, searchQuery)}
                      className="text-xs"
                    >
                      încercați din nou
                    </Button>
                  </div>
                ) : (
                  "Nu s-au găsit utilizatori."
                )}
              </CommandEmpty>
              <CommandGroup>
                {users.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.id}
                    onSelect={() => handleSelect(user)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Avatar size="32">
                        {user.avatar_url ? (
                          <AvatarImage src={user.avatar_url} />
                        ) : (
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                            {getUserInitials(user)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{getUserDisplayName(user)}</span>
                        <span className="text-xs text-gray-500">{getUserEmail(user)}</span>
                      </div>
                    </div>
                    {value === user.id && <Check className="ml-auto h-4 w-4" />}
                  </CommandItem>
                ))}
                {loadingState === 'loadingMore' && (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  )
}
