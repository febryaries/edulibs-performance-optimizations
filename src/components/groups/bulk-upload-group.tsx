// src/components/groups/bulk-upload-groups-dialog.tsx
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
import { useAuth } from "@/lib/auth-context"
import { useGroupsCrud, useUsersController } from "@/hooks/use-controllers"

interface BulkUploadGroupsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function BulkUploadGroupsDialog({ open, onOpenChange }: BulkUploadGroupsDialogProps) {
    const { user } = useAuth()
    const { useCreate: createGroup } = useGroupsCrud()
    const [isLoading, setIsLoading] = useState(false)
    const controller = useUsersController();

    
    // Define columns for the bulk upload component
    const columns: ColumnConfig[] = [
        {
            id: "name",
            name: "Nume Grupă",
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
            id: "created_by",
            name: "Email Mentor",
            type: "email",
            required: true,
        },
    ]

    const handleSubmit = async (data: any[]) => {
        if (!user) return

        setIsLoading(true);
        let increment = 0;
        try {
            // Create each group from the bulk data
            for (const group of data) {
                // If created_by is an email, we need to find the corresponding user ID
                let ownerId = user.id; // Default to current user
                
                if (group.created_by) {
                    try {
                        // Get the user by email to get their ID
                        const formator = await controller.findOneByFilter({filters: [{
                            column: "email",
                            operator: "eq",
                            value: group.created_by
                        }]});
                        
                        if (formator) {
                            ownerId = formator.id;
                        }

                        await createGroup.mutateAsync({
                            name: group.name,
                            description: group.description || null,
                            created_by: ownerId, // Use the resolved owner ID
                        })

                        increment++;
                    } catch (error: any) {
                        console.error("Error finding user by email:", error);
                        // Continue with default user ID if there's an error
                        toast({
                            title: "Eroare",
                            description: `A apărut o eroare la crearea grupului: ${error.message}`,
                            variant: "destructive",
                        })
                    }
                }  
            }
            toast({
                title: "Grupe create cu succes",
                description: `${increment} grupe au fost create cu succes.`,
            })
            onOpenChange(false)
        } catch (error: any) {
            toast({
                title: "Eroare",
                description: `A apărut o eroare la crearea grupelor: ${error.message}`,
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
                    <DialogTitle>Încarcă grupe în bulk</DialogTitle>
                    <DialogDescription>
                        Adaugă mai multe grupe simultan. Poți copia și lipi date din Excel sau alte surse.
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