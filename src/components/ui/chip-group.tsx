"use client"

import type * as React from "react"
import { cn } from "@/lib/utils"
import { Chip, type ChipProps } from "@/components/ui/chip"

interface ChipGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children?: React.ReactNode
}

export function ChipGroup({ className, children, ...props }: ChipGroupProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)} {...props}>
      {children}
    </div>
  )
}

interface ChipFilterProps extends Omit<ChipProps, "selected" | "onDismiss"> {
  value: string
  selected?: boolean
  onSelect?: (value: string, selected: boolean) => void
}

export function ChipFilter({ value, selected = false, onSelect, children, ...props }: ChipFilterProps) {
  const handleClick = () => {
    onSelect?.(value, !selected)
  }

  return (
    <Chip
      selected={selected}
      onClick={handleClick}
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleClick()
        }
      }}
      {...props}
    >
      {children}
    </Chip>
  )
}

interface ChipDismissibleProps extends Omit<ChipProps, "dismissible" | "onDismiss"> {
  onDismiss?: () => void
}

export function ChipDismissible({ onDismiss, children, ...props }: ChipDismissibleProps) {
  return (
    <Chip dismissible onDismiss={onDismiss} {...props}>
      {children}
    </Chip>
  )
}

interface ChipTagProps extends Omit<ChipProps, "variant" | "selected" | "onDismiss"> {
  tag: "cursant" | "formator" | "evaluator" | "moderator" | "admin"
  selected?: boolean
  onSelect?: (tag: string, selected: boolean) => void
}

export function ChipTag({ tag, selected = false, onSelect, children, ...props }: ChipTagProps) {
  const handleClick = () => {
    onSelect?.(tag, !selected)
  }

  return (
    <Chip
      variant={tag as ChipProps["variant"]}
      selected={selected}
      dismissible={selected}
      onDismiss={selected ? handleClick : undefined}
      onClick={!selected ? handleClick : undefined}
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleClick()
        }
      }}
      {...props}
    >
      {children}
    </Chip>
  )
}

interface ChipNivelProps extends Omit<ChipProps, "variant" | "selected" | "onDismiss"> {
  nivel: "primar" | "gimnaziu" | "liceu"
  selected?: boolean
  onSelect?: (nivel: string, selected: boolean) => void
}

export function ChipNivel({ nivel, selected = false, onSelect, children, ...props }: ChipNivelProps) {
  const handleClick = () => {
    onSelect?.(nivel, !selected)
  }

  return (
    <Chip
      variant={nivel as ChipProps["variant"]}
      selected={selected}
      dismissible={selected}
      onDismiss={selected ? handleClick : undefined}
      onClick={!selected ? handleClick : undefined}
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleClick()
        }
      }}
      {...props}
    >
      {children}
    </Chip>
  )
}
