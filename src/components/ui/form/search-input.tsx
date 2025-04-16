"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { useField } from "@tanstack/react-form"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  name: string
  label?: string
  description?: string
  error?: string
  placeholder?: string
  onChange?: (value: string) => void
  value?: string
  onSearch?: (value: string) => void
  showButton?: boolean
  buttonText?: string
  clearable?: boolean
  className?: string
  inputClassName?: string
  buttonClassName?: string
}

export function SearchInput({
  name,
  label,
  description,
  error,
  placeholder = "Search...",
  onChange,
  value = "",
  onSearch,
  showButton = false,
  buttonText = "Search",
  clearable = true,
  className,
  inputClassName,
  buttonClassName,
  ...props
}: SearchInputProps) {
  const [searchValue, setSearchValue] = React.useState(value)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setSearchValue(value)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchValue(newValue)
    onChange?.(newValue)
  }

  const handleClear = () => {
    setSearchValue("")
    onChange?.("")
    inputRef.current?.focus()
  }

  const handleSearch = () => {
    onSearch?.(searchValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSearch) {
      e.preventDefault()
      onSearch(searchValue)
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label htmlFor={name} className="text-sm font-medium leading-none">
          {label}
        </label>
      )}

      <div className="relative flex">
        <div className={cn("relative flex-grow", showButton ? "flex" : "inline-flex w-full")}>
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-lighter">
            <Search className="h-4 w-4" />
          </div>

          <input
            ref={inputRef}
            id={name}
            name={name}
            type="search"
            value={searchValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className={cn(
              "flex h-10 w-full rounded-radius-03 border border-border-default bg-bg-lightest pl-9 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-lighter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              {
                "border-border-destructive focus-visible:ring-border-destructive": error,
                "rounded-r-none border-r-0": showButton,
                "pr-9": clearable && searchValue,
              },
              inputClassName,
            )}
            placeholder={placeholder}
            {...props}
          />

          {clearable && searchValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-lighter hover:text-text-default"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {showButton && (
          <Button type="button" onClick={handleSearch} className={cn("rounded-l-none", buttonClassName)}>
            {buttonText}
          </Button>
        )}
      </div>

      {description && !error && <p className="text-sm text-text-lighter">{description}</p>}

      {error && <p className="text-sm text-text-destructive-light">{error}</p>}
    </div>
  )
}

// Form field component that integrates with TanStack Form
export function FormSearchField({
  name,
  label,
  description,
  placeholder,
  showButton,
  buttonText,
  clearable,
  onSearch,
  ...props
}: Omit<SearchInputProps, "error" | "onChange" | "value">) {
  const { field, state } = useField({
    name,
    validators: {
      onChange: z
        .string()
        // Add any validation rules you need
        .refine((val) => val.length <= 100, { message: "Search query too long" }),
    },
  })

  return (
    <SearchInput
      name={name}
      label={label}
      description={description}
      placeholder={placeholder}
      showButton={showButton}
      buttonText={buttonText}
      clearable={clearable}
      error={state.meta.touchedErrors?.[0]}
      onChange={field.handleChange}
      value={field.state.value}
      onBlur={field.handleBlur}
      onSearch={onSearch}
      {...props}
    />
  )
}
