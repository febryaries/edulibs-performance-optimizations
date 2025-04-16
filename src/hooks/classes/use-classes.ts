"use client";

import { useQuery } from '@tanstack/react-query';
import { useClassesController } from './use-classes-controller';
import { PaginationParams, PaginatedResult, UsePaginatedHook } from '@/lib/query-controller';

/**
 * Hook to fetch classes with pagination, filtering, and sorting
 */
export const useClasses: UsePaginatedHook<any> = (params?: PaginationParams) => {
  const classesController = useClassesController();
  
  return useQuery({
    queryKey: ['classes', params],
    queryFn: () => classesController.getClasses(params || { pageSize: 10 }),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch a single class by ID
 */
export function useClassById(id: number) {
  const classesController = useClassesController();
  
  return useQuery({
    queryKey: ['class', id],
    queryFn: () => classesController.getClassById(id),
    enabled: !!id, // Only run the query if id is provided
  });
}

/**
 * Hook to fetch classes for a specific discipline
 * This requires a custom implementation since it's not directly provided by the controller
 */
export function useClassesForDiscipline(disciplineId: number) {
  const classesController = useClassesController();
  
  return useQuery({
    queryKey: ['classes', 'discipline', disciplineId],
    queryFn: async () => {
      // Fetch classes for the discipline using the controller
      // This might need to be implemented in the controller or handled here
      // For now, we'll use a simple filter approach
      const result = await classesController.getClasses({
        pageSize: 100, // Fetch a large number to ensure we get all classes
        filters: [
          {
            column: 'discipline_id',
            operator: 'eq',
            value: disciplineId
          }
        ]
      });
      
      return result;
    },
    enabled: !!disciplineId, // Only run the query if disciplineId is provided
  });
}
