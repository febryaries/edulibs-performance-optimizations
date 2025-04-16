import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function SettingsLoading() {
  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Skeleton */}
        <div className="md:col-span-1">
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b">
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="flex flex-col">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 border-b">
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Main Content Skeleton */}
        <div className="md:col-span-3">
          <Card className="p-6">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-4 w-full mb-8" />

            <div className="flex flex-col items-center mb-8">
              <Skeleton className="h-24 w-24 rounded-full mb-4" />
              <Skeleton className="h-10 w-32" />
            </div>

            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <Skeleton className="h-10 w-24" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
