import { QueryController, type PaginationParams, type PaginatedResult } from '@/lib/query-controller';
import { TypedSupabaseClient } from '@/utils/supabase-types';
import { Database } from '@/utils/database.types';

export type UserRow = Database['public']['Tables']['users']['Row'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export interface UserWithProfile extends UserRow {
  profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
}

export class UsersController extends QueryController<UserRow, 'users'> {
  constructor(client: TypedSupabaseClient) {
    // Define the select query
    const selectQuery = `
      id,
      username,
      first_name,
      last_name,
      email,
      avatar_url,
      role,
      status,
      created_at,
      updated_at,
      education_level_id
    `;
    
    super(client, 'users', selectQuery);
  }

  /**
   * Get users with pagination, filtering, and sorting
   */
  async getUsers(params: PaginationParams): Promise<PaginatedResult<UserRow>> {
    return this.getPaginatedData(params);
  }

  /**
   * Get a single user by ID
   */
  async getUserById(id: string): Promise<UserRow | null> {
    const { data, error } = await this.client
      .from('users')
      .select(`
        id,
        username,
        first_name,
        last_name,
        email,
        avatar_url,
        role,
        status,
        created_at,
        updated_at,
        education_level_id
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    // Ensure role and status are not null
    if (data) {
      return {
        ...data,
        role: data.role || 'STUDENT',
        status: data.status || 'ACTIVE'
      } as UserRow;
    }

    return null;
  }

  /**
   * Get users by role with pagination, filtering, and sorting
   */
  async getUsersByRole(role: string, params: PaginationParams): Promise<PaginatedResult<UserRow>> {
    // Create a copy of the params to avoid modifying the original
    const paramsWithRoleFilter = { ...params };
    
    // Add the role filter
    if (!paramsWithRoleFilter.filters) {
      paramsWithRoleFilter.filters = [];
    }
    
    paramsWithRoleFilter.filters.push({
      column: 'role',
      operator: 'eq',
      value: role
    });
    
    return this.getPaginatedData(paramsWithRoleFilter);
  }

  /**
   * Get users by group ID with pagination, filtering, and sorting
   */
  async getUsersByGroupId(groupId: string, params: PaginationParams): Promise<PaginatedResult<UserRow>> {
    // Get the page number from cursor or default to 1
    const page = params.cursor ? parseInt(params.cursor) : 1;
    
    const { data, error, count } = await this.client
      .from('group_members')
      .select('user_id', { count: 'exact' })
      .eq('group_id', groupId)
      .range(
        (page - 1) * params.pageSize,
        page * params.pageSize - 1
      );

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return {
        data: [],
        nextCursor: null,
        prevCursor: null,
        count: 0
      };
    }

    // Extract user IDs
    const userIds = data.map(item => item.user_id);

    // Fetch the actual user data
    const { data: users, error: usersError } = await this.client
      .from('users')
      .select(`
        id,
        username,
        first_name,
        last_name,
        email,
        avatar_url,
        role,
        status,
        created_at,
        updated_at,
        education_level_id
      `)
      .in('id', userIds);

    if (usersError) {
      throw usersError;
    }

    // Calculate next and previous cursors
    const totalPages = Math.ceil((count || 0) / params.pageSize);
    const nextCursor = page < totalPages ? (page + 1).toString() : null;
    const prevCursor = page > 1 ? (page - 1).toString() : null;

    return {
      data: users || [],
      nextCursor,
      prevCursor,
      count
    };
  }

  /**
   * Get users that are members of groups owned by a specific user
   */
  async getUsersByGroupOwnerId(userId: string, params: PaginationParams): Promise<PaginatedResult<UserRow>> {
    // Get the page number from cursor or default to 1
    const page = params.cursor ? parseInt(params.cursor) : 1;
    
    // First, get all groups owned by the user
    const { data: ownedGroups, error: groupsError } = await this.client
      .from('groups')
      .select('id')
      .eq('created_by', userId);
    
    if (groupsError) {
      throw groupsError;
    }
    
    if (!ownedGroups || ownedGroups.length === 0) {
      return {
        data: [],
        nextCursor: null,
        prevCursor: null,
        count: 0
      };
    }
    
    // Extract group IDs
    const groupIds = ownedGroups.map(group => group.id);
    
    // Get all user IDs from group_members for these groups
    const { data: groupMembers, error: membersError, count } = await this.client
      .from('group_members')
      .select('user_id', { count: 'exact' })
      .in('group_id', groupIds)
      .range(
        (page - 1) * params.pageSize,
        page * params.pageSize - 1
      );
    
    if (membersError) {
      throw membersError;
    }
    
    if (!groupMembers || groupMembers.length === 0) {
      return {
        data: [],
        nextCursor: null,
        prevCursor: null,
        count: 0
      };
    }
    
    // Extract unique user IDs
    const userIds = [...new Set(groupMembers.map(member => member.user_id))];
    
    // Fetch the actual user data
    const { data: users, error: usersError } = await this.client
      .from('users')
      .select(`
        id,
        username,
        first_name,
        last_name,
        email,
        avatar_url,
        role,
        status,
        created_at,
        updated_at,
        education_level_id
      `)
      .in('id', userIds);
    
    if (usersError) {
      throw usersError;
    }
    
    // Calculate next and previous cursors
    const totalPages = Math.ceil((count || 0) / params.pageSize);
    const nextCursor = page < totalPages ? (page + 1).toString() : null;
    const prevCursor = page > 1 ? (page - 1).toString() : null;
    
    return {
      data: users || [],
      nextCursor,
      prevCursor,
      count
    };
  }

  /**
   * Update a user's profile
   */
  async updateUserProfile(id: string, data: UserUpdate): Promise<UserRow | null> {
    const { data: updatedUser, error } = await this.client
      .from('users')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return updatedUser;
  }
}
