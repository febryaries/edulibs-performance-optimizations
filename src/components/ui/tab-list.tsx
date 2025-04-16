"use client"

import * as React from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export interface TabItem {
  id: string
  label: React.ReactNode
  content: React.ReactNode
  disabled?: boolean
  icon?: boolean
  state?: "default" | "error"
}

interface TabListProps {
  tabs: TabItem[]
  defaultValue?: string
  variant?: "underline" | "ghost"
  className?: string
  tabsListClassName?: string
  tabsTriggerClassName?: string
  tabsContentClassName?: string
  onChange?: (value: string) => void
}

export function TabList({
  tabs,
  defaultValue,
  variant = "underline",
  className,
  tabsListClassName,
  tabsTriggerClassName,
  tabsContentClassName,
  onChange,
}: TabListProps) {
  const [activeTab, setActiveTab] = React.useState(defaultValue || tabs[0]?.id || "")
  const tabsRef = React.useRef<HTMLDivElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const tabElements = tabsRef.current?.querySelectorAll('[role="tab"]')
    if (!tabElements || tabElements.length === 0) return

    const tabArray = Array.from(tabElements)
    const currentIndex = tabArray.findIndex((tab) => tab.getAttribute("data-state") === "active")

    let nextIndex: number | null = null

    switch (e.key) {
      case "ArrowRight":
        nextIndex = (currentIndex + 1) % tabArray.length
        break
      case "ArrowLeft":
        nextIndex = (currentIndex - 1 + tabArray.length) % tabArray.length
        break
      case "Home":
        nextIndex = 0
        break
      case "End":
        nextIndex = tabArray.length - 1
        break
      default:
        return
    }

    if (nextIndex !== null) {
      e.preventDefault()
      const nextTabId = tabArray[nextIndex].getAttribute("value")
      if (nextTabId) {
        setActiveTab(nextTabId)
        onChange?.(nextTabId)
        ;(tabArray[nextIndex] as HTMLElement).focus()
      }
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    onChange?.(value)
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className={cn("w-full", className)} ref={tabsRef}>
      <TabsList className={tabsListClassName} variant={variant} onKeyDown={handleKeyDown} aria-label="Tabs navigation">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            disabled={tab.disabled}
            className={tabsTriggerClassName}
            variant={variant}
            state={tab.state}
            icon={tab.icon}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className={tabsContentClassName}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
