"use client"

import { useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Save, Maximize2, Trash2, X, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchableDropdown } from "@/components/ui/searchable-dropdown"
import { specificCompetencySchema, type SpecificCompetencyFormValues } from "@/schemas/specific-competency-schema"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Tooltip } from "@/components/ui/tooltip"
import {
  SpecificCompetency,
  useSpecificCompetenciesCrud,
  useClassesController,
  useDisciplinesController,
  useGeneralCompetenciesController,
} from "@/hooks/use-controllers"

// Define the props for the SpecificCompetencyForm component
interface SpecificCompetencyFormProps {
  competency?: SpecificCompetency
  isEditMode?: boolean
  isFullScreen?: boolean
  onToggleFullScreen?: () => void
  onClose?: () => void
  onBack?: () => void
  onDelete?: (id: number) => void
  onSuccess?: () => void
}

export function SpecificCompetencyForm({
  competency: competencyProp,
  isEditMode = false,
  isFullScreen = false,
  onToggleFullScreen = () => {},
  onClose = () => {},
  onBack,
  onDelete,
  onSuccess
}: SpecificCompetencyFormProps) {
  // --- References and state ---
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Determine if we're in edit mode
  const isEditModeLocal = isEditMode || !!competencyProp;

  // Get competency data if in edit mode
  const { useById: useCompetencyById } = useSpecificCompetenciesCrud()
  const { data: competencyData } = useCompetencyById(
    isEditModeLocal && competencyProp?.id ? competencyProp.id : ""
  );

  // Get controllers for dropdowns
  const classesController = useClassesController()
  const disciplinesController = useDisciplinesController()
  const generalCompetenciesController = useGeneralCompetenciesController()

  // Initialize form with react-hook-form and zod validation
  const form = useForm<SpecificCompetencyFormValues>({
    resolver: zodResolver(specificCompetencySchema),
    defaultValues: {
      name: competencyData?.name || "Competență Specifică Nouă",
      class_id: competencyData?.class_id || 0,
      competency_id: competencyData?.competency_id || 0,
    }
  })

  // Focus the name input on mount
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [])

  // Effect to manually reset form with competency values when in edit mode
  useEffect(() => {
    if (isEditModeLocal && competencyData) {
      // Create a complete form data object from the competency
      const formData: SpecificCompetencyFormValues = {
        name: competencyData.name || "Competență Specifică Nouă",
        class_id: competencyData.class_id || 0,
        competency_id: competencyData.competency_id || 0,
      };
      form.reset(formData);
    }
  }, [isEditModeLocal, competencyData, form]);

  // Get CRUD operations
  const { useCreate, useUpdate } = useSpecificCompetenciesCrud()
  const createMutation = useCreate
  const updateMutation = useUpdate

  // Handle form submission
  const onSubmit = async (data: SpecificCompetencyFormValues) => {
    try {
      if (isEditModeLocal && competencyProp?.id) {
        // Update existing competency
        await updateMutation.mutateAsync({ id: competencyProp.id, record: data })
      } else {
        // Create new competency
        await createMutation.mutateAsync(data)
      }
      // Call onSuccess callback if provided
      if (onSuccess) onSuccess()
      // Close the form after successful submission
      form.reset();
      onClose()
    } catch (error) {
      // Handle errors
      console.error("Error saving specific competency:", error)
    }
  }

  // Handle save button click
  const handleSave = async () => {
    try {
      const isValid = await form.trigger();
      if (isValid) {
        form.handleSubmit(onSubmit)();
      }
      // If not valid, errors will be shown by FormMessage
    } catch (error) {
      console.error('Error during form validation:', error);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center space-x-4">
          {onBack && (
            <Tooltip content="Înapoi">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 text-gray-400 hover:text-gray-600"
                onClick={onBack}
                aria-label="Înapoi"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Tooltip>
          )}
          <Tooltip content={isFullScreen ? "Ieși din ecran complet" : "Ecran complet"}>
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 text-gray-400 hover:text-gray-600"
              onClick={onToggleFullScreen}
              aria-label={isFullScreen ? "Exit full screen" : "Enter full screen"}
            >
              <Maximize2 className="h-6 w-6" />
            </Button>
          </Tooltip>
          <h2 className="text-lg font-medium text-gray-900">
            {isEditModeLocal ? "Editare competență specifică" : "Competență specifică nouă"}
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <Tooltip content={isEditModeLocal ? "Actualizează competența" : "Salvează competența"}>
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 text-gray-400 hover:text-gray-600"
              onClick={handleSave}
              aria-label={isEditModeLocal ? "Actualizați" : "Salvează"}
            >
              <Save className="h-6 w-6" />
            </Button>
          </Tooltip>
          {isEditModeLocal && competencyProp?.id && (
            <Tooltip content="Șterge competența">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 text-gray-400 hover:text-gray-600"
                onClick={() => { onDelete && onDelete(competencyProp.id); }}
                aria-label="Șterge competența"
              >
                <Trash2 className="h-6 w-6" />
              </Button>
            </Tooltip>
          )}
          <Tooltip content="Închide">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 text-gray-400 hover:text-gray-600"
              onClick={onClose}
              aria-label="Închide"
            >
              <X className="h-6 w-6" />
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Form fields */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex flex-col space-y-1.5">
                  <FormLabel htmlFor="name">Nume</FormLabel>
                  <FormControl>
                    <Input
                      id="name"
                      placeholder="Introduceți numele competenței specifice"
                      {...field}
                      ref={(e) => {
                        field.ref(e);
                        if (e) nameInputRef.current = e;
                      }}
                    />
                  </FormControl>
                  <FormMessage>{form.formState.errors.name?.message}</FormMessage>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="class_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clasă</FormLabel>
                    <FormControl>
                      <SearchableDropdown
                        placeholder="Selectați clasa"
                        filterKey="classes"
                        fetchHook={(params) => classesController.getPaginatedData(params)}
                        valueField="id"
                        labelField="name"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discipline_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disciplină</FormLabel>
                    <FormControl>
                      <SearchableDropdown
                        placeholder="Selectați disciplina"
                        filterKey="disciplines"
                        fetchHook={(params) => disciplinesController.getPaginatedData(params)}
                        valueField="id"
                        labelField="name"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="competency_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Competență generală</FormLabel>
                  <FormControl>
                    <SearchableDropdown
                      placeholder="Selectați competența generală"
                      filterKey="general_competencies"
                      fetchHook={(params) => generalCompetenciesController.getPaginatedData(params)}
                      valueField="id"
                      labelField="name"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>
    </div>
  )
}