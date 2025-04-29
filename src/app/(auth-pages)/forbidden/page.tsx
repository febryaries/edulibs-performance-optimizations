"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldX } from 'lucide-react'
import { useRouter } from "next/navigation"

export default function ForbiddenPage() {
    const router = useRouter()

    return (

        <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center text-gray-900"><span>Acces Interzis</span></CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-center text-muted-foreground">
                    Dacă aveți nevoie de acces, vă rugăm să <Link href="/contact" className="text-blue-600 hover:underline">contactați</Link> administratorul.
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
