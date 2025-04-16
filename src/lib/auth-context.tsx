"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { type User, type Session } from "@supabase/supabase-js"

export type UserRole = "ADMINISTRATOR" | "MODERATOR" | "FORMATOR" | "EVALUATOR" | "STUDENT"
export type EducationLevel = "primar" | "gimnazial" | "liceal"

type RegistrationData = {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  role?: UserRole
  educationLevelId?: number
}

type AuthContextType = {
  user: User | null
  isInitialized: boolean
  isLoading: boolean
  currentStep: number
  setCurrentStep: (step: number) => void
  registrationData: RegistrationData
  updateRegistrationData: (data: Partial<RegistrationData>) => void
  register: () => Promise<{ user: User | null; session: Session | null } | undefined>
  login: (email: string, password: string) => Promise<{ user: User | null; session: Session | null } | undefined>
  loginWithGoogle: () => Promise<{ provider: string; url: string } | undefined>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<boolean | undefined>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: undefined,
    educationLevelId: undefined
  })
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // Update registration data
  const updateRegistrationData = (data: Partial<RegistrationData>) => {
    setRegistrationData((prev) => ({ ...prev, ...data }))
  }

  // Register a new user
  const register = async () => {
    setIsLoading(true)
    try {
      // 0. Check if this is the first user
      let isFirstUser = false;
      const { count, error: countError } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true });
      if (countError) throw countError;
      if ((count ?? 0) === 0) {
        isFirstUser = true;
      }

      // 1. Register the user with Supabase Auth FIRST
      const roleToSet = isFirstUser ? "ADMINISTRATOR" : registrationData.role;
      const { data, error } = await supabase.auth.signUp({
        email: registrationData.email!,
        password: registrationData.password!,
        options: {
          data: {
            first_name: registrationData.firstName,
            last_name: registrationData.lastName,
            role: roleToSet,
            education_level_id: registrationData.educationLevelId,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect_to=/dashboard`,
        },
      })

      if (error) throw error

      // 2. Insert the user in the users table with the correct UUID
      const userId = data.user?.id
      if (userId) {
        const { error: userInsertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: registrationData.email,
            first_name: registrationData.firstName,
            last_name: registrationData.lastName,
            role: roleToSet,
            education_level_id: registrationData.educationLevelId,
            username: registrationData.email,
          })

        if (userInsertError) throw userInsertError
      }

      toast({
        title: "Cont creat cu succes",
        description: "Verifică-ți email-ul pentru a confirma contul.",
      })

      return data
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "A apărut o eroare la crearea contului.",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Login with email and password
  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      setUser(data.user)
      return data
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: "Autentificare eșuată. Verifică datele și încearcă din nou.",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect_to=/dashboard`,
        },
      })

      if (error) throw error

      return data
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "A apărut o eroare la autentificare cu Google.",
        variant: "destructive",
      })
      throw error
    }
  }

  // Logout
  const logout = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      router.push("/sign-in")
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "A apărut o eroare la deconectare.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Reset password
  const resetPassword = async (email: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?redirect_to=/auth/forgot-password`,
      })

      if (error) throw error

      return true
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "A apărut o eroare la resetarea parolei.",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        setUser(data.session?.user || null)
      } catch (error) {
        console.error("Error checking auth session:", error)
      } finally {
        setIsInitialized(true)
      }
    }

    initializeAuth()

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    user,
    isInitialized,
    isLoading,
    currentStep,
    setCurrentStep,
    registrationData,
    updateRegistrationData,
    register,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
