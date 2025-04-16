"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar-context"
import { Avatar } from "@/components/ui/avatar"

export interface SidebarLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  logoText?: string
  logoIcon?: React.ReactNode
  avatarFallback?: string
}

export function SidebarLogo({
  logoText = "EDU APPS",
  logoIcon,
  avatarFallback = "A",
  className,
  ...props
}: SidebarLogoProps) {
  const { isOpen } = useSidebar()

  return (
    <div className={cn("flex items-center gap-3", className)} {...props}>
      {isOpen ? (
        <span className="text-lg font-bold text-text-accent">{logoText}</span>
      ) : (
        <Avatar size="32" variant="01" initials={avatarFallback} className="bg-bg-accent text-text-inverted" />
      )}
    </div>
  )
}
