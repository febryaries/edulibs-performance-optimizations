"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Users, BookOpen, Plus, UserPlus } from "lucide-react"
import { DataTable, type Filter } from "@/components/ui/data-table/data-table"
import { type ColumnDef } from "@tanstack/react-table"
import { Avatar } from "@/components/ui/avatar"
import { format } from "date-fns"
import { ro } from "date-fns/locale"
import { SidebarProvider, Sidebar, SidebarItem, SidebarSection } from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth-context"
import { z } from "zod"
import { GroupMember, useGroupMembersController, useGroupMembersCrud, useGroupsCrud, useUsersCrud } from "@/hooks/use-controllers"
import { QueryFilter, UsePaginatedHook } from "@/lib/query-controller"
import { AddGroupDialog } from "@/components/groups/add-group-dialog"
import { DeleteGroupDialog } from "@/components/groups/delete-group-dialog"
import { AddStudentsDialog } from "@/components/groups/add-students-dialog"

// Define the form schema
const groupFormSchema = z.object({
  name: z.string().min(1, "Numele grupei este obligatoriu"),
  description: z.string().optional(),
  users: z.array(z.object({
    id: z.string(),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
    email: z.string().nullable(),
    avatar_url: z.string().nullable(),
    role: z.enum(["ADMINISTRATOR", "MODERATOR", "FORMATOR", "EVALUATOR", "STUDENT"]).nullable(),
    status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).nullable(),
    created_at: z.string(),
    updated_at: z.string(),
    education_level_id: z.number().nullable(),
  })).optional(),
})

type GroupFormValues = z.infer<typeof groupFormSchema>

export default function GrupePage() {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false)
  const { user, profile } = useAuth()

  // Create group mutation
  const { useList: useUsers } = useUsersCrud()
  const { useList: useGroups, useCreate: createGroup, useDelete: deleteGroup } = useGroupsCrud()
  const { useList: useGroupMembers, useCreate: createGroupMember, useDelete: deleteGroupMembers } = useGroupMembersCrud()

  // Fetch all groups for sidebar
  const groupsFilter: QueryFilter[] = useMemo(() => {
    if (profile && user) {
      console.log("[LOG] getPaginatedData groups user role", profile.role)
      if (profile.role === 'ADMINISTRATOR') {
        return []
      }
      return [{ column: 'created_by', operator: 'eq', value: user.id }]
    }
    return []
  }, [profile, user])

  const { data: groupData, isLoading: groupsLoading } = useGroups({ pageSize: 100, filters: groupsFilter })
  const groups = groupData?.data || []

  // Fetch users for dynamic query
  const groupMembersFilter: QueryFilter[] = useMemo(() => {
    if (selectedGroup) {
      return [
        {
          column: 'group.id',
          operator: 'eq',
          value: selectedGroup
        }
      ];
    } else if (user) {
      if (user.role === 'ADMINISTRATOR') {
        return [];
      }
      return [
        {
          column: 'group.created_by',
          operator: 'eq',
          value: user.id
        }
      ];
    }
    return [];
  }, [selectedGroup, user]);

  const useGroupMembersWithFitler: UsePaginatedHook<GroupMember> = (params) => useGroupMembers({
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
  const groupControllerConfig = useMemo(() => ({
    valueField: "id" as const,
    labelField: "name" as const,
    pageSize: 5
  }), [])
  const userControllerConfig = useMemo(() => ({
    valueField: "id" as const,
    labelField: "email" as const,
    pageSize: 5
  }), [])


  // Handle group deletion
  const handleDeleteGroup = () => {
    setIsDeleteDialogOpen(true)
  }

  // Table filters for DataTable
  const tableFilters: Filter[] = [
    {
      id: "group_id",
      label: "Grupă",
      type: "controller",
      icon: <Users className="h-4 w-4 text-gray-400" />,
      queryColumn: "group_id",
      controller: groupControllerConfig,
      controllerHook: useGroups
    },
    {
      id: "user",
      label: "Membru",
      type: "controller",
      icon: <BookOpen className="h-4 w-4 text-gray-400" />,
      queryColumn: "user_id",
      controller: userControllerConfig,
      controllerHook: useUsers
    }
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
            <Avatar className="h-8 w-8" style={{ backgroundColor: member.color }}>
              <div className="text-xs font-medium text-white">{member.initials}</div>
            </Avatar>
            <div className="font-medium">{`${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "user.email",
      header: "Email",
      accessorFn: (row) => row.user?.email || '',
    },
    {
      accessorKey: "role",
      header: "Rol",
      accessorFn: (user) => user.role,
      cell: ({ row }) => {
        const role = row.getValue("role") as string
        return (
          <div className="capitalize">{role.toLowerCase()}</div>
        )
      },
    },
    {
      accessorKey: "date",
      header: "Data",
      accessorFn: (user) => user.created_at,
      cell: ({ row }) => {
        const date = row.getValue("date") as string
        return (
          <div className="flex items-center gap-1">
            <span>{format(new Date(date), 'dd MMM yyyy', { locale: ro })}</span>
          </div>
        )
      },
    }
  ]

  return (
    <SidebarProvider>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar for groups */}
        <Sidebar
          className="h-full border-r border-gray-200"
        >
          <SidebarSection title="Toate grupele">
            {groupsLoading ? (
              <div className="p-4 text-center"></div>
            ) : groups.length === 0 ? (
              <div className="p-4 text-center">Nu există grupe</div>
            ) : (
              groups.map((group) => (
                <SidebarItem
                  key={group?.id}
                  isActive={selectedGroup === group?.id}
                  onClick={() => toggleGroupSelection(group?.id ?? '')}
                  icon={<Users className="h-4 w-4" />}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{group?.name}</span>
                  </div>
                </SidebarItem>
              ))
            )}
          </SidebarSection>
        </Sidebar>
        {/* Main content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Header with title and actions */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">
              {selectedGroup ? groups.find(g => g?.id === selectedGroup)?.name || "Grupe" : "Toate grupele"}
            </h1>
            <div className="flex space-x-2">
              {selectedGroup && (
                <>
                  <Button
                    variant="outline"
                    className="flex items-center space-x-1"
                    onClick={() => setIsAddMemberDialogOpen(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adaugă cursant
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center space-x-1 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200 hover:border-red-300"
                    onClick={() => handleDeleteGroup()}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Șterge grupa
                  </Button>
                </>
              )}
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Creează grupă
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            <DataTable
              columns={columns}
              useQueryHook={useGroupMembersWithFitler}
              useController={useGroupMembersController}
              filters={tableFilters}
              enableRowSelection={true}
              visibleColumnsConfig={{
                initialVisibleColumns: columnVisibility,
                columnDefinitions: [
                  { id: "name", label: "Nume" },
                  { id: "email", label: "Email" },
                  { id: "role", label: "Rol" },
                ],
                onVisibilityChange: setColumnVisibility
              }}
            />
          </div>
        </div>
      </div>

      {/* Delete Group Confirmation Dialog */}
      <DeleteGroupDialog
        open={isDeleteDialogOpen}
        onOpenChange={(val) => { setSelectedGroup(null); setIsDeleteDialogOpen(val); }}
        selectedGroup={selectedGroup}
      />

      {/* Add Member Dialog */}
      <AddStudentsDialog
        open={isAddMemberDialogOpen}
        onOpenChange={setIsAddMemberDialogOpen}
        groupId={selectedGroup ?? ''}
      />

      {/* Create Group Dialog */}
      <AddGroupDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </SidebarProvider>
  )
}
