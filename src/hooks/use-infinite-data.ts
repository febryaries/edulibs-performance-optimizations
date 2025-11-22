"use client"

import { useCallback, useMemo, useReducer } from "react"
import type {
  PaginatedResult,
  PaginationParams,
  QueryFilter,
} from "@/lib/query-controller"
import { useInfiniteQuery, UseInfiniteQueryResult } from "@tanstack/react-query"

export interface UseInfiniteDataTable<T> {
  pageSize: number
  pageIndex: number
  totalPages: number
  state: PaginationParams
  searchTerm: string
  filters: QueryFilter[]
  filtersRecord: Record<string, any> // Added for backward compatibility
  sorting: { id: string; desc: boolean }[]
  query: UseInfiniteQueryResult<PaginatedResult<T>, Error>
  results: T[]

  setPageSize: (size: number) => void
  setSearchTerm: (term: string) => void
  handleFiltersChanged: (filters: QueryFilter[]) => void
  handleFilterChange: (column: string, value: any) => void
  handleSortChange: (sorting: { id: string; desc: boolean }[]) => void
  handleEnable: () => void

  goToNextPage: () => void
  goToPreviousPage: () => void
  resetFilters: () => void
}

export interface DataTableState<T> {
  queryParams: PaginationParams
  pageIndex: number
  filtersRecord: Record<string, any> // Renamed from filters to filtersRecord
  filters: QueryFilter[] // Added QueryFilter[] type
  sorting: { id: string; desc: boolean }[]
  searchTerm: string
  resultsMap: Map<number, T[]>
  filterChangeCounter: number // Track filter changes to reset query
}

// 🛡️ Utility to avoid "undefined" column issues
function toValidQueryFilters(filters: Record<string, any>): QueryFilter[] {
  return Object.entries(filters)
    .filter(([key]) => key && key !== "undefined")
    .map(([key, value]) => ({
      column: key,
      operator: "eq" as const, // 👈 force literal
      value
    }))
}

// Convert QueryFilter[] to Record<string, any> for backward compatibility
function toFilterRecord(filters: QueryFilter[]): Record<string, any> {
  return filters.reduce((acc, filter) => {
    if (filter.column) {
      acc[filter.column] = filter.value;
    }
    return acc;
  }, {} as Record<string, any>);
}

export function useInfiniteDataTable<T>(
  fetchHook: (params: PaginationParams) => Promise<PaginatedResult<T>>,
  initialState: PaginationParams,
  key: string
): UseInfiniteDataTable<T> {
  // Setup state with reducer pattern to match original implementation
  const [state, setState] = useReducer(
    (prev: DataTableState<T>, next: Partial<DataTableState<T>>) => ({
      ...prev,
      ...next
    }),
    {
      queryParams: initialState,
      pageIndex: 0,
      filtersRecord: initialState.filters ? toFilterRecord(initialState.filters) : {},
      filters: initialState.filters || [],
      sorting: initialState.sorts?.map(s => ({ id: s.column, desc: s.direction === "desc" })) || [],
      searchTerm: initialState.searchTerm || "",
      resultsMap: new Map(),
      filterChangeCounter: 0,
    }
  )

  // Compute the effective params for the current state
  const computeQueryParams = useCallback((cursor?: PaginationParams['cursor']): PaginationParams => {
    return {
      ...state.queryParams,
      pageSize: state.queryParams.pageSize,
      filters: state.filters,
      sorts: state.sorting.map(({ id, desc }) => ({
        column: id,
        direction: desc ? "desc" : "asc"
      })),
      searchTerm: state.searchTerm,
      cursor, // Use cursor when provided
      withCount: true,
      disabled: state.queryParams.disabled
    }
  }, [state.queryParams, state.filters, state.sorting, state.searchTerm])

  // Create a queryKey that includes the filterChangeCounter
  const queryKey = useMemo(() =>
    [key, state.queryParams.pageSize, state.searchTerm, state.filters, state.sorting, state.filterChangeCounter, state.queryParams.disabled   ],
    [key, state.queryParams.pageSize, state.searchTerm, state.filters, state.sorting, state.filterChangeCounter, state.queryParams.disabled]
  )

  // Set up the infinite query
  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const params = computeQueryParams(pageParam)
      return await fetchHook(params)
    },
    getNextPageParam: (lastPage) => {
      // Return the nextCursor directly from the last page result
      return lastPage?.nextCursor || undefined
    },
    initialPageParam: undefined as any // Start with no cursor
  })

  // Accumulate results from all pages up to the current page index
  const results = useMemo(() => {
    if (!query.data?.pages) return []

    // Update the results map to cache page results
    const updatedMap = new Map(state.resultsMap)
    query.data.pages.forEach((page, index) => {
      updatedMap.set(index, page.data)
    })

    // We need to spread to avoid React's object reference equality check
    if (updatedMap.size !== state.resultsMap.size) {
      setState({ resultsMap: updatedMap })
    }

    // Accumulate all results from pages 0 up to and including the current page
    let accumulatedResults: T[] = []

    // Get all pages up to the current page index
    const pagesToInclude = Math.min(state.pageIndex + 1, query.data.pages.length)

    for (let i = 0; i < pagesToInclude; i++) {
      if (query.data.pages[i]?.data) {
        accumulatedResults = [...accumulatedResults, ...query.data.pages[i].data]
      }
    }

    return accumulatedResults
  }, [query.data, state.pageIndex, state.resultsMap])

  // Calculate total pages based on the count from the first page
  const totalPages = useMemo(() => {
    if (!query.data?.pages[0]?.count) return 0
    return Math.ceil(query.data.pages[0].count / state.queryParams.pageSize)
  }, [query.data?.pages, state.queryParams.pageSize])

  // Reset function to invalidate query when filters change
  const resetQueryData = useCallback(() => {
    // Increment the counter to force a new query
    setState({
      filterChangeCounter: state.filterChangeCounter + 1,
      pageIndex: 0
    })
  }, [state.filterChangeCounter])

  // Handler for changing page size
  const setPageSize = (size: number) => {
    setState({
      queryParams: { ...state.queryParams, pageSize: size }
    })
    resetQueryData()
  }

  // Handler for setting search term
  const setSearchTerm = (term: string) => {
    setState({
      searchTerm: term,
      queryParams: { ...state.queryParams, searchTerm: term }
    })
    resetQueryData()
  }

  // Handler for changing a single filter
  const handleFilterChange = (column: string, value: any) => {
    // Create a new filter for this column
    const newFilter: QueryFilter = { column, operator: 'eq', value }

    // Update the filters array by replacing any existing filter with the same column
    const updatedFilters = state.filters.filter(f => f.column !== column)
    updatedFilters.push(newFilter)

    // Update the filtersRecord for backward compatibility
    const filtersRecord = { ...state.filtersRecord, [column]: value }

    setState({
      filtersRecord,
      filters: updatedFilters,
      queryParams: {
        ...state.queryParams,
        filters: updatedFilters
      }
    })
    resetQueryData()
  }

  const handleEnable = () => {
    setState({
      queryParams: { ...state.queryParams, disabled: false }
    })
    resetQueryData()
  }

  // Handler for changing multiple filters at once
  const handleFiltersChanged = (filters: QueryFilter[]) => {
    // Update the filtersRecord for backward compatibility
    const filtersRecord = filters.reduce((acc, filter) => {
      if (filter.column) {
        acc[filter.column] = filter.value;
      }
      return acc;
    }, {} as Record<string, any>);

    setState({
      filtersRecord,
      filters,
      queryParams: {
        ...state.queryParams,
        filters
      }
    })
    resetQueryData()
  }

  // Handler for changing sorting
  const handleSortChange = (sorting: { id: string; desc: boolean }[]) => {
    setState({
      sorting,
      queryParams: {
        ...state.queryParams,
        sorts: sorting.map(({ id, desc }) => ({
          column: id,
          direction: desc ? "desc" : "asc"
        }))
      }
    })
    resetQueryData()
  }

  // Navigation methods
  const goToNextPage = () => {
    // Trigger fetching the next page if needed
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage()
    }

    setState({
      pageIndex: state.pageIndex + 1
    })
  }

  const goToPreviousPage = () => {
    if (state.pageIndex > 0) {
      setState({
        pageIndex: state.pageIndex - 1
      })
    }
  }

  // Handler for resetting filters
  const resetFilters = () => {
    setState({
      filtersRecord: {},
      filters: [],
      sorting: [],
      searchTerm: "",
      resultsMap: new Map(),
      queryParams: {
        ...initialState,
        filters: initialState.filters || [],
        sorts: [],
        searchTerm: ""
      }
    })
    resetQueryData()
  }

  return {
    pageSize: state.queryParams.pageSize,
    pageIndex: state.pageIndex,
    totalPages,
    state: computeQueryParams(),
    searchTerm: state.searchTerm,
    filters: state.filters,
    filtersRecord: state.filtersRecord,
    sorting: state.sorting,
    query,
    results,

    setPageSize,
    setSearchTerm,
    handleFilterChange,
    handleFiltersChanged,
    handleSortChange,
    handleEnable,
    goToNextPage,
    goToPreviousPage,
    resetFilters
  }
}