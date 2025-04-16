"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { useField } from "@tanstack/react-form"
import { z } from "zod"
import { cn } from "@/lib/utils"

// Country codes for phone numbers
const countryCodes = [
  { code: "+1", country: "US", flag: "🇺🇸" },
  { code: "+44", country: "GB", flag: "🇬🇧" },
  { code: "+33", country: "FR", flag: "🇫🇷" },
  { code: "+49", country: "DE", flag: "🇩🇪" },
  { code: "+39", country: "IT", flag: "🇮🇹" },
  { code: "+34", country: "ES", flag: "🇪🇸" },
  { code: "+81", country: "JP", flag: "🇯🇵" },
  { code: "+86", country: "CN", flag: "🇨🇳" },
  { code: "+91", country: "IN", flag: "🇮🇳" },
  { code: "+55", country: "BR", flag: "🇧🇷" },
]

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  name: string
  label?: string
  description?: string
  error?: string
  onChange?: (value: { countryCode: string; number: string }) => void
  value?: { countryCode: string; number: string }
}

export function PhoneInput({
  name,
  label,
  description,
  error,
  onChange,
  value = { countryCode: "+1", number: "" },
  className,
  ...props
}: PhoneInputProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedCountry, setSelectedCountry] = React.useState(
    countryCodes.find((c) => c.code === value.countryCode) || countryCodes[0],
  )
  const [phoneNumber, setPhoneNumber] = React.useState(value.number)

  React.useEffect(() => {
    if (value) {
      setSelectedCountry(countryCodes.find((c) => c.code === value.countryCode) || countryCodes[0])
      setPhoneNumber(value.number)
    }
  }, [value])

  const handleCountrySelect = (country: (typeof countryCodes)[0]) => {
    setSelectedCountry(country)
    setIsOpen(false)
    onChange?.({ countryCode: country.code, number: phoneNumber })
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value
    setPhoneNumber(newNumber)
    onChange?.({ countryCode: selectedCountry.code, number: newNumber })
  }

  // Format phone number as user types (US format example)
  const formatPhoneNumber = (value: string) => {
    if (!value) return value

    // Remove all non-digits
    const phoneNumber = value.replace(/[^\d]/g, "")

    // US format: (XXX) XXX-XXXX
    if (selectedCountry.code === "+1") {
      if (phoneNumber.length < 4) return phoneNumber
      if (phoneNumber.length < 7) return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`
    }

    return phoneNumber
  }

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={name} className="text-sm font-medium leading-none">
          {label}
        </label>
      )}

      <div className="relative flex">
        <div className="relative">
          <button
            type="button"
            className="flex h-10 items-center gap-1 rounded-l-radius-03 border border-r-0 border-border-default bg-bg-lightest px-2 hover:bg-bg-light"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="text-base">{selectedCountry.flag}</span>
            <ChevronDown className="h-4 w-4 text-text-lighter" />
          </button>

          {isOpen && (
            <div className="absolute left-0 top-full z-10 mt-1 max-h-60 w-48 overflow-auto rounded-radius-03 border border-border-default bg-bg-lightest shadow-md">
              {countryCodes.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 hover:bg-bg-light"
                  onClick={() => handleCountrySelect(country)}
                >
                  <span className="text-base">{country.flag}</span>
                  <span>{country.country}</span>
                  <span className="ml-auto text-text-lighter">{country.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          id={name}
          name={name}
          type="tel"
          value={formatPhoneNumber(phoneNumber)}
          onChange={handlePhoneChange}
          className={cn(
            "flex h-10 w-full rounded-r-radius-03 border border-border-default bg-bg-lightest px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-lighter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            {
              "border-border-destructive focus-visible:ring-border-destructive": error,
            },
            className,
          )}
          placeholder="123-456-7890"
          {...props}
        />
      </div>

      {description && !error && <p className="text-sm text-text-lighter">{description}</p>}

      {error && <p className="text-sm text-text-destructive-light">{error}</p>}
    </div>
  )
}

// Form field component that integrates with TanStack Form
export function FormPhoneField({
  name,
  label,
  description,
  ...props
}: Omit<PhoneInputProps, "error" | "onChange" | "value">) {
  const { field, state } = useField({
    name,
    validators: {
      onChange: z.object({
        countryCode: z.string(),
        number: z
          .string()
          .min(1, "Phone number is required")
          .refine(
            (val) => {
              // Basic validation - can be enhanced for different country formats
              return /^[\d\-$$$$]+$/.test(val)
            },
            { message: "Invalid phone number format" },
          ),
      }),
    },
  })

  return (
    <PhoneInput
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
