"use client"

import { useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Save, Maximize2, Trash2, X, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchableDropdown } from "@/components/ui/searchable-dropdown"
import { disciplineSchema, type DisciplineFormValues } from "@/schemas/discipline-schema"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Tooltip } from "@/components/ui/tooltip"
import {
  Discipline,
  useDisciplinesCrud,
  useDomainsController,
} from "@/hooks/use-controllers"

// Define the props for the DisciplineForm component
interface DisciplineFormProps {
  onClose: () => void
  onBack?: () => void
  onSave: (data: DisciplineFormValues) => void
  onDelete?: (id: number) => void
  onToggleFullScreen: () => void
  isFullScreen: boolean
  initialData?: Partial<DisciplineFormValues>
  isEditMode?: boolean
  discipline?: Discipline | null
}

export function DisciplineForm({
  onClose,
  onBack,
  onSave,
  onDelete,
  onToggleFullScreen,
  isFullScreen,
  initialData,
  isEditMode,
  discipline: disciplineProp
}: DisciplineFormProps) {
  // --- References and state ---
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Determine if we're in edit mode
  const isEditModeLocal = isEditMode || (!!initialData?.name && initialData.name !== "Disciplină Nouă");

  // Get discipline data if in edit mode
  const { useById: useDisciplineById } = useDisciplinesCrud()
  const { data: disciplineData } = useDisciplineById(
    isEditModeLocal && disciplineProp?.id ? disciplineProp.id : ""
  );

  // Get controller for domains dropdown
  const domainsController = useDomainsController();

  // Initialize form with react-hook-form and zod validation
  const form = useForm<DisciplineFormValues>({
    resolver: zodResolver(disciplineSchema),
    defaultValues: {
      name: disciplineData?.name || initialData?.name || "Disciplină Nouă",
      domain_id: disciplineData?.domain_id || initialData?.domain_id || undefined,
    },
  })

  // Focus the name input on mount
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [])

  // Effect to manually reset form with discipline values when in edit mode
  useEffect(() => {
    if (isEditModeLocal && disciplineData) {
      // Create a complete form data object from the discipline
      const formData: DisciplineFormValues = {
        name: disciplineData.name || "Disciplină Nouă",
        domain_id: disciplineData.domain_id || 0,
      };
      form.reset(formData);
    }
  }, [isEditModeLocal, disciplineData, form]);

  // Handle form submission
  const onSubmit = async (data: DisciplineFormValues) => {
    try {
      await onSave(data);
    } catch (error) {
      console.error("Error saving discipline:", error);
    }
  };

  // Custom save handler to ensure validation before saving
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
            {isEditModeLocal ? "Editare disciplină" : "Disciplină nouă"}
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <Tooltip content={isEditModeLocal ? "Actualizează disciplina" : "Salvează disciplina"}>
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
          {isEditModeLocal && disciplineProp?.id && (
            <Tooltip content="Șterge disciplina">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 text-gray-400 hover:text-gray-600"
                onClick={() => { onDelete && onDelete(disciplineProp.id); }}
                aria-label="Șterge disciplina"
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
                      placeholder="Introduceți numele disciplinei"
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
                name="domain_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domeniu</FormLabel>
                    <FormControl>
                      <SearchableDropdown
                        placeholder="Selectați domeniul"
                        filterKey="domains"
                        fetchHook={(params) => domainsController.getPaginatedData(params)}
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
          </form>
        </Form>
      </div>
    </div>
  )
}
