import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  ForeignKeyRelationMap,
  PaginatedResult,
  PaginationParams,
  QueryCursor,
  QueryFilter,
  QuerySort,
  TableNames,
  UsePaginatedHook,
} from "@/lib/query-controller";
import { UseQueryResult } from "@tanstack/react-query";
import { useDebounce } from "./use-debounce";
import { UseControllerHook } from "./use-controllers";

interface PageCursors {
  nextCursor: QueryCursor | null;
  prevCursor: QueryCursor | null;
}

export interface UseDataTable<T> {
  pageSize: number;
  pageIndex: number;
  state: PaginationParams;
  searchTerm: string;
  filters: Record<string, any>;
  sorting: { id: string; desc: boolean }[];
  query: UseQueryResult<PaginatedResult<T>, Error>;
  isLoading: boolean;
  count: number | null;

  setPageSize: (size: number) => void;
  setSearchTerm: (term: string) => void;
  handleFilterChange: (id: string, value: any) => void;
  handleSortChange: (sorting: { id: string; desc: boolean }[]) => void;

  goToPage: (index: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  resetFilters: () => void;
}

export function useDataTable<
  T,
  C extends TableNames,
  M extends ForeignKeyRelationMap<C>
>(
  useController: UseControllerHook<C, M>,
  fetchHook: UsePaginatedHook<T>,
  refetchKey: string,
  initialState: PaginationParams,
  initialSorting: { id: string; desc: boolean }[] = [],
  controllerConfig?: {
    fields?: (keyof any | "*")[]; // Fields to fetch
    relations?: M; // Relations to include
  }
): UseDataTable<T> {
  const controller = useController();
  const [pageIndex, setPageIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState(initialState?.searchTerm ?? "");
  const [filters, setFilters] = useState<Record<string, any>>(
    initialState?.filters ?? {}
  );
  const [sorting, setSorting] =
    useState<{ id: string; desc: boolean }[]>(initialSorting);
  const [queryParams, setQueryParams] =
    useState<PaginationParams>(initialState);
  const [pageCursorMap, setPageCursorMap] = useState<Map<number, PageCursors>>(
    new Map([[0, { nextCursor: null, prevCursor: null }]])
  );
  const [isNavigating, setIsNavigating] = useState(false);
  const prevInitialStateRef = useRef<string>("");

  // New state for count management
  const [count, setCount] = useState<number | null>(null);
  const [needsCount, setNeedsCount] = useState<boolean>(true); // Start with true to get initial count

  // Track previous values to detect changes
  const prevFiltersRef = useRef<Record<string, any>>({});
  const prevSearchTermRef = useRef<string>("");
  const prevSearchColumnsRef = useRef<any[]>([]);

  const apiFilters = useCallback((): QueryFilter[] => {
    const result: QueryFilter[] = [];
    for (const [key, value] of Object.entries(filters)) {
      if (!value || (Array.isArray(value) && value.length === 0)) continue;

      if (Array.isArray(value)) {
        result.push({
          column: key,
          operator: "in",
          value: value.map((v) => v?.value ?? v),
        });
      } else if (
        typeof value === "object" &&
        value !== null &&
        "from" in value &&
        "to" in value
      ) {
        const { from, to } = value as { from?: Date; to?: Date };
        if (from) {
          const tmp = new Date(from);
          tmp.setHours(0, 0, 0, 0);
          result.push({
            column: key,
            operator: "gte",
            value: tmp.toISOString().split("T")[0],
          });
        }
        if (to) {
          const tmp = new Date(to);
          tmp.setHours(23, 59, 59, 999);
          result.push({
            column: key,
            operator: "lte",
            value: tmp.toISOString().split("T")[0],
          });
        }
      } else {
        result.push({
          column: key,
          operator: "eq",
          value: value?.value ?? value,
        });
      }
    }
    return result;
  }, [filters]);

  const constructedQueryParams: PaginationParams = useMemo(() => {
    const filtersChanged =
      JSON.stringify(filters) !== JSON.stringify(prevFiltersRef.current);
    const searchTermChanged = searchTerm !== prevSearchTermRef.current;
    const searchColumnsChanged =
      JSON.stringify(queryParams.searchColumns) !==
      JSON.stringify(prevSearchColumnsRef.current);

    prevFiltersRef.current = filters;
    prevSearchTermRef.current = searchTerm;
    prevSearchColumnsRef.current = queryParams.searchColumns || [];

    const params: PaginationParams = {
      pageSize: queryParams.pageSize,
      filters: apiFilters(),
      sorts: sorting.map((s) => ({
        column: s.id,
        direction: s.desc ? "desc" : ("asc" as const),
      })),
      searchTerm,
      searchColumns: queryParams.searchColumns, // Explicitly include searchColumns
      cursor: queryParams.cursor,
      offset: queryParams.offset,
      withCount: filtersChanged || searchTermChanged || searchColumnsChanged, // Only fetch count when needed
    };
    console.log("[useDataTable] constructedQueryParams", {
      params,
      searchColumns: params.searchColumns,
      withCount: params.withCount,
    });
    return params;
  }, [
    queryParams.pageSize,
    queryParams.cursor,
    queryParams.offset,
    queryParams.searchColumns,
    apiFilters,
    sorting,
    searchTerm,
    needsCount,
  ]);

  const debouncedQueryParams = useDebounce(constructedQueryParams, 800); // Increased from 300ms to 800ms to reduce API calls
  // Pass the controller config to enhance data fetching with custom fields and relations
  const query = fetchHook(debouncedQueryParams, controllerConfig);

  const isLoading = query.isLoading || query.isFetching || isNavigating;

  useEffect(() => {
    if (query.data?.count !== null && query.data?.count !== undefined) {
      console.log("[useDataTable] setCount", query.data.count);
      setCount(query.data.count);
    }
  }, [query.data?.count]);

  useEffect(() => {
    if (!query.isLoading && !query.isFetching) {
      setIsNavigating(false);
    }
  }, [query.isLoading, query.isFetching]);

  const setPageSize = (size: number) => {
    setQueryParams((prev) => ({
      ...prev,
      pageSize: size,
      cursor: undefined,
      offset: 0,
    }));
    setPageIndex(0);
    setPageCursorMap(new Map([[0, { nextCursor: null, prevCursor: null }]]));
    // Don't need to trigger count refresh for page size changes
  };

  // Add debugging to the search term setter
  const updateSearchTerm = (term: string) => {
    console.log("[useDataTable] updateSearchTerm", {
      term,
      searchColumns: queryParams.searchColumns,
    });
    setSearchTerm(term);
    setPageIndex(0);
    setPageCursorMap(new Map([[0, { nextCursor: null, prevCursor: null }]]));
    setQueryParams((prev) => ({
      ...prev,
      searchTerm: term,
      searchColumns: prev.searchColumns, // Ensure searchColumns is preserved
      cursor: undefined,
      offset: 0,
    }));
    // needsCount will be set to true by the useEffect that watches searchTerm
  };

  const handleFilterChange = useCallback(
    (id: string, value: any) => {
      console.log("[useDataTable] handleFilterChange", {
        id,
        value,
        searchColumns: queryParams.searchColumns,
      });
      setFilters((prev) => ({ ...prev, [id]: value }));
      // Reset pagination when filters change
      setPageIndex(0);
      setPageCursorMap(new Map([[0, { nextCursor: null, prevCursor: null }]]));
      setQueryParams((prev) => ({ ...prev, cursor: undefined, offset: 0 }));
      // needsCount will be set to true by the useEffect that watches filters
    },
    [queryParams.searchColumns]
  );

  const handleSortChange = useCallback(
    (newSorting: { id: string; desc: boolean }[]) => {
      setSorting(newSorting);
      // Reset pagination when sorting changes
      setPageIndex(0);
      setPageCursorMap(new Map([[0, { nextCursor: null, prevCursor: null }]]));
      setQueryParams((prev) => ({ ...prev, cursor: undefined, offset: 0 }));
      // Sorting changes don't need count refresh since they don't change the total number of results
    },
    []
  );

  const goToNextPage = useCallback(() => {
    // Don't proceed if we're loading or there's no next cursor
    if (isLoading || !query.data?.nextCursor) return;

    setIsNavigating(true);
    const next = pageIndex + 1;

    // Store the current cursors for next page
    setPageCursorMap((prev) => {
      const updated = new Map(prev);
      updated.set(next, {
        nextCursor: query.data!.nextCursor,
        prevCursor: query.data!.prevCursor,
      });
      return updated;
    });

    // Set cursor for next page navigation
    setQueryParams((prev) => ({
      ...prev,
      cursor: query.data!.nextCursor || undefined,
      offset: undefined, // Clear offset when using cursor pagination
    }));

    setPageIndex(next);
  }, [isLoading, pageIndex, query.data?.nextCursor, query.data?.prevCursor]);

  const goToPreviousPage = useCallback(() => {
    // Don't proceed if we're on the first page or loading
    if (pageIndex <= 0 || isLoading) return;

    setIsNavigating(true);
    const previous = pageIndex - 1;

    // Get the cursor information for the previous page
    const cursorPair = pageCursorMap.get(previous);

    // If we don't have cursor information for the previous page, use offset-based pagination
    if (!cursorPair) {
      // Fallback to offset-based pagination
      setQueryParams((prev) => ({
        ...prev,
        cursor: undefined,
        offset: previous * queryParams.pageSize,
      }));
      setPageIndex(previous);
      return;
    }

    // Use the stored cursor information to navigate
    setQueryParams((prev) => ({
      ...prev,
      cursor: cursorPair.prevCursor || undefined,
      offset: undefined, // Clear offset when using cursor pagination
    }));

    setPageIndex(previous);
  }, [isLoading, pageIndex, pageCursorMap, queryParams.pageSize]);

  const goToPage = useCallback(
    async (index: number) => {
      if (index === pageIndex || index < 0) return;

      setIsNavigating(true);

      try {
        // For direct page navigation, use offset-based pagination
        const result = await controller.getPaginatedData({
          pageSize: queryParams.pageSize,
          filters: apiFilters(),
          sorts: sorting.map((s) => ({
            column: s.id,
            direction: s.desc ? "desc" : "asc",
          })),
          searchTerm,
          offset: index * queryParams.pageSize, // Use zero-based indexing
          cursor: undefined, // Clear cursor when using offset pagination
          withCount: false, // Don't fetch count for page navigation
        });

        // Update page cursor map
        setPageCursorMap((prev) => {
          const updated = new Map(prev);
          updated.set(index, {
            nextCursor: result.nextCursor,
            prevCursor: result.prevCursor,
          });
          return updated;
        });

        // Update query params for the current view
        // Note: We're setting BOTH cursors to null/undefined here
        // because we want to use the offset we just navigated to
        setQueryParams((prev) => ({
          ...prev,
          cursor: undefined,
          offset: index * queryParams.pageSize,
        }));

        setPageIndex(index);
      } catch (e) {
        setIsNavigating(false);
        console.error("Error navigating to page:", e);
        throw e;
      }
    },
    [
      controller,
      queryParams.pageSize,
      apiFilters,
      sorting,
      searchTerm,
      pageIndex,
    ]
  );

  const resetFilters = useCallback(() => {
    if (isNavigating) return;

    setFilters({});
    setSearchTerm("");
    setPageIndex(0);
    setPageCursorMap(new Map([[0, { nextCursor: null, prevCursor: null }]]));
    setQueryParams((prev) => ({
      ...prev,
      cursor: undefined,
      offset: 0,
      searchTerm: "",
      filters: [],
    }));
    // needsCount will be set to true by the useEffect that watches filters and searchTerm
  }, [isNavigating]);

  const memoizedInitialState = useMemo(() => initialState, [initialState]);
  const currentInitialStateString = JSON.stringify(memoizedInitialState);
  const initialStateChanged =
    prevInitialStateRef.current !== "" &&
    prevInitialStateRef.current !== currentInitialStateString;

  useEffect(() => {
    if (initialStateChanged) {
      setPageIndex(0);
      setPageCursorMap(new Map([[0, { nextCursor: null, prevCursor: null }]]));
      setFilters(memoizedInitialState.filters ?? {});
      setSearchTerm(memoizedInitialState.searchTerm ?? "");
      setQueryParams({
        ...memoizedInitialState,
        cursor: undefined,
        offset: 0, // Use 0 instead of undefined for consistency
      });
      // This will trigger count refresh through the useEffect watching these values
    }
    prevInitialStateRef.current = currentInitialStateString;
  }, [currentInitialStateString, memoizedInitialState]);

  return {
    pageSize: queryParams.pageSize,
    pageIndex,
    searchTerm,
    state: queryParams,
    filters,
    sorting,
    query,
    isLoading,
    count, // Return the count state
    setPageSize,
    setSearchTerm: updateSearchTerm, // Use our debug-enabled function
    handleFilterChange,
    handleSortChange,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    resetFilters,
  };
}
