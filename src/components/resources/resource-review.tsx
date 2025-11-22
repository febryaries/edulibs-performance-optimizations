"use client"

import { useForm } from "react-hook-form"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, X, Maximize2, Save, ArrowLeft, Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Avatar } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Database } from "../../utils/database.types"
import { ResourceEvaluationInsert, useResourceEvaluationsCrud, useResourcesCrud, useResourceSpecificCompetenciesCrud, useUsersController } from '@/hooks/use-controllers'
import { useEffect } from "react"
import { useAnexa3, useAnexa6 } from "@/hooks/use-anexe"

interface ResourceReviewProps {
  resource: { id: string };
  evaluationId: string
  onClose: () => void
  onBack?: () => void
  onToggleFullScreen: () => void
  isFullScreen: boolean
}

export function ResourceReview({
  resource: resourceProp,
  evaluationId,
  onClose,
  onBack,
  onToggleFullScreen,
  isFullScreen
}: ResourceReviewProps) {

  const { useById: useResourceById, useUpdate: useUpdateResourceEvaluation } = useResourcesCrud();
  const { useById: useResourceEvaluationById, useUpdate: updateEvaluation } = useResourceEvaluationsCrud();
  const { useAll: useResourceCompetencies } = useResourceSpecificCompetenciesCrud();

  // Use the anexa hooks
  const { isGenerating: isGeneratingAnexa3, generateDocument: generateAnexa3Document } = useAnexa3();
  const { isGenerating: isGeneratingAnexa6, generateDocument: generateAnexa6Document } = useAnexa6();

  const { data: resource } = useResourceById(resourceProp.id);
  const { data: evaluation } = useResourceEvaluationById(evaluationId);
  const { data: resourceCompetencies } = useResourceCompetencies({ filters: [{ column: 'resource_id', operator: 'eq', value: resourceProp.id }] });

  const { user } = useAuth();

  console.log("[LOG] user:", user,user?.user_metadata.role,user?.id === evaluation?.evaluator_id, evaluation?.evaluator_id, user?.id);

  const isEvaluator = (user?.user_metadata.role === "EVALUATOR" && user?.id === evaluation?.evaluator_id) || user?.user_metadata.role === "ADMINISTRATOR";

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

  // Helper function to ensure status is always valid
  function getSafeStatus(status: unknown): "CONFORMABLE" | "UNCONFORMABLE" | "IN_PROGRESS" {
    if (status === "CONFORMABLE" || status === "UNCONFORMABLE" || status === "IN_PROGRESS") {
      return status;
    }
    return "IN_PROGRESS";
  }

  const form = useForm<ResourceEvaluationInsert>({
    defaultValues: {
      status: getSafeStatus(evaluation?.status),
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
      concordance_ok: evaluation?.concordance_ok || false,
      relevance_ok: evaluation?.relevance_ok || false,
      accessibility_ok: evaluation?.accessibility_ok || false,
      correctness_ok: evaluation?.correctness_ok || false,
      quality_ok: evaluation?.quality_ok || false,
      value_ok: evaluation?.value_ok || false,
    }
  });

  useEffect(() => {
    if (evaluation) {
      form.setValue("status", getSafeStatus(evaluation.status));
      if (evaluation.concordance_comment) form.setValue("concordance_comment", evaluation.concordance_comment);
      if (evaluation.relevance_comment) form.setValue("relevance_comment", evaluation.relevance_comment);
      if (evaluation.accessibility_comment) form.setValue("accessibility_comment", evaluation.accessibility_comment);
      if (evaluation.correctness_comment) form.setValue("correctness_comment", evaluation.correctness_comment);
      if (evaluation.value_comment) form.setValue("value_comment", evaluation.value_comment);
      if (evaluation.quality_comment) form.setValue("quality_comment", evaluation.quality_comment);
      if (evaluation.specific_competence_comment) form.setValue("specific_competence_comment", evaluation.specific_competence_comment);
      if (evaluation.description_comment) form.setValue("description_comment", evaluation.description_comment);
      if (evaluation.duration_comment) form.setValue("duration_comment", evaluation.duration_comment);
      if (evaluation.link_comment) form.setValue("link_comment", evaluation.link_comment);
      if (evaluation.comment_comment) form.setValue("comment_comment", evaluation.comment_comment);
      if (evaluation.concordance_ok !== null) form.setValue("concordance_ok", evaluation.concordance_ok);
      if (evaluation.relevance_ok !== null) form.setValue("relevance_ok", evaluation.relevance_ok);
      if (evaluation.accessibility_ok !== null) form.setValue("accessibility_ok", evaluation.accessibility_ok);
      if (evaluation.correctness_ok !== null) form.setValue("correctness_ok", evaluation.correctness_ok);
      if (evaluation.quality_ok !== null) form.setValue("quality_ok", evaluation.quality_ok);
      if (evaluation.value_ok !== null) form.setValue("value_ok", evaluation.value_ok);
    }
  }, [evaluation, form.setValue]);


  const usersController = useUsersController()

  const onSubmit = (data: ResourceEvaluationInsert) => {
    // // console.log("[LOG] onSubmit data:", evaluation);
    if (!evaluation) return;
    
    updateEvaluation.mutateAsync({ id: evaluation.id, record: data }, {
      onSuccess: async () => {

        console.log("Updated evaluation with : ", data);

        if(evaluation.status === "CONFORMABLE" || evaluation.status === "UNCONFORMABLE") {
          const student = await usersController.getById(evaluation.user_id)
          if(student && resource) {
            // Call /api/notify 
            const notifyResponse = await fetch('/api/notify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                resource: {
                  id: resource?.id,
                  title: resource?.title,
                },
                recipients: [
                  {
                    email: student.email,
                    name: student.first_name + " " + student.last_name
                  },
                ],
              }),
            });
          }
        }

        toast({ title: "Evaluare salvată", description: "Modificările au fost salvate cu succes.", variant: "success" });
      },
      onError: (error: unknown) => {
        toast({ title: "Eroare", description: error as string || "A apărut o eroare la salvare.", variant: "destructive" });
      }
    });
  };

  // Handle document generation and download
  const handleGenerateDocument = async () => {
    // Map resource data to gen3Schema format

    console.log("[LOG] resource:", resource);
    const documentData = {
      serial_number: resource?.serial_number || 0,
      title: resource?.title || "",
      discipline: resource?.discipline?.name || "",
      competency: getCompetencyText(),
      class: resource?.class?.name || "",
      author: `${resource?.author?.first_name || ""} ${resource?.author?.last_name || ""}`,
      duration: resource?.durata || "",
      description: resource?.description || "",
      comments: resource?.comentarii || "",
      aggregate: resource?.aggregate || "",
      today: new Date(),
    };
    
    await generateAnexa3Document(documentData);
  };

  // Handle evaluation document generation and download
  const handleGenerateEvaluationDocument = async () => {
    if (!evaluation) {
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
      competency: getCompetencyText(),
      concordance_comment_yes: typeof evaluation?.concordance_ok === 'boolean' && evaluation.concordance_ok ? (evaluation.concordance_comment || "") : "",
      concordance_comment_no: typeof evaluation?.concordance_ok === 'boolean' && !evaluation.concordance_ok ? (evaluation.concordance_comment || "") : "",
      relevance_comment_yes: typeof evaluation?.relevance_ok === 'boolean' && evaluation.relevance_ok ? (evaluation.relevance_comment || "") : "",
      relevance_comment_no: typeof evaluation?.relevance_ok === 'boolean' && !evaluation.relevance_ok ? (evaluation.relevance_comment || "") : "",
      accessibility_comment_yes: typeof evaluation?.accessibility_ok === 'boolean' && evaluation.accessibility_ok ? (evaluation.accessibility_comment || "") : "",
      accessibility_comment_no: typeof evaluation?.accessibility_ok === 'boolean' && !evaluation.accessibility_ok ? (evaluation.accessibility_comment || "") : "",
      correctness_comment_yes: typeof evaluation?.correctness_ok === 'boolean' && evaluation.correctness_ok ? (evaluation.correctness_comment || "") : "",
      correctness_comment_no: typeof evaluation?.correctness_ok === 'boolean' && !evaluation.correctness_ok ? (evaluation.correctness_comment || "") : "",
      value_comment_yes: typeof evaluation?.value_ok === 'boolean' && evaluation.value_ok ? (evaluation.value_comment || "") : "",
      value_comment_no: typeof evaluation?.value_ok === 'boolean' && !evaluation.value_ok ? (evaluation.value_comment || "") : "",
      quality_comment_yes: typeof evaluation?.quality_ok === 'boolean' && evaluation.quality_ok ? (evaluation.quality_comment || "") : "",
      quality_comment_no: typeof evaluation?.quality_ok === 'boolean' && !evaluation.quality_ok ? (evaluation.quality_comment || "") : "",
      evaluation_date: evaluation?.updated_at ? new Date(evaluation.updated_at) : new Date(),
    };
    
    await generateAnexa6Document(documentData);
  };

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
              onClick={form.handleSubmit(onSubmit)}
              disabled={form.formState.isSubmitting || !form.formState.isDirty}
            >
              <Save className="h-6 w-6" />
            </Button>
          )}
          <div className="w-px h-6 bg-gray-300"></div>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 text-gray-400 hover:text-gray-600"
            onClick={onBack || onClose}
            aria-label="Înapoi"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
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
              value={form.watch("status") ?? undefined}
              onChange={(value: string | string[]) => {
                if (isEvaluator) {
                  // If it's an array, take the first value, otherwise use the string value
                  const statusValue = Array.isArray(value) ? value[0] : value;
                  form.setValue("status", statusValue as Database["public"]["Enums"]["evaluation_status"], { shouldDirty: true });
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
                <div className="text-sm font-medium text-gray-500 mb-1">Competențe specifice</div>
                <div className="mb-2">
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
                        
                        if(item.competency_id === -1){
                          return (
                            <div key={item.id} className="bg-gray-50 p-2 rounded-md">
                              {resource?.specific_competence_text || "N/A"}
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
                <Textarea 
                  placeholder="Adaugă comentariu la competență..." 
                  className="min-h-[60px] mb-4" 
                  disabled={!isEvaluator}
                  {...form.register("specific_competence_comment")}
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
                  {...form.register("description_comment")}
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
                  {...form.register("duration_comment")}
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
                  {...form.register("link_comment")}
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
                  {...form.register("comment_comment")}
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
                        {...form.register("concordance_comment")}
                      />
                      <div className="mt-4">
                        <div className="flex items-center">
                          <Checkbox 
                            id="concordanta-ok" 
                            className="mr-2" 
                            disabled={!isEvaluator}
                            checked={!!form.watch("concordance_ok")}
                            onCheckedChange={(checked) => {
                              form.setValue("concordance_ok", !!checked, { shouldDirty: true });
                            }}
                          />
                          <Label htmlFor="concordanta-ok" className="text-sm font-medium text-gray-500">
                            Criteriu îndeplinit
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="h-24"></div>
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
                        {...form.register("relevance_comment")}
                      />
                      <div className="mt-4">
                        <div className="flex items-center">
                          <Checkbox 
                            id="relevanta-ok" 
                            className="mr-2" 
                            disabled={!isEvaluator}
                            checked={!!form.watch("relevance_ok")}
                            onCheckedChange={(checked) => {
                              form.setValue("relevance_ok", !!checked, { shouldDirty: true });
                            }}
                          />
                          <Label htmlFor="relevanta-ok" className="text-sm font-medium text-gray-500">
                            Criteriu îndeplinit
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="h-24"></div>
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
                        <li>Adecvarea conținutului științific, a limbajului utilizat la grupul țintă vizat (la nivelul de dezvoltare specific vârstei căreia i se adresează)</li>
                        <li>Ușurința citirii, urmăririi și înțelegerii conținutului resursei (având în vedere, densitatea informațiilor, text scris, mesaj în format audio, ritmul de prezentare, timpul de redare pe secvență)</li>
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
                        {...form.register("accessibility_comment")}
                      />
                      <div className="mt-4">
                        <div className="flex items-center">
                          <Checkbox 
                            id="accesibilitate-ok" 
                            className="mr-2" 
                            disabled={!isEvaluator}
                            checked={!!form.watch("accessibility_ok")}
                            onCheckedChange={(checked) => {
                              form.setValue("accessibility_ok", !!checked, { shouldDirty: true });
                            }}
                          />
                          <Label htmlFor="accesibilitate-ok" className="text-sm font-medium text-gray-500">
                            Criteriu îndeplinit
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="h-24"></div>
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
                        {...form.register("correctness_comment")}
                      />
                      <div className="mt-4">
                        <div className="flex items-center">
                          <Checkbox 
                            id="corectitudine-ok" 
                            className="mr-2" 
                            disabled={!isEvaluator}
                            checked={!!form.watch("correctness_ok")}
                            onCheckedChange={(checked) => {
                              form.setValue("correctness_ok", !!checked, { shouldDirty: true });
                            }}
                          />
                          <Label htmlFor="corectitudine-ok" className="text-sm font-medium text-gray-500">
                            Criteriu îndeplinit
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="h-24"></div>
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
                        <li>Facilitarea relaționării cu alte domenii ale cunoașterii, deschiderea spre inter- și transdisciplinaritate</li>
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
                        {...form.register("value_comment")}
                      />
                      <div className="mt-4">
                        <div className="flex items-center">
                          <Checkbox 
                            id="inovatie-ok" 
                            className="mr-2" 
                            disabled={!isEvaluator}
                            checked={!!form.watch("value_ok")}
                            onCheckedChange={(checked) => {
                              form.setValue("value_ok", !!checked, { shouldDirty: true });
                            }}
                          />
                          <Label htmlFor="inovatie-ok" className="text-sm font-medium text-gray-500">
                            Criteriu îndeplinit
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="h-24"></div>
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
                          propus de resursă (de exemplu: durata fiecărei secvențe, durata resursei, dimensiunea și
                          fontul textului, imagini -- număr, tip, claritate, adecvare la conținut --, culori, material
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
                        {...form.register("quality_comment")}
                      />
                      <div className="mt-4">
                        <div className="flex items-center">
                          <Checkbox 
                            id="calitate-ok" 
                            className="mr-2" 
                            disabled={!isEvaluator}
                            checked={!!form.watch("quality_ok")}
                            onCheckedChange={(checked) => {
                              form.setValue("quality_ok", !!checked, { shouldDirty: true });
                            }}
                          />
                          <Label htmlFor="calitate-ok" className="text-sm font-medium text-gray-500">
                            Criteriu îndeplinit
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="h-24"></div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
