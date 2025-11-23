import { ReactNode } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarItem,
  SidebarSection,
} from "@/components/ui/sidebar";
import {
  BookOpen,
  BookText,
  Layers,
  School,
  GraduationCap,
  BookMarked,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export default function NomenclatorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-[calc(100vh-4rem)]" data-page="nomenclator">
      <SidebarProvider>
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden md:block">
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
                href="/dashboard/nomenclator/ariicurriculare"
              >
                Arii Curriculare
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
        </div>
        {/* Main content */}
        <div className="flex-1 overflow-y-auto w-full min-w-0 max-w-full p-4 md:p-6 h-full">
          {children}
        </div>
      </SidebarProvider>
    </div>
  );
}
