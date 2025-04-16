"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Users, BookOpen, Plus, UserPlus } from "lucide-react"
import { DataTable, type Filter } from "@/components/ui/data-table/data-table"
import { type ColumnDef } from "@tanstack/react-table"
import { Avatar } from "@/components/ui/avatar"
import { useGroups, useCreateGroup, useDeleteGroup } from "@/hooks/groups/use-groups"
import { useUsers, useUsersByGroupId, useUsersByGroupOwnerId } from "@/hooks/users/use-users"
import { format } from "date-fns"
import { ro } from "date-fns/locale"
import { SidebarProvider, Sidebar, SidebarItem, SidebarSection } from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MultiSelectUser } from "@/components/ui/form/multi-select-user"
import { useCreateGroupMember, useDeleteGroupMembersByGroupId } from "@/hooks/group-members/use-group-members"
import { UserRow } from "@/queries/users-controller"

type GroupMember = any

// Define the form schema
const groupFormSchema = z.object({
  name: z.string().min(1, "Numele grupei este obligatoriu"),
  description: z.string().optional(),
  users: z.array(z.any()).optional(),
})

type GroupFormValues = z.infer<typeof groupFormSchema>

export default function GrupePage() {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false)
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  // Create group mutation
  const { mutate: createGroup, isPending } = useCreateGroup()
  const { mutate: deleteGroup, isPending: isDeleting } = useDeleteGroup()
  const { mutate: createGroupMember, isPending: isAddingMember } = useCreateGroupMember()
  const { mutate: deleteGroupMembers, isPending: isDeletingMembers } = useDeleteGroupMembersByGroupId()

  // Fetch all groups for sidebar
  const { data: groupData, isLoading: groupsLoading } = useGroups({ pageSize: 100 })
  const groups = groupData?.data || []

  // Create a dynamic query hook that switches between useUsersByGroupId and useUsersByGroupOwnerId
  const useDynamicUsersQuery = (params?: any) => {
    if (selectedGroup) {
      // If a group is selected, show members of that specific group
      return useUsersByGroupId(selectedGroup, params);
    } else if (user) {
      // If no group is selected, show members of all groups owned by the current user
      return useUsersByGroupOwnerId(user.id, params);
    } else {
      // Fallback to regular users query if no user is logged in (shouldn't happen)
      return useUsers(params);
    }
  };

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
    labelField: "username" as const,
    pageSize: 5
  }), [])

  // Form definition using react-hook-form
  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      name: "",
      description: "",
      users: [],
    },
  })

  // Handle form submission
  const onSubmit = (values: GroupFormValues) => {
    if (!user) return

    createGroup({
      name: values.name,
      description: values.description || null,
      created_by: user.id,
    }, {
      onSuccess: (newGroup) => {
        // Add selected users to the group
        if (values.users && values.users.length > 0) {
          // Create group members for each selected user
          values.users.forEach((selectedUser: UserRow) => {
            createGroupMember({
              group_id: newGroup.id,
              user_id: selectedUser.id,
              role: "MEMBER",
            })
          })
        }

        toast({
          title: "Grupă creată cu succes",
          description: "Grupa a fost creată cu succes.",
        })
        setIsDialogOpen(false)
        form.reset()
      },
      onError: (error: Error) => {
        toast({
          title: "Eroare",
          description: `A apărut o eroare la crearea grupei: ${error.message}`,
          variant: "destructive",
        })
      }
    })
  }

  // Handle group deletion
  const handleDeleteGroup = (groupId: string) => {
    setGroupToDelete(groupId)
    setIsDeleteDialogOpen(true)
  }

  // Confirm group deletion
  const confirmDeleteGroup = () => {
    if (!groupToDelete) return

    // First delete all group members
    deleteGroupMembers(groupToDelete, {
      onSuccess: () => {
        // Then delete the group itself
        deleteGroup(groupToDelete, {
          onSuccess: () => {
            toast({
              title: "Grupă ștearsă cu succes",
              description: "Grupa a fost ștearsă cu succes.",
            })
            // If the deleted group was selected, clear the selection
            if (selectedGroup === groupToDelete) {
              setSelectedGroup(null)
            }
            setIsDeleteDialogOpen(false)
            setGroupToDelete(null)
          },
          onError: (error: Error) => {
            toast({
              title: "Eroare",
              description: `A apărut o eroare la ștergerea grupei: ${error.message}`,
              variant: "destructive",
            })
            setIsDeleteDialogOpen(false)
            setGroupToDelete(null)
          }
        })
      },
      onError: (error: Error) => {
        toast({
          title: "Eroare",
          description: `A apărut o eroare la ștergerea membrilor grupei: ${error.message}`,
          variant: "destructive",
        })
        setIsDeleteDialogOpen(false)
        setGroupToDelete(null)
      }
    })
  }

  // Add member form schema
  const addMemberFormSchema = z.object({
    users: z.array(z.object({
      id: z.string(),
      username: z.string(),
      first_name: z.string().nullable(),
      last_name: z.string().nullable(),
      email: z.string().nullable(),
      avatar_url: z.string().nullable(),
      role: z.enum(["ADMINISTRATOR", "MODERATOR", "FORMATOR", "EVALUATOR", "STUDENT"]).nullable(),
      status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).nullable(),
      created_at: z.string(),
      updated_at: z.string(),
      education_level_id: z.number().nullable(),
    })).min(1, "Selectați cel puțin un utilizator"),
  })

  // Add member form
  const addMemberForm = useForm<z.infer<typeof addMemberFormSchema>>({
    resolver: zodResolver(addMemberFormSchema),
    defaultValues: {
      users: [],
    },
  })

  // Handle add member form submission
  const onAddMemberSubmit = (values: z.infer<typeof addMemberFormSchema>) => {
    if (!selectedGroup) return

    // Add each selected user to the group
    values.users.forEach((user) => {
      createGroupMember({
        group_id: selectedGroup,
        user_id: user.id,
        role: "MEMBER",
      }, {
        onSuccess: () => {
          toast({
            title: "Membru adăugat cu succes",
            description: `${user.first_name || user.username} a fost adăugat în grupă.`,
          })
        },
        onError: (error: Error) => {
          toast({
            title: "Eroare",
            description: `A apărut o eroare la adăugarea membrului: ${error.message}`,
            variant: "destructive",
          })
        }
      })
    })

    // Close dialog and reset form
    setIsAddMemberDialogOpen(false)
    addMemberForm.reset()
  }

  // Table filters for DataTable
  const tableFilters: Filter[] = [
    {
      id: "grupa",
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
      accessorKey: "name",
      header: "Nume",
      accessorFn: (user) => `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
      cell: ({ row }) => {
        const member = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8" style={{ backgroundColor: member.color }}>
              <div className="text-xs font-medium text-white">{member.initials}</div>
            </Avatar>
            <div className="font-medium">{`${member.first_name || ''} ${member.last_name || ''}`.trim() || member.username}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      accessorFn: (user) => user.email || '',
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
    },
    // {
    //   id: "actions",
    //   header: "Acțiuni",
    //   cell: ({ row }) => {
    //     return (
    //       <div className="flex items-center gap-2">
    //         <Button variant="ghost" size="sm" className="h-8 w-8">
    //           <Edit className="h-4 w-4" />
    //         </Button>
    //         <Button variant="ghost" size="sm" className="h-8 w-8">
    //           <Copy className="h-4 w-4" />
    //         </Button>
    //         <Button variant="ghost" size="sm" className="h-8 w-8 text-red-500">
    //           <Trash2 className="h-4 w-4" />
    //         </Button>
    //       </div>
    //     )
    //   },
    // },
  ]

  // Generate initials from a name
  const getInitials = (firstName: string, lastName: string, username?: string) => {
    const fullName = `${firstName} ${lastName}`.trim() || username || ''
    return fullName
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  // Generate a color based on a string
  const getColorFromString = (str: string) => {
    const colors = ['#4F7FFF', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#3F51B5']
    const index = str.charCodeAt(0) % colors.length
    return colors[index]
  }

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
                  key={group.id}
                  isActive={selectedGroup === group.id}
                  onClick={() => toggleGroupSelection(group.id)}
                  icon={<Users className="h-4 w-4" />}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{group.name}</span>
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
              {selectedGroup ? groups.find(g => g.id === selectedGroup)?.name || "Grupe" : "Toate grupele"}
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
                    onClick={() => handleDeleteGroup(selectedGroup)}
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
              useQueryHook={useDynamicUsersQuery}
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
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Șterge grupa</DialogTitle>
            <DialogDescription>
              Ești sigur că vrei să ștergi această grupă? Această acțiune nu poate fi anulată.
              Aceasta va șterge permanent grupa și toți membrii asociați.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Anulează
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteGroup}
              disabled={isDeleting || isDeletingMembers}
            >
              {isDeleting || isDeletingMembers ? "Se șterge..." : "Șterge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adaugă cursanți în grupă</DialogTitle>
            <DialogDescription>
              Selectează cursanții pe care dorești să-i adaugi în grupă.
            </DialogDescription>
          </DialogHeader>
          <Form {...addMemberForm}>
            <form onSubmit={addMemberForm.handleSubmit(onAddMemberSubmit)} className="space-y-4">
              <FormField
                control={addMemberForm.control}
                name="users"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cursanți</FormLabel>
                    <FormControl>
                      <MultiSelectUser
                        value={field.value || []}
                        onChange={field.onChange}
                        placeholder="Selectează cursanții"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddMemberDialogOpen(false)
                    addMemberForm.reset()
                  }}
                >
                  Anulează
                </Button>
                <Button type="submit" disabled={isAddingMember}>
                  {isAddingMember ? "Se adaugă..." : "Adaugă"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Create Group Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Creează o grupă nouă</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nume</FormLabel>
                    <FormControl>
                      <Input placeholder="Numele grupei" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descriere</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrierea grupei"
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="users"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Membri</FormLabel>
                    <FormControl>
                      <MultiSelectUser
                        value={field.value || []}
                        onChange={field.onChange}
                        placeholder="Selectează membrii grupei"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Anulează
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Se creează..." : "Creează"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
