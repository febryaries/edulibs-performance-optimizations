"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import useMenu from "@/hooks/use-menu"

// Define protected routes using RegExp
const protectedRoutes: RegExp[] = [
  /^\/dashboard(\/.*)?$/,        // /dashboard and everything under it
  /^\/terms$/,                 // exactly /terms
  /^\/privacy$/,               // exactly /privacy
  /^\/update-password$/,         // exactly /update-password
  /^\/complete-profile$/,        // exactly /complete-profile
]

// Define where to send users
const signInPath = "/sign-in"
const defaultAuthenticatedPath = "/dashboard"

export function AuthRedirectGuard() {

  const { menuItems } = useMenu();

  const { session, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const isProtectedRoute = (path: string) => {
    return protectedRoutes.some((regex) => regex.test(path))
  }

  useEffect(() => {
    if (isLoading) return // Wait until auth status is loaded

    const currentlyProtected = isProtectedRoute(pathname)

    if (!session && currentlyProtected) {
      // Not logged in and trying to access protected route
      // // // console.log('[LOG] Redirecting to sign-in')
      return router.replace(signInPath)
    }

    if (session && !currentlyProtected) {
      // Logged in and on a non-protected route (e.g., /sign-in), redirect to dashboard
      // // // console.log("[LOG] Redirecting to dashboard")
      return router.replace(defaultAuthenticatedPath)
    }

    // TODO: This needs to be refactored. 
    // if (session && !menuItems.map(item => item.href).includes(pathname)) {
    //   // Logged in and on a non-allowed route, redirect to dashboard
    //   // // console.log("[LOG] filteredMenuItems Redirecting to dashboard", pathname)
    //   return router.replace(defaultAuthenticatedPath)
    // }

  }, [session, isLoading, pathname, router])

  return null
}
