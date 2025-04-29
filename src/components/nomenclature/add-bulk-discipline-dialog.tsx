"use client"

import { useState, useEffect } from "react"
import { useDisciplinesController, useDomainsCrud, DisciplineInsert } from "@/hooks/use-controllers"
import { AddBulkNomenclatorDialog } from "./add-bulk-nomenclator-dialog"
import { SelectOption } from "../ui/bulk-upload"

interface AddBulkDisciplineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddBulkDisciplineDialog({ open, onOpenChange }: AddBulkDisciplineDialogProps) {
  const controller = useDisciplinesController()
  const { useList: useDomains } = useDomainsCrud()
  const { data: domains } = useDomains()
  const [domainOptions, setDomainOptions] = useState<SelectOption[]>([])
  
  useEffect(() => {
    if (domains?.data) {
      const options: SelectOption[] = domains.data
        .filter(domain => domain !== null)
        .map((domain) => ({
          value: String(domain.id), // Convert to string to satisfy SelectOption type
          label: domain.name
        }))
      setDomainOptions(options)
    }
  }, [domains])

  const handleAddDisciplines = async (disciplines: any[]) => {
    // Process each discipline and create it
    const promises = disciplines.map(discipline => 
      controller.create({
        name: discipline.name,
        domain_id: Number(discipline.domain_id) // Convert back to number for database
      } as DisciplineInsert)
    )
    
    await Promise.all(promises)
  }

  return (
    <AddBulkNomenclatorDialog
      open={open}
      onOpenChange={onOpenChange}
      onAddItems={handleAddDisciplines}
      title="Adaugă discipline în platformă"
      description="Adaugă mai multe discipline în platformă prin încărcarea unui fișier CSV sau prin introducerea manuală a datelor."
      columns={[
        { id: "name", name: "Nume", type: "string", required: true },
        { id: "domain_id", name: "Domeniu", type: "select", required: true, options: domainOptions }
      ]}
    />
  )
}
