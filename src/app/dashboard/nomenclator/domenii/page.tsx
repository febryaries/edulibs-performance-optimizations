"use client"

import { useState, useMemo } from "react"
import { DataTable, type Filter } from "@/components/ui/data-table/data-table"
import { type ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ro } from "date-fns/locale"
import { useDomainsCrud, Domain, useDomainsController } from "@/hooks/use-controllers"
import { Button } from "@/components/ui/button"
import { PlusCircle, Upload, Edit } from "lucide-react"
import { AddBulkDomainDialog } from "@/components/nomenclature/add-bulk-domain-dialog"
import { Sheet, SheetContent } from "@/components/ui/sheet-fullscreen"
import { DomainForm } from "@/components/nomenclature/domains/domain-form"
import { toast } from "sonner"
import { type DomainFormValues } from "@/schemas/domain-schema"

// Define the form state interface
interface FormState {
  isOpen: boolean
  isFullScreen: boolean
  isEditMode: boolean
  domain: Domain | null
}

export default function DomeniiPage() {
  // Get controllers
  const { useList: useDomains } = useDomainsCrud()
  const domainsController = useDomainsController()
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)
  
  // Form state
  const [formState, setFormState] = useState<FormState>({
    isOpen: false,
    isFullScreen: false,
    isEditMode: false,
    domain: null,
  })

  // Define columns
  const columns = useMemo<ColumnDef<Domain, any>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nume",
        cell: ({ row }) => <div>{row.getValue("name")}</div>,
      },
      {
        accessorKey: "updated_at",
        header: "Data",
        cell: ({ row }) => (
          <div>
            {row.original?.updated_at
              ? format(new Date(row.original.updated_at), "dd MMMM yyyy", { locale: ro })
              : "-"}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Acțiuni",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(row.original)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  // Define filters
  const filters = useMemo<Filter[]>(
    () => [
      {
        id: "updated_at",
        label: "Data",
        type: "date",
        queryColumn: "updated_at",
      },
    ],
    []
  )

  // Handle opening the form for creating a new domain
  const handleCreate = () => {
    setFormState({
      isOpen: true,
      isFullScreen: false,
      isEditMode: false,
      domain: null,
    })
  }

  // Handle opening the form for editing an existing domain
  const handleEdit = (domain: Domain) => {
    setFormState({
      isOpen: true,
      isFullScreen: false,
      isEditMode: true,
      domain,
    })
  }

  // Handle closing the form
  const handleFormClose = () => {
    setFormState((prev) => ({
      ...prev,
      isOpen: false,
    }))
  }

  // Handle toggling fullscreen mode
  const handleToggleFullScreen = () => {
    setFormState((prev) => ({
      ...prev,
      isFullScreen: !prev.isFullScreen,
    }))
  }

  // Handle saving a domain
  const handleSave = async (data: DomainFormValues) => {
    try {
      if (formState.isEditMode && formState.domain) {
        // Update existing domain
        await domainsController.update(formState.domain.id, data)
        toast.success("Domeniul a fost actualizat cu succes")
      } else {
        // Create new domain
        await domainsController.create(data)
        toast.success("Domeniul a fost creat cu succes")
      }
      // Close the form
      handleFormClose()
    } catch (error) {
      console.error("Error saving domain:", error)
      toast.error("A apărut o eroare la salvarea domeniului")
    }
  }

  // Handle deleting a domain
  const handleDelete = async (id: number) => {
    try {
      await domainsController.delete(id)
      toast.success("Domeniul a fost șters cu succes")
      handleFormClose()
    } catch (error) {
      console.error("Error deleting domain:", error)
      toast.error("A apărut o eroare la ștergerea domeniului")
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Domenii</h1>
        <div className="flex items-center gap-2">
          <Button
            className="flex items-center gap-1"
            onClick={handleCreate}
          >
            <PlusCircle className="h-4 w-4" />
            Adaugă domeniu
          </Button>
          <Button
            className="flex items-center gap-1"
            variant="outline"
            onClick={() => setBulkUploadOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Adaugă în masă
          </Button>
        </div>
      </div>
      <div className="mt-6">
        <DataTable
          columns={columns}
          useQueryHook={useDomains}
          useController={useDomainsController}
          filters={filters}
          searchColumns={["name"]}
          refetchKey="domains-table"
        />
      </div>
      
      {/* Domain Form Sheet */}
      <Sheet
        open={formState.isOpen}
        onOpenChange={(open) => {
          if (!open) handleFormClose()
        }}
      >
        <SheetContent
          side="right"
          className="p-0 overflow-hidden"
          fullScreen={formState.isFullScreen}
          title="Formular Domeniu"
        >
          <DomainForm
            onClose={handleFormClose}
            onSave={handleSave}
            onDelete={handleDelete}
            onToggleFullScreen={handleToggleFullScreen}
            isFullScreen={formState.isFullScreen}
            isEditMode={formState.isEditMode}
            domain={formState.domain}
            initialData={formState.isEditMode ? undefined : { name: "Domeniu Nou" }}
          />
        </SheetContent>
      </Sheet>
      
      {/* <AddBulkDomainDialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen} /> */}
    </>
  )
}
