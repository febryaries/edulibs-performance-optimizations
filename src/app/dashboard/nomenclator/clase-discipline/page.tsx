"use client"

import { useState, useMemo } from "react"
import { DataTable, type Filter } from "@/components/ui/data-table/data-table"
import { type ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ro } from "date-fns/locale"
import { 
  useDisciplineClassCrud, 
  useCurricularAreasCrud, 
  useClassesCrud, 
  useDisciplinesCrud, 
  DisciplineClass, 
  useDisciplineClassController
} from "@/hooks/use-controllers"
import { Button } from "@/components/ui/button"
import { PlusCircle, Upload } from "lucide-react"
import { AddBulkDisciplineClassDialog } from "@/components/nomenclature/add-bulk-discipline-class-dialog"

export default function ClaseDisciplinePage() {
  // Get controllers
  const { useList: useDisciplineClass } = useDisciplineClassCrud()
  const { useList: useCurricularAreas } = useCurricularAreasCrud()
  const { useList: useClasses } = useClassesCrud()
  const { useList: useDisciplines } = useDisciplinesCrud()
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)

  // Define columns
  const columns = useMemo<ColumnDef<DisciplineClass, any>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Cod intern",
        cell: ({ row }) => <div>{row.getValue("code") || "-"}</div>,
      },
      {
        accessorKey: "curricular_area.name",
        header: "Aria Curriculara",
        cell: ({ row }) => <div>{row.original?.curricular_area?.name || "-"}</div>,
      },
      {
        accessorKey: "class.name",
        header: "Clasa",
        cell: ({ row }) => <div>{row.original?.class?.name || "-"}</div>,
      },
      {
        accessorKey: "discipline.name",
        header: "Disciplina",
        cell: ({ row }) => <div>{row.original?.discipline?.name || "-"}</div>,
      },
      {
        accessorKey: "updated_at",
        header: "Data",
        cell: ({ row }) => (
          <div>
            {row.original?.updated_at
              ? format(new Date(row.original.updated_at), "dd MMMM yyyy", { locale: ro })
              : "-"}
          </div>
        ),
      },
    ],
    []
  )

  // Define filters
  const filters = useMemo<Filter[]>(
    () => [
      {
        id: "code",
        label: "Cod intern",
        type: "select",
        queryColumn: "code",
      },
      {
        id: "area_id",
        label: "Aria Curriculara",
        type: "controller",
        queryColumn: "area_id",
        controller: {
          valueField: "id",
          labelField: "name",
        },
        controllerHook: useCurricularAreas,
      },
      {
        id: "class_id",
        label: "Clasa",
        type: "controller",
        queryColumn: "class_id",
        controller: {
          valueField: "id",
          labelField: "name",
        },
        controllerHook: useClasses,
      },
      {
        id: "discipline_id",
        label: "Disciplina",
        type: "controller",
        queryColumn: "discipline_id",
        controller: {
          valueField: "id",
          labelField: "name",
        },
        controllerHook: useDisciplines,
      },
      {
        id: "updated_at",
        label: "Data",
        type: "date",
        queryColumn: "updated_at",
      },
    ],
    [useCurricularAreas, useClasses, useDisciplines]
  )

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Clase-Discipline</h1>
        <div className="flex items-center gap-2">
          <Button
            className="flex items-center gap-1"
            variant="outline"
            onClick={() => setBulkUploadOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Adaugă în masă
          </Button>
        </div>
      </div>
      <div className="mt-6">
        <DataTable
          columns={columns}
          useQueryHook={useDisciplineClass}
          useController={useDisciplineClassController}
          filters={filters}
          searchColumns={["code"]}
          refetchKey="discipline-class-table"
        />
      </div>
      {/* <AddBulkDisciplineClassDialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen} /> */}
    </>
  )
}
