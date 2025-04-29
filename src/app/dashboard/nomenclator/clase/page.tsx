"use client"

import { useState, useMemo } from "react"
import { DataTable, type Filter } from "@/components/ui/data-table/data-table"
import { type ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ro } from "date-fns/locale"
import { useClassesCrud, useEducationLevelsCrud, Class, useClassesController } from "@/hooks/use-controllers"
import { Button } from "@/components/ui/button"
import { PlusCircle, Upload } from "lucide-react"
import { AddBulkClassDialog } from "@/components/nomenclature/add-bulk-class-dialog"

export default function ClasePage() {
  // Get controllers
  const { useList: useClasses } = useClassesCrud()
  const { useList: useEducationalLevels } = useEducationLevelsCrud()
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)

  // Define columns
  const columns = useMemo<ColumnDef<Class, any>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nume",
        cell: ({ row }) => <div>{row.getValue("name")}</div>,
      },
      {
        accessorKey: "educational_level.name",
        header: "Level",
        cell: ({ row }) => <div>{row.original?.educational_level?.name || "-"}</div>,
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
        id: "name",
        label: "Nume",
        type: "select",
        queryColumn: "name",
      },
      {
        id: "educational_level_id",
        label: "Level",
        type: "controller",
        queryColumn: "educational_level_id",
        controller: {
          valueField: "id",
          labelField: "name",
        },
        controllerHook: useEducationalLevels,
      },
      {
        id: "updated_at",
        label: "Data",
        type: "date",
        queryColumn: "updated_at",
      },
    ],
    [useEducationalLevels]
  )

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Clase</h1>
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
          useQueryHook={useClasses}
          useController={useClassesController}
          filters={filters}
          searchColumns={["name"]}
          refetchKey="classes-table"
        />
      </div>
      {/* <AddBulkClassDialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen} /> */}
    </>
  )
}
