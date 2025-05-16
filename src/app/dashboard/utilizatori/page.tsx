"use client"

import { useEffect, useState, useMemo } from "react"
import { PlusCircle, Edit, Copy, Trash2, UserIcon, CalendarIcon, GraduationCapIcon, MoreHorizontal, Ban, CheckCircle, RefreshCw, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { DataTable, type Filter } from "@/components/ui/data-table/data-table"
import { type ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ro } from "date-fns/locale"
import { useUsersCrud, useGroupsCrud, useUsersController, UserRole } from "@/hooks/use-controllers"
import { AddUserDialog } from "@/components/users/add-user-dialog"
import { toast } from "sonner"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AddBulkUserDialog } from "@/components/users/add-bulk-user-dialog"
import { useAuth } from "@/lib/auth-context"
import pLimit from 'p-limit';

export default function UtilizatoriPage() {
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [isBulkAddUsersDialogOpen, setIsBulkAddUsersDialogOpen] = useState(false)
  const userController = useUsersController();

  // Use auth context for inviting users
  const { inviteUser } = useAuth()

  // Controller configs for dropdowns
  const { useList: useUsers } = useUsersCrud()
  
  // Table filters for DataTable
  const tableFilters: Filter[] = [
    {
      id: "rol",
      label: "Rol",
      type: "select",
      options: [
        { value: "ADMINISTRATOR", label: "Administrator" },
        { value: "MODERATOR", label: "Moderator" },
        { value: "FORMATOR", label: "Formator" },
        { value: "EVALUATOR", label: "Evaluator" },
        { value: "STUDENT", label: "Student" },
      ],
      icon: <UserIcon className="h-4 w-4 text-gray-400" />,
      queryColumn: "role"
    }
  ]

  // Handle adding a new user
  const handleAddUser = async (email: string, roles: string[]) => {
    try {
      if (roles.length === 0) {
        toast.error("Trebuie să selectezi cel puțin un rol")
        return
      }

      // Use the primary role (first in the array)
      const primaryRole = roles[0] as UserRole

      // Invite the user using the auth context function
      const success = await inviteUser(email, primaryRole)

      if (success) {
        toast.success("Utilizator invitat cu succes")
        setIsAddUserDialogOpen(false)
      }
    } catch (error) {
      console.error("Error adding user:", error)
      toast.error("Eroare la invitarea utilizatorului")
    }
  }

  const handleAddUsers = async (users: any[]) => {
    try {
      let successCount = 0;
      let existingCount = 0;
      let errorCount = 0;
  
      const validUsers = users.filter(user => user.email && user.role);
   
      for(let i = 0; i < validUsers.length; i++) {
        const user = validUsers[i];
        try {
          const existingUser = await userController.findOneByFilter({
            filters: [{
              column: "email",
              operator: "eq",
              value: user.email
            }]
          });

          if (existingUser) {
            console.log(`User with email ${user.email} already exists`);
            toast.warning(`Utilizatorul cu email ${user.email} există deja`);
            existingCount++;
            continue;
          }
          await inviteUser(user.email, user.role);
          await new Promise(resolve => setTimeout(resolve, 500)); 
          successCount++;
        } catch (err) {
          console.error(`Error processing user ${user.email}:`, err);
          errorCount++;
        }
      }
  
      if (successCount > 0) {
        toast.success(`${successCount} utilizatori invitați cu succes`);
      }
      if (existingCount > 0) {
        toast.info(`${existingCount} utilizatori există deja`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} utilizatori nu au putut fi invitați`);
      }
  
      setIsBulkAddUsersDialogOpen(false);
    } catch (error) {
      console.error("Error adding users:", error);
      toast.error("Eroare la invitarea utilizatorilor");
    }
  };

  // Generate a color based on a string
  const getColorFromString = (str: string) => {
    const colors = ['#4F7FFF', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#3F51B5']
    const index = str.charCodeAt(0) % colors.length
    return colors[index]
  }

  // Generate initials from a name
  const getInitials = (firstName?: string | null, lastName?: string | null, email?: string) => {
    const fullName = `${firstName || ''} ${lastName || ''}`.trim() || email || ''
    return fullName
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

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
            className="h-4 w-4 rounded border-gray-300"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="h-4 w-4 rounded border-gray-300"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "nume",
      header: "Nume",
      accessorFn: (user) => `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
      cell: ({ row }) => {
        const user = row.original
        const initials = getInitials(user.first_name, user.last_name, user.email)
        const color = getColorFromString(user.id)
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8" style={{ backgroundColor: color }}>
              <span className="text-xs font-medium text-white">{initials}</span>
            </Avatar>
            <div className="font-medium">{`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email}</div>
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
      accessorKey: "status",
      header: "Status",
      accessorFn: (user) => user.status || 'activ',
      cell: ({ row }) => {
        const status = row.getValue("status") as string || 'activ';
        return (
          <div className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${getStatusClass(status)}`}>
            {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
          </div>
        );
      },
    },
    {
      accessorKey: "nivel",
      header: "Nivel",
      // This is a placeholder - you'll need to add educational level data to your users
      accessorFn: () => "N/A",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-1">
            <GraduationCapIcon className="h-4 w-4 text-gray-500" />
            <span>N/A</span>
          </div>
        )
      },
    },
    {
      accessorKey: "rol",
      header: "Rol",
      accessorFn: (user) => user.role,
      cell: ({ row }) => {
        const role = row.getValue("rol") as string
        return (
          <div className="capitalize">{role.toLowerCase()}</div>
        )
      },
    },
    {
      accessorKey: "data",
      header: "Data",
      accessorFn: (user) => user.created_at,
      cell: ({ row }) => {
        const date = row.getValue("data") as string
        return (
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-4 w-4 text-gray-500" />
            <span>{format(new Date(date), 'dd MMM yyyy', { locale: ro })}</span>
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "Acțiuni",
      cell: ({ row }) => {
        const user = row.original
        const status = user.status?.toLowerCase() || 'activ'
        const { updateUserStatus, resendInvitation, removeInvitedUser } = useAuth()

        const handleStatusChange = async () => {
          if (status === 'active' || status === 'activ') {
            await updateUserStatus(user.id, 'INACTIVE')
          } else if (status === 'inactive' || status === 'inactiv') {
            await updateUserStatus(user.id, 'ACTIVE')
          }
        }

        const handleResendInvitation = async () => {
          await resendInvitation(user.email)
        }

        const handleRemoveUser = async () => {
          await removeInvitedUser(user.id)
        }

        return (
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-0" align="end">
                <div className="py-1">
                  {(status === 'active' || status === 'activ') && (
                    <button
                      onClick={handleStatusChange}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Ban className="mr-2 h-4 w-4 text-gray-500" />
                      Dezactivează
                    </button>
                  )}
                  {(status === 'inactive' || status === 'inactiv') && (
                    <button
                      onClick={handleStatusChange}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      Activează
                    </button>
                  )}
                  {status === 'invited' && (
                    <>
                      <button
                        onClick={handleResendInvitation}
                        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <RefreshCw className="mr-2 h-4 w-4 text-blue-500" />
                        Retrimite invitație
                      </button>
                      <button
                        onClick={handleRemoveUser}
                        className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                        Elimină
                      </button>
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )
      },
    },
  ]

  // Get status styles for the status badges
  const getStatusClass = (status: string) => {
    return getStatusStyles(status)
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Utilizatori</h1>
        <div className="flex items-center gap-2">
          <Button
            className="flex items-center gap-1"
            variant="outline"
            onClick={() => { setIsBulkAddUsersDialogOpen(true) }}
          >
            <Upload className="h-4 w-4" />
            Adaugă în masă
          </Button>
          <Button
            className="flex items-center gap-1"
            onClick={() => setIsAddUserDialogOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
            Adaugă utilizator
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        <DataTable
          columns={columns}
          useQueryHook={useUsers}
          useController={useUsersController}
          filters={tableFilters}
          enableRowSelection={true}
          searchColumns={['email', 'first_name', 'last_name']}
          rowCountText="utilizatori"
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

      {/* Add User Dialog */}
      <AddUserDialog
        open={isAddUserDialogOpen}
        onOpenChange={setIsAddUserDialogOpen}
        onAddUser={handleAddUser}
      />

      {/* Add Bulk User Dialog */}
      <AddBulkUserDialog
        open={isBulkAddUsersDialogOpen}
        onOpenChange={setIsBulkAddUsersDialogOpen}
        onAddUsers={handleAddUsers}
      />

    </div>
  )
}

// Helper function to get status styles
function getStatusStyles(status: string): string {
  switch (status.toLowerCase()) {
    case "active":
    case "activ":
      return "bg-green-50 text-green-700 border border-green-200"
    case "inactive":
    case "inactiv":
      return "bg-gray-50 text-gray-700 border border-gray-200"
    case "suspended":
    case "suspendat":
      return "bg-red-50 text-red-700 border border-red-200"
    case "invited":
      return "bg-blue-50 text-blue-700 border border-blue-200"
    default:
      return "bg-gray-50 text-gray-700 border border-gray-200"
  }
}
