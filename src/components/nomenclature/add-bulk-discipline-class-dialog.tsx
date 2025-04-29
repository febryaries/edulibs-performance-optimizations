"use client"

import { useState, useEffect } from "react"
import { useDisciplineClassCrud, useDisciplinesCrud, useClassesCrud, useCurricularAreasCrud } from "@/hooks/use-controllers"
import { AddBulkNomenclatorDialog } from "./add-bulk-nomenclator-dialog"
import { SelectOption } from "../ui/bulk-upload"

interface AddBulkDisciplineClassDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddBulkDisciplineClassDialog({ open, onOpenChange }: AddBulkDisciplineClassDialogProps) {
  const { create } = useDisciplineClassCrud()
  const { useList: useDisciplines } = useDisciplinesCrud()
  const { useList: useClasses } = useClassesCrud()
  const { useList: useAreas } = useCurricularAreasCrud()
  
  const { data: disciplines } = useDisciplines()
  const { data: classes } = useClasses()
  const { data: areas } = useAreas()
  
  const [disciplineOptions, setDisciplineOptions] = useState<SelectOption[]>([])
  const [classOptions, setClassOptions] = useState<SelectOption[]>([])
  const [areaOptions, setAreaOptions] = useState<SelectOption[]>([])
  
  useEffect(() => {
    if (disciplines) {
      setDisciplineOptions(
        disciplines.map(discipline => ({
          value: discipline.id,
          label: discipline.name
        }))
      )
    }
  }, [disciplines])
  
  useEffect(() => {
    if (classes) {
      setClassOptions(
        classes.map(classItem => ({
          value: classItem.id,
          label: classItem.name
        }))
      )
    }
  }, [classes])
  
  useEffect(() => {
    if (areas) {
      setAreaOptions(
        areas.map(area => ({
          value: area.id,
          label: area.name
        }))
      )
    }
  }, [areas])

  const handleAddDisciplineClasses = async (disciplineClasses: any[]) => {
    // Process each discipline-class relationship and create it
    const promises = disciplineClasses.map(item => 
      create({
        discipline_id: item.discipline_id,
        class_id: item.class_id,
        area_id: item.area_id,
        hours_per_week: item.hours_per_week ? parseInt(item.hours_per_week, 10) : null
      })
    )
    
    await Promise.all(promises)
  }

  return (
    <AddBulkNomenclatorDialog
      open={open}
      onOpenChange={onOpenChange}
      onAddItems={handleAddDisciplineClasses}
      title="Adaugă asocieri disciplină-clasă în platformă"
      description="Adaugă mai multe asocieri între discipline și clase în platformă prin încărcarea unui fișier CSV sau prin introducerea manuală a datelor."
      columns={[
        { id: "discipline_id", name: "Disciplină", type: "select", required: true, options: disciplineOptions },
        { id: "class_id", name: "Clasă", type: "select", required: true, options: classOptions },
        { id: "area_id", name: "Arie curriculară", type: "select", required: true, options: areaOptions },
        { id: "hours_per_week", name: "Ore pe săptămână", type: "number", required: false }
      ]}
    />
  )
}
