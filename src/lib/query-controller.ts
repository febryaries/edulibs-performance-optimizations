import { TypedSupabaseClient } from '@/utils/supabase-types';
import { Database } from '@/utils/database.types';
import { UseQueryResult } from '@tanstack/react-query';

export type SortDirection = 'asc' | 'desc';

export interface QueryFilter {
  column?: string;
  operator?: 'not' | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is';
  value?: any;
  customHandler?: string;
  negateOperator?: QueryFilter['operator'];

  // New properties for logical operations
  and?: QueryFilter[];
  or?: QueryFilter[];
}

export interface QuerySort {
  column: string;
  direction: SortDirection;
}

export interface QueryCursor {
  column: string;
  value: any;
}

export interface PaginationParams {
  pageSize: number;
  cursor?: QueryCursor;
  offset?: number; // <-- ✅ New field for offset-based pagination
  filters?: QueryFilter[];
  sorts?: QuerySort[];
  searchTerm?: string;
  searchColumns?: string[];
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: QueryCursor | null;
  prevCursor: QueryCursor | null;
  count: number | null;
}

export type TablesMap = Database['public']['Tables'];
export type TableNames = keyof TablesMap;
export type TableRow<T extends TableNames> = TablesMap[T]['Row'];
export type TableInsert<T extends TableNames> = TablesMap[T]['Insert'];
export type TableUpdate<T extends TableNames> = TablesMap[T]['Update'];

// Get all relationships for a table
export type TableRelationships<T extends TableNames> =
  Database['public']['Tables'][T]['Relationships'][number];

// Get foreign key names for a table
export type ForeignKeyNames<T extends TableNames> =
  TableRelationships<T>['foreignKeyName'];

// Get referenced relation names for a table
export type ReferencedRelationNames<T extends TableNames> =
  TableRelationships<T>['referencedRelation'];


// Add this helper type to extract the alias from a relationMap value
type ExtractAlias<V> = V extends string ? V : V extends { alias: string } ? V['alias'] : never;

// Update the RelationKey type to handle both string aliases and RelationMapConfig objects
export type RelationKey<
  FK extends string,
  Ref extends keyof Database['public']['Tables'],
  Map extends Partial<Record<FK, string | RelationMapConfig<FK, any>>>
> = FK extends keyof Map
  ? ExtractAlias<Map[FK]>
  : FK;

export type ForeignKeyRelationMap<
  T extends TableNames
> = {
    [K in ForeignKeyNames<T>]?: RelationMapConfig<K, ReferencedTable<T, K>>;
  };

export interface RelationMapConfig<
  FK extends string = string,
  RefTable extends TableNames = TableNames
> {
  alias: string;
  referencedTable: RefTable;
  isOneToMany?: boolean; // <--- Added to override detection
  nested?: string; // <--- Added to support nested relations like 'competency:competencies(*)'
}


// Update the WithRelations type to use the improved RelationKey
export type WithRelations<
  T extends TableNames,
  Map extends ForeignKeyRelationMap<T>
> =
  & TableRow<T>
  & {
    [K in keyof Map as Map[K] extends { alias: string } ? Map[K]['alias'] : never]?: Map[K] extends { isOneToMany: true }
    ? Map[K] extends { referencedTable: infer RT } ? RT extends TableNames ? TableRow<RT>[] : never : never
    : Map[K] extends { referencedTable: infer RT } ? RT extends TableNames ? TableRow<RT> : never : never
  };


export type UsePaginatedHook<T> = (params?: PaginationParams) => UseQueryResult<PaginatedResult<T>, Error>;

export type GetPaginatedDataFn<
  T extends TableNames,
  Map extends ForeignKeyRelationMap<T> = {}
> = (params: PaginationParams) => Promise<PaginatedResult<WithRelations<T, Map>>>;

// Get the referenced table for a foreign key
export type ReferencedTable<
  T extends TableNames,
  FK extends ForeignKeyNames<T>
> = Extract<
  Database['public']['Tables'][T]['Relationships'][number],
  { foreignKeyName: FK }
>['referencedRelation'];

// This RelationMapConfig was duplicated - using the one with isOneToMany defined above

// Updated QueryConfig to work with the improved relationship mapping
export interface QueryConfig<
  T extends TableNames,
  Map extends ForeignKeyRelationMap<T> = {}
> {
  fields?: (keyof TableRow<T> | '*')[];
  relationMap?: Map;
}

export type SingleQueryParams = Omit<PaginationParams, "pageSize" | "cursor"> & { sorts?: QuerySort[] };

export class QueryController<
  T extends TableNames,
  Map extends ForeignKeyRelationMap<T> = {}
> {
  protected client: TypedSupabaseClient;
  protected tableName: T;
  protected config: QueryConfig<T, Map>;
  protected primaryKey: keyof TableRow<T>;
  protected defaultFields: (keyof TableRow<T>)[];

  constructor(
    client: TypedSupabaseClient,
    tableName: T,
    config: QueryConfig<T, Map> = {},
    primaryKey: keyof TableRow<T> = 'id' as keyof TableRow<T>
  ) {
    this.client = client;
    this.tableName = tableName;
    this.primaryKey = primaryKey;

    // Get all fields for this table if none provided
    this.defaultFields = Object.keys(
      {} as TableRow<T>
    ) as (keyof TableRow<T>)[];

    // Merge provided config with defaults
    this.config = {
      fields: config.fields || this.defaultFields,
      relationMap: config.relationMap || {} as Map
    };
  }

  /**
   * Builds the SELECT query with proper relationship handling
   * Supports multiple relationships to the same table using Supabase's alias syntax
   */
  protected buildSelectQuery(): string {
    const fields = this.config.fields || this.defaultFields;
    const relationMap = this.config.relationMap || {};

    // Format the main table fields
    const fieldList = fields.join(',');

    // Build relationship list from the relationMap
    const relationQueries = Object.entries(relationMap).map(([foreignKey, value]) => {
      // Handle both simple string aliases and full relation config objects
      let alias: string;
      let refTable: string;
      let nested: string | undefined;

      if (typeof value === 'string') {
        alias = value;
        // Default to pluralized form of foreign key without '_id' suffix
        refTable = foreignKey.endsWith('_id')
          ? foreignKey.substring(0, foreignKey.length - 3) + 's'  // e.g., 'user_id' -> 'users'
          : foreignKey;
      } else {
        alias = (value as RelationMapConfig<ForeignKeyNames<T>, any>).alias;
        refTable = (value as RelationMapConfig<ForeignKeyNames<T>, any>).referencedTable;
        nested = (value as RelationMapConfig<ForeignKeyNames<T>, any>).nested;
      }

      // Use Supabase's proper join syntax:
      // alias:table!fk(field1,field2)
      // If nested is provided, include it in the select query
      // Example: specific_competencies:resource_competency!resource_competency_resource_id_fkey(*, competency:competencies(*))
      return `${alias}:${refTable}!${foreignKey}(${nested ? `*, ${nested}` : '*'})`;
    });

    // Combine the main fields with relationship queries
    if (relationQueries.length > 0) {
      return `${fieldList},${relationQueries.join(',')}`;
    }

    return fieldList;
  }

  private isRelationshipFilter(column: string): boolean {
    return !!column && column.includes('.');
  }

  private parseRelationshipFilter(column: string): { relationship: string; field: string } {
    const [relationship, field] = column.split('.');
    return { relationship, field };
  }

  /**
   * Apply a single filter condition to the query
   */
  private applyFilterCondition(query: any, filter: QueryFilter): any {
    if (!filter.column || !filter.operator) {
      return query; // Skip incomplete filters
    }

    const { column, operator, value, customHandler, negateOperator } = filter;
    const formattedValue = (operator.includes('like') || negateOperator?.includes('like'))
      ? `%${value}%`
      : value;

    if (customHandler) {
      return query[customHandler](column, value);
    } else if (operator === 'not') {
      if (!negateOperator) throw new Error('negateOperator must be provided when using "not" operator');
      return query.not(column, negateOperator, formattedValue);
    } else if (operator === 'neq') {
      return query.neq(column, formattedValue);
    } else {
      return query[operator](column, formattedValue);
    }
  }

  /**
   * Apply a relationship filter condition to the query
   */
  private applyRelationshipFilterCondition(query: any, relationship: string, field: string, filter: QueryFilter): any {
    if (!filter.operator) {
      return query; // Skip incomplete filters
    }

    const { operator, value, negateOperator } = filter;
    const formattedValue = (operator.includes('like') || negateOperator?.includes('like'))
      ? `%${value}%`
      : value;

    if (operator === 'not') {
      if (!negateOperator) throw new Error('negateOperator must be provided when using "not" operator');
      return query.not(`${relationship}.${field}`, negateOperator, formattedValue);
    } else if (operator === 'neq') {
      return query.neq(`${relationship}.${field}`, formattedValue);
    } else {
      return query[operator](`${relationship}.${field}`, formattedValue);
    }
  }

  /**
   * Recursively apply filters supporting AND/OR logic
   */
  private applyFilters(query: any, filters?: QueryFilter[]): any {
    if (filters && filters.length > 0) {
      console.log('[QueryController] applyFilters', { filters });
    }
    if (!filters || filters.length === 0) return query;

    for (const filter of filters) {
      // Handle AND logic - applies all conditions in the array with AND logic
      if (filter.and && filter.and.length > 0) {
        // Create a new query with the AND conditions
        const andFilters = filter.and;
        andFilters.forEach(andFilter => {
          query = this.applyFilter(query, andFilter);
        });
      }

      // Handle OR logic - combines conditions with OR logic
      else if (filter.or && filter.or.length > 0) {
        // Process OR conditions separately first
        const orConditions: string[] = [];
        const orParams: any[] = [];

        filter.or.forEach(orFilter => {
          if (orFilter.column && orFilter.operator) {
            // Handle relationship filters in OR
            if (this.isRelationshipFilter(orFilter.column)) {
              const { relationship, field } = this.parseRelationshipFilter(orFilter.column);
              const formattedValue = (orFilter.operator.includes('like') || orFilter.negateOperator?.includes('like'))
                ? `%${orFilter.value}%`
                : orFilter.value;

              if (orFilter.operator === 'not') {
                if (!orFilter.negateOperator) throw new Error('negateOperator must be provided when using "not" operator');
                orConditions.push(`${relationship}.${field}.not.${orFilter.negateOperator}.${this.formatValueForOrClause(formattedValue)}`);
              } else if (orFilter.operator === 'neq') {
                orConditions.push(`${relationship}.${field}.neq.${this.formatValueForOrClause(formattedValue)}`);
              } else {
                orConditions.push(`${relationship}.${field}.${orFilter.operator}.${this.formatValueForOrClause(formattedValue)}`);
              }
            }
            // Handle regular filters in OR
            else {
              const formattedValue = (orFilter.operator.includes('like') || orFilter.negateOperator?.includes('like'))
                ? `%${orFilter.value}%`
                : orFilter.value;

              if (orFilter.operator === 'not') {
                if (!orFilter.negateOperator) throw new Error('negateOperator must be provided when using "not" operator');
                orConditions.push(`${orFilter.column}.not.${orFilter.negateOperator}.${this.formatValueForOrClause(formattedValue)}`);
              } else if (orFilter.operator === 'neq') {
                orConditions.push(`${orFilter.column}.neq.${this.formatValueForOrClause(formattedValue)}`);
              } else {
                orConditions.push(`${orFilter.column}.${orFilter.operator}.${this.formatValueForOrClause(formattedValue)}`);
              }
            }
          }
          // Handle nested AND inside OR
          else if (orFilter.and && orFilter.and.length > 0) {
            // Create a temporary query to build the AND condition
            const tempQuery = this.client.from(this.tableName);
            const andQuery = this.applyFilters(tempQuery, orFilter.and);
            // Extract the filter string from the temp query and add it to OR conditions
            // Note: This is an approximation - actual implementation would depend on Supabase's API
            orConditions.push(`(${this.extractFilterString(andQuery)})`);
          }
          // Handle nested OR inside OR
          else if (orFilter.or && orFilter.or.length > 0) {
            // Create a temporary query to build the nested OR condition
            const tempQuery = this.client.from(this.tableName);
            const nestedOrQuery = this.applyFilters(tempQuery, [orFilter]);
            // Extract the filter string from the temp query and add it to OR conditions
            orConditions.push(`(${this.extractFilterString(nestedOrQuery)})`);
          }
        });

        // Apply the combined OR conditions to the query
        if (orConditions.length > 0) {
          query = query.or(orConditions.join(','));
        }
      }

      // Handle simple filters (not AND/OR)
      else {
        query = this.applyFilter(query, filter);
      }
    }

    return query;
  }

  /**
   * Helper method to format values for OR clauses properly
   */
  private formatValueForOrClause(value: any): string {
    if (typeof value === 'string') {
      // Handle strings (wrap in quotes)
      return `"${value.replace(/"/g, '\\"')}"`;
    } else if (value === null) {
      // Handle null
      return 'null';
    } else if (Array.isArray(value)) {
      // Handle arrays
      return `(${value.map(v => this.formatValueForOrClause(v)).join(',')})`;
    } else {
      // Handle other types
      return String(value);
    }
  }

  /**
   * Extract filter string from a query (for nested conditions)
   * Note: This is a placeholder - actual implementation would depend on Supabase's API
   */
  private extractFilterString(query: any): string {
    // This is a placeholder - in a real implementation,
    // you would need to extract the filter string from the Supabase query
    // This might require access to Supabase internals or a different approach
    return ''; // Placeholder
  }

  /**
   * Apply a single filter (direct or relationship)
   */
  private applyFilter(query: any, filter: QueryFilter): any {
    // Skip if this is a logical operator (and/or) filter
    if (filter.and || filter.or) {
      return query;
    }

    // Skip incomplete filters
    if (!filter.column || !filter.operator) {
      return query;
    }

    // Handle relationship filters
    if (this.isRelationshipFilter(filter.column)) {
      const { relationship, field } = this.parseRelationshipFilter(filter.column);
      return this.applyRelationshipFilterCondition(query, relationship, field, filter);
    }

    // Handle direct filters
    return this.applyFilterCondition(query, filter);
  }

  private applySorting(query: any, sorts?: QuerySort[]): any {
    if (!sorts || sorts.length === 0) {
      return query.order(this.primaryKey as string, { ascending: true });
    }

    sorts.forEach(sort => {
      // Check if this is a relationship sort
      if (this.isRelationshipFilter(sort.column)) {
        // Parse the relationship and field
        const { relationship, field } = this.parseRelationshipFilter(sort.column);
        // Apply sorting using foreignTable parameter
        query = query.order(field, { ascending: sort.direction === 'asc', foreignTable: relationship });
      } else {
        // Regular column sort
        query = query.order(sort.column, { ascending: sort.direction === 'asc' });
      }
    });

    return query;
  }

  private applySearch(query: any, searchTerm?: string, searchColumns?: string[]): any {
    if (!searchTerm || !searchColumns || searchColumns.length === 0) return query;

    const searchTermFormatted = `%${searchTerm}%`;

    // Create an array of filter objects for each search column
    const searchFilters = searchColumns.map(column => {
      // Handle relationship columns (containing dots)
      if (this.isRelationshipFilter(column)) {
        const { relationship, field } = this.parseRelationshipFilter(column);
        return `${relationship}.${field}.ilike.${searchTermFormatted}`;
      }
      // Handle regular columns
      return `${column}.ilike.${searchTermFormatted}`;
    });

    // Join all conditions with commas for the OR query
    const orCondition = searchFilters.join(',');

    // Apply the OR filter with proper syntax
    return query.or(orCondition);
  }

  async getPaginatedData(params: PaginationParams): Promise<PaginatedResult<WithRelations<T, Map>>> {
    console.log('[QueryController] getPaginatedData called', { table: this.tableName, params });

    const {
      pageSize,
      cursor,
      offset,
      filters,
      sorts,
      searchTerm,
      searchColumns
    } = params;

    const sortColumn = sorts?.[0]?.column || (this.primaryKey as string);
    const sortDirection = sorts?.[0]?.direction || 'asc';
    const selectQuery = this.buildSelectQuery();

    let query = this.client
      .from(this.tableName)
      .select(selectQuery, { count: 'exact' });

    query = this.applyFilters(query, filters);
    query = this.applySearch(query, searchTerm, searchColumns);

    console.log('[QueryController] getPaginatedData query before pagination', {
      filters,
      sorts,
      searchTerm,
      searchColumns,
      selectQuery,
      paginationMode: offset !== undefined ? "offset" : "cursor"
    });

    const { count } = await query;

    // 🚨 Apply pagination
    if (offset !== undefined) {
      // Offset-based pagination
      query = this.applySorting(query, sorts)
        .range(offset, offset + pageSize - 1);
    } else {
      // Cursor-based pagination
      if (cursor) {
        const { column, value } = cursor;
        query = sortDirection === 'asc'
          ? query.gt(column, value)
          : query.lt(column, value);
      }

      query = this.applySorting(query, sorts)
        .limit(pageSize);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[QueryController] getPaginatedData error', error);
      throw error;
    }

    const nextCursor = data && data.length === pageSize
      ? {
        column: sortColumn,
        value: (data[data.length - 1] as any)[sortColumn]
      }
      : null;

    const prevCursor = data && data.length > 0
      ? {
        column: sortColumn,
        value: (data[0] as any)[sortColumn]
      }
      : null;

    return {
      data: data as any,
      nextCursor,
      prevCursor,
      count
    };
  }


  async getById(
    id: TableRow<T>[typeof this.primaryKey]
  ): Promise<WithRelations<T, Map> | null> {
    console.log('[QueryController] getById called', { table: this.tableName, id });
    const selectQuery = this.buildSelectQuery();
    const { data, error } = await this.client
      .from(this.tableName)
      .select(selectQuery)
      .eq(this.primaryKey as string, id as any)
      .single();
    if (error) {
      console.error('[QueryController] getById error', error);
      throw error;
    }
    console.log('[QueryController] getById result', { data });
    return data as any;
  }

  async findOneByFilter(
    params: SingleQueryParams = {}
  ): Promise<WithRelations<T, Map> | null> {
    console.log('[QueryController] findOneByFilter called', { table: this.tableName, params });
    const { filters, sorts, searchTerm, searchColumns } = params;
    const selectQuery = this.buildSelectQuery();
    let query = this.client.from(this.tableName).select(selectQuery);

    query = this.applyFilters(query, filters);
    query = this.applySearch(query, searchTerm, searchColumns);
    query = this.applySorting(query, sorts).limit(1);

    const { data, error } = await query;
    if (error) {
      console.error('[QueryController] findOneByFilter error', error);
      throw error;
    }
    console.log('[QueryController] findOneByFilter result', { data });
    return data && data.length > 0 ? (data[0] as any) : null;
  }

  async create(
    record: Omit<TableInsert<T>, 'id' | 'created_at' | 'updated_at'>
  ): Promise<WithRelations<T, Map>> {
    console.log('[QueryController] create called', { table: this.tableName, record });
    const selectQuery = this.buildSelectQuery();
    const { data, error } = await this.client
      .from(this.tableName)
      .insert(record as any)
      .select(selectQuery)
      .single();
    if (error) {
      console.error('[QueryController] create error', error);
      throw error;
    }
    console.log('[QueryController] create result', { data });
    return data as any;
  }

  async update(
    id: TableRow<T>[typeof this.primaryKey],
    record: Partial<TableUpdate<T>>
  ): Promise<WithRelations<T, Map>> {
    console.log('[QueryController] update called', { table: this.tableName, id, record });
    const selectQuery = this.buildSelectQuery();
    const { data, error } = await this.client
      .from(this.tableName)
      .update(record as any)
      .eq(this.primaryKey as string, id as any)
      .select(selectQuery)
      .single();
    if (error) {
      console.error('[QueryController] update error', error);
      throw error;
    }
    console.log('[QueryController] update result', { data });
    return data as any;
  }

  async delete(
    id: TableRow<T>[typeof this.primaryKey]
  ): Promise<void> {
    console.log('[QueryController] delete called', { table: this.tableName, id });
    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq(this.primaryKey as string, id as any);
    if (error) {
      console.error('[QueryController] delete error', error);
      throw error;
    }
    console.log('[QueryController] delete success');
  }

  async deleteMany(filters?: QueryFilter[]): Promise<void> {
    console.log('[QueryController] deleteMany called', { table: this.tableName, filters });
    let query = this.client.from(this.tableName).delete();
    query = this.applyFilters(query, filters);

    const { error } = await query;
    if (error) {
      console.error('[QueryController] deleteMany error', error);
      throw error;
    }
    console.log('[QueryController] deleteMany success');
  }


  async getAll(options?: {
    filters?: QueryFilter[];
    sorts?: QuerySort[];
    limit?: number
  }): Promise<WithRelations<T, Map>[]> {
    console.log('[QueryController] getAll called', { table: this.tableName, options });
    const selectQuery = this.buildSelectQuery();
    let query = this.client.from(this.tableName).select(selectQuery);
    query = this.applyFilters(query, options?.filters);
    query = this.applySorting(query, options?.sorts);
    if (options?.limit) query = query.limit(options.limit);
    const { data, error } = await query;
    if (error) {
      console.error('[QueryController] getAll error', error);
      throw error;
    }
    console.log('[QueryController] getAll result', { dataLength: data?.length, data });
    return data as any;
  }

  async getCount(params: Omit<PaginationParams, 'pageSize' | 'cursor'> = {}): Promise<number> {
    console.log('[QueryController] getCount called', { table: this.tableName, params });
    const { filters, searchTerm, searchColumns } = params;

    let query = this.client.from(this.tableName).select('*', { count: 'exact', head: true });

    // Apply filters if provided
    query = this.applyFilters(query, filters);

    // Apply search if provided
    query = this.applySearch(query, searchTerm, searchColumns);

    const { count, error } = await query;

    if (error) {
      console.error('[QueryController] getCount error', error);
      throw error;
    }
    console.log('[QueryController] getCount result', { count });
    return count || 0;
  }
}