"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useResourceEvaluationsController } from './use-resource-evaluations-controller';
import { PaginationParams, UsePaginatedHook } from '@/lib/query-controller';
import type { Database } from '@/utils/database.types';
type ResourceEvaluationInsert = Omit<Database['public']['Tables']['resource_evaluations']['Insert'], 'status'> & { status: Database['public']['Enums']['evaluation_status'] };
type ResourceEvaluationUpdate = Omit<Database['public']['Tables']['resource_evaluations']['Update'], 'status'> & { status?: Database['public']['Enums']['evaluation_status'] };
import type { ResourceEvaluationWithRelations } from '@/queries/resource-evaluations-controller';

/**
 * Hook to fetch resource evaluations with pagination, filtering, and sorting
 */
export const useResourceEvaluations: UsePaginatedHook<ResourceEvaluationWithRelations> = (params?: PaginationParams) => {
  const resourceEvaluationsController = useResourceEvaluationsController();
  
  return useQuery({
    queryKey: ['resource-evaluations', params],
    queryFn: () => resourceEvaluationsController.getResourceEvaluations(params || { pageSize: 10 }),
    placeholderData: (previousData) => previousData,
  });
}


/**
 * Hook to fetch a single resource evaluation by ID
 */
export function useResourceEvaluationById(id: string) {
  const resourceEvaluationsController = useResourceEvaluationsController();
  
  return useQuery({
    queryKey: ['resource-evaluation', id],
    queryFn: () => resourceEvaluationsController.getResourceEvaluationById(id),
    enabled: !!id, // Only run the query if id is provided
  });
}

/**
 * Hook to fetch resource evaluations for a specific resource
 */
export function useResourceEvaluationsByResourceId(resourceId: string, params?: PaginationParams) {
  const resourceEvaluationsController = useResourceEvaluationsController();
  
  return useQuery({
    queryKey: ['resource-evaluations', 'resource', resourceId, params],
    queryFn: () => resourceEvaluationsController.getResourceEvaluationsByResourceId(resourceId, params || { pageSize: 10 }),
    enabled: !!resourceId, // Only run the query if resourceId is provided
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch resource evaluations for a specific evaluator
 */
export function useResourceEvaluationsByEvaluatorId(evaluatorId: string, params?: PaginationParams) {
  const resourceEvaluationsController = useResourceEvaluationsController();
  
  return useQuery({
    queryKey: ['resource-evaluations', 'evaluator', evaluatorId, params],
    queryFn: () => resourceEvaluationsController.getResourceEvaluationsByEvaluatorId(evaluatorId, params || { pageSize: 10 }),
    enabled: !!evaluatorId, // Only run the query if evaluatorId is provided
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to create a new resource evaluation
 */
export function useCreateResourceEvaluation() {
  const resourceEvaluationsController = useResourceEvaluationsController();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ResourceEvaluationInsert) => 
      resourceEvaluationsController.createResourceEvaluation(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resource-evaluations'] });
      if (variables.resource_id) {
        queryClient.invalidateQueries({ queryKey: ['resource-evaluations', 'resource', variables.resource_id] });
        queryClient.invalidateQueries({ queryKey: ['resource', variables.resource_id] });
      }
      if (variables.user_id) {
        queryClient.invalidateQueries({ queryKey: ['resource-evaluations', 'evaluator', variables.user_id] });
      }
    },
  });
}

/**
 * Hook to update an existing resource evaluation
 */
export function useUpdateResourceEvaluation() {
  const resourceEvaluationsController = useResourceEvaluationsController();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResourceEvaluationUpdate }) => resourceEvaluationsController.updateResourceEvaluation(id, data),
    onSuccess: (_, variables) => {
      if (variables.data.resource_id) {
        queryClient.invalidateQueries({ queryKey: ['resource-evaluations', 'resource', variables.data.resource_id] });
        queryClient.invalidateQueries({ queryKey: ['resource', variables.data.resource_id] });
      }
      if (variables.data.user_id) {
        queryClient.invalidateQueries({ queryKey: ['resource-evaluations', 'evaluator', variables.data.user_id] });
      }
      queryClient.invalidateQueries({ queryKey: ['resource-evaluations'] });
    },
  });
}

/**
 * Hook to delete a resource evaluation
 */
export function useDeleteResourceEvaluation() {
  const resourceEvaluationsController = useResourceEvaluationsController();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => resourceEvaluationsController.deleteResourceEvaluation(id),
    onSuccess: (result) => {
      if (result) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['resource-evaluations'] });
        queryClient.removeQueries({ queryKey: ['resource-evaluation', result.id] });
        queryClient.invalidateQueries({ queryKey: ['resource-evaluations', 'resource', result.resource_id] });
        queryClient.invalidateQueries({ queryKey: ['resource-evaluations', 'evaluator', result.evaluator_id] });
        // Also invalidate the resource query since evaluation affects resource status
        queryClient.invalidateQueries({ queryKey: ['resource', result.resource_id] });
      }
    },
  });
}
