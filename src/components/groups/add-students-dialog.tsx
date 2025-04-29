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

interface AddStudentsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    groupId: string
}


const studentsFormSchema = z.object({
    users: z.array(z.object({
        id: z.string(),
        first_name: z.string().nullable(),
        last_name: z.string().nullable(),
        email: z.string().nullable(),
    })).optional(),
})

type StudentsFormValues = z.infer<typeof studentsFormSchema>

export function AddStudentsDialog({ open, onOpenChange, groupId }: AddStudentsDialogProps) {

    const { user } = useAuth()
    const { useCreate: createGroup } = useGroupsCrud()
    const { useCreate: createGroupMember } = useGroupMembersCrud()

    const [isLoading, setIsLoading] = useState(false)


    const form = useForm<StudentsFormValues>({
        resolver: zodResolver(studentsFormSchema),
        defaultValues: {
            users: [],
        },
    })

    useEffect(() => {
        console.log("[LOG] USERS", form.watch('users'))
    }, [form.watch('users')])

    const onSubmit = (values: StudentsFormValues) => {
        if (!user || !groupId) return

        setIsLoading(true)

        // Add selected users to the group
        if (values.users && values.users.length > 0) {
            // Create group members for each selected user
            values.users.forEach((selectedUser: { id: string }) => {
                createGroupMember.mutateAsync({
                    group_id: groupId,
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
    }

    return (
        <Dialog open={open} onOpenChange={() => { form.reset(); onOpenChange(false); }}>
            <DialogContent className="sm:max-w-md bg-white rounded-md rounded-lg">
                <DialogHeader>
                    <DialogTitle>Adaugă cursanți în grupă</DialogTitle>
                    <DialogDescription>
                        Selectează cursanții pe care dorești să-i adaugi în grupă.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="users"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Membri</FormLabel>
                                    <FormControl>
                                        <MultiSelectUser
                                            value={field.value || []}
                                            filters={[
                                                {
                                                    column: 'role',
                                                    operator: 'eq',
                                                    value: 'STUDENT',
                                                }
                                            ]}
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
                                onClick={() => { form.reset(); onOpenChange(false); }}
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
