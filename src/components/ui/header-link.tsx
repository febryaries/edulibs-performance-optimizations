"use client"

import type * as React from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface HeaderLinkProps extends React.HTMLAttributes<HTMLAnchorElement> {
  /** The href for the link */
  href: string
  /** Whether the link is active */
  active?: boolean
  /** Icon to display before the link text */
  icon?: LucideIcon
  /** Count to display in a pill badge */
  count?: number
  /** External link that opens in a new tab */
  external?: boolean
}

export function HeaderLink({
  href,
  active,
  icon: Icon,
  count,
  children,
  className,
  external = false,
  ...props
}: HeaderLinkProps) {
  const LinkComponent = external ? "a" : Link
  const externalProps = external ? { target: "_blank", rel: "noopener noreferrer" } : {}

  return (
    <LinkComponent
      href={href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        active
          ? "bg-[#EFF6FF] rounded-radius-05 text-blue-600" // Changed to match the blue color in the image
          : "text-gray-600 hover:bg-gray-50",
        className,
      )}
      {...externalProps}
      {...props}
    >
      {Icon && <Icon className={cn("h-5 w-5", active ? "text-blue-600" : "text-gray-600")} />}
      <span className="font-medium">{children}</span>
      {count !== undefined && (
        <span
          className={cn(
            "ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold",
            active
              ? "bg-blue-500 text-white" // Blue pill with white text when active
              : "bg-gray-100 text-gray-600", // Gray pill with gray text when inactive
          )}
        >
          {count}
        </span>
      )}
    </LinkComponent>
  )
}
