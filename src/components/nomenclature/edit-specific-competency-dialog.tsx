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
import {
  useSpecificCompetenciesController,
  useClassesController,
  useGeneralCompetenciesController,
  SpecificCompetency,
} from "@/hooks/use-controllers"

// Define the form schema
const formSchema = z.object({
  name: z.string().min(3, { message: "Numele trebuie să conțină cel puțin 3 caractere" }),
  class_id: z.number({ required_error: "Clasa este obligatorie" }).min(1, "Clasa este obligatorie"),
  competency_id: z.number({ required_error: "Competența generală este obligatorie" }).min(1, "Competența generală este obligatorie"),
})

type FormValues = z.infer<typeof formSchema>

interface EditSpecificCompetencyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  competency: SpecificCompetency | null
}

export function EditSpecificCompetencyDialog({
  open,
  onOpenChange,
  competency
}: EditSpecificCompetencyDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const specificCompetenciesController = useSpecificCompetenciesController()
  // Get the controllers
  const classesController = useClassesController()
  const generalCompetenciesController = useGeneralCompetenciesController()

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: competency?.name || "",
      class_id: competency?.class_id || -1,
      competency_id: competency?.competency_id || -1,
    },
  })

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      if (competency) {
        // Update existing competency
        await specificCompetenciesController.update(competency.id, data)
        toast({
          title: "Competență actualizată",
          description: "Competența specifică a fost actualizată cu succes.",
        })
      } else {
        // Create new competency
        await specificCompetenciesController.create(data)
        toast({
          title: "Competență adăugată",
          description: "Competența specifică a fost adăugată cu succes.",
        })
      }
      onOpenChange(false)
      // Reset form
      form.reset()
    } catch (error) {
      console.error("Error saving specific competency:", error)
      toast({
        title: "Eroare",
        description: "A apărut o eroare la salvarea competenței specifice.",
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
            {competency ? "Editare competență specifică" : "Adăugare competență specifică"}
          </DialogTitle>
          <DialogDescription>
            Completați detaliile pentru competența specifică.
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
                    <Input placeholder="Introduceți denumirea competenței" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="class_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clasă</FormLabel>
                  <FormControl>
                    <SearchableDropdown
                      placeholder="Selectați clasa"
                      filterKey="classes"
                      fetchHook={(params) => classesController.getPaginatedData(params)}
                      valueField="id"
                      labelField="name"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="competency_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Competență generală</FormLabel>
                  <FormControl>
                    <SearchableDropdown
                      placeholder="Selectați competența generală"
                      filterKey="general_competencies"
                      fetchHook={(params) => generalCompetenciesController.getPaginatedData(params)}
                      valueField="id"
                      labelField="name"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Se salvează..." : competency ? "Actualizează" : "Adaugă"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
