"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/utils/supabase/client"
import { useAuth } from "@/app/(auth-pages)/auth-context"

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const { user, isInitialized } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect if already authenticated and not in password reset flow
  useEffect(() => {
    if (mounted && isInitialized) {
      // Check if we're in a password reset flow by looking for the recovery token in the URL
      const hasRecoveryToken = window.location.hash.includes('type=recovery')
      
      if (user && !hasRecoveryToken) {
        // If user is authenticated and not in recovery flow, redirect to dashboard
        router.push("/dashboard")
      }
    }
  }, [user, isInitialized, mounted, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password || !confirmPassword) {
      toast({
        title: "Eroare",
        description: "Te rugăm să completezi ambele câmpuri.",
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Eroare",
        description: "Parolele nu coincid.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) throw error

      toast({
        title: "Succes",
        description: "Parola a fost actualizată cu succes.",
      })

      // Redirect to login page after successful password update
      router.push("/sign-in")
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "A apărut o eroare la actualizarea parolei.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render anything until mounted and initialized
  if (!mounted || !isInitialized) {
    return null
  }

  // If authenticated and not in recovery flow, the useEffect will handle the redirect
  const hasRecoveryToken = typeof window !== 'undefined' && window.location.hash.includes('type=recovery')
  if (user && !hasRecoveryToken) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-600">EDU APPS</h1>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-center mb-6">Actualizează parola</h2>
          <p className="text-sm text-gray-600 mb-6">
            Introdu noua parolă pentru contul tău.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium">
                Parolă nouă
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Introdu parola nouă"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium">
                Confirmă parola
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirmă parola nouă"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Se procesează..." : "Actualizează parola"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
