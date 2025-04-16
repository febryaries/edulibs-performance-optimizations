"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Link, Maximize2, Pencil, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Avatar } from "@/components/ui/avatar"
import { DataTable } from "@/components/ui/data-table/data-table"
import { type ColumnDef } from "@tanstack/react-table"
import { useResourceEvaluations } from "@/hooks/resource-evaluations/use-resource-evaluations"
import { useAuth } from "@/lib/auth-context"
import { useResourceById, useUpdateResource } from "@/hooks/resources/use-resources"
import { useCreateResourceEvaluation } from "@/hooks/resource-evaluations/use-resource-evaluations";
import { useResourceEvaluationById } from "@/hooks/resource-evaluations/use-resource-evaluations";
import { toast } from "@/components/ui/use-toast";

interface ResourceViewerProps {
  resource: any
  onClose: () => void
  onToggleFullScreen: () => void
  isFullScreen: boolean
  onEdit?: () => void
  openReviewSheet?: (resource: any, evaluationId?: string | null) => void
}

// RBAC utility functions
function isOwner(user, resource) {
  return user?.id && resource?.user_id && user.id === resource?.user_id;
}
function isAdmin(user) {
  return user?.user_metadata.role === "ADMINISTRATOR";
}
function isModerator(user) {
  return user?.user_metadata.role === "MODERATOR";
}
function isEvaluator(user) {
  return user?.user_metadata.role === "EVALUATOR";
}

export function ResourceViewer({ resource: resourceProp, onClose, onToggleFullScreen, isFullScreen, onEdit, openReviewSheet, openReviewInSheet }: ResourceViewerProps) {

  const { data: resource } = useResourceById(resourceProp.id);

  const [currentEvaluationId, setCurrentEvaluationId] = useState<string | null>(null);
  const { user } = useAuth();
  const { mutate: updateResource, isLoading: isUpdating } = useUpdateResource();
  const { mutate: createEvaluation, isLoading: isCreatingEvaluation } = useCreateResourceEvaluation();
  // Permissions
  const canEdit = (isOwner(user, resource) && ["DRAFT", "UNCONFORMABLE"].includes(resource?.status)) || isAdmin(user);
  const canSendToReview = (isOwner(user, resource) && ["DRAFT", "UNCONFORMABLE"].includes(resource?.status)) || (isAdmin(user) && ["DRAFT", "UNCONFORMABLE"].includes(resource?.status));
  const canEvaluate = (isEvaluator(user) && resource?.status === "IN_REVIEW") || isAdmin(user);
  const isViewOnly = isModerator(user) || (resource?.status === "IN_REVIEW" && isOwner(user, resource));

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

  const handleSendToReview = () => {
    updateResource({ id: resource?.id || '', resource: { status: "IN_REVIEW" } });
  };

  const handleCreateEvaluation = () => {
    if (!user?.id) {
      toast({ title: "Eroare", description: "Nu ești autentificat!", variant: "destructive" });
      return;
    }
    createEvaluation(
      { resource_id: resource?.id || '', user_id: user.id, status: "IN_PROGRESS" },
      {
        onSuccess: (data) => {
          console.log(`NEW EVALUATION :: ${data?.id}`);
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


  function handleOpenReview(row: any) {
    console.log("handleOpenReview ::", openReviewSheet)
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
      },
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
          {canEdit && (
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
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            {resource?.status === "În evaluare" ? "Descarcă fișa descriptivă" : "Descarcă fișa de evaluare"}
          </Button>
          {canEvaluate && resource?.status === "IN_REVIEW" && (
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateEvaluation} disabled={isCreatingEvaluation}>
              Evaluează
            </Button>
          )}
          {canSendToReview && (
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleSendToReview} disabled={isUpdating}>
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
            <Badge variant="ghost" className={getStatusClass(resource?.status === "DRAFT" ? "Ciornă" :
              resource?.status === "CONFORMABLE" ? "Conform" :
                resource?.status === "UNCONFORMABLE" ? "Neconform" :
                  resource?.status === "IN_REVIEW" ? "În evaluare" :
                    resource?.status)}>
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
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="border-b border-gray-200 w-full justify-start mb-6">
            <TabsTrigger
              value="details"
              className="pb-2 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none"
            >
              Fișă descriptivă
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="pb-2 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none"
            >
              Fișă de evaluare
            </TabsTrigger>
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
                <div className="text-sm font-medium text-gray-500 mb-1">Competența specifică</div>
                <div className="mb-4">{resource?.specific_competency?.name || "N/A"}</div>

                {resource?.status === "CONFORMABLE" && (
                  <div className="bg-gray-50 p-4 rounded-md mb-4">
                    <div className="flex items-start mb-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs mr-2 mt-0.5">
                        i
                      </div>
                      <div>
                        <div className="font-medium text-sm">Comentariu evaluator</div>
                        <div className="text-sm text-gray-600">{resource?.evaluator_comment || "Fără comentarii"}</div>
                      </div>
                    </div>
                  </div>
                )}

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

              <h2 className="text-xl font-semibold text-gray-900">Comentarii</h2>
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">
                  Alte aspecte utile de împărtășit cu privire la utilizarea resursei educaționale în activitatea cu
                  elevii
                </div>
                <div className="mb-4">O descriere scurtă</div>

                {resource?.status === "Conform" && (
                  <div className="bg-gray-50 p-4 rounded-md mb-4">
                    <div className="flex items-start mb-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs mr-2 mt-0.5">
                        i
                      </div>
                      <div>
                        <div className="font-medium text-sm">Comentariu evaluator</div>
                        <div className="text-sm text-gray-600">Acesta este un comentariu de la evaluator</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            {resource?.status === "În evaluare" ? (
              <div className="text-gray-500 text-center py-8">Nu există istoric de evaluări</div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {/* Concordanța cu programa școlară */}
                <AccordionItem value="item-1" className="border rounded-lg mb-4 overflow-hidden">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
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
                      <div className="bg-gray-50 p-4 rounded-md">
                        <div className="flex items-start">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs mr-2 mt-0.5">
                            i
                          </div>
                          <div>
                            <div className="font-medium text-sm">Comentariu evaluator</div>
                            <div className="text-sm text-gray-600">
                              Materialul nu se aliniază pe deplin cerințelor programei școlare, deoarece nu este clar
                              cum sprijină dezvoltarea și evaluarea competențelor, punând un accent mai mare pe
                              conținuturi. De asemenea, nu valorifică suficient strategiile didactice recomandate în
                              programă, ceea ce poate afecta eficiența procesului de învățare. Se recomandă o revizuire
                              a activităților pentru a integra mai clar obiectivele competențiale.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Relevanță */}
                <AccordionItem value="item-2" className="border rounded-lg mb-4 overflow-hidden">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
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
                      <div className="bg-gray-50 p-4 rounded-md">
                        <div className="flex items-start">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs mr-2 mt-0.5">
                            i
                          </div>
                          <div>
                            <div className="font-medium text-sm">Comentariu evaluator</div>
                            <div className="text-sm text-gray-600">
                              Tema abordată este actuală și semnificativă pentru disciplina Arte vizuale și abilități
                              practice, oferind oportunități de învățare interactivă și incluzivă. De asemenea,
                              materialul sprijină implicarea elevilor prin conectarea conținutului la experiențele lor
                              de viață, ceea ce contribuie la creșterea motivației și interesului pentru învățare.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Accesibilitate */}
                <AccordionItem value="item-3" className="border rounded-lg mb-4 overflow-hidden">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <span className="font-medium text-base">Accesibilitate</span>
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
                      <div className="bg-gray-50 p-4 rounded-md">
                        <div className="flex items-start">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs mr-2 mt-0.5">
                            i
                          </div>
                          <div>
                            <div className="font-medium text-sm">Comentariu evaluator</div>
                            <div className="text-sm text-gray-600">
                              Materialul este adecvat pentru vârsta elevilor, utilizând un limbaj clar și ușor de
                              înțeles. Conținutul este structurat într-un mod accesibil, facilitând lectura și urmărirea
                              informațiilor. Densitatea informației este adaptată nivelului de dezvoltare al elevilor,
                              ceea ce asigură o învățare eficientă.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Corectitudine */}
                <AccordionItem value="item-4" className="border rounded-lg mb-4 overflow-hidden">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
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
                      <div className="bg-gray-50 p-4 rounded-md">
                        <div className="flex items-start">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs mr-2 mt-0.5">
                            i
                          </div>
                          <div>
                            <div className="font-medium text-sm">Comentariu evaluator</div>
                            <div className="text-sm text-gray-600">
                              Materialul stimulează creativitatea și gândirea critică a elevilor, încurajând explorarea
                              și experimentarea. De asemenea, permite conexiuni cu alte domenii ale cunoașterii,
                              susținând o abordare interdisciplinară. Prin utilizarea unor concepte familiare într-un
                              mod inovator, elevii sunt încurajați să își dezvolte abilitățile de învățare activă.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Valoarea pentru învățare */}
                <AccordionItem value="item-5" className="border rounded-lg mb-4 overflow-hidden">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <span className="font-medium text-base">
                      Valoarea pentru învățare/Deschideri pentru învățare autentică
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                      <div>
                        <ul className="list-disc pl-5 space-y-2 text-sm">
                          <li>Stimularea gândirii critice, a creativității elevilor</li>
                          <li>
                            Facilitarea relaționării cu alte domenii ale cunoașterii, deschiderea spre inter- și
                            transdisciplinaritate
                          </li>
                          <li>Valorificarea unor elemente anterior utilizate/cunoscute într-o formă nouă, inedită</li>
                        </ul>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <div className="flex items-start">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs mr-2 mt-0.5">
                            i
                          </div>
                          <div>
                            <div className="font-medium text-sm">Comentariu evaluator</div>
                            <div className="text-sm text-gray-600">
                              Materialul stimulează creativitatea și gândirea critică a elevilor, încurajând explorarea
                              și experimentarea. De asemenea, permite conexiuni cu alte domenii ale cunoașterii,
                              susținând o abordare interdisciplinară. Prin utilizarea unor concepte familiare într-un
                              mod inovator, elevii sunt încurajați să își dezvolte abilitățile de învățare activă.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Calitatea proiectării */}
                <AccordionItem value="item-6" className="border rounded-lg mb-4 overflow-hidden">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <span className="font-medium text-base">Calitatea proiectării și realizării resursei</span>
                  </AccordionTrigger>
                  <AccordionContent className="border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                      <div>
                        <ul className="list-disc pl-5 space-y-2 text-sm">
                          <li>
                            Susținerea unei învățări atractive cu rol de optimizare a învățării prin modul de proiectare
                            propus al resursei (de exemplu: durata fiecărei secvențe, durata resursei, dimensiunea și
                            fontul textului, imagini – număr, tip, claritate, adecvare la conținut –, culori, material
                            audio, unitatea stilistică)
                          </li>
                          <li>Excluderea oricărei forme de discriminare</li>
                        </ul>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <div className="flex items-start">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs mr-2 mt-0.5">
                            i
                          </div>
                          <div>
                            <div className="font-medium text-sm">Comentariu evaluator</div>
                            <div className="text-sm text-gray-600">
                              Structura este bună, se utilizează elemente vizuale și textuale care sprijină învățarea
                              într-un mod atractiv. Designul este prietenos, iar resursa evită orice formă de
                              discriminare. Totuși, pentru o optimizare suplimentară, se poate acorda o atenție mai mare
                              echilibrului dintre text, imagini și ritmul de prezentare, astfel încât să mențină un
                              nivel ridicat de interes și accesibilitate pentru elevi.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </TabsContent>

          <TabsContent value="evaluationHistory" className="mt-0">
            <DataTable
              columns={evalColumns}
              useQueryHook={(params) => useResourceEvaluations({ ...(params || { pageSize: 10 }), filters: [{ column: 'resource_id', operator: 'eq', value: resource?.id }]} )}
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
