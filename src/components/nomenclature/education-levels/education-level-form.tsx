"use client"

import { useRef, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Save, Maximize2, Trash2, X, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TextArea } from "@/components/ui/text-area"
import { SearchableDropdown } from "@/components/ui/searchable-dropdown"
import { educationLevelSchema, type EducationLevelFormValues } from "@/schemas/education-level-schema"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Tooltip } from "@/components/ui/tooltip"
import {
  useEducationLevelsCrud,
  useEducationLevelsController,
  EducationLevel
} from "@/hooks/use-controllers"

interface EducationLevelFormProps {
  onClose: () => void
  onBack?: () => void
  onSave: (data: EducationLevelFormValues) => void
  onDelete?: (id: number) => void
  onToggleFullScreen: () => void
  isFullScreen: boolean
  initialData?: Partial<EducationLevelFormValues>
  isEditMode?: boolean
  educationLevel?: EducationLevel | null
}

export function EducationLevelForm({
  onClose,
  onBack,
  onSave,
  onDelete,
  onToggleFullScreen,
  isFullScreen,
  initialData,
  isEditMode,
  educationLevel: educationLevelProp
}: EducationLevelFormProps) {
  // --- References and state ---
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Determine if we're in edit mode
  const isEditModeLocal = isEditMode || (!!initialData?.name && initialData.name !== "Nivel Educațional Nou");

  // Get education level data if in edit mode
  const { useById: useEducationLevelById } = useEducationLevelsCrud()
  const { data: educationLevel } = useEducationLevelById(
    isEditModeLocal && educationLevelProp?.id ? educationLevelProp.id : null
  );
  
  // Get controller for parent levels dropdown
  const educationLevelsController = useEducationLevelsController();

  // Initialize form with react-hook-form and zod validation
  const form = useForm<EducationLevelFormValues>({
    resolver: zodResolver(educationLevelSchema),
    defaultValues: {
      name: educationLevel?.name || initialData?.name || "Nivel Educațional Nou",
      number: educationLevel?.number || initialData?.number || 0,
      parent_id: educationLevel?.parent_id || initialData?.parent_id || null,
    },
  })

  // Focus the name input on mount
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [])

  // Effect to manually reset form with education level values when in edit mode
  useEffect(() => {
    if (isEditModeLocal && educationLevel) {
      // Create a complete form data object from the education level
      const formData = {
        name: educationLevel.name || "Nivel Educațional Nou",
        number: educationLevel.number || 0,
        parent_id: educationLevel.parent_id || null,
      };
      form.reset(formData);
    }
  }, [isEditModeLocal, educationLevel, form]);

  // Handle form submission
  const onSubmit = async (data: EducationLevelFormValues) => {
    await onSave(data);
  }

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
            {isEditModeLocal ? "Editare nivel educațional" : "Nivel educațional nou"}
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <Tooltip content={isEditModeLocal ? "Actualizează nivelul" : "Salvează nivelul"}>
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
          {isEditModeLocal && educationLevel?.id && (
            <Tooltip content="Șterge nivelul">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 text-gray-400 hover:text-gray-600"
                onClick={() => { onDelete && onDelete(educationLevel.id); }}
                aria-label="Șterge nivelul"
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

      {/* Form content */}
      <div className="flex-1 overflow-auto p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex flex-col space-y-1.5">
                  <FormLabel htmlFor="name">Nume</FormLabel>
                  <FormControl>
                    <Input 
                      id="name" 
                      placeholder="Introduceți numele nivelului educațional" 
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

            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Număr</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Introduceți numărul nivelului" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      value={field.value || 0}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parent_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nivel părinte</FormLabel>
                  <FormControl>
                    <SearchableDropdown
                      placeholder="Selectați nivelul părinte (opțional)"
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
          </form>
        </Form>
      </div>
    </div>
  )
}
