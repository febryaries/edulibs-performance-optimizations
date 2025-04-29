"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/utils/supabase/client"
import { SearchableDropdown } from "@/components/ui/searchable-dropdown"
import { useEducationLevelsCrud } from "@/hooks/use-controllers"
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import * as z from "zod";

const profileFormSchema = z.object({
  firstName: z.string().min(1, "Prenumele este obligatoriu"),
  lastName: z.string().min(1, "Numele este obligatoriu"),
  educationLevelId: z.number().optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export default function CompleteProfilePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { user, isInitialized, completeProfile } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const { useList: useEducationalLevels } = useEducationLevelsCrud()

  // Initialize form with default values
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      educationLevelId: undefined,
    },
  })

  useEffect(() => {
    setMounted(true)

    // Check authentication status, but only after auth is initialized
    const checkAuth = async () => {
      // Wait for auth to initialize
      if (!isInitialized) return;

      // If we have a user in the auth context, we're good
      if (user) return;

      // Otherwise, check the session directly
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.push("/sign-in")
      }
    }

    checkAuth()
  }, [isInitialized, user])

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true)

    try {
      // Debug log
      // console.log("Submitting profile with:", data);

      const success = await completeProfile({
        first_name: data.firstName,
        last_name: data.lastName,
        education_level_id: data.educationLevelId,
      })

      if (success) {
        toast({
          title: "Succes",
          description: "Profilul tău a fost actualizat cu succes.",
        })

        // Redirect to dashboard
        router.push("/dashboard")
      }
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "A apărut o eroare la actualizarea profilului.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Don't render anything until mounted
  if (!mounted) {
    return null
  }


  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center text-gray-900"><span>Completează profilul</span></CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="mb-6 text-center">
              <p className="mt-2 text-sm text-gray-600">
                Înainte de a continua, te rugăm să completezi informațiile de profil.
              </p>
            </div>

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Nume</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Numele tău"
                      {...field}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Prenume</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Prenumele tău"
                      {...field}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="educationLevelId"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Nivel de educație</FormLabel>
                  <FormControl>
                    <SearchableDropdown
                      useQueryHook={useEducationalLevels}
                      value={field.value}
                      onChange={field.onChange}
                      searchColumns={["name"]}
                      valueField={"id"}
                      labelField={"name"}
                      placeholder="Selectează nivelul de educație"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
              {isSubmitting ? "Se procesează..." : "Salvează și continuă"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
