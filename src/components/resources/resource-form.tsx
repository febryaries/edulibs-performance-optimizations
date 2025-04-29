"use client"

import { useRef, useEffect, useMemo, useCallback } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Save, Maximize2, Trash2, X, Check, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TextArea } from "@/components/ui/text-area"
import { SearchableDropdown } from "@/components/ui/searchable-dropdown"
import { UserSelect } from "@/components/ui/form/user-select"
import { DatePicker } from "@/components/ui/form/date-picker"
import { resourceSchema, type ResourceFormValues } from "@/schemas/resource-schema"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useSupabaseBrowser } from "@/utils/supabase/client"
import { isAdmin, isModerator, isEvaluator, isStudent, useAuth } from "@/lib/auth-context"
import {
  Resource,
  useResourcesCrud,
  useDisciplineClassCrud,
  useDisciplinesCrud,
  useSpecificCompetenciesCrud,
  DisciplineClass,
  SpecificCompetency,
  useUsersCrud,
  Profile
} from "@/hooks/use-controllers"
import { QueryFilter, UsePaginatedHook } from "@/lib/query-controller"
import { Avatar } from "../ui/avatar"
import { AvatarFallback, AvatarImage } from "../ui/avatar-components"

// Mock data for dropdowns
const statusOptions = [
  { value: "DRAFT", label: "Ciornă" },
  { value: "CONFORMABLE", label: "Conform" },
  { value: "UNCONFORMABLE", label: "Neconform" },
  { value: "IN_REVIEW", label: "În evaluare" },
]

interface ResourceFormProps {
  onClose: () => void
  onBack?: () => void
  onSave: (data: ResourceFormValues) => void
  onDelete?: (id: number | string) => void
  onToggleFullScreen: () => void
  isFullScreen: boolean
  initialData?: Partial<ResourceFormValues>
  isEditMode?: boolean
  resource?: Resource | null
}

export function ResourceForm({
  onClose,
  onBack,
  onSave,
  onDelete,
  onToggleFullScreen,
  isFullScreen,
  initialData,
  isEditMode,
  resource: resourceProp
}: ResourceFormProps) {
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Determine if we're in edit mode
  const isEditModeLocal = isEditMode || (!!initialData?.title && initialData.title !== "Resursă Nouă");

  const { useById: useResourceById } = useResourcesCrud()
  const { data: resource } = useResourceById(resourceProp?.id || '');
  const { user } = useAuth();

  // Check user roles for permissions
  const isUserAdmin = isAdmin(user);
  const isUserModerator = isModerator(user);
  const isUserStudent = isStudent(user);

  // Determine if the form should be in moderator-only mode (only evaluator field editable)
  const isModeratorMode = isUserModerator && resource?.status === "IN_REVIEW" && !isUserAdmin;

  // Initialize form with react-hook-form and zod validation
  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: resource?.title || initialData?.title || "Resursă Nouă",
      discipline_id: resource?.discipline_id || initialData?.discipline_id || -1,
      class_id: resource?.class_id || initialData?.class_id || -1,
      specific_competency_id: resource?.specific_competency_id || initialData?.specific_competency_id || -1,
      created_at: resource?.created_at ? new Date(resource.created_at) : initialData?.created_at || new Date(),
      status: resource?.status || initialData?.status || "DRAFT",
      mentor_id: resource?.mentor_id || initialData?.mentor_id || "",
      evaluator_id: resource?.evaluator_id || initialData?.evaluator_id || "",
      description: resource?.description || initialData?.description || "",
      link: resource?.link || initialData?.link || "",
      durata: resource?.durata || initialData?.durata || "",
      comentarii: resource?.comentarii || initialData?.comentarii || "",
      aggregate: resource?.aggregate || initialData?.aggregate || "",
    },
  })

  // Focus the title input on mount
  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [])

  // Effect to manually reset form with resource values when in edit mode
  useEffect(() => {
    if (isEditModeLocal && resource) {
      // // console.log("[LOG] Manually resetting form with resource values:", resource);

      // Create a complete form data object from the resource
      const formData = {
        title: resource.title || "Resursă Nouă",
        discipline_id: resource.discipline_id || -1,
        class_id: resource.class_id || -1,
        specific_competency_id: resource.specific_competency_id || -1,
        created_at: resource.created_at ? new Date(resource.created_at) : new Date(),
        status: resource.status || "DRAFT",
        mentor_id: resource.mentor_id || "",
        evaluator_id: resource.evaluator_id || "",
        description: resource.description || "",
        link: resource.link || "",
        durata: resource.durata || "",
        comentarii: resource.comentarii || "",
        aggregate: resource.aggregate || "",
      };

      // Log the form data we're setting
      // // console.log("[LOG] Setting form values to:", formData);

      // Reset the form with these values
      form.reset(formData);

      // Also set each field individually to ensure it updates
      Object.entries(formData).forEach(([key, value]) => {
        // @ts-expect-error - we know these keys match our form fields
        form.setValue(key, value);
      });

      // Log the form values after reset
      // // console.log("[LOG] Form values after reset:", form.getValues());
    }
  }, [isEditModeLocal, resource, form]);

  // Effect to specifically set durata and comentarii fields
  useEffect(() => {
    if (isEditModeLocal && resource) {
      // Force update these fields which seem to have issues
      if (resource.durata) {
        // // console.log("[LOG] Explicitly setting durata field to:", resource.durata);
        form.setValue('durata', resource.durata);
      }

      if (resource.comentarii) {
        // // console.log("[LOG] Explicitly setting comentarii field to:", resource.comentarii);
        form.setValue('comentarii', resource.comentarii);
      }

      if (resource.aggregate) {
        // // console.log("[LOG] Explicitly setting aggregate field to:", resource.aggregate);
        form.setValue('aggregate', resource.aggregate);
      }

      // Force a form validation to update the UI
      form.trigger();
    }
  }, [isEditModeLocal, resource, form]);

  // --- Memoized watched values for stable filter arrays ---
  const disciplineId = useWatch({ control: form.control, name: 'discipline_id' });
  const classId = useWatch({ control: form.control, name: 'class_id' });

  const disciplineClassFilter: QueryFilter[] = useMemo(() => {
    if (!disciplineId) return [];
    return [{
      column: 'discipline_id',
      operator: 'eq',
      value: disciplineId
    }];
  }, [disciplineId]);

  const specificCompetencyFilter: QueryFilter[] = useMemo(() => {
    if (!classId || !disciplineId) return [];
    return [
      { column: 'class_id', operator: 'eq', value: classId },
      { column: 'competency.discipline_id', operator: 'eq', value: disciplineId }
    ];
  }, [classId, disciplineId]);

  const { useList: useDisciplines } = useDisciplinesCrud();
  const { useList: useDisciplineClass } = useDisciplineClassCrud();
  const { useList: useSpecificCompetencies } = useSpecificCompetenciesCrud();
  const { useList } = useUsersCrud();

  const formatorFilter: QueryFilter[] = useMemo(() => {
    return [
      {
      column: 'status',
      operator: 'eq',
      value: "ACTIVE",
    },
    {
      column: 'role',
      operator: 'eq',
      value: "FORMATOR",
    }
  ];
  }, []);


  const evalutaorFilter: QueryFilter[] = useMemo(() => {
    return [
      {
      column: 'status',
      operator: 'eq',
      value: "ACTIVE",
    },
    {
      column: 'role',
      operator: 'eq',
      value: "EVALUATOR",
    }
  ];
  }, []);

  // Handle form submission
  const onSubmit = (data: ResourceFormValues) => {
    onSave(data)
  }

  const renderProfile = (user: Profile, isSelected: boolean, onChange: (value: any | null) => void) => {
    const firstName = user?.first_name ?? ""
    const lastName = user?.last_name ?? ""
    const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Unknown"

    return (
      <div className="flex items-center gap-3 w-full py-2" onClick={() => onChange(user?.id)}>
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={user?.avatar_url || undefined} />
          <AvatarFallback>{firstName ? firstName[0]?.toUpperCase() : "U"}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-medium text-sm truncate">{fullName}</span>
          <span className="text-xs text-muted-foreground truncate">{user?.email || "N/A"}</span>
        </div>
        {isSelected && <Check className="ml-auto h-4 w-4 text-primary shrink-0" />}
      </div>
    )
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
                    disabled={isModeratorMode}
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
                        useQueryHook={useDisciplines}
                        value={field.value}
                        onChange={field.onChange}
                        searchColumns={["name"]}
                        valueField={"id"}
                        labelField={"name"}
                        placeholder="Selectează disciplina"
                        disabled={isModeratorMode}
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
                        useQueryHook={useDisciplineClass}
                        filters={disciplineClassFilter}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Selectează clasa"
                        // error={form.formState.errors.class_id?.message}
                        // searchPlaceholder="Caută clasa..."
                        disabled={!form.watch('discipline_id') || isModeratorMode} // Disable until discipline is selected or in moderator mode
                        searchColumns={["class.name"]}
                        valueField={"class.id"}
                        labelField={"class.name"}
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
                      <SearchableDropdown
                        useQueryHook={useList}
                        value={field.value}
                        onChange={field.onChange}
                        valueField="id"
                        labelField="email"
                        placeholder="Selectează mentor"
                        error={form.formState.errors.mentor_id?.message}
                        searchColumns={[ "first_name", "last_name", "email"]}
                        filters={formatorFilter}
                        disabled={isModeratorMode}
                        renderItem={(user: any, isSelected: boolean, onChange) => {
                          // Defensive: fallback to empty string for missing fields
                          return renderProfile(user, isSelected, onChange)
                        }}
                      />
                    </FormControl>
                    <FormMessage className="col-start-2" />
                  </FormItem>
                )}
              />

              {/* Evaluator - Only visible for non-STUDENT roles */}
              {!isUserStudent && (
                <FormField
                  control={form.control}
                  name="evaluator_id"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-[150px_1fr] items-center gap-4">
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Evaluator
                      </FormLabel>
                      <FormControl>
                        <SearchableDropdown
                          useQueryHook={useList}
                          value={field.value}
                          onChange={field.onChange}
                          valueField="id"
                          labelField="email"
                          placeholder="Selectează evaluator"
                          error={form.formState.errors.evaluator_id?.message}
                          searchColumns={["first_name", "last_name", "email"]}
                          filters={evalutaorFilter}
                          renderItem={(user: any, isSelected: boolean, onChange) => {
                            // Defensive: fallback to empty string for missing fields
                            return renderProfile(user, isSelected, onChange)
                          }}
                          disabled={!(isUserAdmin || isUserModerator)} // Only enabled for ADMIN and MODERATOR
                        />
                      </FormControl>
                      <FormMessage className="col-start-2" />
                    </FormItem>
                  )}
                />
              )}

              {/* Section Title */}
              <div className="pt-4">
                <h3 className="text-lg font-medium text-gray-900">Prezentarea resursei educaționale</h3>
              </div>

              {/* Competența specifică */}
              <FormField
                control={form.control}
                name="specific_competency_id"
                render={({ field }) => {

                  return (
                    <FormItem className="grid grid-cols-[150px_1fr] items-center gap-4">
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Competența specifică
                      </FormLabel>
                      <FormControl>
                        <SearchableDropdown
                          useQueryHook={useSpecificCompetencies}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Selectează competența"
                          filters={specificCompetencyFilter}
                          searchColumns={["name"]}
                          // error={form.formState.errors.specific_competency_id?.message}
                          disabled={!form.watch('class_id') || isModeratorMode} // Disable until class is selected or in moderator mode
                          valueField={"id"} labelField={"name"} />
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
                          disabled={isModeratorMode}
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
                        disabled={isModeratorMode}
                      />
                    </FormControl>
                    <FormMessage className="col-start-2" />
                  </FormItem>
                )}
              />

              {/* Aggregate */}
              <FormField
                control={form.control}
                name="aggregate"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-1 gap-2">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Conținut agregat
                    </FormLabel>
                    <FormControl>
                      <TextArea
                        {...field}
                        placeholder="Conținut agregat pentru căutare și filtrare"
                        className="min-h-[100px]"
                        disabled={isModeratorMode}
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
                        disabled={isModeratorMode}
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
                          disabled={isModeratorMode}
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
