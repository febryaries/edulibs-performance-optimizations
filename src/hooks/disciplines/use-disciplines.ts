"use client";

import { useQuery } from '@tanstack/react-query';
import { useDisciplinesController } from './use-disciplines-controller';
import { PaginationParams, UsePaginatedHook } from '@/lib/query-controller';

/**
 * Hook to fetch disciplines with pagination, filtering, and sorting
 */
export const useDisciplines: UsePaginatedHook<any> = (params?: PaginationParams) => {
  const disciplinesController = useDisciplinesController();
  
  return useQuery({
    queryKey: ['disciplines', params],
    queryFn: () => disciplinesController.getDisciplines(params || { pageSize: 10 }),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch a single discipline by ID
 */
export function useDisciplineById(id: number) {
  const disciplinesController = useDisciplinesController();
  
  return useQuery({
    queryKey: ['discipline', id],
    queryFn: () => disciplinesController.getDisciplineById(id),
    enabled: !!id, // Only run the query if id is provided
  });
}

/**
 * Hook to fetch disciplines for a specific education level
 */
export function useDisciplinesForEducationLevel(levelId: number) {
  const disciplinesController = useDisciplinesController();
  
  return useQuery({
    queryKey: ['disciplines', 'level', levelId],
    queryFn: () => disciplinesController.getDisciplines({
      pageSize: 100, // Fetch a large number to ensure we get all disciplines
      filters: [
        {
          column: 'level_id',
          operator: 'eq',
          value: levelId
        }
      ]
    }),
    enabled: !!levelId, // Only run the query if levelId is provided
  });
}
