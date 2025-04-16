import { QueryController, type PaginationParams, type PaginatedResult } from '@/lib/query-controller';
import { TypedSupabaseClient } from '@/utils/supabase-types';
import { Database } from '@/utils/database.types';

type GroupResourceInsert = Database['public']['Tables']['group_resources']['Insert'];
type GroupResourceUpdate = Database['public']['Tables']['group_resources']['Update'];

export interface GroupResource {
  id: number;
  group_id: string;
  resource_id: string;
  created_at: string;
  updated_at: string;
}

export interface GroupResourceWithRelations extends GroupResource {
  groups: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  resources: {
    id: string;
    title: string;
    description: string | null;
    status: string;
  } | null;
}

export class GroupResourcesController extends QueryController<GroupResourceWithRelations, 'group_resources'> {
  constructor(client: TypedSupabaseClient) {
    // Define the select query with the foreign key relationships
    const selectQuery = `
      id,
      group_id,
      resource_id,
      created_at,
      updated_at,
      groups (
        id,
        name,
        description
      ),
      resources (
        id,
        title,
        description,
        status
      )
    `;
    
    super(client, 'group_resources', selectQuery);
  }

  /**
   * Get group resources with pagination, filtering, and sorting
   */
  async getGroupResources(params: PaginationParams): Promise<PaginatedResult<GroupResourceWithRelations>> {
    return this.getPaginatedData(params);
  }

  /**
   * Get a single group resource by ID
   */
  async getGroupResourceById(id: number): Promise<GroupResourceWithRelations | null> {
    const { data, error } = await this.client
      .from('group_resources')
      .select(`
        id,
        group_id,
        resource_id,
        created_at,
        updated_at,
        groups (
          id,
          name,
          description
        ),
        resources (
          id,
          title,
          description,
          status
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data as GroupResourceWithRelations;
  }

  /**
   * Get group resources by group ID
   */
  async getGroupResourcesByGroupId(groupId: string, params: PaginationParams): Promise<PaginatedResult<GroupResourceWithRelations>> {
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
   * Get group resources by resource ID
   */
  async getGroupResourcesByResourceId(resourceId: string, params: PaginationParams): Promise<PaginatedResult<GroupResourceWithRelations>> {
    const resourceFilter = {
      column: 'resource_id',
      operator: 'eq' as const,
      value: resourceId
    };

    const filters = params.filters ? [...params.filters, resourceFilter] : [resourceFilter];

    return this.getPaginatedData({
      ...params,
      filters
    });
  }

  /**
   * Check if a resource is shared with a group
   */
  async isResourceSharedWithGroup(resourceId: string, groupId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('group_resources')
      .select('id')
      .eq('resource_id', resourceId)
      .eq('group_id', groupId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned, resource is not shared with group
        return false;
      }
      throw error;
    }

    return !!data;
  }

  /**
   * Create a new group resource
   */
  async createGroupResource(data: GroupResourceInsert): Promise<GroupResourceWithRelations> {
    const { data: newGroupResource, error } = await this.client
      .from('group_resources')
      .insert(data)
      .select(`
        id,
        group_id,
        resource_id,
        created_at,
        updated_at,
        groups (
          id,
          name,
          description
        ),
        resources (
          id,
          title,
          description,
          status
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return newGroupResource as GroupResourceWithRelations;
  }

  /**
   * Update an existing group resource
   */
  async updateGroupResource(id: number, data: GroupResourceUpdate): Promise<GroupResourceWithRelations> {
    const { data: updatedGroupResource, error } = await this.client
      .from('group_resources')
      .update(data)
      .eq('id', id)
      .select(`
        id,
        group_id,
        resource_id,
        created_at,
        updated_at,
        groups (
          id,
          name,
          description
        ),
        resources (
          id,
          title,
          description,
          status
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return updatedGroupResource as GroupResourceWithRelations;
  }

  /**
   * Delete a group resource
   */
  async deleteGroupResource(id: number): Promise<void> {
    const { error } = await this.client
      .from('group_resources')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  /**
   * Remove a resource from a group
   */
  async removeResourceFromGroup(resourceId: string, groupId: string): Promise<void> {
    const { error } = await this.client
      .from('group_resources')
      .delete()
      .eq('resource_id', resourceId)
      .eq('group_id', groupId);

    if (error) {
      throw error;
    }
  }
}
