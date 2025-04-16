import type * as React from "react"
import { Bell } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const notificationVariants = cva("relative inline-flex items-center justify-center", {
  variants: {
    size: {
      sm: "h-6 w-6",
      md: "h-7 w-7",
      lg: "h-8 w-8",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

const notificationCountVariants = cva("absolute flex items-center justify-center rounded-full font-medium text-white", {
  variants: {
    size: {
      sm: "-top-1 -right-1 min-w-[1.25rem] h-5 text-xs",
      md: "-top-2 -right-2 min-w-[1.5rem] h-6 text-xs",
      lg: "-top-2 -right-2 min-w-[1.75rem] h-7 text-sm",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

export interface NotificationProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof notificationVariants> {
  count?: number
  maxCount?: number
  iconColor?: string
  countBgColor?: string
}

export function Notification({
  className,
  size,
  count,
  maxCount = 99,
  iconColor = "#94A3B8", // Light gray color for the bell icon
  countBgColor = "#4F7FFF", // Blue color for the notification count
  ...props
}: NotificationProps) {
  const displayCount = count && count > maxCount ? `${maxCount}+` : count

  return (
    <div className={cn(notificationVariants({ size }), className)} {...props}>
      <Bell className={cn("h-full w-full", `text-[${iconColor}]`)} />

      {count && count > 0 && (
        <div
          className={cn(notificationCountVariants({ size }), "bg-[#4F7FFF]")}
          style={{ backgroundColor: countBgColor }}
          aria-label={`${count} notifications`}
        >
          {displayCount}
        </div>
      )}
    </div>
  )
}
