"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ComboboxOption {
  value: string
  label: string
  disabled?: boolean
}

export interface ComboboxProps {
  options: ComboboxOption[]
  value?: string | string[]
  onChange?: (value: string | string[]) => void
  placeholder?: string
  label?: string
  description?: string
  disabled?: boolean
  error?: boolean
  errorMessage?: string
  searchable?: boolean
  searchPlaceholder?: string
  multiple?: boolean
  className?: string
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Dropdown",
  label,
  description,
  disabled = false,
  error = false,
  errorMessage,
  searchable = false,
  searchPlaceholder = "Căutare",
  multiple = false,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedValues, setSelectedValues] = React.useState<string[]>(
    multiple ? (Array.isArray(value) ? value : value ? [value] : []) : value ? [value] : [],
  )
  const [isFocused, setIsFocused] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (multiple) {
      setSelectedValues(Array.isArray(value) ? value : value ? [value] : [])
    } else {
      setSelectedValues(value ? [value] : [])
    }
  }, [value, multiple])

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

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options
    return options.filter((option) => option.label.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [options, searchQuery])

  const handleSelect = (optionValue: string) => {
    let newSelectedValues: string[]

    if (multiple) {
      if (selectedValues.includes(optionValue)) {
        newSelectedValues = selectedValues.filter((v) => v !== optionValue)
      } else {
        newSelectedValues = [...selectedValues, optionValue]
      }
    } else {
      newSelectedValues = [optionValue]
      setOpen(false)
    }

    setSelectedValues(newSelectedValues)

    if (onChange) {
      onChange(multiple ? newSelectedValues : newSelectedValues[0] || "")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      setOpen(!open)
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  const displayValue = React.useMemo(() => {
    if (selectedValues.length === 0) return ""

    if (multiple) {
      return selectedValues
        .map((val) => options.find((option) => option.value === val)?.label)
        .filter(Boolean)
        .join(", ")
    }

    return options.find((option) => option.value === selectedValues[0])?.label || ""
  }, [selectedValues, options, multiple])

  const inputClasses = cn(
    "flex h-10 w-full rounded-radius-03 border bg-bg-lightest px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-lighter focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
    {
      "border-border-default": !error && !disabled && !isFocused,
      "border-border-destructive text-text-destructive-light": error,
      "border-border-disabled bg-bg-disabled-light": disabled,
      "border-border-focus ring-2 ring-border-focus": isFocused && !error && !disabled,
      "rounded-b-none border-b-0": open,
    },
  )

  const dropdownClasses = cn("w-full border border-border-default bg-bg-lightest shadow-md overflow-hidden", {
    "rounded-t-none rounded-b-radius-03": open,
    "rounded-radius-03": !open,
  })

  const labelColor = error ? "text-text-destructive-light" : disabled ? "text-text-disabled" : "text-text-default"

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {label && <label className={cn("block text-sm font-medium mb-2", labelColor)}>{label}</label>}

      <div
        className={inputClasses}
        onClick={() => !disabled && setOpen(!open)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? "combobox-options" : undefined}
        aria-disabled={disabled}
      >
        <div className="flex items-center gap-2 w-full">
          <Clock className="h-5 w-5 shrink-0 text-text-lighter" />
          <span
            className={cn("flex-grow truncate", {
              "text-text-lighter": !displayValue,
            })}
          >
            {displayValue || placeholder}
          </span>
          <ChevronsUpDown className="h-5 w-5 shrink-0 text-text-lighter" />
        </div>
      </div>

      {open && !disabled && (
        <div className={dropdownClasses}>
          {searchable && (
            <div className="p-3 border-b border-border-light">
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border-none outline-none bg-transparent"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          )}

          <ul
            className="max-h-60 overflow-auto p-2"
            role="listbox"
            id="combobox-options"
            aria-multiselectable={multiple}
          >
            {filteredOptions.length === 0 ? (
              <li className="py-2 px-2 text-sm text-text-lighter text-center">No results found</li>
            ) : (
              filteredOptions.map((option) => (
                <li
                  key={option.value}
                  className={cn("flex items-center py-2 px-2 text-sm rounded-radius-03 cursor-pointer", {
                    "opacity-50 cursor-not-allowed": option.disabled,
                    "hover:bg-bg-light": !option.disabled && !selectedValues.includes(option.value),
                  })}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  role="option"
                  aria-selected={selectedValues.includes(option.value)}
                  aria-disabled={option.disabled}
                >
                  <div
                    className={cn(
                      "h-5 w-5 mr-2 flex items-center justify-center rounded-sm",
                      selectedValues.includes(option.value) ? "bg-bg-primary" : "border border-border-default",
                    )}
                  >
                    {selectedValues.includes(option.value) && <Check className="h-4 w-4 text-text-inverted" />}
                  </div>
                  <span>{option.label}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {description && (
        <p
          className={cn("text-sm mt-1", {
            "text-text-lighter": !error && !disabled,
            "text-text-destructive-light": error,
            "text-text-disabled": disabled,
          })}
        >
          {error && errorMessage ? errorMessage : description}
        </p>
      )}
    </div>
  )
}
