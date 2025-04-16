"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useResourceTagsController } from './use-resource-tags-controller';
import { PaginationParams, UsePaginatedHook } from '@/lib/query-controller';
import { ResourceTagWithResource } from '@/queries/resource-tags-controller';

/**
 * Hook to fetch resource tags with pagination, filtering, and sorting
 */
export const useResourceTags: UsePaginatedHook<ResourceTagWithResource> = (params?: PaginationParams) => {
  const resourceTagsController = useResourceTagsController();
  
  return useQuery({
    queryKey: ['resource-tags', params],
    queryFn: () => resourceTagsController.getResourceTags(params || { pageSize: 10 }),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch a single resource tag by ID
 */
export function useResourceTagById(id: string) {
  const resourceTagsController = useResourceTagsController();
  
  return useQuery({
    queryKey: ['resource-tag', id],
    queryFn: () => resourceTagsController.getResourceTagById(id),
    enabled: !!id, // Only run the query if id is provided
  });
}

/**
 * Hook to fetch resource tags for a specific resource
 */
export function useResourceTagsByResourceId(resourceId: string, params?: PaginationParams) {
  const resourceTagsController = useResourceTagsController();
  
  return useQuery({
    queryKey: ['resource-tags', 'resource', resourceId, params],
    queryFn: () => resourceTagsController.getResourceTagsByResourceId(resourceId, params || { pageSize: 10 }),
    enabled: !!resourceId, // Only run the query if resourceId is provided
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch resources by a specific tag
 */
export function useResourcesByTag(tag: string, params?: PaginationParams) {
  const resourceTagsController = useResourceTagsController();
  
  return useQuery({
    queryKey: ['resource-tags', 'tag', tag, params],
    queryFn: () => resourceTagsController.getResourceTagsByTag(tag, params || { pageSize: 10 }),
    enabled: !!tag, // Only run the query if tag is provided
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to create a new resource tag
 */
export function useCreateResourceTag() {
  const resourceTagsController = useResourceTagsController();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { resource_id: string; tag: string }) => 
      resourceTagsController.createResourceTag(data),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['resource-tags'] });
      queryClient.invalidateQueries({ queryKey: ['resource-tags', 'resource', variables.resource_id] });
      queryClient.invalidateQueries({ queryKey: ['resource-tags', 'tag', variables.tag] });
    },
  });
}

/**
 * Hook to delete a resource tag
 */
export function useDeleteResourceTag() {
  const resourceTagsController = useResourceTagsController();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => resourceTagsController.deleteResourceTag(id),
    onSuccess: (result) => {
      if (result) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['resource-tags'] });
        queryClient.removeQueries({ queryKey: ['resource-tag', result.id] });
        queryClient.invalidateQueries({ queryKey: ['resource-tags', 'resource', result.resource_id] });
        queryClient.invalidateQueries({ queryKey: ['resource-tags', 'tag', result.tag] });
      }
    },
  });
}
