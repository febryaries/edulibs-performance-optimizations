"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import type {
  ForeignKeyRelationMap,
  PaginatedResult,
  PaginationParams,
  QueryController,
  QueryFilter,
  QuerySort,
  TableNames,
  UsePaginatedHook,
  TableRow,
} from "@/lib/query-controller";

// Enhanced pagination params with fields and relations support
export interface EnhancedPaginationParams<
  T extends TableNames,
  M extends ForeignKeyRelationMap<T>
> extends PaginationParams {
  fields?: (keyof TableRow<T> | "*")[];
  relations?: M;
}

export function useCrud<
  T extends TableNames,
  Map extends ForeignKeyRelationMap<T> = {}
>(controller: QueryController<T, Map>, queryKey: string) {
  const queryClient = useQueryClient();

  type Entity = Awaited<ReturnType<(typeof controller)["getById"]>>;

  const useAll = (params: {
    filters?: QueryFilter[];
    sorts?: QuerySort[];
    limit?: number;
  }) =>
    useQuery({
      queryKey: [queryKey, params],
      queryFn: () => controller.getAll(params),
    });

  const useList = (
    params?: EnhancedPaginationParams<T, Map>,
    controllerConfig?: {
      fields?: (keyof TableRow<T> | "*")[];
      relations?: Map;
    }
  ): UseQueryResult<PaginatedResult<Entity>, Error> =>
    useQuery({
      queryKey: [queryKey, params, controllerConfig],
      queryFn: async () => {
        // Extract the custom fields and relations from params
        const {
          fields: paramsFields,
          relations: paramsRelations,
          ...paginationParams
        } = params || { pageSize: 20 };

        // Determine which fields and relations to use
        // Priority: controllerConfig > params > default
        const fields = controllerConfig?.fields || paramsFields;
        const relations = controllerConfig?.relations || paramsRelations;

        // If custom fields or relations are specified from any source, use a customized controller
        if (fields || relations) {
          const customController = controller.withCustomConfig({
            fields,
            relationMap: relations as any, // Type assertion to handle complex generic type issues
          });
          return (await customController.getPaginatedData(
            paginationParams
          )) as PaginatedResult<Entity>;
        }

        // Otherwise use the original controller
        return (await controller.getPaginatedData(
          paginationParams
        )) as PaginatedResult<Entity>;
      },
      placeholderData: (prev: any) => prev,
      staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - cache retention time
    });

  const useById = (id: Parameters<(typeof controller)["getById"]>[0]) =>
    useQuery({
      queryKey: [queryKey, id],
      queryFn: () => controller.getById(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    });

  const invalidateById = (
    id: Parameters<(typeof controller)["getById"]>[0]
  ) => {
    queryClient.invalidateQueries({ queryKey: [queryKey, id] });
  };

  const useFindOneByFilter = (
    params: Parameters<(typeof controller)["findOneByFilter"]>[0]
  ) =>
    useQuery({
      queryKey: [queryKey, params],
      queryFn: () => controller.findOneByFilter(params),
      enabled: !!params,
    });

  const useCreate = useMutation({
    mutationFn: (record: Parameters<(typeof controller)["create"]>[0]) =>
      controller.create(record),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });

  const useUpdate = useMutation({
    mutationFn: ({
      id,
      record,
    }: {
      id: Parameters<(typeof controller)["update"]>[0];
      record: Parameters<(typeof controller)["update"]>[1];
    }) => controller.update(id, record),
    onSuccess: (_, vars) => {
      // Only invalidate the specific item and its direct queries
      queryClient.invalidateQueries({ queryKey: [queryKey, vars.id] });
      // Removed global invalidation to prevent unnecessary refetches
    },
  });

  const useDelete = useMutation({
    mutationFn: (
      id: Parameters<NonNullable<(typeof controller)["delete"]>>[0]
    ) => controller.delete?.(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });

  const useDeleteMany = useMutation({
    mutationFn: (filters: Parameters<(typeof controller)["deleteMany"]>[0]) =>
      controller.deleteMany(filters),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });

  const useRefetch = () => {
    queryClient.invalidateQueries({ queryKey: [queryKey] });
  };

  const useRefetchById = (
    id: Parameters<(typeof controller)["getById"]>[0]
  ) => {
    queryClient.invalidateQueries({ queryKey: [queryKey, id] });
  };

  const useCount = (params?: Omit<PaginationParams, "pageSize" | "cursor">) =>
    useQuery({
      queryKey: [queryKey, "count", params],
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
