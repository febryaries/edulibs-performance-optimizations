"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  separator?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export function Breadcrumb({
  separator = <ChevronRight className="h-4 w-4 text-text-lighter" />,
  className,
  children,
  ...props
}: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center", className)} {...props}>
      <ol className="flex items-center gap-1">{children}</ol>
    </nav>
  )
}

interface BreadcrumbItemProps extends React.HTMLAttributes<HTMLLIElement> {
  href?: string
  current?: boolean
  dropdown?: boolean
  className?: string
  children: React.ReactNode
}

export function BreadcrumbItem({
  href,
  current = false,
  dropdown = false,
  className,
  children,
  ...props
}: BreadcrumbItemProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <li className={cn("flex items-center", className)} aria-current={current ? "page" : undefined} {...props}>
      {href && !dropdown ? (
        <Link
          href={href}
          className={cn("text-sm hover:underline", current ? "text-text-default font-medium" : "text-text-accent")}
        >
          {children}
        </Link>
      ) : dropdown ? (
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 text-sm text-text-accent hover:underline"
          >
            {children}
            <ChevronDown className="h-3 w-3" />
          </button>
          {isOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 rounded-radius-03 border border-border-default bg-bg-lightest shadow-sm z-10">
              <div className="py-1">
                <a href="#" className="block px-4 py-2 text-sm text-text-default hover:bg-bg-light">
                  Documentation
                </a>
                <a href="#" className="block px-4 py-2 text-sm text-text-accent hover:bg-bg-light">
                  Themes
                </a>
                <a href="#" className="block px-4 py-2 text-sm text-text-default hover:bg-bg-light">
                  Github
                </a>
              </div>
            </div>
          )}
        </div>
      ) : (
        <span className="text-sm font-medium text-text-default">{children}</span>
      )}
    </li>
  )
}

interface BreadcrumbSeparatorProps extends React.HTMLAttributes<HTMLLIElement> {
  className?: string
  children?: React.ReactNode
}

export function BreadcrumbSeparator({ className, children, ...props }: BreadcrumbSeparatorProps) {
  return (
    <li className={cn("flex items-center text-text-lighter mx-1", className)} {...props}>
      {children || <ChevronRight className="h-4 w-4" />}
    </li>
  )
}

interface BreadcrumbEllipsisProps extends React.HTMLAttributes<HTMLLIElement> {
  className?: string
}

export function BreadcrumbEllipsis({ className, ...props }: BreadcrumbEllipsisProps) {
  return (
    <li className={cn("flex items-center text-text-lighter mx-1", className)} {...props}>
      <span className="text-sm">...</span>
    </li>
  )
}
