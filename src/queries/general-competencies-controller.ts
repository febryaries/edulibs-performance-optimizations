import { QueryController, type PaginationParams, type PaginatedResult } from '@/lib/query-controller';
import { TypedSupabaseClient } from '@/utils/supabase-types';
import { Database } from '@/utils/database.types';

type GeneralCompetencyInsert = Database['public']['Tables']['general_competencies']['Insert'];
type GeneralCompetencyUpdate = Database['public']['Tables']['general_competencies']['Update'];

export interface GeneralCompetency {
  id: number;
  name: string;
  discipline_id: number;
  level_id: number;
  number: number;
  created_at: string;
  updated_at: string;
}

export interface GeneralCompetencyWithRelations extends GeneralCompetency {
  disciplines: {
    id: number;
    name: string;
  } | null;
  educational_levels: {
    id: number;
    name: string;
  } | null;
}

export class GeneralCompetenciesController extends QueryController<GeneralCompetencyWithRelations, 'general_competencies'> {
  constructor(client: TypedSupabaseClient) {
    // Define the select query with the foreign key relationships
    const selectQuery = `
      id,
      name,
      discipline_id,
      level_id,
      number,
      created_at,
      updated_at,
      disciplines (
        id,
        name
      ),
      educational_levels (
        id,
        name
      )
    `;
    
    super(client, 'general_competencies', selectQuery);
  }

  /**
   * Get general competencies with pagination, filtering, and sorting
   */
  async getGeneralCompetencies(params: PaginationParams): Promise<PaginatedResult<GeneralCompetencyWithRelations>> {
    return this.getPaginatedData(params);
  }

  /**
   * Get a single general competency by ID
   */
  async getGeneralCompetencyById(id: number): Promise<GeneralCompetencyWithRelations | null> {
    const { data, error } = await this.client
      .from('general_competencies')
      .select(`
        id,
        name,
        discipline_id,
        level_id,
        number,
        created_at,
        updated_at,
        disciplines (
          id,
          name
        ),
        educational_levels (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data as GeneralCompetencyWithRelations;
  }

  /**
   * Get general competencies by discipline ID
   */
  async getGeneralCompetenciesByDisciplineId(disciplineId: number, params: PaginationParams): Promise<PaginatedResult<GeneralCompetencyWithRelations>> {
    const disciplineFilter = {
      column: 'discipline_id',
      operator: 'eq' as const,
      value: disciplineId
    };

    const filters = params.filters ? [...params.filters, disciplineFilter] : [disciplineFilter];

    return this.getPaginatedData({
      ...params,
      filters
    });
  }

  /**
   * Get general competencies by educational level ID
   */
  async getGeneralCompetenciesByLevelId(levelId: number, params: PaginationParams): Promise<PaginatedResult<GeneralCompetencyWithRelations>> {
    const levelFilter = {
      column: 'level_id',
      operator: 'eq' as const,
      value: levelId
    };

    const filters = params.filters ? [...params.filters, levelFilter] : [levelFilter];

    return this.getPaginatedData({
      ...params,
      filters
    });
  }

  /**
   * Create a new general competency
   */
  async createGeneralCompetency(data: GeneralCompetencyInsert): Promise<GeneralCompetencyWithRelations> {
    const { data: newCompetency, error } = await this.client
      .from('general_competencies')
      .insert(data)
      .select(`
        id,
        name,
        discipline_id,
        level_id,
        number,
        created_at,
        updated_at,
        disciplines (
          id,
          name
        ),
        educational_levels (
          id,
          name
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return newCompetency as GeneralCompetencyWithRelations;
  }

  /**
   * Update an existing general competency
   */
  async updateGeneralCompetency(id: number, data: GeneralCompetencyUpdate): Promise<GeneralCompetencyWithRelations> {
    const { data: updatedCompetency, error } = await this.client
      .from('general_competencies')
      .update(data)
      .eq('id', id)
      .select(`
        id,
        name,
        discipline_id,
        level_id,
        number,
        created_at,
        updated_at,
        disciplines (
          id,
          name
        ),
        educational_levels (
          id,
          name
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return updatedCompetency as GeneralCompetencyWithRelations;
  }

  /**
   * Delete a general competency
   */
  async deleteGeneralCompetency(id: number): Promise<void> {
    const { error } = await this.client
      .from('general_competencies')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
}
