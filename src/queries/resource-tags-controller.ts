import { QueryController, type PaginationParams, type PaginatedResult } from '@/lib/query-controller';
import { TypedSupabaseClient } from '@/utils/supabase-types';
import { Database } from '@/utils/database.types';

type ResourceTagInsert = Database['public']['Tables']['resource_tags']['Insert'];
type ResourceTagUpdate = Database['public']['Tables']['resource_tags']['Update'];

export interface ResourceTag {
  id: number;
  resource_id: string;
  tag: string;
  created_at: string;
  updated_at: string;
}

export interface ResourceTagWithResource extends ResourceTag {
  resources: {
    id: string;
    title: string;
  } | null;
}

export class ResourceTagsController extends QueryController<ResourceTagWithResource, 'resource_tags'> {
  constructor(client: TypedSupabaseClient) {
    // Define the select query with the foreign key relationship
    const selectQuery = `
      id,
      resource_id,
      tag,
      created_at,
      updated_at,
      resources (
        id,
        title
      )
    `;
    
    super(client, 'resource_tags', selectQuery);
  }

  /**
   * Get resource tags with pagination, filtering, and sorting
   */
  async getResourceTags(params: PaginationParams): Promise<PaginatedResult<ResourceTagWithResource>> {
    return this.getPaginatedData(params);
  }

  /**
   * Get a single resource tag by ID
   */
  async getResourceTagById(id: number): Promise<ResourceTagWithResource | null> {
    const { data, error } = await this.client
      .from('resource_tags')
      .select(`
        id,
        resource_id,
        tag,
        created_at,
        updated_at,
        resources (
          id,
          title
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data as ResourceTagWithResource;
  }

  /**
   * Get resource tags by resource ID
   */
  async getResourceTagsByResourceId(resourceId: string, params: PaginationParams): Promise<PaginatedResult<ResourceTagWithResource>> {
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
   * Get resource tags by tag
   */
  async getResourceTagsByTag(tag: string, params: PaginationParams): Promise<PaginatedResult<ResourceTagWithResource>> {
    const tagFilter = {
      column: 'tag',
      operator: 'eq' as const,
      value: tag
    };

    const filters = params.filters ? [...params.filters, tagFilter] : [tagFilter];

    return this.getPaginatedData({
      ...params,
      filters
    });
  }

  /**
   * Create a new resource tag
   */
  async createResourceTag(data: ResourceTagInsert): Promise<ResourceTagWithResource> {
    const { data: newTag, error } = await this.client
      .from('resource_tags')
      .insert(data)
      .select(`
        id,
        resource_id,
        tag,
        created_at,
        updated_at,
        resources (
          id,
          title
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return newTag as ResourceTagWithResource;
  }

  /**
   * Update an existing resource tag
   */
  async updateResourceTag(id: number, data: ResourceTagUpdate): Promise<ResourceTagWithResource> {
    const { data: updatedTag, error } = await this.client
      .from('resource_tags')
      .update(data)
      .eq('id', id)
      .select(`
        id,
        resource_id,
        tag,
        created_at,
        updated_at,
        resources (
          id,
          title
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return updatedTag as ResourceTagWithResource;
  }

  /**
   * Delete a resource tag
   */
  async deleteResourceTag(id: number): Promise<void> {
    const { error } = await this.client
      .from('resource_tags')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  /**
   * Delete all tags for a resource
   */
  async deleteResourceTagsByResourceId(resourceId: string): Promise<void> {
    const { error } = await this.client
      .from('resource_tags')
      .delete()
      .eq('resource_id', resourceId);

    if (error) {
      throw error;
    }
  }
}
