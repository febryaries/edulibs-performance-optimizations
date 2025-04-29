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
import { useGroupMembersCrud, useGroupsCrud } from "@/hooks/use-controllers"

interface DeleteGroupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedGroup: string | null;
}




export function DeleteGroupDialog({ open, onOpenChange, selectedGroup }: DeleteGroupDialogProps) {


    const { useDelete: deleteGroup } = useGroupsCrud()
    const { useDeleteMany: deleteGroupMembers } = useGroupMembersCrud()

    const [isLoading, setIsLoading] = useState(false)

    const confirmDeleteGroup = () => {
        if (!selectedGroup) return

        setIsLoading(true)

        deleteGroupMembers.mutateAsync(
            [
                {
                    column: 'group_id',
                    operator: 'eq',
                    value: selectedGroup
                }
            ],
            {
                onSuccess: () => {
                    deleteGroup.mutateAsync(selectedGroup, {
                        onSuccess: () => {
                            toast({
                                title: "Grupă ștearsă cu succes",
                                description: "Grupa a fost ștearsă cu succes.",
                            })
                            onOpenChange(false);
                            setIsLoading(false)
                        },
                        onError: (error) => {
                            toast({
                                title: "Eroare",
                                description: `A apărut o eroare la ștergerea grupei: ${error.message}`,
                                variant: "destructive",
                            })
                            onOpenChange(false);
                            setIsLoading(false)
                        }
                    })
                },
                onError: (error) => {
                    toast({
                        title: "Eroare",
                        description: `A apărut o eroare la ștergerea membrilor grupei: ${error.message}`,
                        variant: "destructive",
                    })
                    setIsLoading(false)
                }
            }
        )
    }


    return (
        <Dialog open={open} onOpenChange={() => { onOpenChange(false); }}>
            <DialogContent className="sm:max-w-md bg-white rounded-md rounded-lg">
                <DialogHeader>
                    <DialogTitle>Șterge grupa</DialogTitle>
                    <DialogDescription>
                        Ești sigur că vrei să ștergi această grupă? Această acțiune nu poate fi anulată.
                        Aceasta va șterge permanent grupa și toți membrii asociați.
                    </DialogDescription>
                </DialogHeader>

                <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                >
                    Anulează
                </Button>
                <Button
                    variant="destructive"
                    onClick={confirmDeleteGroup}
                    disabled={isLoading}
                >
                    {isLoading ? "Se șterge..." : "Șterge"}
                </Button>

            </DialogContent>
        </Dialog>
    )
}
