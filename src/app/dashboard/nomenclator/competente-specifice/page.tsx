"use client"

import { useState, useMemo } from "react"
import { DataTable, type Filter } from "@/components/ui/data-table/data-table"
import { type ColumnDef } from "@tanstack/react-table"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { ro } from "date-fns/locale"
import { 
  useSpecificCompetenciesCrud, 
  useDisciplinesCrud, 
  useClassesCrud,
  SpecificCompetency, 
  useSpecificCompetenciesController,
  useClassesController,
  useDisciplinesController,
  useGeneralCompetenciesController
} from "@/hooks/use-controllers"
import { Button } from "@/components/ui/button"
import { PlusCircle, Edit, BookOpen, FileText } from "lucide-react"
import { Sheet, SheetContent } from "@/components/ui/sheet-fullscreen"
import { SpecificCompetencyForm } from "@/components/nomenclature/specific-competencies/specific-competency-form"
import { SpecificCompetencyFormValues } from "@/schemas/specific-competency-schema"

// Form state management
type FormState = {
  isOpen: boolean;
  isFullScreen: boolean;
  isEditMode: boolean;
  competency: SpecificCompetency | null;
}

export default function SpecificCompetenciesPage() {
  // Get query client for invalidating queries
  const queryClient = useQueryClient()
  
  // Get controllers
  const { useList: useSpecificCompetencies, useRefetch } = useSpecificCompetenciesCrud()
  const specificCompetenciesController = useSpecificCompetenciesController()
  const classesController = useClassesController()
  const disciplinesController = useDisciplinesController()
  const generalCompetenciesController = useGeneralCompetenciesController()
  
  // Form state
  const [formState, setFormState] = useState<FormState>({
    isOpen: false,
    isFullScreen: false,
    isEditMode: false,
    competency: null,
  })

  // Define columns
  const columns = useMemo<ColumnDef<SpecificCompetency, any>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Competență specifică",
        cell: ({ row }) => <div>{row.getValue("name")}</div>,
      },
      {
        accessorKey: "competency_id",
        header: "Competență generală",
        cell: ({ row }) => {
          // Display the general competency name if available through relationships
          return <div>{row.original?.competency?.name || "-"}</div>
        },
      },
      {
        accessorKey: "competency.discipline.name",
        header: "Disciplină",
        cell: ({ row }) => {
          // Display the discipline name if available through relationships
          return <div>{row.original?.competency?.discipline?.name || "-"}</div>
        },
      },
      {
        accessorKey: "class_id",
        header: "Clasă",
        cell: ({ row }) => <div>{row.original?.class?.name || "-"}</div>,
      },
      {
        accessorKey: "updated_at",
        header: "Data actualizării",
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
                  handleEditCompetency(row.original)
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

  const [disciplines, setDisciplines] = useState<any[]>([])


  const handleDisciplineFilterChange = (value: any) => {
    console.log("Selected discipline:", value)
    setDisciplines(value)
  }

  // Define filters
  const filters = useMemo<Filter[]>(
    () => [
      {
        id: "name",
        label: "Competență",
        type: "select",
        queryColumn: "name",
      },
      {
        id: "competency.discipline_id",
        label: "Disciplină",
        icon: <BookOpen className="h-4 w-4" />,
        type: "controller",
        queryColumn: "competency.discipline_id",
        controller: {
          valueField: "id",
          labelField: "name",
        },
        customHandle: handleDisciplineFilterChange,
        fetchHook: (params) => disciplinesController.getPaginatedData(params),
      },
      {
        id: "class_id",
        label: "Clasă",
        icon: <FileText className="h-4 w-4" />,
        type: "controller",
        queryColumn: "class_id",
        controller: {
          valueField: "id",
          labelField: "name",
        },
        fetchHook: (params) => classesController.getPaginatedData(params),
      },
      {
        id: "updated_at",
        label: "Data",
        type: "date",
        queryColumn: "updated_at",
      },
    ],
    [disciplinesController, classesController]
  )

  // Form handlers
  const handleAddCompetency = () => {
    setFormState({
      isOpen: true,
      isFullScreen: false,
      isEditMode: false,
      competency: null,
    })
  }

  const handleEditCompetency = (competencyData: SpecificCompetency) => {
    setFormState({
      isOpen: true,
      isFullScreen: false,
      isEditMode: true,
      competency: competencyData,
    })
  }

  const handleFormClose = () => {
    // First reset the competency to null to prevent any data fetching for a deleted item
    setFormState(prev => ({ ...prev, isOpen: false, competency: null }))
  }

  const handleToggleFullScreen = () => {
    setFormState(prev => ({ ...prev, isFullScreen: !prev.isFullScreen }))
  }

  // The save functionality is now handled directly in the SpecificCompetencyForm component

  const handleDelete = async (id: number) => {
    try {
      // First reset the form state completely to prevent any data fetching
      setFormState({
        isOpen: false,
        isFullScreen: false,
        isEditMode: false,
        competency: null,
      })
      
      // Add a small delay to ensure the form is fully unmounted
      setTimeout(async () => {
        try {
          // Then delete the record
          await specificCompetenciesController.delete(id)
          // Finally, refresh the data
          useRefetch()
        } catch (error) {
          console.error("Error deleting specific competency:", error)
        }
      }, 100)
    } catch (error) {
      console.error("Error handling deletion:", error)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Competențe specifice</h1>
        <div className="flex items-center gap-2">
          <Button
            className="flex items-center gap-1"
            onClick={handleAddCompetency}
          >
            <PlusCircle className="h-4 w-4" />
            Adaugă competență
          </Button>
        </div>
      </div>
      <div className="mt-6">
        <DataTable
          columns={columns}
          useQueryHook={useSpecificCompetencies}
          useController={useSpecificCompetenciesController}
          filters={filters}
          searchColumns={["name"]}
          refetchKey="specific-competencies-table"
        />
      </div>
      
      {/* Specific Competency Form Sheet */}
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
          title="Formular Competență Specifică"
        >
          <SpecificCompetencyForm
            onClose={handleFormClose}
            onBack={undefined}
            onDelete={handleDelete}
            onToggleFullScreen={handleToggleFullScreen}
            isFullScreen={formState.isFullScreen}
            isEditMode={formState.isEditMode}
            competency={formState.competency}
            onSuccess={() => {
              useRefetch();
            }}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}