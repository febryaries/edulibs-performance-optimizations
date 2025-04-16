import { QueryController, type PaginationParams, type PaginatedResult } from '@/lib/query-controller';
import { TypedSupabaseClient } from '@/utils/supabase-types';
import { Database } from '@/utils/database.types';

type ResourceEvaluationInsert = Database['public']['Tables']['resource_evaluations']['Insert'];
type ResourceEvaluationUpdate = Database['public']['Tables']['resource_evaluations']['Update'];

export interface ResourceEvaluation {
  id: string;
  resource_id: string;
  evaluator_id: string | null;
  user_id: string;
  status: 'CONFORMABLE' | 'UNCONFORMABLE' | 'IN_PROGRESS';
  feedback: string | null;
  concordance_comment: string | null;
  relevance_comment: string | null;
  accessibility_comment: string | null;
  correctness_comment: string | null;
  value_comment: string | null;
  quality_comment: string | null;
  specific_competence_comment: string | null;
  description_comment: string | null;
  duration_comment: string | null;
  link_comment: string | null;
  comment_comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResourceEvaluationWithRelations extends ResourceEvaluation {
  resources: {
    id: string;
    title: string;
  } | null;
  users: {
    id: string;
    username: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export class ResourceEvaluationsController extends QueryController<ResourceEvaluationWithRelations, 'resource_evaluations'> {
  constructor(client: TypedSupabaseClient) {
    // Define the select query with the foreign key relationships
    const selectQuery = `
      id,
      resource_id,
      evaluator_id,
      user_id,
      status,
      feedback,
      concordance_comment,
      relevance_comment,
      accessibility_comment,
      correctness_comment,
      value_comment,
      quality_comment,
      specific_competence_comment,
      description_comment,
      duration_comment,
      link_comment,
      comment_comment,
      created_at,
      updated_at,
      resources (
        id,
        title
      ),
      users!resource_evaluations_user_id_fkey (
        id,
        email,
        first_name,
        last_name,
        avatar_url
      )
    `;
    
    super(client, 'resource_evaluations', selectQuery);
  }

  /**
   * Get resource evaluations with pagination, filtering, and sorting
   */
  async getResourceEvaluations(params: PaginationParams): Promise<PaginatedResult<ResourceEvaluationWithRelations>> {
    return this.getPaginatedData(params);
  }

  /**
   * Get a single resource evaluation by ID
   */
  async getResourceEvaluationById(id: string): Promise<ResourceEvaluationWithRelations | null> {
    const { data, error } = await this.client
      .from('resource_evaluations')
      .select(`
        id,
        resource_id,
        evaluator_id,
        user_id,
        status,
        feedback,
        concordance_comment,
        relevance_comment,
        accessibility_comment,
        correctness_comment,
        value_comment,
        quality_comment,
        specific_competence_comment,
        description_comment,
        duration_comment,
        link_comment,
        comment_comment,
        created_at,
        updated_at,
        resources (
          id,
          title
        ),
        users!resource_evaluations_evaluator_id_fkey (
          id,
          username,
          first_name,
          last_name
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data as ResourceEvaluationWithRelations;
  }

  /**
   * Get resource evaluations by resource ID
   */
  async getResourceEvaluationsByResourceId(resourceId: string, params: PaginationParams): Promise<PaginatedResult<ResourceEvaluationWithRelations>> {
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
   * Get resource evaluations by evaluator ID
   */
  async getResourceEvaluationsByEvaluatorId(evaluatorId: string, params: PaginationParams): Promise<PaginatedResult<ResourceEvaluationWithRelations>> {
    const evaluatorFilter = {
      column: 'evaluator_id',
      operator: 'eq' as const,
      value: evaluatorId
    };

    const filters = params.filters ? [...params.filters, evaluatorFilter] : [evaluatorFilter];

    return this.getPaginatedData({
      ...params,
      filters
    });
  }

  /**
   * Create a new resource evaluation
   */
  async createResourceEvaluation(data: ResourceEvaluationInsert): Promise<ResourceEvaluationWithRelations> {
    const { data: newEvaluation, error } = await this.client
      .from('resource_evaluations')
      .insert(data)
      .select(`
        id,
        resource_id,
        evaluator_id,
        user_id,
        status,
        feedback,
        concordance_comment,
        relevance_comment,
        accessibility_comment,
        correctness_comment,
        value_comment,
        quality_comment,
        specific_competence_comment,
        description_comment,
        duration_comment,
        link_comment,
        comment_comment,
        created_at,
        updated_at,
        resources (
          id,
          title
        ),
        users!resource_evaluations_evaluator_id_fkey (
          id,
          username,
          first_name,
          last_name
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return newEvaluation as ResourceEvaluationWithRelations;
  }

  /**
   * Update an existing resource evaluation
   */
  async updateResourceEvaluation(id: string, data: ResourceEvaluationUpdate): Promise<ResourceEvaluationWithRelations> {
    const { data: updatedEvaluation, error } = await this.client
      .from('resource_evaluations')
      .update(data)
      .eq('id', id)
      .select(`
        id,
        resource_id,
        evaluator_id,
        user_id,
        status,
        feedback,
        concordance_comment,
        relevance_comment,
        accessibility_comment,
        correctness_comment,
        value_comment,
        quality_comment,
        specific_competence_comment,
        description_comment,
        duration_comment,
        link_comment,
        comment_comment,
        created_at,
        updated_at,
        resources (
          id,
          title
        ),
        users!resource_evaluations_evaluator_id_fkey (
          id,
          username,
          first_name,
          last_name
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return updatedEvaluation as ResourceEvaluationWithRelations;
  }

  /**
   * Delete a resource evaluation
   */
  async deleteResourceEvaluation(id: string): Promise<void> {
    const { error } = await this.client
      .from('resource_evaluations')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
}
