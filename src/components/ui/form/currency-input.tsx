"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { useField } from "@tanstack/react-form"
import { z } from "zod"
import { cn } from "@/lib/utils"

// Currency options
const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
]

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  name: string
  label?: string
  description?: string
  error?: string
  onChange?: (value: { currency: string; amount: number | undefined }) => void
  value?: { currency: string; amount: number | undefined }
}

export function CurrencyInput({
  name,
  label,
  description,
  error,
  onChange,
  value = { currency: "USD", amount: undefined },
  className,
  ...props
}: CurrencyInputProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedCurrency, setSelectedCurrency] = React.useState(
    currencies.find((c) => c.code === value.currency) || currencies[0],
  )
  const [amount, setAmount] = React.useState<string>(value.amount?.toString() || "")

  React.useEffect(() => {
    if (value) {
      setSelectedCurrency(currencies.find((c) => c.code === value.currency) || currencies[0])
      setAmount(value.amount?.toString() || "")
    }
  }, [value])

  const handleCurrencySelect = (currency: (typeof currencies)[0]) => {
    setSelectedCurrency(currency)
    setIsOpen(false)
    onChange?.({
      currency: currency.code,
      amount: amount === "" ? undefined : Number.parseFloat(amount),
    })
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value
    setAmount(newAmount)
    onChange?.({
      currency: selectedCurrency.code,
      amount: newAmount === "" ? undefined : Number.parseFloat(newAmount),
    })
  }

  // Format the amount with commas for thousands
  const formatAmount = (value: string) => {
    if (!value) return value

    // Remove all non-digits and non-decimal points
    const cleanValue = value.replace(/[^\d.]/g, "")

    // Ensure only one decimal point
    const parts = cleanValue.split(".")
    if (parts.length > 2) {
      parts[1] = parts.slice(1).join("")
      return `${parts[0]}.${parts[1]}`
    }

    // Format with commas for thousands
    if (parts[0].length > 3) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    }

    return parts.length === 2 ? `${parts[0]}.${parts[1]}` : parts[0]
  }

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={name} className="text-sm font-medium leading-none">
          {label}
        </label>
      )}

      <div className="relative flex">
        <input
          id={name}
          name={name}
          type="text"
          inputMode="decimal"
          value={formatAmount(amount)}
          onChange={handleAmountChange}
          className={cn(
            "flex h-10 w-full rounded-l-radius-03 border border-r-0 border-border-default bg-bg-lightest px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-lighter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            {
              "border-border-destructive focus-visible:ring-border-destructive": error,
            },
            className,
          )}
          placeholder="1,000"
          {...props}
        />

        <div className="relative">
          <button
            type="button"
            className="flex h-10 items-center gap-1 rounded-r-radius-03 border border-border-default bg-bg-lightest px-3 hover:bg-bg-light"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span>{selectedCurrency.code}</span>
            <ChevronDown className="h-4 w-4 text-text-lighter" />
          </button>

          {isOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 max-h-60 w-48 overflow-auto rounded-radius-03 border border-border-default bg-bg-lightest shadow-md">
              {currencies.map((currency) => (
                <button
                  key={currency.code}
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 hover:bg-bg-light"
                  onClick={() => handleCurrencySelect(currency)}
                >
                  <span className="w-8">{currency.symbol}</span>
                  <span>{currency.code}</span>
                  <span className="ml-auto text-xs text-text-lighter truncate">{currency.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {description && !error && <p className="text-sm text-text-lighter">{description}</p>}

      {error && <p className="text-sm text-text-destructive-light">{error}</p>}
    </div>
  )
}

// Form field component that integrates with TanStack Form
export function FormCurrencyField({
  name,
  label,
  description,
  ...props
}: Omit<CurrencyInputProps, "error" | "onChange" | "value">) {
  const { field, state } = useField({
    name,
    validators: {
      onChange: z.object({
        currency: z.string(),
        amount: z
          .number()
          .optional()
          .refine((val) => val === undefined || val >= 0, { message: "Amount must be positive" }),
      }),
    },
  })

  return (
    <CurrencyInput
      name={name}
      label={label}
      description={description}
      error={state.meta.touchedErrors?.[0]}
      onChange={field.handleChange}
      value={field.state.value}
      onBlur={field.handleBlur}
      {...props}
    />
  )
}
