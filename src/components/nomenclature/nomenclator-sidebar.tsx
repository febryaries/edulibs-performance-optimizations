"use client"

import { SidebarProvider, Sidebar, SidebarItem, SidebarSection } from "@/components/ui/sidebar"
import { BookOpen, BookText, Layers, School, GraduationCap, BookMarked } from "lucide-react"
import { usePathname } from "next/navigation"

export function NomenclatorSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full">
      <SidebarProvider>
        <Sidebar>
          <SidebarSection title="Nomenclatoare">
            <SidebarItem
              icon={<School className="h-4 w-4" />}
              isActive={pathname === "/dashboard/nomenclator/clase"}
              href="/dashboard/nomenclator/clase"
            >
              Clase
            </SidebarItem>
            <SidebarItem
              icon={<BookText className="h-4 w-4" />}
              isActive={pathname === "/dashboard/nomenclator/ariicurriculare"}
              href="/dashboard/nomenclator/ariicurriculare"
            >
              Arii Curriculare
            </SidebarItem>
            <SidebarItem
              icon={<BookMarked className="h-4 w-4" />}
              isActive={pathname === "/dashboard/nomenclator/clase-discipline"}
              href="/dashboard/nomenclator/clase-discipline"
            >
              Clase-Discipline
            </SidebarItem>
            <SidebarItem
              icon={<BookOpen className="h-4 w-4" />}
              isActive={pathname === "/dashboard/nomenclator/discipline"}
              href="/dashboard/nomenclator/discipline"
            >
              Discipline
            </SidebarItem>
            <SidebarItem
              icon={<Layers className="h-4 w-4" />}
              isActive={pathname === "/dashboard/nomenclator/domenii"}
              href="/dashboard/nomenclator/domenii"
            >
              Domenii
            </SidebarItem>
            <SidebarItem
              icon={<GraduationCap className="h-4 w-4" />}
              isActive={pathname === "/dashboard/nomenclator/nivele"}
              href="/dashboard/nomenclator/nivele"
            >
              Nivele Educaționale
            </SidebarItem>
          </SidebarSection>
        </Sidebar>
        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </div>
      </SidebarProvider>
    </div>
  )
}
