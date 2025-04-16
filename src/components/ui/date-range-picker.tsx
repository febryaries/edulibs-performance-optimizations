"use client"

import * as React from "react"
import { format, isEqual, isToday, isWithinInterval } from "date-fns"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DateRangePickerProps {
  startDate: Date
  endDate: Date
  onRangeChange: (range: { from: Date; to: Date }) => void
  className?: string
}

export function DateRangePicker({ startDate, endDate, onRangeChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [currentMonths, setCurrentMonths] = React.useState<Date[]>([
    new Date(startDate.getFullYear(), startDate.getMonth(), 1),
    new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1),
  ])
  const [hoverDate, setHoverDate] = React.useState<Date | null>(null)
  const [rangeStart, setRangeStart] = React.useState<Date | null>(startDate)
  const [rangeEnd, setRangeEnd] = React.useState<Date | null>(endDate)

  // Reset internal state when props change
  React.useEffect(() => {
    setRangeStart(startDate)
    setRangeEnd(endDate)
  }, [startDate, endDate])

  const handleDateClick = (date: Date) => {
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(date)
      setRangeEnd(null)
    } else {
      // Ensure end date is after start date
      if (date < rangeStart) {
        setRangeEnd(rangeStart)
        setRangeStart(date)
      } else {
        setRangeEnd(date)
      }

      // If both dates are selected, update the parent component
      if (rangeStart) {
        const from = date < rangeStart ? date : rangeStart
        const to = date < rangeStart ? rangeStart : date
        onRangeChange({ from, to })

        // Close the popover after selection
        setTimeout(() => setIsOpen(false), 300)
      }
    }
  }

  const handleMouseEnter = (date: Date) => {
    setHoverDate(date)
  }

  const handleMouseLeave = () => {
    setHoverDate(null)
  }

  const isDateInRange = (date: Date) => {
    if (rangeStart && !rangeEnd && hoverDate) {
      return isWithinInterval(date, {
        start: rangeStart < hoverDate ? rangeStart : hoverDate,
        end: rangeStart < hoverDate ? hoverDate : rangeStart,
      })
    }

    if (rangeStart && rangeEnd) {
      return isWithinInterval(date, { start: rangeStart, end: rangeEnd })
    }

    return false
  }

  const isDateSelected = (date: Date) => {
    return (rangeStart && isEqual(date, rangeStart)) || (rangeEnd && isEqual(date, rangeEnd))
  }

  const isRangeStart = (date: Date) => {
    return rangeStart && isEqual(date, rangeStart)
  }

  const isRangeEnd = (date: Date) => {
    return rangeEnd && isEqual(date, rangeEnd)
  }

  const navigateToPreviousMonth = (index: number) => {
    setCurrentMonths((prev) => {
      const newMonths = [...prev]
      const currentMonth = prev[index]
      newMonths[index] = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
      return newMonths
    })
  }

  const navigateToNextMonth = (index: number) => {
    setCurrentMonths((prev) => {
      const newMonths = [...prev]
      const currentMonth = prev[index]
      newMonths[index] = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
      return newMonths
    })
  }

  const renderCalendarHeader = (month: Date, index: number) => {
    return (
      <div className="flex items-center justify-between px-2 py-2">
        <button
          onClick={() => navigateToPreviousMonth(index)}
          className="p-1 rounded-full hover:bg-gray-100"
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="font-medium text-sm">{format(month, "MMMM yyyy")}</div>
        <button onClick={() => navigateToNextMonth(index)} className="p-1 rounded-full hover:bg-gray-100" type="button">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    )
  }

  const renderCalendarDays = () => {
    const days = ["Su", "Mo", "Tu", "We", "Th", "Fi", "Sa"]
    return (
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
        {days.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>
    )
  }

  const renderCalendarDates = (month: Date) => {
    const year = month.getFullYear()
    const monthIndex = month.getMonth()
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
    const firstDayOfMonth = new Date(year, monthIndex, 1).getDay()

    // Get days from previous month to fill the first row
    const prevMonthDays = []
    const prevMonth = new Date(year, monthIndex, 0)
    const daysInPrevMonth = prevMonth.getDate()

    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      prevMonthDays.push(new Date(year, monthIndex - 1, daysInPrevMonth - i))
    }

    // Current month days
    const currentMonthDays = []
    for (let i = 1; i <= daysInMonth; i++) {
      currentMonthDays.push(new Date(year, monthIndex, i))
    }

    // Next month days to fill the last row
    const nextMonthDays = []
    const totalCells = 42 // 6 rows x 7 days
    const remainingCells = totalCells - (prevMonthDays.length + currentMonthDays.length)

    for (let i = 1; i <= remainingCells; i++) {
      nextMonthDays.push(new Date(year, monthIndex + 1, i))
    }

    const allDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays]

    return (
      <div className="grid grid-cols-7 gap-1">
        {allDays.map((date, i) => {
          const isCurrentMonth = date.getMonth() === monthIndex
          const isSelected = isDateSelected(date)
          const isInRange = isDateInRange(date)
          const isStart = isRangeStart(date)
          const isEnd = isRangeEnd(date)
          const isCurrentDate = isToday(date)

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleDateClick(date)}
              onMouseEnter={() => handleMouseEnter(date)}
              onMouseLeave={handleMouseLeave}
              className={cn(
                "h-8 w-8 rounded-full text-sm flex items-center justify-center",
                !isCurrentMonth && "text-gray-400",
                isCurrentDate && !isSelected && !isInRange && "bg-gray-100",
                isInRange && !isSelected && "bg-blue-100 text-blue-900",
                isSelected && "bg-blue-500 text-white",
                !isSelected && !isInRange && "hover:bg-gray-100",
              )}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="flex items-center rounded-md border border-gray-300 bg-white">
            <div className="px-3 py-2 text-sm text-gray-500">Data</div>
            <div className="flex items-center gap-1 border-l border-gray-300 px-3 py-2 text-sm font-medium">
              {format(startDate, "d MMM yyyy")} - {format(endDate, "d MMM yyyy")}
              <CalendarIcon className="h-4 w-4 ml-1" />
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex p-2 gap-2">
            <div className="space-y-2">
              {renderCalendarHeader(currentMonths[0], 0)}
              {renderCalendarDays()}
              {renderCalendarDates(currentMonths[0])}
            </div>
            <div className="space-y-2">
              {renderCalendarHeader(currentMonths[1], 1)}
              {renderCalendarDays()}
              {renderCalendarDates(currentMonths[1])}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
