import { QueryController, type PaginationParams, type PaginatedResult } from '@/lib/query-controller';
import { TypedSupabaseClient } from '@/utils/supabase-types';
import { Database } from '@/utils/database.types';

type SpecificCompetencyInsert = Database['public']['Tables']['specific_competencies']['Insert'];
type SpecificCompetencyUpdate = Database['public']['Tables']['specific_competencies']['Update'];

export interface SpecificCompetency {
  id: number;
  name: string;
  class_id: number;
  competency_id: number;
  number: number;
  created_at: string;
  updated_at: string;
}

export interface SpecificCompetencyWithRelations extends SpecificCompetency {
  classes: {
    id: number;
    name: string;
    number: number;
  } | null;
  general_competencies: {
    id: number;
    name: string;
  } | null;
}

export class SpecificCompetenciesController extends QueryController<SpecificCompetencyWithRelations, 'specific_competencies'> {
  constructor(client: TypedSupabaseClient) {
    // Define the select query with the foreign key relationships
    const selectQuery = `
      id,
      name,
      class_id,
      competency_id,
      number,
      created_at,
      updated_at,
      classes (
        id,
        name,
        number
      ),
      general_competencies (
        id,
        name
      )
    `;
    
    super(client, 'specific_competencies', selectQuery);
  }

  /**
   * Get specific competencies with pagination, filtering, and sorting
   */
  async getSpecificCompetencies(params: PaginationParams): Promise<PaginatedResult<SpecificCompetencyWithRelations>> {
    return this.getPaginatedData(params);
  }

  /**
   * Get a single specific competency by ID
   */
  async getSpecificCompetencyById(id: number): Promise<SpecificCompetencyWithRelations | null> {
    const { data, error } = await this.client
      .from('specific_competencies')
      .select(`
        id,
        name,
        class_id,
        competency_id,
        number,
        created_at,
        updated_at,
        classes (
          id,
          name,
          number
        ),
        general_competencies (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data as SpecificCompetencyWithRelations;
  }

  /**
   * Get specific competencies by class ID
   */
  async getSpecificCompetenciesByClassId(classId: number, params: PaginationParams): Promise<PaginatedResult<SpecificCompetencyWithRelations>> {
    const classFilter = {
      column: 'class_id',
      operator: 'eq' as const,
      value: classId
    };

    const filters = params.filters ? [...params.filters, classFilter] : [classFilter];

    return this.getPaginatedData({
      ...params,
      filters
    });
  }

  /**
   * Get specific competencies by general competency ID
   */
  async getSpecificCompetenciesByCompetencyId(competencyId: number, params: PaginationParams): Promise<PaginatedResult<SpecificCompetencyWithRelations>> {
    const competencyFilter = {
      column: 'competency_id',
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
   * Create a new specific competency
   */
  async createSpecificCompetency(data: SpecificCompetencyInsert): Promise<SpecificCompetencyWithRelations> {
    const { data: newCompetency, error } = await this.client
      .from('specific_competencies')
      .insert(data)
      .select(`
        id,
        name,
        class_id,
        competency_id,
        number,
        created_at,
        updated_at,
        classes (
          id,
          name,
          number
        ),
        general_competencies (
          id,
          name
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return newCompetency as SpecificCompetencyWithRelations;
  }

  /**
   * Update an existing specific competency
   */
  async updateSpecificCompetency(id: number, data: SpecificCompetencyUpdate): Promise<SpecificCompetencyWithRelations> {
    const { data: updatedCompetency, error } = await this.client
      .from('specific_competencies')
      .update(data)
      .eq('id', id)
      .select(`
        id,
        name,
        class_id,
        competency_id,
        number,
        created_at,
        updated_at,
        classes (
          id,
          name,
          number
        ),
        general_competencies (
          id,
          name
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return updatedCompetency as SpecificCompetencyWithRelations;
  }

  /**
   * Delete a specific competency
   */
  async deleteSpecificCompetency(id: number): Promise<void> {
    const { error } = await this.client
      .from('specific_competencies')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
}
