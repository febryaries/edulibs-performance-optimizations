"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Check, Loader2, ChevronsUpDown, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type {
  ForeignKeyRelationMap,
  PaginatedResult,
  PaginationParams,
  QueryFilter,
  TableNames,
  UsePaginatedHook,
  WithRelations,
} from "@/lib/query-controller"
import { InView } from "react-intersection-observer"
import { useInfiniteDataTable } from "@/hooks/use-infinite-data"
import { Avatar } from "@/components/ui/avatar"

// --- Helper: getNestedValue ---
function getNestedValue(obj: any, path: string | number): any {
  if (typeof path === "string" && path.includes(".")) {
    return path.split(".").reduce((o, k) => (o ? o[k as keyof typeof o] : undefined), obj)
  } else {
    return obj?.[path as keyof typeof obj]
  }
}

export interface SearchableDropdownProps<T extends TableNames, M extends ForeignKeyRelationMap<T>> {
  filterKey: string
  fetchHook: (params: PaginationParams)=> Promise<PaginatedResult<WithRelations<T, M>>>
  placeholder?: string
  emptyMessage?: string
  /**
   * Accepts either a key of T (flat property) or a dot-notated string for nested properties (e.g. "class.id").
   */
  valueField: string
  /**
   * Accepts either a key of T (flat property) or a dot-notated string for nested properties (e.g. "class.name").
   */
  labelField: string
  /**
   * Optional field for avatar url or initials
   */
  avatarField?: string
  /**
   * Mode of selection: 'single' or 'multiple'
   */
  mode?: "single" | "multiple"
  /**
   * For single mode: (value: T | null) => void
   * For multiple mode: (value: T[]) => void
   */
  onChange: ((value: any | null) => void) | ((value: any[]) => void)
  /**
   * For single mode: any | null
   * For multiple mode: T[]
   */
  value?: any | null | T[]
  disabled?: boolean
  searchColumns?: string[]
  pageSize?: number
  className?: string
  triggerClassName?: string
  contentClassName?: string
  renderItem?: (item: T, isSelected: boolean, onChange: (value: T | null) => void) => React.ReactNode
  onOpenChange?: (open: boolean) => void
  error?: string
  /**
   * Filters to be passed to the query. These will override or supplement UI filters.
   */
  filters?: QueryFilter[]
}

export function SearchableDropdown<
  T extends TableNames,
  M extends ForeignKeyRelationMap<T>,
>({
  filterKey,
  fetchHook,
  placeholder = "Select an item...",
  emptyMessage = "No results found.",
  valueField,
  labelField,
  avatarField,
  mode = "single",
  onChange,
  value = mode === "single" ? null : [],
  disabled = false,
  searchColumns = [],
  pageSize = 10,
  className,
  triggerClassName,
  contentClassName,
  renderItem,
  onOpenChange,
  error,
  filters,
  ...props
}: SearchableDropdownProps<T, M>) {
  // Memoize initial params
  const memoizedInitialParams = useMemo(
    () => {
      return {
        pageSize,
        searchTerm: "",
        searchColumns,
        filters,
      };
    },
    [pageSize, searchColumns, filters],
  )

  const {
    pageIndex,
    totalPages,
    searchTerm,
    setSearchTerm,
    query,
    goToNextPage,
    results,
    handleFiltersChanged
  } = useInfiniteDataTable(fetchHook, memoizedInitialParams, filterKey)



  useEffect(() => {
    const _filters: Record<string, any> = {}
    for (const filter of filters ?? []) {
      _filters[filter.column] = filter.value
    }
    handleFiltersChanged(_filters)
  }, [filters])

  // UI State
  const [open, setOpen] = useState(false)
  const [isEndOfListInView, setIsEndOfListInView] = useState(false)



  // Fetch more data when scrolling to the end
  useEffect(() => {
    if (isEndOfListInView && pageIndex < totalPages && (!query.isStale || !query.isRefetching || !query.isLoading)) {
      goToNextPage()
    }
  }, [isEndOfListInView])

  // Find the selected item in the results or set to undefined
  const selectedItem = useMemo(() => {
    if (mode === "single" && value !== null) {
      // First try to find by direct comparison
      const directMatch = results.find((item) => getNestedValue(item, valueField) === value)
      if (directMatch) return directMatch

      // If value is an object, try to match by valueField
      if (typeof value === "object" && value !== null) {
        const valueFieldValue = getNestedValue(value, valueField)
        return results.find((item) => getNestedValue(item, valueField) === valueFieldValue)
      }
    }
    return undefined
  }, [mode, value, results, valueField])

  const displayValue = selectedItem ? String(getNestedValue(selectedItem, labelField)) : ""

  // For multiple mode, get the selected items
  const selectedItems = mode === "multiple" && Array.isArray(value) ? (value as T[]) : []

  // Helper function to check if an item is selected in multiple mode
  const isItemSelected = (item: T) => {
    if (mode === "single") {
      return getNestedValue(item, valueField) === value
    } else {
      return selectedItems.some(
        (selectedItem) => getNestedValue(selectedItem, valueField) === getNestedValue(item, valueField),
      )
    }
  }

  // Handle item selection
  const handleItemSelect = (item: T) => {
    if (mode === "single") {
      const itemValue = getNestedValue(item, valueField);
      (onChange as (value: T | null) => void)(itemValue)
      setOpen(false)
      if (onOpenChange) onOpenChange(false)
    } else {
      const itemValue = getNestedValue(item, valueField)
      const isSelected = selectedItems.some((selectedItem) => getNestedValue(selectedItem, valueField) === itemValue)

      if (isSelected) {
        // Remove item
        const newSelectedItems = selectedItems.filter(
          (selectedItem) => getNestedValue(selectedItem, valueField) !== itemValue,
        );
        (onChange as (value: T[]) => void)(newSelectedItems)
      } else {
        // Add item
        (onChange as (value: T[]) => void)([...selectedItems, item])
      }
    }
  }

  // Handle removing a selected item in multiple mode
  const handleRemoveItem = (e: React.MouseEvent, item: T) => {
    e.stopPropagation() // Prevent dropdown from opening
    if (mode === "multiple") {
      const newSelectedItems = selectedItems.filter(
        (selectedItem) => getNestedValue(selectedItem, valueField) !== getNestedValue(item, valueField),
      )
        ; (onChange as (value: T[]) => void)(newSelectedItems)
    }
  }

  // Get initials for avatar
  const getInitials = (item: T) => {
    const label = String(getNestedValue(item, labelField))
    return label
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  // Get random color for avatar
  const getRandomColor = (item: T) => {
    const colors = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-red-500", "bg-teal-500"]
    const label = String(getNestedValue(item, labelField))
    const index = label.charCodeAt(0) % colors.length
    return colors[index]
  }

  // Ref for dropdown positioning
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return
    function handleClick(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
        if (onOpenChange) onOpenChange(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open, onOpenChange])

  const renderResults = useCallback(() => {
    results.forEach((item, index) => {
      if (index < 5) {
        const isSelected = isItemSelected(item);
        const itemValue = getNestedValue(item, valueField);
        const itemLabel = getNestedValue(item, labelField);
      }
    });
    return results.map((item, index) => {
      const isSelected = isItemSelected(item);
      return (
        <div
          key={index}
          className={cn(
            "flex cursor-pointer select-none items-center px-3 py-2 text-sm hover:bg-gray-100",
            isSelected && "bg-gray-100 font-semibold",
          )}
          onClick={() => handleItemSelect(item)}
        >
          {renderItem ? (
            renderItem(item, isSelected, onChange as (value: T | null) => void)
          ) : (
            <>
              {mode === "single" ? (
                <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
              ) : (
                <div className="flex items-center justify-center w-5 mr-2">
                  {isSelected ? (
                    <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 border border-gray-300 rounded"></div>
                  )}
                </div>
              )}
              {String(getNestedValue(item, labelField))}
            </>
          )}
        </div>
      )
    })
  }, [results, searchTerm, query.data, query.isLoading, mode, valueField, labelField, renderItem, isItemSelected, handleItemSelect, onChange])


  useEffect(() => {
    if(query.data?.data){
      console.log("[SearchableDropdown] Data updated", query.data.data, results)

    }
  },[query.data, results])


  return (
    <div className="relative w-full">
      <div className="relative">
        {/* Trigger button */}
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full flex justify-between items-center border rounded px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-border-focus",
            disabled && "opacity-50 cursor-not-allowed",
            triggerClassName,
          )}
          onClick={() => {
            setOpen((prev) => !prev)
            if (onOpenChange) onOpenChange(!open)
          }}
        >
          {mode === "single" ? displayValue || placeholder : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>

        {/* Dropdown */}
        {open && (
          <div
            ref={dropdownRef}
            className={cn("absolute z-50 w-full rounded-md border bg-white shadow-lg p-0", contentClassName)}
            style={{
              top: "calc(100% + 4px)", // Position right below the button with a small gap
            }}
          >
            <div className={cn("", className)}>
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 h-9 border-0 outline-none focus:ring-0 bg-transparent"
                />
              </div>
              <div className="max-h-[300px] overflow-auto">
                <div>
                  {renderResults()}
                  {/* InView sentinel for infinite scroll */}
                  <InView as="div" onChange={setIsEndOfListInView}>
                    <div style={{ height: 1 }} />
                  </InView>
                </div>

                {query.isFetching || query.isLoading ? (
                  <div className="py-2 text-center">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    <span className="text-xs text-muted-foreground">Scroll for more</span>
                  </div>
                ) : (
                  results.length === 0 && <div className="py-6 text-center text-muted-foreground">{emptyMessage}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected items for multiple mode */}
      {mode === "multiple" && selectedItems.length > 0 && (
        <div className="mt-2 max-h-[150px] overflow-y-auto border rounded-md p-1">
          <div className="flex flex-wrap gap-1">
            {selectedItems.map((item, index) => {
              const label = String(getNestedValue(item, labelField))
              const avatarSrc = avatarField ? String(getNestedValue(item, avatarField) || "") : ""
              const initials = getInitials(item)

              return (
                <div key={index} className="flex items-center gap-2 bg-gray-100 rounded-md pl-2 pr-1 py-1 mb-1">
                  {avatarField && (
                    <Avatar
                      size="32"
                      src={avatarSrc}
                      alt={label}
                      initials={initials}
                      variant={avatarSrc ? "populated" : "empty"}
                    />
                  )}
                  <span className="text-sm">{label}</span>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveItem(e, item)}
                    className="text-gray-400 hover:text-gray-600"
                    disabled={disabled}
                  >
                    <X size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Error message */}
      {/* {error && (
        <div className="text-red-500 text-sm mt-1">
          {JSON.stringify(error)}
        </div>
      )} */}
    </div>
  )
}
