"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function VerifyEmailPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center text-gray-900"><span>Verifică-ți email-ul</span></CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-6">
          Am trimis un link de verificare la adresa ta de email.
          <br />
          Te rugăm să verifici inbox-ul și să urmezi instrucțiunile pentru a-ți confirma contul.
        </p>

        <div className="space-y-4">
          <Button asChild variant="outline" className="w-full">
            <Link href="/sign-in">Înapoi la autentificare</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
