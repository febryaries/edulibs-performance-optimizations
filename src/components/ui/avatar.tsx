"use client"

import * as React from "react"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"

type AvatarSize = "32" | "40" | "48" | "64" | "96"
type AvatarVariant = "01" | "02" | "03" | "04" | "05" | "populated" | "empty"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: AvatarSize
  variant?: AvatarVariant
  initials?: string
  src?: string
  alt?: string
  fallback?: React.ReactNode
  className?: string
}

const sizeStyles: Record<AvatarSize, string> = {
  "32": "w-8 h-8 text-xs",
  "40": "w-10 h-10 text-sm",
  "48": "w-12 h-12 text-base",
  "64": "w-16 h-16 text-lg",
  "96": "w-24 h-24 text-xl",
}

export function Avatar({
  size = "48",
  variant = "01",
  initials,
  src,
  alt,
  fallback,
  className,
  ...props
}: AvatarProps) {
  const [isHovered, setIsHovered] = React.useState(false)
  const [imageError, setImageError] = React.useState(false)

  const variantStyles: Record<AvatarVariant, string> = {
    "01": "bg-avatar-1 text-text-inverted",
    "02": "bg-avatar-2 text-text-inverted",
    "03": "bg-avatar-3 text-text-inverted",
    "04": "bg-avatar-4 text-text-inverted",
    "05": "bg-avatar-5 text-text-inverted",
    populated: "bg-transparent",
    empty: "bg-gray-100 text-gray-400",
  }

  const hoverStyles: Record<AvatarVariant, string> = {
    "01": "hover:shadow-[0_0_0_4px_rgba(59,130,246,0.3)]",
    "02": "hover:shadow-[0_0_0_4px_rgba(15,23,42,0.3)]",
    "03": "hover:shadow-[0_0_0_4px_rgba(139,92,246,0.3)]",
    "04": "hover:shadow-[0_0_0_4px_rgba(16,185,129,0.3)]",
    "05": "hover:shadow-[0_0_0_4px_rgba(245,158,11,0.3)]",
    populated: "hover:shadow-[0_0_0_4px_rgba(203,213,225,0.3)]",
    empty: "hover:shadow-[0_0_0_4px_rgba(203,213,225,0.3)] hover:bg-gray-200",
  }

  const showImage = src && !imageError && variant === "populated"
  const showInitials = initials && !showImage && variant !== "empty"
  const showFallback = !showImage && !showInitials

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full overflow-hidden transition-shadow duration-200",
        sizeStyles[size],
        variantStyles[variant],
        hoverStyles[variant],
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {showImage && (
        <img
          src={src || "/placeholder.svg"}
          alt={alt || "Avatar"}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      )}
      {showInitials && <span className="font-medium">{initials}</span>}
      {showFallback &&
        (fallback || (
          <User className={cn("w-1/2 h-1/2", variant === "empty" ? "text-gray-400" : "text-text-inverted")} />
        ))}
    </div>
  )
}

interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  max?: number
  className?: string
}

export function AvatarGroup({ children, max, className, ...props }: AvatarGroupProps) {
  const childrenArray = React.Children.toArray(children)
  const excess = max !== undefined && childrenArray.length > max ? childrenArray.length - max : 0

  return (
    <div className={cn("flex -space-x-2", className)} {...props}>
      {max !== undefined && childrenArray.length > max
        ? childrenArray.slice(0, max).map((child, index) => (
            <div key={index} className="relative">
              {child}
            </div>
          ))
        : childrenArray.map((child, index) => (
            <div key={index} className="relative">
              {child}
            </div>
          ))}
      {excess > 0 && (
        <div
          className={cn(
            "relative flex items-center justify-center rounded-full bg-gray-100 text-gray-600 w-8 h-8 text-xs",
            sizeStyles[childrenArray[0]?.props?.size || "48"],
          )}
        >
          +{excess}
        </div>
      )}
    </div>
  )
}
