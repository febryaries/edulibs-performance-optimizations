import type * as React from "react"
import { cn } from "@/lib/utils"

export type BadgeVariant = "CONFORMABLE" | "UNCONFORMABLE" | "IN_REVIEW" | 'SUBMITTED' | 'DRAFT' | "conform" | "ciorna" | "neconform" | "evaluare" | "default"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
  className?: string
  children: React.ReactNode
}

export function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    DRAFT: "bg-bg-focus-lightest text-text-lighter",
    SUBMITTED: "bg-bg-success-light text-text-success-strong",
    CONFORMABLE: "bg-bg-success-light text-text-success-strong",
    UNCONFORMABLE: "bg-bg-destructive-light text-text-destructive-strong",
    IN_REVIEW: "bg-bg-warning-light text-text-warning-strong",
    conform: "bg-bg-success-light text-text-success-strong",
    ciorna: "bg-bg-focus-lightest text-text-lighter",
    neconform: "bg-bg-destructive-light text-text-destructive-strong",
    evaluare: "bg-bg-warning-light text-text-warning-strong",
    default: "bg-bg-light text-text-default",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-radius-03 px-spacing-03 py-spacing-01 text-sm font-medium",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
