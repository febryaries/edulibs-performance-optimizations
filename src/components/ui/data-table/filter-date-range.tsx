'use client'

import { useState, useRef, useEffect } from "react"
import { format, addMonths } from "date-fns"
import { ro } from "date-fns/locale"
import { ChevronDown, Plus, Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"

interface DateRangeFilterProps {
  label?: string
  icon?: React.ReactNode
  value?: string
  onChange?: (dateRange: DateRange | undefined) => void
  className?: string
  defaultValue?: DateRange
}

export function DateRangeFilter({
  label = "Data",
  icon = <CalendarIcon className="h-4 w-4 text-gray-400" />,
  value,
  onChange,
  className,
  defaultValue,
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [date, setDate] = useState<DateRange | undefined>(defaultValue)
  const filterRef = useRef<HTMLDivElement>(null)

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Format the date range as a string
  const formatDateRange = (range: DateRange | undefined) => {
    if (!range || !range.from) {
      return "Selectează interval"
    }

    if (range.from && !range.to) {
      return format(range.from, "d MMM yyyy", { locale: ro })
    }

    return `${format(range.from, "d MMM yyyy", { locale: ro })} - ${format(range.to || range.from, "d MMM yyyy", { locale: ro })}`
  }

  // Handle date selection
  const handleSelect = (range: DateRange | undefined) => {
    setDate(range)
    
    if (onChange) {
      onChange(range)
    }
  }

  // Handle apply button click
  const handleApply = () => {
    setIsOpen(false)
  }

  // Handle cancel button click
  const handleCancel = () => {
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={filterRef}>
      <div
        className={cn(
          "flex h-9 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50 rounded-radius-04",
          isOpen ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-300",
          className
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {icon}
        <span>{label}</span>
        <span className="text-blue-600">
          {value || (date ? formatDateRange(date) : "")}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full z-10 mt-1 w-auto bg-white rounded-md border border-gray-200 shadow-lg">
          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Calendar
                mode="range"
                defaultMonth={date?.from || new Date()}
                selected={date}
                onSelect={handleSelect}
                numberOfMonths={2}
                showOutsideDays
                fixedWeeks
                className="!bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}