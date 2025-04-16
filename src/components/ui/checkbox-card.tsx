"use client"

import type * as React from "react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

interface CheckboxCardProps extends React.HTMLAttributes<HTMLDivElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  title?: string
  description?: string
  className?: string
}

export function CheckboxCard({
  checked = false,
  onCheckedChange,
  disabled = false,
  title,
  description,
  className,
  children,
  ...props
}: CheckboxCardProps) {
  return (
    <div
      className={cn(
        "flex items-start space-x-3 rounded-radius-03 border p-4 transition-colors",
        checked ? "border-border-focus bg-bg-focus-lightest" : "border-border-default bg-bg-lightest",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      {...props}
    >
      <Checkbox checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} className="mt-0.5" />
      <div className="space-y-1">
        {title && <div className="font-medium">{title}</div>}
        {description && <div className="text-sm text-text-lighter">{description}</div>}
        {children}
      </div>
    </div>
  )
}
