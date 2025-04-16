"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { PaginationParams, PaginatedResult, QueryFilter, QuerySort } from "@/lib/query-controller"
import { useDebounce } from "@/hooks/use-debounce"
import { UseQueryResult } from "@tanstack/react-query"
import { useRefetchContext } from "@/lib/refetch-context"

export type UsePaginatedHook<T> = (params?: PaginationParams) => UseQueryResult<PaginatedResult<T>, Error>

/**
 * Generic data table hook with shared refetching support via context.
 */
export function useDataTable<T>(
  fetchHook: UsePaginatedHook<T>,
  refetchKey: string,
  initialState?: {
    pageSize?: number
    pageIndex?: number
    searchTerm?: string
    filters?: Record<string, any>
    sorting?: { id: string; desc: boolean }[]
  },
  searchColumns?: string[]
) {
  const [pageSize, setPageSize] = useState(initialState?.pageSize || 10)
  const [pageIndex, setPageIndex] = useState(initialState?.pageIndex || 0)
  const [searchTerm, setSearchTerm] = useState(initialState?.searchTerm || "")
  const [filters, setFilters] = useState<Record<string, any>>(initialState?.filters || {})
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>(initialState?.sorting || [])
  const [cursors, setCursors] = useState<(string | null)[]>([null])

  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const debouncedFilters = useDebounce(filters, 300)

  const { refetchKeys, triggerRefetch } = useRefetchContext()
  const keyVersion = refetchKeys[refetchKey] || 0

  const apiSorting = useMemo<QuerySort[] | undefined>(() => {
    return sorting.length > 0
      ? [{ column: sorting[0].id, direction: sorting[0].desc ? "desc" : "asc" }]
      : undefined
  }, [sorting])

  const apiFilters = useCallback((): QueryFilter[] => {
    const result: QueryFilter[] = []

    for (const [key, value] of Object.entries(debouncedFilters)) {
      if (!value || (Array.isArray(value) && value.length === 0)) continue

      if (Array.isArray(value)) {
        result.push({
          column: key,
          operator: "in",
          value: value.map((v: any) => (v.value !== undefined ? v.value : v))
        })
      } else if (typeof value === "object" && value !== null && "from" in value && "to" in value) {
        const { from, to } = value as { from?: Date; to?: Date }

        if (from) {
          // Format date in ISO format without timezone information
          const fromDate = new Date(from)
          fromDate.setHours(0, 0, 0, 0)
          result.push({ 
            column: key, 
            operator: "gte", 
            value: fromDate.toISOString().split('T')[0] 
          })
        }
        
        if (to) {
          // Format date in ISO format without timezone information
          const toDate = new Date(to)
          toDate.setHours(23, 59, 59, 999)
          result.push({ 
            column: key, 
            operator: "lte", 
            value: toDate.toISOString().split('T')[0] 
          })
        }
      } else {
        result.push({
          column: key,
          operator: "eq",
          value: typeof value === "object" ? (value as any).value || value : value
        })
      }
    }

    return result
  }, [debouncedFilters])

  const params: PaginationParams = useMemo(() => ({
    pageSize,
    cursor: cursors[pageIndex] || undefined,
    filters: apiFilters(),
    searchTerm: debouncedSearchTerm || undefined,
    searchColumns,
    sorts: apiSorting,
  }), [pageSize, pageIndex, cursors, apiFilters, debouncedSearchTerm, apiSorting, searchColumns])

  const query = fetchHook(params)

  useEffect(() => {
    if ((Object.keys(debouncedFilters).length > 0 || debouncedSearchTerm) && pageIndex > 0) {
      setPageIndex(0)
      setCursors([null])
    }
  }, [debouncedFilters, debouncedSearchTerm, pageIndex])

  useEffect(() => {
    if (keyVersion > 0) {
      query.refetch()
    }
  }, [keyVersion, query])

  const manualTriggerRefetch = useCallback(() => {
    triggerRefetch(refetchKey)
  }, [refetchKey, triggerRefetch])

  const updateCursors = useCallback((nextCursor: string | null) => {
    if (nextCursor && pageIndex === cursors.length - 1) {
      setCursors((prev) => [...prev, nextCursor])
    }
  }, [pageIndex, cursors])

  const goToPage = useCallback((index: number) => {
    setPageIndex(index)
  }, [])

  const goToNextPage = useCallback(() => {
    setPageIndex((prev) => prev + 1)
  }, [])

  const goToPreviousPage = useCallback(() => {
    if (pageIndex > 0) {
      setPageIndex((prev) => prev - 1)
    }
  }, [pageIndex])

  const handleFilterChange = useCallback((filterId: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [filterId]: value
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({})
    setSearchTerm("")
    setSorting([])
    setPageIndex(0)
    setCursors([null])
  }, [])

  return {
    // Table state
    pageSize,
    pageIndex,
    searchTerm,
    debouncedSearchTerm,
    filters,
    debouncedFilters,
    sorting,
    cursors,

    // Query & meta
    query,
    params,
    apiFilters: apiFilters(),
    apiSorting,

    // Setters
    setPageSize,
    setPageIndex,
    setSearchTerm,
    setFilters,
    setSorting,
    setCursors,

    // Handlers
    updateCursors,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    handleFilterChange,
    resetFilters,
    triggerRefetch: manualTriggerRefetch,
  }
}
