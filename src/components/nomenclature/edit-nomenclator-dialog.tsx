"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { SearchableDropdown } from "@/components/ui/searchable-dropdown"
import { useToast } from "@/components/ui/use-toast"
import { QueryController, TableNames, ForeignKeyRelationMap } from "@/lib/query-controller"

// Define the base form schema
const baseFormSchema = z.object({
  name: z.string().min(3, { message: "Numele trebuie să conțină cel puțin 3 caractere" }),
})

interface EditNomenclatorDialogProps<T extends TableNames, M extends ForeignKeyRelationMap<T>> {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: any | null
  controller: QueryController<T, M>
  title: string
  description: string
  formSchema?: z.ZodObject<any>
  extraFields?: {
    name: string
    label: string
    type: "text" | "dropdown"
    required?: boolean
    dropdownProps?: {
      controller: QueryController<any, any>
      valueField: string
      labelField: string
      filterKey: string
      placeholder: string
    }
  }[]
}

export function EditNomenclatorDialog<T extends TableNames, M extends ForeignKeyRelationMap<T>>({
  open,
  onOpenChange,
  item,
  controller,
  title,
  description,
  formSchema = baseFormSchema,
  extraFields = [],
}: EditNomenclatorDialogProps<T, M>) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Create default values from item or empty values
  const defaultValues: any = { name: item?.name || "" }
  
  // Add extra fields to default values
  extraFields.forEach(field => {
    defaultValues[field.name] = item?.[field.name] || (field.type === "dropdown" ? -1 : "")
  })

  // Initialize form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  // Handle form submission
  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      if (item) {
        // Update existing item
        await controller.update(item.id, data)
        toast({
          title: "Element actualizat",
          description: "Elementul a fost actualizat cu succes.",
        })
      } else {
        // Create new item
        await controller.create(data)
        toast({
          title: "Element adăugat",
          description: "Elementul a fost adăugat cu succes.",
        })
      }
      onOpenChange(false)
      // Reset form
      form.reset()
    } catch (error) {
      console.error("Error saving nomenclator item:", error)
      toast({
        title: "Eroare",
        description: "A apărut o eroare la salvarea elementului.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {item ? `Editare ${title}` : `Adăugare ${title}`}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Denumire</FormLabel>
                  <FormControl>
                    <Input placeholder="Introduceți denumirea" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Render extra fields */}
            {extraFields.map((extraField) => (
              <FormField
                key={extraField.name}
                control={form.control}
                name={extraField.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{extraField.label}</FormLabel>
                    <FormControl>
                      {extraField.type === "text" ? (
                        <Input 
                          placeholder={`Introduceți ${extraField.label.toLowerCase()}`} 
                          {...field} 
                        />
                      ) : extraField.type === "dropdown" && extraField.dropdownProps ? (
                        <SearchableDropdown
                          placeholder={extraField.dropdownProps.placeholder}
                          filterKey={extraField.dropdownProps.filterKey}
                          fetchHook={(params) => extraField.dropdownProps!.controller.getPaginatedData(params)}
                          valueField={extraField.dropdownProps.valueField}
                          labelField={extraField.dropdownProps.labelField}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      ) : null}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Se salvează..." : item ? "Actualizează" : "Adaugă"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
