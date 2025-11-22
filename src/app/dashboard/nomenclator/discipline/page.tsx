"use client"

import { useState, useMemo } from "react"
import { DataTable, type Filter } from "@/components/ui/data-table/data-table"
import { type ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ro } from "date-fns/locale"
import { useDisciplinesCrud, useDomainsCrud, Discipline, useDisciplinesController, useDomainsController } from "@/hooks/use-controllers"
import { Button } from "@/components/ui/button"
import { PlusCircle, Upload, Edit, BookOpen } from "lucide-react"
import { Sheet, SheetContent } from "@/components/ui/sheet-fullscreen"
import { DisciplineForm } from "@/components/nomenclature/disciplines/discipline-form"
import { DisciplineFormValues } from "@/schemas/discipline-schema"
import { AddBulkDisciplineDialog } from "@/components/nomenclature/add-bulk-discipline-dialog"

// Form state management
type FormState = {
  isOpen: boolean;
  isFullScreen: boolean;
  isEditMode: boolean;
  discipline: Discipline | null;
}

export default function DisciplinePage() {
  // Get controllers
  const { useList: useDisciplines } = useDisciplinesCrud()
  const disciplinesController = useDisciplinesController()
  const { useList: useDomains } = useDomainsCrud()
  const domainsController = useDomainsController()
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)
  
  // Form state
  const [formState, setFormState] = useState<FormState>({
    isOpen: false,
    isFullScreen: false,
    isEditMode: false,
    discipline: null,
  })

  // Define columns
  const columns = useMemo<ColumnDef<Discipline, any>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nume",
        cell: ({ row }) => <div>{row.getValue("name")}</div>,
      },
      {
        accessorKey: "curricular_area.name",
        header: "Domeniu",
        cell: ({ row }) => <div>{row.original?.curricular_area?.name || "-"}</div>,
      },
      {
        accessorKey: "number",
        header: "Număr",
        cell: ({ row }) => <div>{row.getValue("number")}</div>,
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
      {
        id: "actions",
        header: "Acțiuni",
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  handleEditDiscipline(row.original)
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          )
        },
      },
    ],
    []
  )

  // Define filters
  const filters = useMemo<Filter[]>(
    () => [
      {
        id: "domain_id",
        label: "Domeniu",
        icon: <BookOpen className="h-4 w-4" />,
        type: "controller",
        queryColumn: "domain_id",
        controller: {
          valueField: "id",
          labelField: "name",
        },
        fetchHook: (params) => domainsController.getPaginatedData(params),
      },
      {
        id: "updated_at",
        label: "Data",
        type: "date",
        queryColumn: "updated_at",
      },
    ],
    [domainsController]
  )

  // Form handlers
  const handleAddDiscipline = () => {
    setFormState({
      isOpen: true,
      isFullScreen: false,
      isEditMode: false,
      discipline: null,
    })
  }

  const handleEditDiscipline = (disciplineData: Discipline) => {
    setFormState({
      isOpen: true,
      isFullScreen: false,
      isEditMode: true,
      discipline: disciplineData,
    })
  }

  const handleFormClose = () => {
    setFormState(prev => ({ ...prev, isOpen: false }))
  }

  const handleToggleFullScreen = () => {
    setFormState(prev => ({ ...prev, isFullScreen: !prev.isFullScreen }))
  }

  const handleSave = async (data: DisciplineFormValues) => {
    try {
      if (formState.isEditMode && formState.discipline?.id) {
        // Update existing discipline
        await disciplinesController.update(formState.discipline.id, data)
      } else {
        // Create new discipline
        await disciplinesController.create(data)
      }
      // Close form and refresh data
      handleFormClose()
    } catch (error) {
      console.error("Error saving discipline:", error)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await disciplinesController.delete(id)
      handleFormClose()
    } catch (error) {
      console.error("Error deleting discipline:", error)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Discipline</h1>
        <div className="flex items-center gap-2">
          <Button
            className="flex items-center gap-1"
            onClick={handleAddDiscipline}
          >
            <PlusCircle className="h-4 w-4" />
            Adaugă disciplină
          </Button>
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
      
      {/* Discipline Form Sheet */}
      <Sheet
        open={formState.isOpen}
        onOpenChange={(open) => {
          if (!open) handleFormClose()
        }}
      >
        <SheetContent
          side="right"
          className="p-0 overflow-hidden"
          fullScreen={formState.isFullScreen}
          title="Formular Disciplină"
        >
          <DisciplineForm
            onClose={handleFormClose}
            onSave={handleSave}
            onDelete={handleDelete}
            onToggleFullScreen={handleToggleFullScreen}
            isFullScreen={formState.isFullScreen}
            isEditMode={formState.isEditMode}
            discipline={formState.discipline}
            initialData={formState.isEditMode ? undefined : { name: "Disciplină Nouă" }}
          />
        </SheetContent>
      </Sheet>
      
      {/* <AddBulkDisciplineDialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen} /> */}
    </>
  )
}
