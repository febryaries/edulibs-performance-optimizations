"use client"

import { useCurricularAreasController, CurricularAreaInsert } from "@/hooks/use-controllers"
import { AddBulkNomenclatorDialog } from "./add-bulk-nomenclator-dialog"

interface AddBulkCurricularAreaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddBulkCurricularAreaDialog({ open, onOpenChange }: AddBulkCurricularAreaDialogProps) {
  const controller = useCurricularAreasController()

  const handleAddCurricularAreas = async (areas: any[]) => {
    // Process each curricular area and create it
    const promises = areas.map(area => 
      controller.create({
        name: area.name,
        description: area.description || null
      } as CurricularAreaInsert)
    )
    
    await Promise.all(promises)
  }

  return (
    <AddBulkNomenclatorDialog
      open={open}
      onOpenChange={onOpenChange}
      onAddItems={handleAddCurricularAreas}
      title="Adaugă arii curriculare în platformă"
      description="Adaugă mai multe arii curriculare în platformă prin încărcarea unui fișier CSV sau prin introducerea manuală a datelor."
      columns={[
        { id: "name", name: "Nume", type: "string", required: true },
        { id: "description", name: "Descriere", type: "string", required: false }
      ]}
    />
  )
}
