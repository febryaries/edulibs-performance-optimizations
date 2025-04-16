import { Skeleton } from "@/components/ui/skeleton"

export default function UtilizatoriLoading() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-36" />
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Skeleton className="h-10 flex-1" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="bg-white rounded-md shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left">
                  <Skeleton className="h-4 w-4" />
                </th>
                <th scope="col" className="px-6 py-3 text-left">
                  <Skeleton className="h-4 w-20" />
                </th>
                <th scope="col" className="px-6 py-3 text-left">
                  <Skeleton className="h-4 w-20" />
                </th>
                <th scope="col" className="px-6 py-3 text-left">
                  <Skeleton className="h-4 w-20" />
                </th>
                <th scope="col" className="px-6 py-3 text-left">
                  <Skeleton className="h-4 w-20" />
                </th>
                <th scope="col" className="px-6 py-3 text-right">
                  <Skeleton className="h-4 w-20 ml-auto" />
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array(10)
                .fill(0)
                .map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-4" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Skeleton className="h-10 w-10 rounded-full mr-3" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-40" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-24" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-16" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-5 w-5" />
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-4" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </div>
    </div>
  )
}
