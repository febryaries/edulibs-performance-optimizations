"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
// @ts-ignore
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BulkUploadResourcesDialog } from "@/components/resources/bulk-upload-resources";
import {
  useAuth,
  isAdmin,
  isModerator,
  isEvaluator,
  isStudent,
  isFormator,
} from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Lazy load heavy components to reduce initial bundle size
const ResourceForm = dynamic(() =>
  import("@/components/resources/resource-form").then((mod) => ({
    default: mod.ResourceForm,
  }))
);
const ResourceViewer = dynamic(() =>
  import("@/components/resources/resource-viewer").then((mod) => ({
    default: mod.ResourceViewer,
  }))
);
const ResourceReview = dynamic(() =>
  import("@/components/resources/resource-review").then((mod) => ({
    default: mod.ResourceReview,
  }))
);
import { Sheet, SheetContent } from "@/components/ui/sheet-fullscreen";
import { Avatar } from "@/components/ui/avatar";
import {
  Plus,
  BookOpen,
  School,
  BookText,
  Calendar,
  Tag,
  Upload,
  User,
} from "lucide-react";
import { DataTable, type Filter } from "@/components/ui/data-table/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { useSupabaseBrowser } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ResourceFormValues } from "@/schemas/resource-schema";
import { Database } from "@/utils/database.types";
import { useRefetchContext } from "@/lib/refetch-context";
import {
  Resource,
  resourceRelationMap,
  useClassesCrud,
  useDisciplinesCrud,
  useResourcesController,
  useResourcesCrud,
  useSpecificCompetenciesCrud,
  useResourceSpecificCompetenciesCrud,
  type SpecificCompetency,
  useResourceSpecificCompetenciesController,
  useDisciplinesController,
  useClassesController,
  useSpecificCompetenciesController,
  useUsersController,
} from "@/hooks/use-controllers";

// Status options for dropdown
const statusOptions = [
  { value: "DRAFT", label: "Ciornă" },
  { value: "CONFORMABLE", label: "Conform" },
  { value: "UNCONFORMABLE", label: "Neconform" },
  { value: "IN_REVIEW", label: "În evaluare" },
  { value: "SUBMITTED", label: "Spre evaluare" },
];

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
];

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user, isLoading: authLoading, isInitialized } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [currentView, setCurrentView] = useState<
    "viewer" | "form" | "review" | null
  >(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null
  );
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<
    string | null
  >(null);
  const [isFullScreen, setIsFullScreen] = useState(true);
  const [isViewerFullScreen, setIsViewerFullScreen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isBulkUploadResourcesDialogOpen, setIsBulkUploadResourcesDialogOpen] =
    useState(false);
  const [isLoadingResource, setIsLoadingResource] = useState(false);
  const processedResourceIdRef = useRef<string | null>(null);
  const shouldProcessUrlChangesRef = useRef(true);

  // Create stable references for controller configs
  const disciplineControllerConfig = useMemo(
    () => ({
      valueField: "id" as const,
      labelField: "name" as const,
      pageSize: 5,
    }),
    []
  );

  const classControllerConfig = useMemo(
    () => ({
      valueField: "id" as const,
      labelField: "name" as const,
      pageSize: 5,
    }),
    []
  );

  const authorControllerConfig = useMemo(
    () => ({
      valueField: "id" as const,
      labelField: "email" as const,
      pageSize: 10,
      searchColumns: ["email"],
    }),
    []
  );

  const competencyControllerConfig = useMemo(
    () => ({
      valueField: "id" as const,
      labelField: "name" as const,
      pageSize: 5,
    }),
    []
  );

  // Get the refetch trigger from context
  const { triggerRefetch } = useRefetchContext();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (mounted && isInitialized && !user && !authLoading) {
      router.push("/sign-in");
    }
  }, [user, authLoading, router, mounted, isInitialized]);

  // handleOpenReview is defined below

  const resourceController = useResourcesController();

  const clearResourceFromUrl = () => {
    // Temporarily disable URL processing to prevent reopening
    shouldProcessUrlChangesRef.current = false;

    router.push(pathname);
    setCurrentView(null);
    processedResourceIdRef.current = null;

    // Re-enable URL processing after a short delay
    setTimeout(() => {
      shouldProcessUrlChangesRef.current = true;
    }, 100);
  };

  // Handle resource_id URL parameter
  useEffect(() => {
    const fetchResourceFromUrl = async () => {
      if (!mounted || !user || authLoading || !isInitialized) return;
      if (!shouldProcessUrlChangesRef.current) return;

      const resourceId = searchParams.get("resource_id");

      // If no resource_id in URL, just return (don't clear anything)
      if (!resourceId) {
        return;
      }

      // If we've already processed this resource_id, don't fetch again
      if (processedResourceIdRef.current === resourceId) {
        return;
      }

      try {
        setIsLoadingResource(true);

        const resource = await resourceController.getById(resourceId);

        if (resource) {
          setSelectedResource(resource);
          setCurrentView("viewer");
          // Mark this resource_id as processed
          processedResourceIdRef.current = resourceId;
        }
      } catch (error) {
        console.error("Error fetching resource:", error);
      } finally {
        setIsLoadingResource(false);
      }
    };

    fetchResourceFromUrl();
  }, [
    searchParams,
    mounted,
    user,
    authLoading,
    isInitialized,
    resourceController,
  ]);

  const { toast } = useToast();

  // Mutations for resource operations
  const {
    useList: useResources,
    useCreate: createResourceMutation,
    useUpdate: updateResourceMutation,
    useDelete: deleteResourceMutation,
    invalidateById: invalidateResourceById,
    useRefetch: invalidateResourcesQueries,
  } = useResourcesCrud();

  const disciplineController = useDisciplinesController();
  const classController = useClassesController();
  const usersController = useUsersController();
  const competencyController = useSpecificCompetenciesController();

  const handleCreateResource = async () => {
    setSelectedResource(null);
    setIsEditMode(false);
    setCurrentView("form");
  };

  // Get the resource-competency CRUD hooks
  const {
    useCreate: useCreateResourceCompetency,
    useDelete: useDeleteResourceCompetency,
    useDeleteMany: useDeleteManyResourceCompetencies,
  } = useResourceSpecificCompetenciesCrud();

  const resourceCompetenciesController =
    useResourceSpecificCompetenciesController();

  // Handle resource saving (create or update)
  const handleSaveResource = async (formData: any) => {
    try {
      // Show loading toast
      toast({
        title: "Procesare",
        description: "Se salvează resursa...",
      });

      // Extract the selected competencies from the form data
      const { selectedCompetencies, ...data } =
        formData as ResourceFormValues & {
          selectedCompetencies: SpecificCompetency[];
        };

      // Map form data to resource data
      const resourceData = {
        title: data.title,
        discipline_id: data.discipline_id ? Number(data.discipline_id) : null,
        discipline_text: data.discipline_text || null,
        class_id: data.class_id ? Number(data.class_id) : null,
        status: data.status as Database["public"]["Enums"]["resource_status"],
        mentor_id: data.mentor_id || null,
        evaluator_id: data.evaluator_id || null,
        description: data.description || null,
        specific_competence_text: data.specific_competence_text || null,
        link: data.link || null,
        durata: data.durata || null,
        comentarii: data.comentarii || null,
        aggregate: data.aggregate || null,
      };

      // Variable to store the resource ID for competency links
      let resourceId: string | null = null;

      // If we're editing an existing resource, update it
      if (selectedResource && isEditMode) {
        await updateResourceMutation.mutateAsync({
          id: selectedResource.id,
          record: resourceData,
        });
        resourceId = selectedResource.id;
      } else {
        // Otherwise create a new resource
        const newResource = await createResourceMutation.mutateAsync({
          ...resourceData,
          user_id: user?.id || "",
          author_id: user?.id || null,
          is_public: false,
        });
        resourceId = newResource?.id || null;
      }

      // Handle resource-competency relationships if we have a valid resource ID
      if (resourceId && selectedCompetencies) {
        // Get current resource-competency links
        const currentLinks = await resourceCompetenciesController.getAll({
          filters: [
            { column: "resource_id", operator: "eq", value: resourceId },
          ],
        });

        // Extract the IDs from current links and selected competencies
        const currentCompetencyIds = Array.isArray(currentLinks)
          ? currentLinks.map((link) => link?.competency_id)
          : [];

        const selectedCompetencyIds = Array.isArray(selectedCompetencies)
          ? selectedCompetencies.map((comp) => comp?.id)
          : [];

        // Safely filter links to delete - those whose competency IDs are not in the selected list
        const toDelete = currentLinks.filter((link) => {
          const linkCompId = link?.competency_id;
          return (
            linkCompId !== undefined &&
            !selectedCompetencyIds.includes(linkCompId)
          );
        });

        // Safely filter competencies to add - those whose IDs are not in the current links
        const toAdd = selectedCompetencies.filter((comp) => {
          const compId = comp?.id;
          return compId !== undefined && !currentCompetencyIds.includes(compId);
        });

        // Create new links for newly selected competencies
        for (const competencyId of selectedCompetencyIds) {
          if (competencyId && !currentCompetencyIds.includes(competencyId)) {
            await useCreateResourceCompetency.mutateAsync({
              resource_id: resourceId,
              competency_id: competencyId,
            });
          }
        }

        // Delete links for deselected competencies
        if (Array.isArray(currentLinks)) {
          for (const link of currentLinks) {
            if (
              link &&
              typeof link.competency_id === "number" &&
              !selectedCompetencyIds.includes(link.competency_id)
            ) {
              await useDeleteResourceCompetency.mutateAsync(link.id);
            }
          }
        }

        invalidateResourceById(resourceId);
      }

      // Invalidate all resources queries to refresh the table
      invalidateResourcesQueries();

      // Show success toast
      toast({
        title: "Succes",
        description: isEditMode
          ? "Resursa a fost actualizată cu succes."
          : "Resursa a fost creată cu succes.",
        variant: "success",
      });

      // Close the form
      setCurrentView(null);
      setIsEditMode(false);
      setIsFullScreen(false);
    } catch (error) {
      console.error("Error saving resource:", error);

      // Show error toast
      toast({
        title: "Eroare",
        description: "A apărut o eroare la salvarea resursei",
        variant: "destructive",
      });
    }
  };

  const handleDeleteResource = async (id: number | string) => {
    try {
      // Show loading toast
      toast({
        title: "Procesare",
        description: "Se șterge resursa...",
      });

      // Delete the resource
      await useDeleteManyResourceCompetencies.mutateAsync([
        { column: "resource_id", operator: "eq", value: id },
      ]);

      await deleteResourceMutation.mutateAsync(String(id));

      // Trigger refetch to update the data table
      triggerRefetch("resources");

      // Show success toast
      toast({
        title: "Succes",
        description: "Resursa a fost ștearsă cu succes",
        variant: "success",
      });

      // Close the form
      setCurrentView(null);
      setIsEditMode(false);
    } catch (error) {
      console.error("Error deleting resource:", error);

      // Show error toast
      toast({
        title: "Eroare",
        description: "A apărut o eroare la ștergerea resursei",
        variant: "destructive",
      });
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const toggleViewerFullScreen = () => {
    setIsViewerFullScreen(!isViewerFullScreen);
  };

  const handleViewResource = (resource: Resource | null) => {
    setSelectedResource(resource);
    setCurrentView("viewer");

    // Update URL to include resource_id
    if (resource?.id) {
      if (searchParams.get("resource_id") !== resource.id) {
        // Create a new URLSearchParams object
        const params = new URLSearchParams(window.location.search);
        // Set the resource_id parameter
        params.set("resource_id", resource.id);
        router.push(pathname + "?" + params.toString());
      }
    }
  };

  // Define filters for the data table
  const tableFilters: Filter[] = [
    {
      id: "discipline_id", // Use the actual database column name as the filter ID
      label: "Disciplină",
      type: "controller",
      icon: <BookOpen className="h-4 w-4 text-gray-400" />,
      queryColumn: "discipline_id",
      controller: disciplineControllerConfig,
      fetchHook: (params) => disciplineController.getPaginatedData(params),
    },
    {
      id: "class_id", // Use the actual database column name as the filter ID
      label: "Clasă",
      type: "controller",
      icon: <School className="h-4 w-4 text-gray-400" />,
      queryColumn: "class_id",
      controller: classControllerConfig,
      fetchHook: (params) => classController.getPaginatedData(params),
    },
    // Author
    // Mentor
    ...(user && (isAdmin(user) || isEvaluator(user) || isFormator(user))
      ? [
          {
            id: "author_id", // Use the actual database column name as the filter ID
            label: "Autor",
            type: "controller" as const,
            icon: <User className="h-4 w-4 text-gray-400" />,
            queryColumn: "author_id",
            controller: authorControllerConfig,
            fetchHook: async (params) => {
              // Use async/await to properly handle the Promise
              try {
                const result = await usersController.getPaginatedData({
                  ...params,
                  filters: [
                    { column: "role", operator: "eq", value: "STUDENT" },
                  ],
                  searchColumns: ["email", "first_name", "last_name"],
                });
                return result;
              } catch (error) {
                console.error("Error fetching author data:", error);
                return {
                  data: [],
                  nextCursor: null,
                  prevCursor: null,
                  count: 0,
                };
              }
            },
          },
        ]
      : []),

    ...(user && (isAdmin(user) || isEvaluator(user))
      ? [
          {
            id: "mentor_id", // Use the actual database column name as the filter ID
            label: "Mentor",
            type: "controller" as const,
            icon: <User className="h-4 w-4 text-gray-400" />,
            queryColumn: "mentor_id",
            controller: authorControllerConfig,
            fetchHook: async (params) => {
              // Use async/await to properly handle the Promise
              try {
                const result = await usersController.getPaginatedData({
                  ...params,
                  filters: [
                    { column: "role", operator: "eq", value: "FORMATOR" },
                  ],
                  searchColumns: ["email", "first_name", "last_name"],
                });
                return result;
              } catch (error) {
                console.error("Error fetching author data:", error);
                return {
                  data: [],
                  nextCursor: null,
                  prevCursor: null,
                  count: 0,
                };
              }
            },
          },
        ]
      : []),

    // Evaluator
    ...(user && isAdmin(user)
      ? [
          {
            id: "evaluator_id", // Use the actual database column name as the filter ID
            label: "Evaluator",
            type: "controller" as const,
            icon: <User className="h-4 w-4 text-gray-400" />,
            queryColumn: "evaluator_id",
            controller: authorControllerConfig,
            fetchHook: async (params) => {
              // Use async/await to properly handle the Promise
              try {
                const result = await usersController.getPaginatedData({
                  ...params,
                  filters: [
                    { column: "role", operator: "eq", value: "EVALUATOR" },
                  ],
                  searchColumns: ["email", "first_name", "last_name"],
                });
                return result;
              } catch (error) {
                console.error("Error fetching author data:", error);
                return {
                  data: [],
                  nextCursor: null,
                  prevCursor: null,
                  count: 0,
                };
              }
            },
          },
        ]
      : []),
    {
      id: "specific_competency_id", // Use the actual database column name as the filter ID
      label: "Competențe specifice",
      type: "controller",
      icon: <BookText className="h-4 w-4 text-gray-400" />,
      queryColumn: "specific_competency_id",
      controller: competencyControllerConfig,
      fetchHook: (params) => competencyController.getPaginatedData(params),
    },
    {
      id: "created_at", // Use the actual database column name as the filter ID
      label: "Data",
      type: "date",
      icon: <Calendar className="h-4 w-4 text-gray-400" />,
      queryColumn: "created_at",
    },
    {
      id: "status", // Use the actual database column name as the filter ID
      label: "Status",
      type: "select",
      options: statusOptions,
      icon: <Tag className="h-4 w-4 text-gray-400" />,
      queryColumn: "status",
    },
  ];

  // Function to get status class
  const getStatusClass = (status: string) => {
    switch (status) {
      case "Ciornă":
        return "text-gray-500 border-gray-300";
      case "Conform":
        return "text-green-600 border-green-200";
      case "Neconform":
        return "text-red-600 border-red-200";
      case "În evaluare":
        return "text-amber-600 border-amber-200";
      default:
        return "text-gray-700 border-gray-300";
    }
  };

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
      cell: ({ row }) => (
        <div className="font-medium text-blue-600">{row.getValue("title")}</div>
      ),
    },
    // {
    //   accessorKey: "education_level.name",
    //   header: "Nivel de educație",
    // },
    {
      accessorKey: "discipline.name",
      header: "Disciplină",
    },
    {
      id: "specific_competencies", // Use id instead of accessorKey for complex nested data
      header: "Competențe specifice",
      accessorFn: (row) => row.specific_competencies, // Custom accessor function
      cell: ({ row }) => {
        const competencies = row.original?.specific_competencies;
        return (
          <>
            {Array.isArray(competencies) && competencies.length > 0 && (
              <div className="space-y-2 mt-2">
                {competencies.map((item: any) => {
                  if (item.competency_id === -1) {
                    return (
                      <div key={item.id} className="bg-gray-50 p-2 rounded-md">
                        {item.competency?.number +
                          " " +
                          item.competency?.name +
                          " : " +
                          (row.original?.specific_competence_text &&
                          row.original?.specific_competence_text?.trim() != ""
                            ? row.original?.specific_competence_text
                            : "N/A")}
                      </div>
                    );
                  }
                  return (
                    <div key={item.id} className="bg-gray-50 p-2 rounded-md">
                      {item.competency?.number
                        ? item.competency?.number + " " + item.competency?.name
                        : "N/A"}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        );
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
              <Avatar size="32" variant="empty" alt="Ne asignat" />
              <span className="text-gray-500">Ne asignat</span>
            </div>
          );
        }

        const initials = `${user?.first_name?.[0] || ""}${
          user?.last_name?.[0] || ""
        }`;
        return (
          <div className="flex items-center gap-2">
            <Avatar
              size="32"
              variant={user?.avatar_url ? "populated" : "01"}
              initials={initials}
              src={user?.avatar_url || undefined}
              alt={`${user?.first_name} ${user?.last_name}`}
            />
            <span>{`${user?.first_name || ""} ${user?.last_name || ""}`}</span>
          </div>
        );
      },
    },
    {
      id: "evaluator", // Use id instead of accessorKey for nested data
      header: "Evaluator",
      accessorFn: (row) => row.evaluator, // Custom accessor function
      cell: ({ row }) => {
        const evaluator = row.original?.evaluator;

        if (!evaluator) {
          return (
            <div className="flex items-center gap-2">
              <Avatar size="32" variant="empty" alt="Ne asignat" />
              <span className="text-gray-500">Ne asignat</span>
            </div>
          );
        }

        const initials = `${evaluator.first_name?.[0] || ""}${
          evaluator.last_name?.[0] || ""
        }`;
        return (
          <div className="flex items-center gap-2">
            <Avatar
              size="32"
              variant={evaluator.avatar_url ? "populated" : "01"}
              initials={initials}
              src={evaluator.avatar_url || undefined}
              alt={`${evaluator.first_name} ${evaluator.last_name}`}
            />
            <span>{`${evaluator.first_name || ""} ${
              evaluator.last_name || ""
            }`}</span>
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
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Data",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return date.toLocaleDateString("ro-RO", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      },
    },
  ];

  // Filter columns based on user role
  const filteredColumns = useMemo(() => {
    // If user is not a student, show all columns
    if (user && (isAdmin(user) || isModerator(user) || isEvaluator(user))) {
      return columns;
    }
    // Otherwise, hide the evaluator column
    return columns.filter((col) => (col as any).id !== "evaluator");
  }, [user, columns]);

  // Handles opening the review sheet and sets the correct evaluation id
  const handleOpenReview = (
    resource: Resource,
    evaluationId?: string | null
  ) => {
    setSelectedResource(resource);
    setSelectedEvaluationId(evaluationId || null);
    setCurrentView("review");

    // Update URL to include resource_id
    if (resource?.id) {
      // Create a new URLSearchParams object
      const params = new URLSearchParams(window.location.search);
      // Set the resource_id parameter
      params.set("resource_id", resource.id);
      // Update the URL without causing a page reload
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState({}, "", newUrl);
    }
  };

  // Show loading state while checking authentication or loading resources
  if (authLoading || !mounted || !isInitialized) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // If no user, the useEffect will handle the redirect
  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Resurse educaționale
        </h1>
        <div className="flex gap-2">
          {/* {user && isAdmin(user) && (
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setIsBulkUploadResourcesDialogOpen(true)}
            >
              <Upload className="mr-1.5 h-4 w-4" />
              Încărcare bulk
            </Button>
          )} */}
          {user && (isStudent(user) || isAdmin(user)) && (
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleCreateResource}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Adaugă resursă
            </Button>
          )}
        </div>
      </div>

      {/* Use the DataTable component with useResources hook */}
      <DataTable<Resource, any, "resources", typeof resourceRelationMap>
        columns={filteredColumns}
        useQueryHook={useResources}
        useController={useResourcesController}
        controllerConfig={{
          fields: [
            "id",
            "title",
            "specific_competence_text",
            "author_id",
            "class_id",
            "discipline_id",
            "status",
            "created_at",
          ] as const,
          relations: {
            resources_author_id_fkey: {
              alias: "author",
              referencedTable: "users",
              isOneToMany: false,
            },
            resources_discipline_id_fkey: {
              alias: "discipline",
              referencedTable: "disciplines",
              isOneToMany: false,
            },
            resources_evaluator_id_fkey: {
              alias: "evaluator",
              referencedTable: "users",
              isOneToMany: false,
            },
            resource_competency_resource_id_fkey: {
              alias: "specific_competencies",
              referencedTable: "resource_competency",
              isOneToMany: true,
              nested: "competency:specific_competencies(*)",
            },
          } as const,
        }}
        filters={tableFilters}
        searchColumns={["title"]}
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
      <Sheet
        open={currentView !== null}
        onOpenChange={() => setCurrentView(null)}
      >
        <SheetContent
          mobileFullScreen={true}
          className="p-0 overflow-hidden"
          fullScreen={
            currentView === "form" ? isFullScreen : isViewerFullScreen
          }
        >
          {currentView === "form" && (
            <ResourceForm
              onClose={() => clearResourceFromUrl()}
              onBack={() => setCurrentView("viewer")}
              onSave={handleSaveResource}
              onDelete={handleDeleteResource}
              onToggleFullScreen={toggleFullScreen}
              isFullScreen={isFullScreen}
              isEditMode={isEditMode}
              resource={selectedResource}
            />
          )}
          {currentView === "viewer" && selectedResource && (
            <ResourceViewer
              resource={selectedResource}
              onClose={() => clearResourceFromUrl()}
              onToggleFullScreen={toggleViewerFullScreen}
              isFullScreen={isViewerFullScreen}
              onEdit={() => {
                setIsEditMode(true);
                setIsFullScreen(isViewerFullScreen);
                setCurrentView("form");
              }}
              openReviewSheet={handleOpenReview}
            />
          )}
          {currentView === "review" && selectedResource && (
            <ResourceReview
              onClose={() => clearResourceFromUrl()}
              onBack={() => setCurrentView("viewer")}
              onToggleFullScreen={toggleViewerFullScreen}
              resource={selectedResource}
              evaluationId={selectedEvaluationId || ""}
              isFullScreen={isViewerFullScreen}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Bulk Upload Resources Dialog */}
      <BulkUploadResourcesDialog
        open={isBulkUploadResourcesDialogOpen}
        onOpenChange={setIsBulkUploadResourcesDialogOpen}
      />
    </div>
  );
}
