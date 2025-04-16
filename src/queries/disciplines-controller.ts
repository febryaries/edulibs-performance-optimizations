import { QueryController, type PaginationParams, type PaginatedResult, QueryFilter } from '@/lib/query-controller';
import { TypedSupabaseClient } from '@/utils/supabase-types';
import { Database } from '@/utils/database.types';

type DisciplineRow = Database['public']['Tables']['disciplines']['Row'];

export interface DisciplineWithDomain extends DisciplineRow {
  domains: {
    id: number;
    name: string;
  } | null;
  educational_levels?: string[];
}

export class DisciplinesController extends QueryController<DisciplineWithDomain, 'disciplines'> {
  // Add a static cache for educational levels
  private static levelsCache: Map<string, { data: Record<number, string[]>, timestamp: number }> = new Map();
  private static LEVELS_CACHE_EXPIRATION = 60000; // 60 seconds
  
  constructor(client: TypedSupabaseClient) {
    // Define the select query with the foreign key relationship
    const selectQuery = `
      id,
      name,
      domain_id,
      created_at,
      updated_at,
      domains (
        id,
        name
      )
    `;
    
    super(client, 'disciplines', selectQuery);
  }

  /**
   * Get disciplines with pagination, filtering, and sorting
   */
  async getDisciplines(params: PaginationParams): Promise<PaginatedResult<DisciplineWithDomain>> {
    return this.getPaginatedData(params);
  }

  /**
   * Get a single discipline by ID
   */
  async getDisciplineById(id: number): Promise<DisciplineWithDomain | null> {
    const { data, error } = await this.client
      .from('disciplines')
      .select(`
        id,
        name,
        domain_id,
        created_at,
        updated_at,
        domains (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    // Fetch educational levels for this discipline
    if (data) {
      const levelsData = await this.getEducationalLevelsForDiscipline(data.id);
      return {
        ...data,
        educational_levels: levelsData
      };
    }

    return data;
  }

  /**
   * Override getPaginatedData to include educational levels and handle custom filters
   */
  async getPaginatedData(params: PaginationParams): Promise<PaginatedResult<DisciplineWithDomain>> {
    // Extract custom filters
    const standardFilters: QueryFilter[] = [];
    const classFilters: QueryFilter[] = [];
    const competencyFilters: QueryFilter[] = [];
    
    if (params.filters) {
      params.filters.forEach(filter => {
        // Check if this is a class filter
        if (filter.column === 'id' && filter.operator === 'in' && filter.customHandler === 'clasa') {
          classFilters.push(filter);
        }
        // Check if this is a competency filter
        else if (filter.column === 'id' && filter.operator === 'in' && filter.customHandler === 'competenta') {
          competencyFilters.push(filter);
        }
        // Standard filter
        else {
          standardFilters.push(filter);
        }
      });
    }
    
    // Create a modified params object with only standard filters
    const modifiedParams = {
      ...params,
      filters: standardFilters
    };
    
    // Get initial result with standard filters
    let result = await super.getPaginatedData(modifiedParams);
    
    // Apply class filters if any
    if (classFilters.length > 0) {
      const classIds = classFilters[0].value as number[];
      
      // Get discipline IDs from the discipline_class junction table
      const { data: disciplineClassData } = await this.client
        .from('discipline_class')
        .select('discipline_id')
        .in('class_id', classIds);
      
      if (disciplineClassData && disciplineClassData.length > 0) {
        const disciplineIds = disciplineClassData.map(item => item.discipline_id);
        
        // Filter the result to only include disciplines in the list
        result.data = result.data.filter(discipline => 
          disciplineIds.includes(discipline.id)
        );
        
        // Update count
        result.count = result.data.length;
      } else {
        // No disciplines match the class filter
        result.data = [];
        result.count = 0;
      }
    }
    
    // Apply competency filters if any
    if (competencyFilters.length > 0) {
      const competencyIds = competencyFilters[0].value as number[];
      
      // Get discipline IDs from the competencies tables
      const { data: competencyData } = await this.client
        .from('general_competencies')
        .select('discipline_id')
        .in('id', competencyIds);
      
      if (competencyData && competencyData.length > 0) {
        const disciplineIds = competencyData.map(item => item.discipline_id);
        
        // Filter the result to only include disciplines in the list
        result.data = result.data.filter(discipline => 
          disciplineIds.includes(discipline.id)
        );
        
        // Update count
        result.count = result.data.length;
      } else {
        // No disciplines match the competency filter
        result.data = [];
        result.count = 0;
      }
    }
    
    // If there are no disciplines, return early
    if (result.data.length === 0) {
      return result;
    }
    
    // Batch fetch educational levels for all disciplines in a single query
    const disciplineIds = result.data.map(d => d.id);
    const levelsMap = await this.getEducationalLevelsForDisciplines(disciplineIds);
    
    // Map the levels to each discipline
    const disciplinesWithLevels = result.data.map(discipline => ({
      ...discipline,
      educational_levels: levelsMap[discipline.id] || []
    }));
    
    return {
      ...result,
      data: disciplinesWithLevels
    };
  }

  /**
   * Batch fetch educational levels for multiple disciplines
   */
  private async getEducationalLevelsForDisciplines(disciplineIds: number[]): Promise<Record<number, string[]>> {
    // Generate a cache key for this specific batch request
    const cacheKey = `discipline_levels:${disciplineIds.sort().join(',')}`;
    
    // Check if we have this data cached
    const cachedData = DisciplinesController.levelsCache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < DisciplinesController.LEVELS_CACHE_EXPIRATION) {
      console.log(`[DisciplinesController] Using cached educational levels for disciplines:`, disciplineIds);
      return cachedData.data;
    }
    
    console.log(`[DisciplinesController] Fetching educational levels for disciplines:`, disciplineIds);
    
    // If not in cache, fetch from the database
    const { data, error } = await this.client
      .from('discipline_class')
      .select(`
        discipline_id,
        classes!inner(
          educational_levels!inner(
            id,
            name
          )
        )
      `)
      .in('discipline_id', disciplineIds);
    
    if (error) {
      console.error('Error fetching educational levels:', error);
      return {};
    }
    
    // Process the results into a map of discipline_id -> level names
    const levelsMap: Record<number, string[]> = {};
    
    // Initialize empty arrays for all requested discipline IDs
    disciplineIds.forEach(id => {
      levelsMap[id] = [];
    });
    
    // Fill in the data we received
    data.forEach(item => {
      const disciplineId = item.discipline_id;
      const levelName = item.classes?.educational_levels?.name;
      
      if (disciplineId && levelName) {
        if (!levelsMap[disciplineId].includes(levelName)) {
          levelsMap[disciplineId].push(levelName);
        }
      }
    });
    
    // Cache the result for future use
    DisciplinesController.levelsCache.set(cacheKey, { data: levelsMap, timestamp: Date.now() });
    
    return levelsMap;
  }

  /**
   * Helper method to get educational levels for a single discipline
   */
  private async getEducationalLevelsForDiscipline(disciplineId: number): Promise<string[]> {
    // Use the batch method for consistency
    const levelsMap = await this.getEducationalLevelsForDisciplines([disciplineId]);
    return levelsMap[disciplineId] || [];
  }
}
