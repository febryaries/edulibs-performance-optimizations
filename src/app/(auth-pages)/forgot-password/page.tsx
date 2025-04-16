"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { toast } = useToast()
  const { resetPassword, isLoading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      })
      return
    }

    try {
      await resetPassword(email)
      setIsSubmitted(true)
    } catch (error) {
      // Error is handled in the resetPassword function
    }
  }

  return (
    <div className="w-full max-w-md">

      <div className="bg-white p-8 rounded-lg shadow-sm">
        {!isSubmitted ? (
          <>
            <h2 className="text-xl font-semibold text-center mb-6">Resetează parola</h2>
            <p className="text-sm text-gray-600 mb-6">
              Introdu adresa de email asociată contului tău și îți vom trimite un link pentru resetarea parolei.
            </p>

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
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Se procesează..." : "Trimite link de resetare"}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <svg
              className="mx-auto h-12 w-12 text-green-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Verifică-ți email-ul</h3>
            <p className="text-sm text-gray-600 mb-6">
              Am trimis un link de resetare a parolei la adresa {email}. Verifică-ți inbox-ul și urmează instrucțiunile
              pentru a-ți reseta parola.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => setIsSubmitted(false)}>
              Înapoi la resetare parolă
            </Button>
          </div>
        )}

        <div className="mt-6 text-center text-sm">
          <Link href="/sign-in" className="text-blue-600 hover:underline">
            Înapoi la autentificare
          </Link>
        </div>
      </div>
    </div>
  )
}
