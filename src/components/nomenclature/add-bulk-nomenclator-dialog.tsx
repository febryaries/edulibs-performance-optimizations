"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import BulkUpload, { ColumnConfig } from "../ui/bulk-upload"

interface AddBulkNomenclatorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddItems: (items: any[]) => Promise<void>
  title: string
  description: string
  columns: ColumnConfig[]
}

export function AddBulkNomenclatorDialog({ 
  open, 
  onOpenChange, 
  onAddItems,
  title,
  description,
  columns
}: AddBulkNomenclatorDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async(data: any[]) => {
    try {
      setIsLoading(true)
      await onAddItems(data)
    } catch (error) {
      console.error("Error adding items:", error)
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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="bg-white p-2 rounded-md">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden" style={{ height: "80vh" }}>
          <BulkUpload
            columns={columns}
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
