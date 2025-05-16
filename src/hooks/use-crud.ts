'use client';

import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import type {
  ForeignKeyRelationMap,
  PaginatedResult,
  PaginationParams,
  QueryController,
  QueryFilter,
  QuerySort,
  TableNames,
  UsePaginatedHook,
} from '@/lib/query-controller';

export function useCrud<T extends TableNames, Map extends ForeignKeyRelationMap<T> = {}>(
  controller: QueryController<T, Map>,
  queryKey: string
) {

  const queryClient = useQueryClient();

  type Entity = Awaited<ReturnType<typeof controller['getById']>>;

  const useAll = (params: {
    filters?: QueryFilter[];
    sorts?: QuerySort[];
    limit?: number
  }) =>
    useQuery({
      queryKey: [queryKey, params],
      queryFn: () => controller.getAll(params),
    });

  const useList: UsePaginatedHook<Entity> = (params?: PaginationParams): UseQueryResult<PaginatedResult<Entity>, Error> =>
    useQuery({
      queryKey: [queryKey, params],
      queryFn: () => controller.getPaginatedData(params || { pageSize: 20 }),
      placeholderData: (prev) => prev,
    });


  const useById = (id: Parameters<typeof controller['getById']>[0]) =>
    useQuery({
      queryKey: [queryKey, id],
      queryFn: () => controller.getById(id),
      enabled: !!id,
    });

  const invalidateById = (id: Parameters<typeof controller['getById']>[0]) => {
    queryClient.invalidateQueries({ queryKey: [queryKey, id] });
  };

  const useFindOneByFilter = (params: Parameters<typeof controller['findOneByFilter']>[0]) =>
    useQuery({
      queryKey: [queryKey, params],
      queryFn: () => controller.findOneByFilter(params),
      enabled: !!params,
    });

  const useCreate =
    useMutation({
      mutationFn: (record: Parameters<typeof controller['create']>[0]) => controller.create(record),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      },
    });

  const useUpdate =
    useMutation({
      mutationFn: ({ id, record }: { id: Parameters<typeof controller['update']>[0]; record: Parameters<typeof controller['update']>[1] }) =>
        controller.update(id, record),
      onSuccess: (_, vars) => {
        queryClient.invalidateQueries({ queryKey: [queryKey, vars.id] });
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      },
    });

  const useDelete =
    useMutation({
      mutationFn: (id: Parameters<NonNullable<typeof controller['delete']>>[0]) => controller.delete?.(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      },
    });

  const useDeleteMany =
    useMutation({
      mutationFn: (filters: Parameters<typeof controller['deleteMany']>[0]) => controller.deleteMany(filters),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      },
    });

  const useRefetch = () => {
    queryClient.invalidateQueries({ queryKey: [queryKey] });
  };

  const useRefetchById = (id: Parameters<typeof controller['getById']>[0]) => {
    queryClient.invalidateQueries({ queryKey: [queryKey, id] });
  };

  const useCount = (params?: Omit<PaginationParams, 'pageSize' | 'cursor'>) =>
    useQuery({
      queryKey: [queryKey, 'count', params],
      queryFn: () => controller.getCount(params || {}),
    });


  return {
    useAll,
    useList,
    useById,
    useFindOneByFilter,
    useCreate,
    useUpdate,
    useDelete,
    useDeleteMany,
    useRefetch,
    useRefetchById,
    useCount,
    invalidateById,
  };
}
