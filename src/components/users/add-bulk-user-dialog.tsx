"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import BulkUpload from "@/components/ui/bulk-upload";

interface Role {
  id: string
  name: string
  color: string
}

interface AddBulkUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddUsers: (users: any[]) => Promise<void>
}

export function AddBulkUserDialog({ open, onOpenChange, onAddUsers }: AddBulkUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Available roles with their display colors
  const roles: Role[] = [
    { id: "STUDENT", name: "Cursant", color: "bg-blue-100 text-blue-800" },
    { id: "FORMATOR", name: "Formator", color: "bg-green-100 text-green-800" },
    { id: "EVALUATOR", name: "Evaluator", color: "bg-purple-100 text-purple-800" },
    { id: "MODERATOR", name: "Moderator", color: "bg-blue-100 text-blue-800" },
    { id: "ADMINISTRATOR", name: "Admin", color: "bg-yellow-100 text-yellow-800" },
  ]

  const handleSubmit = async(data: any[]) => {
    try {
      setIsLoading(true)
      await onAddUsers(data)
    } catch (error) {
      console.error("Error adding users:", error)
    } finally {
      setIsLoading(false)
      onOpenChange(false)
    }
  }

  // Custom onOpenChange handler to prevent closing while loading
  const handleOpenChange = (open: boolean) => {
    if (!isLoading) {
      onOpenChange(open)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-5xl w-[90vw] bg-white rounded-md rounded-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Adaugă utilizatori în platformă</DialogTitle>
          <DialogDescription className="bg-white p-2 rounded-md">
            Invită utilizatori în platformă introducând adresa sa de email și rolul pe care îl vor
            avea în aplicație. Noi le vom trimite un mesaj de invitație.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden" style={{ height: "80vh" }}>
          <BulkUpload
            columns={[
              { id: "email", name: "Email", type: "email", required: true },
              { id: "role", name: "Rol", type: "select", required: true, options: roles.map(r => ({ value: r.id, label: r.name })) },
            ]}
            onSubmit={handleSubmit}
            onCancel={() => {
              if (!isLoading) {
                onOpenChange(false)
              }
            }}
            isLoading={isLoading}
          />
        </div>

      </DialogContent>
    </Dialog>
  )
}
