"use client"

import { useState, useMemo } from "react"
import { DataTable, type Filter } from "@/components/ui/data-table/data-table"
import { type ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ro } from "date-fns/locale"
import { useClassesCrud, useEducationLevelsCrud, Class, useClassesController, useEducationLevelsController } from "@/hooks/use-controllers"
import { Button } from "@/components/ui/button"
import { PlusCircle, Upload, Edit, BookOpen } from "lucide-react"
import { Sheet, SheetContent } from "@/components/ui/sheet-fullscreen"
import { ClassForm } from "@/components/nomenclature/classes/class-form"
import { ClassFormValues } from "@/schemas/class-schema"

// Form state management
type FormState = {
  isOpen: boolean;
  isFullScreen: boolean;
  isEditMode: boolean;
  class: Class | null;
}

export default function ClasePage() {
  // Get controllers
  const { useList: useClasses } = useClassesCrud()
  const classesController = useClassesController()
  const { useList: useEducationalLevels } = useEducationLevelsCrud()
  const educationalLevelsController = useEducationLevelsController()
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)
  
  // Form state
  const [formState, setFormState] = useState<FormState>({
    isOpen: false,
    isFullScreen: false,
    isEditMode: false,
    class: null,
  })

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
        header: "Nivel educațional",
        cell: ({ row }) => <div>{row.original?.educational_level?.name || "-"}</div>,
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
                  handleEditClass(row.original)
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
        id: "level_id",
        label: "Nivel educațional",
        icon: <BookOpen className="h-4 w-4" />,
        type: "controller",
        queryColumn: "level_id",
        controller: {
          valueField: "id",
          labelField: "name",
        },
        fetchHook: (params) => educationalLevelsController.getPaginatedData(params),
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

  // Form handlers
  const handleAddClass = () => {
    setFormState({
      isOpen: true,
      isFullScreen: false,
      isEditMode: false,
      class: null,
    })
  }

  const handleEditClass = (classData: Class) => {
    setFormState({
      isOpen: true,
      isFullScreen: false,
      isEditMode: true,
      class: classData,
    })
  }

  const handleFormClose = () => {
    setFormState(prev => ({ ...prev, isOpen: false }))
  }

  const handleToggleFullScreen = () => {
    setFormState(prev => ({ ...prev, isFullScreen: !prev.isFullScreen }))
  }

  const handleSave = async (data: ClassFormValues) => {
    try {
      if (formState.isEditMode && formState.class?.id) {
        // Update existing class
        await classesController.update(formState.class.id, data)
      } else {
        // Create new class
        await classesController.create(data)
      }
      // Close form and refresh data
      handleFormClose()
    } catch (error) {
      console.error("Error saving class:", error)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await classesController.delete(id)
      handleFormClose()
    } catch (error) {
      console.error("Error deleting class:", error)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Clase</h1>
        <div className="flex items-center gap-2">
          <Button
            className="flex items-center gap-1"
            onClick={handleAddClass}
          >
            <PlusCircle className="h-4 w-4" />
            Adaugă clasă
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
          useQueryHook={useClasses}
          useController={useClassesController}
          filters={filters}
          searchColumns={["name"]}
          refetchKey="classes-table"
          initialSorting={[{ id: "number", desc: false }]}
        />
      </div>
      
      {/* Class Form Sheet */}
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
          title="Formular Clasă"
        >
          <ClassForm
            onClose={handleFormClose}
            onSave={handleSave}
            onDelete={handleDelete}
            onToggleFullScreen={handleToggleFullScreen}
            isFullScreen={formState.isFullScreen}
            isEditMode={formState.isEditMode}
            class={formState.class}
            initialData={formState.isEditMode ? undefined : { name: "Clasă Nouă" }}
          />
        </SheetContent>
      </Sheet>
      
      {/* <AddBulkClassDialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen} /> */}
    </>
  )
}
