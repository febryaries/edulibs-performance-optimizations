"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, Plus, X, Check, ChevronDown, Loader2 } from "lucide-react"
import { z } from "zod"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SearchableDropdown } from "@/components/ui/searchable-dropdown"
import { ForeignKeyRelationMap, PaginatedResult, PaginationParams, QueryFilter, TableNames, UsePaginatedHook, WithRelations } from "@/lib/query-controller"

// Types
export type ColumnType = "string" | "number" | "date" | "email" | "boolean" | "select" | "searchable-select"

export interface SelectOption {
  value: string
  label: string
}

export interface ColumnConfig {
  id: string
  name: string
  type: ColumnType
  required?: boolean
  validation?: z.ZodType<any>
  options?: SelectOption[] // For select type columns
  searchable?: boolean // For searchable select columns
  // New properties for SearchableDropdown integration
  key: string;
  fetchHook: (params: PaginationParams)=> Promise<PaginatedResult<WithRelations<any, ForeignKeyRelationMap<any>>>>
  valueField?: string
  labelField?: string
  searchColumns?: string[]
  filters?: QueryFilter[]
}

export interface RowData {
  [key: string]: any
  _id: string
  _valid: boolean
  _errors: { [key: string]: string }
}

export interface BulkUploadProps {
  columns: ColumnConfig[]
  onSubmit: (data: any[]) => void
  onCancel?: () => void
  isLoading?: boolean
}

// Validation functions
const getDefaultValidation = (column: ColumnConfig): z.ZodType<any> => {
  let schema: z.ZodType<any>

  switch (column.type) {
    case "string":
      schema = z.string()
      break
    case "number":
      schema = z.coerce.number()
      break
    case "date":
      schema = z.coerce.date()
      break
    case "email":
      schema = z.string().email()
      break
    case "boolean":
      schema = z.boolean().or(
        z.string().transform((val) => {
          const lowered = val.toLowerCase()
          if (lowered === "true" || lowered === "yes" || lowered === "1") return true
          if (lowered === "false" || lowered === "no" || lowered === "0") return false
          throw new Error("Invalid boolean value")
        }),
      )
      break
    case "select":
      if (column.options && column.options.length > 0) {
        // Create a schema that validates against the available options
        const validValues = column.options.map((opt) => opt.value)
        schema = z
          .string()
          .refine((val) => validValues.includes(val), { message: `Must be one of: ${validValues.join(", ")}` })
      } else {
        schema = z.string()
      }
      break
    case "searchable-select":
      if (column.options && column.options.length > 0) {
        // Create a schema that validates against the available options
        const validValues = column.options.map((opt) => opt.value)
        schema = z
          .string()
          .refine((val) => validValues.includes(val), { message: `Must be one of: ${validValues.join(", ")}` })
      } else {
        schema = z.string()
      }
      break
    default:
      schema = z.any()
  }

  if (column.required) {
    schema = schema.refine((val) => val !== undefined && val !== null && val !== "", {
      message: "This field is required",
    })
  } else {
    schema = schema.optional()
  }

  return column.validation || schema
}

const validateRow = (row: Record<string, any>, columns: ColumnConfig[]): RowData => {
  const errors: { [key: string]: string } = {}
  const validatedRow: Record<string, any> = { ...row }

  columns.forEach((column) => {
    const value = row[column.id]
    const schema = getDefaultValidation(column)

    try {
      validatedRow[column.id] = schema.parse(value)
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors[column.id] = error.errors[0]?.message || "Invalid value"
      } else {
        errors[column.id] = "Invalid value"
      }
    }
  })

  return {
    ...validatedRow,
    _id: row._id,
    _valid: Object.keys(errors).length === 0,
    _errors: errors,
  }
}

// Utility functions
const generateEmptyRow = (columns: ColumnConfig[]): RowData => {
  const row: Record<string, any> = {
    _id: crypto.randomUUID(),
    _valid: false,
    _errors: {},
  }

  columns.forEach((column) => {
    row[column.id] = ""
  })

  return row as RowData
}

const parseClipboardData = (text: string, columns: ColumnConfig[]): RowData[] => {
  const rows = text
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(/\t|,/))

  return rows.map((rowData) => {
    const row: Record<string, any> = {
      _id: crypto.randomUUID(),
      _valid: false,
      _errors: {},
    }

    columns.forEach((column, index) => {
      if (index < rowData.length) {
        row[column.id] = rowData[index]?.trim() || ""
      } else {
        row[column.id] = ""
      }
    })

    return row as RowData
  })
}

const isAllValid = (rows: RowData[]): boolean => {
  return rows.every((row) => row._valid)
}

const prepareDataForSubmission = (rows: RowData[]): any[] => {
  return rows.map((row) => {
    // Use object destructuring with rest operator to exclude the properties
    const { _id, _valid, _errors, ...cleanRow } = row
    return cleanRow
  })
}

// Media query hook
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }

    const listener = () => setMatches(media.matches)
    media.addEventListener("change", listener)

    return () => media.removeEventListener("change", listener)
  }, [matches, query])

  return matches
}

// Helper function to determine cell validation status
const getCellValidationStatus = (row: RowData, columnId: string, hasValue: boolean) => {
  // If there's an error, it's invalid
  if (row._errors[columnId]) {
    return "invalid"
  }
  // If it has a value and no error, it's valid
  if (hasValue) {
    return "valid"
  }
  // Otherwise it's neutral (empty)
  return "neutral"
}

// SelectableCell component for select type columns
const SelectableCell = ({
  value,
  onChange,
  options,
  validationStatus,
  searchable = false,
}: {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  validationStatus: "valid" | "invalid" | "neutral"
  searchable?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredOptions, setFilteredOptions] = useState(options)

  // Find the label for the current value
  const currentLabel = options.find((opt) => opt.value === value)?.label || value

  // Update local state when parent value changes, but only if different
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value)
    }
  }, [value])

  // Filter options based on search query
  useEffect(() => {
    if (searchable && searchQuery) {
      const filtered = options.filter(option => 
        option.label.toLowerCase().includes(searchQuery.toLowerCase()))
      setFilteredOptions(filtered)
    } else {
      setFilteredOptions(options)
    }
  }, [searchQuery, options, searchable])

  // Handle input change without immediately propagating to parent
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    if (searchable) {
      setSearchQuery(newValue)
    } else {
      setInputValue(newValue)
    }
    // Don't call onChange here to avoid the loop
  }

  // Handle selection from dropdown
  const handleSelect = (selectedValue: string) => {
    setInputValue(selectedValue)
    onChange(selectedValue) // Safe to call onChange here as it's a user action
    setIsOpen(false)
    setSearchQuery("") // Clear search query when selection is made
  }

  // Handle blur to update parent when user finishes typing
  const handleBlur = () => {
    if (!searchable) {
      onChange(inputValue)
    }
  }

  // Determine background color based on validation status
  const getBgColorClass = () => {
    switch (validationStatus) {
      case "valid":
        return "bg-green-50"
      case "invalid":
        return "bg-red-50"
      default:
        return "bg-transparent"
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <Input
            value={searchable ? searchQuery : inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className={`border-0 rounded-none focus:ring-0 h-10 px-4 ${getBgColorClass()}`}
            onClick={() => setIsOpen(true)}
            placeholder={searchable ? "Caută..." : undefined}
          />
          <ChevronDown className="absolute right-3 top-3 h-4 w-4 opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <div className="max-h-[300px] overflow-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
                onClick={() => handleSelect(option.value)}
              >
                <div className="flex-1">{option.label}</div>
                {option.value === inputValue && <Check className="h-4 w-4 ml-2" />}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">Nu s-au găsit rezultate</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// SearchableSelectCell component for searchable-select type columns
const SearchableSelectCell = ({
  value,
  onChange,
  column,
  validationStatus,
}: {
  value: string
  onChange: (value: string) => void
  column: ColumnConfig
  validationStatus: "valid" | "invalid" | "neutral"
}) => {
  // Ensure we have the required props for SearchableDropdown
  if (!column.fetchHook) {
    return (
      <div className="text-red-500 text-xs p-2">
        fetchHook is required for searchable-select
      </div>
    )
  }

  // Get background color based on validation status
  const getBgColorClass = () => {
    switch (validationStatus) {
      case "valid":
        return "bg-green-50"
      case "invalid":
        return "bg-red-50"
      default:
        return "bg-transparent"
    }
  }

  return (
    <div className={`${getBgColorClass()} h-10`}>
      <SearchableDropdown
        filterKey={column.key}
        fetchHook={column.fetchHook}
        valueField={column.valueField || "id"}
        labelField={column.labelField || "name"}
        mode="single"
        onChange={(newValue) => {
          // Handle the selected value
          if (newValue) {
            onChange(newValue)
          }
        }}
        value={value}
        searchColumns={column.searchColumns || []}
        filters={column.filters}
        className="border-0"
        triggerClassName="border-0 h-10 py-0"
        contentClassName="w-[300px]"
      />
    </div>
  )
}

// Main component
export default function BulkUpload({ columns, onSubmit, onCancel, isLoading }: BulkUploadProps) {
  const [rows, setRows] = useState<RowData[]>([
    generateEmptyRow(columns),
    generateEmptyRow(columns),
    generateEmptyRow(columns),
  ])
  const [isValid, setIsValid] = useState(false)
  const tableRef = useRef<HTMLTableElement>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")

  useEffect(() => {
    setIsValid(isAllValid(rows))
  }, [rows])

  const handlePaste = (e: React.ClipboardEvent<HTMLTableElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData("text/plain")
    if (!text) return

    // Get the target cell information
    const target = e.target as HTMLElement
    const cell = target.closest("td")
    if (!cell) return

    const row = cell.closest("tr")
    if (!row) return

    // Find the row and column indices
    const rowIndex = Array.from(row.parentElement?.children || []).indexOf(row)
    const columnIndex = Array.from(row.children).indexOf(cell)

    // Parse the clipboard data
    const pastedRows = text
      .trim()
      .split(/\r?\n/)
      .map((line) => line.split(/\t|,/))

    // Create a copy of the current rows
    setRows((prevRows) => {
      const newRows = [...prevRows]

      // Fill in data starting from the selected cell
      pastedRows.forEach((pastedRow, pastedRowIndex) => {
        const targetRowIndex = rowIndex + pastedRowIndex

        // If we need more rows, add them
        if (targetRowIndex >= newRows.length) {
          newRows.push(generateEmptyRow(columns))
        }

        // Update cells in the row
        pastedRow.forEach((cellValue, pastedColumnIndex) => {
          const targetColumnIndex = columnIndex + pastedColumnIndex

          // Make sure we don't go beyond available columns
          if (targetColumnIndex < columns.length) {
            const columnId = columns[targetColumnIndex].id
            const columnType = columns[targetColumnIndex].type
            const trimmedValue = cellValue.trim()
            
            // For searchable-select columns, we want to set the value directly
            // This allows pasting email addresses directly into searchable dropdowns
            newRows[targetRowIndex] = {
              ...newRows[targetRowIndex],
              [columnId]: trimmedValue,
            }
          }
        })

        // Validate the updated row
        newRows[targetRowIndex] = validateRow(newRows[targetRowIndex], columns)
      })

      return newRows
    })
  }

  const handleCellChange = (rowId: string, columnId: string, value: string) => {
    setRows((prevRows) => {
      const newRows = prevRows.map((row) => {
        if (row._id === rowId) {
          const updatedRow = { ...row, [columnId]: value }
          return validateRow(updatedRow, columns)
        }
        return row
      })
      return newRows
    })
  }

  const handleAddRow = () => {
    setRows((prevRows) => [...prevRows, generateEmptyRow(columns)])
  }

  const handleRemoveRow = (rowId: string) => {
    setRows((prevRows) => prevRows.filter((row) => row._id !== rowId))
  }

  const handleSubmit = () => {
    if (!isValid) return
    const data = prepareDataForSubmission(rows)
    onSubmit(data)
  }

  const handleReset = () => {
    setRows([generateEmptyRow(columns), generateEmptyRow(columns), generateEmptyRow(columns)])
  }

  // Render cell based on column type
  const renderCell = (row: RowData, column: ColumnConfig) => {
    const value = row[column.id] || ""
    const hasValue = value !== ""
    const validationStatus = getCellValidationStatus(row, column.id, hasValue)

    if (column.type === "searchable-select") {
      return (
        <SearchableSelectCell
          value={value}
          onChange={(value) => handleCellChange(row._id, column.id, value)}
          column={column}
          validationStatus={validationStatus}
        />
      )
    }
    
    if (column.type === "select" && column.options) {
      return (
        <SelectableCell
          value={value}
          onChange={(value) => handleCellChange(row._id, column.id, value)}
          options={column.options}
          validationStatus={validationStatus}
          searchable={column.searchable}
        />
      )
    }

    // Determine background color based on validation status
    const getBgColorClass = () => {
      switch (validationStatus) {
        case "valid":
          return "bg-green-50"
        case "invalid":
          return "bg-red-50"
        default:
          return "bg-transparent"
      }
    }

    return (
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => handleCellChange(row._id, column.id, e.target.value)}
          className={`border-0 rounded-none focus:ring-0 h-10 px-4 ${getBgColorClass()}`}
        />
      </div>
    )
  }

  // Render mobile card view
  const renderMobileCards = () => {
    return rows.map((row) => (
      <Card key={row._id} className="mb-4 overflow-hidden">
        <CardContent className="p-4">
          {columns.map((column) => {
            const value = row[column.id] || ""
            const hasValue = value !== ""
            const validationStatus = getCellValidationStatus(row, column.id, hasValue)

            return (
              <div key={`${row._id}-${column.id}`} className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">{column.name}</span>
                </div>
                <div className="relative">
                  {column.type === "searchable-select" ? (
                    <SearchableSelectCell
                      value={value}
                      onChange={(value) => handleCellChange(row._id, column.id, value)}
                      column={column}
                      validationStatus={validationStatus}
                    />
                  ) : column.type === "select" && column.options ? (
                    <SelectableCell
                      value={value}
                      onChange={(value) => handleCellChange(row._id, column.id, value)}
                      options={column.options}
                      validationStatus={validationStatus}
                      searchable={column.searchable}
                    />
                  ) : (
                    <div className="relative">
                      <Input
                        value={value}
                        onChange={(e) => handleCellChange(row._id, column.id, e.target.value)}
                        className={`focus:ring-0 ${
                          validationStatus === "valid"
                            ? "bg-green-50"
                            : validationStatus === "invalid"
                              ? "bg-red-50"
                              : "bg-transparent"
                        }`}
                      />
                    </div>
                  )}
                  {row._errors[column.id] && <p className="text-xs text-red-500 mt-1">{row._errors[column.id]}</p>}
                </div>
              </div>
            )
          })}
          <div className="flex justify-end mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveRow(row._id)}
              className="h-8 w-8 p-0"
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 text-gray-300 hover:text-gray-500" />
            </Button>
          </div>
        </CardContent>
      </Card>
    ))
  }

  return (
    <div className="space-y-4">
      {/* Header Section - Simplified */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 h-9"
            onClick={handleReset}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      {/* Mobile Card View or Desktop Table View */}
      {isMobile ? (
        <div className="space-y-4">
          {renderMobileCards()}
          <Button
            variant="outline"
            size="sm"
            className="w-full flex items-center justify-center gap-1 h-9"
            onClick={handleAddRow}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4" />
            Add Row
          </Button>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden flex flex-col" style={{ height: "70vh" }}>
          <div className="relative overflow-auto flex-1">
            <table ref={tableRef} className="w-full text-sm text-left" onPaste={handlePaste}>
              <thead className="text-xs text-gray-700 bg-gray-50 sticky top-0 z-10">
                <tr>
                  {columns.map((column) => (
                    <th key={column.id} className="px-4 py-3 font-medium">
                      <div className="flex items-center">
                        {column.name}
                        {column.required && <span className="text-red-500 ml-1">*</span>}
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row._id} className="border-b transition-colors">
                    {columns.map((column) => (
                      <td key={`${row._id}-${column.id}`} className="p-0">
                        {renderCell(row, column)}
                      </td>
                    ))}
                    <td className="p-0 w-10">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveRow(row._id)}
                        className="h-10 w-10 hover:bg-transparent"
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4 text-gray-300 hover:text-gray-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 h-9"
              onClick={handleAddRow}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4" />
              Add Row
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{rows.length} rows</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 mt-6">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            {isLoading ? "Procesare..." : "Renunță"}
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={!isValid || isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adăugare în curs...
            </>
          ) : (
            "Adaugă"
          )}
        </Button>
      </div>
    </div>
  )
}
