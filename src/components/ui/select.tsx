"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[]
  value?: string | string[]
  onChange?: (value: string | string[]) => void
  placeholder?: string
  error?: boolean
  isMulti?: boolean
  className?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, value, onChange, placeholder, error, isMulti, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (isMulti) {
        const selectedOptions = Array.from(e.target.selectedOptions).map((option) => option.value)
        onChange?.(selectedOptions)
      } else {
        onChange?.(e.target.value)
      }
    }

    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "flex h-10 w-full appearance-none rounded-radius-03 border border-border-default bg-bg-lightest px-3 py-2 pr-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            {
              "border-border-destructive focus-visible:ring-border-destructive": error,
            },
            className,
          )}
          value={value}
          onChange={handleChange}
          multiple={isMulti}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-lighter" />
      </div>
    )
  },
)
Select.displayName = "Select"

const SelectGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div className={cn("relative", className)} ref={ref} {...props} />,
)
SelectGroup.displayName = "SelectGroup"

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => <button className={cn("relative", className)} ref={ref} {...props} />,
)
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => <span className={cn("relative", className)} ref={ref} {...props} />,
)
SelectValue.displayName = "SelectValue"

const SelectContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div className={cn("relative", className)} ref={ref} {...props} />,
)
SelectContent.displayName = "SelectContent"

const SelectLabel = React.forwardRef<HTMLLabelElement, React.HTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => <label className={cn("relative", className)} ref={ref} {...props} />,
)
SelectLabel.displayName = "SelectLabel"

const SelectItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div className={cn("relative", className)} ref={ref} {...props} />,
)
SelectItem.displayName = "SelectItem"

const SelectSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div className={cn("relative", className)} ref={ref} {...props} />,
)
SelectSeparator.displayName = "SelectSeparator"

const SelectScrollUpButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => <button className={cn("relative", className)} ref={ref} {...props} />,
)
SelectScrollUpButton.displayName = "SelectScrollUpButton"

const SelectScrollDownButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => <button className={cn("relative", className)} ref={ref} {...props} />,
)
SelectScrollDownButton.displayName = "SelectScrollDownButton"

export {
  Select,
  SelectGroup,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
