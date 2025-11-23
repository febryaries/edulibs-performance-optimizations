"use client";

import { useQuery } from "@tanstack/react-query";

interface StatsCountsResponse {
  resources: number;
  groups: number;
  users: number;
  cached: boolean;
  cacheAge?: number;
}

export function useStatsCounts() {
  return useQuery<StatsCountsResponse>({
    queryKey: ["stats", "counts"],
    queryFn: async () => {
      const response = await fetch("/api/stats/counts", {
        credentials: "include", // IMPORTANT: trimite cookie-urile de sesiune
      });
      if (!response.ok) {
        throw new Error("Failed to fetch counts");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minute - considerăm datele fresh
    gcTime: 10 * 60 * 1000, // 10 minute - păstrăm în cache
    refetchOnWindowFocus: false, // Nu refetch la focus (evităm query-uri inutile)
    refetchOnMount: false, // Nu refetch la mount dacă avem deja date
    // Placeholder data pentru prima încărcare (evită flash de 0)
    placeholderData: {
      resources: 0,
      groups: 0,
      users: 0,
      cached: false,
    },
  });
}
