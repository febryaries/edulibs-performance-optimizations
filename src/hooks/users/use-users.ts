"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUsersController } from './use-users-controller';
import { PaginationParams, UsePaginatedHook } from '@/lib/query-controller';
import { UserRow, UserUpdate } from '@/queries/users-controller';

/**
 * Hook to fetch users with pagination, filtering, and sorting
 */
export const useUsers: UsePaginatedHook<UserRow> = (params?: PaginationParams) => {
  const usersController = useUsersController();
  
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => usersController.getUsers(params || { pageSize: 10 }),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch a single user by ID
 */
export function useUserById(id: string) {
  const usersController = useUsersController();
  
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => usersController.getUserById(id),
    enabled: !!id, // Only run the query if id is provided
  });
}

/**
 * Hook to fetch users by role
 */
export function useUsersByRole(role: string, params?: PaginationParams) {
  const usersController = useUsersController();
  
  return useQuery({
    queryKey: ['users', 'role', role, params],
    queryFn: () => usersController.getUsersByRole(role, params || { pageSize: 10 }),
    enabled: !!role, // Only run the query if role is provided
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch users by group ID
 */
export function useUsersByGroupId(groupId: string, params?: PaginationParams) {
  const usersController = useUsersController();
  
  return useQuery({
    queryKey: ['users', 'group', groupId, params],
    queryFn: () => usersController.getUsersByGroupId(groupId, params || { pageSize: 10 }),
    enabled: !!groupId, // Only run the query if groupId is provided
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch users that are members of groups owned by a specific user
 */
export function useUsersByGroupOwnerId(userId: string, params?: PaginationParams) {
  const usersController = useUsersController();
  
  return useQuery({
    queryKey: ['users', 'groups-owned', userId, params],
    queryFn: () => usersController.getUsersByGroupOwnerId(userId, params || { pageSize: 10 }),
    enabled: !!userId, // Only run the query if userId is provided
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to update a user's profile
 */
export function useUpdateUserProfile() {
  const usersController = useUsersController();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserUpdate }) => 
      usersController.updateUserProfile(id, data),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] });
      if (variables.data.role) {
        queryClient.invalidateQueries({ queryKey: ['users', 'role', variables.data.role] });
      }
    },
  });
}
