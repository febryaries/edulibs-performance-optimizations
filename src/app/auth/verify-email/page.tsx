"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"


export default function VerifyEmailPage() {
  const { user, isInitialized } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    // Get the email from localStorage if available
    const storedEmail = localStorage.getItem("pendingVerificationEmail")
    if (storedEmail) {
      setEmail(storedEmail)
    }
  }, [])

  // Redirect if already authenticated
  useEffect(() => {
    if (mounted && isInitialized) {
      if (user) {
        // If user is authenticated, redirect to dashboard
        router.push("/dashboard")
      } else if (!email) {
        // If no user and no email to verify, redirect to sign in
        router.push("/sign-in")
      }
    }
  }, [user, isInitialized, mounted, router, email])

  // Don't render anything until mounted and initialized
  if (!mounted || !isInitialized) {
    return null
  }

  // If authenticated, the useEffect will handle the redirect
  if (user) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-600">EDU APPS</h1>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <svg
            className="mx-auto h-12 w-12 text-blue-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <h2 className="text-xl font-semibold mb-2">Verifică-ți email-ul</h2>
          <p className="text-gray-600 mb-6">
            Am trimis un link de verificare la adresa{" "}
            <span className="font-medium">{email || "ta de email"}</span>.
            <br />
            Te rugăm să verifici inbox-ul și să urmezi instrucțiunile pentru a-ți confirma contul.
          </p>

          <div className="space-y-4">
            <Button asChild variant="outline" className="w-full">
              <Link href="/sign-in">Înapoi la autentificare</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
