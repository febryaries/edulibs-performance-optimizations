import { QueryController, type PaginationParams, type PaginatedResult } from '@/lib/query-controller';
import { TypedSupabaseClient } from '@/utils/supabase-types';
import { Database } from '@/utils/database.types';

type ClassRow = Database['public']['Tables']['classes']['Row'];
type ClassInsert = Database['public']['Tables']['classes']['Insert'];
type ClassUpdate = Database['public']['Tables']['classes']['Update'];

export interface ClassWithLevel extends ClassRow {
  educational_levels: {
    id: number;
    name: string;
  } | null;
}

export class ClassesController extends QueryController<ClassWithLevel, 'classes'> {
  constructor(client: TypedSupabaseClient) {
    // Define the select query with the foreign key relationship
    const selectQuery = `
      id,
      name,
      number,
      level_id,
      created_at,
      updated_at,
      educational_levels (
        id,
        name
      )
    `;
    
    super(client, 'classes', selectQuery);
  }

  /**
   * Get classes with pagination, filtering, and sorting
   */
  async getClasses(params: PaginationParams): Promise<PaginatedResult<ClassWithLevel>> {
    return this.getPaginatedData(params);
  }

  /**
   * Get a single class by ID
   */
  async getClassById(id: number): Promise<ClassWithLevel | null> {
    const { data, error } = await this.client
      .from('classes')
      .select(`
        id,
        name,
        number,
        level_id,
        created_at,
        updated_at,
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

    return data;
  }

  /**
   * Create a new class
   */
  async createClass(data: ClassInsert): Promise<ClassWithLevel> {
    const { data: newClass, error } = await this.client
      .from('classes')
      .insert(data)
      .select(`
        id,
        name,
        number,
        level_id,
        created_at,
        updated_at,
        educational_levels (
          id,
          name
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return newClass as ClassWithLevel;
  }

  /**
   * Update an existing class
   */
  async updateClass(id: number, data: ClassUpdate): Promise<ClassWithLevel> {
    const { data: updatedClass, error } = await this.client
      .from('classes')
      .update(data)
      .eq('id', id)
      .select(`
        id,
        name,
        number,
        level_id,
        created_at,
        updated_at,
        educational_levels (
          id,
          name
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return updatedClass as ClassWithLevel;
  }

  /**
   * Delete a class
   */
  async deleteClass(id: number): Promise<void> {
    const { error } = await this.client
      .from('classes')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
}
