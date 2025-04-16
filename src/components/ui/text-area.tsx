"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  errorMessage?: string
  showCharCount?: boolean
  maxLength?: number
  label?: string
  description?: string
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, error, errorMessage, showCharCount, maxLength, label, description, ...props }, ref) => {
    const [charCount, setCharCount] = React.useState(0)

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length)
      props.onChange?.(e)
    }

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={props.id}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-radius-03 border border-border-default bg-bg-lightest px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-lighter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            {
              "border-border-destructive focus-visible:ring-border-destructive": error,
            },
            className,
          )}
          ref={ref}
          onChange={handleChange}
          maxLength={maxLength}
          {...props}
        />
        <div className="flex justify-between">
          {description && !error && <p className="text-sm text-text-lighter">{description}</p>}
          {error && errorMessage && <p className="text-sm text-text-destructive-light">{errorMessage}</p>}
          {showCharCount && maxLength && (
            <p className="text-sm text-text-lighter">
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    )
  },
)
TextArea.displayName = "TextArea"

export { TextArea }
export type { TextAreaProps }
