"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  type ColumnDef,
  type VisibilityState,
  type RowSelectionState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Search,
  X,
  SlidersHorizontal,
  Circle,
  Check,
  CalendarIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FilterButton, type FilterOption } from "./filter-button"
import { DateRangeFilter } from "./filter-date-range"
import type { DateRange } from "react-day-picker"
import { Skeleton } from "@/components/ui/skeleton"
import { useDataTable } from "@/hooks/use-data"
import type { ForeignKeyRelationMap, PaginatedResult, PaginationParams, TableNames, UsePaginatedHook, WithRelations } from "@/lib/query-controller"
import type { UseControllerHook } from "@/hooks/use-controllers"
import { Card, CardContent } from "@/components/ui/card"
import { useMediaQuery } from "@/hooks/use-media-query"

interface ControllerFilterConfig<T = any> {
  valueField: keyof T | string
  labelField: keyof T | string
  pageSize?: number
  searchColumns?: string[]
}

export interface Filter<T extends TableNames = any, M extends ForeignKeyRelationMap<T> = any> {
  id: string
  label: string
  type: "select" | "date" | "controller"
  options?: { value: string; label: string }[]
  controller?: ControllerFilterConfig
  fetchHook?: (params: PaginationParams) => Promise<PaginatedResult<WithRelations<T, M>>>
  icon?: React.ReactNode
  queryColumn?: string // Column name in the database
  customFilterHandler?: string
  customHandle?: (value: any) => void
  valueField?: string
  labelField?: string
  searchColumns?: string[]
}

interface DataTableProps<TData, TValue, C extends TableNames, M extends ForeignKeyRelationMap<C>> {
  columns: ColumnDef<TData, TValue>[]
  data?: TData[] // Optional initial data
  useController: UseControllerHook<C, M>
  useQueryHook: UsePaginatedHook<TData> // The hook to use for querying data
  controllerConfig?: {
    fields?: (keyof any | '*')[] // Fields to fetch
    relations?: M // Relations to include
  }
  filters?: Filter[]
  onSearch?: (value: string) => void
  onFilterChange?: (filterId: string, value: any) => void
  onResetFilters?: () => void
  enableRowSelection?: boolean
  enableSorting?: boolean
  enablePagination?: boolean
  pageSizeOptions?: number[]
  initialPageSize?: number
  initialSorting?: { id: string; desc: boolean }[] // Initial sorting configuration
  rowCountText?: string
  className?: string
  visibleColumnsConfig?: {
    initialVisibleColumns?: Record<string, boolean>
    columnDefinitions?: Array<{ id: string; label: string }>
    onVisibilityChange?: (visibility: Record<string, boolean>) => void
  }
  highlightOnHover?: boolean
  getRowClass?: (row: any) => string
  getStatusClass?: (status: string) => string
  onRowClick?: (row: any) => void
  searchColumns?: string[] // Columns to search in
  refetchKey?: string // Key for the refetch context
  cursors?: string[] // Cursors for pagination
}

// Define custom column meta type
interface ColumnMeta {
  isStatus?: boolean
  isMobileTitle?: boolean
  showInMobileCard?: boolean
  mobileLabel?: string
}

export function DataTable<TData, TValue, C extends TableNames, M extends ForeignKeyRelationMap<C>>({
  columns,
  data: initialData,
  useController,
  useQueryHook,
  controllerConfig,
  filters = [],
  onSearch,
  onFilterChange,
  onResetFilters,
  enableRowSelection = false,
  enableSorting = true,
  enablePagination = true,
  pageSizeOptions = [10, 20, 30, 50],
  initialPageSize = 10,
  initialSorting = [],
  rowCountText = "resurse",
  className,
  visibleColumnsConfig,
  getStatusClass,
  onRowClick,
  searchColumns = [],
  refetchKey = "data-table",
}: DataTableProps<TData, TValue, C, M>) {
  // Check if we're on mobile
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Use the data table hook
  const {
    pageSize,
    pageIndex,
    searchTerm,
    setSearchTerm,
    filters: tableFilters,
    sorting: tableSorting,
    handleSortChange: setSorting,
    query,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    setPageSize,
    handleFilterChange: handleTableFilterChange,
    resetFilters: resetTableFilters,
    isLoading,
    count,
  } = useDataTable<TData, C, M>(
    useController,
    useQueryHook,
    refetchKey,
    {
      pageSize: initialPageSize,
      searchTerm: "",
      searchColumns,
    },
    initialSorting,
    controllerConfig // Pass the controller config for custom fields and relations
  )

  // Row selection state
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false)
  const [resetKey, setResetKey] = useState(0)

  // Initialize column visibility on mount
  useEffect(() => {
    // Start with all columns visible
    const initialVisibility: VisibilityState = {}

    // If we have initialVisibleColumns from props, use that
    if (visibleColumnsConfig?.initialVisibleColumns) {
      setColumnVisibility(visibleColumnsConfig.initialVisibleColumns)
    } else {
      // Otherwise set all columns to visible by default
      columns.forEach((column) => {
        if (column.id) {
          initialVisibility[column.id] = true
        }
      })
      setColumnVisibility(initialVisibility)
    }
  }, []) // Only run on mount

  // Create a table instance
  const table = useReactTable({
    data: query.data?.data ?? initialData ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: enablePagination && !useQueryHook ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: (sorting) => {
      setSorting(sorting as { id: string; desc: boolean }[])
    },
    onRowSelectionChange: setRowSelection,
    state: {
      sorting: tableSorting,
      rowSelection,
      columnVisibility,
    },
    enableRowSelection,
    manualPagination: !!useQueryHook,
    manualSorting: !!useQueryHook,
    manualFiltering: !!useQueryHook,
    pageCount: count !== undefined ? Math.ceil((count || 0) / pageSize) : -1,
  })

  useEffect(() => {
    table.setColumnVisibility(columnVisibility)
  }, [table, columnVisibility])

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    console.log('[DataTable] handleSearchChange', { value, searchColumns })
    setSearchTerm(value)

    if (onSearch) {
      onSearch(value)
    }
  }

  // Handle filter change
  const handleFilterChange = (filterId: string, value: any) => {
    // Check if the filter has a custom handle function
    const filter = filters.find((filter) => filter.id === filterId);
    
    if (filter?.customHandle) {
      // Call the custom handler with the selected values
      filter.customHandle(value);
    } else {
      // Update filters through the hook
      handleTableFilterChange(filterId, value);
    }

    // Always notify parent component if onFilterChange is provided
    if (onFilterChange) {
      onFilterChange(filterId, value);
    }
  }

  // Handle reset filters
  const handleResetFilters = () => {
    resetTableFilters()
    setRowSelection({})

    if (onResetFilters) {
      onResetFilters()
    }

    setResetKey((prev) => prev + 1)
  }

  // Handle column visibility change
  const handleColumnVisibilityChange = (columnId: string) => {
    // Create a copy of the current visibility state
    const updatedVisibility = { ...columnVisibility }

    // Toggle visibility - explicitly set to the opposite of current value
    // If it's currently true or undefined, set to false. If false, set to true.
    const currentVisibility = columnVisibility[columnId]
    updatedVisibility[columnId] = currentVisibility === false ? true : false

    // Log for debugging
    // // console.log(`[LOG] Toggling column ${columnId} from ${currentVisibility} to ${updatedVisibility[columnId]}`)

    // Update local state
    setColumnVisibility(updatedVisibility)

    // Directly update the table's column visibility
    table.setColumnVisibility(updatedVisibility)

    // Call the callback if provided
    if (visibleColumnsConfig?.onVisibilityChange) {
      visibleColumnsConfig.onVisibilityChange(updatedVisibility)
    }
  }

  // Change page size
  const changePageSize = (size: number) => {
    setPageSize(size)
  }

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showColumnsDropdown && !(event.target as Element).closest(".columns-dropdown-container")) {
        setShowColumnsDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showColumnsDropdown])

  // Function to handle sort
  const handleSort = (column: string) => {
    // Find the column in the table
    const tableColumn = table.getColumn(column)
    if (!tableColumn || !enableSorting) return

    tableColumn.toggleSorting()
  }

  // Function to handle select all
  const handleSelectAll = () => {
    table.toggleAllPageRowsSelected(!table.getIsAllPageRowsSelected())
  }

  // Render mobile card view
  const renderMobileCards = () => {
    if (query.isLoading || query.isFetching) {
      // Create skeleton cards for loading state
      return Array.from({ length: 5 }).map((_, index) => (
        <Card key={`skeleton-${index}`} className="mb-4">
          <CardContent className="p-4">
            <div className="space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))
    }

    if (table.getRowModel().rows.length === 0) {
      return (
        <Card className="mb-4">
          <CardContent className="p-6 text-center text-gray-500">Nu există date disponibile</CardContent>
        </Card>
      )
    }

    return table.getRowModel().rows.map((row) => {
      // Find the title column (first non-select column or column with isMobileTitle)
      const titleColumn = table
        .getVisibleLeafColumns()
        .find((col) => (col.columnDef.meta as ColumnMeta)?.isMobileTitle || col.id !== "select")

      // Get columns to show in the card (either marked with showInMobileCard or all visible columns except select)
      const cardColumns = table.getVisibleLeafColumns().filter((col) => {
        const meta = col.columnDef.meta as ColumnMeta
        return col.id !== "select" && col.id !== titleColumn?.id && meta?.showInMobileCard !== false
      })

      // Get the raw data object
      const rowData = row.original

      return (
        <Card
          key={row.id}
          className={cn("mb-4 overflow-hidden", row.getIsSelected() ? "border-blue-500" : "")}
          onClick={() => onRowClick && onRowClick(rowData)}
        >
          <CardContent className="p-4">
            {/* Title */}
            {titleColumn && (
              <div className="font-medium text-lg mb-3">
                {/* Display the title value directly */}
                {String(row.getValue(titleColumn.id) || "")}
              </div>
            )}

            {/* Card content */}
            <div className="space-y-2">
              {cardColumns.map((column) => {
                const meta = column.columnDef.meta as ColumnMeta
                const isStatusCell = meta?.isStatus
                const cellValue = row.getValue(column.id)
                const displayLabel =
                  meta?.mobileLabel ||
                  (typeof column.columnDef.header === "string" ? column.columnDef.header : column.id)

                return (
                  <div key={column.id} className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{displayLabel}:</span>
                    <span className="text-sm font-medium">
                      {isStatusCell && getStatusClass && typeof cellValue === "string" ? (
                        <Badge className={getStatusClass(cellValue as string)}>{cellValue}</Badge>
                      ) : (
                        // Display the cell value directly
                        String(cellValue || "")
                      )}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Selection checkbox for mobile */}
            {enableRowSelection && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-300"
                  checked={row.getIsSelected()}
                  onChange={(e) => row.toggleSelected(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )
    })
  }

  // Table body rendering
  const renderTableBody = () => {
    if (query.isLoading || query.isFetching) {
      // Create skeleton rows for loading state
      return Array.from({ length: 5 }).map((_, index) => (
        <tr key={`skeleton-${index}`} className="border-b border-gray-100">
          {enableRowSelection && (
            <td className="p-2 w-12">
              <Skeleton className="h-4 w-4 rounded-sm animate-pulse" />
            </td>
          )}
          {table.getVisibleLeafColumns().map((column, colIndex) => (
            <td key={column.id} className="p-2">
              <Skeleton className={`h-6 w-full animate-pulse ${colIndex % 2 === 0 ? "bg-gray-200" : "bg-gray-300"}`} />
            </td>
          ))}
        </tr>
      ))
    }

    if (table.getRowModel().rows.length === 0) {
      return (
        <tr>
          <td
            colSpan={table.getVisibleLeafColumns().length + (enableRowSelection ? 1 : 0)}
            className="px-4 py-8 text-center text-gray-500"
          >
            Nu există date disponibile
          </td>
        </tr>
      )
    }

    return table.getRowModel().rows.map((row) => (
      <tr
        key={row.id}
        className={cn(
          "border-b transition-colors hover:bg-gray-50 cursor-pointer",
          row.getIsSelected() ? "bg-gray-50" : "bg-white",
        )}
        onClick={() => onRowClick && onRowClick(row.original)}
      >
        {row.getVisibleCells().map((cell) => {
          const column = cell.column.columnDef
          const isFirstContentCell =
            cell.column.id === table.getVisibleLeafColumns().find((col) => col.id !== "select")?.id
          const isLastContentCell =
            cell.column.id === table.getVisibleLeafColumns()[table.getVisibleLeafColumns().length - 1]?.id
          const isStatusCell = (column.meta as ColumnMeta)?.isStatus
          const cellValue = cell.getValue()

          return (
            <td
              key={cell.id}
              className={cn(
                "px-4 py-3",
                isFirstContentCell ? "font-medium" : "",
                isStatusCell ? "text-center" : "",
                !isFirstContentCell && !isLastContentCell ? "justify-center" : "",
              )}
            >
              {isStatusCell && getStatusClass && typeof cellValue === "string" ? (
                <Badge className={getStatusClass(cellValue as string)}>{cellValue}</Badge>
              ) : (
                flexRender(cell.column.columnDef.cell, cell.getContext())
              )}
            </td>
          )
        })}
      </tr>
    ))
  }

  // Pagination footer rendering
  const renderPagination = () => {
    const totalPages = count !== undefined ? Math.ceil((count || 0) / pageSize) : 1

    // Simple pagination that matches the screenshots
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {count !== undefined && count !== null
              ? `${count?.toLocaleString()} ${rowCountText}`
              : `${table.getFilteredRowModel().rows.length.toLocaleString()} ${rowCountText}`}
          </span>
        </div>

        <div className="flex items-center space-x-2 justify-center mx-auto">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 h-8 w-8 p-0"
            onClick={goToPreviousPage}
            disabled={pageIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* First page button */}
          {pageIndex > 1 && (
            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => goToPage(0)}>
              1
            </Button>
          )}

          {/* Previous page button (if not on first or second page) */}
          {pageIndex > 2 && <span className="text-gray-500">...</span>}

          {/* Previous page button (if not on first page) */}
          {pageIndex > 0 && (
            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => goToPage(pageIndex - 1)}>
              {pageIndex}
            </Button>
          )}

          {/* Current page button */}
          <Button size="sm" variant="primary" className="h-8 w-8 p-0 bg-blue-500 text-white" disabled>
            {pageIndex + 1}
          </Button>

          {/* Next page button (if not on last page) */}
          {pageIndex < (count ? Math.ceil((count || 0) / pageSize) : 1) - 1 && (
            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => goToPage(pageIndex + 1)}>
              {pageIndex + 2}
            </Button>
          )}

          {/* Ellipsis before last page (if needed) */}
          {pageIndex < totalPages - 3 && totalPages > 3 && <span className="text-gray-500">...</span>}

          {/* Last page button (if not already showing and we know there are more pages) */}
          {pageIndex < totalPages - 2 && totalPages > 2 && (
            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => goToPage(totalPages - 1)}>
              {totalPages}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 h-8 w-8 p-0"
            onClick={goToNextPage}
            disabled={pageIndex >= totalPages - 1 || !query.data?.nextCursor}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{rowCountText} pe pagină</span>
          <select
            className="h-8 rounded border-gray-300 text-sm"
            value={pageSize}
            onChange={(e) => changePageSize(Number(e.target.value))}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filters Section */}
      <div className="mb-6 space-y-4">
        {/* First row of filters with search and column visibility */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 flex flex-wrap gap-3 items-center">
            {/* Search input */}
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Căutare..."
                className="pl-10 h-9"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>

            {/* Render filters in the order they were passed */}
            {filters.map((filter) => {
              const key = `${filter.id}-${resetKey}`

              switch (filter.type) {
                case "select":
                  return (
                    <FilterButton
                      key={key}
                      filterKey={filter.id}
                      icon={filter.icon || <Circle className="h-4 w-4 text-gray-400" />}
                      label={filter.label}
                      options={(filter.options as FilterOption[]) || []}
                      onChange={(selectedOptions) => handleFilterChange(filter.id, selectedOptions)}
                      defaultSelected={tableFilters[filter.id] || []}
                    />
                  )

                case "date":
                  return (
                    <DateRangeFilter
                      key={key}
                      label={filter.label}
                      icon={filter.icon || <CalendarIcon className="h-4 w-4 text-gray-400" />}
                      onChange={(dateRange) => handleFilterChange(filter.id, dateRange)}
                      defaultValue={tableFilters[filter.id] as DateRange | undefined}
                    />
                  )

                case "controller":
                  return (
                    <FilterButton
                      key={key}
                      filterKey={filter.id}
                      icon={filter.icon || <Circle className="h-4 w-4 text-gray-400" />}
                      label={filter.label}
                      onChange={(selectedOptions) => handleFilterChange(filter.id, selectedOptions)}
                      defaultSelected={tableFilters[filter.id] || []}
                      fetchHook={(params) => {
                        console.log('Fetching filter options with params:', params);
                        return filter.fetchHook!(params);
                      }}
                      controllerConfig={{
                        valueField: filter?.controller?.valueField || "id",
                        labelField: filter?.controller?.labelField || "name",
                        searchColumns: filter?.controller?.searchColumns || ["name"]
                      }}
                    />
                  )

                default:
                  return null
              }
            })}

            {/* Reset button */}
            {(Object.keys(tableFilters).length > 0 || searchTerm) && (
              <Button variant="ghost" className="flex items-center gap-1 h-9" onClick={handleResetFilters}>
                <X className="h-4 w-4" />
                Reset
              </Button>
            )}
          </div>

          {/* Column visibility toggle */}
          <div className="relative columns-dropdown-container">
            <Button
              variant="outline"
              className="flex items-center gap-1 h-9"
              onClick={() => setShowColumnsDropdown(!showColumnsDropdown)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Vizualizează
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>

            {showColumnsDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-2">
                <div className="text-sm font-medium text-gray-500 mb-2 px-2">Vizibilitate coloane</div>
                <div className="space-y-1">
                  {/* Skip the first column (usually the select button) */}
                  {table
                    .getAllLeafColumns()
                    .slice(1)
                    .map((col) => {
                      const isVisible = columnVisibility[col.id] !== false
                      // Get label: if header is a function, call it with { table }, else use as string
                      let label = col.columnDef.header
                      if (typeof label === "function") {
                        try {
                          label = label({ table })
                        } catch {
                          label = col.id
                        }
                      }
                      return (
                        <Button
                          key={col.id}
                          variant="ghost"
                          className="w-full justify-start text-sm h-8 px-2"
                          onClick={() => handleColumnVisibilityChange(col.id)}
                        >
                          <div className="flex items-center">
                            <div className="w-5 h-5 mr-2 flex items-center justify-center">
                              {isVisible && <Check className="h-4 w-4" />}
                            </div>
                            {label}
                          </div>
                        </Button>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Card View or Desktop Table View */}
      {isMobile ? (
        <div className="space-y-4">
          {renderMobileCards()}

          {/* Pagination for mobile */}
          {enablePagination && renderPagination()}
        </div>
      ) : (
        /* Table for desktop */
        <div className="border rounded-md overflow-hidden">
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 bg-gray-50">
                <tr>
                  {enableRowSelection && (
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={table.getIsAllPageRowsSelected()}
                        onChange={handleSelectAll}
                      />
                    </th>
                  )}

                  {table.getVisibleLeafColumns().map((column) => {
                    // Skip the selection column which we handled separately
                    if (column.id === "select") return null

                    const isSortable = enableSorting && column.getCanSort()
                    const isSorted = column.getIsSorted()

                    return (
                      <th
                        key={column.id}
                        className={cn("px-4 py-3 font-medium", isSortable ? "cursor-pointer select-none" : "")}
                        onClick={() => isSortable && handleSort(column.id)}
                      >
                        <div className="flex items-center">
                          {column.columnDef.header
                            ? typeof column.columnDef.header === "string"
                              ? column.columnDef.header
                              : String(column.id)
                            : String(column.id)}
                          {isSortable && (
                            <div className="flex flex-col ml-1">
                              <ChevronUp
                                className={cn("h-3 w-3 -mb-1", isSorted === "asc" ? "text-blue-600" : "text-gray-300")}
                              />
                              <ChevronDown
                                className={cn("h-3 w-3", isSorted === "desc" ? "text-blue-600" : "text-gray-300")}
                              />
                            </div>
                          )}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">{renderTableBody()}</tbody>
            </table>
          </div>

          {/* Pagination */}
          {enablePagination && renderPagination()}
        </div>
      )}
    </div>
  )
}
