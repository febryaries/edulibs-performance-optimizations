"use client"

import { useForm } from "react-hook-form"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Pencil, X, Maximize2, Save } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Avatar } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useResourceEvaluationById } from "@/hooks/resource-evaluations/use-resource-evaluations"
import { ResourceEvaluationWithRelations, ResourceWithUser } from "@/queries"
import { useResourceById } from "@/hooks/resources/use-resources"
import { useAuth } from "@/lib/auth-context"
import { useUpdateResourceEvaluation } from "@/hooks/resource-evaluations/use-resource-evaluations"
import { toast } from "@/components/ui/use-toast"


interface ResourceReviewProps {
  resource: ResourceWithUser;
  evaluationId: string
  onClose: () => void
  onToggleFullScreen: () => void
  isFullScreen: boolean
  onEdit?: () => void
}

export function ResourceReview({
  resource: resourceProp,
  evaluationId,
  onClose,
  onToggleFullScreen,
  isFullScreen,
  onEdit
}: ResourceReviewProps) {

  const { data: resource } = resourceProp ? useResourceById(resourceProp.id) : { data: undefined };
  const { data: evaluation } = useResourceEvaluationById(evaluationId)
  console.log(`resource ${JSON.stringify(resource)}`);

  const { user } = useAuth();
  const { mutate: updateEvaluation } = useUpdateResourceEvaluation();
  
  const isEvaluator = (user?.user_metadata.role === "EVALUATOR" && user?.id === evaluation?.user_id) || user?.user_metadata.role === "ADMINISTRATOR";

  type EvaluationFormData = {
    status: 'CONFORMABLE' | 'UNCONFORMABLE' | 'IN_PROGRESS';
    concordance_comment?: string | null;
    relevance_comment?: string | null;
    accessibility_comment?: string | null;
    correctness_comment?: string | null;
    value_comment?: string | null;
    quality_comment?: string | null;
    specific_competence_comment?: string | null;
    description_comment?: string | null;
    duration_comment?: string | null;
    link_comment?: string | null;
    comment_comment?: string | null;
  };

  const { register, handleSubmit, setValue, watch, formState: { isDirty, isSubmitting } } = useForm<EvaluationFormData>({
    defaultValues: {
      status: "IN_PROGRESS",
      concordance_comment: evaluation?.concordance_comment || "",
      relevance_comment: evaluation?.relevance_comment || "",
      accessibility_comment: evaluation?.accessibility_comment || "",
      correctness_comment: evaluation?.correctness_comment || "",
      value_comment: evaluation?.value_comment || "",
      quality_comment: evaluation?.quality_comment || "",
      specific_competence_comment: evaluation?.specific_competence_comment || "",
      description_comment: evaluation?.description_comment || "",
      duration_comment: evaluation?.duration_comment || "",
      link_comment: evaluation?.link_comment || "",
      comment_comment: evaluation?.comment_comment || "",
    }
  });

  useEffect(() => {
    if (evaluation) {
      setValue("status", evaluation.status);
      if (evaluation.concordance_comment) setValue("concordance_comment", evaluation.concordance_comment);
      if (evaluation.relevance_comment) setValue("relevance_comment", evaluation.relevance_comment);
      if (evaluation.accessibility_comment) setValue("accessibility_comment", evaluation.accessibility_comment);
      if (evaluation.correctness_comment) setValue("correctness_comment", evaluation.correctness_comment);
      if (evaluation.value_comment) setValue("value_comment", evaluation.value_comment);
      if (evaluation.quality_comment) setValue("quality_comment", evaluation.quality_comment);
      if (evaluation.specific_competence_comment) setValue("specific_competence_comment", evaluation.specific_competence_comment);
      if (evaluation.description_comment) setValue("description_comment", evaluation.description_comment);
      if (evaluation.duration_comment) setValue("duration_comment", evaluation.duration_comment);
      if (evaluation.link_comment) setValue("link_comment", evaluation.link_comment);
      if (evaluation.comment_comment) setValue("comment_comment", evaluation.comment_comment);
    }
  }, [evaluation, setValue]);

  const onSubmit = (data: EvaluationFormData) => {
    if (!evaluation) return;
    
    updateEvaluation({ id: evaluation.id, data }, {
      onSuccess: () => {
        toast({ title: "Evaluare salvată", description: "Modificările au fost salvate cu succes.", variant: "success" });
      },
      onError: (error: any) => {
        toast({ title: "Eroare", description: error.message || "A apărut o eroare la salvare.", variant: "destructive" });
      }
    });
  };

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

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
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
          {isEvaluator && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 text-gray-400 hover:text-gray-600"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting || !isDirty}
            >
              <Save className="h-6 w-6" />
            </Button>
          )}
          {/* <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 text-gray-400 hover:text-gray-600"
            onClick={onEdit}
            aria-label="Editează"
          >
            <Pencil className="h-4 w-4" />
          </Button> */}
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
            Descarcă fișa descriptivă
          </Button>
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
            <Select
              options={[
                { value: 'CONFORMABLE', label: 'Conform' },
                { value: 'UNCONFORMABLE', label: 'Neconform' },
                { value: 'IN_PROGRESS', label: 'În evaluare' },
              ]}
              value={watch("status")}
              onChange={(value: string | string[]) => {
                if (isEvaluator) {
                  // If it's an array, take the first value, otherwise use the string value
                  const statusValue = Array.isArray(value) ? value[0] : value;
                  setValue("status", statusValue as 'CONFORMABLE' | 'UNCONFORMABLE' | 'IN_PROGRESS', { shouldDirty: true });
                }
              }}
              placeholder="Selectează statusul"
              className="min-w-[160px]"
              disabled={!isEvaluator}
            />
          </div>

          <div className="text-sm font-medium text-gray-500">Autor</div>
          <div className="flex items-center">
            <Avatar className="mr-2 h-8 w-8 bg-blue-100" initials={'' + resource?.author?.first_name?.[0] + resource?.author?.last_name?.[0]} />
            <span>{resource?.author?.first_name + ' ' + resource?.author?.last_name || 'N/A'}</span>
          </div>

          <div className="text-sm font-medium text-gray-500">Mentor</div>
          <div className="flex items-center">
            <Avatar className="mr-2 h-8 w-8 bg-purple-100" initials={'' + resource?.mentor?.first_name?.[0] + resource?.mentor?.last_name?.[0]} />
            <span>{resource?.mentor?.first_name + ' ' + resource?.mentor?.last_name || 'N/A'}</span>
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
              value="evaluation"
              className="pb-2 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none"
            >
              Fișă de evaluare
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-0">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Prezentarea resursei educaționale</h2>

              {/* Competența specifică */}
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Competența specifică</div>
                <div className="mb-2">{resource?.specific_competency?.name || "N/A"}</div>
                <Textarea 
                  placeholder="Adaugă comentariu la competență..." 
                  className="min-h-[60px] mb-4" 
                  disabled={!isEvaluator}
                  {...register("specific_competence_comment")}
                />
              </div>

              {/* Descriere */}
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Descriere</div>
                <div className="mb-2 whitespace-pre-wrap">{resource?.description || "N/A"}</div>
                <Textarea 
                  placeholder="Adaugă comentariu la descriere..." 
                  className="min-h-[60px] mb-4" 
                  disabled={!isEvaluator}
                  {...register("description_comment")}
                />
              </div>

              {/* Durata */}
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Durata</div>
                <div className="mb-2">{resource?.durata || "N/A"}</div>
                <Textarea 
                  placeholder="Adaugă comentariu la durată..." 
                  className="min-h-[60px] mb-4" 
                  disabled={!isEvaluator}
                  {...register("duration_comment")}
                />
              </div>

              {/* Link */}
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Link</div>
                <div className="mb-2">
                  {resource?.link ? (
                    <a href={resource?.link} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{resource?.link}</a>
                  ) : "N/A"}
                </div>
                <Textarea 
                  placeholder="Adaugă comentariu la link..." 
                  className="min-h-[60px] mb-4" 
                  disabled={!isEvaluator}
                  {...register("link_comment")}
                />
              </div>

              {/* Comentarii */}
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Comentarii</div>
                <div className="mb-2 whitespace-pre-wrap">{resource?.comentarii || "N/A"}</div>
                <Textarea 
                  placeholder="Adaugă comentariu la comentarii..." 
                  className="min-h-[60px] mb-4" 
                  disabled={!isEvaluator}
                  {...register("comment_comment")}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="evaluation" className="mt-0">
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
                          Susținerea activității de formare, dezvoltare și evaluare a competențelor din programa școlară
                          (prin accentul pus pe competențe, nu pe conținuturi)
                        </li>
                        <li>
                          Valorificarea recomandărilor metodologice existente în programa școlară referitoare la
                          strategiile didactice care contribuie predominant la realizarea competențelor
                        </li>
                      </ul>
                    </div>
                    <div>
                      <Label htmlFor="concordanta" className="text-sm font-medium text-gray-500 mb-1">
                        Comentariu
                      </Label>
                      <Textarea 
                        id="concordanta" 
                        placeholder="Adaugă comentariu..." 
                        className="min-h-[100px]" 
                        disabled={!isEvaluator}
                        {...register("concordance_comment")}
                      />
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
                        <li>
                          Prezentarea unei teme de actualitate și a unor aspecte semnificative din perspectiva
                          disciplinei de studiu
                        </li>
                        <li>Facilitarea educației incluzive</li>
                        <li>Valorificarea experienței de viață a elevilor</li>
                        <li>
                          Facilitarea învățării active și interactive care pot contribui la creșterea motivației,
                          interesului și implicării elevilor în propria învățare
                        </li>
                      </ul>
                    </div>
                    <div>
                      <Label htmlFor="relevanta" className="text-sm font-medium text-gray-500 mb-1">
                        Comentariu
                      </Label>
                      <Textarea 
                        id="relevanta" 
                        placeholder="Adaugă comentariu..." 
                        className="min-h-[100px]" 
                        disabled={!isEvaluator}
                        {...register("relevance_comment")}
                      />
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
                        <li>Adecvarea la vârsta elevilor (limbaj, densitatea informației)</li>
                        <li>Structurarea conținutului pentru a facilita lectura și urmărirea informațiilor</li>
                      </ul>
                    </div>
                    <div>
                      <Label htmlFor="accesibilitate" className="text-sm font-medium text-gray-500 mb-1">
                        Comentariu
                      </Label>
                      <Textarea 
                        id="accesibilitate" 
                        placeholder="Adaugă comentariu..." 
                        className="min-h-[100px]" 
                        disabled={!isEvaluator}
                        {...register("accessibility_comment")}
                      />
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
                    <div>
                      <Label htmlFor="corectitudine" className="text-sm font-medium text-gray-500 mb-1">
                        Comentariu
                      </Label>
                      <Textarea 
                        id="corectitudine" 
                        placeholder="Adaugă comentariu..." 
                        className="min-h-[100px]" 
                        disabled={!isEvaluator}
                        {...register("correctness_comment")}
                      />
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
                    <div>
                      <Label htmlFor="valoare" className="text-sm font-medium text-gray-500 mb-1">
                        Comentariu
                      </Label>
                      <Textarea 
                        id="valoare" 
                        placeholder="Adaugă comentariu..." 
                        className="min-h-[100px]" 
                        disabled={!isEvaluator}
                        {...register("value_comment")}
                      />
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
                    <div>
                      <Label htmlFor="calitate" className="text-sm font-medium text-gray-500 mb-1">
                        Comentariu
                      </Label>
                      <Textarea 
                        id="calitate" 
                        placeholder="Adaugă comentariu..." 
                        className="min-h-[100px]" 
                        disabled={!isEvaluator}
                        {...register("quality_comment")}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
