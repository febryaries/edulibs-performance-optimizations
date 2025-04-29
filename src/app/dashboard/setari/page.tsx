"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { UserCircle, Lock } from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { useUsersCrud, useEducationLevelsCrud } from "@/hooks/use-controllers"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/utils/supabase/client"
import { SearchableDropdown } from "@/components/ui/searchable-dropdown"

export default function SettingsPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const { useById, useUpdate } = useUsersCrud()
  // Get user data from the database
  const { data: userData } = useById(user?.id || '')
  const { useList: useEducationalLevels } = useEducationLevelsCrud()
  
  const [activeSection, setActiveSection] = useState<string>("date-personale")
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    educationLevelId: number | undefined;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }>({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    educationLevelId: undefined,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Update form data when userData changes
  useEffect(() => {
    if (userData) {
      setFormData(prev => ({
        ...prev,
        firstName: userData.first_name || "",
        lastName: userData.last_name || "",
        email: user?.email || "",
        educationLevelId: userData.education_level_id || -1
      }))
    }
  }, [userData, user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSavePersonalData = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Save personal data to the database
      if (user?.id) {
        // 1. Update the Supabase Auth metadata
        const supabase = createClient()
        const { error: authError } = await supabase.auth.updateUser({
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName
          }
        })
        
        if (authError) throw authError
        
        // 2. Update the users table in the database
  
        await useUpdate.mutateAsync({ 
          id: user.id, 
          record: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            education_level_id: formData.educationLevelId
          }
        })
        
        toast({
          title: "Succes",
          description: "Datele personale au fost actualizate cu succes.",
        })
      }
    } catch (error) {
      console.error("Error saving personal data:", error)
      toast({
        title: "Eroare",
        description: "A apărut o eroare la salvarea datelor personale.",
        variant: "destructive",
      })
    }
  }

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate password inputs
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Eroare",
        description: "Parolele nu coincid.",
        variant: "destructive",
      })
      return
    }
    
    if (formData.newPassword.length < 8) {
      toast({
        title: "Eroare",
        description: "Parola trebuie să aibă cel puțin 8 caractere.",
        variant: "destructive",
      })
      return
    }
    
    try {
      // Create Supabase client
      const supabase = createClient()
      
      // First verify the current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: formData.currentPassword,
      })
      
      if (signInError) {
        toast({
          title: "Eroare",
          description: "Parola curentă este incorectă.",
          variant: "destructive",
        })
        return
      }
      
      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword,
      })
      
      if (updateError) throw updateError
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }))
      
      toast({
        title: "Succes",
        description: "Parola a fost schimbată cu succes.",
      })
    } catch (error) {
      console.error("Error changing password:", error)
      toast({
        title: "Eroare",
        description: "A apărut o eroare la schimbarea parolei.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <Card className="p-0 overflow-hidden">
            <div className="p-4 font-medium text-lg border-b">Setări</div>
            <div className="flex flex-col">
              <button
                className={`flex items-center gap-2 p-4 text-left hover:bg-gray-50 ${
                  activeSection === "date-personale" ? "bg-blue-50 border-l-4 border-blue-500" : ""
                }`}
                onClick={() => setActiveSection("date-personale")}
              >
                <UserCircle size={18} />
                <span>Date personale</span>
              </button>
              <button
                className={`flex items-center gap-2 p-4 text-left hover:bg-gray-50 ${
                  activeSection === "schimba-parola" ? "bg-blue-50 border-l-4 border-blue-500" : ""
                }`}
                onClick={() => setActiveSection("schimba-parola")}
              >
                <Lock size={18} />
                <span>Schimbă parola</span>
              </button>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3">
          <Card className="p-6">
            {/* Personal Data Section */}
            {activeSection === "date-personale" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Date personale</h2>
                <p className="text-gray-600 mb-6">Actualizează-ți numele și prenumele.</p>

                <div className="flex flex-col items-center mb-6">
                  <Avatar
                    size="96"
                    className="bg-blue-500 text-white text-2xl mb-4"
                    initials={`${formData.firstName.charAt(0) || ''}${formData.lastName.charAt(0) || ''}`.toUpperCase()}
                  />
                </div>

                <form onSubmit={handleSavePersonalData}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <Input
                        id="email"
                        name="email"
                        value={formData.email}
                        disabled={true}
                        className="w-full bg-gray-100"
                      />
                    </div>
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                        Nume
                      </label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                        Prenume
                      </label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label htmlFor="educationLevel" className="block text-sm font-medium text-gray-700 mb-1">
                        Nivel de educație
                      </label>
                      <SearchableDropdown
                        useQueryHook={useEducationalLevels}
                        value={formData.educationLevelId}
                        onChange={(value) => {
                          // Handle the value correctly based on its type
                          if (typeof value === 'number' || value === null) {
                            setFormData(prev => ({
                              ...prev,
                              educationLevelId: value === null ? undefined : value
                            }));
                          }
                        }}
                        searchColumns={["name"]}
                        valueField="id"
                        labelField="name"
                        placeholder="Selectează nivelul de educație"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" className="bg-blue-500 text-white hover:bg-blue-600">
                        Salvează
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Change Password Section */}
            {activeSection === "schimba-parola" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Schimbă parola</h2>
                <p className="text-gray-600 mb-6">Schimbă parola regulat pentru mai multă siguranță.</p>

                <form onSubmit={handleSavePassword}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Parola curentă
                      </label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        className="w-full"
                        placeholder="Introdu parola curentă"
                      />
                    </div>
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Parola nouă
                      </label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        className="w-full"
                        placeholder="Introdu parola nouă"
                      />
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmă parola nouă
                      </label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full"
                        placeholder="Confirmă parola nouă"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" className="bg-blue-500 text-white hover:bg-blue-600">
                        Salvează
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
