"use client"

import type React from "react"

import { useState } from "react"
import { UserCircle, Lock, Bell, Settings } from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/auth-context"

export default function SettingsPage() {

  const { user } = useAuth()
  const [activeSection, setActiveSection] = useState<string>("date-personale")
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "Liliana",
    lastName: user?.lastName || "Rotaru",
    email: user?.email || "lilianarotaru@gmail.com",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [notificationSettings, setNotificationSettings] = useState({
    resourceEvaluated: true,
    platformNews: true,
    updates: true,
    vacationMode: false,
  })

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSavePersonalData = (e: React.FormEvent) => {
    e.preventDefault()
    // Save personal data logic
    console.log("Saving personal data:", formData)
  }

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault()
    // Save password logic
    console.log("Saving password:", {
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    })
  }

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault()
    // Save notification settings
    console.log("Saving notification settings:", notificationSettings)
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
              <button
                className={`flex items-center gap-2 p-4 text-left hover:bg-gray-50 ${
                  activeSection === "notificari" ? "bg-blue-50 border-l-4 border-blue-500" : ""
                }`}
                onClick={() => setActiveSection("notificari")}
              >
                <Bell size={18} />
                <span>Notificări</span>
              </button>
              <button
                className={`flex items-center gap-2 p-4 text-left hover:bg-gray-50 ${
                  activeSection === "alte-optiuni" ? "bg-blue-50 border-l-4 border-blue-500" : ""
                }`}
                onClick={() => setActiveSection("alte-optiuni")}
              >
                <Settings size={18} />
                <span>Alte opțiuni</span>
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
                <p className="text-gray-600 mb-6">Actualizează-ți numele și fotografia de profil.</p>

                <div className="flex flex-col items-center mb-6">
                  <Avatar
                    size="96"
                    className="bg-blue-500 text-white text-2xl mb-4"
                    initials={`${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`}
                  />
                  <Button variant="outline" className="bg-blue-500 text-white hover:bg-blue-600">
                    Alege o fotografie
                  </Button>
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
                        onChange={handleInputChange}
                        className="w-full"
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

            {/* Notifications Section */}
            {activeSection === "notificari" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Notificări</h2>

                <form onSubmit={handleSaveNotifications}>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <Checkbox
                          id="resourceEvaluated"
                          checked={notificationSettings.resourceEvaluated}
                          onCheckedChange={(checked) =>
                            setNotificationSettings((prev) => ({ ...prev, resourceEvaluated: checked as boolean }))
                          }
                          className="mt-1"
                        />
                        <label htmlFor="resourceEvaluated" className="ml-2 block text-sm">
                          Primesc notificări când o resursă este evaluată
                        </label>
                      </div>

                      <div className="flex items-start">
                        <Checkbox
                          id="platformNews"
                          checked={notificationSettings.platformNews}
                          onCheckedChange={(checked) =>
                            setNotificationSettings((prev) => ({ ...prev, platformNews: checked as boolean }))
                          }
                          className="mt-1"
                        />
                        <label htmlFor="platformNews" className="ml-2 block text-sm">
                          Vreau să fiu la curent cu noutățile platformei
                        </label>
                      </div>

                      <div className="flex items-start">
                        <Checkbox
                          id="updates"
                          checked={notificationSettings.updates}
                          onCheckedChange={(checked) =>
                            setNotificationSettings((prev) => ({ ...prev, updates: checked as boolean }))
                          }
                          className="mt-1"
                        />
                        <label htmlFor="updates" className="ml-2 block text-sm">
                          Anunță-mă despre actualizări sau mentenanță
                        </label>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">Mod vacanță</h3>
                          <p className="text-sm text-gray-500">Suspendă notificările temporar până la reactivare.</p>
                        </div>
                        <Switch
                          checked={notificationSettings.vacationMode}
                          onCheckedChange={(checked) =>
                            setNotificationSettings((prev) => ({ ...prev, vacationMode: checked }))
                          }
                        />
                      </div>
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

            {/* Other Options Section */}
            {activeSection === "alte-optiuni" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Alte opțiuni</h2>

                <div className="space-y-6">
                  {/* Two-Factor Authentication */}
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">Verificare în 2 pași</h3>
                        <p className="text-sm text-gray-500">Confirmați noile autentificări cu un cod de 4 cifre</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setActiveSection("verificare-doi-pasi")}>
                        <span className="sr-only">Configurare</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </Button>
                    </div>
                  </div>

                  {/* Account Activity */}
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">Activitatea contului</h3>
                        <p className="text-sm text-gray-500">Gestionează dispozitivele tale conectate</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <span className="sr-only">Configurare</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </Button>
                    </div>
                  </div>

                  {/* Delete Account */}
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">Șterge contul</h3>
                      </div>
                      <Button variant="outline" size="sm">
                        <span className="sr-only">Configurare</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Two-Factor Authentication Details */}
            {activeSection === "verificare-doi-pasi" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Verificare în 2 pași</h2>
                <p className="text-gray-600 mb-6">
                  Îți vom trimite un cod SMS de 4 cifre atunci când se va încerca logarea în contul tău.
                </p>

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">+470 (***) ***29</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3 w-3 mr-1"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      Verificat
                    </span>
                  </div>
                  <Button variant="outline" size="sm">
                    Schimbă
                  </Button>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <h3 className="font-medium">Activează verificarea în 2 pași</h3>
                  </div>
                  <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
                </div>

                <div className="flex justify-end mt-6">
                  <Button variant="outline" className="mr-2" onClick={() => setActiveSection("alte-optiuni")}>
                    Înapoi
                  </Button>
                  <Button className="bg-blue-500 text-white hover:bg-blue-600">Salvează</Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
