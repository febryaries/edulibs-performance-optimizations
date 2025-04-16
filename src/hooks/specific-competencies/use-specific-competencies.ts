"use client";

import { useQuery } from '@tanstack/react-query';
import { useSpecificCompetenciesController } from './use-specific-competencies-controller';
import { PaginationParams, UsePaginatedHook } from '@/lib/query-controller';

/**
 * Hook to fetch specific competencies with pagination, filtering, and sorting
 */
export const useSpecificCompetencies: UsePaginatedHook<any> = (params?: PaginationParams) => {
  const specificCompetenciesController = useSpecificCompetenciesController();
  
  return useQuery({
    queryKey: ['specific-competencies', params],
    queryFn: () => specificCompetenciesController.getSpecificCompetencies(params || { pageSize: 10 }),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch a single specific competency by ID
 */
export function useSpecificCompetencyById(id: number) {
  const specificCompetenciesController = useSpecificCompetenciesController();
  
  return useQuery({
    queryKey: ['specific-competency', id],
    queryFn: () => specificCompetenciesController.getSpecificCompetencyById(id),
    enabled: !!id, // Only run the query if id is provided
  });
}

/**
 * Hook to fetch specific competencies for a specific class
 */
export function useSpecificCompetenciesForClass(classId: number) {
  const specificCompetenciesController = useSpecificCompetenciesController();
  
  return useQuery({
    queryKey: ['specific-competencies', 'class', classId],
    queryFn: () => specificCompetenciesController.getSpecificCompetencies({
      pageSize: 100, // Fetch a large number to ensure we get all competencies
      filters: [
        {
          column: 'class_id',
          operator: 'eq',
          value: classId
        }
      ],
      sorts: [{ column: 'number', direction: 'asc' }]
    }),
    enabled: !!classId, // Only run the query if classId is provided
  });
}
