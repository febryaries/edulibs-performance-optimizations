"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Check, ChevronDown, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  PaginationParams,
  UsePaginatedHook,
  QueryFilter,
  PaginatedResult,
  WithRelations,
  TableNames,
  ForeignKeyRelationMap,
} from "@/lib/query-controller";
import { InView } from "react-intersection-observer";
import { useInfiniteDataTable } from "@/hooks/use-infinite-data";
import { useDebounce } from "@/hooks/use-debounce";

export interface FilterOption {
  value: string;
  label: string;
}

interface ControllerConfig<T> {
  valueField: keyof T | string;
  labelField: keyof T | string;
  pageSize?: number;
  searchColumns?: string[];
}

interface FilterButtonProps<
  T extends TableNames,
  M extends ForeignKeyRelationMap<T>
> {
  filterKey?: string;
  icon?: React.ReactNode;
  label: string;
  options?: FilterOption[];
  fetchHook?: (
    params: PaginationParams
  ) => Promise<PaginatedResult<WithRelations<T, M>>>;
  controllerConfig?: ControllerConfig<T>;
  onChange?: (selectedOptions: string[]) => void;
  className?: string;
  defaultSelected?: string[];
  filters?: QueryFilter[];
}

export function FilterButton<
  T extends TableNames,
  M extends ForeignKeyRelationMap<T>
>({
  filterKey,
  icon = <Circle className="h-4 w-4 text-gray-400" />,
  label,
  options = [],
  fetchHook,
  controllerConfig,
  onChange,
  className,
  defaultSelected = [],
  filters,
}: FilterButtonProps<T, M>) {
  // Refs
  const filterRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<FilterOption[]>(options);

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] =
    useState<string[]>(defaultSelected);

  // Determine if we're using hook mode (with useQueryHook)
  const isHookMode = !!fetchHook;

  // State for search input and debounced term
  const [searchInput, setSearchInput] = useState<string>("");
  const debouncedSearchTerm = useDebounce(searchInput, 300); // 300ms debounce delay
  const prevSearchTermRef = useRef<string>("");
  const [filteredOptions, setFilteredOptions] =
    useState<FilterOption[]>(options);

  const [openedFirstTime, setOpenedFirstTime] = useState(false);

  // Initialize memoized params for useInfiniteDataTable
  const initialParams = {
    pageSize: controllerConfig?.pageSize || 10,
    searchTerm: "",
    searchColumns: controllerConfig?.searchColumns || [],
    filters: filters || [],
    disabled: true,
  };

  // Use the infinite data hook for dynamic options (only when in hook mode)
  const {
    searchTerm,
    setSearchTerm,
    query,
    goToNextPage,
    results,
    handleFiltersChanged,
    handleEnable,
  } = isHookMode
    ? useInfiniteDataTable(
        fetchHook,
        initialParams,
        "filter-button-" + (filterKey || label)
      )
    : {
        searchTerm: "",
        setSearchTerm: () => {},
        query: { isLoading: false, isFetching: false, data: null } as any,
        goToNextPage: () => {},
        results: [] as T[],
        handleFiltersChanged: () => {},
        handleEnable: () => {},
      };

  // Use a ref to track previous filters to avoid unnecessary updates
  const prevFiltersRef = useRef<QueryFilter[] | undefined>(undefined);

  // Update filters when they change
  useEffect(() => {
    if (isHookMode && filters) {
      // Only update if filters have actually changed
      const currentFiltersStr = JSON.stringify(filters || []);
      const prevFiltersStr = prevFiltersRef.current
        ? JSON.stringify(prevFiltersRef.current)
        : "";

      if (currentFiltersStr !== prevFiltersStr) {
        // Pass filters directly to handleFiltersChanged since it now accepts QueryFilter[]
        handleFiltersChanged(filters);
        // Update the ref to the current filters
        prevFiltersRef.current = filters;
      }
    }
  }, [isHookMode, filters]); // Remove handleFiltersChanged from dependencies

  // This effect will be moved after handleStaticSearch is defined

  // Map dynamic results to FilterOption format
  const dynamicOptions = useCallback(() => {
    if (!isHookMode || !controllerConfig) {
      return [];
    }

    const mappedOptions = results
      .map((item) => {
        try {
          // Safely access properties using a helper function
          const getValue = (obj: any, prop: string | keyof any) => {
            return typeof obj === "object" && obj !== null
              ? obj[prop as string]
              : undefined;
          };

          const valueField = controllerConfig.valueField;
          const labelField = controllerConfig.labelField;

          const value = getValue(item, valueField);
          const label = getValue(item, labelField);

          return {
            value: String(value || ""),
            label: String(label || ""),
          };
        } catch (err) {
          console.warn("Error mapping option:", err);
          return { value: "", label: "Error" };
        }
      })
      .filter((option) => option.value !== "");

    return mappedOptions;
  }, [isHookMode, controllerConfig, results]);

  // Handle dropdown open/close
  const handleOpenChange = useCallback(() => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      handleEnable();
    }
  }, [isOpen]);

  // Handle search for static options
  const handleStaticSearch = useCallback((value: string) => {
    if (value) {
      setFilteredOptions(
        optionsRef.current.filter((option) =>
          option.label.toLowerCase().includes(value.toLowerCase())
        )
      );
    } else {
      setFilteredOptions(optionsRef.current);
    }
  }, []);

  // Apply debounced search term
  useEffect(() => {
    // Only update if the debounced term has actually changed from previous value
    if (debouncedSearchTerm !== prevSearchTermRef.current) {
      // Update the ref to track the current search term
      prevSearchTermRef.current = debouncedSearchTerm;

      if (isHookMode) {
        setSearchTerm(debouncedSearchTerm);
      } else {
        handleStaticSearch(debouncedSearchTerm);
      }
    }
  }, [debouncedSearchTerm, isHookMode, setSearchTerm, handleStaticSearch]);

  // Handle search input changes
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchInput(value);
    },
    []
  );

  // Handle option selection toggle
  const toggleOption = useCallback(
    (optionValue: string) => {
      setSelectedOptions((prev) => {
        const newSelected = prev.includes(optionValue)
          ? prev.filter((value) => value !== optionValue)
          : [...prev, optionValue];

        // Notify parent component if onChange is provided
        if (onChange) {
          setTimeout(() => onChange(newSelected), 0);
        }

        return newSelected;
      });

      // Close dropdown after selection
      setTimeout(() => setIsOpen(false), 100);
    },
    [onChange]
  );

  // Add click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Get display value for button
  const getDisplayValue = useCallback(() => {
    const count = selectedOptions.length;
    if (count === 0) return "Nimic selectat";
    if (count === 1) return "1 selectat";
    return `${count} selectate`;
  }, [selectedOptions.length]);

  // Get the current options to display
  const currentOptions = isHookMode ? dynamicOptions() : filteredOptions;
  const isLoading = isHookMode && (query.isLoading || query.isFetching);
  const hasMoreResults = isHookMode && query.hasNextPage;

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
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
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
              value={searchInput}
            />
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {currentOptions.map((option) => (
              <div
                key={option.value}
                className="flex items-center space-x-2 rounded px-2 py-1.5 hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOption(option.value);
                }}
              >
                <div className="flex min-h-4 min-w-4 h-4 w-4 flex-shrink-0 items-center justify-center rounded border border-gray-300 bg-white">
                  {selectedOptions.includes(option.value) && (
                    <Check className="h-3 w-3 text-blue-600" />
                  )}
                </div>
                <div className="flex items-center text-sm">{option.label}</div>
              </div>
            ))}

            {(isLoading || (isHookMode && query.isFetchingNextPage)) && (
              <div className="py-2 text-center">
                <Loader2 className="mx-auto h-4 w-4 animate-spin text-gray-400" />
              </div>
            )}

            {isHookMode && !query.isFetchingNextPage && results.length > 0 && (
              <InView
                as="div"
                onChange={(inView) => {
                  if (
                    inView &&
                    !query.isFetchingNextPage &&
                    query.hasNextPage
                  ) {
                    goToNextPage();
                  }
                }}
              >
                <div className="py-2 text-center">
                  <span className="text-xs text-gray-500">
                    Scroll pentru mai multe
                  </span>
                </div>
              </InView>
            )}

            {currentOptions.length === 0 && !isLoading && (
              <div className="py-2 text-center text-sm text-gray-500">
                Nu s-au găsit rezultate
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
