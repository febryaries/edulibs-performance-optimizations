"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import useMenu from "@/hooks/use-menu"

// Define protected routes using RegExp
const protectedRoutes: RegExp[] = [
  /^\/dashboard(\/.*)?$/,        // /dashboard and everything under it
  /^\/update-password$/,         // exactly /update-password
  /^\/complete-profile$/,        // exactly /complete-profile
]

// Define where to send users
const signInPath = "/sign-in"
const defaultAuthenticatedPath = "/dashboard"

export function AuthRedirectGuard() {

  const { allowedMenuKeys } = useMenu();

  const { session, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const isProtectedRoute = (path: string) => {
    return protectedRoutes.some((regex) => regex.test(path))
  }

  useEffect(() => {
    if (isLoading) return // Wait until auth status is loaded

    const currentlyProtected = isProtectedRoute(pathname)

    console.log('[LOG] session:', session)
    console.log('[LOG] currentlyProtected:', currentlyProtected, window.location.pathname)

    if (!session && currentlyProtected) {
      // Not logged in and trying to access protected route
      console.log('[LOG] Redirecting to sign-in')
      router.replace(signInPath)
    }

    if (session && !currentlyProtected) {
      // Logged in and on a non-protected route (e.g., /sign-in), redirect to dashboard
      console.log("[LOG] Redirecting to dashboard")
      router.replace(defaultAuthenticatedPath)
    }

    if (session && !allowedMenuKeys.includes(pathname)) {
      // Logged in and on a non-allowed route, redirect to dashboard
      console.log("[LOG] Redirecting to dashboard")
      router.replace(defaultAuthenticatedPath)
    }
    
  }, [session, isLoading, pathname, router])

  return null
}
