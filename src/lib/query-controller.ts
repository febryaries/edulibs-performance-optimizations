import { TypedSupabaseClient } from '@/utils/supabase-types';
import { Database } from '@/utils/database.types';
import { UseQueryResult } from '@tanstack/react-query';

export type SortDirection = 'asc' | 'desc';

export interface QueryFilter {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is';
  value: any;
  customHandler?: string; // Identifies special filter handling in controllers
}

export interface QuerySort {
  column: string;
  direction: SortDirection;
}

export interface PaginationParams {
  pageSize: number;
  cursor?: string;
  filters?: QueryFilter[];
  sorts?: QuerySort[];
  searchTerm?: string;
  searchColumns?: string[];
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  prevCursor: string | null;
  count: number | null;
}

/**
 * Generic type for paginated hooks that accept PaginationParams and return a query result with PaginatedResult
 */
export type UsePaginatedHook<T> = (params?: PaginationParams) => UseQueryResult<PaginatedResult<T>, Error>;

type Tables = Database['public']['Tables'];
type TableNames = keyof Tables;

export class QueryController<T, TableName extends TableNames> {
  protected client: TypedSupabaseClient;
  protected tableName: TableName;
  protected selectQuery: string;
  protected countQuery: boolean;
  // Add cache for requests
  private static cache: Map<string, { data: any, timestamp: number }> = new Map();
  // Cache expiration time in milliseconds (5 seconds default)
  private static CACHE_EXPIRATION = 5000;
  // Longer cache expiration for specific tables (30 seconds)
  private static LONG_CACHE_TABLES = ['discipline_class', 'classes', 'educational_levels'];
  private static LONG_CACHE_EXPIRATION = 30000;
  // Track in-flight requests to prevent duplicates
  private static pendingRequests: Map<string, Promise<any>> = new Map();
  
  constructor(
    client: TypedSupabaseClient, 
    tableName: TableName, 
    selectQuery: string = '*',
    countQuery: boolean = true
  ) {
    this.client = client;
    this.tableName = tableName;
    this.selectQuery = selectQuery;
    this.countQuery = countQuery;
  }

  /**
   * Clear the cache for all controllers
   */
  static clearCache() {
    QueryController.cache.clear();
  }

  /**
   * Generate a cache key for a request
   */
  private generateCacheKey(params: PaginationParams): string {
    return `${this.tableName}:${JSON.stringify(params)}`;
  }

  /**
   * Check if a cached result is available and valid
   */
  private getCachedResult(key: string): PaginatedResult<T> | null {
    const cached = QueryController.cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    // Use longer cache expiration for specific tables
    const expiration = QueryController.LONG_CACHE_TABLES.includes(this.tableName as string) 
      ? QueryController.LONG_CACHE_EXPIRATION 
      : QueryController.CACHE_EXPIRATION;
      
    if (now - cached.timestamp > expiration) {
      // Cache expired, remove it
      QueryController.cache.delete(key);
      return null;
    }
    
    return cached.data as PaginatedResult<T>;
  }

  /**
   * Cache a result
   */
  private cacheResult(key: string, result: PaginatedResult<T>): void {
    QueryController.cache.set(key, {
      data: result,
      timestamp: Date.now()
    });
  }

  /**
   * Apply filters to a Supabase query
   */
  private applyFilters(query: any, filters?: QueryFilter[]): any {
    if (!filters || filters.length === 0) return query;
    
    let filteredQuery = query;
    
    for (const filter of filters) {
      switch (filter.operator) {
        case 'eq':
          filteredQuery = filteredQuery.eq(filter.column, filter.value);
          break;
        case 'neq':
          filteredQuery = filteredQuery.neq(filter.column, filter.value);
          break;
        case 'gt':
          filteredQuery = filteredQuery.gt(filter.column, filter.value);
          break;
        case 'gte':
          filteredQuery = filteredQuery.gte(filter.column, filter.value);
          break;
        case 'lt':
          filteredQuery = filteredQuery.lt(filter.column, filter.value);
          break;
        case 'lte':
          filteredQuery = filteredQuery.lte(filter.column, filter.value);
          break;
        case 'like':
          filteredQuery = filteredQuery.like(filter.column, `%${filter.value}%`);
          break;
        case 'ilike':
          filteredQuery = filteredQuery.ilike(filter.column, `%${filter.value}%`);
          break;
        case 'in':
          filteredQuery = filteredQuery.in(filter.column, filter.value);
          break;
        case 'is':
          filteredQuery = filteredQuery.is(filter.column, filter.value);
          break;
      }
    }
    
    return filteredQuery;
  }

  /**
   * Apply sorting to a Supabase query
   */
  private applySorting(query: any, sorts?: QuerySort[]): any {
    if (!sorts || sorts.length === 0) {
      // Default sort by id if no sort is specified
      return query.order('id', { ascending: true });
    }
    
    let sortedQuery = query;
    
    for (const sort of sorts) {
      sortedQuery = sortedQuery.order(sort.column, { ascending: sort.direction === 'asc' });
    }
    
    return sortedQuery;
  }

  /**
   * Apply search to a Supabase query
   */
  private applySearch(query: any, searchTerm?: string, searchColumns?: string[]): any {
    if (!searchTerm || !searchColumns || searchColumns.length === 0) return query;
    
    let searchQuery = query;
    const searchTermFormatted = `%${searchTerm}%`;
    
    // Create OR conditions for each search column
    searchQuery = searchQuery.or(
      searchColumns.map(column => `${column}.ilike.${searchTermFormatted}`).join(',') 
    );
    
    return searchQuery;
  }

  /**
   * Get paginated data with cursor-based pagination
   * 
   * This implementation follows Supabase's recommended approach for cursor-based pagination
   * by using the primary key or sort column as the cursor reference point.
   */
  async getPaginatedData(params: PaginationParams): Promise<PaginatedResult<T>> {
    const key = this.generateCacheKey(params);
    console.log(`[QueryController] Request for ${this.tableName}:`, { params, key });
    
    // Check cache first
    const cachedResult = this.getCachedResult(key);
    if (cachedResult) {
      console.log(`[QueryController] Cache hit for ${this.tableName}:`, { key });
      return cachedResult;
    }
    console.log(`[QueryController] Cache miss for ${this.tableName}:`, { key });
    
    // Check if there's already a pending request for this key
    const pendingRequest = QueryController.pendingRequests.get(key);
    if (pendingRequest) {
      console.log(`[QueryController] Reusing pending request for ${this.tableName}:`, { key });
      return pendingRequest;
    }
    
    // Create a new request and store it in the pendingRequests map
    const requestPromise = this.executeRequest(params, key);
    QueryController.pendingRequests.set(key, requestPromise);
    
    try {
      return await requestPromise;
    } finally {
      // Remove the request from pendingRequests when it completes
      QueryController.pendingRequests.delete(key);
    }
  }
  
  /**
   * Execute the actual request to the database
   */
  private async executeRequest(params: PaginationParams, key: string): Promise<PaginatedResult<T>> {
    const { pageSize, cursor, filters, sorts, searchTerm, searchColumns } = params;
    
    // Determine the sort column to use for cursor pagination
    const sortColumn = sorts && sorts.length > 0 ? sorts[0].column : 'id';
    const sortDirection = sorts && sorts.length > 0 ? sorts[0].direction : 'asc';
    
    // Start the query
    let query = this.client
      .from(this.tableName)
      .select(this.selectQuery, { count: 'exact' }); // Always get exact count
    
    // Apply filters and search first
    query = this.applyFilters(query, filters);
    query = this.applySearch(query, searchTerm, searchColumns);
    
    // Get total count with current filters before applying pagination
    const countQuery = query;
    const { count } = await countQuery;
    
    // Apply cursor if provided
    if (cursor) {
      try {
        const cursorData = JSON.parse(cursor) as { column: string; value: any };
        // Apply the appropriate comparison based on sort direction
        if (sortDirection === 'asc') {
          query = query.gt(cursorData.column, cursorData.value);
        } else {
          query = query.lt(cursorData.column, cursorData.value);
        }
      } catch (e) {
        console.error('Invalid cursor format', e);
      }
    }
    
    // Apply sorting last to ensure proper cursor pagination
    query = this.applySorting(query, sorts);
    
    // Apply limit after all other conditions
    query = query.limit(pageSize);
    
    // Execute the query
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Generate the next cursor
    let nextCursor = null;
    let prevCursor = null;
    
    if (data && data.length === pageSize) {
      const lastItem = data[data.length - 1] as Record<string, any>;
      nextCursor = JSON.stringify({
        column: sortColumn,
        value: lastItem[sortColumn]
      });
    }
    
    const result = {
      data: data as T[],
      nextCursor,
      prevCursor,
      count
    };

    // Cache the result
    this.cacheResult(key, result);

    return result;
  }
}
