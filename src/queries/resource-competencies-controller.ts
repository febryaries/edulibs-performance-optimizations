import { QueryController, type PaginationParams, type PaginatedResult } from '@/lib/query-controller';
import { TypedSupabaseClient } from '@/utils/supabase-types';
import { Database } from '@/utils/database.types';

type ResourceCompetencyRow = Database['public']['Tables']['resource_competencies']['Row'];
type ResourceCompetencyInsert = Database['public']['Tables']['resource_competencies']['Insert'];
type ResourceCompetencyUpdate = Database['public']['Tables']['resource_competencies']['Update'];

export interface ResourceCompetencyWithRelations extends ResourceCompetencyRow {
  resources: {
    id: string;
    title: string;
  } | null;
  specific_competencies: {
    id: number;
    name: string;
  } | null;
}

export class ResourceCompetenciesController extends QueryController<ResourceCompetencyWithRelations, 'resource_competencies'> {
  constructor(client: TypedSupabaseClient) {
    // Define the select query with the foreign key relationships
    const selectQuery = `
      id,
      resource_id,
      specific_competency_id,
      created_at,
      updated_at,
      resources (
        id,
        title
      ),
      specific_competencies (
        id,
        name
      )
    `;
    
    super(client, 'resource_competencies', selectQuery);
  }

  /**
   * Get resource competencies with pagination, filtering, and sorting
   */
  async getResourceCompetencies(params: PaginationParams): Promise<PaginatedResult<ResourceCompetencyWithRelations>> {
    return this.getPaginatedData(params);
  }

  /**
   * Get a single resource competency by ID
   */
  async getResourceCompetencyById(id: number): Promise<ResourceCompetencyWithRelations | null> {
    const { data, error } = await this.client
      .from('resource_competencies')
      .select(`
        id,
        resource_id,
        specific_competency_id,
        created_at,
        updated_at,
        resources (
          id,
          title
        ),
        specific_competencies (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data as ResourceCompetencyWithRelations;
  }

  /**
   * Get resource competencies by resource ID
   */
  async getResourceCompetenciesByResourceId(resourceId: string, params: PaginationParams): Promise<PaginatedResult<ResourceCompetencyWithRelations>> {
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
   * Get resource competencies by competency ID
   */
  async getResourceCompetenciesByCompetencyId(competencyId: number, params: PaginationParams): Promise<PaginatedResult<ResourceCompetencyWithRelations>> {
    const competencyFilter = {
      column: 'specific_competency_id',
      operator: 'eq' as const,
      value: competencyId
    };

    const filters = params.filters ? [...params.filters, competencyFilter] : [competencyFilter];

    return this.getPaginatedData({
      ...params,
      filters
    });
  }

  /**
   * Create a new resource competency
   */
  async createResourceCompetency(data: ResourceCompetencyInsert): Promise<ResourceCompetencyWithRelations> {
    const { data: newCompetency, error } = await this.client
      .from('resource_competencies')
      .insert(data)
      .select(`
        id,
        resource_id,
        specific_competency_id,
        created_at,
        updated_at,
        resources (
          id,
          title
        ),
        specific_competencies (
          id,
          name
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return newCompetency as ResourceCompetencyWithRelations;
  }

  /**
   * Update an existing resource competency
   */
  async updateResourceCompetency(id: number, data: ResourceCompetencyUpdate): Promise<ResourceCompetencyWithRelations> {
    const { data: updatedCompetency, error } = await this.client
      .from('resource_competencies')
      .update(data)
      .eq('id', id)
      .select(`
        id,
        resource_id,
        specific_competency_id,
        created_at,
        updated_at,
        resources (
          id,
          title
        ),
        specific_competencies (
          id,
          name
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return updatedCompetency as ResourceCompetencyWithRelations;
  }

  /**
   * Delete a resource competency
   */
  async deleteResourceCompetency(id: number): Promise<void> {
    const { error } = await this.client
      .from('resource_competencies')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  /**
   * Delete all competencies for a resource
   */
  async deleteResourceCompetenciesByResourceId(resourceId: string): Promise<void> {
    const { error } = await this.client
      .from('resource_competencies')
      .delete()
      .eq('resource_id', resourceId);

    if (error) {
      throw error;
    }
  }
}
