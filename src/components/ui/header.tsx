"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Notification } from "@/components/ui/notification";
import { Separator } from "@/components/ui/separator";
import { UserPopover } from "@/components/ui/user-popover";

const headerVariants = cva("w-full shadow-xs bg-white sticky top-0 z-30", {
  variants: {
    variant: {
      default: "",
      transparent: "bg-transparent border-transparent",
      colored: "bg-bg-primary border-transparent",
    },
    size: {
      sm: "h-14",
      md: "h-16",
      lg: "h-20",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

export interface HeaderProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof headerVariants> {
  logo?: React.ReactNode;
  showMobileMenu?: boolean;
  mobileMenuOpen?: boolean;
  onMobileMenuToggle?: (isOpen: boolean) => void;
  notificationCount?: number;
  onNotificationClick?: () => void;
  userInitials?: string;
  avatarColor?: string;
  mobileMenuContent?: React.ReactNode;
  children?: React.ReactNode;
}

export function Header({
  className,
  variant,
  size,
  logo,
  showMobileMenu = true,
  mobileMenuOpen: controlledMobileMenuOpen,
  onMobileMenuToggle,
  notificationCount,
  onNotificationClick,
  userInitials = "AB",
  avatarColor = "#4F7FFF",
  mobileMenuContent,
  children,
  ...props
}: HeaderProps) {
  const [internalMobileMenuOpen, setInternalMobileMenuOpen] =
    React.useState(false);

  // Use controlled state if provided, otherwise use internal state
  const mobileMenuOpen =
    controlledMobileMenuOpen !== undefined
      ? controlledMobileMenuOpen
      : internalMobileMenuOpen;

  const toggleMobileMenu = () => {
    const newState = !mobileMenuOpen;
    if (controlledMobileMenuOpen === undefined) {
      setInternalMobileMenuOpen(newState);
    }
    onMobileMenuToggle?.(newState);
  };

  // Determine notification size based on header size
  const notificationSize = size === "lg" ? "lg" : size === "md" ? "md" : "sm";

  return (
    <header
      className={cn(headerVariants({ variant, size }), className)}
      {...props}
    >
      <div className="h-full flex items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Left side - Logo and hamburger menu */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile menu toggle - only visible on smaller screens */}
          {showMobileMenu && (
            <Button
              variant="ghost"
              size="sm"
              className="p-0 md:hidden"
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <Menu className="h-6 w-6 text-gray-600" />
            </Button>
          )}

          {/* Logo */}
          {logo && (
            <div className="flex-shrink-0 text-[#4F7FFF] font-bold text-xl">
              {logo}
            </div>
          )}

          <Separator
            orientation="vertical"
            className="hidden md:block mx-4 h-8"
          />

          {/* Children - for custom content like navigation */}
          {children}
        </div>

        {/* Right side - Notifications and Avatar */}
        <div className="flex items-center gap-3">
          {/* Notification component */}
          {/* {notificationCount !== undefined && (
            <button
              className="relative hidden md:flex items-center justify-center focus:outline-none"
              onClick={onNotificationClick}
              aria-label={`${notificationCount} notifications`}
            >
              <Notification count={notificationCount} size={notificationSize} countBgColor="#4F7FFF" />
            </button>
          )} */}

          {/* User Avatar */}
          <UserPopover />
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && showMobileMenu && (
        <div className="absolute top-full left-0 right-0 z-40 md:hidden bg-white border-t border-border-default shadow-md">
          <div className="px-4 py-4">{mobileMenuContent}</div>
        </div>
      )}
    </header>
  );
}

export function HeaderLogo({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("font-bold text-xl text-[#4F7FFF]", className)}
      {...props}
    />
  );
}

export function HeaderNavItem({
  className,
  active,
  children,
  href,
  ...props
}: React.HTMLAttributes<HTMLAnchorElement> & {
  active?: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-radius-03 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        active ? "text-text-accent" : "text-text-default hover:bg-bg-light",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
