"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSearchParams, useRouter } from "next/navigation"
import { Suspense } from 'react'

// Loading fallback
function ForbiddenFallback() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="h-8 w-3/4 mx-auto bg-gray-200 animate-pulse rounded"></div>
      </CardHeader>
      <CardContent>
        <div className="h-20 w-full bg-gray-200 animate-pulse rounded mb-6"></div>
        <div className="h-6 w-1/3 mx-auto bg-gray-200 animate-pulse rounded"></div>
      </CardContent>
    </Card>
  )
}

// Client component that uses useSearchParams
function ForbiddenContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason')

  // Determine the appropriate message based on the reason
  let title = "Acces Interzis"
  let message = "Dacă aveți nevoie de acces, vă rugăm să contactați administratorul."

  if (reason === 'not_invited') {
    title = "Cont Neautorizat"
    message = "Trebuie să fiți invitat de către un administrator pentru a accesa această aplicație. Autentificarea cu Google nu este permisă fără o invitație prealabilă."
  } else if (reason === 'inactive') {
    title = "Cont Inactiv"
    message = "Contul dvs. a fost dezactivat. Vă rugăm să contactați administratorul pentru asistență."
  } else if (reason === 'error') {
    title = "Eroare de Autentificare"
    message = "A apărut o eroare în timpul procesului de autentificare. Vă rugăm să încercați din nou sau să contactați administratorul."
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center text-gray-900"><span>{title}</span></CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center text-muted-foreground mb-6">
          {message}
        </p>

        <div className="mt-6 text-center text-sm">
          <Link href="/sign-in" className="text-blue-600 hover:underline">
            Înapoi la autentificare
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

// Main page component with Suspense boundary
export default function ForbiddenPage() {
  return (
    <Suspense fallback={<ForbiddenFallback />}>
      <ForbiddenContent />
    </Suspense>
  )
}
