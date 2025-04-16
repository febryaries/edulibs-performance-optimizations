"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useResourceCompetenciesController } from './use-resource-competencies-controller';
import { PaginationParams, UsePaginatedHook } from '@/lib/query-controller';
import { ResourceCompetencyWithRelations } from '@/queries/resource-competencies-controller';

/**
 * Hook to fetch resource competencies with pagination, filtering, and sorting
 */
export const useResourceCompetencies: UsePaginatedHook<ResourceCompetencyWithRelations> = (params?: PaginationParams) => {
  const resourceCompetenciesController = useResourceCompetenciesController();
  
  return useQuery({
    queryKey: ['resource-competencies', params],
    queryFn: () => resourceCompetenciesController.getResourceCompetencies(params || { pageSize: 10 }),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch a single resource competency by ID
 */
export function useResourceCompetencyById(id: string) {
  const resourceCompetenciesController = useResourceCompetenciesController();
  
  return useQuery({
    queryKey: ['resource-competency', id],
    queryFn: () => resourceCompetenciesController.getResourceCompetencyById(id),
    enabled: !!id, // Only run the query if id is provided
  });
}

/**
 * Hook to fetch resource competencies for a specific resource
 */
export function useResourceCompetenciesByResourceId(resourceId: string, params?: PaginationParams) {
  const resourceCompetenciesController = useResourceCompetenciesController();
  
  return useQuery({
    queryKey: ['resource-competencies', 'resource', resourceId, params],
    queryFn: () => resourceCompetenciesController.getResourceCompetenciesByResourceId(resourceId, params || { pageSize: 10 }),
    enabled: !!resourceId, // Only run the query if resourceId is provided
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch resource competencies for a specific competency
 */
export function useResourceCompetenciesByCompetencyId(competencyId: number, params?: PaginationParams) {
  const resourceCompetenciesController = useResourceCompetenciesController();
  
  return useQuery({
    queryKey: ['resource-competencies', 'competency', competencyId, params],
    queryFn: () => resourceCompetenciesController.getResourceCompetenciesByCompetencyId(competencyId, params || { pageSize: 10 }),
    enabled: !!competencyId, // Only run the query if competencyId is provided
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to create a new resource competency relationship
 */
export function useCreateResourceCompetency() {
  const resourceCompetenciesController = useResourceCompetenciesController();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { resource_id: string; competency_id: number }) => 
      resourceCompetenciesController.createResourceCompetency(data),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['resource-competencies'] });
      queryClient.invalidateQueries({ queryKey: ['resource-competencies', 'resource', variables.resource_id] });
      queryClient.invalidateQueries({ queryKey: ['resource-competencies', 'competency', variables.competency_id] });
    },
  });
}

/**
 * Hook to delete a resource competency relationship
 */
export function useDeleteResourceCompetency() {
  const resourceCompetenciesController = useResourceCompetenciesController();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => resourceCompetenciesController.deleteResourceCompetency(id),
    onSuccess: (result) => {
      if (result) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['resource-competencies'] });
        queryClient.removeQueries({ queryKey: ['resource-competency', result.id] });
        queryClient.invalidateQueries({ queryKey: ['resource-competencies', 'resource', result.resource_id] });
        queryClient.invalidateQueries({ queryKey: ['resource-competencies', 'competency', result.competency_id] });
      }
    },
  });
}
