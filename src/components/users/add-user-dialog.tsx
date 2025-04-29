"use client"

import { useState } from "react"
import { X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Role {
  id: string
  name: string
  color: string
}

interface AddUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddUser: (email: string, roles: string[]) => void
}

export function AddUserDialog({ open, onOpenChange, onAddUser }: AddUserDialogProps) {
  const [email, setEmail] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false)

  // Available roles with their display colors
  const roles: Role[] = [
    { id: "STUDENT", name: "Cursant", color: "bg-blue-100 text-blue-800" },
    { id: "FORMATOR", name: "Formator", color: "bg-green-100 text-green-800" },
    { id: "EVALUATOR", name: "Evaluator", color: "bg-purple-100 text-purple-800" },
    { id: "MODERATOR", name: "Moderator", color: "bg-blue-100 text-blue-800" },
    { id: "ADMINISTRATOR", name: "Admin", color: "bg-yellow-100 text-yellow-800" },
  ]

  const handleSubmit = () => {
    if (email && selectedRole) {
      onAddUser(email, [selectedRole])
      resetForm()
    }
  }

  const resetForm = () => {
    setEmail("")
    setSelectedRole("")
    setIsRoleDropdownOpen(false)
  }

  const selectRole = (roleId: string) => {
    setSelectedRole(roleId)
    setIsRoleDropdownOpen(false)
  }

  // Get the display name of the selected role for the trigger button
  const getSelectedRoleDisplay = () => {
    if (!selectedRole) return ""
    
    const role = roles.find(r => r.id === selectedRole)
    return role?.name || ""
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white rounded-md rounded-lg">
        <DialogHeader>
          <DialogTitle>Adaugă utilizator</DialogTitle>
          <DialogDescription className="bg-white p-2 rounded-md">
            Invită un utilizator în platformă introducând adresa sa de email și rolul pe care îl va
            avea în aplicație. Noi îi vom trimite un mesaj de invitație.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Email input */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Introdu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Role selector */}
          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium">Selectează rol</label>
            <div className="relative">
              {/* Role trigger button */}
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              >
                <div className="flex items-center gap-2">
                  {selectedRole ? (
                    <span className={`px-2 py-0.5 rounded-md text-xs ${roles.find(r => r.id === selectedRole)?.color || 'bg-gray-100'}`}>
                      {getSelectedRoleDisplay()}
                    </span>
                  ) : (
                    <span className="text-gray-500">Selectează rol</span>
                  )}
                </div>
                <svg
                  className={`h-5 w-5 text-gray-400 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {/* Role dropdown */}
              {isRoleDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg">
                  <div className="p-2 text-xs text-gray-500">
                    Selectează un rol
                  </div>
                  <div className="p-2 space-y-1">
                    {roles.map((role) => (
                      <div
                        key={role.id}
                        className="flex items-center gap-2 rounded-md p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => selectRole(role.id)}
                      >
                        <div className="flex h-4 w-4 items-center justify-center rounded border border-gray-300 bg-white">
                          {selectedRole === role.id && (
                            <Check className="h-3 w-3 text-blue-500" />
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-xs ${role.color}`}>
                          {role.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForm()
              onOpenChange(false)
            }}
          >
            Renunță
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!email || !selectedRole}
          >
            Adaugă utilizator
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
