"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { File } from "lucide-react"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    variant?: "underline" | "ghost"
    className?: string
  }
>(({ className, variant = "underline", ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-radius-03 bg-transparent",
      variant === "ghost" && "p-1 bg-bg-subtle",
      className,
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const tabVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-radius-03 px-3 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:font-semibold relative",
  {
    variants: {
      variant: {
        underline: "hover:text-text-default data-[state=active]:text-text-accent",
        ghost: "hover:bg-bg-subtle data-[state=active]:bg-bg-primary data-[state=active]:text-text-inverted",
      },
      state: {
        default: "",
        error: "text-text-error",
      },
    },
    defaultVariants: {
      variant: "underline",
      state: "default",
    },
  },
)

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    variant?: "underline" | "ghost"
    state?: "default" | "error"
    icon?: boolean
  }
>(({ className, variant = "underline", state = "default", icon = true, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      tabVariants({ variant, state }),
      variant === "underline" &&
        "data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:w-full data-[state=active]:after:bg-bg-primary",
      className,
    )}
    {...props}
  >
    {icon && <File className={cn("mr-2 h-4 w-4", variant === "ghost" && "data-[state=active]:text-text-inverted")} />}
    {children}
    {state === "error" && (
      <span className="ml-2 h-4 w-4 rounded-radius-round bg-bg-error text-text-inverted flex items-center justify-center text-xs">
        !
      </span>
    )}
  </TabsPrimitive.Trigger>
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
