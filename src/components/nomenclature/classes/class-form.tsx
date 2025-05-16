"use client"

import { useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Save, Maximize2, Trash2, X, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchableDropdown } from "@/components/ui/searchable-dropdown"
import { classSchema, type ClassFormValues } from "@/schemas/class-schema"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Tooltip } from "@/components/ui/tooltip"
import {
  Class,
  useClassesCrud,
  useEducationLevelsController,
} from "@/hooks/use-controllers"

// Define the props for the ClassForm component
interface ClassFormProps {
  onClose: () => void
  onBack?: () => void
  onSave: (data: ClassFormValues) => void
  onDelete?: (id: number) => void
  onToggleFullScreen: () => void
  isFullScreen: boolean
  initialData?: Partial<ClassFormValues>
  isEditMode?: boolean
  class?: Class | null
}

export function ClassForm({
  onClose,
  onBack,
  onSave,
  onDelete,
  onToggleFullScreen,
  isFullScreen,
  initialData,
  isEditMode,
  class: classProp
}: ClassFormProps) {
  // --- References and state ---
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Determine if we're in edit mode
  const isEditModeLocal = isEditMode || (!!initialData?.name && initialData.name !== "Clasă Nouă");

  // Get class data if in edit mode
  const { useById: useClassById } = useClassesCrud()
  const { data: classData } = useClassById(
    isEditModeLocal && classProp?.id ? classProp.id : ""
  );
  
  // Get controller for education levels dropdown
  const educationLevelsController = useEducationLevelsController();

  // Initialize form with react-hook-form and zod validation
  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: classData?.name || initialData?.name || "Clasă Nouă",
      level_id: classData?.level_id || initialData?.level_id || undefined,
      number: classData?.number || initialData?.number || 0,
    },
  })

  // Focus the name input on mount
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [])

  // Effect to manually reset form with class values when in edit mode
  useEffect(() => {
    if (isEditModeLocal && classData) {
      // Create a complete form data object from the class
      const formData = {
        name: classData.name || "Clasă Nouă",
        level_id: classData.level_id,
        number: classData.number || 0,
      };
      form.reset(formData);
    }
  }, [isEditModeLocal, classData, form]);

  // Handle form submission
  const onSubmit = async (data: ClassFormValues) => {
    try {
      await onSave(data);
    } catch (error) {
      console.error("Error saving class:", error);
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
            {isEditModeLocal ? "Editare clasă" : "Clasă nouă"}
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <Tooltip content={isEditModeLocal ? "Actualizează clasa" : "Salvează clasa"}>
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
          {isEditModeLocal && classProp?.id && (
            <Tooltip content="Șterge clasa">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 text-gray-400 hover:text-gray-600"
                onClick={() => { onDelete && onDelete(classProp.id); }}
                aria-label="Șterge clasa"
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
                      placeholder="Introduceți numele clasei" 
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
                name="level_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nivel educațional</FormLabel>
                    <FormControl>
                      <SearchableDropdown
                        placeholder="Selectați nivelul educațional"
                        filterKey="educational_levels"
                        fetchHook={(params) => educationLevelsController.getPaginatedData(params)}
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
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Număr</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Introduceți numărul clasei" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        value={field.value || 0}
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
