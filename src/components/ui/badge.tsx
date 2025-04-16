import type * as React from "react"
import { cn } from "@/lib/utils"

export type BadgeVariant = "conform" | "ciorna" | "neconform" | "evaluare" | "default"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
  className?: string
  children: React.ReactNode
}

export function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
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
