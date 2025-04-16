"use client";

import { useQuery } from '@tanstack/react-query';
import { useEducationLevelsController } from './use-education-levels-controller';
import { PaginationParams, UsePaginatedHook } from '@/lib/query-controller';

/**
 * Hook to fetch education levels with pagination, filtering, and sorting
 */
export const useEducationLevels: UsePaginatedHook<any> = (params?: PaginationParams) => {
  const educationLevelsController = useEducationLevelsController();
  
  return useQuery({
    queryKey: ['education-levels', params],
    queryFn: () => educationLevelsController.getEducationLevels(params || { pageSize: 10 }),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch a single education level by ID
 */
export function useEducationLevelById(id: number) {
  const educationLevelsController = useEducationLevelsController();
  
  return useQuery({
    queryKey: ['education-level', id],
    queryFn: () => educationLevelsController.getEducationLevelById(id),
    enabled: !!id, // Only run the query if id is provided
  });
}
