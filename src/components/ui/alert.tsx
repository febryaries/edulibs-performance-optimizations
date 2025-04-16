"use client"

import type * as React from "react"
import { AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive"
  title?: string
  description?: string
  action?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export function Alert({ variant = "default", title, description, action, icon, className, ...props }: AlertProps) {
  const variantStyles = {
    default: "bg-bg-focus-lightest border-border-default-border",
    destructive: "bg-bg-destructive-light border-border-destructive-border",
  }

  const variantIcons = {
    default: <Info className="h-5 w-5 text-text-accent" />,
    destructive: <AlertCircle className="h-5 w-5 text-text-destructive-light" />,
  }

  const titleStyles = {
    default: "text-text-default",
    destructive: "text-text-destructive-light",
  }

  const descriptionStyles = {
    default: "text-text-light",
    destructive: "text-text-destructive-light",
  }

  return (
    <div
      className={cn(
        "flex items-center gap-spacing-04 rounded-radius-04 border p-spacing-04",
        variantStyles[variant],
        className,
      )}
      role="alert"
      {...props}
    >
      <div className="flex-shrink-0">{icon || variantIcons[variant]}</div>
      <div className="flex-grow">
        {title && <div className={cn("font-medium", titleStyles[variant])}>{title}</div>}
        {description && <div className={cn("text-sm", descriptionStyles[variant])}>{description}</div>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

interface AlertButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive"
  children: React.ReactNode
}

export function AlertButton({ variant = "default", children, className, ...props }: AlertButtonProps) {
  const variantStyles = {
    default: "bg-bg-primary text-text-inverted hover:bg-bg-primary-focus",
    destructive: "bg-bg-destructive-strong text-text-inverted hover:bg-bg-destructive-focus",
  }

  return (
    <button
      className={cn(
        "rounded-radius-03 px-spacing-04 py-spacing-02 font-medium transition-colors",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
