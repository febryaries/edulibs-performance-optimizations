"use client"

import { useState, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Calendar, Save, Maximize2, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TextArea } from "@/components/ui/text-area"
import { SearchableDropdown } from "@/components/ui/searchable-dropdown"
import { UserSelect } from "@/components/ui/form/user-select"
import { DatePicker } from "@/components/ui/form/date-picker"
import { resourceSchema, type ResourceFormValues } from "@/schemas/resource-schema"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { DisciplinesController } from "@/queries/disciplines-controller"
import { ClassesController } from "@/queries/classes-controller"
import { SpecificCompetenciesController, SpecificCompetencyWithRelations } from "@/queries/specific-competencies-controller"
import { useSupabaseBrowser } from "@/utils/supabase/client"
import { useResourceById } from "@/hooks/resources/use-resources"

// Mock data for dropdowns
const statusOptions = [
  { value: "DRAFT", label: "Ciornă" },
  { value: "CONFORMABLE", label: "Conform" },
  { value: "UNCONFORMABLE", label: "Neconform" },
  { value: "IN_REVIEW", label: "În evaluare" },
]

interface ResourceFormProps {
  onClose: () => void
  onSave: (data: ResourceFormValues) => void
  onDelete?: (id: number) => void
  onToggleFullScreen: () => void
  isFullScreen: boolean
  initialData?: Partial<ResourceFormValues>
  isEditMode?: boolean
  resource?: any
}

export function ResourceForm({ onClose, onSave, onDelete, onToggleFullScreen, isFullScreen, initialData, isEditMode, resource: resourceProp }: ResourceFormProps) {
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Determine if we're in edit mode
  const isEditModeLocal = isEditMode || (!!initialData?.title && initialData.title !== "Resursă Nouă");

  const { data: resource } = resourceProp ? useResourceById(resourceProp.id) : {data: undefined};

  // Initialize form with react-hook-form and zod validation
  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: resource?.title || initialData?.title || "Resursă Nouă",
      discipline_id: resource?.discipline_id ? String(resource.discipline_id) : initialData?.discipline_id || "",
      class_id: resource?.class_id ? String(resource.class_id) : initialData?.class_id || "",
      specific_competency_id: resource?.specific_competency_id ? String(resource.specific_competency_id) : initialData?.specific_competency_id || "",
      created_at: resource?.created_at ? new Date(resource.created_at) : initialData?.created_at || new Date(),
      status: resource?.status || initialData?.status || "DRAFT",
      mentor_id: resource?.mentor_id || initialData?.mentor_id || "",
      description: resource?.description || initialData?.description || "",
      link: resource?.link || initialData?.link || "",
      durata: resource?.durata || initialData?.durata || "",
      comentarii: resource?.comentarii || initialData?.comentarii || "",
    },
  })

  // Get Supabase client
  const supabase = useSupabaseBrowser()

  // Initialize controllers
  const disciplinesController = new DisciplinesController(supabase)
  const classesController = new ClassesController(supabase)
  const specificCompetenciesController = new SpecificCompetenciesController(supabase)

  // Focus the title input on mount
  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [])

  // Effect to load classes when discipline changes
  useEffect(() => {
    const disciplineId = form.watch('discipline_id');
    if (disciplineId) {
      fetchClassesForDiscipline(disciplineId);
    } else {
      // Reset dependent fields
      form.setValue('class_id', '');
      form.setValue('specific_competency_id', '');
    }
  }, [form.watch('discipline_id')]);

  // Effect to load competencies when class changes
  useEffect(() => {
    const classId = form.watch('class_id');
    const disciplineId = form.watch('discipline_id');
    if (classId && disciplineId) {
      fetchCompetenciesForClass(disciplineId, classId);
    } else {
      // Reset dependent field
      form.setValue('specific_competency_id', '');
    }
  }, [form.watch('class_id')]);

  // Effect to load initial discipline when in edit mode
  useEffect(() => {
    if (isEditModeLocal && resource?.discipline_id) {
      console.log("Loading initial discipline for edit mode:", resource.discipline_id);

      // Fetch the discipline by ID
      disciplinesController.getDisciplines({
        pageSize: 1,
        filters: [{
          column: 'id',
          operator: 'eq',
          value: Number(resource.discipline_id)
        }]
      }).then(() => {
        console.log("Loaded initial discipline for edit mode");
      }).catch(error => {
        console.error("Error loading initial discipline:", error);
      });
    }
  }, [isEditModeLocal, resource, disciplinesController]);

  // Effect to load initial class when in edit mode
  useEffect(() => {
    if (isEditModeLocal && resource?.class_id) {
      console.log("Loading initial class for edit mode:", resource.class_id);

      // Fetch the class by ID
      classesController.getClasses({
        pageSize: 1,
        filters: [{
          column: 'id',
          operator: 'eq',
          value: Number(resource.class_id)
        }]
      }).then(() => {
        console.log("Loaded initial class for edit mode");
      }).catch(error => {
        console.error("Error loading initial class:", error);
      });
    }
  }, [isEditModeLocal, resource, classesController]);

  // Effect to load initial competencies when in edit mode
  useEffect(() => {
    if (isEditModeLocal && resource?.specific_competency_id) {
      console.log("Loading initial competency for edit mode:", resource.specific_competency_id);

      // Fetch the specific competency by ID
      specificCompetenciesController.getSpecificCompetencies({
        pageSize: 1,
        filters: [{
          column: 'id',
          operator: 'eq',
          value: Number(resource.specific_competency_id)
        }]
      }).then(() => {
        console.log("Loaded initial competency for edit mode");
      }).catch(error => {
        console.error("Error loading initial competency:", error);
      });
    }
  }, [isEditModeLocal, resource, specificCompetenciesController]);

  // Effect to manually reset form with resource values when in edit mode
  useEffect(() => {
    if (isEditModeLocal && resource) {
      console.log("Manually resetting form with resource values:", resource);

      // Create a complete form data object from the resource
      const formData = {
        title: resource.title || "Resursă Nouă",
        discipline_id: resource.discipline_id ? String(resource.discipline_id) : "",
        class_id: resource.class_id ? String(resource.class_id) : "",
        specific_competency_id: resource.specific_competency_id ? String(resource.specific_competency_id) : "",
        created_at: resource.created_at ? new Date(resource.created_at) : new Date(),
        status: resource.status || "DRAFT",
        mentor_id: resource.mentor_id || "",
        description: resource.description || "",
        link: resource.link || "",
        durata: resource.durata || "",
        comentarii: resource.comentarii || "",
      };

      // Log the form data we're setting
      console.log("Setting form values to:", formData);

      // Reset the form with these values
      form.reset(formData);

      // Also set each field individually to ensure it updates
      Object.entries(formData).forEach(([key, value]) => {
        // @ts-ignore - we know these keys match our form fields
        form.setValue(key, value);
      });

      // Log the form values after reset
      console.log("Form values after reset:", form.getValues());
    }
  }, [isEditModeLocal, resource, form]);

  // Effect to specifically set durata and comentarii fields
  useEffect(() => {
    if (isEditModeLocal && resource) {
      // Force update these fields which seem to have issues
      if (resource.durata) {
        console.log("Explicitly setting durata field to:", resource.durata);
        form.setValue('durata', resource.durata);
      }

      if (resource.comentarii) {
        console.log("Explicitly setting comentarii field to:", resource.comentarii);
        form.setValue('comentarii', resource.comentarii);
      }

      // Force a form validation to update the UI
      form.trigger();
    }
  }, [isEditModeLocal, resource, form]);

  // Debug log for resource data
  useEffect(() => {
    if (isEditModeLocal && resource) {
      console.log("Resource data for form:", {
        title: resource.title,
        discipline_id: resource.discipline_id,
        class_id: resource.class_id,
        specific_competency_id: resource.specific_competency_id,
        durata: resource.durata,
        comentarii: resource.comentarii,
        description: resource.description
      });
      console.log("Form values after initialization:", form.getValues());
    }
  }, [isEditModeLocal, resource, form]);

  // Functions to fetch dependent dropdown data
  const fetchClassesForDiscipline = async (disciplineId: string) => {
    if (!disciplineId) return;
    try {
      console.log("Fetching classes for discipline ID:", disciplineId);

      // Query the discipline_class junction table to get classes for a discipline
      const { data: disciplineClasses, error: junctionError } = await supabase
        .from('discipline_class')
        .select('class_id')
        .eq('discipline_id', Number(disciplineId));

      if (junctionError) {
        console.error("Error fetching discipline_class junction:", junctionError);
        return;
      }

      // Extract the class IDs
      const classIds = disciplineClasses.map(dc => dc.class_id);
      console.log("Found class IDs for discipline:", classIds);

      if (classIds.length === 0) {
        console.log("No classes found for this discipline");
        return;
      }

      // Fetch the actual classes using these IDs
      await classesController.getClasses({
        pageSize: 100,
        filters: [{
          column: 'id',
          operator: 'in',
          value: classIds
        }],
        sorts: [{ column: 'number', direction: 'asc' }]
      });
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchCompetenciesForClass = async (disciplineId: string, classId: string) => {
    if (!disciplineId || !classId) return;
    try {
      console.log("Fetching competencies for class ID:", classId);

      // Fetch competencies for the selected class
      await specificCompetenciesController.getSpecificCompetencies({
        pageSize: 100,
        filters: [
          {
            column: 'class_id',
            operator: 'eq',
            value: Number(classId)
          }
        ],
        sorts: [{ column: 'number', direction: 'asc' }]
      });
    } catch (error) {
      console.error("Error fetching competencies:", error);
    }
  };

  // Handle form submission
  const onSubmit = (data: ResourceFormValues) => {
    onSave(data)
  }

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
          <h2 className="text-lg font-medium text-gray-900">
            {isEditModeLocal ? "Editare resursă educațională" : "Resursă educațională nouă"}
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 text-gray-400 hover:text-gray-600"
            onClick={form.handleSubmit(onSubmit)}
            aria-label={isEditModeLocal ? "Actualizați" : "Salvează"}
          >
            <Save className="h-6 w-6" />
          </Button>
          {isEditModeLocal && resource?.id && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 text-gray-400 hover:text-gray-600"
              onClick={() => { onDelete && onDelete(resource.id); }}
              aria-label="Șterge resursa"
            >
              <Trash2 className="h-6 w-6" />
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

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <div className="border-l-4 border-blue-600 pl-3 mt-6 mb-8">
                  <Input
                    {...field}
                    ref={titleInputRef}
                    className="text-3xl font-light text-gray-400 border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="Resursă Nouă"
                  />
                  <FormMessage />
                </div>
              )}
            />

            {/* Form Fields with labels on the left */}
            <div className="space-y-4">
              {/* Disciplina */}
              <FormField
                control={form.control}
                name="discipline_id"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-[150px_1fr] items-center gap-4">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Disciplina
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <SearchableDropdown
                        controller={{
                          controller: disciplinesController,
                          valueField: "id",
                          labelField: "name",
                          pageSize: 10
                        }}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Selectează disciplina"
                        error={form.formState.errors.discipline_id?.message}
                        searchPlaceholder="Caută disciplina..."
                      />
                    </FormControl>
                    <FormMessage className="col-start-2" />
                  </FormItem>
                )}
              />

              {/* Clasa */}
              <FormField
                control={form.control}
                name="class_id"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-[150px_1fr] items-center gap-4">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Clasa
                    </FormLabel>
                    <FormControl>
                      <SearchableDropdown
                        controller={{
                          controller: classesController,
                          valueField: "id",
                          labelField: "name",
                          pageSize: 10
                        }}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Selectează clasa"
                        error={form.formState.errors.class_id?.message}
                        searchPlaceholder="Caută clasa..."
                        disabled={!form.watch('discipline_id')} // Disable until discipline is selected
                      />
                    </FormControl>
                    {!form.watch('discipline_id') && (
                      <p className="col-start-2 text-sm text-amber-600">
                        Selectează mai întâi disciplina pentru a vedea clasele disponibile
                      </p>
                    )}
                    <FormMessage className="col-start-2" />
                  </FormItem>
                )}
              />

              {/* Data */}
              <FormField
                control={form.control}
                name="created_at"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-[150px_1fr] items-center gap-4">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Data
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Data creării"
                        error={form.formState.errors.created_at?.message}
                        disabled={true} // Disable the date picker
                      />
                    </FormControl>
                    <FormMessage className="col-start-2" />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-[150px_1fr] items-center gap-4">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Status
                    </FormLabel>
                    <FormControl>
                      <div className="text-gray-500 px-3 py-2">
                        {statusOptions.find(option => option.value === field.value)?.label || "Ciornă"}
                      </div>
                    </FormControl>
                    <FormMessage className="col-start-2" />
                  </FormItem>
                )}
              />

              {/* Mentor */}
              <FormField
                control={form.control}
                name="mentor_id"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-[150px_1fr] items-center gap-4">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Mentor
                    </FormLabel>
                    <FormControl>
                      <UserSelect
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Selectează mentor"
                        error={form.formState.errors.mentor_id?.message}
                      />
                    </FormControl>
                    <FormMessage className="col-start-2" />
                  </FormItem>
                )}
              />

              {/* Section Title */}
              <div className="pt-4">
                <h3 className="text-lg font-medium text-gray-900">Prezentarea resursei educaționale</h3>
              </div>

              {/* Competența specifică */}
              <FormField
                control={form.control}
                name="specific_competency_id"
                render={({ field }) => {
                  // Create a custom controller config with filters based on selected class
                  const competencyControllerConfig = {
                    controller: specificCompetenciesController,
                    valueField: "id" as keyof SpecificCompetencyWithRelations,
                    labelField: "name" as keyof SpecificCompetencyWithRelations,
                    pageSize: 10,
                    // Don't filter by ID when in edit mode to allow showing the existing value
                    customFilters: []
                  };

                  return (
                    <FormItem className="grid grid-cols-[150px_1fr] items-center gap-4">
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Competența specifică
                      </FormLabel>
                      <FormControl>
                        <SearchableDropdown
                          controller={competencyControllerConfig}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Selectează competența"
                          error={form.formState.errors.specific_competency_id?.message}
                          searchPlaceholder="Caută competența..."
                          disabled={!form.watch('class_id')} // Disable until class is selected
                        />
                      </FormControl>
                      {!form.watch('class_id') && (
                        <p className="col-start-2 text-sm text-amber-600">
                          Selectează mai întâi clasa pentru a vedea competențele disponibile
                        </p>
                      )}
                      <FormMessage className="col-start-2" />
                    </FormItem>
                  );
                }}
              />

              {/* Durata resursei */}
              <FormField
                control={form.control}
                name="durata"
                render={({ field }) => {
                  // Log the field value to debug
                  console.log("Durata field value:", field.value);
                  console.log("Resource durata:", resource?.durata);

                  return (
                    <FormItem className="grid grid-cols-[150px_1fr] items-center gap-4">
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Durata resursei (min)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="Completează durata resursei"
                        />
                      </FormControl>
                      <FormMessage className="col-start-2" />
                    </FormItem>
                  );
                }}
              />

              {/* Link */}
              <FormField
                control={form.control}
                name="link"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-[150px_1fr] items-center gap-4">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Link
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Adaugă un link extern către resursă"
                      />
                    </FormControl>
                    <FormMessage className="col-start-2" />
                  </FormItem>
                )}
              />

              {/* Scurtă prezentare */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-1 gap-2">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Scurtă prezentare a resursei educaționale propuse
                    </FormLabel>
                    <FormControl>
                      <TextArea
                        {...field}
                        placeholder="Descrie pe scurt..."
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Section Title */}
              <div className="pt-4">
                <h3 className="text-lg font-medium text-gray-900">Comentarii</h3>
              </div>

              {/* Comentarii */}
              <FormField
                control={form.control}
                name="comentarii"
                render={({ field }) => {
                  // Log the field value to debug
                  console.log("Comentarii field value:", field.value);
                  console.log("Resource comentarii:", resource?.comentarii);

                  return (
                    <FormItem className="grid grid-cols-1 gap-2">
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Alte aspecte utile de împărtășit cu privire la utilizarea resursei educaționale în activitatea cu elevii
                      </FormLabel>
                      <FormControl>
                        <TextArea
                          {...field}
                          value={field.value || ""}
                          placeholder="Adaugă detalii aici"
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
