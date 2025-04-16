"use client"

import type React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
// Make sure the import path for the context is correct
import { useSidebar } from "./sidebar-context"
import { Pill } from "@/components/ui/pill"

export interface SidebarItemProps {
  icon: React.ReactNode
  label: string
  href?: string
  count?: number
  active?: boolean
  onClick?: () => void
}

export function SidebarItem({ icon, label, href, count, active = false, onClick }: SidebarItemProps) {
  const { isOpen } = useSidebar()

  const content = (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
        active ? "bg-bg-primary-light text-text-accent" : "text-text-default hover:bg-bg-hover hover:text-text-accent",
      )}
    >
      <div className="flex h-6 w-6 items-center justify-center">{icon}</div>
      {isOpen && (
        <div className="flex flex-1 items-center justify-between">
          <span className="text-sm font-medium">{label}</span>
          {count !== undefined && (
            <Pill variant="accent" className="ml-auto">
              {count.toLocaleString()}
            </Pill>
          )}
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block" onClick={onClick}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" className="w-full text-left" onClick={onClick}>
      {content}
    </button>
  )
}
