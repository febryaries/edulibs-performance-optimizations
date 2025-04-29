"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type {
  PaginatedResult,
  PaginationParams,
  QueryFilter,
  QueryCursor,
  UsePaginatedHook,
} from "@/lib/query-controller"
import type { UseQueryResult } from "@tanstack/react-query"
import { useDebounce } from "./use-debounce"

export interface UseInfiniteDataTable<T> {
  pageSize: number
  pageIndex: number
  totalPages: number
  state: PaginationParams
  searchTerm: string
  filters: Record<string, any>
  sorting: { id: string; desc: boolean }[]
  query: UseQueryResult<PaginatedResult<T>, Error>
  results: T[] // NEW: accumulated list

  setPageSize: (size: number) => void
  setSearchTerm: (term: string) => void
  handleFiltersChanged: (filters: Record<string, any>) => void
  handleFilterChange: (id: string, value: any) => void
  handleSortChange: (sorting: { id: string; desc: boolean }[]) => void

  goToNextPage: () => void
  goToPreviousPage: () => void
  resetFilters: () => void
}

export function useInfiniteDataTable<T>(
  fetchHook: UsePaginatedHook<T>,
  initialState: PaginationParams,
): UseInfiniteDataTable<T> {
  const [queryParams, setQueryParams] = useState<PaginationParams>(initialState)
  const [pageIndex, setPageIndex] = useState(0)
  const [searchTerm, setSearchTerm] = useState(initialState?.searchTerm ?? "")
  const [resultsMap, setResultsMap] = useState<Map<string, T>>(new Map())

  // Merge UI filters and initialState.filters (from props)
  const [filters, setFilters] = useState<Record<string, any>>(initialState?.filters ?? {})
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([])

  /** Map <pageIndex, cursor|null> for O(1) cursor look‑ups. */
  const [pageCursorMap, setPageCursorMap] = useState<Map<number, QueryCursor | null>>(new Map([[0, null]]))

  // Track previous filter and search state to detect changes
  const prevFiltersRef = useRef<string>("")
  const prevSearchTermRef = useRef<string>("")

  const setPageSize: (size: number) => void = (size: number) => setQueryParams((prev) => ({ ...prev, pageSize: size }))

  const handleFilterChange = useCallback((id: string, value: any) => {
    setFilters((prev) => ({ ...prev, [id]: value }))
  }, [])

  const handleFiltersChanged = useCallback((filters: Record<string, any>) => {
    setFilters(filters)
  }, [])

  const handleSortChange = useCallback((sorting: { id: string; desc: boolean }[]) => {
    setSorting(sorting)
  }, [])

  const apiFilters = (): QueryFilter[] => {
    // If filters is already an array (from props), return as-is
    if (Array.isArray(filters)) {
      return filters
    }
    // Otherwise, treat filters as an object (UI filters)
    const result: QueryFilter[] = []
    for (const [key, value] of Object.entries(filters)) {
      if (!value || (Array.isArray(value) && value.length === 0)) continue
      if (Array.isArray(value)) {
        result.push({
          column: key,
          operator: "in",
          value: value.map((v) => v?.value ?? v),
        })
      } else if (typeof value === "object" && value !== null && "from" in value && "to" in value) {
        const { from, to } = value as { from?: Date; to?: Date }
        if (from) {
          const tmp = new Date(from)
          tmp.setHours(0, 0, 0, 0)
          result.push({ column: key, operator: "gte", value: tmp.toISOString().split("T")[0] })
        }
        if (to) {
          const tmp = new Date(to)
          tmp.setHours(23, 59, 59, 999)
          result.push({ column: key, operator: "lte", value: tmp.toISOString().split("T")[0] })
        }
      } else {
        result.push({ column: key, operator: "eq", value: (value as any)?.value ?? value })
      }
    }
    return result
  }

  const goToNextPage = () => {
    const next = pageIndex + 1

    if (pageCursorMap.has(next)) {
      const nextCursor = pageCursorMap.get(next)!
      setQueryParams((prev) => ({ ...prev, cursor: nextCursor ?? undefined }))
      setPageIndex(next)
    } else if (query.data?.nextCursor) {
      const cursor = query.data.nextCursor
      setPageCursorMap((prev) => {
        const updated = new Map(prev)
        updated.set(next, cursor)
        return updated
      })
      setQueryParams((prev) => ({ ...prev, cursor }))
      setPageIndex(next)
    }
  }

  const goToPreviousPage = () => {
    const previous = pageIndex - 1
    if (previous < 0) return

    if (pageCursorMap.has(previous)) {
      const prevCursor = pageCursorMap.get(previous)!
      setQueryParams((prev) => ({ ...prev, cursor: prevCursor ?? undefined }))
      setPageIndex(previous)
    } else if (query.data?.prevCursor) {
      const cursor = query.data.prevCursor
      setPageCursorMap((prev) => {
        const updated = new Map(prev)
        updated.set(previous, cursor)
        return updated
      })
      setQueryParams((prev) => ({ ...prev, cursor }))
      setPageIndex(previous)
    }
  }

  const resetFilters = () => {
    setFilters({})
    setPageIndex(0)
    setPageCursorMap(new Map([[0, null]]))
    setResultsMap(new Map())
    setQueryParams((prev) => ({
      ...prev,
      filters: [],
      cursor: undefined,
    }))
  }

  const memoizedInitialFilters: QueryFilter[] = useMemo(() => {
    return initialState?.filters ?? []
  }, [initialState?.filters])

  // Constructed Query Params
  const constructedQueryParams: PaginationParams = useMemo(() => {
    return {
      ...queryParams,
      sorts: sorting.map((s) => ({ column: s.id, direction: s.desc ? "desc" : "asc" })),
      filters: apiFilters(),
      searchTerm,
    }
  }, [queryParams, filters, sorting, searchTerm, memoizedInitialFilters])

  const debouncedQueryParams = useDebounce(constructedQueryParams, 300)
  const query = fetchHook(debouncedQueryParams)
  const totalPages = query.data?.count ?? 0

  // Check if filters or search have changed
  const currentFiltersString = JSON.stringify(apiFilters())
  const filtersChanged = prevFiltersRef.current !== currentFiltersString
  const searchChanged = prevSearchTermRef.current !== searchTerm

  // Update data when query results come in
  useEffect(() => {
    if (!query.data?.data) return

    // If we're at page 0 and filters/search changed, replace the map
    // Otherwise, add to the existing map
    if (pageIndex === 0 && (filtersChanged || searchChanged)) {
      const newMap = new Map()
      for (const item of query.data.data) {
        newMap.set((item as any).id, item)
      }
      setResultsMap(newMap)

      // Update refs to current values
      prevFiltersRef.current = currentFiltersString
      prevSearchTermRef.current = searchTerm
    } else {
      // Accumulate results when paginating with same filters
      setResultsMap((prev) => {
        const updated = new Map(prev)
        for (const item of query.data.data) {
          updated.set((item as any).id, item)
        }
        return updated
      })
    }
  }, [query.data, pageIndex, currentFiltersString, searchTerm])

  // Reset pagination when filters or search change
  useEffect(() => {
    if (filtersChanged || searchChanged) {
      setPageIndex(0)
      setPageCursorMap(new Map([[0, null]]))
      setQueryParams((prev) => ({
        ...prev,
        cursor: undefined,
      }))
      // Don't clear resultsMap here - we'll handle that in the query.data effect
    }
  }, [currentFiltersString, searchTerm])

  return {
    /* State */
    pageSize: queryParams.pageSize,
    pageIndex,
    totalPages,
    searchTerm,
    state: queryParams,
    filters,
    sorting,
    query,
    results: Array.from(resultsMap.values()),
    /* Setters */
    setPageSize,
    setSearchTerm,
    handleFilterChange,
    handleFiltersChanged,
    handleSortChange,
    /* Handlers */
    goToNextPage,
    goToPreviousPage,
    resetFilters,
  }
}
