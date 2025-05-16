"use client"

import { useState, useMemo } from "react"
import { DataTable, type Filter } from "@/components/ui/data-table/data-table"
import { type ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ro } from "date-fns/locale"
import { useEducationLevelsCrud, useEducationLevelsController, EducationLevel } from "@/hooks/use-controllers"
import { Button } from "@/components/ui/button"
import { PlusCircle, Upload, Edit } from "lucide-react"
import { AddBulkEducationalLevelDialog } from "@/components/nomenclature/add-bulk-educational-level-dialog"
import { Sheet, SheetContent } from "@/components/ui/sheet-fullscreen"
import { EducationLevelForm } from "@/components/nomenclature/education-levels/education-level-form"
import { EducationLevelFormValues } from "@/schemas/education-level-schema"

// Form state management
type FormState = {
  isOpen: boolean;
  isFullScreen: boolean;
  isEditMode: boolean;
  educationLevel: EducationLevel | null;
}

export default function NivelePage() {
  // Get controllers
  const { useList: useEducationalLevels } = useEducationLevelsCrud()
  const educationLevelsController = useEducationLevelsController()
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)
  
  // Form state
  const [formState, setFormState] = useState<FormState>({
    isOpen: false,
    isFullScreen: false,
    isEditMode: false,
    educationLevel: null,
  })

  // Define columns
  const columns = useMemo<ColumnDef<EducationLevel, any>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nume",
        cell: ({ row }) => <div>{row.getValue("name")}</div>,
      },
      {
        accessorKey: "number",
        header: "Număr",
        cell: ({ row }) => <div>{row.original?.number || 0}</div>,
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
                  handleEditLevel(row.original)
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
        id: "name",
        label: "Nume",
        type: "select",
        queryColumn: "name",
      },
      {
        id: "number",
        label: "Număr",
        type: "select",
        queryColumn: "number",
      },
      {
        id: "updated_at",
        label: "Data",
        type: "date",
        queryColumn: "updated_at",
      },
    ],
    []
  )
  
  // Handle opening the form for a new level
  const handleAddLevel = () => {
    setFormState({
      isOpen: true,
      isFullScreen: false,
      isEditMode: false,
      educationLevel: null,
    })
  }
  
  // Handle opening the form for editing an existing level
  const handleEditLevel = (educationLevel: EducationLevel) => {
    setFormState({
      isOpen: true,
      isFullScreen: false,
      isEditMode: true,
      educationLevel,
    })
  }
  
  // Handle form close
  const handleFormClose = () => {
    setFormState(prev => ({
      ...prev,
      isOpen: false,
    }))
  }
  
  // Handle fullscreen toggle
  const handleToggleFullScreen = () => {
    setFormState(prev => ({
      ...prev,
      isFullScreen: !prev.isFullScreen,
    }))
  }
  
  // Handle save
  const handleSave = async (data: EducationLevelFormValues) => {
    try {
      if (formState.isEditMode && formState.educationLevel) {
        // Update existing level
        await educationLevelsController.update(formState.educationLevel.id, data)
      } else {
        // Create new level
        await educationLevelsController.create(data)
      }
      
      // Close form and refresh data
      handleFormClose()
    } catch (error) {
      console.error('Error saving education level:', error)
    }
  }
  
  // Handle delete
  const handleDelete = async (id: number) => {
    try {
      await educationLevelsController.delete(id)
      handleFormClose()
    } catch (error) {
      console.error('Error deleting education level:', error)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Nivele Educaționale</h1>
        <div className="flex items-center gap-2">
          <Button
            className="flex items-center gap-1"
            onClick={handleAddLevel}
          >
            <PlusCircle className="h-4 w-4" />
            Adaugă nivel
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
          useQueryHook={useEducationalLevels}
          useController={useEducationLevelsController}
          filters={filters}
          searchColumns={["name", "description"]}
          refetchKey="educational-levels-table"
          initialSorting={[{ id: "number", desc: false }]}
        />
      </div>
      
      {/* Education Level Form Sheet */}
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
        >
          <EducationLevelForm
            onClose={handleFormClose}
            onSave={handleSave}
            onDelete={handleDelete}
            onToggleFullScreen={handleToggleFullScreen}
            isFullScreen={formState.isFullScreen}
            isEditMode={formState.isEditMode}
            educationLevel={formState.educationLevel}
            initialData={formState.isEditMode ? undefined : { name: "Nivel Educațional Nou" }}
          />
        </SheetContent>
      </Sheet>
      
      {/* <AddBulkEducationalLevelDialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen} /> */}
    </>
  )
}
