"use client"

import { useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Save, Maximize2, Trash2, X, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { domainSchema, type DomainFormValues } from "@/schemas/domain-schema"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Tooltip } from "@/components/ui/tooltip"
import {
  Domain,
  useDomainsCrud,
} from "@/hooks/use-controllers"

// Define the props for the DomainForm component
interface DomainFormProps {
  onClose: () => void
  onBack?: () => void
  onSave: (data: DomainFormValues) => void
  onDelete?: (id: number) => void
  onToggleFullScreen: () => void
  isFullScreen: boolean
  initialData?: Partial<DomainFormValues>
  isEditMode?: boolean
  domain?: Domain | null
}

export function DomainForm({
  onClose,
  onBack,
  onSave,
  onDelete,
  onToggleFullScreen,
  isFullScreen,
  initialData,
  isEditMode,
  domain: domainProp
}: DomainFormProps) {
  // --- References and state ---
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Determine if we're in edit mode
  const isEditModeLocal = isEditMode || (!!initialData?.name && initialData.name !== "Domeniu Nou");

  // Get domain data if in edit mode
  const { useById: useDomainById } = useDomainsCrud()
  const { data: domainData } = useDomainById(
    isEditModeLocal && domainProp?.id ? domainProp.id : ""
  );

  // Initialize form with react-hook-form and zod validation
  const form = useForm<DomainFormValues>({
    resolver: zodResolver(domainSchema),
    defaultValues: {
      name: domainData?.name || initialData?.name || "Domeniu Nou",
    },
  })

  // Focus the name input on mount
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [])

  // Effect to manually reset form with domain values when in edit mode
  useEffect(() => {
    if (isEditModeLocal && domainData) {
      // Create a complete form data object from the domain
      const formData: DomainFormValues = {
        name: domainData.name || "Domeniu Nou",
        number: 0, // Default to 0 since number might not exist in the database yet
      };
      form.reset(formData);
    }
  }, [isEditModeLocal, domainData, form]);

  // Handle form submission
  const onSubmit = async (data: DomainFormValues) => {
    try {
      await onSave(data);
    } catch (error) {
      console.error("Error saving domain:", error);
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
            {isEditModeLocal ? "Editare domeniu" : "Domeniu nou"}
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <Tooltip content={isEditModeLocal ? "Actualizează domeniul" : "Salvează domeniul"}>
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
          {isEditModeLocal && domainProp?.id && (
            <Tooltip content="Șterge domeniul">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 text-gray-400 hover:text-gray-600"
                onClick={() => { onDelete && onDelete(domainProp.id); }}
                aria-label="Șterge domeniul"
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
                      placeholder="Introduceți numele domeniului" 
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

          </form>
        </Form>
      </div>
    </div>
  )
}
