"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGroupMembersController } from './use-group-members-controller';
import { PaginationParams, UsePaginatedHook } from '@/lib/query-controller';
import { GroupMemberWithRelations, GroupMemberInsert, GroupMemberUpdate } from '@/queries/group-members-controller';

/**
 * Hook to fetch group members with pagination, filtering, and sorting
 */
export const useGroupMembers: UsePaginatedHook<GroupMemberWithRelations> = (params?: PaginationParams) => {
  const groupMembersController = useGroupMembersController();
  
  return useQuery({
    queryKey: ['group-members', params],
    queryFn: () => groupMembersController.getGroupMembers(params || { pageSize: 10 }),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch a single group member by ID
 */
export function useGroupMemberById(id: string) {
  const groupMembersController = useGroupMembersController();
  
  return useQuery({
    queryKey: ['group-member', id],
    queryFn: () => groupMembersController.getGroupMemberById(id),
    enabled: !!id, // Only run the query if id is provided
  });
}

/**
 * Hook to fetch group members for a specific group
 */
export function useGroupMembersByGroupId(groupId: string, params?: PaginationParams) {
  const groupMembersController = useGroupMembersController();
  
  return useQuery({
    queryKey: ['group-members', 'group', groupId, params],
    queryFn: () => groupMembersController.getGroupMembersByGroupId(groupId, params || { pageSize: 10 }),
    enabled: !!groupId, // Only run the query if groupId is provided
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch group memberships for a specific user
 */
export function useGroupMembersByUserId(userId: string, params?: PaginationParams) {
  const groupMembersController = useGroupMembersController();
  
  return useQuery({
    queryKey: ['group-members', 'user', userId, params],
    queryFn: () => groupMembersController.getGroupMembersByUserId(userId, params || { pageSize: 10 }),
    enabled: !!userId, // Only run the query if userId is provided
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to create a new group member
 */
export function useCreateGroupMember() {
  const groupMembersController = useGroupMembersController();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: GroupMemberInsert) => 
      groupMembersController.createGroupMember(data),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['group-members'] });
      queryClient.invalidateQueries({ queryKey: ['group-members', 'group', variables.group_id] });
      queryClient.invalidateQueries({ queryKey: ['group-members', 'user', variables.user_id] });
    },
  });
}

/**
 * Hook to update an existing group member
 */
export function useUpdateGroupMember() {
  const groupMembersController = useGroupMembersController();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: GroupMemberUpdate }) => 
      groupMembersController.updateGroupMember(id, data),
    onSuccess: (result) => {
      if (result) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['group-members'] });
        queryClient.invalidateQueries({ queryKey: ['group-member', result.id] });
        queryClient.invalidateQueries({ queryKey: ['group-members', 'group', result.group_id] });
        queryClient.invalidateQueries({ queryKey: ['group-members', 'user', result.user_id] });
      }
    },
  });
}

/**
 * Hook to delete a group member
 */
export function useDeleteGroupMember() {
  const groupMembersController = useGroupMembersController();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => groupMembersController.deleteGroupMember(id),
    onSuccess: (_, id) => {
      // Since we don't have the group_id and user_id after deletion,
      // we'll just invalidate all group members queries
      queryClient.invalidateQueries({ queryKey: ['group-members'] });
    },
  });
}

/**
 * Hook to delete all members from a group
 */
export function useDeleteGroupMembersByGroupId() {
  const groupMembersController = useGroupMembersController();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (groupId: string) => groupMembersController.deleteGroupMembersByGroupId(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-members'] });
    },
  });
}
