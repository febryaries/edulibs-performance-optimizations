"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const TooltipRoot = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-radius-03 bg-[#1A202C] px-3 py-1.5 text-sm text-white shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className,
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

// Compound component that combines the tooltip parts with default configuration
interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  title?: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  delayDuration?: number
  className?: string
  contentClassName?: string
}

function Tooltip({
  children,
  content,
  title,
  side = "top",
  align = "center",
  delayDuration = 300,
  className,
  contentClassName,
}: TooltipProps) {
  return (
    <TooltipProvider>
      <TooltipRoot delayDuration={delayDuration}>
        <TooltipTrigger asChild className={className}>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side} align={align} className={contentClassName}>
          {title && <div className="font-medium">{title}</div>}
          <div className={cn(title && "text-sm opacity-90")}>{content}</div>
        </TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  )
}

export { Tooltip, TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent }
