import { cn } from "@/lib/utils"

type DayState =
  | "outside"
  | "default"
  | "current"
  | "selected"
  | "range-start"
  | "range-end"
  | "range-middle"
  | "disabled"

interface CalendarDayProps {
  day: number
  state: DayState
  className?: string
}

export function CalendarDay({ day, state, className }: CalendarDayProps) {
  const stateStyles: Record<DayState, string> = {
    outside: "text-text-lighter opacity-50",
    default: "hover:bg-bg-light",
    current: "bg-bg-focus-lightest text-text-accent",
    selected: "bg-bg-primary text-text-inverted",
    "range-start": "bg-bg-primary text-text-inverted rounded-l-radius-03",
    "range-end": "bg-bg-primary text-text-inverted rounded-r-radius-03",
    "range-middle": "bg-bg-focus-lightest text-text-accent",
    disabled: "text-text-lighter opacity-50",
  }

  return (
    <div
      className={cn(
        "h-9 w-9 flex items-center justify-center rounded-radius-03 text-sm font-medium",
        stateStyles[state],
        className,
      )}
    >
      {day}
    </div>
  )
}

interface CalendarDaysRowProps {
  days: Array<{ day: number; state: DayState }>
  className?: string
}

export function CalendarDaysRow({ days, className }: CalendarDaysRowProps) {
  return (
    <div className={cn("grid grid-cols-7 gap-1", className)}>
      {days.map((day, index) => (
        <CalendarDay key={index} day={day.day} state={day.state} />
      ))}
    </div>
  )
}
