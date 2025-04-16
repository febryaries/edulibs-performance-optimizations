import { QueryController, type PaginationParams, type PaginatedResult } from '@/lib/query-controller';
import { TypedSupabaseClient } from '@/utils/supabase-types';
import { Database } from '@/utils/database.types';

type GroupRow = Database['public']['Tables']['groups']['Row'];
type GroupInsert = Database['public']['Tables']['groups']['Insert'];
type GroupUpdate = Database['public']['Tables']['groups']['Update'];

export interface GroupWithCreator extends GroupRow {
  users: {
    id: string;
    username: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
}

export class GroupsController extends QueryController<GroupWithCreator, 'groups'> {
  constructor(client: TypedSupabaseClient) {
    // Define the select query with the foreign key relationship
    const selectQuery = `
      id,
      name,
      description,
      created_by,
      created_at,
      updated_at,
      users (
        id,
        username,
        first_name,
        last_name,
        email
      )
    `;
    
    super(client, 'groups', selectQuery);
  }

  /**
   * Get groups with pagination, filtering, and sorting
   */
  async getGroups(params: PaginationParams): Promise<PaginatedResult<GroupWithCreator>> {
    return this.getPaginatedData(params);
  }

  /**
   * Get a single group by ID
   */
  async getGroupById(id: string): Promise<GroupWithCreator | null> {
    const { data, error } = await this.client
      .from('groups')
      .select(`
        id,
        name,
        description,
        created_by,
        created_at,
        updated_at,
        users (
          id,
          username,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Get all groups for a specific user
   */
  async getGroupsByUserId(userId: string, params: PaginationParams): Promise<PaginatedResult<GroupWithCreator>> {
    // Add a filter for the user's groups through group_members
    const userFilter = {
      column: 'id',
      operator: 'in' as const,
      value: this.client
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId)
    };

    // Add this filter to any existing filters
    const filters = params.filters ? [...params.filters, userFilter] : [userFilter];

    return this.getPaginatedData({
      ...params,
      filters
    });
  }

  /**
   * Create a new group
   */
  async createGroup(data: GroupInsert): Promise<GroupWithCreator> {
    const { data: newGroup, error } = await this.client
      .from('groups')
      .insert(data)
      .select(`
        id,
        name,
        description,
        created_by,
        created_at,
        updated_at,
        users (
          id,
          username,
          first_name,
          last_name,
          email
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return newGroup as GroupWithCreator;
  }

  /**
   * Update an existing group
   */
  async updateGroup(id: string, data: GroupUpdate): Promise<GroupWithCreator> {
    const { data: updatedGroup, error } = await this.client
      .from('groups')
      .update(data)
      .eq('id', id)
      .select(`
        id,
        name,
        description,
        created_by,
        created_at,
        updated_at,
        users (
          id,
          username,
          first_name,
          last_name,
          email
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return updatedGroup as GroupWithCreator;
  }

  /**
   * Delete a group
   */
  async deleteGroup(id: string): Promise<void> {
    const { error } = await this.client
      .from('groups')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
}
