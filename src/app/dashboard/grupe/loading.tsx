import { Skeleton } from "@/components/ui/skeleton"

export default function GrupeLoading() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Sidebar skeleton */}
      <div className="w-full md:w-64 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="p-4 space-y-3">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Header skeleton */}
        <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center">
          <Skeleton className="h-7 w-64" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>

        {/* Filters skeleton */}
        <div className="bg-white p-4 border-b border-gray-200 grid grid-cols-1 md:grid-cols-5 gap-4">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
        </div>

        {/* Table skeleton */}
        <div className="flex-1 p-4 bg-white">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-32 ml-auto" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-24" />
            </div>

            <div className="border-t border-gray-200 pt-4">
              {Array(10)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="flex items-center gap-4 py-3">
                    <Skeleton className="h-4 w-4" />
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-48 ml-auto" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Pagination skeleton */}
        <div className="bg-white p-4 border-t border-gray-200 flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <div className="flex items-center gap-2">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-8 w-8 rounded" />
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
