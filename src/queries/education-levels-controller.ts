import { QueryController, type PaginationParams, type PaginatedResult } from '@/lib/query-controller';
import { TypedSupabaseClient } from '@/utils/supabase-types';
import { Database } from '@/utils/database.types';

type EducationLevelInsert = Database['public']['Tables']['educational_levels']['Insert'];
type EducationLevelUpdate = Database['public']['Tables']['educational_levels']['Update'];

export interface EducationLevel {
  id: number;
  name: string;
  parent_id: number | null;
  number: number;
  created_at: string;
  updated_at: string;
}

export interface EducationLevelWithParent extends EducationLevel {
  parent: EducationLevel | null;
}

export class EducationLevelsController extends QueryController<EducationLevel, 'educational_levels'> {
  constructor(client: TypedSupabaseClient) {
    // Define the select query
    const selectQuery = `
      id,
      name,
      parent_id,
      number,
      created_at,
      updated_at
    `;
    
    super(client, 'educational_levels', selectQuery);
  }

  /**
   * Get education levels with pagination, filtering, and sorting
   */
  async getEducationLevels(params: PaginationParams): Promise<PaginatedResult<EducationLevel>> {
    return this.getPaginatedData(params);
  }

  /**
   * Get a single education level by ID
   */
  async getEducationLevelById(id: number): Promise<EducationLevelWithParent | null> {
    const { data, error } = await this.client
      .from('educational_levels')
      .select(`
        id,
        name,
        parent_id,
        number,
        created_at,
        updated_at,
        parent:educational_levels!educational_levels_parent_id_fkey (
          id,
          name,
          parent_id,
          number,
          created_at,
          updated_at
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data as EducationLevelWithParent;
  }

  /**
   * Create a new education level
   */
  async createEducationLevel(data: EducationLevelInsert): Promise<EducationLevel> {
    const { data: newLevel, error } = await this.client
      .from('educational_levels')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return newLevel as EducationLevel;
  }

  /**
   * Update an existing education level
   */
  async updateEducationLevel(id: number, data: EducationLevelUpdate): Promise<EducationLevel> {
    const { data: updatedLevel, error } = await this.client
      .from('educational_levels')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return updatedLevel as EducationLevel;
  }

  /**
   * Delete an education level
   */
  async deleteEducationLevel(id: number): Promise<void> {
    const { error } = await this.client
      .from('educational_levels')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  /**
   * Get all education levels as a hierarchical structure
   */
  async getEducationLevelHierarchy(): Promise<EducationLevel[]> {
    const { data, error } = await this.client
      .from('educational_levels')
      .select()
      .order('number', { ascending: true });

    if (error) {
      throw error;
    }

    return data as EducationLevel[];
  }
}
