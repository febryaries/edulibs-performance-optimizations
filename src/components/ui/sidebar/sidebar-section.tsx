"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar-context"

export interface SidebarSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
}

export function SidebarSection({ title, className, children, ...props }: SidebarSectionProps) {
  const { isOpen } = useSidebar()

  return (
    <div className={cn("px-3 py-2", className)} {...props}>
      {title && isOpen && <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-text-light">{title}</h3>}
      <div className="space-y-1">{children}</div>
    </div>
  )
}
