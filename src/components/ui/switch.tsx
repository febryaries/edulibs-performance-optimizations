"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const switchVariants = cva(
  "peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-bg-primary data-[state=unchecked]:bg-bg-disabled-light",
  {
    variants: {
      size: {
        sm: "h-[20px] w-[36px]",
        md: "h-[24px] w-[44px]",
        lg: "h-[28px] w-[52px]",
      },
      color: {
        default: "data-[state=checked]:bg-bg-primary",
        success: "data-[state=checked]:bg-bg-success-strong",
        destructive: "data-[state=checked]:bg-bg-destructive-strong",
        warning: "data-[state=checked]:bg-bg-warning-strong",
      },
    },
    defaultVariants: {
      size: "md",
      color: "default",
    },
  },
)

const switchThumbVariants = cva(
  "pointer-events-none block rounded-full bg-bg-lightest shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
  {
    variants: {
      size: {
        sm: "h-[16px] w-[16px]",
        md: "h-[20px] w-[20px]",
        lg: "h-[24px] w-[24px]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
)

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
    VariantProps<typeof switchVariants> {
  label?: string
  description?: string
  thumbClassName?: string
  labelPosition?: "left" | "right"
  labelClassName?: string
  descriptionClassName?: string
}

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, SwitchProps>(
  (
    {
      className,
      thumbClassName,
      size,
      color,
      label,
      description,
      labelPosition = "right",
      labelClassName,
      descriptionClassName,
      ...props
    },
    ref,
  ) => {
    const id = React.useId()
    const switchElement = (
      <SwitchPrimitives.Root
        className={cn(switchVariants({ size, color, className }))}
        {...props}
        ref={ref}
        id={props.id || id}
      >
        <SwitchPrimitives.Thumb className={cn(switchThumbVariants({ size }), thumbClassName)} />
      </SwitchPrimitives.Root>
    )

    // If no label or description, just return the switch
    if (!label && !description) {
      return switchElement
    }

    return (
      <div className="flex items-center gap-2">
        {labelPosition === "left" && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={props.id || id}
                className={cn(
                  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                  labelClassName,
                )}
              >
                {label}
              </label>
            )}
            {description && <p className={cn("text-sm text-text-lighter mt-1", descriptionClassName)}>{description}</p>}
          </div>
        )}

        {switchElement}

        {labelPosition === "right" && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={props.id || id}
                className={cn(
                  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                  labelClassName,
                )}
              >
                {label}
              </label>
            )}
            {description && <p className={cn("text-sm text-text-lighter mt-1", descriptionClassName)}>{description}</p>}
          </div>
        )}
      </div>
    )
  },
)
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
