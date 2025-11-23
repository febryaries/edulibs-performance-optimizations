"use client";

import type React from "react";
import { useState } from "react";

import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { HeaderLink } from "@/components/ui/header-link";
import Image from "next/image";
import Link from "next/link";
import useMenu from "@/hooks/use-menu";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { menuItems } = useMenu();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileMenuToggle = (isOpen: boolean) => {
    setMobileMenuOpen(isOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };
  return (
    <div className="min-h-screen flex flex-col bg-lightest dark:bg-lightest">
      {/* Header */}
      <Header
        logo={
          <Link href="/dashboard">
            <Image src="/logo.svg" alt="EduApps Logo" width={112} height={32} />
          </Link>
        }
        notificationCount={7}
        userInitials="LR"
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuToggle={handleMobileMenuToggle}
        mobileMenuContent={
          <div className="flex flex-col space-y-2">
            {menuItems.map((item) => (
              <HeaderLink
                key={item.key}
                href={item.href}
                active={item.active}
                icon={item.icon}
                count={item.count}
                className="w-full"
                onLinkClick={closeMobileMenu}
              >
                {item.label}
              </HeaderLink>
            ))}
          </div>
        }
      >
        <div className="hidden md:flex items-center space-x-1">
          {menuItems.map((item) => (
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
        </div>
      </Header>

      {/* Main content */}
      <div className="flex flex-1 relative z-10">
        {/* Page content */}
        <main className="flex-1 p-0 md:p-6 w-full max-w-full">{children}</main>
      </div>

      {/* Footer */}
      <Footer
        variant="admin"
        copyrightYear={2025}
        companyName="EDUAPPS"
        navItems={[
          {
            href: `mailto:${
              process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@eduapps.com"
            }`,
            label: "Contact",
          },
          {
            href: "/terms",
            label: "Terms",
          },
          {
            href: "/privacy",
            label: "Privacy",
          },
        ]}
      />
    </div>
  );
}
