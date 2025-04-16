"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function Home() {
  const { user, isInitialized } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect based on authentication status
  useEffect(() => {
    if (mounted && isInitialized) {
      if (user) {
        // If authenticated, redirect to dashboard
        router.push("/dashboard")
      } else {
        // If not authenticated, redirect to sign-in
        router.push("/sign-in")
      }
    }
  }, [user, isInitialized, mounted, router])

  // Don't render anything during redirect
  return null
}
