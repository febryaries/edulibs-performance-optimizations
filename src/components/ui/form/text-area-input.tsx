"use client"

import type * as React from "react"
import { TextArea, type TextAreaProps } from "@/components/ui/text-area"

interface FormTextAreaProps extends Omit<TextAreaProps, "value" | "onChange" | "name"> {
  name: string
  form: any
}

export const FormTextAreaField: React.FC<FormTextAreaProps> = ({ name, form, ...props }) => {
  const field = form.useField(name)

  return (
    <TextArea
      id={name}
      name={name}
      value={field.state.value ?? ""}
      onChange={(e) => field.setValue(e.target.value)}
      onBlur={() => field.setTouched(true)}
      error={!!field.state.error}
      errorMessage={field.state.error}
      {...props}
    />
  )
}
