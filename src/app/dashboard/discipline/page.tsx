"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle, Edit, Copy, Trash2, Search, BookOpen, School, BookText } from "lucide-react"
import { DataTable, Filter } from "@/components/ui/data-table/data-table"
import { Input } from "@/components/ui/input"
import { type ColumnDef, type RowSelectionState } from "@tanstack/react-table"
import { useSupabaseBrowser } from "@/utils/supabase/client"
import { useDisciplines } from "@/hooks/disciplines/use-disciplines"
import { useClasses } from "@/hooks/classes/use-classes"
import { useSpecificCompetencies } from "@/hooks/specific-competencies/use-specific-competencies"
import { useAuth } from "@/lib/auth-context"

// Define level options for the filter
const nivelOptions = [
  { value: "primar", label: "Primar" },
  { value: "gimnazial", label: "Gimnazial" },
  { value: "liceal", label: "Liceal" },
]

// Define column definitions for visibility toggle
const columnDefinitions = [
  { id: "name", label: "Disciplina" },
  { id: "level", label: "Nivel" },
  { id: "actions", label: "Acțiuni" },
]

export default function DisciplinePage() {
  const { user, isLoading: authLoading, isInitialized } = useAuth()
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})

  // Supabase client setup
  const supabase = useSupabaseBrowser()

  // Define controller configs for dropdowns (do not pass controller instances)
  const disciplineControllerConfig = useMemo(() => ({
    valueField: "id" as const,
    labelField: "name" as const,
    pageSize: 5
  }), [])
  const classControllerConfig = useMemo(() => ({
    valueField: "id" as const,
    labelField: "name" as const,
    pageSize: 5
  }), [])
  const competencyControllerConfig = useMemo(() => ({
    valueField: "id" as const,
    labelField: "name" as const,
    pageSize: 5
  }), [])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle column visibility change
  const handleColumnVisibilityChange = (visibility: Record<string, boolean>) => {
    setColumnVisibility(visibility)
  }
  
  // Define filters for the data table
  const tableFilters: Filter[] = [
    {
      id: "disciplina",
      label: "Disciplina",
      type: "controller",
      icon: <BookOpen className="h-4 w-4 text-gray-400" />,
      queryColumn: "id",
      controller: disciplineControllerConfig,
      controllerHook: useDisciplines
    },
    {
      id: "clasa",
      label: "Clasa",
      type: "controller",
      icon: <School className="h-4 w-4 text-gray-400" />,
      queryColumn: "id",
      controller: classControllerConfig,
      controllerHook: useClasses,
      customFilterHandler: "clasa"
    },
    {
      id: "competenta",
      label: "Competență",
      type: "controller",
      icon: <BookText className="h-4 w-4 text-gray-400" />,
      queryColumn: "id",
      controller: competencyControllerConfig,
      controllerHook: useSpecificCompetencies,
      customFilterHandler: "competenta"
    },
    {
      id: "nivel",
      label: "Nivel",
      type: "select",
      options: nivelOptions,
      icon: <BookOpen className="h-4 w-4 text-gray-400" />,
      queryColumn: "level_id"
    }
  ]

  // Define columns for the data table
  const columns: ColumnDef<any>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="h-4 w-4 rounded border-gray-300"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="h-4 w-4 rounded border-gray-300"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Disciplina",
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      id: "level",
      header: "Nivel",
      cell: ({ row }) => {
        const discipline = row.original;
        const levels = discipline.educational_levels || [];
        
        return (
          <div className="flex flex-wrap gap-1">
            {levels.length > 0 ? (
              levels.map((level: string, index: number) => (
                <span 
                  key={index} 
                  className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
                >
                  {level}
                </span>
              ))
            ) : (
              <span className="text-gray-500">Fără nivel</span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Acțiuni",
      cell: ({ row }) => {
        const discipline = row.original
        
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 w-8">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8">
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 text-red-500">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  // Handle row selection changes
  const handleRowSelectionChange = (selection: RowSelectionState) => {
    // Convert the selection object to an array of selected IDs
    const selectedIds = Object.keys(selection).filter(id => selection[id])
    setSelectedItems(selectedIds)
  }

  if (authLoading || !mounted || !isInitialized) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Discipline</h1>
        <Button className="flex items-center gap-1">
          <PlusCircle className="h-4 w-4" />
          Adaugă disciplină
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {selectedItems.length > 0 && (
          <>
            <Button variant="outline" className="flex items-center gap-1">
              <Edit className="h-4 w-4" />
              Editează
            </Button>
            <Button variant="outline" className="flex items-center gap-1">
              <Copy className="h-4 w-4" />
              Duplică
            </Button>
            <Button variant="outline" className="flex items-center gap-1 text-red-500">
              <Trash2 className="h-4 w-4" />
              Șterge
            </Button>
          </>
        )}
      </div>

      <div className="space-y-4">        
        <DataTable
          columns={columns}
          useQueryHook={useDisciplines}
          enableRowSelection={true}
          filters={tableFilters}
          visibleColumnsConfig={{
            initialVisibleColumns: columnVisibility,
            columnDefinitions: columnDefinitions,
            onVisibilityChange: handleColumnVisibilityChange
          }}
        />
      </div>
    </div>
  )
}
