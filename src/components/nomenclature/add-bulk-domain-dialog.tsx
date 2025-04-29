"use client"

import { useDomainsController, DomainInsert } from "@/hooks/use-controllers"
import { AddBulkNomenclatorDialog } from "./add-bulk-nomenclator-dialog"

interface AddBulkDomainDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddBulkDomainDialog({ open, onOpenChange }: AddBulkDomainDialogProps) {
  const controller = useDomainsController()

  const handleAddDomains = async (domains: any[]) => {
    // Process each domain and create it
    const promises = domains.map(domain => 
      controller.create({
        name: domain.name,
        description: domain.description || null
      } as DomainInsert)
    )
    
    await Promise.all(promises)
  }

  return (
    <AddBulkNomenclatorDialog
      open={open}
      onOpenChange={onOpenChange}
      onAddItems={handleAddDomains}
      title="Adaugă domenii în platformă"
      description="Adaugă mai multe domenii în platformă prin încărcarea unui fișier CSV sau prin introducerea manuală a datelor."
      columns={[
        { id: "name", name: "Nume", type: "string", required: true },
        { id: "description", name: "Descriere", type: "string", required: false }
      ]}
    />
  )
}
