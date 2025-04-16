"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGroupsController } from './use-groups-controller';
import { PaginationParams, UsePaginatedHook } from '@/lib/query-controller';
import { GroupWithCreator, GroupInsert, GroupUpdate } from '@/queries/groups-controller';

/**
 * Hook to fetch groups with pagination, filtering, and sorting
 */
export const useGroups: UsePaginatedHook<GroupWithCreator> = (params?: PaginationParams) => {
  const groupsController = useGroupsController();
  
  return useQuery({
    queryKey: ['groups', params],
    queryFn: () => groupsController.getGroups(params || { pageSize: 10 }),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch a single group by ID
 */
export function useGroupById(id: string) {
  const groupsController = useGroupsController();
  
  return useQuery({
    queryKey: ['group', id],
    queryFn: () => groupsController.getGroupById(id),
    enabled: !!id, // Only run the query if id is provided
  });
}

/**
 * Hook to fetch groups for a specific user
 */
export function useGroupsByUserId(userId: string, params?: PaginationParams) {
  const groupsController = useGroupsController();
  
  return useQuery({
    queryKey: ['groups', 'user', userId, params],
    queryFn: () => groupsController.getGroupsByUserId(userId, params || { pageSize: 10 }),
    enabled: !!userId, // Only run the query if userId is provided
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to create a new group
 */
export function useCreateGroup() {
  const groupsController = useGroupsController();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: GroupInsert) => groupsController.createGroup(data),
    onSuccess: () => {
      // Invalidate the groups query to refetch the data
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

/**
 * Hook to update an existing group
 */
export function useUpdateGroup() {
  const groupsController = useGroupsController();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: GroupUpdate }) => 
      groupsController.updateGroup(id, data),
    onSuccess: (_, variables) => {
      // Invalidate the specific group query and the groups list
      queryClient.invalidateQueries({ queryKey: ['group', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

/**
 * Hook to delete a group
 */
export function useDeleteGroup() {
  const groupsController = useGroupsController();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => groupsController.deleteGroup(id),
    onSuccess: (_, id) => {
      // Invalidate the groups query to refetch the data
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      // Remove the deleted group from the cache
      queryClient.removeQueries({ queryKey: ['group', id] });
    },
  });
}
