"use client"

import * as React from "react"
import { Plus, Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "./input"

interface FilterDropdownProps {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (selectedOptions: string[]) => void
  selectedOptions: string[]
  className?: string
}

export function FilterDropdown({ label, value, options, onChange, selectedOptions, className }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const filteredOptions = options.filter((option) => option.label.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleToggleOption = (optionValue: string) => {
    if (selectedOptions.includes(optionValue)) {
      onChange(selectedOptions.filter((value) => value !== optionValue))
    } else {
      onChange([...selectedOptions, optionValue])
    }
  }

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div
        className="flex items-center rounded-md border border-gray-300 bg-white cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="px-3 py-2 text-sm text-gray-500">{label}</div>
        <div className="flex items-center gap-1 border-l border-gray-300 px-3 py-2 text-sm font-medium">
          {value}
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full z-10 mt-1 w-64 rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="p-2">
            <Input
              type="text"
              placeholder="Căutare"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-2">
            {filteredOptions.map((option) => (
              <div
                key={option.value}
                className="flex items-center space-x-2 rounded px-2 py-1.5 hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleOption(option.value)
                }}
              >
                <div className="flex h-4 w-4 items-center justify-center rounded border border-gray-300 bg-white">
                  {selectedOptions.includes(option.value) && <Check className="h-3 w-3 text-blue-600" />}
                </div>
                <div className="flex items-center text-sm">
                  <Plus className="mr-1.5 h-3.5 w-3.5 text-gray-500" />
                  {option.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
