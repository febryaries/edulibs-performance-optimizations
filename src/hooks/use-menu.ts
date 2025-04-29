import { BookMarked, BookOpen, Layers, Settings, Users } from "lucide-react";
import { usePathname } from "next/navigation";
import { useGroupsCrud, useResourcesCrud, useUsersCrud } from "./use-controllers";
import { useAuth } from "@/lib/auth-context";

export default function useMenu() {
    const pathname = usePathname();
     const { profile } = useAuth()
    const normalizedRole = (profile?.role || "STUDENT").toUpperCase()

    const { useCount: useResourcesCount } = useResourcesCrud()
    const { useCount: useGroupsCount } = useGroupsCrud()
    const { useCount: useUsersCount } = useUsersCrud()

    const resources = useResourcesCount()
    const groups = useGroupsCount()
    const users = useUsersCount()
    // Define menu config for each role
    const menuConfig: Record<string, string[]> = {
        STUDENT: ["RESURSE", "SETARI"],
        EVALUATOR: ["RESURSE", "SETARI"],
        FORMATOR: ["RESURSE", "GRUPE", "SETARI"],
        MODERATOR: ["RESURSE", "UTILIZATORI", "SETARI"],
        ADMINISTRATOR: ["RESURSE", "GRUPE", "UTILIZATORI", "NOMENCLATOR", "SETARI"],
    }

    // Map menu keys to header definitions
    const menuItems = [
        {
            key: "RESURSE",
            label: "Resurse",
            href: "/dashboard",
            icon: BookOpen,
            count: resources.data || 0,
            active: pathname.endsWith("/dashboard"),
        },
        {
            key: "GRUPE",
            label: "Grupe",
            href: "/dashboard/grupe",
            icon: Layers,
            count: groups.data || 0,
            active: pathname.includes("/grupe"),
        },
        {
            key: "UTILIZATORI",
            label: "Utilizatori",
            href: "/dashboard/utilizatori",
            icon: Users,
            count: users.data || 0,
            active: pathname.includes("/utilizatori"),
        },
        {
            key: "NOMENCLATOR",
            label: "Nomenclator",
            href: "/dashboard/nomenclator/ariicurriculare",
            icon: BookMarked,
            active: pathname.includes("/nomenclator"),
        },
        {
            key: "SETARI",
            label: "Setări",
            href: "/dashboard/setari",
            icon: Settings,
            active: pathname.includes("/setari"),
        },
    ]

    // Get allowed menu keys for current role
    const allowedMenuKeys = menuConfig[normalizedRole] || menuConfig["STUDENT"]
    console.log(normalizedRole, allowedMenuKeys)
    const filteredMenuItems = menuItems.filter((item) => allowedMenuKeys.includes(item.key));


    return {
        menuItems: filteredMenuItems,
        allowedMenuKeys,
    }

}
