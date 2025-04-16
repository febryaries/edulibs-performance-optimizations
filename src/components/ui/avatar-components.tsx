"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Avatar as BaseAvatar } from "@/components/ui/avatar"

interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string
}

export function AvatarImage({ className, ...props }: AvatarImageProps) {
  return (
    <img
      className={cn("h-full w-full object-cover rounded-full", className)}
      {...props}
    />
  )
}

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function AvatarFallback({ className, ...props }: AvatarFallbackProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full",
        className
      )}
      {...props}
    />
  )
}

// Re-export the base Avatar component
export { BaseAvatar as Avatar }
