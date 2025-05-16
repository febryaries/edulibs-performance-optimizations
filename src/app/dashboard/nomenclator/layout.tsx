import { ReactNode } from "react"
import { SidebarProvider, Sidebar, SidebarItem, SidebarSection } from "@/components/ui/sidebar"
import { BookOpen, BookText, Layers, School, GraduationCap, BookMarked } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

export default function NomenclatorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full">
      <SidebarProvider>
        <Sidebar>
          <SidebarSection title="Nomenclatoare">

            <SidebarItem
              icon={<GraduationCap className="h-4 w-4" />}
              href="/dashboard/nomenclator/nivele"
            >
              Nivele Educaționale
            </SidebarItem>

            <SidebarItem
              icon={<School className="h-4 w-4" />}
              href="/dashboard/nomenclator/clase"
            >
              Clase
            </SidebarItem>

            <SidebarItem
              icon={<Layers className="h-4 w-4" />}
              href="/dashboard/nomenclator/domenii"
            >
              Domenii
            </SidebarItem>

            <SidebarItem
              icon={<BookOpen className="h-4 w-4" />}
              href="/dashboard/nomenclator/discipline"
            >
              Discipline
            </SidebarItem>

            <SidebarItem
              icon={<BookMarked className="h-4 w-4" />}
              href="/dashboard/nomenclator/clase-discipline"
            >
              Clase-Discipline
            </SidebarItem>


            {/* <SidebarItem
              icon={<BookText className="h-4 w-4" />}
              href="/dashboard/nomenclator/ariicurriculare"
            >
              Arii Curriculare
            </SidebarItem> */}
        
           
            

            <SidebarItem
              icon={<BookOpen className="h-4 w-4" />}
              href="/dashboard/nomenclator/competente-specifice"
            >
              Competențe Specifice
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
