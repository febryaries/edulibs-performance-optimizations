"use client"

import { useEffect, useState, useMemo } from "react"
import { PlusCircle, Edit, Copy, Trash2, UserIcon, CalendarIcon, GraduationCapIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { DataTable, type Filter } from "@/components/ui/data-table/data-table"
import { type ColumnDef } from "@tanstack/react-table"
import { useUsers } from "@/hooks/users/use-users"
import { useGroups } from "@/hooks/groups/use-groups"
import { createClient } from "@/utils/supabase/client"
import { format } from "date-fns"
import { ro } from "date-fns/locale"

export default function UtilizatoriPage() {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})

  // Controller configs for dropdowns
  const groupControllerConfig = useMemo(() => ({
    valueField: "id" as const,
    labelField: "name" as const,
    pageSize: 5
  }), [])

  // Table filters for DataTable
  const tableFilters: Filter[] = [
    {
      id: "grupa",
      label: "Grupă",
      type: "controller",
      icon: <GraduationCapIcon className="h-4 w-4 text-gray-400" />,
      queryColumn: "group_id",
      controller: groupControllerConfig,
      controllerHook: useGroups
    },
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

  // Generate a color based on a string
  const getColorFromString = (str: string) => {
    const colors = ['#4F7FFF', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#3F51B5']
    const index = str.charCodeAt(0) % colors.length
    return colors[index]
  }

  // Generate initials from a name
  const getInitials = (firstName?: string | null, lastName?: string | null, username?: string) => {
    const fullName = `${firstName || ''} ${lastName || ''}`.trim() || username || ''
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
      accessorFn: (user) => `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
      cell: ({ row }) => {
        const user = row.original
        const initials = getInitials(user.first_name, user.last_name, user.username)
        const color = getColorFromString(user.id)
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8" style={{ backgroundColor: color }}>
              <span className="text-xs font-medium text-white">{initials}</span>
            </Avatar>
            <div className="font-medium">{`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username}</div>
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
    }
  ]

  // Get status styles for the status badges
  const getStatusClass = (status: string) => {
    return getStatusStyles(status)
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Utilizatori</h1>
        <Button className="flex items-center gap-1">
          <PlusCircle className="h-4 w-4" />
          Adaugă utilizator
        </Button>
      </div>
      <div className="space-y-4">
        <DataTable
          columns={columns}
          useQueryHook={useUsers}
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
    default:
      return "bg-gray-50 text-gray-700 border border-gray-200"
  }
}
