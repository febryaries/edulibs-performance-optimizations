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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { MultiSelectUser } from "../ui/form/multi-select-user"
import { Profile, useGroupMembersCrud, useGroupsCrud } from "@/hooks/use-controllers"
import { useAuth } from "@/lib/auth-context"
import { toast } from "../ui/use-toast"
import { useEffect, useState } from "react"

interface AddGroupDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}


const groupFormSchema = z.object({
    name: z.string().min(1, "Numele grupei este obligatoriu"),
    description: z.string().optional(),
    users: z.array(z.object({
        id: z.string(),
        first_name: z.string().nullable(),
        last_name: z.string().nullable(),
        email: z.string().nullable(),
    })).optional(),
})

type GroupFormValues = z.infer<typeof groupFormSchema>

export function AddGroupDialog({ open, onOpenChange }: AddGroupDialogProps) {

    const { user } = useAuth()
    const { useCreate: createGroup } = useGroupsCrud()
    const { useCreate: createGroupMember } = useGroupMembersCrud()

    const [isLoading, setIsLoading] = useState(false)


    const form = useForm<GroupFormValues>({
        resolver: zodResolver(groupFormSchema),
        defaultValues: {
            name: "",
            description: "",
            users: [],
        },
    })

    useEffect(() => {
        console.log("[LOG] USERS", form.watch('users'))
    },[form.watch('users')])

    const onSubmit = (values: GroupFormValues) => {
        if (!user) return

        setIsLoading(true)
        createGroup.mutateAsync({
            name: values.name,
            description: values.description || null,
            created_by: user.id,
        }, {
            onSuccess: (newGroup) => {
                // Add selected users to the group
                if (values.users && values.users.length > 0) {
                    // Create group members for each selected user
                    values.users.forEach((selectedUser: { id: string }) => {
                        createGroupMember.mutateAsync({
                            group_id: newGroup.id,
                            user_id: selectedUser.id,
                            role: "MEMBER",
                        })
                    })
                }

                toast({
                    title: "Grupă creată cu succes",
                    description: "Grupa a fost creată cu succes.",
                })
                onOpenChange(false)
                form.reset()
                setIsLoading(false)
            },
            onError: (error: Error) => {
                toast({
                    title: "Eroare",
                    description: `A apărut o eroare la crearea grupei: ${error.message}`,
                    variant: "destructive",
                })
                setIsLoading(false)
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={() => { form.reset();onOpenChange(false);}}>
            <DialogContent className="sm:max-w-md bg-white rounded-md rounded-lg">
                <DialogHeader>
                    <DialogTitle>Creează o grupă nouă</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nume</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Numele grupei" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descriere</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Descrierea grupei"
                                            className="min-h-[100px]"
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="users"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Membri</FormLabel>
                                    <FormControl>
                                        <MultiSelectUser
                                            value={field.value || []}
                                            filters={[{
                                                column: 'role',
                                                operator: 'eq',
                                                value: 'STUDENT',
                                            }]}
                                            onChange={field.onChange}
                                            placeholder="Selectează membrii grupei"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => { form.reset();onOpenChange(false);} }
                            >
                                Anulează
                            </Button>
                            <Button type="submit"
                                disabled={isLoading}
                                onClick={form.handleSubmit(onSubmit)}
                            >
                                {isLoading ? "Se creează..." : "Creează"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
