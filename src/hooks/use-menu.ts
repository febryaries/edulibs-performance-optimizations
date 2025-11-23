"use client";

import {
  BookMarked,
  BookOpen,
  Layers,
  Settings,
  Users,
  BarChart3,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useStatsCounts } from "./use-stats-counts";

export default function useMenu() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const normalizedRole = (profile?.role || "STUDENT").toUpperCase();

  // Folosim un singur API call pentru toate count-urile
  const { data: counts } = useStatsCounts();
  // Define menu config for each role
  const menuConfig: Record<string, string[]> = {
    STUDENT: ["RESURSE", "SETARI"],
    EVALUATOR: ["RESURSE", "SETARI"],
    FORMATOR: ["RESURSE", "GRUPE", "SETARI"],
    MODERATOR: ["RESURSE", "UTILIZATORI", "SETARI"],
    ADMINISTRATOR: [
      "RESURSE",
      "GRUPE",
      "UTILIZATORI",
      "NOMENCLATOR",
      "STATISTICI",
      "SETARI",
    ],
  };

  // Map menu keys to header definitions
  const menuItems = [
    {
      key: "RESURSE",
      label: "Resurse",
      href: "/dashboard",
      icon: BookOpen,
      count: counts?.resources || 0,
      active: pathname.endsWith("/dashboard"),
    },
    {
      key: "GRUPE",
      label: "Grupe",
      href: "/dashboard/grupe",
      icon: Layers,
      count: counts?.groups || 0,
      active: pathname.includes("/grupe"),
    },
    {
      key: "UTILIZATORI",
      label: "Utilizatori",
      href: "/dashboard/utilizatori",
      icon: Users,
      count: counts?.users || 0,
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
      key: "STATISTICI",
      label: "Statistici",
      href: "/dashboard/statistici",
      icon: BarChart3,
      active: pathname.includes("/statistici"),
    },
    {
      key: "SETARI",
      label: "Setări",
      href: "/dashboard/setari",
      icon: Settings,
      active: pathname.includes("/setari"),
    },
  ];

  // Get allowed menu keys for current role
  const allowedMenuKeys = menuConfig[normalizedRole] || menuConfig["STUDENT"];
  // console.log(normalizedRole, allowedMenuKeys)
  const filteredMenuItems = menuItems.filter((item) =>
    allowedMenuKeys.includes(item.key)
  );

  return {
    menuItems: filteredMenuItems,
    allowedMenuKeys,
  };
}
