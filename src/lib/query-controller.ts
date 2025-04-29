import { TypedSupabaseClient } from '@/utils/supabase-types';
import { Database } from '@/utils/database.types';
import { UseQueryResult } from '@tanstack/react-query';

export type SortDirection = 'asc' | 'desc';

export interface QueryFilter {
  column: string;
  operator: 'not' | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is';
  value: any;
  customHandler?: string; 
  negateOperator?: QueryFilter['operator'];
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

// Update the WithRelations type to use the improved RelationKey
export type WithRelations<
  T extends TableNames,
  Map extends ForeignKeyRelationMap<T> = {}
> = Database['public']['Tables'][T] extends {
  Row: infer RowType;
  Relationships: readonly {
    foreignKeyName: infer FK extends string;
    referencedRelation: infer Ref extends keyof Database['public']['Tables'];
  }[];
}
  ? RowType & {
    [R in Database['public']['Tables'][T]['Relationships'][number]as RelationKey<
      R['foreignKeyName'],
      R['referencedRelation'],
      Map
    >]: R['referencedRelation'] extends keyof Database['public']['Tables']
    ? Database['public']['Tables'][R['referencedRelation']] extends { Row: infer RelatedRow }
    ? RelatedRow | undefined
    : undefined
    : undefined;
  }
  : never;



export type UsePaginatedHook<T> = (params?: PaginationParams) => UseQueryResult<PaginatedResult<T>, Error>;

// Get the referenced table for a foreign key
export type ReferencedTable<
  T extends TableNames,
  FK extends ForeignKeyNames<T>
> = Extract<
  Database['public']['Tables'][T]['Relationships'][number],
  { foreignKeyName: FK }
>['referencedRelation'];

// Relationship configuration that includes both the alias and referenced table
export interface RelationMapConfig<
  FK extends string = string,
  RefTable extends keyof Database['public']['Tables'] = keyof Database['public']['Tables']
> {
  alias: string;
  referencedTable: RefTable;
}

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

      if (typeof value === 'string') {
        alias = value;
        // Default to pluralized form of foreign key without '_id' suffix
        refTable = foreignKey.endsWith('_id')
          ? foreignKey.substring(0, foreignKey.length - 3) + 's'  // e.g., 'user_id' -> 'users'
          : foreignKey;
      } else {
        alias = (value as RelationMapConfig<ForeignKeyNames<T>, any>).alias;
        refTable = (value as RelationMapConfig<ForeignKeyNames<T>, any>).referencedTable;
      }

      // Use Supabase's proper join syntax:
      // alias:table!fk(field1,field2)
      return `${alias}:${refTable}!${foreignKey}(*)`;
    });

    // Combine the main fields with relationship queries
    if (relationQueries.length > 0) {
      return `${fieldList},${relationQueries.join(',')}`;
    }

    return fieldList;
  }

  private isRelationshipFilter(column: string): boolean {
    return column.includes('.');
  }

  private parseRelationshipFilter(column: string): { relationship: string; field: string } {
    const [relationship, field] = column.split('.');
    return { relationship, field };
  }

  private applyFilters(query: any, filters?: QueryFilter[]): any {
    if (!filters || filters.length === 0) return query;
  
    const directFilters: QueryFilter[] = [];
    const relationshipFilters: (QueryFilter & { relationship: string; field: string })[] = [];
  
    filters.forEach(filter => {
      if (this.isRelationshipFilter(filter.column)) {
        const { relationship, field } = this.parseRelationshipFilter(filter.column);
        relationshipFilters.push({ ...filter, relationship, field });
      } else {
        directFilters.push(filter);
      }
    });
  
    // Apply direct filters
    directFilters.forEach(filter => {
      const { column, operator, value, customHandler, negateOperator } = filter;
      const formattedValue = (operator.includes('like') || negateOperator?.includes('like')) ? `%${value}%` : value;
      
      if (customHandler) {
        query = query[customHandler](column, value);
      } else if (operator === 'not') {
        if (!negateOperator) throw new Error('negateOperator must be provided when using "not" operator');
        query = query.not(column, negateOperator, formattedValue);
      } else if (operator === 'neq') {
        query = query.neq(column, formattedValue);
      } else {
        query = query[operator](column, formattedValue);
      }
    });
  
    // Apply relationship filters
    if (relationshipFilters.length > 0) {
      const relationshipFilterMap = relationshipFilters.reduce((acc, filter) => {
        if (!acc[filter.relationship]) {
          acc[filter.relationship] = [];
        }
        acc[filter.relationship].push(filter);
        return acc;
      }, {} as Record<string, typeof relationshipFilters>);
  
      Object.entries(relationshipFilterMap).forEach(([relationship, filters]) => {
        filters.forEach(filter => {
          const { field, operator, value, negateOperator } = filter;
          const formattedValue = (operator.includes('like') || negateOperator?.includes('like')) ? `%${value}%` : value;
          
          if (operator === 'not') {
            if (!negateOperator) throw new Error('negateOperator must be provided when using "not" operator');
            query = query.not(`${relationship}.${field}`, negateOperator, formattedValue);
          } else if (operator === 'neq') {
            query = query.neq(`${relationship}.${field}`, formattedValue);
          } else {
            query = query[operator](`${relationship}.${field}`, formattedValue);
          }
        });
      });
    }
  
    return query;
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
    query = query.or(searchColumns.map(column => `${column}.ilike.${searchTermFormatted}`).join(','));
    return query;
  }

  async getPaginatedData(params: PaginationParams): Promise<PaginatedResult<WithRelations<T, Map>>> {

    console.log(`[LOG] getPaginatedData ${this.tableName} ${JSON.stringify(params)}`)

    const { pageSize, cursor, filters, sorts, searchTerm, searchColumns } = params;
    const sortColumn = sorts?.[0]?.column || this.primaryKey as string;
    const sortDirection = sorts?.[0]?.direction || 'asc';
    const selectQuery = this.buildSelectQuery();
    let query = this.client.from(this.tableName).select(selectQuery, { count: 'exact' });
    query = this.applyFilters(query, filters);
    query = this.applySearch(query, searchTerm, searchColumns);
    const { count } = await query;
    if (cursor) {
      const { column, value } = cursor;
      query = sortDirection === 'asc' ? query.gt(column, value) : query.lt(column, value);
    }
    query = this.applySorting(query, sorts).limit(pageSize);
    const { data, error } = await query;
    if (error) throw error;
    const nextCursor =
      data && data.length === pageSize
        ? { column: sortColumn, value: (data[data.length - 1] as any)[sortColumn] }
        : null;
    return {
      data: data as any,
      nextCursor,
      prevCursor: null,
      count
    };
  }

  async getById(
    id: TableRow<T>[typeof this.primaryKey]
  ): Promise<WithRelations<T, Map> | null> {
    const selectQuery = this.buildSelectQuery();
    const { data, error } = await this.client
      .from(this.tableName)
      .select(selectQuery)
      .eq(this.primaryKey as string, id as any)
      .single();
    if (error) throw error;
    return data as any;
  }

  async findOneByFilter(
    params: SingleQueryParams = {}
  ): Promise<WithRelations<T, Map> | null> {
    const { filters, sorts, searchTerm, searchColumns } = params;
    const selectQuery = this.buildSelectQuery();
    let query = this.client.from(this.tableName).select(selectQuery);

    query = this.applyFilters(query, filters);
    query = this.applySearch(query, searchTerm, searchColumns);
    query = this.applySorting(query, sorts).limit(1);

    const { data, error } = await query;
    if (error) throw error;
    return data && data.length > 0 ? (data[0] as any) : null;
  }

  async create(
    record: Omit<TableInsert<T>, 'id' | 'created_at' | 'updated_at'>
  ): Promise<WithRelations<T, Map>> {
    const selectQuery = this.buildSelectQuery();
    const { data, error } = await this.client
      .from(this.tableName)
      .insert(record as any)
      .select(selectQuery)
      .single();
    if (error) throw error;
    return data as any;
  }

  async update(
    id: TableRow<T>[typeof this.primaryKey],
    record: Partial<TableUpdate<T>>
  ): Promise<WithRelations<T, Map>> {
    const selectQuery = this.buildSelectQuery();
    const { data, error } = await this.client
      .from(this.tableName)
      .update(record as any)
      .eq(this.primaryKey as string, id as any)
      .select(selectQuery)
      .single();
    if (error) throw error;
    return data as any;
  }

  async delete(
    id: TableRow<T>[typeof this.primaryKey]
  ): Promise<void> {
    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq(this.primaryKey as string, id as any);
    if (error) throw error;
  }

  async deleteMany(filters?: QueryFilter[]): Promise<void> {
    let query = this.client.from(this.tableName).delete();
    query = this.applyFilters(query, filters);

    const { error } = await query;
    if (error) throw error;
  }


  async getAll(options?: {
    filters?: QueryFilter[];
    sorts?: QuerySort[];
    limit?: number
  }): Promise<WithRelations<T, Map>[]> {
    const selectQuery = this.buildSelectQuery();
    let query = this.client.from(this.tableName).select(selectQuery);
    query = this.applyFilters(query, options?.filters);
    query = this.applySorting(query, options?.sorts);
    if (options?.limit) query = query.limit(options.limit);
    const { data, error } = await query;
    if (error) throw error;
    return data as any;
  }

  async getCount(params: Omit<PaginationParams, 'pageSize' | 'cursor'> = {}): Promise<number> {
    const { filters, searchTerm, searchColumns } = params;

    let query = this.client.from(this.tableName).select('*', { count: 'exact', head: true });

    // Apply filters if provided
    query = this.applyFilters(query, filters);

    // Apply search if provided
    query = this.applySearch(query, searchTerm, searchColumns);

    const { count, error } = await query;

    if (error) throw error;

    return count || 0;
  }

}