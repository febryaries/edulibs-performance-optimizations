import { QueryController, type PaginationParams, type PaginatedResult } from '@/lib/query-controller';
import { TypedSupabaseClient } from '@/utils/supabase-types';
import { Database } from '@/utils/database.types';

export type GroupMemberInsert = Database['public']['Tables']['group_members']['Insert'];
export type GroupMemberUpdate = Database['public']['Tables']['group_members']['Update'];

export interface GroupMember {
  id: number;
  group_id: string;
  user_id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  created_at: string;
  updated_at: string;
}

export interface GroupMemberWithRelations extends GroupMember {
  groups: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  users: {
    id: string;
    username: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

export class GroupMembersController extends QueryController<GroupMemberWithRelations, 'group_members'> {
  constructor(client: TypedSupabaseClient) {
    // Define the select query with the foreign key relationships
    const selectQuery = `
      id,
      group_id,
      user_id,
      role,
      created_at,
      updated_at,
      groups (
        id,
        name,
        description
      ),
      users (
        id,
        username,
        first_name,
        last_name,
        email,
        avatar_url
      )
    `;
    
    super(client, 'group_members', selectQuery);
  }

  /**
   * Get group members with pagination, filtering, and sorting
   */
  async getGroupMembers(params: PaginationParams): Promise<PaginatedResult<GroupMemberWithRelations>> {
    return this.getPaginatedData(params);
  }

  /**
   * Get a single group member by ID
   */
  async getGroupMemberById(id: number): Promise<GroupMemberWithRelations | null> {
    const { data, error } = await this.client
      .from('group_members')
      .select(`
        id,
        group_id,
        user_id,
        role,
        created_at,
        updated_at,
        groups (
          id,
          name,
          description
        ),
        users (
          id,
          username,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data as GroupMemberWithRelations;
  }

  /**
   * Get group members by group ID
   */
  async getGroupMembersByGroupId(groupId: string, params: PaginationParams): Promise<PaginatedResult<GroupMemberWithRelations>> {
    const groupFilter = {
      column: 'group_id',
      operator: 'eq' as const,
      value: groupId
    };

    const filters = params.filters ? [...params.filters, groupFilter] : [groupFilter];

    return this.getPaginatedData({
      ...params,
      filters
    });
  }

  /**
   * Get group members by user ID
   */
  async getGroupMembersByUserId(userId: string, params: PaginationParams): Promise<PaginatedResult<GroupMemberWithRelations>> {
    const userFilter = {
      column: 'user_id',
      operator: 'eq' as const,
      value: userId
    };

    const filters = params.filters ? [...params.filters, userFilter] : [userFilter];

    return this.getPaginatedData({
      ...params,
      filters
    });
  }

  /**
   * Check if a user is a member of a group
   */
  async isUserMemberOfGroup(userId: string, groupId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('group_members')
      .select('id')
      .eq('user_id', userId)
      .eq('group_id', groupId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned, user is not a member
        return false;
      }
      throw error;
    }

    return !!data;
  }

  /**
   * Create a new group member
   */
  async createGroupMember(data: GroupMemberInsert): Promise<GroupMemberWithRelations> {
    const { data: newMember, error } = await this.client
      .from('group_members')
      .insert(data)
      .select(`
        id,
        group_id,
        user_id,
        role,
        created_at,
        updated_at,
        groups (
          id,
          name,
          description
        ),
        users (
          id,
          username,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return newMember as GroupMemberWithRelations;
  }

  /**
   * Update an existing group member
   */
  async updateGroupMember(id: number, data: GroupMemberUpdate): Promise<GroupMemberWithRelations> {
    const { data: updatedMember, error } = await this.client
      .from('group_members')
      .update(data)
      .eq('id', id)
      .select(`
        id,
        group_id,
        user_id,
        role,
        created_at,
        updated_at,
        groups (
          id,
          name,
          description
        ),
        users (
          id,
          username,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return updatedMember as GroupMemberWithRelations;
  }

  /**
   * Delete a group member
   */
  async deleteGroupMember(id: number): Promise<void> {
    const { error } = await this.client
      .from('group_members')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  /**
   * Remove a user from a group
   */
  async removeUserFromGroup(userId: string, groupId: string): Promise<void> {
    const { error } = await this.client
      .from('group_members')
      .delete()
      .eq('user_id', userId)
      .eq('group_id', groupId);

    if (error) {
      throw error;
    }
  }

  /**
   * Delete all members from a group
   */
  async deleteGroupMembersByGroupId(groupId: string): Promise<void> {
    const { error } = await this.client
      .from('group_members')
      .delete()
      .eq('group_id', groupId);

    if (error) {
      throw error;
    }
  }
}
