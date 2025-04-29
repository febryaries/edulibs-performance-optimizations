
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
import { UseQueryResult } from "@tanstack/react-query";
import { useDebounce } from "./use-debounce";
import { UseControllerHook } from "./use-controllers";


export interface UseDataTable<T> {
    pageSize: number;
    pageIndex: number;
    state: PaginationParams;
    searchTerm: string;
    filters: Record<string, any>;
    sorting: { id: string; desc: boolean }[];
    query: UseQueryResult<PaginatedResult<T>, Error>;

    setPageSize: (size: number) => void;
    setSearchTerm: (term: string) => void;
    handleFilterChange: (id: string, value: any) => void;
    handleSortChange: (sorting: { id: string; desc: boolean }[]) => void;

    goToPage: (index: number) => void;
    goToNextPage: () => void;
    goToPreviousPage: () => void;
    resetFilters: () => void;
}

export function useDataTable<T, C extends TableNames, M extends ForeignKeyRelationMap<C>>(
    useController: UseControllerHook<C, M>,
    fetchHook: UsePaginatedHook<T>,
    refetchKey: string,
    initialState: PaginationParams,

): UseDataTable<T> {

    const controller = useController();
    const [queryParams, setQueryParams] = useState<PaginationParams>(initialState);
    const [pageIndex, setPageIndex] = useState(0);
    const [searchTerm, setSearchTerm] = useState(initialState?.searchTerm ?? "");

    const [filters, setFilters] = useState<Record<string, any>>(initialState?.filters ?? {});
    const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([]);

    /** Map <pageIndex, cursor|null> for O(1) cursor look‑ups. */
    const [pageCursorMap, setPageCursorMap] = useState<Map<number, QueryCursor | null>>(new Map([[0, null]]));

    // Track previous initialState to detect changes
    const prevInitialStateRef = useRef<string>("");

    const setPageSize: (size: number) => void = (size: number) => setQueryParams(prev => ({ ...prev, pageSize: size }));

    const handleFilterChange = useCallback((id: string, value: any) => {
        setFilters(prev => ({ ...prev, [id]: value }))
    }, [filters])

    const handleSortChange = useCallback((sorting: { id: string; desc: boolean }[]) => {
        setSorting(sorting)
    }, [sorting])

    const apiFilters = useCallback((): QueryFilter[] => {
        const result: QueryFilter[] = []

        for (const [key, value] of Object.entries(filters)) {
            if (!value || (Array.isArray(value) && value.length === 0)) continue

            if (Array.isArray(value)) {
                result.push({
                    column: key,
                    operator: "in",
                    value: value.map(v => (v?.value ?? v))
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
    }, [filters])


    const findClosestPage = (index: number): number => {
        let closestPage = -1;
        for (const page of pageCursorMap.keys()) {
            if (page <= index && page > closestPage) {
                closestPage = page;
            }
        }
        return closestPage;
    };

    const goToPage = async (index: number) => {
        if (index === pageIndex) return;

        const closestPage = findClosestPage(index);
        const cursor = pageCursorMap.get(closestPage) ?? null;

        let currentPage = closestPage;
        let currentCursor = cursor;

        const goingForward = index > closestPage;

        while (currentPage !== index) {
            const params: PaginationParams = {
                ...queryParams,
                cursor: currentCursor ?? undefined,
                sorts: sorting.map(s => ({ column: s.id, direction: s.desc ? 'desc' : 'asc' })),
                filters: apiFilters(),
                searchTerm,
            };

            const result = await controller.getPaginatedData(params);

            if (!result.data) break;

            const cursorToStore = goingForward
                ? result.nextCursor
                : result.prevCursor;

            if (!cursorToStore) break;

            currentPage = goingForward ? currentPage + 1 : currentPage - 1;
            currentCursor = cursorToStore;

            setPageCursorMap(prev => {
                const updated = new Map(prev);
                updated.set(currentPage, cursorToStore);
                return updated;
            });
        }

        // Set the actual cursor and page index once we've reached the desired page
        setQueryParams(prev => ({
            ...prev,
            cursor: currentCursor ?? undefined,
        }));
        setPageIndex(index);
    };

    const goToNextPage = () => {
        const next = pageIndex + 1;

        if (pageCursorMap.has(next)) {
            const nextCursor = pageCursorMap.get(next)!;
            setQueryParams(prev => ({ ...prev, cursor: nextCursor ?? undefined }));
            setPageIndex(next);
        } else if (query.data?.nextCursor) {
            const cursor = query.data.nextCursor;
            setPageCursorMap(prev => {
                const updated = new Map(prev);
                updated.set(next, cursor);
                return updated;
            });
            setQueryParams(prev => ({ ...prev, cursor }));
            setPageIndex(next);
        }
    };

    const goToPreviousPage = () => {
        const previous = pageIndex - 1;
        if (previous < 0) return;

        if (pageCursorMap.has(previous)) {
            const prevCursor = pageCursorMap.get(previous)!;
            setQueryParams(prev => ({ ...prev, cursor: prevCursor ?? undefined }));
            setPageIndex(previous);
        } else if (query.data?.prevCursor) {
            const cursor = query.data.prevCursor;
            setPageCursorMap(prev => {
                const updated = new Map(prev);
                updated.set(previous, cursor);
                return updated;
            });
            setQueryParams(prev => ({ ...prev, cursor }));
            setPageIndex(previous);
        }
    };

    const resetFilters = () => {
        setFilters({});
        setPageIndex(0);
        setPageCursorMap(new Map([[0, null]]));
        setQueryParams(prev => ({
            ...prev,
            filters: [],
            cursor: undefined,
        }));
    };

    // Memoize initialState for comparison
    const memoizedInitialState = useMemo(() => {
        return initialState;
    }, [initialState]);

    const constructedQueryParams: PaginationParams = useMemo(() => {
        return {
            ...queryParams,
            sorts: sorting.map(s => ({ column: s.id, direction: s.desc ? 'desc' : 'asc' })),
            filters: apiFilters(),
            searchTerm
        }
    }, [queryParams, sorting, filters, searchTerm]);
    const debouncedQueryParams = useDebounce(constructedQueryParams, 300);
    const query = fetchHook(debouncedQueryParams);
    const totalPages = query.data?.count ?? 0;

    // Check if initialState has changed
    const currentInitialStateString = JSON.stringify(memoizedInitialState);
    const initialStateChanged = prevInitialStateRef.current !== "" && 
                               prevInitialStateRef.current !== currentInitialStateString;

    // Reset pagination and recalculate query when initialState changes
    useEffect(() => {
        if (initialStateChanged) {
            // Reset pagination
            setPageIndex(0);
            setPageCursorMap(new Map([[0, null]]));
            
            // Update filters and search term from new initialState
            setFilters(memoizedInitialState?.filters ?? {});
            setSearchTerm(memoizedInitialState?.searchTerm ?? "");
            
            // Reset cursor and update query params
            setQueryParams(prev => ({
                ...memoizedInitialState,
                cursor: undefined,
            }));
        }
        // // console.log(`[LOG] TRIGGERING ${JSON.stringify(memoizedInitialState)}`)
        
        // Update ref to current value
        prevInitialStateRef.current = currentInitialStateString;
    }, [currentInitialStateString, memoizedInitialState]);

    return {
        /* State */
        pageSize: queryParams.pageSize,
        pageIndex,
        searchTerm,
        state: queryParams,
        filters,
        sorting,
        query,
        /* Setters */
        setPageSize,
        setSearchTerm,
        handleFilterChange,
        handleSortChange,
        /* Handlers */
        goToPage,
        goToNextPage,
        goToPreviousPage,
        resetFilters,
    }


}