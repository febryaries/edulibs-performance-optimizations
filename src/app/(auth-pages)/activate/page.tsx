"use client"

import { useState, FormEvent, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Alert } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Suspense } from 'react'
import { resendEmailVerificationAction } from "@/lib/auth-actions"
import { useAuth } from "@/lib/auth-context"

// Loading fallback
function ActivateAccountFallback() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-full bg-gray-200 animate-pulse rounded"></div>
      <div className="h-10 w-full bg-gray-200 animate-pulse rounded"></div>
      <div className="h-10 w-full bg-gray-200 animate-pulse rounded"></div>
    </div>
  )
}

// Client component that uses useSearchParams
function ActivateAccountContent() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isEmailReadOnly, setIsEmailReadOnly] = useState(false)
  const { toast } = useToast()
  const searchParams = useSearchParams()

   const { isLoading, forgotPassword } = useAuth()
  
  useEffect(() => {
    // Check for error query parameter
    const error = searchParams.get('error')
    if (error) {
      setErrorMessage(error)
    }

    // Check for email query parameter
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
      setIsEmailReadOnly(true) // Disable the email input when provided in query params
    }
  }, [searchParams])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    if (!email) {
      toast({
        title: "Eroare",
        description: "Te rugăm să introduci adresa de email.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }
    
    try {
      const formData = new FormData();
      formData.append("email", email);
      // await forgotPassword(email)
      await resendEmailVerificationAction(formData);
      setIsSubmitting(false)
    } catch (error) {
      setIsSubmitting(false)
      throw error;
    }
  }

  return (
    <>
      {errorMessage && (
        <Alert 
          variant="destructive" 
          className="mb-4" 
          title="Atenție" 
          description={errorMessage}
          icon={<AlertCircle className="h-4 w-4" />}
        />
      )}
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Introdu email"
              value={email}
              onChange={(e) => !isEmailReadOnly && setEmail(e.target.value)}
              readOnly={isEmailReadOnly}
              disabled={isEmailReadOnly}
              className={isEmailReadOnly ? "bg-gray-100" : ""}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || isLoading}>
            {isSubmitting || isLoading ? "Se procesează..." : "Trimite email de activare"}
          </Button>
        </div>
      </form>
      <div className="mt-6 text-center text-sm">
        <Link href="/sign-in" className="text-blue-600 hover:underline">
          Înapoi la autentificare
        </Link>
      </div>
    </>
  )
}

// Main page component with Suspense boundary
export default function ActivatePage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center text-gray-900">Activare cont</CardTitle>
        <CardDescription className="text-center">
          Contul tău necesită activare. Introdu adresa de email pentru a primi un link de activare.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<ActivateAccountFallback />}>
          <ActivateAccountContent />
        </Suspense>
      </CardContent>
    </Card>
  )
}

