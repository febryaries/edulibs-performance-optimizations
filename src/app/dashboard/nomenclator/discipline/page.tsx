"use client"

import { useState, useMemo } from "react"
import { DataTable, type Filter } from "@/components/ui/data-table/data-table"
import { type ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ro } from "date-fns/locale"
import { useDisciplinesCrud, useDomainsCrud, Discipline, useDisciplinesController } from "@/hooks/use-controllers"
import { Button } from "@/components/ui/button"
import { PlusCircle, Upload } from "lucide-react"
import { AddBulkDisciplineDialog } from "@/components/nomenclature/add-bulk-discipline-dialog"

export default function DisciplinePage() {
  // Get controllers
  const { useList: useDisciplines } = useDisciplinesCrud()
  const { useList: useDomains } = useDomainsCrud()
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)

  // Define columns
  const columns = useMemo<ColumnDef<Discipline, any>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nume",
        cell: ({ row }) => <div>{row.getValue("name")}</div>,
      },
      {
        accessorKey: "domain.name",
        header: "Domeniu",
        cell: ({ row }) => <div>{row.original?.domain?.name || "-"}</div>,
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
        id: "domain_id",
        label: "Domeniu",
        type: "controller",
        queryColumn: "domain_id",
        controller: {
          valueField: "id",
          labelField: "name",
        },
        controllerHook: useDomains,
      },
      {
        id: "updated_at",
        label: "Data",
        type: "date",
        queryColumn: "updated_at",
      },
    ],
    [useDomains]
  )

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Discipline</h1>
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
          useQueryHook={useDisciplines}
          useController={useDisciplinesController}
          filters={filters}
          searchColumns={["name"]}
          refetchKey="disciplines-table"
        />
      </div>
      {/* <AddBulkDisciplineDialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen} /> */}
    </>
  )
}
