"use client"

import type React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { useAuth, type UserRole, type EducationLevel } from "@/lib/auth-context";

export default function RegisterPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { currentStep, setCurrentStep, registrationData, updateRegistrationData, register, loginWithGoogle, isLoading } = useAuth()

  const handleRoleSelect = (role: UserRole) => {
    updateRegistrationData({ role })
  }

  const handleEducationLevelSelect = (id: number) => {
    updateRegistrationData({ educationLevelId: id })
  }

  const handleNextStep = () => {
    // Validate current step
    if (currentStep === 1 && !registrationData.role) {
      toast({
        title: "Eroare",
        description: "Te rugăm să selectezi un rol",
        variant: "destructive",
      })
      return
    }

    if (currentStep === 2) {
      if (registrationData.role === "STUDENT" && !registrationData.educationLevelId) {
        toast({
          title: "Eroare",
          description: "Te rugăm să selectezi nivelul de învățământ",
          variant: "destructive",
        })
        return
      }
    }

    setCurrentStep(currentStep + 1)
  }

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (
      !registrationData.firstName ||
      !registrationData.lastName ||
      !registrationData.email ||
      !registrationData.password
    ) {
      toast({
        title: "Eroare",
        description: "Te rugăm să completezi toate câmpurile obligatorii",
        variant: "destructive",
      })
      return
    }

    try {
      await register()
      router.push("/auth/verify-email")
    } catch (error) {
      // Error is handled in the register function
    }
  }

  const handleGoogleSignUp = async () => {
    try {
      await loginWithGoogle()
      // Redirect is handled by Supabase OAuth flow
    } catch (error) {
      // Error is handled in the loginWithGoogle function
    }
  }

  return (
    <div className="w-full max-w-md">

      <div className="bg-white p-8 rounded-lg shadow-sm">
        {currentStep === 1 && (
          <>
            <h2 className="text-xl font-semibold text-center mb-2">Creează cont nou</h2>
            <p className="text-center text-gray-600 mb-6">
              Cum vei folosi aplicația? Alege rolul sau rolurile care ți se potrivesc.
            </p>

            <div className="mb-4 text-center text-sm text-gray-500">{currentStep}/3</div>

            <div className="w-full bg-gray-200 h-2 rounded-full mb-6">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(currentStep / 3) * 100}%` }}></div>
            </div>

            <div className="space-y-3 mb-6">
              <div
                className={`border rounded-lg p-4 cursor-pointer ${
                  registrationData.role === "STUDENT"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-200"
                }`}
                onClick={() => handleRoleSelect("STUDENT")}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Checkbox
                      checked={registrationData.role === "STUDENT"}
                      onCheckedChange={() => handleRoleSelect("STUDENT")}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium">Student</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Acest rol îți oferă acces la cursuri, resurse și sprijin din partea mentorilor.
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`border rounded-lg p-4 cursor-pointer ${
                  registrationData.role === "EVALUATOR"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-200"
                }`}
                onClick={() => handleRoleSelect("EVALUATOR")}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Checkbox
                      checked={registrationData.role === "EVALUATOR"}
                      onCheckedChange={() => handleRoleSelect("EVALUATOR")}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium">Evaluator</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      În rolul de evaluator, vei oferi feedback constructiv și vei contribui la creșterea calității
                      proiectelor.
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`border rounded-lg p-4 cursor-pointer ${
                  registrationData.role === "FORMATOR"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-200"
                }`}
                onClick={() => handleRoleSelect("FORMATOR")}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Checkbox
                      checked={registrationData.role === "FORMATOR"}
                      onCheckedChange={() => handleRoleSelect("FORMATOR")}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium">Formator</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Ca formator, vei ajuta studenții să înțeleagă conceptele și să își atingă obiectivele.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Button className="w-full" onClick={handleNextStep}>
              Pasul următor
            </Button>
          </>
        )}

        {currentStep === 2 && (
          <>
            <h2 className="text-xl font-semibold text-center mb-2">
              {registrationData.role === "STUDENT"
                ? "Selectează clasa"
                : registrationData.role === "FORMATOR"
                  ? "Selectează nivelul de predare"
                  : "Selectează domeniul de expertiză"}
            </h2>
            <p className="text-center text-gray-600 mb-6">
              {registrationData.role === "STUDENT"
                ? "Selectează clasa sau clasele la care ești înscris"
                : registrationData.role === "FORMATOR"
                  ? "Selectează clasa sau clasele la care predai"
                  : "Selectează domeniul în care ai expertiză"}
            </p>

            <div className="mb-4 text-center text-sm text-gray-500">{currentStep}/3</div>

            <div className="w-full bg-gray-200 h-2 rounded-full mb-6">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(currentStep / 3) * 100}%` }}></div>
            </div>

            <div className="space-y-3 mb-6">
              <div
                className={`border rounded-lg p-4 cursor-pointer ${
                  registrationData.educationLevelId === 1
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-200"
                }`}
                onClick={() => handleEducationLevelSelect(1)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Checkbox
                      checked={registrationData.educationLevelId === 1}
                      onCheckedChange={() => handleEducationLevelSelect(1)}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium">Învățământ primar</h3>
                  </div>
                </div>
              </div>

              <div
                className={`border rounded-lg p-4 cursor-pointer ${
                  registrationData.educationLevelId === 2
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-200"
                }`}
                onClick={() => handleEducationLevelSelect(2)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Checkbox
                      checked={registrationData.educationLevelId === 2}
                      onCheckedChange={() => handleEducationLevelSelect(2)}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium">Învățământ gimnazial</h3>
                  </div>
                </div>
              </div>

              <div
                className={`border rounded-lg p-4 cursor-pointer ${
                  registrationData.educationLevelId === 5
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-200"
                }`}
                onClick={() => handleEducationLevelSelect(5)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Checkbox
                      checked={registrationData.educationLevelId === 5}
                      onCheckedChange={() => handleEducationLevelSelect(5)}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium">Învățământ preșcolar</h3>
                  </div>
                </div>
              </div>

              <div
                className={`border rounded-lg p-4 cursor-pointer ${
                  registrationData.educationLevelId === 6
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-200"
                }`}
                onClick={() => handleEducationLevelSelect(6)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Checkbox
                      checked={registrationData.educationLevelId === 6}
                      onCheckedChange={() => handleEducationLevelSelect(6)}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium">Învățământ liceal</h3>
                  </div>
                </div>
              </div>

              <div
                className={`border rounded-lg p-4 cursor-pointer ${
                  registrationData.educationLevelId === 7
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-200"
                }`}
                onClick={() => handleEducationLevelSelect(7)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Checkbox
                      checked={registrationData.educationLevelId === 7}
                      onCheckedChange={() => handleEducationLevelSelect(7)}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium">Învățământ postliceal</h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handlePreviousStep}>
                Înapoi
              </Button>
              <Button className="flex-1" onClick={handleNextStep}>
                Pasul următor
              </Button>
            </div>
          </>
        )}

        {currentStep === 3 && (
          <>
            <h2 className="text-xl font-semibold text-center mb-2">Creează cont nou</h2>
            <p className="text-center text-gray-600 mb-6">Introdu detaliile contului</p>

            <div className="mb-4 text-center text-sm text-gray-500">{currentStep}/3</div>

            <div className="w-full bg-gray-200 h-2 rounded-full mb-6">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(currentStep / 3) * 100}%` }}></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="lastName" className="block text-sm font-medium">
                    Nume
                  </label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Introdu numele"
                    value={registrationData.lastName ?? ""}
                    onChange={(e) => updateRegistrationData({ lastName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="firstName" className="block text-sm font-medium">
                    Prenume
                  </label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Introdu prenumele"
                    value={registrationData.firstName ?? ""}
                    onChange={(e) => updateRegistrationData({ firstName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Introdu adresa de email"
                  value={registrationData.email ?? ""}
                  onChange={(e) => updateRegistrationData({ email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium">
                  Parola
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Introdu parola"
                  value={registrationData.password ?? ""}
                  onChange={(e) => updateRegistrationData({ password: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Se procesează..." : "Creează cont"}
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

              <div className="mt-6 grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                  onClick={handleGoogleSignUp}
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
                  Google
                </Button>
              </div>
            </div>
          </>
        )}

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">Ai deja cont?</span>{" "}
          <Link href="/sign-in" className="text-blue-600 hover:underline">
            Autentifică-te aici
          </Link>
        </div>
      </div>
    </div>
  )
}
