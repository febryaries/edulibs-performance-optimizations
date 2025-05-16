// src/components/groups/bulk-upload-members-dialog.tsx
"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "../ui/use-toast"
import { useState } from "react"
import BulkUpload, { ColumnConfig } from "../ui/bulk-upload"
import { useAuth } from "@/lib/auth-context"
import { useGroupMembersController, useGroupMembersCrud, useGroupsController, useUsersController } from "@/hooks/use-controllers"

interface BulkUploadMembersDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    groupId: string
}

export function BulkUploadMembersDialog({ open, onOpenChange, groupId }: BulkUploadMembersDialogProps) {
    const { user } = useAuth()
    const { useCreate: createGroupMember } = useGroupMembersCrud()
    const usersController = useUsersController();
    const groupsController = useGroupsController();
    const groupMembersController = useGroupMembersController();
    const [isLoading, setIsLoading] = useState(false)

    // Define columns for the bulk upload component
    const columns: ColumnConfig[] = [
        {
            id: "group_name", name: "Nume Grupă", type: "string", required: true
        },
        { id: "email", name: "Email", type: "email", required: true },
        {
            id: "role",
            name: "Rol",
            type: "select",
            required: true,
            options: [
                { value: "MEMBER", label: "Membru" },
                { value: "ADMIN", label: "Admin" },
            ],
        },
    ]

    const handleSubmit = async (data: any[]) => {
        if (!user) return;
        setIsLoading(true);
    
        try {
            // Step 1: Deduplicate emails and group names
            const uniqueEmails = [...new Set(data.map(d => d.email))];
            const uniqueGroups = [...new Set(data.map(d => d.group_name))];
    
            // Step 2: Parallel user lookups
            const userLookups = await Promise.all(
                uniqueEmails.map(email =>
                    usersController.findOneByFilter({
                        filters: [{ column: "email", operator: "eq", value: email }]
                    }).then(user => ({ email, user })).catch(() => ({ email, user: null }))
                )
            );
            const userMap = new Map(userLookups.map(({ email, user }) => [email, user?.id || ""]));
    
            // Step 3: Parallel group lookups
            const groupLookups = await Promise.all(
                uniqueGroups.map(groupName =>
                    groupsController.findOneByFilter({
                        filters: [{ column: "name", operator: "eq", value: groupName }]
                    }).then(group => ({ groupName, group })).catch(() => ({ groupName, group: null }))
                )
            );
            const groupMap = new Map(groupLookups.map(({ groupName, group }) => [groupName, group?.id || ""]));
    
            // Step 4: Serial processing to avoid rate limiting and check for existing group member
            for (const member of data) {
                const userId = userMap.get(member.email);
                const groupId = groupMap.get(member.group_name);
                const role = member.role || "MEMBER";
    
                if (!userId || !groupId) {
                    console.warn(`Skipping member: Missing user or group for ${member.email}`);
                    continue;
                }
    
                try {
                    // Check if the user is already in the group
                    const existing = await groupMembersController.findOneByFilter({
                        filters: [
                            { column: "user_id", operator: "eq", value: userId },
                            { column: "group_id", operator: "eq", value: groupId }
                        ]
                    });
    
                    if (existing) {
                        console.info(`Skipping ${member.email}: already a group member.`);
                        continue;
                    }
    
                    // Create group member
                    await createGroupMember.mutateAsync({
                        group_id: groupId,
                        user_id: userId,
                        role,
                    });
    
                } catch (err) {
                    console.error(`Error creating group member for ${member.email}:`, err);
                }
            }
    
            toast({
                title: "Membri adăugați cu succes",
                description: `${data.length} membri au fost procesați.`,
            });
            onOpenChange(false);
        } catch (error: any) {
            toast({
                title: "Eroare",
                description: `A apărut o eroare la adăugarea membrilor: ${error.message}`,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl bg-white rounded-md rounded-lg">
                <DialogHeader>
                    <DialogTitle>Adaugă membri în bulk</DialogTitle>
                    <DialogDescription>
                        Adaugă mai mulți membri simultan în grupă. Poți copia și lipi date din Excel sau alte surse.
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