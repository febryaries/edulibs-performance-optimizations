"use client"

import { useState, useEffect } from "react"
import { useClassesController, useEducationLevelsCrud, ClassInsert } from "@/hooks/use-controllers"
import { AddBulkNomenclatorDialog } from "./add-bulk-nomenclator-dialog";
import { SelectOption } from "../ui/bulk-upload"

interface AddBulkClassDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddBulkClassDialog({ open, onOpenChange }: AddBulkClassDialogProps) {
  const controller = useClassesController()
  const { useList: useLevels } = useEducationLevelsCrud()
  const { data: levels } = useLevels()
  const [levelOptions, setLevelOptions] = useState<SelectOption[]>([])
  
  useEffect(() => {
    if (levels?.data) {
      const options: SelectOption[] = levels.data
        .filter(level => level !== null)
        .map((level) => ({
          value: String(level.id),
          label: level.name
        }))
      setLevelOptions(options)
    }
  }, [levels])

  const handleAddClasses = async (classes: any[]) => {
    // Process each class and create it
    const promises = classes.map(classItem => 
      controller.create({
        name: classItem.name,
        level_id: Number(classItem.level_id),
        description: classItem.description || null,
        number: 0 // Required field in the ClassInsert type
      } as ClassInsert)
    )
    
    await Promise.all(promises)
  }

  return (
    <AddBulkNomenclatorDialog
      open={open}
      onOpenChange={onOpenChange}
      onAddItems={handleAddClasses}
      title="Adaugă clase în platformă"
      description="Adaugă mai multe clase în platformă prin încărcarea unui fișier CSV sau prin introducerea manuală a datelor."
      columns={[
        { id: "name", name: "Nume", type: "string", required: true },
        { id: "level_id", name: "Nivel educațional", type: "select", required: true, options: levelOptions },
        { id: "description", name: "Descriere", type: "string", required: false }
      ]}
    />
  )
}
