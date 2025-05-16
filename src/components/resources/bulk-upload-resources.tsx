// src/components/resources/bulk-upload-resources.tsx
"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "../ui/use-toast"
import { useState } from "react"
import BulkUpload, { ColumnConfig } from "../ui/bulk-upload"
import { ResourceFormValues } from "@/schemas/resource-schema"
import { Resource, useResourcesCrud, useUsersController } from "@/hooks/use-controllers"
import { useAuth } from "@/lib/auth-context"
import { Database } from "@/utils/database.types"

interface BulkUploadResourcesDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function BulkUploadResourcesDialog({ open, onOpenChange }: BulkUploadResourcesDialogProps) {
    const { user } = useAuth()
    const { useCreate: createResource } = useResourcesCrud()
    const [isLoading, setIsLoading] = useState(false)
    const usersController = useUsersController();

    // Define columns for the bulk upload component
    const columns: ColumnConfig[] = [
        {
            id: "title",
            name: "Titlu",
            type: "string",
            required: true,
        },
        {
            id: "description",
            name: "Descriere",
            type: "string",
            required: false,
        },
        {
            id: "discipline_id",
            name: "ID Disciplină",
            type: "number",
            required: true,
        },
        {
            id: "class_id",
            name: "ID Clasă",
            type: "number",
            required: true,
        },
        {
            id: "specific_competency_id",
            name: "ID Competență Specifică",
            type: "number",
            required: true,
        },
        {
            id: "specific_competence_text",
            name: "Text Competență Specifică",
            type: "string",
            required: false,
        },
        {
            id: "durata",
            name: "Durată",
            type: "string",
            required: false,
        },
        {
            id: "link",
            name: "Link",
            type: "string",
            required: false,
        },
        {
            id: "owner_email",
            name: "Email Proprietar",
            type: "email",
            required: true,
        },
    ]

    const handleSubmit = async (data: any[]) => {
        if (!user) return

        setIsLoading(true);
        let successCount = 0;
        let errorCount = 0;
        
        try {
            // Create each resource from the bulk data
            for (const resource of data) {
                try {
                    // Get the user by email to get their ID
                    let ownerId = user.id; // Default to current user
                    
                    if (resource.owner_email) {
                        const owner = await usersController.findOneByFilter({
                            filters: [{
                                column: "email",
                                operator: "eq",
                                value: resource.owner_email
                            }]
                        });
                        
                        if (owner) {
                            ownerId = owner.id;
                        } else {
                            throw new Error(`Utilizatorul cu email-ul ${resource.owner_email} nu a fost găsit`);
                        }
                    }

                    // Map form data to resource data
                    const resourceData = {
                        title: resource.title,
                        discipline_id: resource.discipline_id ? Number(resource.discipline_id) : null,
                        class_id: resource.class_id ? Number(resource.class_id) : null,
                        specific_competency_id: resource.specific_competency_id ? Number(resource.specific_competency_id) : null,
                        status: "DRAFT" as Database["public"]["Enums"]["resource_status"], // Default status for bulk uploaded resources
                        mentor_id: null, // Can be set later
                        evaluator_id: null, // Can be set later
                        description: resource.description || null,
                        specific_competence_text: resource.specific_competence_text || null,
                        link: resource.link || null,
                        durata: resource.durata || null,
                        comentarii: null,
                        aggregate: null,
                        user_id: ownerId,
                        author_id: ownerId,
                        is_public: false,
                    }

                    await createResource.mutateAsync(resourceData);
                    successCount++;
                } catch (error: any) {
                    console.error("Error creating resource:", error);
                    errorCount++;
                }
            }

            if (successCount > 0) {
                toast({
                    title: "Resurse create cu succes",
                    description: `${successCount} resurse au fost create cu succes.${errorCount > 0 ? ` ${errorCount} resurse nu au putut fi create.` : ''}`
                })
            } else {
                toast({
                    title: "Eroare",
                    description: "Nu s-a putut crea nicio resursă.",
                    variant: "destructive",
                })
            }
            
            onOpenChange(false)
        } catch (error: any) {
            toast({
                title: "Eroare",
                description: `A apărut o eroare la crearea resurselor: ${error.message}`,
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl bg-white rounded-md rounded-lg">
                <DialogHeader>
                    <DialogTitle>Încarcă resurse în bulk</DialogTitle>
                    <DialogDescription>
                        Adaugă mai multe resurse simultan. Poți copia și lipi date din Excel sau alte surse.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <BulkUpload
                        columns={columns}
                        onSubmit={handleSubmit}
                        onCancel={() => onOpenChange(false)}
                        isLoading={isLoading}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
