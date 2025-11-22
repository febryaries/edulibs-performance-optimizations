"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Maximize2, Pencil, X, Loader2 } from "lucide-react"
import { Badge, BadgeVariant } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Avatar } from "@/components/ui/avatar"
import { DataTable } from "@/components/ui/data-table/data-table"
import { type ColumnDef } from "@tanstack/react-table"
import { isAdmin, isEvaluator, isModerator, isOwner, useAuth } from "@/lib/auth-context"
import { toast } from "@/components/ui/use-toast";
import { ResourceEvaluation, useResourceCompetenciesCrud, useResourceEvaluationsController, useResourceEvaluationsCrud, useResourcesCrud, useResourceSpecificCompetenciesCrud, useUsersController } from "@/hooks/use-controllers"
import { PaginationParams, UsePaginatedHook } from "@/lib/query-controller"
import { useCallback, useMemo, useState } from "react"
import { useAnexa3, useAnexa6 } from "@/hooks/use-anexe"

interface ResourceViewerProps {
  resource: any
  onClose: () => void
  onToggleFullScreen: () => void
  isFullScreen: boolean
  onEdit?: () => void
  openReviewSheet?: (resource: any, evaluationId?: string | null) => void
}

export function ResourceViewer({ resource: resourceProp, onClose, onToggleFullScreen, isFullScreen, onEdit, openReviewSheet }: ResourceViewerProps) {

  const { useById: useResourceById, useUpdate: updateResource } = useResourcesCrud();
  const { useCreate: createEvaluation, useList: useResourceEvaluations } = useResourceEvaluationsCrud();
  const { useAll: useResourceCompetencies } = useResourceSpecificCompetenciesCrud();

  const defaultEvaluationsFilters = useCallback((params?: PaginationParams): PaginationParams => {
    return {
      ...(params || { pageSize: 10 }),
      filters: resourceProp.id ? [{ column: 'resource_id', operator: 'eq', value: resourceProp.id }] : []
    }
  }, [resourceProp.id])

  const useEvaluations: UsePaginatedHook<ResourceEvaluation> = (params) => useResourceEvaluations({
    ...(params || { pageSize: 10 }),
    filters: resourceProp.id ? [{ column: 'resource_id', operator: 'eq', value: resourceProp.id }] : []
  });
  const useEvaluationsController = () => useResourceEvaluationsController();

  // Fetch evaluations data
  const { data: evaluationsData } = useResourceEvaluations({
    pageSize: 10,
    filters: resourceProp.id ? [{ column: 'resource_id', operator: 'eq', value: resourceProp.id }] : []
  });

  // Get the latest evaluation
  const latestEvaluation = useMemo(() => {
    if (!evaluationsData?.data || evaluationsData.data.length === 0) return null;

    // Sort evaluations by date (newest first) and get the first one
    return [...evaluationsData.data]
      .filter(evaluation => evaluation !== null) // Filter out null values
      .sort((a, b) => {
        // Handle potential null values by using default dates
        const dateA = a?.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b?.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      })[0] || null;
  }, [evaluationsData]);

  // Check if we have any evaluations
  const hasEvaluations = useMemo(() => {
    return evaluationsData?.data && evaluationsData.data.length > 0;
  }, [evaluationsData]);

  const { data: resource } = useResourceById(resourceProp.id);
  const { data: resourceCompetencies } = useResourceCompetencies({
    filters: [{ column: 'resource_id', operator: 'eq', value: resourceProp.id }]
  });
  const { user } = useAuth();

  // Use the anexa hooks
  const { isGenerating: isGeneratingAnexa3, generateDocument: generateAnexa3Document } = useAnexa3();
  const { isGenerating: isGeneratingAnexa6, generateDocument: generateAnexa6Document } = useAnexa6();

  // Permissions
  const canEdit = (isOwner(user, resource) && ["DRAFT", "UNCONFORMABLE"].includes(String(resource?.status))) || isAdmin(user);
  const canEditAsEvaluator = isModerator(user) && String(resource?.status) === "IN_REVIEW";
  // const isEvaluator = (user?.user_metadata.role === "EVALUATOR" && user?.id === resource?.evaluator_id) || user?.user_metadata.role === "ADMINISTRATOR";

  // Helper function to get competency text from resource
  // Helper function to get competency text
  const getCompetencyText = (): string => {
    // Check if we have competencies from the link table
    if (Array.isArray(resourceCompetencies) && resourceCompetencies.length > 0) {
      return resourceCompetencies
        .map((item: any) => {
          if(item.competency_id === -1) {
            return resource?.specific_competence_text || "N/A"
          }
          return item.competency?.name || "N/A"
        })
        .join(", ");
    }
    
    return '';
  };

  const canSendToReview = (isOwner(user, resource) && ["DRAFT", "UNCONFORMABLE"].includes(String(resource?.status))) || (isAdmin(user) && ["DRAFT", "UNCONFORMABLE"].includes(String(resource?.status)));
  const canEvaluate = (isEvaluator(user) && resource?.status === "IN_REVIEW") || isAdmin(user);

  const getStatusClass = (status: string | null | undefined) => {
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

  const usersController = useUsersController()

  const handleSendToReview = async () => {
    updateResource.mutateAsync({ id: resource?.id || '', record: { status: "IN_REVIEW" } });
    if(resource?.evaluator_id) {
      console.log("[test] Should get here 2")
      const evaluator = await usersController.getById(resource?.evaluator_id || '')
      if(evaluator) {
        console.log("[test] Should get here 3")
        // Call /api/notify 
        const notifyResponse = await fetch('/api/notify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resource: {
              id: resource?.id || '',
              title: resource?.title || '',
            },
            recipients: [
              {
                email: evaluator.email,
                name: evaluator.first_name + " " + evaluator.last_name
              },
            ],
          }),
        });
      }
    }

  };

  const handleCreateEvaluation = () => {
    if (!user?.id) {
      toast({ title: "Eroare", description: "Nu ești autentificat!", variant: "destructive" });
      return;
    }
    createEvaluation.mutateAsync(
      {
        resource_id: resource?.id || '',
        user_id: resource?.author_id || '',
        status: "IN_PROGRESS",
        evaluator_id: user.id
      },
      {
        onSuccess: (data) => {
          // // console.log(`[LOG] NEW EVALUATION :: ${data?.id}`);
          const newEvalId = data?.id;
          if (newEvalId) {
            if (openReviewSheet) {
              openReviewSheet(resource, newEvalId);
            }
          }
          toast({ title: "Evaluare creată", description: "Poți începe evaluarea resursei." });
        },
        onError: () => {
          toast({ title: "Eroare la creare evaluare", description: "Nu s-a putut crea evaluarea.", variant: "destructive" });
        }
      }
    );
  };

  // Handle document generation and download
  const handleGenerateDocument = async () => {

    console.log("[LOG] resource:", resource);
    // Map resource data to gen3Schema format
    const documentData = {
      serial_number: resource?.serial_number || 0,
      title: resource?.title || "",
      discipline: resource?.discipline?.name || "",
      competency: getCompetencyText(),
      class: resource?.class?.name || "",
      author: `${resource?.author?.first_name || ""} ${resource?.author?.last_name || ""}`,
      duration: resource?.durata || "1 oră",
      description: resource?.description || "",
      comments: resource?.comentarii || "",
      aggregate: resource?.aggregate || "",
      today: new Date(),
    };

    await generateAnexa3Document(documentData);
  };

  // Handle evaluation document generation and download
  const handleGenerateEvaluationDocument = async () => {
    if (!latestEvaluation) {
      toast({
        title: "Eroare",
        description: "Nu există o evaluare disponibilă",
        variant: "destructive",
      });
      return;
    }

    // Map resource and evaluation data to gen6Schema format
    const documentData = {
      serial_number: resource?.serial_number || 0,
      title: resource?.title || "",
      author: `${resource?.author?.first_name || ""} ${resource?.author?.last_name || ""}`,
      class: resource?.class?.name || "",
      discipline: resource?.discipline?.name || "",
      curricular_area: "", // This field doesn't exist on resource, using empty string
      domain: "", // This field doesn't exist on resource, using empty string
      specific_competency: getCompetencyText(),
      concordance_comment_yes: typeof latestEvaluation?.concordance_ok === 'boolean' && latestEvaluation.concordance_ok ? (latestEvaluation.concordance_comment || "") : "",
      concordance_comment_no: typeof latestEvaluation?.concordance_ok === 'boolean' && !latestEvaluation.concordance_ok ? (latestEvaluation.concordance_comment || "") : "",
      relevance_comment_yes: typeof latestEvaluation?.relevance_ok === 'boolean' && latestEvaluation.relevance_ok ? (latestEvaluation.relevance_comment || "") : "",
      relevance_comment_no: typeof latestEvaluation?.relevance_ok === 'boolean' && !latestEvaluation.relevance_ok ? (latestEvaluation.relevance_comment || "") : "",
      accessibility_comment_yes: typeof latestEvaluation?.accessibility_ok === 'boolean' && latestEvaluation.accessibility_ok ? (latestEvaluation.accessibility_comment || "") : "",
      accessibility_comment_no: typeof latestEvaluation?.accessibility_ok === 'boolean' && !latestEvaluation.accessibility_ok ? (latestEvaluation.accessibility_comment || "") : "",
      correctness_comment_yes: typeof latestEvaluation?.correctness_ok === 'boolean' && latestEvaluation.correctness_ok ? (latestEvaluation.correctness_comment || "") : "",
      correctness_comment_no: typeof latestEvaluation?.correctness_ok === 'boolean' && !latestEvaluation.correctness_ok ? (latestEvaluation.correctness_comment || "") : "",
      value_comment_yes: typeof latestEvaluation?.value_ok === 'boolean' && latestEvaluation.value_ok ? (latestEvaluation.value_comment || "") : "",
      value_comment_no: typeof latestEvaluation?.value_ok === 'boolean' && !latestEvaluation.value_ok ? (latestEvaluation.value_comment || "") : "",
      quality_comment_yes: typeof latestEvaluation?.quality_ok === 'boolean' && latestEvaluation.quality_ok ? (latestEvaluation.quality_comment || "") : "",
      quality_comment_no: typeof latestEvaluation?.quality_ok === 'boolean' && !latestEvaluation.quality_ok ? (latestEvaluation.quality_comment || "") : "",
      evaluation_date: latestEvaluation?.updated_at ? new Date(latestEvaluation.updated_at) : new Date(),
    };

    await generateAnexa6Document(documentData);
  };

  // Handle open review
  function handleOpenReview(row: any) {
    // // console.log("[LOG] handleOpenReview ::", openReviewSheet)
    if (openReviewSheet) {
      openReviewSheet(resource, row.id);
    }
  }

  const evalColumns: ColumnDef<any>[] = [
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
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "created_at",
      header: "Data",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at") as string)
        return date.toLocaleDateString("ro-RO")
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge className={getStatusClass(status)}>
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "updated_at",
      header: "Data completării",
      cell: ({ row }) => {
        const date = row.getValue("updated_at") as string | null
        return date ? new Date(date).toLocaleDateString("ro-RO") : "-"
      },
    },
    {
      accessorKey: "users",
      header: "Evaluator",
      cell: ({ row }) => {
        const user = row.original.users
        return user ? `${user.first_name} ${user.last_name}` : ""
      }
    }
  ];

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 text-gray-400 hover:text-gray-600"
            onClick={onToggleFullScreen}
            aria-label={isFullScreen ? "Exit full screen" : "Enter full screen"}
          >
            <Maximize2 className="h-6 w-6" />
          </Button>
        </div>
        <div className="flex items-center space-x-4">
          {(canEdit || canEditAsEvaluator) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 text-gray-400 hover:text-gray-600"
              onClick={onEdit}
              aria-label="Editează"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <div className="w-px h-6 bg-gray-300"></div>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 text-gray-400 hover:text-gray-600"
            onClick={onClose}
            aria-label="Închide"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{resource?.title}</h1>

        <div className="flex flex-wrap gap-4 mb-6">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleGenerateDocument}
            disabled={isGeneratingAnexa3}
          >
            {isGeneratingAnexa3 ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isGeneratingAnexa3 ? "Generare..." : "Descarcă fișa descriptivă"}
          </Button>

          <div className="mb-6">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleGenerateEvaluationDocument}
              disabled={isGeneratingAnexa6}
            >
              {isGeneratingAnexa6 ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isGeneratingAnexa6 ? "Generare..." : "Descarca fisa evaluare"}
            </Button>
          </div>

          {canEvaluate && resource?.status === "IN_REVIEW" && (!latestEvaluation || latestEvaluation.status !== "IN_PROGRESS") && (
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateEvaluation}>
              Evaluează
            </Button>
          )}
          {canSendToReview && (
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleSendToReview}>
              Trimite spre evaluare
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-y-4 mb-8">
          <div className="text-sm font-medium text-gray-500">Disciplina</div>
          <div>{resource?.discipline?.name || "N/A"}</div>

          <div className="text-sm font-medium text-gray-500">Clasa</div>
          <div>{resource?.class?.name || "N/A"}</div>

          <div className="text-sm font-medium text-gray-500">Data</div>
          <div>{resource?.created_at ? new Date(resource?.created_at).toLocaleDateString("ro-RO") : "N/A"}</div>

          <div className="text-sm font-medium text-gray-500">Status</div>
          <div>
            <Badge variant={resource?.status as BadgeVariant}>
              {resource?.status === "DRAFT" ? "Ciornă" :
                resource?.status === "CONFORMABLE" ? "Conform" :
                  resource?.status === "UNCONFORMABLE" ? "Neconform" :
                    resource?.status === "IN_REVIEW" ? "În evaluare" :
                      resource?.status}
            </Badge>
          </div>

          <div className="text-sm font-medium text-gray-500">Autor</div>
          <div className="flex items-center">
            <Avatar
              size="32"
              variant="01"
              initials={`${resource?.author?.first_name?.charAt(0) || ""}${resource?.author?.last_name?.charAt(0) || ""}`}
              className="mr-2"
            />
            <span>{resource?.author?.first_name || ""} {resource?.author?.last_name || ""}</span>
          </div>

          <div className="text-sm font-medium text-gray-500">Mentor</div>
          <div className="flex items-center">
            {resource?.mentor ? (
              <>
                <Avatar
                  size="32"
                  variant="03"
                  initials={`${resource?.mentor?.first_name?.charAt(0) || ""}${resource?.mentor?.last_name?.charAt(0) || ""}`}
                  className="mr-2"
                />
                <span>{resource?.mentor?.first_name || ""} {resource?.mentor?.last_name || ""}</span>
              </>
            ) : (
              <span className="text-gray-400">Neasignat</span>
            )}
          </div>

          <div className="text-sm font-medium text-gray-500">Evaluator</div>
          <div className="flex items-center">
            {resource?.evaluator ? (
              <>
                <Avatar
                  size="32"
                  variant="05"
                  initials={`${resource?.evaluator?.first_name?.charAt(0) || ""}${resource?.evaluator?.last_name?.charAt(0) || ""}`}
                  className="mr-2"
                />
                <span>{resource?.evaluator?.first_name || ""} {resource?.evaluator?.last_name || ""}</span>
              </>
            ) : (
              <span className="text-gray-400">Neasignat</span>
            )}
          </div>
        </div>

        <Tabs defaultValue={hasEvaluations ? "details" : "details"} className="w-full">
          <TabsList className="border-b border-gray-200 w-full justify-start mb-6">
            <TabsTrigger
              value="details"
              className="pb-2 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none"
            >
              Fișă descriptivă
            </TabsTrigger>
            {hasEvaluations && (
              <TabsTrigger
                value="history"
                className="pb-2 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none"
              >
                Fișă de evaluare
              </TabsTrigger>
            )}
            <TabsTrigger
              value="evaluationHistory"
              className="pb-2 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none"
            >
              Istoric Evaluări
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-0">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Prezentarea resursei educaționale</h2>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Competențe specifice</div>
                <div className="mb-4">
                  {/* Display competencies using the helper function */}
                  {resourceCompetencies?.length == 0 && (
                    <div className="mb-2">
                      N/A
                    </div>
                  )}
                  
                  {/* Display competencies from the link table in detail */}
                  
                  {Array.isArray(resourceCompetencies) && resourceCompetencies.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {resourceCompetencies.map((item: any) => { 
                        
                        if (item.competency?.id === -1 && resource?.specific_competence_text) {
                          return (
                            <div key={item.id} className="bg-gray-50 p-2 rounded-md">
                              {resource?.specific_competence_text}
                            </div>
                          )
                        }

                        return (
                          <div key={item.id} className="bg-gray-50 p-2 rounded-md">
                            {item.competency?.name || "N/A"}
                          </div>
                        )})}
                    </div>
                  )}
                </div>

                <div className="text-sm font-medium text-gray-500 mb-1">Descriere</div>
                <div className="mb-4 whitespace-pre-wrap">{resource?.description || "Fără descriere"}</div>

                {resource?.link && (
                  <>
                    <div className="text-sm font-medium text-gray-500 mb-1">Link</div>
                    <div className="mb-4">
                      <a href={resource?.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {resource?.link}
                      </a>
                    </div>
                  </>
                )}

                {resource?.aggregate && (
                  <>
                    <div className="text-sm font-medium text-gray-500 mb-1">Conținut agregat</div>
                    <div className="mb-4 whitespace-pre-wrap">{resource?.aggregate}</div>
                  </>
                )}

                {resource?.durata && (
                  <>
                    <div className="text-sm font-medium text-gray-500 mb-1">Durată</div>
                    <div className="mb-4">{resource?.durata}</div>
                  </>
                )}

                {resource?.comentarii && (
                  <>
                    <div className="text-sm font-medium text-gray-500 mb-1">Comentarii</div>
                    <div className="mb-4 whitespace-pre-wrap">{resource?.comentarii}</div>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            {!latestEvaluation ? (
              <div className="text-gray-500 text-center py-8">Nu există istoric de evaluări</div>
            ) : (
              <>

                <Accordion type="single" collapsible className="w-full">
                  {/* Concordanța cu programa școlară */}
                  <AccordionItem value="item-1" className={`border rounded-lg mb-4 overflow-hidden ${typeof latestEvaluation?.concordance_ok === 'boolean' && latestEvaluation.concordance_ok ? '' : 'border-red-500'}`}>
                    <AccordionTrigger className={`px-4 py-3 hover:no-underline ${typeof latestEvaluation?.concordance_ok === 'boolean' && latestEvaluation.concordance_ok ? '' : 'text-red-600'}`}>
                      <span className="font-medium text-base">Concordanța cu programa școlară</span>
                    </AccordionTrigger>
                    <AccordionContent className="border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                        <div>
                          <ul className="list-disc pl-5 space-y-2 text-sm">
                            <li>
                              Susținerea activității de formare, dezvoltare și evaluare a competențelor din programa
                              școlară (prin accentul pus pe competențe, nu pe conținuturi)
                            </li>
                            <li>
                              Valorificarea recomandărilor metodologice existente în programa școlară referitoare la
                              strategiile didactice care contribuie predominant la realizarea competențelor
                            </li>
                          </ul>
                        </div>
                        <div className={`p-4 rounded-md ${typeof latestEvaluation?.concordance_ok === 'boolean' && latestEvaluation.concordance_ok ? 'bg-gray-50' : 'bg-red-50'}`}>
                          <div className="flex items-start mb-2">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs mr-2 mt-0.5">
                              i
                            </div>
                            <div>
                              <div className="font-medium text-sm">Comentariu evaluator</div>
                              <div className="text-sm text-gray-600">
                                {typeof latestEvaluation.concordance_comment === 'string' ? latestEvaluation.concordance_comment || "Nu există comentarii pentru această secțiune" : "Nu există comentarii pentru această secțiune"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="h-24"></div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Relevanță */}
                  <AccordionItem value="item-2" className={`border rounded-lg mb-4 overflow-hidden ${typeof latestEvaluation?.relevance_ok === 'boolean' && latestEvaluation.relevance_ok ? '' : 'border-red-500'}`}>
                    <AccordionTrigger className={`px-4 py-3 hover:no-underline ${typeof latestEvaluation?.relevance_ok === 'boolean' && latestEvaluation.relevance_ok ? '' : 'text-red-600'}`}>
                      <span className="font-medium text-base">Relevanță</span>
                    </AccordionTrigger>
                    <AccordionContent className="border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                        <div>
                          <ul className="list-disc pl-5 space-y-2 text-sm">
                            <li>Prezentarea unei teme de actualitate și a unor aspecte semnificative din perspectiva
                              disciplinei de studiu</li>
                            <li>Facilitarea educației incluzive</li>
                            <li>Valorificarea experienței de viață a elevilor</li>
                            <li>
                              Facilitarea învățării active și interactive care pot contribui la creșterea motivației,
                              interesului și implicării elevilor în propria învățare
                            </li>
                          </ul>
                        </div>
                        <div className={`p-4 rounded-md ${typeof latestEvaluation?.relevance_ok === 'boolean' && latestEvaluation.relevance_ok ? 'bg-gray-50' : 'bg-red-50'}`}>
                          <div className="flex items-start mb-2">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs mr-2 mt-0.5">
                              i
                            </div>
                            <div>
                              <div className="font-medium text-sm">Comentariu evaluator</div>
                              <div className="text-sm text-gray-600">
                                {typeof latestEvaluation.relevance_comment === 'string' ? latestEvaluation.relevance_comment || "Nu există comentarii pentru această secțiune" : "Nu există comentarii pentru această secțiune"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="h-24"></div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Accesibilitate */}
                  <AccordionItem value="item-3" className={`border rounded-lg mb-4 overflow-hidden ${typeof latestEvaluation?.accessibility_ok === 'boolean' && latestEvaluation.accessibility_ok ? '' : 'border-red-500'}`}>
                    <AccordionTrigger className={`px-4 py-3 hover:no-underline ${typeof latestEvaluation?.accessibility_ok === 'boolean' && latestEvaluation.accessibility_ok ? '' : 'text-red-600'}`}>
                      <span className="font-medium text-base">Accesibilitate</span>
                    </AccordionTrigger>
                    <AccordionContent className="border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                        <div>
                          <ul className="list-disc pl-5 space-y-2 text-sm">
                            <li>Adecvarea conținutului științific, a limbajului utilizat la grupul țintă vizat (la nivelul de dezvoltare specific vârstei căreia i se adresează)</li>
                            <li>Ușurința citirii, urmăririi și înțelegerii conținutului resursei (având în vedere, densitatea informațiilor, text scris, mesaj în format audio, ritmul de prezentare, timpul de redare pe secvență)</li>
                          </ul>
                        </div>
                        <div className={`p-4 rounded-md ${typeof latestEvaluation?.accessibility_ok === 'boolean' && latestEvaluation.accessibility_ok ? 'bg-gray-50' : 'bg-red-50'}`}>
                          <div className="flex items-start mb-2">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs mr-2 mt-0.5">
                              i
                            </div>
                            <div>
                              <div className="font-medium text-sm">Comentariu evaluator</div>
                              <div className="text-sm text-gray-600">
                                {typeof latestEvaluation.accessibility_comment === 'string' ? latestEvaluation.accessibility_comment || "Nu există comentarii pentru această secțiune" : "Nu există comentarii pentru această secțiune"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="h-24"></div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Corectitudine */}
                  <AccordionItem value="item-4" className={`border rounded-lg mb-4 overflow-hidden ${typeof latestEvaluation?.correctness_ok === 'boolean' && latestEvaluation.correctness_ok ? '' : 'border-red-500'}`}>
                    <AccordionTrigger className={`px-4 py-3 hover:no-underline ${typeof latestEvaluation?.correctness_ok === 'boolean' && latestEvaluation.correctness_ok ? '' : 'text-red-600'}`}>
                      <span className="font-medium text-base">Corectitudine</span>
                    </AccordionTrigger>
                    <AccordionContent className="border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                        <div>
                          <ul className="list-disc pl-5 space-y-2 text-sm">
                            <li>Corectitudinea științifică a conținutului resursei</li>
                            <li>Corectitudinea tehnoredactării</li>
                            <li>Claritatea și coerența prezentării</li>
                          </ul>
                        </div>
                        <div className={`p-4 rounded-md ${typeof latestEvaluation?.correctness_ok === 'boolean' && latestEvaluation.correctness_ok ? 'bg-gray-50' : 'bg-red-50'}`}>
                          <div className="flex items-start mb-2">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs mr-2 mt-0.5">
                              i
                            </div>
                            <div>
                              <div className="font-medium text-sm">Comentariu evaluator</div>
                              <div className="text-sm text-gray-600">
                                {typeof latestEvaluation.correctness_comment === 'string' ? latestEvaluation.correctness_comment || "Nu există comentarii pentru această secțiune" : "Nu există comentarii pentru această secțiune"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="h-24"></div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Valoarea pentru învățare */}
                  <AccordionItem value="item-5" className={`border rounded-lg mb-4 overflow-hidden ${typeof latestEvaluation?.innovation_ok === 'boolean' && latestEvaluation.innovation_ok ? '' : 'border-red-500'}`}>
                    <AccordionTrigger className={`px-4 py-3 hover:no-underline ${typeof latestEvaluation?.innovation_ok === 'boolean' && latestEvaluation.innovation_ok ? '' : 'text-red-600'}`}>
                      <span className="font-medium text-base">Valoarea pentru învățare/Deschideri pentru învățare autentică</span>
                    </AccordionTrigger>
                    <AccordionContent className="border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                        <div>
                          <ul className="list-disc pl-5 space-y-2 text-sm">
                            <li>Stimularea gândirii critice, a creativității elevilor</li>
                            <li>Facilitarea relaționării cu alte domenii ale cunoașterii, deschiderea spre inter- și transdisciplinaritate</li>
                            <li>Valorificarea unor elemente anterior utilizate/cunoscute într-o formă nouă, inedită</li>
                          </ul>
                        </div>
                        <div className={`p-4 rounded-md ${typeof latestEvaluation?.innovation_ok === 'boolean' && latestEvaluation.innovation_ok ? 'bg-gray-50' : 'bg-red-50'}`}>
                          <div className="flex items-start mb-2">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs mr-2 mt-0.5">
                              i
                            </div>
                            <div>
                              <div className="font-medium text-sm">Comentariu evaluator</div>
                              <div className="text-sm text-gray-600">
                                {typeof latestEvaluation.innovation_comment === 'string' ? latestEvaluation.innovation_comment || "Nu există comentarii pentru această secțiune" : "Nu există comentarii pentru această secțiune"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="h-24"></div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Calitate */}
                  <AccordionItem value="item-6" className={`border rounded-lg mb-4 overflow-hidden ${typeof latestEvaluation?.quality_ok === 'boolean' && latestEvaluation.quality_ok ? '' : 'border-red-500'}`}>
                    <AccordionTrigger className={`px-4 py-3 hover:no-underline ${typeof latestEvaluation?.quality_ok === 'boolean' && latestEvaluation.quality_ok ? '' : 'text-red-600'}`}>
                      <span className="font-medium text-base">Calitatea proiectării și realizării resursei</span>
                    </AccordionTrigger>
                    <AccordionContent className="border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                        <div>
                          <ul className="list-disc pl-5 space-y-2 text-sm">
                            <li>Susținerea unei învățări atractive cu rol de optimizare a învățării prin modul de proiectare propus de resursă (de exemplu: durata fiecărei secvențe, durata resursei, dimensiunea și fontul textului, imagini -- număr, tip, claritate, adecvare la conținut --, culori, material audio, unitatea stilistică)</li>
                            <li>Excluderea oricărei forme de discriminare</li>
                          </ul>
                        </div>
                        <div className={`p-4 rounded-md ${typeof latestEvaluation?.quality_ok === 'boolean' && latestEvaluation.quality_ok ? 'bg-gray-50' : 'bg-red-50'}`}>
                          <div className="flex items-start mb-2">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs mr-2 mt-0.5">
                              i
                            </div>
                            <div>
                              <div className="font-medium text-sm">Comentariu evaluator</div>
                              <div className="text-sm text-gray-600">
                                {typeof latestEvaluation.quality_comment === 'string' ? latestEvaluation.quality_comment || "Nu există comentarii pentru această secțiune" : "Nu există comentarii pentru această secțiune"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="h-24"></div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                {/* Add extra spacing at the bottom */}
              
              </>
            )}
          </TabsContent>

          <TabsContent value="evaluationHistory" className="mt-0">
            <DataTable
              columns={evalColumns}
              useQueryHook={useEvaluations}
              useController={useEvaluationsController}
              enableRowSelection={true}
              enableSorting={true}
              enablePagination={true}
              rowCountText="evaluări"
              onRowClick={handleOpenReview}
            />

          </TabsContent>

        </Tabs>
      </div>
    </div>
  )
}
