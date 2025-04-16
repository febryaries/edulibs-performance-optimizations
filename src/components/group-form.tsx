"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
import { MultiSelectUser } from "@/components/ui/form/multi-select-user"
import type { UserRow } from "@/queries/users-controller"

// Define the form schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Numele grupei trebuie să conțină cel puțin 2 caractere.",
  }),
  members: z.array(z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().optional(),
    avatar: z.string().optional(),
  })),
})

type GroupFormValues = z.infer<typeof formSchema>

export interface GroupFormProps {
  onSubmit: (values: GroupFormValues) => void
  defaultValues?: Partial<GroupFormValues>
  onCancel?: () => void
}

export function GroupForm({ onSubmit, defaultValues, onCancel }: GroupFormProps) {
  // Initialize the form with default values
  const form = useForm<GroupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      members: defaultValues?.members || [],
    },
  })

  // Handle form submission
  const handleSubmit = (values: GroupFormValues) => {
    onSubmit(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Denumire grupă</FormLabel>
              <FormControl>
                <Input placeholder="Introdu denumirea grupei" {...field} />
              </FormControl>
              <FormDescription>
                Alege o denumire pentru grupa ta și adaugă cursanți.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormLabel>Adaugă cursanți</FormLabel>
          <FormField
            control={form.control}
            name="members"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <MultiSelectUser
                    value={field.value as UserRow[]}
                    onChange={field.onChange}
                    placeholder="Adaugă din listă sau adaugă unul nou"
                    disabled={form.formState.isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Renunță
            </Button>
          )}
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            Creează grupă
          </Button>
        </div>
      </form>
    </Form>
  )
}
