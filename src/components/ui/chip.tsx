"use client"

import type * as React from "react"
import { X } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const chipVariants = cva(
  "inline-flex items-center justify-center rounded-radius-round text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-bg-light text-text-default hover:bg-bg-focus-lightest",
        active: "bg-bg-focus-lightest text-text-accent border-border-focus",
        primary: "bg-bg-primary text-text-inverted hover:bg-bg-primary-focus",
        secondary: "bg-bg-light text-text-default hover:bg-bg-focus-lightest",
        outline: "border border-border-default bg-transparent hover:bg-bg-light",
        tag: "bg-bg-light text-text-default hover:bg-bg-focus-lightest",
        filter: "bg-bg-light text-text-default hover:bg-bg-focus-lightest",
        cursant: "bg-[#F5F8FF] text-text-default hover:bg-[#EFF6FF]",
        mentor: "bg-[#F0FDF4] text-text-default hover:bg-[#DCFCE7]",
        evaluator: "bg-[#EFF6FF] text-text-default hover:bg-[#DBEAFE]",
        moderator: "bg-[#F5F3FF] text-text-default hover:bg-[#EDE9FE]",
        admin: "bg-[#FFFBEB] text-text-default hover:bg-[#FEF3C7]",
        primar: "bg-[#F0F9FF] text-text-default hover:bg-[#E0F2FE]",
        gimnaziu: "bg-[#F5F3FF] text-text-default hover:bg-[#EDE9FE]",
        liceu: "bg-[#ECFDF5] text-text-default hover:bg-[#D1FAE5]",
      },
      size: {
        sm: "h-7 px-2.5 text-xs",
        md: "h-8 px-3",
        lg: "h-9 px-4",
      },
      selected: {
        true: "",
        false: "",
      },
      dismissible: {
        true: "pr-2",
        false: "",
      },
    },
    compoundVariants: [
      {
        selected: true,
        variant: "default",
        className: "bg-bg-focus-lightest text-text-accent",
      },
      {
        selected: true,
        variant: "cursant",
        className: "bg-[#EFF6FF] text-text-accent",
      },
      {
        selected: true,
        variant: "mentor",
        className: "bg-[#DCFCE7] text-text-accent",
      },
      {
        selected: true,
        variant: "evaluator",
        className: "bg-[#DBEAFE] text-text-accent",
      },
      {
        selected: true,
        variant: "moderator",
        className: "bg-[#EDE9FE] text-text-accent",
      },
      {
        selected: true,
        variant: "admin",
        className: "bg-[#FEF3C7] text-text-accent",
      },
      {
        selected: true,
        variant: "primar",
        className: "bg-[#E0F2FE] text-text-accent",
      },
      {
        selected: true,
        variant: "gimnaziu",
        className: "bg-[#EDE9FE] text-text-accent",
      },
      {
        selected: true,
        variant: "liceu",
        className: "bg-[#D1FAE5] text-text-accent",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "md",
      selected: false,
      dismissible: false,
    },
  },
)

export interface ChipProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof chipVariants> {
  onDismiss?: () => void
  icon?: React.ReactNode
  count?: number
}

export function Chip({
  className,
  variant,
  size,
  selected,
  dismissible,
  onDismiss,
  icon,
  count,
  children,
  ...props
}: ChipProps) {
  return (
    <div className={cn(chipVariants({ variant, size, selected, dismissible }), className)} {...props}>
      {icon && <span className="mr-1.5">{icon}</span>}
      {children}
      {count !== undefined && <span className="ml-1.5 rounded-radius-round bg-bg-light px-1.5 text-xs">{count}</span>}
      {dismissible && (
        <button
          type="button"
          className="ml-1.5 rounded-radius-round p-0.5 hover:bg-bg-light focus:outline-none focus:ring-1 focus:ring-border-focus"
          onClick={(e) => {
            e.stopPropagation()
            onDismiss?.()
          }}
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
