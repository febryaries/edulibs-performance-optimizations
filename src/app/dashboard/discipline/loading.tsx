import { Skeleton } from "@/components/ui/skeleton"

export default function DisciplineLoading() {
  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <Skeleton className="h-8 w-40 mb-4 md:mb-0" />
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Skeleton className="h-10 flex-1" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left w-10">
                  <Skeleton className="h-5 w-5" />
                </th>
                <th className="px-4 py-3 text-left">
                  <Skeleton className="h-5 w-24" />
                </th>
                <th className="px-4 py-3 text-left">
                  <Skeleton className="h-5 w-16" />
                </th>
                <th className="px-4 py-3 text-right">
                  <Skeleton className="h-5 w-16 ml-auto" />
                </th>
              </tr>
            </thead>
            <tbody>
              {Array(10)
                .fill(0)
                .map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-3">
                      <Skeleton className="h-5 w-5" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-5 w-40" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t flex flex-col md:flex-row justify-between items-center">
          <Skeleton className="h-5 w-32 mb-4 md:mb-0" />
          <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </div>
    </div>
  )
}
