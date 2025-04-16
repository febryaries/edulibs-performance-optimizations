"use client"

import * as React from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccordionProps {
  children: React.ReactNode
  className?: string
}

export function Accordion({ children, className }: AccordionProps) {
  return <div className={cn("rounded-radius-04 border border-border-light overflow-hidden", className)}>{children}</div>
}

interface AccordionItemProps {
  title: string
  defaultOpen?: boolean
  children?: React.ReactNode
  className?: string
}

export function AccordionItem({ title, defaultOpen = false, children, className }: AccordionItemProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  return (
    <div className={cn("border-b border-border-light last:border-0", className)}>
      <button
        className="w-full p-spacing-05 flex items-center gap-spacing-03 text-left"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-text-lighter" />
        ) : (
          <ChevronDown className="h-5 w-5 text-text-lighter" />
        )}
        <span className="font-medium">{title}</span>
      </button>

      {isOpen && children && <div className="px-spacing-05 pb-spacing-05 text-text-light">{children}</div>}
    </div>
  )
}
