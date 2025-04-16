"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface DatePickerProps {
  date?: Date
  setDate?: (date: Date | undefined) => void
  disabled?: boolean
  error?: boolean
  label?: string
  placeholder?: string
  className?: string
  inputClassName?: string
}

export function DatePicker({
  date,
  setDate,
  disabled = false,
  error = false,
  label = "Select date",
  placeholder = "Select date",
  className,
  inputClassName,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const inputClasses = cn(
    "flex h-10 w-full rounded-radius-03 border bg-bg-lightest px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-lighter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    {
      "border-border-default": !error && !disabled && !isOpen,
      "border-border-destructive": error,
      "border-border-disabled bg-bg-disabled-light": disabled,
      "border-border-focus": isOpen && !error && !disabled,
    },
    inputClassName,
  )

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(inputClasses, "text-left flex items-center justify-between", !date && "text-text-lighter")}
            disabled={disabled}
          >
            {date ? format(date, "MMMM yyyy") : placeholder}
            <CalendarIcon className="h-4 w-4 text-text-lighter" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 shadow-md" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => {
              setDate?.(newDate)
              setIsOpen(false)
            }}
            initialFocus
            defaultMonth={date}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
