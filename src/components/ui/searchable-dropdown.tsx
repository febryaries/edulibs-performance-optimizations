"use client"

import { useState, useRef, useEffect } from "react"
import { Check, ChevronDown, Search, Loader2 } from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { QueryController } from "@/lib/query-controller"

export interface Option {
  value: string
  label: string
}

interface ControllerConfig<T> {
  controller: QueryController<T, any>
  valueField: keyof T
  labelField: keyof T
  pageSize?: number
  customFilters?: Array<{
    column: string
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is'
    value: any
  }>
}

interface SearchableDropdownProps<T = any> {
  options?: Option[]
  controller?: ControllerConfig<T>
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  error?: string
  className?: string
  showAvatar?: boolean
  disabled?: boolean
}

export function SearchableDropdown<T>({ 
  options = [],
  controller,
  value,
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  error,
  className,
  showAvatar = false,
  disabled = false,
}: SearchableDropdownProps<T>) {
  // Refs to prevent re-renders
  const controllerRef = useRef<ControllerConfig<T> | undefined>(controller)
  const optionsRef = useRef<Option[]>(options)
  const initialRenderRef = useRef(true)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // State
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredOptions, setFilteredOptions] = useState<Option[]>([])
  const [controllerOptions, setControllerOptions] = useState<Option[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [cursors, setCursors] = useState<(string | null)[]>([null]) // Track cursors for pagination
  
  // Determine if we're using controller mode
  const isControllerMode = !!controllerRef.current

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

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
    
    // Load controller options on first open
    if (isOpen && isControllerMode && initialRenderRef.current) {
      initialRenderRef.current = false
      loadControllerOptions(1, "")
    }
  }, [isOpen])

  // Handle search term changes
  useEffect(() => {
    if (!isControllerMode) {
      // Client-side filtering for static options
      setFilteredOptions(optionsRef.current.filter((option) => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    } else {
      // Server-side filtering with controller
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        loadControllerOptions(1, searchTerm)
      }, 300) // Debounce search
    }
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm, isControllerMode])

  // Load options from controller
  const loadControllerOptions = async (pageNumber: number, search: string) => {
    if (!controllerRef.current) return
    
    try {
      setLoading(true)
      const { controller, valueField, labelField, pageSize = 10, customFilters = [] } = controllerRef.current
      
      // Create filters for search
      const filters = [...customFilters]
      if (search) {
        filters.push({
          column: labelField as string,
          operator: "ilike" as const,
          value: `%${search}%`,
        })
      }
      
      // Get data from controller with pagination
      const result = await controller.getPaginatedData({
        pageSize,
        cursor: pageNumber > 1 ? (cursors[pageNumber - 1] || undefined) : undefined,
        filters,
      })
      
      // Map controller data to options format
      const mappedOptions = result.data.map(item => ({
        value: String(item[valueField]),
        label: String(item[labelField]),
      }))
      
      // Update state based on results
      if (pageNumber === 1) {
        setControllerOptions(mappedOptions)
        // Reset cursors when starting a new search
        setCursors([null, result.nextCursor])
      } else {
        setControllerOptions(prev => [...prev, ...mappedOptions])
        // Add the next cursor to the array
        setCursors(prev => [...prev, result.nextCursor])
      }
      
      setHasMore(!!result.nextCursor)
      setTotalCount(result.count || 0)
      setPage(pageNumber)
      setLoading(false)
    } catch (error) {
      console.error("Error loading options:", error)
      setLoading(false)
    }
  }

  // Handle scroll to load more options
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!isControllerMode) return
    
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMore && !loading) {
      loadControllerOptions(page + 1, searchTerm)
    }
  }

  const selectedOption = isControllerMode 
    ? controllerOptions.find((option) => option.value === value) || 
      optionsRef.current.find((option) => option.value === value)
    : optionsRef.current.find((option) => option.value === value)

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
    setSearchTerm("")
  }

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  // Determine which options to display
  const displayOptions = isControllerMode ? controllerOptions : filteredOptions

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 border rounded-md cursor-pointer",
          error ? "border-red-500" : "border-gray-300",
          "hover:border-gray-400",
          disabled ? "opacity-50 pointer-events-none" : "",
        )}
        onClick={disabled ? undefined : toggleDropdown}
      >
        {selectedOption ? (
          <div className="flex items-center">
            {showAvatar && (
              <Avatar className="h-6 w-6 mr-2 bg-purple-600 text-white">
                <span className="text-xs">EM</span>
              </Avatar>
            )}
            <span>{selectedOption.label}</span>
          </div>
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </div>

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto" onScroll={handleScroll}>
            {loading && displayOptions.length === 0 ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading...</span>
              </div>
            ) : displayOptions.length === 0 ? (
              <div className="p-2 text-center text-gray-500">No options found</div>
            ) : (
              displayOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100",
                    option.value === value && "bg-gray-100"
                  )}
                  onClick={() => handleSelect(option.value)}
                >
                  <div className="flex items-center">
                    {showAvatar && (
                      <Avatar className="h-6 w-6 mr-2 bg-purple-600 text-white">
                        <span className="text-xs">{option.label.substring(0, 2).toUpperCase()}</span>
                      </Avatar>
                    )}
                    <span>{option.label}</span>
                  </div>
                  {option.value === value && <Check className="h-4 w-4 text-blue-500" />}
                </div>
              ))
            )}
            
            {loading && displayOptions.length > 0 && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
