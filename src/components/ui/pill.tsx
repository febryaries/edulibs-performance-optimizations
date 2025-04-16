import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const pillVariants = cva("inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-medium", {
  variants: {
    variant: {
      default: "bg-bg-lightest text-text-accent",
      accent: "bg-bg-primary text-text-inverted",
      secondary: "bg-bg-light text-text-default",
      destructive: "bg-bg-destructive-strong text-text-inverted",
      success: "bg-bg-success-strong text-text-inverted",
      warning: "bg-bg-warning-strong text-text-inverted",
      outline: "border border-border-default bg-transparent",
    },
    size: {
      sm: "h-6 px-2 text-xs",
      md: "h-8 px-3 text-sm",
      lg: "h-10 px-4 text-base",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
})

export interface PillProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof pillVariants> {
  asChild?: boolean
}

export function Pill({ className, variant, size, asChild = false, ...props }: PillProps) {
  const Comp = asChild ? React.Fragment : "div"
  return <Comp className={cn(pillVariants({ variant, size, className }))} {...props} />
}
