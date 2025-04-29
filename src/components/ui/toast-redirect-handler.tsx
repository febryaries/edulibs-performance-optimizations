"use client"

import { useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useSearchParams, useRouter } from "next/navigation"

export function ToastRedirectHandler() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const successMessage = searchParams.get("success")
    const errorMessage = searchParams.get("error")

    if (successMessage) {
      toast({
        title: "Succes",
        description: decodeURIComponent(successMessage),
      })
      // Clear the query after showing
      router.replace(window.location.pathname)
    }

    if (errorMessage) {
      toast({
        title: "Eroare",
        description: decodeURIComponent(errorMessage),
        variant: "destructive",
      })
      router.replace(window.location.pathname)
    }
  }, [searchParams, toast, router])

  return null
}
