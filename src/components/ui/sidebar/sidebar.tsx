"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar-context"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  logo?: React.ReactNode
  footer?: React.ReactNode
  toggleButton?: boolean
}

export function Sidebar({ className, logo, footer, toggleButton = true, children, ...props }: SidebarProps) {
  const { isOpen, toggle } = useSidebar()

  return (
    <div
      className={cn(
        "flex flex-col border-r border-border-default bg-white transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-16",
        className,
      )}
      {...props}
    >
      <div className="flex h-16 items-center justify-between border-b border-border-default px-4">
        <div className={cn("overflow-hidden", isOpen ? "w-full" : "w-8")}>{logo}</div>
        {toggleButton && (
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", !isOpen && "ml-auto")}
            onClick={toggle}
            aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
          >
            {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-2">{children}</div>
      {footer && <div className="border-t border-border-default p-4">{footer}</div>}
    </div>
  )
}
