"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGeneralCompetenciesController } from './use-general-competencies-controller';
import { PaginationParams, UsePaginatedHook } from '@/lib/query-controller';
import { GeneralCompetencyWithRelations } from '@/queries/general-competencies-controller';

/**
 * Hook to fetch general competencies with pagination, filtering, and sorting
 */
export const useGeneralCompetencies: UsePaginatedHook<GeneralCompetencyWithRelations> = (params?: PaginationParams) => {
  const generalCompetenciesController = useGeneralCompetenciesController();
  
  return useQuery({
    queryKey: ['general-competencies', params],
    queryFn: () => generalCompetenciesController.getGeneralCompetencies(params || { pageSize: 10 }),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch a single general competency by ID
 */
export function useGeneralCompetencyById(id: number) {
  const generalCompetenciesController = useGeneralCompetenciesController();
  
  return useQuery({
    queryKey: ['general-competency', id],
    queryFn: () => generalCompetenciesController.getGeneralCompetencyById(id),
    enabled: !!id, // Only run the query if id is provided
  });
}

/**
 * Hook to fetch general competencies for a specific discipline
 */
export function useGeneralCompetenciesByDisciplineId(disciplineId: number, params?: PaginationParams) {
  const generalCompetenciesController = useGeneralCompetenciesController();
  
  return useQuery({
    queryKey: ['general-competencies', 'discipline', disciplineId, params],
    queryFn: () => generalCompetenciesController.getGeneralCompetenciesByDisciplineId(disciplineId, params || { pageSize: 10 }),
    enabled: !!disciplineId, // Only run the query if disciplineId is provided
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch general competencies for a specific education level
 */
export function useGeneralCompetenciesByLevelId(levelId: number, params?: PaginationParams) {
  const generalCompetenciesController = useGeneralCompetenciesController();
  
  return useQuery({
    queryKey: ['general-competencies', 'level', levelId, params],
    queryFn: () => generalCompetenciesController.getGeneralCompetenciesByLevelId(levelId, params || { pageSize: 10 }),
    enabled: !!levelId, // Only run the query if levelId is provided
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to create a new general competency
 */
export function useCreateGeneralCompetency() {
  const generalCompetenciesController = useGeneralCompetenciesController();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { discipline_id: number; level_id: number; name: string; description?: string }) => 
      generalCompetenciesController.createGeneralCompetency(data),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['general-competencies'] });
      queryClient.invalidateQueries({ queryKey: ['general-competencies', 'discipline', variables.discipline_id] });
      queryClient.invalidateQueries({ queryKey: ['general-competencies', 'level', variables.level_id] });
    },
  });
}

/**
 * Hook to update an existing general competency
 */
export function useUpdateGeneralCompetency() {
  const generalCompetenciesController = useGeneralCompetenciesController();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; description?: string } }) => 
      generalCompetenciesController.updateGeneralCompetency(id, data),
    onSuccess: (result) => {
      if (result) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['general-competencies'] });
        queryClient.invalidateQueries({ queryKey: ['general-competency', result.id] });
        queryClient.invalidateQueries({ queryKey: ['general-competencies', 'discipline', result.discipline_id] });
        queryClient.invalidateQueries({ queryKey: ['general-competencies', 'level', result.level_id] });
      }
    },
  });
}

/**
 * Hook to delete a general competency
 */
export function useDeleteGeneralCompetency() {
  const generalCompetenciesController = useGeneralCompetenciesController();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => generalCompetenciesController.deleteGeneralCompetency(id),
    onSuccess: (result) => {
      if (result) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['general-competencies'] });
        queryClient.removeQueries({ queryKey: ['general-competency', result.id] });
        queryClient.invalidateQueries({ queryKey: ['general-competencies', 'discipline', result.discipline_id] });
        queryClient.invalidateQueries({ queryKey: ['general-competencies', 'level', result.level_id] });
      }
    },
  });
}
