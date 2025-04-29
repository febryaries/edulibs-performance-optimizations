'use client'

import { useState, useEffect, useRef, useCallback } from "react"
import { Check, ChevronDown, Circle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PaginationParams, UsePaginatedHook } from "@/lib/query-controller"

export interface FilterOption {
  value: string
  label: string
}

interface ControllerConfig<T> {
  valueField: keyof T
  labelField: keyof T
  pageSize?: number
}

interface FilterButtonProps<T = any> {
  icon?: React.ReactNode
  label: string
  options?: FilterOption[]
  useQueryHook?: UsePaginatedHook<T>
  controllerConfig?: ControllerConfig<T>
  onChange?: (selectedOptions: string[]) => void
  className?: string
  defaultSelected?: string[]
}

export function FilterButton<T>({
  icon = <Circle className="h-4 w-4 text-gray-400" />,
  label,
  options = [],
  useQueryHook,
  controllerConfig,
  onChange,
  className,
  defaultSelected = [],
}: FilterButtonProps<T>) {
  // Refs to prevent re-renders
  const configRef = useRef<ControllerConfig<T> | undefined>(controllerConfig)
  const optionsRef = useRef<FilterOption[]>(options)
  const initialRenderRef = useRef(true)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const filterRef = useRef<HTMLDivElement>(null)
  const optionsContainerRef = useRef<HTMLDivElement>(null)
  
  // State
  const [isOpen, setIsOpen] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<string[]>(defaultSelected)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredOptions, setFilteredOptions] = useState<FilterOption[]>([])
  const [controllerOptions, setControllerOptions] = useState<FilterOption[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [cursors, setCursors] = useState<(string | null)[]>([null]) // Initialize with null for page 0
  const [paginationParams, setPaginationParams] = useState<PaginationParams>({
    pageSize: controllerConfig?.pageSize || 5,
    cursor: undefined,
    searchTerm: undefined
  })
  
  // Determine if we're using hook mode
  const isHookMode = !!useQueryHook && !!configRef.current
  
  // Use the query hook if provided
  const query = useQueryHook ? useQueryHook(paginationParams) : undefined
  
  // Initialize on first render only
  useEffect(() => {
    if (initialRenderRef.current) {
      setFilteredOptions(optionsRef.current)
      initialRenderRef.current = false
    }
    
    // Cleanup on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])
  
  // Update controller options when query data changes
  useEffect(() => {
    if (!isHookMode || !query?.data) return
    
    try {
      const data = query.data.data || []
      const config = configRef.current
      
      if (!config) return
      
      // Map the data to options with error handling
      const newOptions = data.map(item => {
        try {
          return {
            value: String(item[config.valueField] || ''),
            label: String(item[config.labelField] || '')
          }
        } catch (err) {
          console.warn('Error mapping option:', err)
          return { value: '', label: 'Error' }
        }
      }).filter(option => option.value !== '')

      if (page === 0) {
        // Reset options when on first page
        setControllerOptions(newOptions)
      } else {
        // For subsequent pages, add only unique options
        setControllerOptions(prev => {
          // Create a Set of existing values for O(1) lookup
          const existingValues = new Set(prev.map(option => option.value))
          // Filter out any options that already exist in the previous options
          const uniqueNewOptions = newOptions.filter(option => !existingValues.has(option.value))
          return [...prev, ...uniqueNewOptions]
        })
      }

      // Always update hasMore based on the nextCursor
      const nextCursor = query.data.nextCursor
      setHasMore(!!nextCursor)
      setTotalCount(query.data.count || 0)
      
      // Store the next cursor for the next page
      if (nextCursor) {
        setCursors(prev => {
          const newCursors = [...prev]
          // Set the cursor for the next page
          newCursors[page + 1] = nextCursor
          return newCursors
        })
      }
    } catch (error: unknown) {
      console.error('Error processing options:', error instanceof Error ? error.message : 'Unknown error')
      if (page === 0) {
        setControllerOptions([])
      }
      setHasMore(false)
      setTotalCount(0)
    }
  }, [query?.data, isHookMode, page])
  
  // Update loading state based on query status
  useEffect(() => {
    if (isHookMode) {
      setLoading(query?.isLoading || query?.isFetching || false)
    }
  }, [query?.isLoading, query?.isFetching, isHookMode])

  
  // Handle scroll to load more
  const handleScroll = useCallback(() => {
    if (!optionsContainerRef.current || loading || !hasMore || !isHookMode) return
    
    const container = optionsContainerRef.current
    if (!container) return
    
    try {
      const { scrollTop, scrollHeight, clientHeight } = container
      // Load more when scrolled to bottom (with a small threshold)
      if (scrollHeight - scrollTop - clientHeight < 50) {
        // Increment the page
        const nextPage = page + 1
        setPage(nextPage)
        
        // Get the cursor for the next page
        const cursor = cursors[nextPage]
        
        // Only update pagination params if we have a valid cursor
        if (cursor) {
          // // console.log('[LOG] Scroll loading more with cursor:', cursor)
          setPaginationParams(prev => ({
            ...prev,
            cursor
          }))
        } else {
          // // console.log('[LOG] Scroll: No cursor available for page', nextPage)
        }
      }
    } catch (error) {
      console.error('Error handling scroll:', error)
    }
  }, [loading, hasMore, isHookMode, page, cursors])
  
  // Add scroll event listener
  useEffect(() => {
    const container = optionsContainerRef.current
    if (container && isOpen && isHookMode) {
      container.addEventListener('scroll', handleScroll)
      return () => {
        container.removeEventListener('scroll', handleScroll)
      }
    }
  }, [isOpen, isHookMode, handleScroll])

  // Handle dropdown open/close
  const handleOpenChange = useCallback(() => {
    const newIsOpen = !isOpen
    setIsOpen(newIsOpen)
    
    // Load data when opening dropdown for the first time
    if (newIsOpen && isHookMode && controllerOptions.length === 0 && !loading) {
      setPage(0)
      setPaginationParams(prev => ({
        ...prev,
        cursor: undefined,
        searchTerm: searchQuery || undefined
      }))
    }
  }, [isOpen, isHookMode, controllerOptions.length, loading, searchQuery])

  // Handle search input changes with debounce
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    if (isHookMode) {
      // Debounce hook search
      searchTimeoutRef.current = setTimeout(() => {
        setPage(0)
        setCursors([null])
        setPaginationParams(prev => ({
          ...prev,
          cursor: undefined,
          searchTerm: value || undefined
        }))
      }, 300)
    } else {
      // Filter static options immediately
      if (value) {
        setFilteredOptions(
          optionsRef.current.filter(option => 
            option.label.toLowerCase().includes(value.toLowerCase())
          )
        )
      } else {
        setFilteredOptions(optionsRef.current)
      }
    }
  }, [isHookMode])

  // Handle option selection toggle
  const toggleOption = useCallback((optionValue: string) => {
    // Calculate new selected options
    const newSelected = selectedOptions.includes(optionValue)
      ? selectedOptions.filter(value => value !== optionValue)
      : [...selectedOptions, optionValue]
    
    // Update local state
    setSelectedOptions(newSelected)
    
    // Notify parent component if onChange is provided
    // Use setTimeout to avoid state updates during render
    if (onChange) {
      setTimeout(() => {
        onChange(newSelected)
      }, 0)
    }
  }, [onChange, selectedOptions])

  // Add click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    // Bind the event listener
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    
    // Cleanup the event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Get display value for button
  const getDisplayValue = useCallback(() => {
    const count = selectedOptions.length
    if (count === 0) return "Nimic selectat"
    if (count === 1) return "1 selectat"
    return `${count} selectate`
  }, [selectedOptions.length])

  // Get the current options to display
  const currentOptions = isHookMode ? controllerOptions : filteredOptions

  return (
    <div className="relative" ref={filterRef}>
      <div
        className={cn(
          "flex items-center rounded-md border bg-white cursor-pointer rounded-radius-04",
          isOpen ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-300",
          className
        )}
        onClick={handleOpenChange}
      >
        {icon && <div className="pl-3 text-sm text-gray-600">{icon}</div>}
        <div className="px-3 py-2 text-sm text-gray-700">{label}</div>
        <div className="flex items-center gap-1 border-l border-gray-300 px-3 py-2 text-sm font-medium text-gray-900">
          {getDisplayValue()}
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full z-10 mt-1 w-64 rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="p-2">
            <Input 
              type="text" 
              placeholder="Căutare" 
              className="h-8 text-sm" 
              onChange={handleSearchChange}
              value={searchQuery}
            />
          </div>
          <div 
            className="max-h-60 overflow-y-auto p-2"
            ref={optionsContainerRef}
          >
            {currentOptions.map((option) => (
              <div
                key={option.value}
                className="flex items-center space-x-2 rounded px-2 py-1.5 hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleOption(option.value)
                }}
              >
                <div className="flex h-4 w-4 items-center justify-center rounded border border-gray-300 bg-white">
                  {selectedOptions.includes(option.value) && <Check className="h-3 w-3 text-blue-600" />}
                </div>
                <div className="flex items-center text-sm">
                  {option.label}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-center py-2">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            )}
            
            {isHookMode && hasMore && !loading && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-sm text-blue-600" 
                onClick={(e) => {
                  e.stopPropagation()
                  // Increment the page
                  const nextPage = page + 1
                  setPage(nextPage)
                  
                  // Get the cursor for the next page
                  const cursor = cursors[nextPage]
                  
                  // Only update pagination params if we have a valid cursor
                  if (cursor) {
                    // // console.log('[LOG] Loading more with cursor:', cursor)
                    setPaginationParams(prev => ({
                      ...prev,
                      cursor
                    }))
                  } else {
                    // // console.log('[LOG] No cursor available for page', nextPage)
                  }
                }}
              >
                Încarcă mai multe
              </Button>
            )}
            
            {isHookMode && controllerOptions.length > 0 && (
              <div className="mt-1 border-t border-gray-100 pt-1 text-center text-xs text-gray-500">
                {controllerOptions.length} din {totalCount} rezultate
              </div>
            )}
            
            {currentOptions.length === 0 && !loading && (
              <div className="py-2 text-center text-sm text-gray-500">
                Nu s-au găsit rezultate
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}