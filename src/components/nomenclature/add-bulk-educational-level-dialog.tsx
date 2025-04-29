"use client"

import { useEducationLevelsCrud } from "@/hooks/use-controllers"
import { AddBulkNomenclatorDialog } from "./add-bulk-nomenclator-dialog"

interface AddBulkEducationalLevelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddBulkEducationalLevelDialog({ open, onOpenChange }: AddBulkEducationalLevelDialogProps) {
  const { create } = useEducationLevelsCrud()

  const handleAddLevels = async (levels: any[]) => {
    // Process each educational level and create it
    const promises = levels.map(level => 
      create({
        name: level.name,
        description: level.description || null
      })
    )
    
    await Promise.all(promises)
  }

  return (
    <AddBulkNomenclatorDialog
      open={open}
      onOpenChange={onOpenChange}
      onAddItems={handleAddLevels}
      title="Adaugă nivele educaționale în platformă"
      description="Adaugă mai multe nivele educaționale în platformă prin încărcarea unui fișier CSV sau prin introducerea manuală a datelor."
      columns={[
        { id: "name", name: "Nume", type: "string", required: true },
        { id: "description", name: "Descriere", type: "string", required: false }
      ]}
    />
  )
}
