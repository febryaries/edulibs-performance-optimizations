"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-radius-03 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-bg-primary text-text-inverted hover:bg-bg-primary-focus",
        outline: "border border-border-default bg-bg-lightest text-text-default hover:bg-bg-light",
        secondary: "bg-bg-light text-text-default hover:bg-bg-focus-lightest",
        destructive: "bg-bg-destructive-strong text-text-inverted hover:bg-bg-destructive-focus",
        ghost: "hover:bg-bg-light text-text-default",
        link: "text-text-accent underline-offset-4 hover:underline",
      },
      size: {
        lg: "h-11 px-spacing-05 py-spacing-03 text-base gap-spacing-02",
        md: "h-10 px-spacing-04 py-spacing-02 text-sm gap-spacing-02",
        sm: "h-9 px-spacing-03 py-spacing-01 text-xs gap-spacing-02",
      },
      iconSize: {
        lg: "h-11 w-11",
        md: "h-10 w-10",
        sm: "h-9 w-9",
        xs: "h-8 w-8",
        xxs: "h-6 w-6",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
    compoundVariants: [
      {
        iconSize: "lg",
        class: "p-spacing-03",
      },
      {
        iconSize: "md",
        class: "p-spacing-02",
      },
      {
        iconSize: "sm",
        class: "p-spacing-02",
      },
      {
        iconSize: "xs",
        class: "p-spacing-01",
      },
      {
        iconSize: "xxs",
        class: "p-spacing-01",
      },
    ],
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<VariantProps<typeof buttonVariants>, "iconSize"> {
  asChild?: boolean
  iconOnly?: boolean
  iconSize?: "lg" | "md" | "sm" | "xs" | "xxs"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, iconOnly = false, iconSize, asChild = false, ...props },
    ref
  ) => {
    const classes = iconOnly
      ? buttonVariants({ variant, iconSize: iconSize || (size as any), className })
      : buttonVariants({ variant, size, className })

    if (asChild) {
      // Don't pass className or ref to Fragment
      return <React.Fragment>{props.children}</React.Fragment>
    }

    return (
      <button className={cn(classes)} ref={ref} {...props} />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
