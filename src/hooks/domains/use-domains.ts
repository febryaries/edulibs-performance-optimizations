"use client";

import { useQuery } from '@tanstack/react-query';
import { useDomainsController } from './use-domains-controller';
import { PaginationParams, UsePaginatedHook } from '@/lib/query-controller';
import { Domain } from '@/queries/domains-controller';

/**
 * Hook to fetch domains with pagination, filtering, and sorting
 */
export const useDomains: UsePaginatedHook<Domain> = (params?: PaginationParams) => {
  const domainsController = useDomainsController();
  
  return useQuery({
    queryKey: ['domains', params],
    queryFn: () => domainsController.getDomains(params || { pageSize: 10 }),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch a single domain by ID
 */
export function useDomainById(id: number) {
  const domainsController = useDomainsController();
  
  return useQuery({
    queryKey: ['domain', id],
    queryFn: () => domainsController.getDomainById(id),
    enabled: !!id, // Only run the query if id is provided
  });
}
