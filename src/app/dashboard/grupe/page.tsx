"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Trash2,
  Users,
  BookOpen,
  Plus,
  UserPlus,
  Upload,
  UserCircle,
  Check,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Select } from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { DataTable, type Filter } from "@/components/ui/data-table/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { Avatar } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { SidebarProvider } from "@/components/ui/sidebar";
import InfiniteGroupsSidebar from "@/components/groups/InfiniteGroupsSidebar";
import {
  useAuth,
  isAdmin,
  isModerator,
  isStudent,
  isEvaluator,
} from "@/lib/auth-context";
import { z } from "zod";
import { AvatarFallback, AvatarImage } from "@/components/ui/avatar-components";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import {
  GroupMember,
  groupMemberRelationMap,
  useGroupMembersController,
  useGroupMembersCrud,
  useGroupsController,
  useGroupsCrud,
  useUsersController,
  useUsersCrud,
} from "@/hooks/use-controllers";
import { QueryFilter, UsePaginatedHook } from "@/lib/query-controller";
import { AddGroupDialog } from "@/components/groups/add-group-dialog";
import { DeleteGroupDialog } from "@/components/groups/delete-group-dialog";
import { AddStudentsDialog } from "@/components/groups/add-students-dialog";
import { BulkUploadGroupsDialog } from "@/components/groups/bulk-upload-group";
import { BulkUploadMembersDialog } from "@/components/groups/bulk-upload-members";
import { GroupMemberCard } from "@/components/groups/group-member-card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

// Define the form schema
const groupFormSchema = z.object({
  name: z.string().min(1, "Numele grupei este obligatoriu"),
  description: z.string().optional(),
  mentor_id: z.string().optional(),
});

type GroupFormValues = z.infer<typeof groupFormSchema>;

// Helper function to render user profiles in dropdowns
const renderProfile = (
  user: any,
  isSelected: boolean,
  onChange: (value: any | null) => void
) => {
  const firstName = user?.first_name ?? "";
  const lastName = user?.last_name ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Unknown";

  return (
    <div
      className="flex items-center gap-3 w-full py-2"
      onClick={() => onChange(user?.id)}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={user?.avatar_url || undefined} />
        <AvatarFallback>
          {firstName ? firstName[0]?.toUpperCase() : "U"}
          {lastName ? lastName[0]?.toUpperCase() : ""}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-medium text-sm truncate">{fullName}</span>
        <span className="text-xs text-muted-foreground truncate">
          {user?.email || "N/A"}
        </span>
      </div>
      {isSelected && (
        <Check className="ml-auto h-4 w-4 text-primary shrink-0" />
      )}
    </div>
  );
};

// Component to edit the group mentor
interface GroupMentorFormProps {
  groupId: string;
  initialMentorId: string;
}

function GroupMentorForm({ groupId, initialMentorId }: GroupMentorFormProps) {
  const { user } = useAuth();
  const isUserAdmin = isAdmin(user);
  const isUserModerator = isModerator(user);
  const isUserStudent = isStudent(user);
  const isUserEvaluator = isEvaluator(user);

  const usersController = useUsersController();
  const { useUpdate: updateGroup } = useGroupsCrud();

  const { useById: useUserById } = useUsersCrud();

  const { data: initialMentor, isLoading: isLoadingMentor } =
    useUserById(initialMentorId);

  // State to control the popover
  const [isOpen, setIsOpen] = useState(false);

  // Filter for mentors/formators
  const formatorFilter = useMemo<QueryFilter[]>(() => {
    return [{ column: "role", operator: "eq" as const, value: "FORMATOR" }];
  }, []);

  // Create form
  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      name: "",
      description: "",
      mentor_id: initialMentorId || "",
    },
  });

  // Update form values when initialMentorId changes
  useEffect(() => {
    if (initialMentorId) {
      form.setValue("mentor_id", initialMentorId);
    }
  }, [initialMentorId, form]);

  // Handle form submission
  const onSubmit = async (data: any) => {
    console.log("Group Data", groupId, data);

    if (!groupId || !data.mentor_id) return;

    try {
      await updateGroup.mutateAsync({
        id: groupId,
        record: {
          created_by: data.mentor_id,
        },
      });

      // Show success message
      toast({
        title: "Mentor actualizat",
        description: "Mentorul grupei a fost actualizat cu succes.",
      });
    } catch (error) {
      console.error("Error updating group mentor:", error);
      toast({
        title: "Eroare",
        description: "A apărut o eroare la actualizarea mentorului.",
        variant: "destructive",
      });
    }
  };

  // Handle mentor selection
  const handleMentorChange = (mentorId: string) => {
    console.log("Group Mentor selected", mentorId);

    // Set the value in the form
    form.setValue("mentor_id", mentorId);

    // Close the popover
    setIsOpen(false);

    // Directly call onSubmit with the form data
    onSubmit({ mentor_id: mentorId });
  };

  if (!groupId) {
    return null;
  }

  //   <div
  //   className={cn(
  //     "flex items-center rounded-md border bg-white cursor-pointer rounded-radius-04",
  //     isOpen ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-300",
  //     className
  //   )}
  //   onClick={handleOpenChange}
  // >
  //   {icon && <div className="pl-3 text-sm text-gray-600">{icon}</div>}
  //   <div className="px-3 py-2 text-sm text-gray-700">{label}</div>
  //   <div className="flex items-center gap-1 border-l border-gray-300 px-3 py-2 text-sm font-medium text-gray-900">
  //     {getDisplayValue()}
  //     <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
  //   </div>
  // </div>

  return (
    <Form {...form}>
      <div className="flex items-center gap-2 text-sm text-gray-500 pr-4">
        <FormField
          control={form.control}
          name="mentor_id"
          render={({ field }) => (
            <FormItem className="flex items-center m-0">
              <FormControl>
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                  <PopoverTrigger asChild>
                    <div
                      className={cn(
                        "flex items-center rounded-md border bg-white cursor-pointer",
                        isOpen
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-gray-300"
                      )}
                    >
                      {initialMentor ? (
                        <>
                          <div className="px-3 py-2 text-sm text-gray-700">
                            <span className="text-sm font-medium">Mentor</span>
                          </div>
                          <div className="flex items-center gap-1 border-l border-gray-300 px-3 py-2 text-sm font-medium text-gray-900">
                            <Avatar className="h-5 w-5 shrink-0">
                              <AvatarImage
                                src={initialMentor?.avatar_url || undefined}
                              />
                              <AvatarFallback>
                                {initialMentor.first_name
                                  ? initialMentor.first_name[0]?.toUpperCase()
                                  : "M"}
                                {initialMentor.last_name
                                  ? initialMentor.last_name[0]?.toUpperCase()
                                  : ""}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {initialMentor.first_name &&
                              initialMentor.last_name
                                ? `${initialMentor.first_name} ${initialMentor.last_name}`
                                : initialMentor.email || "Mentor nedefinit"}
                            </span>
                            {isUserAdmin && (
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${
                                  isOpen ? "rotate-180" : ""
                                }`}
                              />
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="px-3 py-2 text-sm text-gray-700">
                            <span className="text-sm font-medium">Mentor</span>
                          </div>
                          <div className="flex items-center gap-1 border-l border-gray-300 px-3 py-2 text-sm font-medium text-gray-900">
                            <span className="text-sm font-medium">
                              {isLoadingMentor
                                ? "Se încarcă..."
                                : "Nimic selectat"}
                            </span>
                            {isUserAdmin && (
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${
                                  isOpen ? "rotate-180" : ""
                                }`}
                              />
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </PopoverTrigger>
                  {isUserAdmin && (
                    <PopoverContent className="w-[320px] p-0" align="start">
                      <div className="p-2">
                        <SearchableDropdown
                          filterKey="mentor-dropdown-group-owner"
                          fetchHook={(params) =>
                            usersController.getPaginatedData(params)
                          }
                          value={field.value}
                          onChange={(value: string | null) => {
                            field.onChange(value);
                            handleMentorChange(value as string);
                          }}
                          valueField="id"
                          labelField="email"
                          placeholder="Selectează mentor"
                          error={form.formState.errors.mentor_id?.message}
                          searchColumns={["first_name", "last_name", "email"]}
                          filters={formatorFilter}
                          disabled={
                            isUserModerator || isUserEvaluator || isUserStudent
                          }
                          renderItem={(
                            user: any,
                            isSelected: boolean,
                            onChange
                          ) => {
                            return renderProfile(user, isSelected, onChange);
                          }}
                        />
                      </div>
                    </PopoverContent>
                  )}
                </Popover>
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
}

export default function GrupePage() {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [isBulkUploadGroupsDialogOpen, setIsBulkUploadGroupsDialogOpen] =
    useState(false);
  const [isBulkUploadMembersDialogOpen, setIsBulkUploadMembersDialogOpen] =
    useState(false);
  const { user, profile } = useAuth();

  // Create group mutation
  const { useList: useUsers } = useUsersCrud();
  const {
    useList: useGroups,
    useCreate: createGroup,
    useDelete: deleteGroup,
  } = useGroupsCrud();
  const {
    useList: useGroupMembers,
    useCreate: createGroupMember,
    useDelete: deleteGroupMembers,
  } = useGroupMembersCrud();

  // Fetch all groups for sidebar
  const groupsFilter: QueryFilter[] = useMemo(() => {
    if (profile && user) {
      // // // console.log("[LOG] getPaginatedData groups user role", profile.role)
      if (profile.role === "ADMINISTRATOR") {
        return [];
      }
      return [{ column: "created_by", operator: "eq", value: user.id }];
    }
    return [];
  }, [profile, user]);

  const { data: groupData, isLoading: groupsLoading } = useGroups({
    pageSize: 500,
    filters: groupsFilter,
  });
  const groups = groupData?.data || [];

  // Fetch users for dynamic query
  const groupMembersFilter: QueryFilter[] = useMemo(() => {
    if (selectedGroup) {
      return [
        {
          column: "group_id",
          operator: "eq",
          value: selectedGroup,
        },
      ];
    } else if (user) {
      if (user.role === "ADMINISTRATOR") {
        return [];
      }
      return [
        {
          column: "group.created_by",
          operator: "eq",
          value: user.id,
        },
      ];
    }
    return [];
  }, [selectedGroup, user]);

  const useGroupMembersWithFitler: UsePaginatedHook<GroupMember> = (params) =>
    useGroupMembers({
      ...(params || { pageSize: 100 }),
      filters: [...(params?.filters || []), ...groupMembersFilter],
    });

  // Toggle group selection
  const toggleGroupSelection = (groupId: string) => {
    if (selectedGroup === groupId) {
      // Deselect if already selected
      setSelectedGroup(null);
    } else {
      // Select the group
      setSelectedGroup(groupId);
    }
  };

  // Controller configs for dropdowns
  const groupControllerConfig = useMemo(
    () => ({
      valueField: "id" as const,
      labelField: "name" as const,
      pageSize: 5,
    }),
    []
  );
  const userControllerConfig = useMemo(
    () => ({
      valueField: "id" as const,
      labelField: "email" as const,
      pageSize: 5,
    }),
    []
  );

  // Handle group deletion
  const handleDeleteGroup = () => {
    setIsDeleteDialogOpen(true);
  };

  const groupController = useGroupsController();
  const userController = useUsersController();

  // Table filters for DataTable
  const tableFilters: Filter[] = [
    {
      id: "group_id",
      label: "Grupă",
      type: "controller",
      icon: <Users className="h-4 w-4 text-gray-400" />,
      queryColumn: "group_id",
      valueField: "id",
      labelField: "name",
      searchColumns: ["name"],
      fetchHook: (params) => groupController.getPaginatedData(params),
    },
    {
      id: "user",
      label: "Membru",
      type: "controller",
      icon: <BookOpen className="h-4 w-4 text-gray-400" />,
      queryColumn: "user_id",
      valueField: "id",
      labelField: "email",
      searchColumns: ["email", "first_name", "last_name"],
      fetchHook: (params) => userController.getPaginatedData(params),
    },
    // Add more filters as needed (e.g., by role, email, etc.)
  ];

  // Define columns for the data table
  const columns: ColumnDef<any>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "user",
      header: "Nume",
      cell: ({ row }) => {
        const member = row.original.user;
        return (
          <div className="flex items-center gap-3">
            <Avatar
              className="h-8 w-8"
              style={{ backgroundColor: member.color }}
            >
              <div className="text-xs font-medium text-white">
                {member.initials}
              </div>
            </Avatar>
            <div className="font-medium">
              {`${member.first_name || ""} ${member.last_name || ""}`.trim() ||
                member.email}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "user.email",
      header: "Email",
      accessorFn: (row) => row.user?.email || "",
    },
    {
      accessorKey: "role",
      header: "Rol",
      accessorFn: (user) => user.role,
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        return <div className="capitalize">{role.toLowerCase()}</div>;
      },
    },
    {
      accessorKey: "date",
      header: "Data",
      accessorFn: (user) => user.created_at,
      cell: ({ row }) => {
        const date = row.getValue("date") as string;
        return (
          <div className="flex items-center gap-1">
            <span>{format(new Date(date), "dd MMM yyyy", { locale: ro })}</span>
          </div>
        );
      },
    },
  ];

  // Check if mobile
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <SidebarProvider>
      <div className="flex h-[calc(100vh-15rem)]">
        {/* Sidebar for groups - Hidden on mobile */}
        <div className="hidden md:block">
          <InfiniteGroupsSidebar
            selectedGroup={selectedGroup}
            onSelect={toggleGroupSelection}
            filters={groupsFilter}
          />
        </div>
        {/* Main content */}
        <div className="flex-1 overflow-y-auto w-full min-w-0 max-w-full p-4 md:p-0">
          {/* Mobile sticky filter button - appears first on mobile */}
          {isMobile && (
            <div className="sticky top-0 z-40 bg-white -mx-4 px-4 pt-0">
              <Button
                onClick={() => setMobileFiltersOpen(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 mb-4"
              >
                <SlidersHorizontal className="h-5 w-5" />
                FILTRE
              </Button>
            </div>
          )}
          {/* Mobile Groups Dropdown - Only on mobile, above filters */}
          {isMobile && (
            <div className="mb-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selectedGroup
                      ? groups.find((g) => g?.id === selectedGroup)?.name
                      : "Toate grupele"}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[calc(100vw-3rem)] max-w-sm p-0 bg-white">
                  <Command>
                    <CommandInput
                      placeholder="Căutare grupă..."
                      className="bg-white"
                    />
                    <CommandEmpty>Nu s-au găsit grupe.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto bg-white">
                      <CommandItem
                        key="all"
                        value="all"
                        onSelect={() => {
                          setSelectedGroup(null);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            !selectedGroup ? "opacity-100" : "opacity-0"
                          )}
                        />
                        Toate grupele
                      </CommandItem>
                      {groups
                        .filter((g) => g !== null)
                        .map((group) => (
                          <CommandItem
                            key={group.id}
                            value={group.name}
                            onSelect={() => {
                              setSelectedGroup(group.id);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedGroup === group.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {group.name}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}
          {/* Header with title and actions */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-bold truncate">
                {selectedGroup
                  ? groups.find((g) => g?.id === selectedGroup)?.name || "Grupe"
                  : "Toate grupele"}
              </h1>
            </div>
            <div className="flex flex-col gap-3 w-full">
              {selectedGroup && (
                <div className="w-full overflow-x-auto">
                  <GroupMentorForm
                    groupId={selectedGroup}
                    initialMentorId={
                      groups.find((g) => g?.id === selectedGroup)?.created_by
                        ?.id || ""
                    }
                  />
                </div>
              )}
              <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:gap-2">
                {selectedGroup ? (
                  <>
                    <Button
                      variant="outline"
                      className="flex items-center justify-center w-full md:w-auto md:flex-1"
                      onClick={() => setIsAddMemberDialogOpen(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      <span className="truncate">Adaugă cursant</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200 hover:border-red-300 w-full md:w-auto md:flex-1"
                      onClick={() => handleDeleteGroup()}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      <span className="truncate">Șterge grupa</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="flex items-center justify-center w-full md:w-auto md:flex-1"
                      onClick={() => setIsBulkUploadGroupsDialogOpen(true)}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      <span className="truncate">Adaugă grupe bulk</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center justify-center w-full md:w-auto md:flex-1"
                      onClick={() => setIsBulkUploadMembersDialogOpen(true)}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      <span className="truncate">Adaugă cursanți bulk</span>
                    </Button>
                  </>
                )}
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="w-full md:w-auto md:flex-1"
                >
                  <Plus className="mr-2 h-4 w-4" />{" "}
                  <span className="truncate">Creează grupă</span>
                </Button>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <DataTable
              columns={columns}
              useQueryHook={useGroupMembersWithFitler}
              useController={useGroupMembersController}
              filters={tableFilters}
              enableRowSelection={true}
              hideMobileFilterButton={true}
              mobileFiltersOpen={mobileFiltersOpen}
              setMobileFiltersOpen={setMobileFiltersOpen}
              visibleColumnsConfig={{
                initialVisibleColumns: columnVisibility,
                columnDefinitions: [
                  { id: "name", label: "Nume" },
                  { id: "email", label: "Email" },
                  { id: "role", label: "Rol" },
                ],
                onVisibilityChange: setColumnVisibility,
              }}
              renderCard={(member) => (
                <GroupMemberCard
                  member={member}
                  onClick={() => {
                    // Optional: handle member click
                  }}
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* Delete Group Confirmation Dialog */}
      <DeleteGroupDialog
        open={isDeleteDialogOpen}
        onOpenChange={(val) => {
          setSelectedGroup(null);
          setIsDeleteDialogOpen(val);
        }}
        selectedGroup={selectedGroup}
      />

      {/* Add Member Dialog */}
      <AddStudentsDialog
        open={isAddMemberDialogOpen}
        onOpenChange={setIsAddMemberDialogOpen}
        groupId={selectedGroup ?? ""}
      />

      {/* Create Group Dialog */}
      <AddGroupDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />

      {/* Bulk Upload Groups Dialog */}
      <BulkUploadGroupsDialog
        open={isBulkUploadGroupsDialogOpen}
        onOpenChange={setIsBulkUploadGroupsDialogOpen}
      />

      {/* Bulk Upload Members Dialog */}
      <BulkUploadMembersDialog
        open={isBulkUploadMembersDialogOpen}
        onOpenChange={setIsBulkUploadMembersDialogOpen}
        groupId={selectedGroup ?? ""}
      />
    </SidebarProvider>
  );
}
