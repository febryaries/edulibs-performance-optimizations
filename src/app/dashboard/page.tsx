"use client"

import { useEffect, useState, useMemo, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ResourceForm } from "@/components/resource-form"
import { ResourceViewer } from "@/components/resource-viewer"
import { Sheet, SheetContent } from "@/components/ui/sheet-fullscreen"
import {
  Plus,
  Circle,
  BookOpen,
  School,
  BookText
} from "lucide-react"
import { DataTable, type Filter } from "@/components/ui/data-table/data-table"
import { type ColumnDef } from "@tanstack/react-table"
import { useSupabaseBrowser } from "@/utils/supabase/client"
import { ResourcesController } from "@/queries"
import { useToast } from "@/components/ui/use-toast"
import { ResourceFormValues } from "@/schemas/resource-schema"
import { Database } from "@/utils/database.types"
import { useResources } from "@/hooks/resources/use-resources"
import { useCreateResource, useUpdateResource, useDeleteResource } from "@/hooks/resources/use-resources"
import { useDisciplines } from "@/hooks/disciplines/use-disciplines"
import { useClasses } from "@/hooks/classes/use-classes"
import { useSpecificCompetencies } from "@/hooks/specific-competencies/use-specific-competencies"
import { useRefetchContext } from "@/lib/refetch-context"
import { ResourceReview } from "@/components/resource-review"

// Status options for dropdown
const statusOptions = [
  { value: "ciorna", label: "Ciornă" },
  { value: "conform", label: "Conform" },
  { value: "neconform", label: "Neconform" },
  { value: "evaluare", label: "În evaluare" },
]

// Column definitions for visibility toggle
const columnDefinitions = [
  { id: "title", label: "Titlu" },
  { id: "disciplina", label: "Disciplină" },
  { id: "clasa", label: "Clasă" },
  { id: "status", label: "Status" },
  { id: "competenta", label: "Competența specifică" },
  { id: "data", label: "Data" },
]

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isInitialized } = useAuth()
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [mounted, setMounted] = useState(false)
  const [currentView, setCurrentView] = useState<'viewer' | 'form' | 'review' | null>(null)
  const [selectedResource, setSelectedResource] = useState<any>(null)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [isViewerFullScreen, setIsViewerFullScreen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  // Supabase client and controllers setup for resource operations
  const supabase = useSupabaseBrowser()
  const resourcesController = useMemo(() => new ResourcesController(supabase), [supabase])

  // Create stable references for controller configs
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

  // Get the refetch trigger from context
  const { triggerRefetch } = useRefetchContext()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (mounted && isInitialized && !user && !authLoading) {
      router.push("/sign-in")
    }
  }, [user, authLoading, router, mounted, isInitialized])

  const { toast } = useToast()

  // Mutations for resource operations
  const createResourceMutation = useCreateResource()
  const updateResourceMutation = useUpdateResource()
  const deleteResourceMutation = useDeleteResource()

  const handleCreateResource = async () => {
    setSelectedResource(null)
    setIsEditMode(false)
    setCurrentView('form')
  }

  // Handle resource saving (create or update)
  const handleSaveResource = async (formData: ResourceFormValues) => {
    try {
      // Show loading toast
      toast({
        title: "Procesare",
        description: "Se salvează resursa...",
      })

      // Map form data to resource data
      const resourceData = {
        title: formData.title,
        discipline_id: formData.discipline_id ? Number(formData.discipline_id) : null,
        class_id: formData.class_id ? Number(formData.class_id) : null,
        specific_competency_id: formData.specific_competency_id ? Number(formData.specific_competency_id) : null,
        status: formData.status as Database["public"]["Enums"]["resource_status"],
        mentor_id: formData.mentor_id || null,
        description: formData.description || null,
        link: formData.link || null,
        durata: formData.durata || null,
        comentarii: formData.comentarii || null,
      }

      // If we're editing an existing resource, update it
      if (selectedResource && isEditMode) {
        await updateResourceMutation.mutateAsync({
          id: selectedResource.id,
          resource: resourceData
        })
      } else {
        // Otherwise create a new resource
        await createResourceMutation.mutateAsync({
          ...resourceData,
          user_id: user?.id || "",
          author_id: user?.id || null,
          is_public: false,
        })
      }

      // Trigger refetch to update the data table
      triggerRefetch("resources")

      // Show success toast
      toast({
        title: "Succes",
        description: isEditMode
          ? "Resursa a fost actualizată cu succes"
          : "Resursa a fost creată cu succes",
        variant: "success",
      })

      // Close the form
      setCurrentView(null)
      setIsEditMode(false)
      setIsFullScreen(false)
    } catch (error) {
      console.error("Error saving resource:", error)

      // Show error toast
      toast({
        title: "Eroare",
        description: "A apărut o eroare la salvarea resursei",
        variant: "destructive",
      })
    }
  }

  const handleDeleteResource = async (id: number) => {
    try {
      // Show loading toast
      toast({
        title: "Procesare",
        description: "Se șterge resursa...",
      })

      // Delete the resource
      await deleteResourceMutation.mutateAsync(String(id))

      // Trigger refetch to update the data table
      triggerRefetch("resources")

      // Show success toast
      toast({
        title: "Succes",
        description: "Resursa a fost ștearsă cu succes",
        variant: "success",
      })

      // Close the form
      setCurrentView(null)
      setIsEditMode(false)
    } catch (error) {
      console.error("Error deleting resource:", error)

      // Show error toast
      toast({
        title: "Eroare",
        description: "A apărut o eroare la ștergerea resursei",
        variant: "destructive",
      })
    }
  }

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen)
  }

  const toggleViewerFullScreen = () => {
    setIsViewerFullScreen(!isViewerFullScreen)
  }

  const handleViewResource = (resource: any) => {
    setSelectedResource(resource)
    setCurrentView('viewer')
  }

  const handleEditResource = (resource: any) => {
    setSelectedResource(resource)
    setIsEditMode(true)
    setCurrentView('form')
  }

  // Define filters for the data table
  const tableFilters: Filter[] = [
    {
      id: "discipline_id", // Use the actual database column name as the filter ID
      label: "Disciplină",
      type: "controller",
      icon: <BookOpen className="h-4 w-4 text-gray-400" />,
      queryColumn: "discipline_id",
      controller: disciplineControllerConfig,
      controllerHook: useDisciplines
    },
    {
      id: "class_id", // Use the actual database column name as the filter ID
      label: "Clasă",
      type: "controller",
      icon: <School className="h-4 w-4 text-gray-400" />,
      queryColumn: "class_id",
      controller: classControllerConfig,
      controllerHook: useClasses
    },
    {
      id: "specific_competency_id", // Use the actual database column name as the filter ID
      label: "Competența specifică",
      type: "controller",
      icon: <BookText className="h-4 w-4 text-gray-400" />,
      queryColumn: "specific_competency_id",
      controller: competencyControllerConfig,
      controllerHook: useSpecificCompetencies
    },
    {
      id: "created_at", // Use the actual database column name as the filter ID
      label: "Data",
      type: "date",
      icon: <Circle className="h-4 w-4 text-gray-400" />,
      queryColumn: "created_at"
    },
    {
      id: "status", // Use the actual database column name as the filter ID
      label: "Status",
      type: "select",
      options: statusOptions,
      icon: <Circle className="h-4 w-4 text-gray-400" />,
      queryColumn: "status"
    }
  ]

  // Function to get status class
  const getStatusClass = (status: string) => {
    switch (status) {
      case "Ciornă":
        return "text-gray-500 border-gray-300"
      case "Conform":
        return "text-green-600 border-green-200"
      case "Neconform":
        return "text-red-600 border-red-200"
      case "În evaluare":
        return "text-amber-600 border-amber-200"
      default:
        return "text-gray-700 border-gray-300"
    }
  }

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
      accessorKey: "title",
      header: "Titlu",
      cell: ({ row }) => <div className="font-medium text-blue-600">{row.getValue("title")}</div>,
    },
    {
      accessorKey: "discipline.name",
      header: "Disciplină",
    },
    {
      accessorKey: "specific_competency.name",
      header: "Competența specifică",
      cell: ({ row }) => {
        const competency = row.original.specific_competency;
        return competency ? competency.name : "";
      },
    },
    {
      accessorKey: "author.first_name",
      header: "Autor",
      cell: ({ row }) => {
        const user = row.original.author
        return user ? `${user.first_name} ${user.last_name}` : ""
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        // Map the database status to display status
        const dbStatus = row.getValue("status");
        let displayStatus = "Ciornă";

        if (dbStatus === "DRAFT") displayStatus = "Ciornă";
        else if (dbStatus === "CONFORMABLE") displayStatus = "Conform";
        else if (dbStatus === "UNCONFORMABLE") displayStatus = "Neconform";
        else if (dbStatus === "IN_REVIEW") displayStatus = "În evaluare";

        return (
          <Badge className={getStatusClass(displayStatus)}>
            {displayStatus}
          </Badge>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: "Data",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"))
        return date.toLocaleDateString("ro-RO", {
          day: "numeric",
          month: "short",
          year: "numeric"
        })
      },
    }
  ]

  // Add new state for review modal
  const [reviewSheetOpen, setReviewSheetOpen] = useState(false);
  const [reviewResourceId, setReviewResourceId] = useState<string | null>(null);
  const [reviewEvaluationId, setReviewEvaluationId] = useState<string | null>(null);

  // Helper to open review sheet
  const openReviewSheet = (resourceId: string, evaluationId?: string | null) => {
    console.log("Aici...")
    setReviewResourceId(resourceId);
    setReviewEvaluationId(evaluationId || null);
    setReviewSheetOpen(true);
  };

  // Helper to close review sheet
  const closeReviewSheet = () => {
    setReviewSheetOpen(false);
    setReviewResourceId(null);
    setReviewEvaluationId(null);
  };

  // Handles opening the review sheet and sets the correct evaluation id
  const handleOpenReview = (resource: any, evaluationId?: string | null) => {
    setSelectedResource(resource);
    setReviewEvaluationId(evaluationId || null);
    setCurrentView('review');
    setReviewSheetOpen(true);
  };

  // Show loading state while checking authentication or loading resources
  if (authLoading || !mounted || !isInitialized) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  // If no user, the useEffect will handle the redirect
  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Resurse educaționale</h1>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreateResource}>
          <Plus className="mr-1.5 h-4 w-4" />
          Adaugă resursă
        </Button>
      </div>

      {/* Use the DataTable component with useResources hook */}
      <DataTable
        columns={columns}
        useQueryHook={useResources}
        filters={tableFilters}
        searchColumns={["title", "description"]}
        enableRowSelection={true}
        enableSorting={true}
        enablePagination={true}
        rowCountText="resurse"
        visibleColumnsConfig={{
          columnDefinitions: columnDefinitions,
        }}
        onRowClick={handleViewResource}
        getStatusClass={getStatusClass}
        refetchKey="resources"
      />

      {/* Resource Sheet - shows either Form or Viewer based on currentView */}
      <Sheet open={currentView !== null} onOpenChange={() => setCurrentView(null)}>
        <SheetContent className="p-0 overflow-hidden" fullScreen={currentView === 'form' ? isFullScreen : isViewerFullScreen}>
          {currentView === 'form' && (
            <ResourceForm
              onClose={() => setCurrentView(null)}
              onSave={handleSaveResource}
              onDelete={handleDeleteResource}
              onToggleFullScreen={toggleFullScreen}
              isFullScreen={isFullScreen}
              isEditMode={isEditMode}
              resource={selectedResource}
            />
          )}
          {currentView === 'viewer' && selectedResource && (
            <ResourceViewer
              resource={selectedResource}
              onClose={() => setCurrentView(null)}
              onToggleFullScreen={toggleViewerFullScreen}
              isFullScreen={isViewerFullScreen}
              onEdit={() => {
                setIsEditMode(true)
                setCurrentView('form')
              }}
              // Pass both handlers to ResourceViewer
              openReviewSheet={handleOpenReview}
            />
          )}
          {currentView === 'review' && selectedResource && (
            <ResourceReview
              onClose={() => setCurrentView(null)}
              onToggleFullScreen={toggleViewerFullScreen}
              resource={selectedResource}
              evaluationId={reviewEvaluationId || ''}
              isFullScreen={isViewerFullScreen}
            />
          )}
        </SheetContent>
      </Sheet>
      {/* ResourceReviewSheet is now global, not inside ResourceViewer */}

    </div>
  )
}
