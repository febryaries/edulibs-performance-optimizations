"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDisciplineClassController } from './use-discipline-class-controller';
import { PaginationParams, UsePaginatedHook } from '@/lib/query-controller';
import { DisciplineClassWithRelations } from '@/queries/discipline-class-controller';

/**
 * Hook to fetch discipline-class relationships with pagination, filtering, and sorting
 */
export const useDisciplineClasses: UsePaginatedHook<DisciplineClassWithRelations> = (params?: PaginationParams) => {
  const disciplineClassController = useDisciplineClassController();
  
  return useQuery({
    queryKey: ['discipline-classes', params],
    queryFn: () => disciplineClassController.getDisciplineClasses(params || { pageSize: 10 }),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch a single discipline-class relationship by ID
 */
export function useDisciplineClassById(id: number) {
  const disciplineClassController = useDisciplineClassController();
  
  return useQuery({
    queryKey: ['discipline-class', id],
    queryFn: () => disciplineClassController.getDisciplineClassById(id),
    enabled: !!id, // Only run the query if id is provided
  });
}

/**
 * Hook to fetch discipline-class relationships for a specific class
 */
export function useDisciplineClassesByClassId(classId: number, params?: PaginationParams) {
  const disciplineClassController = useDisciplineClassController();
  
  return useQuery({
    queryKey: ['discipline-classes', 'class', classId, params],
    queryFn: () => disciplineClassController.getDisciplineClassesByClassId(classId, params || { pageSize: 10 }),
    enabled: !!classId, // Only run the query if classId is provided
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch discipline-class relationships for a specific discipline
 */
export function useDisciplineClassesByDisciplineId(disciplineId: number, params?: PaginationParams) {
  const disciplineClassController = useDisciplineClassController();
  
  return useQuery({
    queryKey: ['discipline-classes', 'discipline', disciplineId, params],
    queryFn: () => disciplineClassController.getDisciplineClassesByDisciplineId(disciplineId, params || { pageSize: 10 }),
    enabled: !!disciplineId, // Only run the query if disciplineId is provided
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to create a new discipline-class relationship
 */
export function useCreateDisciplineClass() {
  const disciplineClassController = useDisciplineClassController();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { discipline_id: number; class_id: number }) => 
      disciplineClassController.createDisciplineClass(data),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['discipline-classes'] });
      queryClient.invalidateQueries({ queryKey: ['discipline-classes', 'discipline', variables.discipline_id] });
      queryClient.invalidateQueries({ queryKey: ['discipline-classes', 'class', variables.class_id] });
    },
  });
}

/**
 * Hook to delete a discipline-class relationship
 */
export function useDeleteDisciplineClass() {
  const disciplineClassController = useDisciplineClassController();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => disciplineClassController.deleteDisciplineClass(id),
    onSuccess: (result) => {
      if (result) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['discipline-classes'] });
        queryClient.removeQueries({ queryKey: ['discipline-class', result.id] });
        queryClient.invalidateQueries({ queryKey: ['discipline-classes', 'discipline', result.discipline_id] });
        queryClient.invalidateQueries({ queryKey: ['discipline-classes', 'class', result.class_id] });
      }
    },
  });
}
