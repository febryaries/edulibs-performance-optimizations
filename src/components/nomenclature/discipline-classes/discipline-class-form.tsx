"use client"

import { useRef, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Save, Maximize2, Trash2, X, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { disciplineClassSchema, type DisciplineClassFormValues } from "@/schemas/discipline-class-schema"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Tooltip } from "@/components/ui/tooltip"
import {
  DisciplineClass,
  useDisciplineClassCrud,
  useClassesCrud,
  useDisciplinesCrud,
  useCurricularAreasCrud
} from "@/hooks/use-controllers"
import { Select } from "@/components/ui/select"

// Define the props for the DisciplineClassForm component
interface DisciplineClassFormProps {
  onClose: () => void
  onBack?: () => void
  onSave: (data: DisciplineClassFormValues) => void
  onDelete?: (id: number) => void
  onToggleFullScreen: () => void
  isFullScreen: boolean
  initialData?: Partial<DisciplineClassFormValues>
  isEditMode?: boolean
  disciplineClass?: DisciplineClass | null
}

export function DisciplineClassForm({
  onClose,
  onBack,
  onSave,
  onDelete,
  onToggleFullScreen,
  isFullScreen,
  initialData,
  isEditMode,
  disciplineClass: disciplineClassProp
}: DisciplineClassFormProps) {
  // --- References and state ---
  const codeInputRef = useRef<HTMLInputElement>(null)

  // Determine if we're in edit mode
  const isEditModeLocal = isEditMode || !!disciplineClassProp?.id;

  // Get discipline-class data if in edit mode
  const { useById: useDisciplineClassById } = useDisciplineClassCrud()
  const { data: disciplineClassData } = useDisciplineClassById(
    isEditModeLocal && disciplineClassProp?.id ? disciplineClassProp.id : ""
  );

  // Get controllers for dropdowns
  const { useList: useClasses } = useClassesCrud();
  const { useList: useDisciplines } = useDisciplinesCrud();
  const { useList: useCurricularAreas } = useCurricularAreasCrud();
  
  // State for dropdown data
  const [classes, setClasses] = useState<any[]>([]);
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const [curricularAreas, setCurricularAreas] = useState<any[]>([]);

  // Fetch dropdown data
  const { data: classesData } = useClasses({ pageSize: 100 });
  const { data: disciplinesData } = useDisciplines({ pageSize: 100 });
  const { data: curricularAreasData } = useCurricularAreas({ pageSize: 100 });

  // Update state when data is fetched
  useEffect(() => {
    if (classesData?.data) {
      setClasses(classesData.data);
    }
    if (disciplinesData?.data) {
      setDisciplines(disciplinesData.data);
    }
    if (curricularAreasData?.data) {
      setCurricularAreas(curricularAreasData.data);
    }
  }, [classesData, disciplinesData, curricularAreasData]);

  // Initialize form with react-hook-form and zod validation
  const form = useForm<DisciplineClassFormValues>({
    resolver: zodResolver(disciplineClassSchema),
    defaultValues: {
      class_id: disciplineClassData?.class_id || initialData?.class_id || undefined,
      discipline_id: disciplineClassData?.discipline_id || initialData?.discipline_id || undefined,
      area_id: disciplineClassData?.area_id || initialData?.area_id || undefined,
      code: disciplineClassData?.code || initialData?.code || "",
    },
  })

  // Focus the code input on mount
  useEffect(() => {
    if (codeInputRef.current) {
      codeInputRef.current.focus()
    }
  }, [])

  // Effect to manually reset form with discipline-class values when in edit mode
  useEffect(() => {
    if (isEditModeLocal && disciplineClassData) {
      // Create a complete form data object from the discipline-class
      const formData: DisciplineClassFormValues = {
        class_id: disciplineClassData.class_id,
        discipline_id: disciplineClassData.discipline_id,
        area_id: disciplineClassData.area_id,
        code: disciplineClassData.code || "",
      };
      form.reset(formData);
    }
  }, [isEditModeLocal, disciplineClassData, form]);

  // Handle form submission
  const onSubmit = async (data: DisciplineClassFormValues) => {
    try {
      await onSave(data);
    } catch (error) {
      console.error("Error saving discipline-class:", error);
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
            {isEditModeLocal ? "Editare asociere clasă-disciplină" : "Asociere clasă-disciplină nouă"}
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <Tooltip content={isEditModeLocal ? "Actualizează asocierea" : "Salvează asocierea"}>
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
          {isEditModeLocal && disciplineClassProp?.id && (
            <Tooltip content="Șterge asocierea">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 text-gray-400 hover:text-gray-600"
                onClick={() => { onDelete && onDelete(disciplineClassProp.id); }}
                aria-label="Șterge asocierea"
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
              name="class_id"
              render={({ field }) => (
                <FormItem className="flex flex-col space-y-1.5">
                  <FormLabel htmlFor="class_id">Clasă</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value?.toString() || ""}
                      onChange={(value) => {
                        if (typeof value === 'string') {
                          field.onChange(parseInt(value))
                        }
                      }}
                      placeholder="Selectați clasa"
                      options={classes.map((cls) => ({
                        value: cls.id.toString(),
                        label: cls.name
                      }))}
                    />
                  </FormControl>
                  <FormMessage>{form.formState.errors.class_id?.message}</FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discipline_id"
              render={({ field }) => (
                <FormItem className="flex flex-col space-y-1.5">
                  <FormLabel htmlFor="discipline_id">Disciplină</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value?.toString() || ""}
                      onChange={(value) => {
                        if (typeof value === 'string') {
                          field.onChange(parseInt(value))
                        }
                      }}
                      placeholder="Selectați disciplina"
                      options={disciplines.map((discipline) => ({
                        value: discipline.id.toString(),
                        label: discipline.name
                      }))}
                    />
                  </FormControl>
                  <FormMessage>{form.formState.errors.discipline_id?.message}</FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="area_id"
              render={({ field }) => (
                <FormItem className="flex flex-col space-y-1.5">
                  <FormLabel htmlFor="area_id">Aria curriculară</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value?.toString() || ""}
                      onChange={(value) => {
                        if (typeof value === 'string') {
                          field.onChange(parseInt(value))
                        }
                      }}
                      placeholder="Selectați aria curriculară"
                      options={curricularAreas.map((area) => ({
                        value: area.id.toString(),
                        label: area.name
                      }))}
                    />
                  </FormControl>
                  <FormMessage>{form.formState.errors.area_id?.message}</FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem className="flex flex-col space-y-1.5">
                  <FormLabel htmlFor="code">Cod intern</FormLabel>
                  <FormControl>
                    <Input 
                      id="code" 
                      placeholder="Introduceți codul intern" 
                      {...field}
                      ref={(e) => {
                        field.ref(e);
                        if (e) codeInputRef.current = e;
                      }}
                    />
                  </FormControl>
                  <FormMessage>{form.formState.errors.code?.message}</FormMessage>
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>
    </div>
  )
}
