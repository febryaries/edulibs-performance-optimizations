"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const progressVariants = cva("relative w-full overflow-hidden bg-bg-disabled-light rounded-full", {
  variants: {
    size: {
      sm: "h-1",
      md: "h-2",
      lg: "h-4",
    },
    variant: {
      default: "bg-bg-disabled-light",
      accent: "bg-bg-primary-light",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
  },
})

const progressIndicatorVariants = cva("h-full w-full flex-1 transition-all", {
  variants: {
    variant: {
      default: "bg-bg-primary",
      accent: "bg-bg-accent",
      destructive: "bg-bg-destructive-strong",
      success: "bg-bg-success-strong",
      warning: "bg-bg-warning-strong",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  value?: number
  max?: number
  indicatorVariant?: VariantProps<typeof progressIndicatorVariants>["variant"]
  showPercentage?: boolean
  label?: string
}

const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      size,
      variant,
      indicatorVariant = "default",
      showPercentage = false,
      label,
      ...props
    },
    ref,
  ) => {
    const percentage = Math.min(Math.max(0, (value / max) * 100), 100)

    return (
      <div className="space-y-2">
        {label && (
          <div className="flex justify-between">
            <span className="text-sm font-medium">{label}</span>
            {showPercentage && <span className="text-sm font-medium">{Math.round(percentage)}%</span>}
          </div>
        )}
        <ProgressPrimitive.Root
          ref={ref}
          className={cn(progressVariants({ size, variant }), className)}
          style={{
            // Fix the height to ensure consistent sizing
            // when using custom heights
            height: size === "sm" ? "0.25rem" : size === "md" ? "0.5rem" : "1rem",
          }}
          {...props}
        >
          <ProgressPrimitive.Indicator
            className={cn(progressIndicatorVariants({ variant: indicatorVariant }))}
            style={{ transform: `translateX(-${100 - percentage}%)` }}
          />
        </ProgressPrimitive.Root>
      </div>
    )
  },
)
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
