"use client"

import * as React from "react"
import { MinusIcon, PlusIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string
  label?: string
  description?: string
  min?: number
  max?: number
  step?: number
  error?: string | boolean
  variant?: "default" | "buttons-inside" | "buttons-outside"
  onChange?: (value: number | undefined) => void
  value?: number
}

export function NumberInput({
  name,
  label,
  description,
  min,
  max,
  step = 1,
  error,
  variant = "buttons-inside",
  onChange,
  value,
  className,
  ...props
}: NumberInputProps) {
  const [internalValue, setInternalValue] = React.useState<number | undefined>(value)

  React.useEffect(() => {
    setInternalValue(value)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value === "" ? undefined : Number(e.target.value)
    setInternalValue(newValue)
    onChange?.(newValue)
  }

  const increment = () => {
    if (max !== undefined && internalValue !== undefined && internalValue >= max) return
    const newValue = (internalValue ?? 0) + step
    setInternalValue(newValue)
    onChange?.(newValue)
  }

  const decrement = () => {
    if (min !== undefined && internalValue !== undefined && internalValue <= min) return
    const newValue = (internalValue ?? 0) - step
    setInternalValue(newValue)
    onChange?.(newValue)
  }

  const inputClasses = cn(
    "flex h-10 w-full rounded-radius-03 border border-border-default bg-bg-lightest px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-lighter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    {
      "border-border-destructive focus-visible:ring-border-destructive": error,
      "pl-10": variant === "buttons-inside",
      "pr-10": variant === "buttons-inside",
      "text-center": variant === "buttons-inside",
    },
    className,
  )

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={name} className="text-sm font-medium leading-none">
          {label}
        </label>
      )}

      <div className="relative">
        {variant === "buttons-inside" && (
          <button
            type="button"
            onClick={decrement}
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-radius-03 hover:bg-bg-light"
            disabled={min !== undefined && internalValue !== undefined && internalValue <= min}
          >
            <MinusIcon className="h-3 w-3" />
            <span className="sr-only">Decrease</span>
          </button>
        )}

        {variant === "buttons-outside" && (
          <div className="flex items-center">
            <button
              type="button"
              onClick={decrement}
              className="flex h-10 w-10 items-center justify-center rounded-l-radius-03 border border-r-0 border-border-default hover:bg-bg-light"
              disabled={min !== undefined && internalValue !== undefined && internalValue <= min}
            >
              <MinusIcon className="h-4 w-4" />
              <span className="sr-only">Decrease</span>
            </button>
          </div>
        )}

        <input
          id={name}
          name={name}
          type="number"
          min={min}
          max={max}
          step={step}
          value={internalValue === undefined ? "" : internalValue}
          onChange={handleChange}
          className={cn(inputClasses, variant === "buttons-outside" && "rounded-none text-center")}
          {...props}
        />

        {variant === "buttons-inside" && (
          <button
            type="button"
            onClick={increment}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-radius-03 hover:bg-bg-light"
            disabled={max !== undefined && internalValue !== undefined && internalValue >= max}
          >
            <PlusIcon className="h-3 w-3" />
            <span className="sr-only">Increase</span>
          </button>
        )}

        {variant === "buttons-outside" && (
          <div className="flex items-center">
            <button
              type="button"
              onClick={increment}
              className="flex h-10 w-10 items-center justify-center rounded-r-radius-03 border border-l-0 border-border-default hover:bg-bg-light"
              disabled={max !== undefined && internalValue !== undefined && internalValue >= max}
            >
              <PlusIcon className="h-4 w-4" />
              <span className="sr-only">Increase</span>
            </button>
          </div>
        )}
      </div>

      {description && !error && <p className="text-sm text-text-lighter">{description}</p>}

      {error && typeof error === "string" && <p className="text-sm text-text-destructive-light">{error}</p>}
    </div>
  )
}
