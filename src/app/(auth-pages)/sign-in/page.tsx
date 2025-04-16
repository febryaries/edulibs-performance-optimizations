"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login, loginWithGoogle, user, isInitialized } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect if already logged in
  useEffect(() => {
    if (mounted && isInitialized && user) {
      router.push("/dashboard")
    }
  }, [user, router, mounted, isInitialized])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast({
        title: "Eroare",
        description: "Te rugăm să completezi toate câmpurile.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await login(email, password)
      toast({
        title: "Succes",
        description: "Te-ai conectat cu succes.",
      })
      router.push("/dashboard")
    } catch (error) {
      // Error is handled in the login function
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle()
      // Redirect is handled by Supabase OAuth flow
    } catch (error) {
      // Error is handled in the loginWithGoogle function
    }
  }

  // Don't render anything until mounted
  if (!mounted) {
    return null
  }

  // If already logged in, the useEffect will handle the redirect
  if (user) {
    return null
  }

  return (
    <div className="flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-gray-900">Autentificare</h1>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nume@exemplu.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Parolă</Label>
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
                  Ai uitat parola?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                required
              />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
              {isSubmitting ? "Se procesează..." : "Conectare"}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Sau continuă cu</span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={handleGoogleLogin}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                  <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                    <path
                      fill="#4285F4"
                      d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                    />
                    <path
                      fill="#34A853"
                      d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                    />
                  </g>
                </svg>
                Conectare cu Google
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600">
              Nu ai cont?{" "}
              <Link href="/sign-up" className="font-medium text-blue-600 hover:text-blue-800">
                Înregistrează-te
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
