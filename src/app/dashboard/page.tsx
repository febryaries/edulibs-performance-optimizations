"use client"

import { useEffect, useState, useMemo } from "react"
// @ts-ignore
import { useRouter } from "next/navigation"
import { useAuth, isAdmin, isModerator, isEvaluator, isStudent } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ResourceForm } from "@/components/resources/resource-form"
import { ResourceViewer } from "@/components/resources/resource-viewer"
import { ResourceReview } from "@/components/resources/resource-review"
import { Sheet, SheetContent } from "@/components/ui/sheet-fullscreen"
import { Avatar } from "@/components/ui/avatar"
import {
  Plus,
  BookOpen,
  School,
  BookText,
  Calendar,
  Tag
} from "lucide-react"
import { DataTable, type Filter } from "@/components/ui/data-table/data-table"
import { type ColumnDef } from "@tanstack/react-table"
import { useSupabaseBrowser } from "@/utils/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { ResourceFormValues } from "@/schemas/resource-schema"
import { Database } from "@/utils/database.types"
import { useRefetchContext } from "@/lib/refetch-context"
import { Resource, ResourceEvaluation, resourceRelationMap, useClassesCrud, useDisciplinesCrud, useResourcesController, useResourcesCrud, useSpecificCompetenciesCrud } from "@/hooks/use-controllers"

// Status options for dropdown
const statusOptions = [
  { value: "DRAFT", label: "Ciornă" },
  { value: "CONFORMABLE", label: "Conform" },
  { value: "UNCONFORMABLE", label: "Neconform" },
  { value: "IN_REVIEW", label: "În evaluare" },
  { value: "SUBMITTED", label: "Spre evaluare" },
]

// Column definitions for visibility toggle
const columnDefinitions = [
  { id: "title", label: "Titlu" },
  { id: "disciplina", label: "Disciplină" },
  { id: "clasa", label: "Clasă" },
  { id: "status", label: "Status" },
  { id: "competenta", label: "Competența specifică" },
  { id: "author", label: "Autor" },
  { id: "evaluator", label: "Evaluator" },
  { id: "data", label: "Data" },
]

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isInitialized } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [currentView, setCurrentView] = useState<'viewer' | 'form' | 'review' | null>(null)
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [isViewerFullScreen, setIsViewerFullScreen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  // Supabase client setup for resource operations
  const supabase = useSupabaseBrowser()

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
  const { 
    useList: useResources, 
    useCreate: createResourceMutation, 
    useUpdate: updateResourceMutation, 
    useDelete: deleteResourceMutation 
  } = useResourcesCrud()

  const {useList: useDisciplines} = useDisciplinesCrud()
  const {useList: useClasses} = useClassesCrud()
  const {useList: useSpecificCompetencies} = useSpecificCompetenciesCrud()

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
        evaluator_id: formData.evaluator_id || null,
        description: formData.description || null,
        link: formData.link || null,
        durata: formData.durata || null,
        comentarii: formData.comentarii || null,
        aggregate: formData.aggregate || null,
      }

      // If we're editing an existing resource, update it
      if (selectedResource && isEditMode) {
        await updateResourceMutation.mutateAsync({
          id: selectedResource.id,
          record: resourceData,
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

  const handleDeleteResource = async (id: number | string) => {
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

  const handleViewResource = (resource: Resource | null) => {
    setSelectedResource(resource)
    setCurrentView('viewer')
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
      icon: <Calendar className="h-4 w-4 text-gray-400" />,
      queryColumn: "created_at"
    },
    {
      id: "status", // Use the actual database column name as the filter ID
      label: "Status",
      type: "select",
      options: statusOptions,
      icon: <Tag className="h-4 w-4 text-gray-400" />,
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
  const columns: ColumnDef<Resource>[] = [
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
        const competency = row.original?.specific_competency;
        return competency ? competency?.name : "";
      },
    },
    {
      accessorKey: "author.first_name",
      header: "Autor",
      cell: ({ row }) => {
        const user = row.original?.author;
        
        if (!user) {
          return (
            <div className="flex items-center gap-2">
              <Avatar 
                size="32" 
                variant="empty"
                alt="Ne asignat"
              />
              <span className="text-gray-500">Ne asignat</span>
            </div>
          );
        }
        
        const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`;
        return (
          <div className="flex items-center gap-2">
            <Avatar 
              size="32" 
              variant={user.avatar_url ? "populated" : "01"}
              initials={initials}
              src={user.avatar_url || undefined}
              alt={`${user.first_name} ${user.last_name}`}
            />
            <span>{`${user.first_name || ''} ${user.last_name || ''}`}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "evaluator.first_name",
      header: "Evaluator",
      cell: ({ row }) => {
        const evaluator = row.original?.evaluator;
        
        if (!evaluator) {
          return (
            <div className="flex items-center gap-2">
              <Avatar 
                size="32" 
                variant="empty"
                alt="Ne asignat"
              />
              <span className="text-gray-500">Ne asignat</span>
            </div>
          );
        }
        
        const initials = `${evaluator.first_name?.[0] || ''}${evaluator.last_name?.[0] || ''}`;
        return (
          <div className="flex items-center gap-2">
            <Avatar 
              size="32" 
              variant={evaluator.avatar_url ? "populated" : "01"}
              initials={initials}
              src={evaluator.avatar_url || undefined}
              alt={`${evaluator.first_name} ${evaluator.last_name}`}
            />
            <span>{`${evaluator.first_name || ''} ${evaluator.last_name || ''}`}</span>
          </div>
        );
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

  // Filter columns based on user role
  const filteredColumns = useMemo(() => {
    // If user is not a student, show all columns
    if (user && (isAdmin(user) || isModerator(user) || isEvaluator(user))) {
      return columns;
    }
    // Otherwise, hide the evaluator column
    return columns.filter(col => (col as any).accessorKey !== "evaluator.first_name");
  }, [user, columns]);

  // Handles opening the review sheet and sets the correct evaluation id
  const handleOpenReview = (resource: Resource, evaluationId?: string | null) => {
    setSelectedResource(resource);
    setSelectedEvaluationId(evaluationId || null);
    setCurrentView('review');
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
        {user && (isStudent(user) || isAdmin(user)) && (
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreateResource}>
            <Plus className="mr-1.5 h-4 w-4" />
            Adaugă resursă
          </Button>
        )}
      </div>

      {/* Use the DataTable component with useResources hook */}
      <DataTable<Resource, any, 'resources', typeof resourceRelationMap>
        columns={filteredColumns}
        useQueryHook={useResources}
        useController={useResourcesController}
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
        <SheetContent mobileFullScreen={true} className="p-0 overflow-hidden" fullScreen={currentView === 'form' ? isFullScreen : isViewerFullScreen}>
          {currentView === 'form' && (
            <ResourceForm
              onClose={() => setCurrentView(null)}
              onBack={() => setCurrentView('viewer')}
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
                setIsFullScreen(isViewerFullScreen)
                setCurrentView('form')
              }}
              openReviewSheet={handleOpenReview}
            />
          )}
          {currentView === 'review' && selectedResource && (
            <ResourceReview
              onClose={() => setCurrentView(null)}
              onBack={() => setCurrentView('viewer')}
              onToggleFullScreen={toggleViewerFullScreen}
              resource={selectedResource}
              evaluationId={selectedEvaluationId || ""}
              isFullScreen={isViewerFullScreen}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
