import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Filters skeleton */}
      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>

      <div className="flex items-center gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-40" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="border rounded-md overflow-hidden">
        <div className="bg-lighter p-3">
          <div className="grid grid-cols-8 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        </div>
        <div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className={`p-3 ${i % 2 === 0 ? "bg-white" : "bg-lightest"}`}>
              <div className="grid grid-cols-8 gap-4">
                {Array.from({ length: 8 }).map((_, j) => (
                  <Skeleton key={j} className="h-6 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-10" />
          ))}
        </div>
      </div>
    </div>
  );
}
