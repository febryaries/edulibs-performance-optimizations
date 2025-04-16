"use client";

import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { HeaderLink } from "@/components/ui/header-link";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Settings, Users, BookOpenCheck, Layers } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const { user } = useAuth();

  // RBAC header logic
  const role = user?.user_metadata?.role || user?.role;

  console.log("ROLE", role);
  // Accept both possible locations for role, fallback to STUDENT
  const normalizedRole = (role || "STUDENT").toUpperCase();

  // Define menu config for each role
  const menuConfig = {
    STUDENT: ["RESURSE", "SETARI"],
    EVALUATOR: ["RESURSE", "SETARI"],
    FORMATOR: ["RESURSE", "GRUPE", "SETARI"],
    MODERATOR: ["RESURSE", "UTILIZATORI", "SETARI"],
    ADMINISTRATOR: ["RESURSE", "GRUPE", "UTILIZATORI", "SETARI"],
  };

  // Map menu keys to header definitions
  const menuItems = [
    {
      key: "RESURSE",
      label: "Resurse",
      href: "/dashboard",
      icon: BookOpen,
      count: 27,
      active: pathname.endsWith("/dashboard"),
    },
    {
      key: "GRUPE",
      label: "Grupe",
      href: "/dashboard/grupe",
      icon: Layers,
      active: pathname.includes("/grupe"),
    },
    {
      key: "UTILIZATORI",
      label: "Utilizatori",
      href: "/dashboard/utilizatori",
      icon: Users,
      active: pathname.includes("/utilizatori"),
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
  const filteredMenuItems = menuItems.filter((item) => allowedMenuKeys.includes(item.key));

  return (
    <div className="min-h-screen flex flex-col bg-lightest dark:bg-lightest">
      {/* Header */}
      <Header 
        logo={<Link href="/dashboard"><Image src="/logo.svg" alt="EduApps Logo" width={112} height={32} /></Link>}
        notificationCount={7}
        userInitials="LR"
      >
        {filteredMenuItems.map((item) => (
          <HeaderLink
            key={item.key}
            href={item.href}
            active={item.active}
            icon={item.icon}
            count={item.count}
          >
            {item.label}
          </HeaderLink>
        ))}
      </Header>

      {/* Main content */}
      <div className="flex flex-1">
        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      {/* Footer */}
      <Footer 
        variant="admin"
        copyrightYear={2025}
        companyName="EDUAPPS"
        navItems={[
          {
            href: "/contact",
            label: "Contact",
          },
          {
            href: "/terms",
            label: "Terms",
          },
          {
            href: "/privacy",
            label: "Privacy",
          }
        ]}
      />
    </div>
  );
}
