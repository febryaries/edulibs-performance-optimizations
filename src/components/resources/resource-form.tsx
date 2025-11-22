"use client"

import { useRef, useEffect, useMemo, useCallback, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Save, Maximize2, Trash2, X, Check, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TextArea } from "@/components/ui/text-area"
import { SearchableDropdown } from "@/components/ui/searchable-dropdown"
import { DatePicker } from "@/components/ui/form/date-picker"
import { resourceSchema, type ResourceFormValues } from "@/schemas/resource-schema"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Tooltip } from "@/components/ui/tooltip"
import { isAdmin, isEvaluator, isModerator, isStudent, useAuth } from "@/lib/auth-context"
import {
  Resource,
  useResourcesCrud,
  Profile,
  useGroupMembersController,
  useSpecificCompetenciesController,
  useGeneralCompetenciesCrud,
  useGeneralCompetenciesController,
  useClassesController,
  useDisciplineClassController,
  useUsersController,
  useSpecificCompetenciesCrud,
  useDisciplinesCrud,
} from "@/hooks/use-controllers"
import { QueryFilter } from "@/lib/query-controller"
import { Avatar } from "../ui/avatar"
import { AvatarFallback, AvatarImage } from "../ui/avatar-components"
import type { SpecificCompetency } from "@/hooks/use-controllers";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "../ui/dialog"

// Mock data for dropdowns
const statusOptions = [
  { value: "DRAFT", label: "Ciornă" },
  { value: "CONFORMABLE", label: "Conform" },
  { value: "UNCONFORMABLE", label: "Neconform" },
  { value: "IN_REVIEW", label: "În evaluare" },
];



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
  const { user } = useAuth();
  const isUserAdmin = isAdmin(user);
  const isUserModerator = isModerator(user);
  const isUserStudent = isStudent(user);
  const isUserEvaluator = isEvaluator(user);
  const groupMembersController = useGroupMembersController();

  // --- End student mentor auto-set logic ---
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Determine if we're in edit mode
  const isEditModeLocal = isEditMode || (!!initialData?.title && initialData.title !== "Resursă Nouă");

  const { useById: useResourceById } = useResourcesCrud()
  const { data: resource } = useResourceById(resourceProp?.id || '');

  const classesController = useClassesController();
  const disciplineClassController = useDisciplineClassController();
  const usersController = useUsersController();
  const specificCompetenciesController = useSpecificCompetenciesController();

  // Multi-select state for competencies
  const [selectedCompetencies, setSelectedCompetencies] = useState<SpecificCompetency[]>([]);

  const { useAll: useAllSpecificCompetencies } = useSpecificCompetenciesCrud();

  // Extract competency IDs from the resource's specific_competencies
  const competencyIds = useMemo(() => {
    if (!resource?.specific_competencies) return [];

    // Extract the actual competency IDs from the nested structure
    return resource.specific_competencies.map(sc => sc.competency_id);
  }, [resource?.specific_competencies]);

  const competencies = useAllSpecificCompetencies({
    filters: [
      { column: 'id', operator: 'in', value: competencyIds },
    ]
  });

  // Effect to load competencies from resource when in edit mode
  useEffect(() => {
    if (isEditModeLocal && resource?.specific_competencies && competencies.data) {
      // Log for debugging
      console.log('Resource specific competencies:', resource.specific_competencies);
      console.log('Fetched competencies:', competencies.data);

      // Make sure we're getting the actual competency objects from the fetched data
      // that match the IDs in the resource's specific_competencies
      if (competencies.data && competencies.data.length > 0) {
        setSelectedCompetencies(competencies.data);
      }
    }
  }, [isEditModeLocal, resource?.specific_competencies, competencies.data]);

  // Determine if the form should be in moderator-only mode (only evaluator field editable)
  const isModeratorMode = isUserModerator && resource?.status === "IN_REVIEW" && !isUserAdmin;

  // Initialize form with react-hook-form and zod validation
  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: resource?.title || initialData?.title || "Resursă Nouă",
      discipline_id: resource?.discipline_id || initialData?.discipline_id || -1,
      discipline_text: resource?.discipline_text || initialData?.discipline_text || "",
      class_id: resource?.class_id || initialData?.class_id || -1,
      specific_competence_text: resource?.specific_competence_text || initialData?.specific_competence_text || "",
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

  async function setMentor() {
    if (!user) return;
    const group = await groupMembersController.findOneByFilter({
      filters: [
        { column: 'user_id', operator: 'eq', value: user?.id },
      ]
    });
    if (!group) return;
    console.log("MENTOR ID", group.group?.created_by)
    setMentorId(group.group?.created_by || null);
    form.setValue('mentor_id', group.group?.created_by);
  }

  // Set mentor_id for students on first group load
  useEffect(() => {
    if (isUserStudent) {
      setMentor()
    }
  }, [isUserStudent]);

  // Effect to manually reset form with resource values when in edit mode
  useEffect(() => {
    if (isEditModeLocal && resource) {
      // Create a complete form data object from the resource
      const formData = {
        title: resource.title || "Resursă Nouă",
        discipline_id: resource.discipline_id || -1,
        discipline_text: resource.discipline_text || "",
        class_id: resource.class_id || -1,
        specific_competence_text: resource.specific_competence_text || "",
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
      form.reset(formData);
      Object.entries(formData).forEach(([key, value]) => {
        // @ts-expect-error - we know these keys match our form fields
        form.setValue(key, value);
      });
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
      // Only trigger if the form is still valid (not being unmounted)
      if (form && form.formState) {
        form.trigger();
      }
    }
  }, [isEditModeLocal, resource, form]);

  // --- Memoized watched values for stable filter arrays ---
  const disciplineId = useWatch({ control: form.control, name: 'discipline_id' });
  const classId = useWatch({ control: form.control, name: 'class_id' });

  // Reset discipline and specific competency when class changes
  // Only reset discipline and specific competency when classId actually changes (not on first mount)
  const prevClassId = useRef<number | null>(null);
  useEffect(() => {
    if (prevClassId.current !== null && prevClassId.current !== classId) {
      form.setValue('discipline_id', -1);
    }
    prevClassId.current = classId;
  }, [classId, form]);

  const disciplineClassFilter: QueryFilter[] = useMemo(() => {
    if (!classId) return [];
    return [{
      column: 'class_id',
      operator: 'eq',
      value: classId
    }];
  }, [classId]);


  // const competenciesController = useGeneralCompetenciesController();
  // const { useAll } = useGeneralCompetenciesCrud();
  // const generalCompetencies = useAll({
  //   filters: [
  //     {
  //       column: 'discipline_id',
  //       operator: 'eq',
  //       value: disciplineId
  //     }
  //   ]
  // });

  const { useById: useDisciplineById } = useDisciplinesCrud()

  const discipline = useDisciplineById(disciplineId)

  const normalizeInternalCode = (internalCode: string, classId: number) => {

    if (!internalCode) return "";

    const mapClasToCode = {
      1: "grmica",
      2: "grmij",
      3: "grmare",
      4: "cl0",
      5: "cl1",
      6: "cl2",
      7: "cl3",
      8: "cl4",
      9: "cl5",
      10: "cl6",
      11: "cl7",
      12: "cl8",
      13: "cl9",
      14: "cl10",
      15: "cl11",
      16: "cl12",
      17: "cl13",
      18: "an1",
      19: "an2",
      20: "an3",
    }

    if (!mapClasToCode[classId as keyof typeof mapClasToCode]) return internalCode.toLowerCase().replaceAll(" ", "_");

    return internalCode.toLowerCase().replaceAll(" ", "_") + "_" + mapClasToCode[classId as keyof typeof mapClasToCode]
  }

  // Memoize the discipline name to prevent unnecessary filter recreation
  const disciplineName = useMemo(() => discipline?.data?.name || "", [discipline?.data?.name]);

  // Memoize the normalized internal code
  const internal_code = useMemo(() => normalizeInternalCode(disciplineName, classId), [disciplineName, classId]);



  const specificCompetencyFilter: QueryFilter[] = useMemo(() => {
    if (!classId || !disciplineId) {
      console.log('Missing classId or disciplineId for specificCompetencyFilter', { classId, disciplineId });
      return [];
    }

    console.log("specificCompetencyFilter ", classId, disciplineId, internal_code);

    // Create a simpler filter structure that directly filters by class_id and discipline_id
    const filter: QueryFilter[] = [
      {
        or: [
          {
            column: 'id',
            operator: 'eq',
            value: -1
          },
          {
            and: [
              { column: 'internal_code', 'operator': 'ilike', value: `%${internal_code}%` },
            ]
          }
        ]
      } as QueryFilter
    ];

    console.log('Generated specificCompetencyFilter:', filter);
    return filter;
  }, [classId, disciplineId, internal_code]);


  const [mentorId, setMentorId] = useState<string | null>(null);

  const formatorFilter: QueryFilter[] = useMemo(() => {
    // If the user is a student, restrict to only their assigned mentor (group creator)
    if (isUserStudent) {
      if (mentorId) {
        return [
          { column: 'id', operator: 'eq', value: mentorId },
          { column: 'status', operator: 'eq', value: "ACTIVE" },
        ];
      }
      // If no mentorId is set, show none
      // return [
      //   { column: 'id', operator: 'eq', value: "" }
      // ];
      return [];
    }
    // Otherwise, show all active formators
    return [
      { column: 'status', operator: 'eq', value: "ACTIVE" },
      { column: 'role', operator: 'eq', value: "FORMATOR" },
    ];
  }, [isUserStudent, form, mentorId]);


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

  // Handle form submission - just pass the form data to the parent's onSave
  const onSubmit = async (data: ResourceFormValues) => {

    console.log(selectedCompetencies);

    // Include selected competencies in the data passed to onSave
    const enhancedData = {
      ...data,
      // Pass the selected competencies to the parent component
      selectedCompetencies: selectedCompetencies
    };

    // Call the parent's onSave with the form data and selected competencies
    await onSave(enhancedData);
  }

  // Custom save handler to ensure validation before saving
  const handleSave = async () => {
    console.log('handleSave')

    // Safety check to ensure form is still valid and not being unmounted
    if (!form || !form.formState) {
      console.error('Form is not available for validation');
      return;
    }

    try {
      const isValid = await form.trigger();
      console.log('isValid', isValid)
      console.log('form.errors()', form.formState.errors)
      if (isValid) {
        form.handleSubmit(onSubmit)();
      }
      // If not valid, errors will be shown by FormMessage
    } catch (error) {
      console.error('Error during form validation:', error);
    }
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

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)



  return (
    <div className="flex flex-col h-full">

      <Dialog open={deleteDialogOpen} onOpenChange={() => { setDeleteDialogOpen(false); }}>
        <DialogContent className="sm:max-w-md bg-white rounded-md rounded-lg">
          <DialogHeader>
            <DialogTitle>Esti sigur ca vrei sa stergi resursa ?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setDeleteDialogOpen(false); }}
                >
                  Anulează
                </Button>
                <Button type="submit"
                  onClick={() => { setDeleteDialogOpen(false); if(resource) { onDelete && onDelete(resource.id) } }}
                >
                  {"Șterge" }
                </Button>
              </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center space-x-4">
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
            {isEditModeLocal ? "Editare resursă educațională" : "Resursă educațională nouă"}
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <Tooltip content={isEditModeLocal ? "Actualizează resursa" : "Salvează resursa"}>
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
          {isEditModeLocal && resource?.id && (
            <Tooltip content="Șterge resursa">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 text-gray-400 hover:text-gray-600"
                onClick={() => { setDeleteDialogOpen(true); }}
                aria-label="Șterge resursa"
              >
                <Trash2 className="h-6 w-6" />
              </Button>
            </Tooltip>
          )}

          {isEditModeLocal && resource?.id && (
            <>
              <div className="w-px h-6 bg-gray-300"></div>

              <Tooltip content="Înapoi">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 text-gray-400 hover:text-gray-600"
                  onClick={onBack || onClose}
                  aria-label="Înapoi"
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
              </Tooltip>
            </>
          )}

          <Tooltip content="Închide formularul">
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
                  <FormMessage className="text-red-600" />
                </div>
              )}
            />

            {/* Form Fields with labels on the left */}
            <div className="space-y-4">
              {/* Clasa */}
              <FormField
                control={form.control}
                name="class_id"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-[150px_1fr] items-center gap-4">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Clasa
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <SearchableDropdown
                        fetchHook={(params) => classesController.getPaginatedData(params)}
                        filterKey="classes-dropdown"
                        value={field.value}
                        onChange={field.onChange}
                        searchColumns={["name"]}
                        valueField={"id"}
                        labelField={"name"}
                        placeholder="Selectează clasa"
                        disabled={isModeratorMode}
                      />
                    </FormControl>
                    <FormMessage className="col-start-2 text-red-600" />
                  </FormItem>
                )}
              />

              {/* Disciplina */}
              <FormField
                control={form.control}
                name="discipline_id"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-[150px_1fr] items-center gap-4">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Disciplina
                    </FormLabel>
                    <FormControl>
                      <SearchableDropdown
                        fetchHook={(params) => disciplineClassController.getPaginatedData(params)}
                        filterKey="discipline-class-dropdown"
                        filters={disciplineClassFilter}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Selectează disciplina"
                        // error={form.formState.errors.class_id?.message}
                        // searchPlaceholder="Caută clasa..."
                        disabled={!form.watch('class_id') || isModeratorMode} // Disable until discipline is selected or in moderator mode
                        searchColumns={["discipline.name"]}
                        valueField={"discipline.id"}
                        labelField={"discipline.name"}
                      />
                    </FormControl>
                    {!form.watch('class_id') && (
                      <p className="col-start-2 text-sm text-amber-600">
                        Selectează mai întâi clasa pentru a vedea disciplinele disponibile
                      </p>
                    )}
                    <FormMessage className="col-start-2 text-red-600" />
                  </FormItem>
                )}
              />

              {/* Specific Competence Text - only shown when "Alta" is selected */}
              {(form.watch('discipline_id') == -1 && form.watch('class_id') != -1) && (
                <FormField
                  control={form.control}
                  name="discipline_text"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-[150px_1fr] items-center gap-4">
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Specificați Disciplina
                        <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <TextArea
                          {...field}
                          placeholder="Introduceți detalii despre disciplina"
                          disabled={isModeratorMode}
                          className="min-h-[80px]"
                        />
                      </FormControl>
                      <FormMessage className="col-start-2 text-red-600" />
                    </FormItem>
                  )}
                />
              )}

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
                    <FormMessage className="col-start-2 text-red-600" />
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
                    <FormMessage className="col-start-2 text-red-600" />
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
                        filterKey="mentor-dropdown"
                        fetchHook={(params) => usersController.getPaginatedData(params)}
                        value={field.value}
                        onChange={field.onChange}
                        valueField="id"
                        labelField="email"
                        placeholder="Selectează mentor"
                        error={form.formState.errors.mentor_id?.message}
                        searchColumns={["first_name", "last_name", "email"]}
                        filters={formatorFilter}
                        disabled={isModeratorMode || isUserEvaluator || isUserStudent}
                        renderItem={(user: any, isSelected: boolean, onChange) => {
                          // Defensive: fallback to empty string for missing fields
                          return renderProfile(user, isSelected, onChange)
                        }}
                      />
                    </FormControl>
                    <FormMessage className="col-start-2 text-red-600" />
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
                          filterKey="evaluator-dropdown"
                          fetchHook={(params) => usersController.getPaginatedData(params)}
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
                      <FormMessage className="col-start-2 text-red-600" />
                    </FormItem>
                  )}
                />
              )}

              {/* Section Title */}
              <div className="pt-4">
                <h3 className="text-lg font-medium text-gray-900">Prezentarea resursei educaționale</h3>
              </div>

              {/* Competențe specifice (multi-select) */}
              <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                <label className="text-sm font-medium text-gray-700">
                  Competențe specifice
                </label>
                <div>
                  <SearchableDropdown
                    filterKey="specific-competencies-dropdown-2"
                    fetchHook={useCallback((params) => {
                      console.log('Fetching specific competencies with params specificCompetencyFilter:', params);
                      return specificCompetenciesController.getPaginatedData(params)
                        .then(result => {
                          console.log('Specific competencies result:', result);
                          return result;
                        })
                        .catch(error => {
                          console.error('Error fetching specific competencies:', error);
                          throw error;
                        });
                    }, [specificCompetencyFilter])}
                    value={selectedCompetencies as any}
                    labelRender={(item) => {
                      return item.number ? item.number + " " + item.name : item.name;
                    }}
                    onChange={(val: any) => {
                      console.log('Selected competencies changed:', val);
                      // Ensure we always have an array of valid competencies
                      const competencies = Array.isArray(val) ? val.filter(Boolean) : [];
                      setSelectedCompetencies(competencies);
                    }}
                    mode="multiple"
                    placeholder="Selectează competențele"
                    filters={specificCompetencyFilter}
                    searchColumns={["name"]}
                    valueField={"id"}
                    labelField={"name"}
                    disabled={!form.watch('class_id') || isModeratorMode}
                  />
                  {!form.watch('class_id') && (
                    <p className="text-sm text-amber-600">
                      Selectează mai întâi clasa pentru a vedea competențele disponibile
                    </p>
                  )}
                </div>
              </div>

              {/* Specific Competence Text - only shown when "Alta" is selected */}
              {selectedCompetencies.some(comp => comp?.id === -1) && (
                <FormField
                  control={form.control}
                  name="specific_competence_text"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-[150px_1fr] items-center gap-4">
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Specificați competența
                        <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <TextArea
                          {...field}
                          placeholder="Introduceți detalii despre competența specifică"
                          disabled={isModeratorMode}
                          className="min-h-[80px]"
                        />
                      </FormControl>
                      <FormMessage className="col-start-2 text-red-600" />
                    </FormItem>
                  )}
                />
              )}

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
                      <FormMessage className="col-start-2 text-red-600" />
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
                    <FormMessage className="col-start-2 text-red-600" />
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
                    <FormMessage className="col-start-2 text-red-600" />
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
                    <FormMessage className="col-start-2 text-red-600" />
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
                      <FormMessage className="col-start-2 text-red-600" />
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