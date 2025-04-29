"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/utils/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"


export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()


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
      router.push("/dashboard")
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: "Eroare",
          description: error.message || "A apărut o eroare la actualizarea parolei.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Eroare",
          description: "A apărut o eroare la actualizarea parolei.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center text-gray-900"><span>Actualizează parola</span></CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  )
}
