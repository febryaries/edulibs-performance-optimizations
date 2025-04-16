import { QueryController, type PaginationParams, type PaginatedResult } from '@/lib/query-controller';
import { TypedSupabaseClient } from '@/utils/supabase-types';
import { Database } from '@/utils/database.types';

type CurricularAreaInsert = Database['public']['Tables']['curricular_areas']['Insert'];
type CurricularAreaUpdate = Database['public']['Tables']['curricular_areas']['Update'];

export interface CurricularArea {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export class CurricularAreasController extends QueryController<CurricularArea, 'curricular_areas'> {
  constructor(client: TypedSupabaseClient) {
    // Define the select query
    const selectQuery = `
      id,
      name,
      created_at,
      updated_at
    `;
    
    super(client, 'curricular_areas', selectQuery);
  }

  /**
   * Get curricular areas with pagination, filtering, and sorting
   */
  async getCurricularAreas(params: PaginationParams): Promise<PaginatedResult<CurricularArea>> {
    return this.getPaginatedData(params);
  }

  /**
   * Get a single curricular area by ID
   */
  async getCurricularAreaById(id: number): Promise<CurricularArea | null> {
    const { data, error } = await this.client
      .from('curricular_areas')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Create a new curricular area
   */
  async createCurricularArea(data: CurricularAreaInsert): Promise<CurricularArea> {
    const { data: newArea, error } = await this.client
      .from('curricular_areas')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return newArea as CurricularArea;
  }

  /**
   * Update an existing curricular area
   */
  async updateCurricularArea(id: number, data: CurricularAreaUpdate): Promise<CurricularArea> {
    const { data: updatedArea, error } = await this.client
      .from('curricular_areas')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return updatedArea as CurricularArea;
  }

  /**
   * Delete a curricular area
   */
  async deleteCurricularArea(id: number): Promise<void> {
    const { error } = await this.client
      .from('curricular_areas')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
}
