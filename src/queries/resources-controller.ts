import { QueryController, type PaginationParams, type PaginatedResult } from '@/lib/query-controller';
import { TypedSupabaseClient } from '@/utils/supabase-types';
import { Database } from '@/utils/database.types';

export type ResourceRow = Database['public']['Tables']['resources']['Row'];
export type ResourceInsert = Database['public']['Tables']['resources']['Insert'];

// Define the interface for resources with joined relations
export interface ResourceWithUser extends Omit<ResourceRow, 'type' | 'url'> {
  users: {
    id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
  author: {
    id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
  mentor: {
    id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
  discipline: {
    id: number;
    name: string;
  } | null;
  specific_competency: {
    id: number;
    name: string;
    class_id: number;
    competency_id: number;
  } | null;
  resource_competencies: {
    id: number;
    resource_id: string;
    specific_competency_id: number;
    created_at: string;
    updated_at: string;
    specific_competencies?: {
      id: number;
      name: string;
      class_id: number;
      competency_id: number;
    } | null;
  }[] | null;
  // These properties are explicitly defined to match ResourceRow
  type: string | null;
  url: string | null;
}

export class ResourcesController extends QueryController<ResourceWithUser, 'resources'> {
  // Track the last fetch parameters
  private lastFetchParams: PaginationParams | null = null;

  constructor(client: TypedSupabaseClient) {
    // Define the select query with the foreign key relationships and aliases
    const selectQuery = `
      id,
      title,
      description,
      user_id,
      author_id,
      mentor_id,
      discipline_id,
      class_id,
      specific_competency_id,
      link,
      status,
      is_public,
      created_at,
      updated_at,
      type,
      url,
      durata,
      comentarii,
      users:users!resources_user_id_fkey (id, email, first_name, last_name),
      author:users!resources_author_id_fkey (id, email, first_name, last_name),
      mentor:users!resources_mentor_id_fkey (id, email, first_name, last_name),
      discipline:disciplines!resources_discipline_id_fkey (id, name),
      specific_competency:specific_competencies!resources_specific_competency_id_fkey (id, name, class_id, competency_id),
      class:classes!resources_class_id_fkey (id, name, number)
    `;
    
    super(client, 'resources', selectQuery);
  }

  /**
   * Get resources with pagination, filtering, and sorting
   */
  async getResources(params: PaginationParams): Promise<PaginatedResult<ResourceWithUser>> {
    return this.getPaginatedData(params);
  }

  /**
   * Override getPaginatedData to track the last parameters used
   */
  async getPaginatedData(params: PaginationParams): Promise<PaginatedResult<ResourceWithUser>> {
    // Store the parameters for potential refetching
    this.lastFetchParams = { ...params };
    return super.getPaginatedData(params);
  }

  /**
   * Get a single resource by ID
   */
  async getResourceById(id: string): Promise<ResourceWithUser | null> {
    try {
      // Define the query with proper aliases
      const resourceQuery = this.client
        .from('resources')
        .select(`
          *,
          users:users!resources_user_id_fkey (id, email, first_name, last_name),
          author:users!resources_author_id_fkey (id, email, first_name, last_name),
          mentor:users!resources_mentor_id_fkey (id, email, first_name, last_name),
          discipline:disciplines!resources_discipline_id_fkey (id, name),
          specific_competency:specific_competencies!resources_specific_competency_id_fkey (id, name, class_id, competency_id),
          resource_competencies:resource_competencies!resource_competencies_resource_id_fkey (
            id,
            resource_id,
            specific_competency_id,
            created_at,
            updated_at,
            specific_competencies:specific_competencies!resource_competencies_specific_competency_id_fkey (
              id,
              name,
              class_id,
              competency_id
            )
          )
        `)
        .eq('id', id)
        .single();

      // Get the data
      const { data, error } = await resourceQuery;

      if (error) {
        throw error;
      }

      return data as ResourceWithUser;
    } catch (error) {
      console.error('Error fetching resource:', error);
      throw error;
    }
  }

  /**
   * Create a new resource
   */
  async createResource(resource: Omit<ResourceInsert, 'id'>): Promise<ResourceRow> {
    try {
      const { data, error } = await this.client
        .from('resources')
        .insert(resource)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as ResourceRow;
    } catch (error) {
      console.error('Error creating resource:', error);
      throw error;
    }
  }

  /**
   * Update an existing resource
   */
  async updateResource(id: string, updates: Partial<Omit<ResourceRow, 'id' | 'created_at' | 'updated_at'>>): Promise<ResourceRow> {
    try {
      const { data, error } = await this.client
        .from('resources')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as ResourceRow;
    } catch (error) {
      console.error('Error updating resource:', error);
      throw error;
    }
  }

  /**
   * Delete a resource by ID
   */
  async deleteResource(id: string): Promise<void> {
    try {
      const { error } = await this.client
        .from('resources')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      throw error;
    }
  }

  /**
   * Refetch data to update the UI
   */
  async refetchData(): Promise<void> {
    try {
      // If we have last fetch params, use them, otherwise use default
      const params = this.lastFetchParams || {
        pageSize: 10
      };
      
      // Clear the cache for this controller to force a fresh fetch
      QueryController.clearCache();
      
      // Fetch with the last known parameters
      await this.getPaginatedData(params);
    } catch (error) {
      console.error('Error refetching resources:', error);
      throw error;
    }
  }
}
