"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from "react"
import { useSupabaseBrowser } from "@/utils/supabase/client"
import { type User, type Session } from "@supabase/supabase-js"
import { Profile, ProfileInsert, ProfileUpdate, useUsersController, useUsersCrud } from "@/hooks/use-controllers"
import { adminSignUpAction, deleteUserAction, forgotPasswordAction, inviteUserAction } from "./auth-actions"
import { toast } from "@/components/ui/use-toast"
import { Database } from "@/utils/database.types"


type UserStatus = Database["public"]["Enums"]["user_status"]
type UserRole = Database["public"]["Enums"]["user_role"]

type AuthContextType = {
    session: Session | null
    user: User | null
    profile: Profile | null
    isLoading: boolean;
    isInitialized: boolean;
    signUpWithEmail: (email: string, password: string) => Promise<void>;
    forgotPassword: (email: string) => Promise<void>;
    updateUserStatus: (userId: string, status: UserStatus) => Promise<boolean>
    inviteUser: (email: string, role: UserRole) => Promise<boolean>
    removeInvitedUser: (userId: string) => Promise<boolean>
    resendInvitation: (email: string) => Promise<boolean>
    completeProfile: (data: ProfileUpdate) => Promise<boolean>
}


const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {

    const supabase = useSupabaseBrowser();
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isInitialized, setIsInitialized] = useState(false)

    const { useById, useCreate, useUpdate, useDelete } = useUsersCrud()
    const usersController = useUsersController();
    const createUserMutation = useCreate
    const updateUserMutation = useUpdate
    const deleteUserMutation = useDelete

    const { data: profile } = useById(session?.user?.id || "") as { data: Profile | null };

    const [role, setRole ] = useState<UserRole | null>(null)

    const initializeAuth = async () => {
        let _role = null;
        try {
            const { data } = await supabase.auth.getSession()

            let _session = data.session;
            if(_session?.user?.user_metadata){
                const profileResponse = await usersController.getById(_session.user.id);
                _session!.user!.user_metadata['role'] = profileResponse?.role || 'STUDENT'
                _role = profileResponse?.role || 'STUDENT'
            }

            setSession(_session || null)
            setUser(_session?.user || null)
        } catch (error) {
            console.error("Error getting session:", error)
        } finally {
            setIsLoading(false)
            setIsInitialized(true)
        }
        return _role;
    }

    useEffect(() => {
        let sub: any;
        initializeAuth().then((role) => {
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                sub = subscription;

                let _session = session;
                if(_session?.user?.user_metadata){
                    _session!.user!.user_metadata['role'] = role || 'STUDENT'
                }
                setSession(_session || null)
                setUser(_session?.user || null)
            })
        }).catch((err) => {
            console.error(err);
        })
        return () => {
            sub?.unsubscribe()
        }
    }, [])


    const signUpWithEmail = async (email: string, password: string) => {
        const formData = new FormData();
        formData.append("email", email);
        formData.append("password", password);
        await adminSignUpAction(formData);
    }

    const forgotPassword = async (email: string) => {
        const formData = new FormData();
        formData.append("email", email);
        await forgotPasswordAction(formData);
    }

    // Update user status (activate/deactivate)
    const updateUserStatus = async (userId: string, status: UserStatus) => {
        setIsLoading(true)
        try {
            // Update the user status using the CRUD hook
            await updateUserMutation.mutateAsync({
                id: userId,
                record: {
                    status,
                    updated_at: new Date().toISOString()
                }
            })

            const statusText = status === 'ACTIVE' ? 'activat' : status === 'INACTIVE' ? 'dezactivat' : status

            toast({
                title: "Status actualizat",
                description: `Utilizatorul a fost ${statusText} cu succes.`,
            })

            return true
        } catch (error: any) {
            console.error("Status update error:", error)
            toast({
                title: "Eroare",
                description: error.message || "A apărut o eroare la actualizarea statusului.",
                variant: "destructive",
            })
            return false
        } finally {
            setIsLoading(false)
        }
    }

    const inviteUser = async (email: string, role: UserRole) => {
        setIsLoading(true)
        try {
            console.log("Calling server-side inviteUserAction for", email, "with role", role)
            
            // Create a FormData object to pass to the server action
            const formData = new FormData()
            formData.append("email", email)
            formData.append("role", role)
            
            // Call the server-side action
            const result = await inviteUserAction(formData)
            
            if (!result.success) {
                toast({
                    title: "Eroare",
                    description: result.error || "A apărut o eroare la invitarea utilizatorului.",
                    variant: "destructive",
                })
                return false
            }
            
            toast({
                title: "Invitație trimisă",
                description: result.message || "Utilizatorul a fost invitat cu succes.",
            })
            
            return true
        } catch (error: any) {
            console.error("Invite error:", error)
            toast({
                title: "Eroare",
                description: error.message || "A apărut o eroare la invitarea utilizatorului.",
                variant: "destructive",
            })
            return false
        } finally {
            setIsLoading(false)
        }
    }


    // Remove invited user
    const removeInvitedUser = async (userId: string) => {
        setIsLoading(true)
        try {
            // Remove the user from the users table using the CRUD hook
            await deleteUserMutation.mutateAsync(userId)

            // Remove the user from the auth table
            const formData = new FormData();
            formData.append("userId", userId);
            await deleteUserAction(formData);

            toast({
                title: "Utilizator eliminat",
                description: "Utilizatorul a fost eliminat cu succes.",
            })

            return true
        } catch (error: any) {
            console.error("Remove invited user error:", error)
            toast({
                title: "Eroare",
                description: error.message || "A apărut o eroare la eliminarea utilizatorului.",
                variant: "destructive",
            })
            return false
        } finally {
            setIsLoading(false)
        }
    }

    // Resend invitation email
    const resendInvitation = async (email: string) => {
        setIsLoading(true)
        try {
            // Check if user exists and is in INVITED status using the CRUD hook
            const { data: users, error: checkError } = await supabase
                .from('users')
                .select('id, email, role, status')
                .eq('email', email)
                .eq('status', 'INVITED')
                .limit(1)

            if (checkError) throw checkError

            if (!users || users.length === 0) {
                toast({
                    title: "Utilizator negăsit",
                    description: "Nu s-a găsit niciun utilizator invitat cu acest email.",
                    variant: "destructive",
                })
                return false
            }

            const userId = users[0].id

            // Send password reset email to allow user to set their password
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/sign-up/invite?user_id=${userId}`,
            })

            if (error) throw error

            toast({
                title: "Invitație retrimisă",
                description: "Un nou email de invitație a fost trimis utilizatorului.",
            })

            return true
        } catch (error: any) {
            console.error("Resend invitation error:", error)
            toast({
                title: "Eroare",
                description: error.message || "A apărut o eroare la retrimiterea invitației.",
                variant: "destructive",
            })
            return false
        } finally {
            setIsLoading(false)
        }
    }


    const completeProfile = async (data: ProfileUpdate) => {
        setIsLoading(true)
        try {
            if (!user) throw new Error("Utilizatorul nu este autentificat")


            // Update the user profile
            const { error: profileError } = await supabase
                .from('users')
                .update({
                    id: user.id,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    education_level_id: data.education_level_id,
                    status: 'ACTIVE',
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)

            if (profileError) throw profileError

            toast({
                title: "Profil completat",
                description: "Profilul tău a fost actualizat cu succes.",
            })

            return true
        } catch (error: any) {
            toast({
                title: "Eroare",
                description: error.message || "A apărut o eroare la actualizarea profilului.",
                variant: "destructive",
            })
            return false
        } finally {
            setIsLoading(false)
        }
    }



    const value = {
        session,
        user,
        profile,
        isLoading,
        isInitialized,
        inviteUser,
        signUpWithEmail,
        forgotPassword,
        updateUserStatus,
        removeInvitedUser,
        resendInvitation,
        completeProfile
    }


    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
};




export function useAuth() {
    const context = useContext(AuthContext)
    if (context === null) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}

// RBAC utility functions
export function isOwner(user: User | null, resource: any) {
    if (!user) return false
    return user.id === resource?.user_id
}

export function isAdmin(user: User | null) {
    if (!user) return false
    return user.user_metadata.role === "ADMINISTRATOR"
}

export function isFormator(user: User | null) {
    if (!user) return false
    return user.user_metadata.role === "FORMATOR"
}

export function isModerator(user: User | null) {
    if (!user) return false
    return user.user_metadata.role === "MODERATOR"
}

export function isEvaluator(user: User | null) {
    if (!user) return false
    return user.user_metadata.role === "EVALUATOR"
}

export function isStudent(user: User | null) {
    if (!user) return false
    return user.user_metadata.role === "STUDENT"
}
