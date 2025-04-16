export * from './resources-controller';
export * from './disciplines-controller';
export * from './users-controller';
export * from './groups-controller';
export * from './classes-controller';
export * from './education-levels-controller';
export * from './domains-controller';
export * from './curricular-areas-controller';
export * from './discipline-class-controller';
export * from './general-competencies-controller';
export * from './specific-competencies-controller';
export * from './comments-controller';
export * from './resource-tags-controller';
export * from './resource-competencies-controller';
export * from './resource-evaluations-controller';
export * from './group-members-controller';
export * from './group-resources-controller';

// Re-export the base query controller types for convenience
export { 
  type QueryFilter,
  type QuerySort,
  type PaginationParams,
  type PaginatedResult,
  type SortDirection
} from '@/lib/query-controller';
