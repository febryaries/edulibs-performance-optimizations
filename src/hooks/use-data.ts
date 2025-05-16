import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import {
  ForeignKeyRelationMap,
  PaginatedResult,
  PaginationParams,
  QueryCursor,
  QueryFilter,
  QuerySort,
  TableNames,
  UsePaginatedHook
} from "@/lib/query-controller"
import { UseQueryResult } from "@tanstack/react-query"
import { useDebounce } from "./use-debounce"
import { UseControllerHook } from "./use-controllers"

interface PageCursors {
  nextCursor: QueryCursor | null
  prevCursor: QueryCursor | null
}

export interface UseDataTable<T> {
  pageSize: number
  pageIndex: number
  state: PaginationParams
  searchTerm: string
  filters: Record<string, any>
  sorting: { id: string; desc: boolean }[]
  query: UseQueryResult<PaginatedResult<T>, Error>
  isLoading: boolean

  setPageSize: (size: number) => void
  setSearchTerm: (term: string) => void
  handleFilterChange: (id: string, value: any) => void
  handleSortChange: (sorting: { id: string; desc: boolean }[]) => void

  goToPage: (index: number) => void
  goToNextPage: () => void
  goToPreviousPage: () => void
  resetFilters: () => void
}

export function useDataTable<T, C extends TableNames, M extends ForeignKeyRelationMap<C>>(
  useController: UseControllerHook<C, M>,
  fetchHook: UsePaginatedHook<T>,
  refetchKey: string,
  initialState: PaginationParams,
  initialSorting: { id: string; desc: boolean }[] = []
): UseDataTable<T> {
  const controller = useController()
  const [pageIndex, setPageIndex] = useState(0)
  const [searchTerm, setSearchTerm] = useState(initialState?.searchTerm ?? "")
  const [filters, setFilters] = useState<Record<string, any>>(initialState?.filters ?? {})
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>(initialSorting)
  const [queryParams, setQueryParams] = useState<PaginationParams>(initialState)
  const [pageCursorMap, setPageCursorMap] = useState<Map<number, PageCursors>>(
    new Map([[0, { nextCursor: null, prevCursor: null }]])
  )
  const [isNavigating, setIsNavigating] = useState(false)
  const prevInitialStateRef = useRef<string>("")

  const apiFilters = useCallback((): QueryFilter[] => {
    const result: QueryFilter[] = []
    for (const [key, value] of Object.entries(filters)) {
      if (!value || (Array.isArray(value) && value.length === 0)) continue

      if (Array.isArray(value)) {
        result.push({ column: key, operator: "in", value: value.map(v => v?.value ?? v) })
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
        result.push({ column: key, operator: "eq", value: value?.value ?? value })
      }
    }
    return result
  }, [filters])

  const constructedQueryParams: PaginationParams = useMemo(() => {
    return {
      pageSize: queryParams.pageSize,
      filters: apiFilters(),
      sorts: sorting.map(s => ({ column: s.id, direction: s.desc ? "desc" : "asc" })),
      searchTerm,
      cursor: queryParams.cursor,
      offset: queryParams.offset
    }
  }, [queryParams.pageSize, queryParams.cursor, queryParams.offset, apiFilters, sorting, searchTerm])

  const debouncedQueryParams = useDebounce(constructedQueryParams, 300)
  const query = fetchHook(debouncedQueryParams)

  const isLoading = query.isLoading || query.isFetching || isNavigating

  useEffect(() => {
    if (!query.isLoading && !query.isFetching) {
      setIsNavigating(false)
    }
  }, [query.isLoading, query.isFetching])

  const setPageSize = (size: number) => {
    setQueryParams(prev => ({ ...prev, pageSize: size, cursor: undefined, offset: 0 }))
    setPageIndex(0)
    setPageCursorMap(new Map([[0, { nextCursor: null, prevCursor: null }]]))
  }

  const handleFilterChange = useCallback((id: string, value: any) => {
    setFilters(prev => ({ ...prev, [id]: value }))
    // Reset pagination when filters change
    setPageIndex(0)
    setPageCursorMap(new Map([[0, { nextCursor: null, prevCursor: null }]]))
    setQueryParams(prev => ({ ...prev, cursor: undefined, offset: 0 }))
  }, [])

  const handleSortChange = useCallback((newSorting: { id: string; desc: boolean }[]) => {
    setSorting(newSorting)
    // Reset pagination when sorting changes
    setPageIndex(0)
    setPageCursorMap(new Map([[0, { nextCursor: null, prevCursor: null }]]))
    setQueryParams(prev => ({ ...prev, cursor: undefined, offset: 0 }))
  }, [])

  const goToNextPage = useCallback(() => {
    // Don't proceed if we're loading or there's no next cursor
    if (isLoading || !query.data?.nextCursor) return

    setIsNavigating(true)
    const next = pageIndex + 1

    // Store the current cursors for next page
    setPageCursorMap(prev => {
      const updated = new Map(prev)
      updated.set(next, { 
        nextCursor: query.data!.nextCursor, 
        prevCursor: query.data!.prevCursor 
      })
      return updated
    })

    // Set cursor for next page navigation
    setQueryParams(prev => ({
      ...prev,
      cursor: query.data!.nextCursor || undefined,
      offset: undefined // Clear offset when using cursor pagination
    }))

    setPageIndex(next)
  }, [isLoading, pageIndex, query.data?.nextCursor, query.data?.prevCursor])

  const goToPreviousPage = useCallback(() => {
    // Don't proceed if we're on the first page or loading
    if (pageIndex <= 0 || isLoading) return

    setIsNavigating(true)
    const previous = pageIndex - 1
    
    // Get the cursor information for the previous page
    const cursorPair = pageCursorMap.get(previous)
    
    // If we don't have cursor information for the previous page, use offset-based pagination
    if (!cursorPair) {
      // Fallback to offset-based pagination
      setQueryParams(prev => ({
        ...prev,
        cursor: undefined,
        offset: previous * queryParams.pageSize
      }))
      setPageIndex(previous)
      return
    }
    
    // Use the stored cursor information to navigate
    setQueryParams(prev => ({
      ...prev,
      cursor: cursorPair.prevCursor || undefined,
      offset: undefined // Clear offset when using cursor pagination
    }))

    setPageIndex(previous)
  }, [isLoading, pageIndex, pageCursorMap, queryParams.pageSize])

  const goToPage = useCallback(async (index: number) => {
    if (index === pageIndex || index < 0) return

    setIsNavigating(true)

    try {
      // For direct page navigation, use offset-based pagination
      const result = await controller.getPaginatedData({
        pageSize: queryParams.pageSize,
        filters: apiFilters(),
        sorts: sorting.map(s => ({ column: s.id, direction: s.desc ? "desc" : "asc" })),
        searchTerm,
        offset: index * queryParams.pageSize, // Use zero-based indexing
        cursor: undefined // Clear cursor when using offset pagination
      })

      // Update page cursor map
      setPageCursorMap(prev => {
        const updated = new Map(prev)
        updated.set(index, { 
          nextCursor: result.nextCursor, 
          prevCursor: result.prevCursor 
        })
        return updated
      })

      // Update query params for the current view
      // Note: We're setting BOTH cursors to null/undefined here
      // because we want to use the offset we just navigated to
      setQueryParams(prev => ({
        ...prev,
        cursor: undefined,
        offset: index * queryParams.pageSize
      }))

      setPageIndex(index)
    } catch (e) {
      setIsNavigating(false)
      console.error('Error navigating to page:', e)
      throw e
    }
  }, [controller, queryParams.pageSize, apiFilters, sorting, searchTerm, pageIndex])

  const resetFilters = useCallback(() => {
    if (isNavigating) return

    setFilters({})
    setSearchTerm("")
    setPageIndex(0)
    setPageCursorMap(new Map([[0, { nextCursor: null, prevCursor: null }]]))
    setQueryParams(prev => ({
      ...prev,
      cursor: undefined,
      offset: 0,
      searchTerm: "",
      filters: []
    }))
  }, [isNavigating])

  const memoizedInitialState = useMemo(() => initialState, [initialState])
  const currentInitialStateString = JSON.stringify(memoizedInitialState)
  const initialStateChanged =
    prevInitialStateRef.current !== "" &&
    prevInitialStateRef.current !== currentInitialStateString

  useEffect(() => {
    if (initialStateChanged) {
      setPageIndex(0)
      setPageCursorMap(new Map([[0, { nextCursor: null, prevCursor: null }]]))
      setFilters(memoizedInitialState.filters ?? {})
      setSearchTerm(memoizedInitialState.searchTerm ?? "")
      setQueryParams({
        ...memoizedInitialState,
        cursor: undefined,
        offset: 0 // Use 0 instead of undefined for consistency
      })
    }
    prevInitialStateRef.current = currentInitialStateString
  }, [currentInitialStateString, memoizedInitialState])

  return {
    pageSize: queryParams.pageSize,
    pageIndex,
    searchTerm,
    state: queryParams,
    filters,
    sorting,
    query,
    isLoading,
    setPageSize,
    setSearchTerm,
    handleFilterChange,
    handleSortChange,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    resetFilters
  }
}