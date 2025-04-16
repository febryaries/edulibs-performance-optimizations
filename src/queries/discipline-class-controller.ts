import { QueryController, type PaginationParams, type PaginatedResult } from '@/lib/query-controller';
import { TypedSupabaseClient } from '@/utils/supabase-types';
import { Database } from '@/utils/database.types';

type DisciplineClassInsert = Database['public']['Tables']['discipline_class']['Insert'];
type DisciplineClassUpdate = Database['public']['Tables']['discipline_class']['Update'];

export interface DisciplineClass {
  id: number;
  code: string | null;
  area_id: number;
  class_id: number;
  discipline_id: number;
  created_at: string;
  updated_at: string;
}

export interface DisciplineClassWithRelations extends DisciplineClass {
  curricular_areas: {
    id: number;
    name: string;
  } | null;
  classes: {
    id: number;
    name: string;
    number: number;
  } | null;
  disciplines: {
    id: number;
    name: string;
  } | null;
}

export class DisciplineClassController extends QueryController<DisciplineClassWithRelations, 'discipline_class'> {
  constructor(client: TypedSupabaseClient) {
    // Define the select query with the foreign key relationships
    const selectQuery = `
      id,
      code,
      area_id,
      class_id,
      discipline_id,
      created_at,
      updated_at,
      curricular_areas (
        id,
        name
      ),
      classes (
        id,
        name,
        number
      ),
      disciplines (
        id,
        name
      )
    `;
    
    super(client, 'discipline_class', selectQuery);
  }

  /**
   * Get discipline-class relationships with pagination, filtering, and sorting
   */
  async getDisciplineClasses(params: PaginationParams): Promise<PaginatedResult<DisciplineClassWithRelations>> {
    return this.getPaginatedData(params);
  }

  /**
   * Get a single discipline-class relationship by ID
   */
  async getDisciplineClassById(id: number): Promise<DisciplineClassWithRelations | null> {
    const { data, error } = await this.client
      .from('discipline_class')
      .select(`
        id,
        code,
        area_id,
        class_id,
        discipline_id,
        created_at,
        updated_at,
        curricular_areas (
          id,
          name
        ),
        classes (
          id,
          name,
          number
        ),
        disciplines (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data as DisciplineClassWithRelations;
  }

  /**
   * Get discipline-class relationships by class ID
   */
  async getDisciplineClassesByClassId(classId: number, params: PaginationParams): Promise<PaginatedResult<DisciplineClassWithRelations>> {
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
   * Get discipline-class relationships by discipline ID
   */
  async getDisciplineClassesByDisciplineId(disciplineId: number, params: PaginationParams): Promise<PaginatedResult<DisciplineClassWithRelations>> {
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
   * Create a new discipline-class relationship
   */
  async createDisciplineClass(data: DisciplineClassInsert): Promise<DisciplineClassWithRelations> {
    const { data: newDisciplineClass, error } = await this.client
      .from('discipline_class')
      .insert(data)
      .select(`
        id,
        code,
        area_id,
        class_id,
        discipline_id,
        created_at,
        updated_at,
        curricular_areas (
          id,
          name
        ),
        classes (
          id,
          name,
          number
        ),
        disciplines (
          id,
          name
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return newDisciplineClass as DisciplineClassWithRelations;
  }

  /**
   * Update an existing discipline-class relationship
   */
  async updateDisciplineClass(id: number, data: DisciplineClassUpdate): Promise<DisciplineClassWithRelations> {
    const { data: updatedDisciplineClass, error } = await this.client
      .from('discipline_class')
      .update(data)
      .eq('id', id)
      .select(`
        id,
        code,
        area_id,
        class_id,
        discipline_id,
        created_at,
        updated_at,
        curricular_areas (
          id,
          name
        ),
        classes (
          id,
          name,
          number
        ),
        disciplines (
          id,
          name
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return updatedDisciplineClass as DisciplineClassWithRelations;
  }

  /**
   * Delete a discipline-class relationship
   */
  async deleteDisciplineClass(id: number): Promise<void> {
    const { error } = await this.client
      .from('discipline_class')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
}
