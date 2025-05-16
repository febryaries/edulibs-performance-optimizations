"use client"

import { Sidebar, SidebarItem, SidebarSection } from "@/components/ui/sidebar"
import { Users } from "lucide-react"
import { useInfiniteDataTable } from "@/hooks/use-infinite-data"
import { useGroupsController, useGroupsCrud } from "@/hooks/use-controllers"
import { useMemo, useState, useEffect } from "react"
import { InView } from "react-intersection-observer"

interface InfiniteGroupsSidebarProps {
  selectedGroup: string | null;
  onSelect: (id: string) => void;
  filters?: any[];
}

export default function InfiniteGroupsSidebar({ selectedGroup, onSelect, filters }: InfiniteGroupsSidebarProps) {
  const pageSize = 300
  const memoizedFilters = useMemo(() => filters || [], [filters])

  const groupController = useGroupsController()

  const {
    results: groups,
    pageIndex,
    totalPages,
    goToNextPage,
    query,
  } = useInfiniteDataTable(
    (params) => groupController.getPaginatedData(params),
    {
      pageSize,
      filters: memoizedFilters,
      sorts: [
        {
          column: 'name',
          direction: 'asc'
        }
      ],
      searchTerm: "",
    },
    'sidebar-groups'
  )

  // Infinite scroll logic as in SearchableDropdown
  const [isEndOfListInView, setIsEndOfListInView] = useState(false)

  useEffect(() => {
    if (
      isEndOfListInView &&
      pageIndex < totalPages &&
      !query.isFetching &&
      !query.isLoading
    ) {
      goToNextPage()
    }
  }, [isEndOfListInView, pageIndex, totalPages, query.isFetching, query.isLoading])

  return (
    <Sidebar className="h-full border-r border-gray-200 overflow-y-auto">
      <SidebarSection title="Toate grupele">
        {!query.isLoading && groups.length === 0 && (
          <div className="p-4 text-center">Nu există grupe</div>
        )}
        {groups.map((group) => {
          if (!group?.id) return null;
          return (
            <SidebarItem
              key={group.id}
              isActive={selectedGroup === group.id}
              onClick={() => onSelect(group.id)}
              icon={<Users className="h-4 w-4" />}
            >
              <div className="flex items-center justify-between w-full">
                <span>{group?.name}</span>
              </div>
            </SidebarItem>
          );
        })}
        {/* Infinite loader trigger (always rendered) */}
        <InView as="div" onChange={setIsEndOfListInView}>
          <div style={{ height: 1 }} />
        </InView>
        {(query.isFetching || query.isLoading) && (
          <div className="py-2 text-center">
            <svg className="h-4 w-4 animate-spin mx-auto text-gray-400" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
          </div>
        )}
      </SidebarSection>
    </Sidebar>
  )
}
