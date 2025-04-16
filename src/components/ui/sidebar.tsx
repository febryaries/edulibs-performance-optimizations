"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// Sidebar Context
type SidebarContextType = {
  isOpen: boolean
  toggle: () => void
  open: () => void
  close: () => void
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  const toggle = React.useCallback(() => setIsOpen((prev) => !prev), [])
  const open = React.useCallback(() => setIsOpen(true), [])
  const close = React.useCallback(() => setIsOpen(false), [])

  return <SidebarContext.Provider value={{ isOpen, toggle, open, close }}>{children}</SidebarContext.Provider>
}

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

// Sidebar Components
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
        "flex flex-col border-r border-gray-200 transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-16",
        className,
      )}
      {...props}
    >
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
        <div className={cn("overflow-hidden", isOpen ? "w-full" : "w-8")}>{logo}</div>
        {toggleButton && (
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8", !isOpen && "ml-auto")}
            onClick={toggle}
            aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
          >
            {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-2">{children}</div>
      {footer && <div className="border-t border-gray-200 p-4">{footer}</div>}
    </div>
  )
}

export interface SidebarItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode
  active?: boolean
  badge?: string | number
  badgeColor?: "blue" | "gray"
  href?: string
  isActive?: boolean
  children?: React.ReactNode
  className?: string
}

export function SidebarItem({
  className,
  icon,
  active = false,
  badge,
  badgeColor = "blue",
  children,
  href,
  isActive,
  ...props
}: SidebarItemProps) {
  const { isOpen } = useSidebar()
  const activeState = isActive || active

  const content = (
    <div
      className={cn(
        "group flex cursor-pointer items-center px-4 py-2",
        activeState && "bg-blue-50 text-blue-600",
        !activeState && "text-gray-700 hover:bg-gray-100",
        className,
      )}
      {...props}
    >
      <div className="flex h-5 w-5 items-center justify-center">{icon}</div>
      {isOpen && (
        <div className="ml-3 flex flex-1 items-center justify-between">
          <span className={cn("text-sm font-medium", activeState && "font-semibold")}>{children}</span>
          {badge && (
            <Badge
              variant="default"
              className={cn(
                "ml-auto",
                badgeColor === "blue" && "bg-blue-100 text-blue-600 hover:bg-blue-100",
                badgeColor === "gray" && "bg-gray-100 text-gray-600 hover:bg-gray-100",
              )}
            >
              {badge}
            </Badge>
          )}
        </div>
      )}
      {!isOpen && badge && (
        <Badge
          variant="default"
          className={cn(
            "absolute left-8 top-1 ml-1",
            badgeColor === "blue" && "bg-blue-100 text-blue-600 hover:bg-blue-100",
            badgeColor === "gray" && "bg-gray-100 text-gray-600 hover:bg-gray-100",
          )}
        >
          {badge}
        </Badge>
      )}
    </div>
  )

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    )
  }

  return content
}

export interface SidebarLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
}

export function SidebarLogo({ className, icon, children, ...props }: SidebarLogoProps) {
  const { isOpen } = useSidebar()

  return (
    <div className={cn("flex items-center", className)} {...props}>
      {icon && <div className="flex h-8 w-8 items-center justify-center">{icon}</div>}
      {isOpen && children && <div className="ml-3 font-semibold text-blue-600">{children}</div>}
    </div>
  )
}

export interface SidebarSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
}

export function SidebarSection({ className, children, title, ...props }: SidebarSectionProps) {
  const { isOpen } = useSidebar()

  return (
    <div className={cn("py-2", className)} {...props}>
      {title && isOpen && <div className="mb-2 px-4 text-xs font-semibold uppercase text-gray-500">{title}</div>}
      {children}
    </div>
  )
}
