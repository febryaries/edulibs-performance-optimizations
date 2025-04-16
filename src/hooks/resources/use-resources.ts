"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useResourcesController } from './use-resources-controller';
import { PaginationParams, UsePaginatedHook } from '@/lib/query-controller';
import { type ResourceInsert, ResourceRow } from '@/queries/resources-controller';

/**
 * Hook to fetch resources with pagination, filtering, and sorting
 */
export const useResources: UsePaginatedHook<any> = (params?: PaginationParams) => {
  const resourcesController = useResourcesController();
  
  return useQuery({
    queryKey: ['resources', params],
    queryFn: () => resourcesController.getResources(params || { pageSize: 10 }),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch a single resource by ID
 */
export function useResourceById(id: string) {
  const resourcesController = useResourcesController();
  
  return useQuery({
    queryKey: ['resource', id],
    queryFn: () => resourcesController.getResourceById(id),
    enabled: !!id, // Only run the query if id is provided
  });
}

/**
 * Hook to create a new resource
 */
export function useCreateResource() {
  const resourcesController = useResourcesController();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (resource: Omit<ResourceInsert, 'id'>) => resourcesController.createResource(resource),
    onSuccess: () => {
      // Invalidate resources queries to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

/**
 * Hook to update an existing resource
 */
export function useUpdateResource() {
  const resourcesController = useResourcesController();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, resource }: { id: string; resource: Partial<Omit<ResourceRow, 'id' | 'created_at' | 'updated_at'>> }) => 
      resourcesController.updateResource(id, resource),
    onSuccess: (_, variables) => {
      // Invalidate specific resource query
      queryClient.invalidateQueries({ queryKey: ['resource', variables.id] });
      // Invalidate resources list
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

/**
 * Hook to delete a resource
 */
export function useDeleteResource() {
  const resourcesController = useResourcesController();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => resourcesController.deleteResource(id),
    onSuccess: () => {
      // Invalidate resources queries to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

/**
 * Hook to refetch resources data
 */
export function useRefetchResources() {
  const resourcesController = useResourcesController();
  const queryClient = useQueryClient();
  
  return () => {
    resourcesController.refetchData();
    queryClient.invalidateQueries({ queryKey: ['resources'] });
  };
}
