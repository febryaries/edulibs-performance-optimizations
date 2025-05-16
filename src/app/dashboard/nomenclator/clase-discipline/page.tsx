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
import { PlusCircle, Upload, Edit } from "lucide-react"
import { AddBulkDisciplineClassDialog } from "@/components/nomenclature/add-bulk-discipline-class-dialog"
import { Sheet, SheetContent } from "@/components/ui/sheet-fullscreen"
import { DisciplineClassForm } from "@/components/nomenclature/discipline-classes/discipline-class-form"
import { toast } from "sonner"
import { type DisciplineClassFormValues } from "@/schemas/discipline-class-schema"

// Define the form state interface
interface FormState {
  isOpen: boolean
  isFullScreen: boolean
  isEditMode: boolean
  disciplineClass: DisciplineClass | null
}

export default function ClaseDisciplinePage() {
  // Get controllers
  const { useList: useDisciplineClass } = useDisciplineClassCrud()
  const disciplineClassController = useDisciplineClassController()
  const { useList: useCurricularAreas } = useCurricularAreasCrud()
  const { useList: useClasses } = useClassesCrud()
  const { useList: useDisciplines } = useDisciplinesCrud()
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)
  
  // Form state
  const [formState, setFormState] = useState<FormState>({
    isOpen: false,
    isFullScreen: false,
    isEditMode: false,
    disciplineClass: null,
  })

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
                  handleEdit(row.original)
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

  // Handle opening the form for creating a new discipline-class association
  const handleCreate = () => {
    setFormState({
      isOpen: true,
      isFullScreen: false,
      isEditMode: false,
      disciplineClass: null,
    })
  }

  // Handle opening the form for editing an existing discipline-class association
  const handleEdit = (disciplineClass: DisciplineClass) => {
    setFormState({
      isOpen: true,
      isFullScreen: false,
      isEditMode: true,
      disciplineClass,
    })
  }

  // Handle closing the form
  const handleFormClose = () => {
    setFormState((prev) => ({
      ...prev,
      isOpen: false,
    }))
  }

  // Handle toggling fullscreen mode
  const handleToggleFullScreen = () => {
    setFormState((prev) => ({
      ...prev,
      isFullScreen: !prev.isFullScreen,
    }))
  }

  // Handle saving a discipline-class association
  const handleSave = async (data: DisciplineClassFormValues) => {
    try {
      if (formState.isEditMode && formState.disciplineClass) {
        // Update existing discipline-class association
        await disciplineClassController.update(formState.disciplineClass.id, data)
        toast.success("Asocierea clasă-disciplină a fost actualizată cu succes")
      } else {
        // Create new discipline-class association
        await disciplineClassController.create(data)
        toast.success("Asocierea clasă-disciplină a fost creată cu succes")
      }
      // Close the form
      handleFormClose()
    } catch (error) {
      console.error("Error saving discipline-class association:", error)
      toast.error("A apărut o eroare la salvarea asocierii clasă-disciplină")
    }
  }

  // Handle deleting a discipline-class association
  const handleDelete = async (id: number) => {
    try {
      await disciplineClassController.delete(id)
      toast.success("Asocierea clasă-disciplină a fost ștearsă cu succes")
      handleFormClose()
    } catch (error) {
      console.error("Error deleting discipline-class association:", error)
      toast.error("A apărut o eroare la ștergerea asocierii clasă-disciplină")
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Clase-Discipline</h1>
        <div className="flex items-center gap-2">
          <Button
            className="flex items-center gap-1"
            onClick={handleCreate}
          >
            <PlusCircle className="h-4 w-4" />
            Adaugă asociere
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
          useQueryHook={useDisciplineClass}
          useController={useDisciplineClassController}
          filters={filters}
          searchColumns={["code"]}
          refetchKey="discipline-class-table"
        />
      </div>
      
      {/* Discipline-Class Form Sheet */}
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
          title="Formular Clasă-Disciplină"
        >
          <DisciplineClassForm
            onClose={handleFormClose}
            onSave={handleSave}
            onDelete={handleDelete}
            onToggleFullScreen={handleToggleFullScreen}
            isFullScreen={formState.isFullScreen}
            isEditMode={formState.isEditMode}
            disciplineClass={formState.disciplineClass}
            initialData={formState.isEditMode ? undefined : {}}
          />
        </SheetContent>
      </Sheet>
      
      {/* <AddBulkDisciplineClassDialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen} /> */}
    </>
  )
}
