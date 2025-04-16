"use client"

import type * as React from "react"
import { type Column, type ColumnDef, type Row, createColumnHelper } from "@tanstack/react-table"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"

// Create a column helper
export const columnHelper = createColumnHelper<any>()

// Selection column
export function createSelectionColumn<TData>(): ColumnDef<TData, any> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        onClick={(e) => e.stopPropagation()}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  }
}

// Expansion column
export function createExpansionColumn<TData>(): ColumnDef<TData, any> {
  return {
    id: "expand",
    header: () => null,
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          row.toggleExpanded()
        }}
        className="p-0 hover:bg-transparent"
      >
        {row.getIsExpanded() ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  }
}

// Actions column
export function createActionsColumn<TData>(actions: (row: Row<TData>) => React.ReactNode): ColumnDef<TData, any> {
  return {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => <div className="flex justify-end">{actions(row)}</div>,
    enableSorting: false,
    enableHiding: false,
  }
}

// Status column with badge
export interface StatusConfig {
  value: string
  label: string
  variant:
    | "default"
    | "conform"
    | "ciorna"
    | "neconform"
    | "evaluare"
    | "primary"
    | "secondary"
    | "destructive"
    | "outline"
}

export function createStatusColumn<TData>(
  accessorKey: keyof TData,
  header: string,
  statuses: StatusConfig[],
): ColumnDef<TData, any> {
  return {
    accessorKey: accessorKey as string,
    header,
    cell: ({ row }) => {
      const value = row.getValue(accessorKey as string) as string
      const status = statuses.find((s) => s.value === value)

      if (!status) return value

      return <Badge variant={status.variant}>{status.label}</Badge>
    },
    filterFn: (row, id, filterValue) => {
      return filterValue.includes(row.getValue(id))
    },
  }
}

// Date column
export function createDateColumn<TData>(
  accessorKey: keyof TData,
  header: string,
  options?: {
    format?: Intl.DateTimeFormatOptions
    locale?: string
  },
): ColumnDef<TData, any> {
  const defaultFormat: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  }

  const format = options?.format || defaultFormat
  const locale = options?.locale || undefined

  return {
    accessorKey: accessorKey as string,
    header,
    cell: ({ row }) => {
      const value = row.getValue(accessorKey as string)
      if (!value) return null

      const date = value instanceof Date ? value : new Date(value as string)
      return date.toLocaleDateString(locale, format)
    },
    sortingFn: "datetime",
  }
}

// Text filter component
export function TextFilter<TData>({ column }: { column: Column<TData, unknown> }) {
  const columnFilterValue = column.getFilterValue() as string

  return (
    <Input
      type="text"
      value={columnFilterValue ?? ""}
      onChange={(e) => column.setFilterValue(e.target.value)}
      placeholder={`Filter ${column.id}...`}
      className="h-8 w-full"
    />
  )
}

// Select filter component
export function SelectFilter<TData>({
  column,
  options,
}: {
  column: Column<TData, unknown>
  options: { value: string; label: string }[]
}) {
  const columnFilterValue = column.getFilterValue() as string[]

  return (
    <Select
      value={columnFilterValue || []}
      onChange={(value) => column.setFilterValue(value)}
      options={options}
      placeholder={`Filter ${column.id}...`}
      isMulti
      className="w-full"
    />
  )
}

// Boolean filter component
export function BooleanFilter<TData>({ column }: { column: Column<TData, unknown> }) {
  const columnFilterValue = column.getFilterValue() as boolean

  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        checked={columnFilterValue === true}
        onCheckedChange={(value) => column.setFilterValue(value ? true : undefined)}
      />
      <span className="text-sm">Yes</span>
      <Checkbox
        checked={columnFilterValue === false}
        onCheckedChange={(value) => column.setFilterValue(value ? false : undefined)}
      />
      <span className="text-sm">No</span>
    </div>
  )
}

// Date range filter component
export function DateRangeFilter<TData>({ column }: { column: Column<TData, unknown> }) {
  const columnFilterValue = column.getFilterValue() as [Date | undefined, Date | undefined]

  return (
    <div className="flex items-center space-x-2">
      <Input
        type="date"
        value={columnFilterValue?.[0]?.toISOString().slice(0, 10) || ""}
        onChange={(e) => {
          const value = e.target.value ? new Date(e.target.value) : undefined
          column.setFilterValue([value, columnFilterValue?.[1]])
        }}
        className="h-8"
      />
      <span className="text-sm">to</span>
      <Input
        type="date"
        value={columnFilterValue?.[1]?.toISOString().slice(0, 10) || ""}
        onChange={(e) => {
          const value = e.target.value ? new Date(e.target.value) : undefined
          column.setFilterValue([columnFilterValue?.[0], value])
        }}
        className="h-8"
      />
    </div>
  )
}
