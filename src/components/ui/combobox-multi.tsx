"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Option {
  id: string
  label: string
  color: string
}

export interface ComboboxMultiProps {
  options: Option[]
  value: Option[]
  onChange: (value: Option[]) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  className?: string
  showSearch?: boolean
}

export function ComboboxMulti({
  options,
  value,
  onChange,
  placeholder = "Select options",
  searchPlaceholder = "Search...",
  disabled = false,
  className,
  showSearch = true,
}: ComboboxMultiProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options
    return options.filter((option) => option.label.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [options, searchQuery])

  // Handle click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  // Focus input when dropdown opens
  React.useEffect(() => {
    if (open && inputRef.current && showSearch) {
      inputRef.current.focus()
    }
  }, [open, showSearch])

  // Toggle option selection
  const toggleOption = (option: Option) => {
    const isSelected = value.some((item) => item.id === option.id)

    if (isSelected) {
      onChange(value.filter((item) => item.id !== option.id))
    } else {
      onChange([...value, option])
    }
  }

  // Remove selected option
  const removeOption = (e: React.MouseEvent, optionId: string) => {
    e.stopPropagation()
    onChange(value.filter((item) => item.id !== optionId))
  }

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {/* Selected options display */}
      <div
        className={cn(
          "flex min-h-10 w-full flex-wrap items-center gap-2 rounded-t-radius-03 border border-border-default bg-bg-lightest px-3 py-2 text-sm",
          {
            "rounded-radius-03": !open,
            "border-b-0": open,
            "cursor-not-allowed opacity-50": disabled,
          },
        )}
        onClick={() => !disabled && setOpen(!open)}
      >
        {value.length > 0 ? (
          value.map((option) => (
            <div key={option.id} className={cn("flex items-center gap-1 rounded-radius-round px-2 py-1", option.color)}>
              <span className="text-sm font-medium">{option.label}</span>
              <button
                type="button"
                onClick={(e) => removeOption(e, option.id)}
                className="ml-1 rounded-full p-0.5 hover:bg-bg-light/20"
                aria-label={`Remove ${option.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))
        ) : (
          <span className="text-text-lighter">{placeholder}</span>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className={cn(
            "absolute z-10 w-full rounded-b-radius-03 border border-t-0 border-border-default bg-bg-lightest shadow-md",
          )}
        >
          {/* Search input */}
          {showSearch && (
            <div className="p-3 border-b border-border-light">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-lighter" />
                <input
                  ref={inputRef}
                  type="text"
                  className="w-full rounded-radius-03 border border-border-default bg-transparent py-2 pl-9 pr-3 text-sm outline-none focus:border-border-focus"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {/* Options list */}
          <div className="max-h-[240px] overflow-y-auto p-2">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-text-lighter">No options found</div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  className={cn(
                    "my-1 cursor-pointer rounded-radius-round px-3 py-2 text-sm font-medium hover:bg-bg-light",
                    option.color,
                  )}
                  onClick={() => toggleOption(option)}
                >
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
