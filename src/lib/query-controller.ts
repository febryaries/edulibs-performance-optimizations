import { TypedSupabaseClient } from "@/utils/supabase-types";
import { Database } from "@/utils/database.types";
import { UseQueryResult } from "@tanstack/react-query";

export type SortDirection = "asc" | "desc";

export interface QueryFilter {
  column?: string;
  operator?:
    | "not"
    | "eq"
    | "neq"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "like"
    | "ilike"
    | "in"
    | "is";
  value?: any;
  customHandler?: string;
  negateOperator?: QueryFilter["operator"];

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
  offset?: number; // <-- New field for offset-based pagination
  filters?: QueryFilter[];
  sorts?: QuerySort[];
  searchTerm?: string;
  searchColumns?: string[];
  withCount?: boolean;
  disabled?: boolean; // <-- When true, request will return empty results without making API call
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: QueryCursor | null;
  prevCursor: QueryCursor | null;
  count: number | null;
}

export type TablesMap = Database["public"]["Tables"];
export type TableNames = keyof TablesMap;
export type TableRow<T extends TableNames> = TablesMap[T]["Row"];
export type TableInsert<T extends TableNames> = TablesMap[T]["Insert"];
export type TableUpdate<T extends TableNames> = TablesMap[T]["Update"];

// Get all relationships for a table
export type TableRelationships<T extends TableNames> =
  Database["public"]["Tables"][T]["Relationships"][number];

// Get foreign key names for a table
export type ForeignKeyNames<T extends TableNames> =
  TableRelationships<T>["foreignKeyName"];

// Get referenced relation names for a table
export type ReferencedRelationNames<T extends TableNames> =
  TableRelationships<T>["referencedRelation"];

// Add this helper type to extract the alias from a relationMap value
type ExtractAlias<V> = V extends string
  ? V
  : V extends { alias: string }
  ? V["alias"]
  : never;

// Update the RelationKey type to handle both string aliases and RelationMapConfig objects
export type RelationKey<
  FK extends string,
  Ref extends keyof Database["public"]["Tables"],
  Map extends Partial<Record<FK, string | RelationMapConfig<FK, any>>>
> = FK extends keyof Map ? ExtractAlias<Map[FK]> : FK;

export type ForeignKeyRelationMap<T extends TableNames> = {
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
> = TableRow<T> & {
  [K in keyof Map as Map[K] extends { alias: string }
    ? Map[K]["alias"]
    : never]?: Map[K] extends { isOneToMany: true }
    ? Map[K] extends { referencedTable: infer RT }
      ? RT extends TableNames
        ? TableRow<RT>[]
        : never
      : never
    : Map[K] extends { referencedTable: infer RT }
    ? RT extends TableNames
      ? TableRow<RT>
      : never
    : never;
};

export type UsePaginatedHook<
  T,
  C extends TableNames = any,
  M extends ForeignKeyRelationMap<C> = any
> = (
  params?: PaginationParams,
  controllerConfig?: {
    fields?: (keyof TableRow<C> | "*")[];
    relations?: M;
  }
) => UseQueryResult<PaginatedResult<T>, Error>;

export type GetPaginatedDataFn<
  T extends TableNames,
  Map extends ForeignKeyRelationMap<T> = {}
> = (
  params: PaginationParams
) => Promise<PaginatedResult<WithRelations<T, Map>>>;

// Get the referenced table for a foreign key
export type ReferencedTable<
  T extends TableNames,
  FK extends ForeignKeyNames<T>
> = Extract<
  Database["public"]["Tables"][T]["Relationships"][number],
  { foreignKeyName: FK }
>["referencedRelation"];

// This RelationMapConfig was duplicated - using the one with isOneToMany defined above

// Updated QueryConfig to work with the improved relationship mapping
export interface QueryConfig<
  T extends TableNames,
  Map extends ForeignKeyRelationMap<T> = {}
> {
  fields?: (keyof TableRow<T> | "*")[];
  relationMap?: Map;
}

export type SingleQueryParams = Omit<
  PaginationParams,
  "pageSize" | "cursor"
> & { sorts?: QuerySort[] };

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
    primaryKey: keyof TableRow<T> = "id" as keyof TableRow<T>
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
      relationMap: config.relationMap || ({} as Map),
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
    const fieldList = fields.join(",");

    // Build relationship list from the relationMap
    const relationQueries = Object.entries(relationMap).map(
      ([foreignKey, value]) => {
        // Handle both simple string aliases and full relation config objects
        let alias: string;
        let refTable: string;
        let nested: string | undefined;

        if (typeof value === "string") {
          alias = value;
          // Default to pluralized form of foreign key without '_id' suffix
          refTable = foreignKey.endsWith("_id")
            ? foreignKey.substring(0, foreignKey.length - 3) + "s" // e.g., 'user_id' -> 'users'
            : foreignKey;
        } else {
          alias = (value as RelationMapConfig<ForeignKeyNames<T>, any>).alias;
          refTable = (value as RelationMapConfig<ForeignKeyNames<T>, any>)
            .referencedTable;
          nested = (value as RelationMapConfig<ForeignKeyNames<T>, any>).nested;
        }

        // Use Supabase's proper join syntax:
        // alias:table!fk(field1,field2)
        // If nested is provided, include it in the select query
        // Example: specific_competencies:resource_competency!resource_competency_resource_id_fkey(*, competency:competencies(*))
        return `${alias}:${refTable}!${foreignKey}(${
          nested ? `*, ${nested}` : "*"
        })`;
      }
    );

    // Combine the main fields with relationship queries
    if (relationQueries.length > 0) {
      return `${fieldList},${relationQueries.join(",")}`;
    }

    return fieldList;
  }

  private isRelationshipFilter(column: string): boolean {
    return !!column && column.includes(".");
  }

  private parseRelationshipFilter(column: string): {
    relationship: string;
    field: string;
  } {
    const [relationship, field] = column.split(".");
    return { relationship, field };
  }

  /**
   * Apply a single filter condition to the query
   */
  private applyFilterCondition(query: any, filter: QueryFilter): any {
    console.log("[QueryController] applyFilterCondition", { query, filter });
    if (!filter.column || !filter.operator) {
      return query; // Skip incomplete filters
    }

    const { column, operator, value, customHandler, negateOperator } = filter;
    const formattedValue =
      operator.includes("like") || negateOperator?.includes("like")
        ? `%${value}%`
        : value;

    if (customHandler) {
      return query[customHandler](column, value);
    } else if (operator === "eq") {
      return query.eq(column, formattedValue);
    } else if (operator === "not") {
      if (!negateOperator)
        throw new Error(
          'negateOperator must be provided when using "not" operator'
        );
      return query.not(column, negateOperator, formattedValue);
    } else if (operator === "neq") {
      return query.neq(column, formattedValue);
    } else {
      return query[operator](column, formattedValue);
    }
  }

  /**
   * Apply a relationship filter condition to the query
   */
  private applyRelationshipFilterCondition(
    query: any,
    relationship: string,
    field: string,
    filter: QueryFilter
  ): any {
    if (!filter.operator) {
      return query; // Skip incomplete filters
    }

    const { operator, value, negateOperator } = filter;
    const formattedValue =
      operator.includes("like") || negateOperator?.includes("like")
        ? `%${value}%`
        : value;

    if (operator === "not") {
      if (!negateOperator)
        throw new Error(
          'negateOperator must be provided when using "not" operator'
        );
      return query.not(
        `${relationship}.${field}`,
        negateOperator,
        formattedValue
      );
    } else if (operator === "neq") {
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
      console.log("[QueryController] applyFilters", { filters });
    }
    if (!filters || filters.length === 0) return query;

    for (const filter of filters) {
      // Handle AND logic - applies all conditions in the array with AND logic
      if (filter.and && filter.and.length > 0) {
        filter.and.forEach((andFilter) => {
          // Recursively handle nested conditions within AND
          if (andFilter.and || andFilter.or) {
            query = this.applyFilters(query, [andFilter]);
          } else {
            query = this.applyFilter(query, andFilter);
          }
        });
      }
      // Handle OR logic - combines conditions with OR logic
      else if (filter.or && filter.or.length > 0) {
        const orConditions: string[] = [];

        filter.or.forEach((orFilter) => {
          // Handle simple column-based filters in OR
          if (orFilter.column && orFilter.operator) {
            const formattedValue =
              orFilter.operator.includes("like") ||
              orFilter.negateOperator?.includes("like")
                ? `%${orFilter.value}%`
                : orFilter.value;

            // Handle relationship filters in OR
            if (this.isRelationshipFilter(orFilter.column)) {
              const { relationship, field } = this.parseRelationshipFilter(
                orFilter.column
              );

              if (orFilter.operator === "not") {
                if (!orFilter.negateOperator)
                  throw new Error(
                    'negateOperator must be provided when using "not" operator'
                  );
                orConditions.push(
                  `${relationship}.${field}.not.${
                    orFilter.negateOperator
                  }.${this.formatValueForOrClause(formattedValue)}`
                );
              } else if (orFilter.operator === "neq") {
                orConditions.push(
                  `${relationship}.${field}.neq.${this.formatValueForOrClause(
                    formattedValue
                  )}`
                );
              } else if (orFilter.operator === "in") {
                // Special handling for 'in' operator with arrays
                if (Array.isArray(orFilter.value)) {
                  orConditions.push(
                    `${relationship}.${field}.in.(${orFilter.value
                      .map((v) => this.formatValueForOrClause(v))
                      .join(",")})`
                  );
                } else {
                  orConditions.push(
                    `${relationship}.${field}.in.${this.formatValueForOrClause(
                      formattedValue
                    )}`
                  );
                }
              } else {
                orConditions.push(
                  `${relationship}.${field}.${
                    orFilter.operator
                  }.${this.formatValueForOrClause(formattedValue)}`
                );
              }
            }
            // Handle regular filters in OR
            else {
              if (orFilter.operator === "not") {
                if (!orFilter.negateOperator)
                  throw new Error(
                    'negateOperator must be provided when using "not" operator'
                  );
                orConditions.push(
                  `${orFilter.column}.not.${
                    orFilter.negateOperator
                  }.${this.formatValueForOrClause(formattedValue)}`
                );
              } else if (orFilter.operator === "neq") {
                orConditions.push(
                  `${orFilter.column}.neq.${this.formatValueForOrClause(
                    formattedValue
                  )}`
                );
              } else if (orFilter.operator === "in") {
                // Special handling for 'in' operator with arrays
                if (Array.isArray(orFilter.value)) {
                  orConditions.push(
                    `${orFilter.column}.in.(${orFilter.value
                      .map((v) => this.formatValueForOrClause(v))
                      .join(",")})`
                  );
                } else {
                  orConditions.push(
                    `${orFilter.column}.in.${this.formatValueForOrClause(
                      formattedValue
                    )}`
                  );
                }
              } else {
                orConditions.push(
                  `${orFilter.column}.${
                    orFilter.operator
                  }.${this.formatValueForOrClause(formattedValue)}`
                );
              }
            }
          }
          // Handle nested AND inside OR by converting to string format
          else if (orFilter.and && orFilter.and.length > 0) {
            const nestedAndConditions: string[] = [];

            orFilter.and.forEach((andFilter) => {
              if (andFilter.column && andFilter.operator) {
                const formattedValue =
                  andFilter.operator.includes("like") ||
                  andFilter.negateOperator?.includes("like")
                    ? `%${andFilter.value}%`
                    : andFilter.value;

                // Handle relationship filters in nested AND
                if (this.isRelationshipFilter(andFilter.column)) {
                  const { relationship, field } = this.parseRelationshipFilter(
                    andFilter.column
                  );

                  if (andFilter.operator === "not") {
                    if (!andFilter.negateOperator)
                      throw new Error(
                        'negateOperator must be provided when using "not" operator'
                      );
                    nestedAndConditions.push(
                      `${relationship}.${field}.not.${
                        andFilter.negateOperator
                      }.${this.formatValueForOrClause(formattedValue)}`
                    );
                  } else if (andFilter.operator === "neq") {
                    nestedAndConditions.push(
                      `${relationship}.${field}.neq.${this.formatValueForOrClause(
                        formattedValue
                      )}`
                    );
                  } else if (andFilter.operator === "in") {
                    // Handle 'in' operator with arrays
                    if (Array.isArray(andFilter.value)) {
                      nestedAndConditions.push(
                        `${relationship}.${field}.in.(${andFilter.value
                          .map((v) => this.formatValueForOrClause(v))
                          .join(",")})`
                      );
                    } else {
                      nestedAndConditions.push(
                        `${relationship}.${field}.in.${this.formatValueForOrClause(
                          formattedValue
                        )}`
                      );
                    }
                  } else {
                    nestedAndConditions.push(
                      `${relationship}.${field}.${
                        andFilter.operator
                      }.${this.formatValueForOrClause(formattedValue)}`
                    );
                  }
                }
                // Handle regular filters in nested AND
                else {
                  if (andFilter.operator === "not") {
                    if (!andFilter.negateOperator)
                      throw new Error(
                        'negateOperator must be provided when using "not" operator'
                      );
                    nestedAndConditions.push(
                      `${andFilter.column}.not.${
                        andFilter.negateOperator
                      }.${this.formatValueForOrClause(formattedValue)}`
                    );
                  } else if (andFilter.operator === "neq") {
                    nestedAndConditions.push(
                      `${andFilter.column}.neq.${this.formatValueForOrClause(
                        formattedValue
                      )}`
                    );
                  } else if (andFilter.operator === "in") {
                    // Handle 'in' operator with arrays
                    if (Array.isArray(andFilter.value)) {
                      nestedAndConditions.push(
                        `${andFilter.column}.in.(${andFilter.value
                          .map((v) => this.formatValueForOrClause(v))
                          .join(",")})`
                      );
                    } else {
                      nestedAndConditions.push(
                        `${andFilter.column}.in.${this.formatValueForOrClause(
                          formattedValue
                        )}`
                      );
                    }
                  } else {
                    nestedAndConditions.push(
                      `${andFilter.column}.${
                        andFilter.operator
                      }.${this.formatValueForOrClause(formattedValue)}`
                    );
                  }
                }
              }
            });

            if (nestedAndConditions.length > 0) {
              // Combine all AND conditions with commas and wrap in parentheses
              orConditions.push(`and(${nestedAndConditions.join(",")})`);
            }
          }
          // Handle nested OR inside OR
          else if (orFilter.or && orFilter.or.length > 0) {
            // Recursively process nested OR and add it as a single condition
            const nestedOrConditions: string[] = [];

            this.buildOrConditionsArray(orFilter.or, nestedOrConditions);

            if (nestedOrConditions.length > 0) {
              // We already have OR conditions, so wrap them in parentheses
              orConditions.push(`or(${nestedOrConditions.join(",")})`);
            }
          }
        });

        // Apply the combined OR conditions to the query
        if (orConditions.length > 0) {
          query = query.or(orConditions.join(","));
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
   * Helper method to build an array of OR conditions
   * This is used for handling nested OR conditions
   */
  private buildOrConditionsArray(
    orFilters: QueryFilter[],
    conditions: string[]
  ): void {
    orFilters.forEach((filter) => {
      if (filter.column && filter.operator) {
        const formattedValue =
          filter.operator.includes("like") ||
          filter.negateOperator?.includes("like")
            ? `%${filter.value}%`
            : filter.value;

        // Handle relationship filters
        if (this.isRelationshipFilter(filter.column)) {
          const { relationship, field } = this.parseRelationshipFilter(
            filter.column
          );

          if (filter.operator === "not") {
            if (!filter.negateOperator)
              throw new Error(
                'negateOperator must be provided when using "not" operator'
              );
            conditions.push(
              `${relationship}.${field}.not.${
                filter.negateOperator
              }.${this.formatValueForOrClause(formattedValue)}`
            );
          } else if (filter.operator === "neq") {
            conditions.push(
              `${relationship}.${field}.neq.${this.formatValueForOrClause(
                formattedValue
              )}`
            );
          } else if (filter.operator === "in") {
            // Special handling for 'in' operator with arrays
            if (Array.isArray(filter.value)) {
              conditions.push(
                `${relationship}.${field}.in.(${filter.value
                  .map((v) => this.formatValueForOrClause(v))
                  .join(",")})`
              );
            } else {
              conditions.push(
                `${relationship}.${field}.in.${this.formatValueForOrClause(
                  formattedValue
                )}`
              );
            }
          } else {
            conditions.push(
              `${relationship}.${field}.${
                filter.operator
              }.${this.formatValueForOrClause(formattedValue)}`
            );
          }
        }
        // Handle regular filters
        else {
          if (filter.operator === "not") {
            if (!filter.negateOperator)
              throw new Error(
                'negateOperator must be provided when using "not" operator'
              );
            conditions.push(
              `${filter.column}.not.${
                filter.negateOperator
              }.${this.formatValueForOrClause(formattedValue)}`
            );
          } else if (filter.operator === "neq") {
            conditions.push(
              `${filter.column}.neq.${this.formatValueForOrClause(
                formattedValue
              )}`
            );
          } else if (filter.operator === "in") {
            // Special handling for 'in' operator with arrays
            if (Array.isArray(filter.value)) {
              conditions.push(
                `${filter.column}.in.(${filter.value
                  .map((v) => this.formatValueForOrClause(v))
                  .join(",")})`
              );
            } else {
              conditions.push(
                `${filter.column}.in.${this.formatValueForOrClause(
                  formattedValue
                )}`
              );
            }
          } else {
            conditions.push(
              `${filter.column}.${
                filter.operator
              }.${this.formatValueForOrClause(formattedValue)}`
            );
          }
        }
      }
      // Handle AND inside OR
      else if (filter.and && filter.and.length > 0) {
        const nestedAndConditions: string[] = [];

        filter.and.forEach((andFilter) => {
          if (andFilter.column && andFilter.operator) {
            const formattedValue =
              andFilter.operator.includes("like") ||
              andFilter.negateOperator?.includes("like")
                ? `%${andFilter.value}%`
                : andFilter.value;

            // Handle relationship filters in nested AND
            if (this.isRelationshipFilter(andFilter.column)) {
              const { relationship, field } = this.parseRelationshipFilter(
                andFilter.column
              );

              if (andFilter.operator === "not") {
                if (!andFilter.negateOperator)
                  throw new Error(
                    'negateOperator must be provided when using "not" operator'
                  );
                nestedAndConditions.push(
                  `${relationship}.${field}.not.${
                    andFilter.negateOperator
                  }.${this.formatValueForOrClause(formattedValue)}`
                );
              } else if (andFilter.operator === "neq") {
                nestedAndConditions.push(
                  `${relationship}.${field}.neq.${this.formatValueForOrClause(
                    formattedValue
                  )}`
                );
              } else if (andFilter.operator === "in") {
                // Handle 'in' operator with arrays
                if (Array.isArray(andFilter.value)) {
                  nestedAndConditions.push(
                    `${relationship}.${field}.in.(${andFilter.value
                      .map((v) => this.formatValueForOrClause(v))
                      .join(",")})`
                  );
                } else {
                  nestedAndConditions.push(
                    `${relationship}.${field}.in.${this.formatValueForOrClause(
                      formattedValue
                    )}`
                  );
                }
              } else {
                nestedAndConditions.push(
                  `${relationship}.${field}.${
                    andFilter.operator
                  }.${this.formatValueForOrClause(formattedValue)}`
                );
              }
            }
            // Handle regular filters in nested AND
            else {
              if (andFilter.operator === "not") {
                if (!andFilter.negateOperator)
                  throw new Error(
                    'negateOperator must be provided when using "not" operator'
                  );
                nestedAndConditions.push(
                  `${andFilter.column}.not.${
                    andFilter.negateOperator
                  }.${this.formatValueForOrClause(formattedValue)}`
                );
              } else if (andFilter.operator === "neq") {
                nestedAndConditions.push(
                  `${andFilter.column}.neq.${this.formatValueForOrClause(
                    formattedValue
                  )}`
                );
              } else if (andFilter.operator === "in") {
                // Handle 'in' operator with arrays
                if (Array.isArray(andFilter.value)) {
                  nestedAndConditions.push(
                    `${andFilter.column}.in.(${andFilter.value
                      .map((v) => this.formatValueForOrClause(v))
                      .join(",")})`
                  );
                } else {
                  nestedAndConditions.push(
                    `${andFilter.column}.in.${this.formatValueForOrClause(
                      formattedValue
                    )}`
                  );
                }
              } else {
                nestedAndConditions.push(
                  `${andFilter.column}.${
                    andFilter.operator
                  }.${this.formatValueForOrClause(formattedValue)}`
                );
              }
            }
          }
        });

        if (nestedAndConditions.length > 0) {
          // Combine all AND conditions with commas and wrap in parentheses
          conditions.push(`and(${nestedAndConditions.join(",")})`);
        }
      }
      // Handle nested OR inside OR
      else if (filter.or && filter.or.length > 0) {
        const nestedOrConditions: string[] = [];

        // Recursively process nested OR
        this.buildOrConditionsArray(filter.or, nestedOrConditions);

        if (nestedOrConditions.length > 0) {
          // We already have OR conditions, so wrap them in parentheses
          conditions.push(`or(${nestedOrConditions.join(",")})`);
        }
      }
    });
  }

  /**
   * Helper method to format values for OR clauses properly
   */
  private formatValueForOrClause(value: any): string {
    if (typeof value === "string") {
      // Handle strings (wrap in quotes)
      return `"${value.replace(/"/g, '\\"')}"`;
    } else if (value === null) {
      // Handle null
      return "null";
    } else if (Array.isArray(value)) {
      // Handle arrays
      return `(${value.map((v) => this.formatValueForOrClause(v)).join(",")})`;
    } else {
      // Handle other types
      return String(value);
    }
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
      const { relationship, field } = this.parseRelationshipFilter(
        filter.column
      );
      return this.applyRelationshipFilterCondition(
        query,
        relationship,
        field,
        filter
      );
    }

    // Handle direct filters
    return this.applyFilterCondition(query, filter);
  }

  private applySorting(query: any, sorts?: QuerySort[]): any {
    if (!sorts || sorts.length === 0) {
      return query.order(this.primaryKey as string, { ascending: true });
    }

    sorts.forEach((sort) => {
      // Check if this is a relationship sort
      if (this.isRelationshipFilter(sort.column)) {
        // Parse the relationship and field
        const { relationship, field } = this.parseRelationshipFilter(
          sort.column
        );
        // Apply sorting using foreignTable parameter
        query = query.order(field, {
          ascending: sort.direction === "asc",
          foreignTable: relationship,
        });
      } else {
        // Regular column sort
        query = query.order(sort.column, {
          ascending: sort.direction === "asc",
        });
      }
    });

    return query;
  }

  private applySearch(
    query: any,
    searchTerm?: string,
    searchColumns?: string[]
  ): any {
    if (!searchTerm || !searchColumns || searchColumns.length === 0)
      return query;

    const searchTermFormatted = `%${searchTerm}%`;

    // Create an array of filter objects for each search column
    const searchFilters = searchColumns.map((column) => {
      // Handle relationship columns (containing dots)
      if (this.isRelationshipFilter(column)) {
        const { relationship, field } = this.parseRelationshipFilter(column);
        return `${relationship}.${field}.ilike.${searchTermFormatted}`;
      }
      // Handle regular columns
      return `${column}.ilike.${searchTermFormatted}`;
    });

    // Join all conditions with commas for the OR query
    const orCondition = searchFilters.join(",");

    // Apply the OR filter with proper syntax
    return query.or(orCondition);
  }

  async getPaginatedData(
    params: PaginationParams
  ): Promise<PaginatedResult<WithRelations<T, Map>>> {
    console.log("[QueryController] getPaginatedData called", {
      table: this.tableName,
      params,
    });

    const {
      pageSize,
      cursor,
      offset,
      filters,
      sorts,
      searchTerm,
      searchColumns,
      withCount,
      disabled,
    } = params;

    if (disabled) {
      return {
        data: [],
        nextCursor: null,
        prevCursor: null,
        count: null,
      };
    }

    const sortColumn = sorts?.[0]?.column || (this.primaryKey as string);
    const sortDirection = sorts?.[0]?.direction || "asc";
    const selectQuery = this.buildSelectQuery();

    // Base queries with filters and search applied
    let baseDataQuery = this.client.from(this.tableName).select(selectQuery);
    baseDataQuery = this.applyFilters(baseDataQuery, filters);
    baseDataQuery = this.applySearch(baseDataQuery, searchTerm, searchColumns);

    let baseCountQuery: ReturnType<typeof this.client.from> | null = null;
    if (withCount) {
      baseCountQuery = this.client
        .from(this.tableName)
        // Use '*' for count queries with head:true to avoid 500 errors
        .select("*", { count: "exact", head: true });
      baseCountQuery = this.applyFilters(baseCountQuery, filters);
      baseCountQuery = this.applySearch(
        baseCountQuery,
        searchTerm,
        searchColumns
      );
    }

    console.log("[QueryController] getPaginatedData query before pagination", {
      filters,
      sorts,
      searchTerm,
      searchColumns,
      selectQuery,
      paginationMode: offset !== undefined ? "offset" : "cursor",
    });

    // Pagination on data query
    if (offset !== undefined) {
      baseDataQuery = this.applySorting(baseDataQuery, sorts).range(
        offset,
        offset + pageSize - 1
      );
    } else {
      if (cursor) {
        const { column, value } = cursor;
        baseDataQuery =
          sortDirection === "asc"
            ? baseDataQuery.gt(column, value)
            : baseDataQuery.lt(column, value);
      }

      baseDataQuery = this.applySorting(baseDataQuery, sorts).limit(pageSize);
    }

    let dataPromise = baseDataQuery;
    let countPromise = withCount && baseCountQuery ? baseCountQuery : null;

    const [dataResult, countResult] = await Promise.all([
      dataPromise,
      countPromise ?? Promise.resolve({ count: null }),
    ]);

    const { data, error } = dataResult;
    const { count, error: countError } = countResult as any;

    if (error) {
      console.error(
        "[QueryController] getPaginatedData error",
        {
          table: this.tableName,
          selectQuery,
          params: {
            pageSize,
            cursor,
            offset,
            filters,
            sorts,
            searchTerm,
            searchColumns,
            withCount,
          },
          sort: { column: sortColumn, direction: sortDirection },
        },
        error
      );
      throw error;
    }

    if (countError) {
      console.warn(
        "[QueryController] getPaginatedData count error (ignored)",
        {
          table: this.tableName,
          selectQuery: this.primaryKey.toString(),
          params: {
            filters,
            searchTerm,
            searchColumns,
            withCount,
          },
        },
        countError
      );
      // Do not fail the whole request if count fails; just omit count
    }

    const nextCursor =
      data && data.length === pageSize
        ? {
            column: sortColumn,
            value: (data[data.length - 1] as any)[sortColumn],
          }
        : null;

    const prevCursor =
      data && data.length > 0
        ? {
            column: sortColumn,
            value: (data[0] as any)[sortColumn],
          }
        : null;

    return {
      data: data as any,
      nextCursor,
      prevCursor,
      count: count ?? null,
    };
  }

  async getById(
    id: TableRow<T>[typeof this.primaryKey]
  ): Promise<WithRelations<T, Map> | null> {
    console.log("[QueryController] getById called", {
      table: this.tableName,
      id,
    });
    const selectQuery = this.buildSelectQuery();
    const { data, error } = await this.client
      .from(this.tableName)
      .select(selectQuery)
      .eq(this.primaryKey as string, id as any)
      .single();
    if (error) {
      console.error("[QueryController] getById error", error);
      throw error;
    }
    console.log("[QueryController] getById result", { data });
    return data as any;
  }

  async findOneByFilter(
    params: SingleQueryParams = {}
  ): Promise<WithRelations<T, Map> | null> {
    console.log("[QueryController] findOneByFilter called", {
      table: this.tableName,
      params,
    });
    const { filters, sorts, searchTerm, searchColumns } = params;
    const selectQuery = this.buildSelectQuery();
    let query = this.client.from(this.tableName).select(selectQuery);

    query = this.applyFilters(query, filters);
    query = this.applySearch(query, searchTerm, searchColumns);
    query = this.applySorting(query, sorts).limit(1);

    const { data, error } = await query;
    if (error) {
      console.error("[QueryController] findOneByFilter error", error);
      throw error;
    }
    console.log("[QueryController] findOneByFilter result", { data });
    return data && data.length > 0 ? (data[0] as any) : null;
  }

  async create(
    record: Omit<TableInsert<T>, "id" | "created_at" | "updated_at">
  ): Promise<WithRelations<T, Map>> {
    console.log("[QueryController] create called", {
      table: this.tableName,
      record,
    });
    const selectQuery = this.buildSelectQuery();
    const { data, error } = await this.client
      .from(this.tableName)
      .insert(record as any)
      .select(selectQuery)
      .single();
    if (error) {
      console.error("[QueryController] create error", error);
      throw error;
    }
    console.log("[QueryController] create result", { data });
    return data as any;
  }

  async update(
    id: TableRow<T>[typeof this.primaryKey],
    record: Partial<TableUpdate<T>>
  ): Promise<WithRelations<T, Map>> {
    console.log("[QueryController] update called", {
      table: this.tableName,
      id,
      record,
    });
    const selectQuery = this.buildSelectQuery();
    const { data, error } = await this.client
      .from(this.tableName)
      .update(record as any)
      .eq(this.primaryKey as string, id as any)
      .select(selectQuery)
      .single();
    if (error) {
      console.error("[QueryController] update error", error);
      throw error;
    }
    console.log("[QueryController] update result", { data });
    return data as any;
  }

  async delete(id: TableRow<T>[typeof this.primaryKey]): Promise<void> {
    console.log("[QueryController] delete called", {
      table: this.tableName,
      id,
    });
    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq(this.primaryKey as string, id as any);
    if (error) {
      console.error("[QueryController] delete error", error);
      throw error;
    }
    console.log("[QueryController] delete success");
  }

  async deleteMany(filters?: QueryFilter[]): Promise<void> {
    console.log("[QueryController] deleteMany called", {
      table: this.tableName,
      filters,
    });
    let query = this.client.from(this.tableName).delete();
    query = this.applyFilters(query, filters);

    const { error } = await query;
    if (error) {
      console.error("[QueryController] deleteMany error", error);
      throw error;
    }
    console.log("[QueryController] deleteMany success");
  }

  async getAll(options?: {
    filters?: QueryFilter[];
    sorts?: QuerySort[];
    limit?: number;
  }): Promise<WithRelations<T, Map>[]> {
    console.log("[QueryController] getAll called", {
      table: this.tableName,
      options,
    });
    const selectQuery = this.buildSelectQuery();
    let query = this.client.from(this.tableName).select(selectQuery);
    query = this.applyFilters(query, options?.filters);
    query = this.applySorting(query, options?.sorts);
    if (options?.limit) query = query.limit(options.limit);
    const { data, error } = await query;
    if (error) {
      console.error("[QueryController] getAll error", error);
      throw error;
    }
    console.log("[QueryController] getAll result", {
      dataLength: data?.length,
      data,
    });
    return data as any;
  }

  async getCount(
    params: Omit<PaginationParams, "pageSize" | "cursor"> = {}
  ): Promise<number> {
    console.log("[QueryController] getCount called", {
      table: this.tableName,
      params,
    });
    const { filters, searchTerm, searchColumns } = params;

    // Use '*' for count queries with head:true to avoid 500 errors
    let query = this.client
      .from(this.tableName)
      .select("*", { count: "exact", head: true });

    // Apply filters if provided
    query = this.applyFilters(query, filters);

    // Apply search if provided
    query = this.applySearch(query, searchTerm, searchColumns);

    const { count, error } = await query;

    if (error) {
      console.warn("[QueryController] getCount error (ignored)", {
        table: this.tableName,
        error: error.message,
        params: { filters, searchTerm, searchColumns },
      });
      // Avoid failing the UI due to count timeouts under RLS; return 0 as a safe fallback
      return 0;
    }
    console.log("[QueryController] getCount result", { count });
    return count || 0;
  }

  /**
   * Creates a new instance of the controller with custom fields and/or relationMap
   * This allows for one-off queries with specific field/relation configurations
   * while keeping the original controller configuration intact
   */
  withCustomConfig<
    NewMap extends ForeignKeyRelationMap<T> = Map
  >(customConfig: {
    fields?: (keyof TableRow<T> | "*")[];
    relationMap?: NewMap;
  }): QueryController<T, NewMap> {
    // Create new config by merging the current config with custom overrides
    const newConfig: QueryConfig<T, NewMap> = {
      fields: customConfig.fields || this.config.fields,
      relationMap:
        customConfig.relationMap ||
        (this.config.relationMap as unknown as NewMap),
    };

    // Create a new controller instance with the custom config
    return new QueryController<T, NewMap>(
      this.client,
      this.tableName,
      newConfig,
      this.primaryKey
    );
  }
}
